/**
 * PDF Parser Service — Client-Side (Browser)
 * 
 * Enpara banka ekstresi PDF dosyalarını tarayıcıda parse edip
 * uygulama formatına uygun Transaction[] dizisine dönüştürür.
 * 
 * parse_all.js'deki tüm parsing mantığı buraya TypeScript olarak taşınmıştır.
 * Node.js bağımlılığı yoktur — tamamen browser API'leri kullanır.
 */

// Polyfill: Math.sumPrecise henüz çoğu tarayıcıda yok, pdfjs-dist kullanıyor
if (typeof Math.sumPrecise !== 'function') {
  (Math as any).sumPrecise = function (numbers: Iterable<number>) {
    return Array.from(numbers).reduce((sum, n) => sum + n, 0);
  };
}

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Worker'a polyfill enjekte et — blob wrapper ile
const workerBlobUrl = URL.createObjectURL(
  new Blob(
    [
      `if(typeof Math.sumPrecise!=='function'){Math.sumPrecise=function(n){return Array.from(n).reduce((s,c)=>s+c,0)};}`,
      `import '${new URL(pdfjsWorkerUrl, window.location.origin).href}';`
    ],
    { type: 'text/javascript' }
  )
);
pdfjsLib.GlobalWorkerOptions.workerSrc = workerBlobUrl;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  title: string;
  amount: number;
  date: string;
  direction: 'gelen' | 'giden';
  type: string;
  category: string;
  source: string;
  description: string;
  installment?: string;
}

export interface PdfParseResult {
  fileName: string;
  transactionCount: number;
  transactions: ParsedTransaction[];
  type: 'kredi_karti' | 'vadesiz';
}

export interface PdfParseProgress {
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  status: 'extracting' | 'parsing' | 'done' | 'error';
}

// ─── Category Detection ─────────────────────────────────────────────────────

export function detectCategory(description: string, type: string): string {
  const desc = (description || '').toLowerCase();

  if (type === 'Gelen Transfer') return 'Gelen Transfer';
  if (type === 'Giden Transfer') return 'Giden Transfer';
  if (type === 'Ödeme' || desc.includes('kredi kartı ödemesi')) return 'Kredi Kartı Ödemesi';
  if (type === 'Para Yatırma') return 'Para Yatırma';
  if (type === 'Para Çekme') return 'Para Çekme';
  if (type === 'İptal/İade') return 'İptal/İade';
  if (type === 'Alış/Satış') return 'Döviz';
  if (type === 'Vergi Kesintisi' || type === 'Masraf/Ücret') return 'Vergi/Masraf';

  // Kredi kartı & Encard kategori tespiti
  if (desc.includes('trendyol - yemek') || desc.includes('yemeksepeti') || desc.includes('dominos') ||
    desc.includes('burger king') || desc.includes('pilavsor') || desc.includes('pide') ||
    desc.includes('kebap') || desc.includes('börekçi') || desc.includes('tikla gelsin') ||
    desc.includes('getir') || desc.includes('kazim büfe') || desc.includes('pilav')) return 'Yemek';
  if (desc.includes('a101') || desc.includes('bim') || desc.includes('file ') || desc.includes('migros') ||
    desc.includes('market') || desc.includes('manav') || desc.includes('süpermarket') ||
    desc.includes('kuruyemiş')) return 'Market';
  if (desc.includes('trendyol') || desc.includes('hepsiburada') || desc.includes('hepsipay') ||
    desc.includes('amazon') || desc.includes('n11') || desc.includes('dolap.com') ||
    desc.includes('defacto')) return 'Alışveriş';
  if (desc.includes('akaryakit') || desc.includes('petrol') || desc.includes('lpg') ||
    desc.includes('otogaz') || desc.includes('benzin') || desc.includes('papel') ||
    desc.includes('yurtpet') || desc.includes('selway')) return 'Akaryakıt';
  if (desc.includes('vodafone') || desc.includes('teknocell')) return 'Fatura';
  if (desc.includes('eczane') || desc.includes('eczanesi')) return 'Sağlık';
  if (desc.includes('obilet') || desc.includes('hotel') || desc.includes('otel')) return 'Seyahat';
  if (desc.includes('allianz') || desc.includes('bes')) return 'Sigorta/BES';
  if (desc.includes('motorlu taşıt') || desc.includes('mtv') || desc.includes('vergi tahsilat')) return 'Vergi';
  if (desc.includes('binance') || desc.includes('kripto')) return 'Kripto';
  if (desc.includes('apple') || desc.includes('microsoft') || desc.includes('chatgpt') ||
    desc.includes('openai') || desc.includes('epic games') || desc.includes('x corp')) return 'Dijital Abonelik';
  if (desc.includes('pet shop') || desc.includes('alfa pet')) return 'Evcil Hayvan';
  if (desc.includes('çiçek')) return 'Çiçek';
  if (desc.includes('cafe') || desc.includes('coffee') || desc.includes('pastane') ||
    desc.includes('garden')) return 'Kafe/Restoran';
  if (desc.includes('car care') || desc.includes('oto')) return 'Araç Bakım';
  if (desc.includes('kurs') || desc.includes('akademi')) return 'Eğitim';
  if (desc.includes('belediye')) return 'Belediye';
  if (desc.includes('atm')) return 'ATM';
  if (desc.includes('iade')) return 'İptal/İade';
  if (desc.includes('faiz')) return 'Faiz/BSMV';

  if (type === 'Encard Harcaması') return 'Alışveriş';
  if (type === 'Diğer') return 'Diğer';

  return 'Diğer';
}

// ─── PDF Text Extraction ─────────────────────────────────────────────────────

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Y koordinatı değişimini takip ederek satır sonlarını koru
    let lastY: number | null = null;
    let lineText = '';

    for (const item of textContent.items as any[]) {
      if (!item.str && !item.hasEOL) continue;

      const currentY = item.transform ? item.transform[5] : null;

      // Y değişimi = yeni satır (tolerans: 2px)
      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 2) {
        fullText += lineText.trim() + '\n';
        lineText = '';
      }

      lineText += item.str || '';

      // pdfjs hasEOL flag'i varsa satır sonu
      if (item.hasEOL) {
        fullText += lineText.trim() + '\n';
        lineText = '';
        lastY = null;
      } else {
        lastY = currentY;
      }
    }

    // Sayfanın son satırını ekle
    if (lineText.trim()) {
      fullText += lineText.trim() + '\n';
    }
    fullText += '\n'; // Sayfa sonu
  }

  console.log('[PDF Parser] Extracted text preview (first 500 chars):', fullText.substring(0, 500));
  console.log('[PDF Parser] Total lines:', fullText.split('\n').filter(l => l.trim()).length);

  return fullText;
}

// ─── Credit Card Statement Parser ────────────────────────────────────────────

export function parseCreditCard(text: string, fileName: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Extract ekstre date from filename: DD.MM.YYYY
  const fileDateMatch = fileName.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  // ekstreYear is available if needed
  // const ekstreYear = fileDateMatch ? parseInt(fileDateMatch[3]) : 2025;

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header/footer lines
    if (line.includes('Sayfa ') || line.includes('Enpara Bank') || line.includes('Enpara.com') ||
      line.includes('Kart sahibi') || line.includes('Kredi Kartı Ekstresi') ||
      line.includes('Ekstre tarihi') || line.includes('Ekstre borcu') ||
      line.includes('Minimum ödeme') || line.includes('Son ödeme') ||
      line.includes('Ad soyad') || line.includes('Kart numarası') ||
      line.includes('Kart limiti') || line.includes('Kullanılabilir') ||
      line.includes('önceki') || line.includes('Ödemeler') ||
      line.includes('Harcamalar ve') || line.includes('yansıyan') ||
      line.includes('Nakit avans') || line.includes('bakiye transfer') ||
      line.includes('Faiz, vergiler') || line.includes('ücretler ve') ||
      line.includes('İşlem tarihi') || line.includes('sonraki ekstre') ||
      line.includes('faiz oranı') || line.includes('faizi oranı') ||
      line.includes('Aylık') || line.includes('Yıllık') || line.includes('%') ||
      line.includes('BSMV ve KKDF') || line.includes('Güncel akdi') ||
      line.includes('ulaşabilir') || line.includes('sözleşme') ||
      line.includes('Blok 7') || line.includes('Seri-Sıra') || line.includes('Mersis') ||
      line.includes('Ticaret sicil') || line.includes('T.C. kimlik')) continue;

    // Match transaction: DD/MM/YYYY + Description + Amount
    const txMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{4})(.+?)([-]?\s*[\d.,]+ TL)$/);
    if (txMatch) {
      const day = txMatch[1];
      const month = txMatch[2];
      const year = txMatch[3];
      let description = txMatch[4].trim();
      const amountStr = txMatch[5].replace(' TL', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(amountStr);

      // Check for installment info
      const installmentInfoMatch = description.match(/\([\d.,]+ TL\)\s*$/);
      if (installmentInfoMatch) {
        description = description.replace(installmentInfoMatch[0], '').trim();
      }
      const taksitMatch = description.match(/(\d+\/\d+)\s*$/);
      let installment: string | undefined = undefined;
      if (taksitMatch) {
        installment = taksitMatch[1];
        description = description.replace(taksitMatch[0], '').trim();
      }

      // Check for (iade) refund
      const isRefund = description.includes('(iade)') || description.includes('İade');
      const isPayment = description.includes('Ödeme -');

      const date = `${year}-${month}-${day}`;
      const direction: 'gelen' | 'giden' = amount < 0 ? 'gelen' : 'giden';
      const absAmount = Math.abs(amount);

      // Clean description
      description = description.replace(/\s+/g, ' ').trim();
      description = description.replace(/\s+(İSTANBUL|ISTANBUL|KAYSERI|KARAMAN|TR|TRTR)\s*/gi, ' ').trim();

      let title = description.split(/\s{2,}/)[0] || description;
      title = title.replace(/(iade)/gi, '').trim();
      if (title.length > 60) title = title.substring(0, 57) + '...';

      const type = isPayment ? 'Ödeme' : (isRefund ? 'İade' : 'Kredi Kartı Harcaması');
      const category = isPayment ? 'Kredi Kartı Ödemesi' : (isRefund ? 'İptal/İade' : detectCategory(description, 'Kredi Kartı'));

      const tx: ParsedTransaction = {
        title,
        amount: absAmount,
        date,
        direction,
        type,
        category,
        source: 'Kredi Kartı',
        description: `${type}, ${description}`,
      };
      if (installment) tx.installment = installment;
      transactions.push(tx);
    }

    // Multi-line installment entries
    const multiLineMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{4})(.+)$/);
    if (multiLineMatch && !txMatch) {
      let fullDesc = multiLineMatch[4].trim();
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (!nextLine) continue;
        const amtMatch = nextLine.match(/^(\d+\/\d+)\s+([-]?\s*[\d.,]+ TL)$/);
        if (amtMatch) {
          const installment = amtMatch[1];
          const amtStr = amtMatch[2].replace(' TL', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
          const amount = parseFloat(amtStr);
          const direction: 'gelen' | 'giden' = amount < 0 ? 'gelen' : 'giden';
          const day = multiLineMatch[1];
          const month = multiLineMatch[2];
          const year = multiLineMatch[3];

          transactions.push({
            title: fullDesc.substring(0, 60),
            amount: Math.abs(amount),
            date: `${year}-${month}-${day}`,
            direction,
            type: 'Kredi Kartı Harcaması',
            category: detectCategory(fullDesc, 'Kredi Kartı'),
            source: 'Kredi Kartı',
            description: `Kredi Kartı Harcaması, ${fullDesc}`,
            installment,
          });
          break;
        }
        fullDesc += ' ' + nextLine;
      }
    }
  }

  // Filter out "Bir önceki ekstre bakiyeniz"
  return transactions.filter(t => !t.title.includes('Bir önceki ekstre'));
}

// ─── Vadesiz Hesap Parser ────────────────────────────────────────────────────

export function parseVadesiz(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  const MOVE_TYPES = [
    'Gelen Transfer', 'Giden Transfer', 'Ödeme',
    'Para Yatırma', 'Para Çekme', 'Diğer', 'İptal/İade', 'Alış/Satış',
    'Vergi Kesintisi', 'Masraf/Ücret'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip page headers/footers
    if (line.includes('Sayfa') || line.includes('enpara.com') || line.includes('Enpara Bank') ||
      line.includes('Büyük Mükellefler') || line.includes('e-imza') ||
      line.includes('Seri/Sıra') || line.includes('Ad soyad') ||
      line.includes('TC kimlik') || line.includes('Hesap adı') ||
      line.includes('Hesap tipi') || line.includes('IBAN') ||
      (line.includes('Hareket tipi') && line.includes(':')) ||
      line.includes('İşlem tutarı:') || line.includes('Başlangıç tarihi') ||
      line.includes('Bitiş tarihi') || line.includes('Açıklamada aranan') ||
      line.includes('TarihHareket tipi') || line.includes('Vadesiz TL') ||
      line.includes('Tümü') || line === 'Γ' || line === '62' ||
      /^\d{8}$/.test(line) || line.startsWith(':') ||
      line.includes('Bu belge') || line.includes('kodu ile')) continue;

    // Match date DD.MM.YYYY
    const dateMatch = line.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dateMatch) continue;

    const day = dateMatch[1];
    const month = dateMatch[2];
    const year = dateMatch[3];
    const date = `${year}-${month}-${day}`;
    const rest = line.substring(10).trim();

    let moveType = '';
    let description = '';
    let amount = 0;

    // Check for Encard Harcaması (multi-line)
    if (rest === '' && i + 1 < lines.length && lines[i + 1].trim() === 'Encard') {
      moveType = 'Encard Harcaması';
      i += 2;
      if (i < lines.length) {
        const descLine = lines[i].trim();
        const amtMatch = descLine.match(/(.+?)([-]?(?:\d{1,3}\.)*\d{1,3},\d{2} TL)((?:\d{1,3}\.)*\d{1,3},\d{2} TL)$/);
        if (amtMatch) {
          description = amtMatch[1].trim();
          const amtStr = amtMatch[2].replace(' TL', '').replace(/\./g, '').replace(',', '.');
          amount = parseFloat(amtStr);
        }
      }
    } else {
      // Try to find type
      for (const t of MOVE_TYPES) {
        if (rest.startsWith(t)) {
          moveType = t;
          const afterType = rest.substring(t.length).trim();

          const amtMatch = afterType.match(/(.+?)([-]?(?:\d{1,3}\.)*\d{1,3},\d{2} TL)((?:\d{1,3}\.)*\d{1,3},\d{2} TL)$/);
          if (amtMatch) {
            description = amtMatch[1].trim();
            const amtStr = amtMatch[2].replace(' TL', '').replace(/\./g, '').replace(',', '.');
            amount = parseFloat(amtStr);
          } else {
            let fullDesc = afterType;
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              const nextLine = lines[j].trim();
              if (!nextLine) continue;
              const endMatch = nextLine.match(/^(.*?)([-]?(?:\d{1,3}\.)*\d{1,3},\d{2} TL)((?:\d{1,3}\.)*\d{1,3},\d{2} TL)$/);
              if (endMatch) {
                fullDesc += ' ' + endMatch[1].trim();
                const amtStr = endMatch[2].replace(' TL', '').replace(/\./g, '').replace(',', '.');
                amount = parseFloat(amtStr);
                i = j;
                break;
              }
              fullDesc += ' ' + nextLine;
            }
            description = fullDesc.trim();
          }
          break;
        }
      }
    }

    if (!moveType) continue;
    if (amount === 0) continue;

    const absAmount = Math.abs(amount);
    // Skip obviously wrong amounts
    if (absAmount > 500000) continue;
    const direction: 'gelen' | 'giden' = amount < 0 ? 'giden' : 'gelen';

    // Generate title
    let title = description;
    const commaIdx = title.indexOf(',');
    if (commaIdx > 0 && commaIdx < 50) {
      title = title.substring(0, commaIdx).trim();
    }
    title = title.replace(/,?\s*EFT \(FAST\) sorgu no:?\s*\d+/g, '').trim();
    title = title.replace(/,?\s*Bireysel Ödeme/g, '').trim();
    title = title.replace(/,?\s*tarafından aktarılan/g, '').trim();
    title = title.replace(/^\d{6,}-/g, '').trim();
    title = title.replace(/\s+(İSTANBUL|ISTANBUL|KAYSERI|KARAMAN|TR|Kayseri)\s*/gi, ' ').trim();
    title = title.replace(/\s+Pos satış/gi, '').trim();
    if (title.length > 60) title = title.substring(0, 57) + '...';
    if (!title) title = moveType;

    const category = detectCategory(description, moveType);

    transactions.push({
      title,
      amount: absAmount,
      date,
      direction,
      type: moveType,
      category,
      source: 'Vadesiz Hesap',
      description: `${moveType}, ${description}`,
    });
  }

  return transactions;
}

// ─── Auto-detect PDF Type ────────────────────────────────────────────────────

export function detectPdfType(fileName: string, text: string): 'vadesiz' | 'kredi_karti' {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('vadesiz')) return 'vadesiz';
  if (lowerName.includes('kredi') || lowerName.includes('ekstre')) return 'kredi_karti';

  // Fallback: content-based detection
  const lowerText = text.toLowerCase();
  if (lowerText.includes('vadesiz tl') || lowerText.includes('hesap tipi')) return 'vadesiz';
  if (lowerText.includes('kredi kartı ekstresi') || lowerText.includes('ekstre borcu')) return 'kredi_karti';

  // Default to kredi kartı
  return 'kredi_karti';
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export async function parsePdfFiles(
  files: File[],
  onProgress?: (progress: PdfParseProgress) => void
): Promise<ParsedTransaction[]> {
  let allTransactions: ParsedTransaction[] = [];

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];

    onProgress?.({
      currentFile: file.name,
      currentIndex: idx,
      totalFiles: files.length,
      status: 'extracting',
    });

    try {
      const text = await extractTextFromPdf(file);

      onProgress?.({
        currentFile: file.name,
        currentIndex: idx,
        totalFiles: files.length,
        status: 'parsing',
      });

      const pdfType = detectPdfType(file.name, text);

      let transactions: ParsedTransaction[];
      if (pdfType === 'vadesiz') {
        transactions = parseVadesiz(text);
      } else {
        transactions = parseCreditCard(text, file.name);
      }

      allTransactions = allTransactions.concat(transactions);
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error);
      onProgress?.({
        currentFile: file.name,
        currentIndex: idx,
        totalFiles: files.length,
        status: 'error',
      });
    }
  }

  // Sort by date descending
  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  onProgress?.({
    currentFile: '',
    currentIndex: files.length,
    totalFiles: files.length,
    status: 'done',
  });

  return allTransactions;
}
