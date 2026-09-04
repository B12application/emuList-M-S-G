/**
 * PDF Parser Service — Client-Side (Browser)
 * 
 * Enpara banka ekstresi PDF dosyalarını tarayıcıda parse edip
 * uygulama formatına uygun Transaction[] dizisine dönüştürür.
 * 
 * parse_all.js'deki tüm parsing mantığı buraya TypeScript olarak taşınmıştır.
 * Node.js bağımlılığı yoktur — tamamen browser API'leri kullanır.
 */

// Polyfill: Math.sumPrecise henüz çoğu tarayıcıda yok, pdfjs-dist v4+ kullanıyor
declare global {
  interface Math {
    sumPrecise(numbers: Iterable<number>): number;
  }
}

if (typeof Math.sumPrecise !== 'function') {
  Math.sumPrecise = function (numbers: Iterable<number>) {
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

  // Kredi kartı & Encard & Vadesiz detaylı kategori tespiti
  if (
    desc.includes('trendyol - yemek') || desc.includes('yemeksepeti') || desc.includes('yemekpay') ||
    desc.includes('dominos') || desc.includes('burger king') || desc.includes('pilavsor') ||
    desc.includes('pide') || desc.includes('kebap') || desc.includes('börekçi') ||
    desc.includes('tikla gelsin') || desc.includes('getir') || desc.includes('kazim büfe') ||
    desc.includes('pilav') || desc.includes('döner') || desc.includes('doner') ||
    desc.includes('çorbacı') || desc.includes('corbaci') || desc.includes('köfte') ||
    desc.includes('kofte') || desc.includes('fırın') || desc.includes('firin') ||
    desc.includes('restoran') || desc.includes('lokanta') || desc.includes('lahmacun') ||
    desc.includes('uber eats')
  ) return 'Yemek';

  if (
    desc.includes('a101') || desc.includes('bim') || desc.includes('file ') || desc.includes('migros') ||
    desc.includes('market') || desc.includes('manav') || desc.includes('süpermarket') ||
    desc.includes('kuruyemiş') || desc.includes('moneypay') || desc.includes('gross') ||
    desc.includes('gıda') || desc.includes('gida') || desc.includes('tarım') ||
    desc.includes('tarim') || desc.includes('şarküteri') || desc.includes('sarkuteri') ||
    desc.includes('kasap') || desc.includes('pazar')
  ) return 'Market';

  if (
    desc.includes('trendyol') || desc.includes('hepsiburada') || desc.includes('hepsipay') ||
    desc.includes('amazon') || desc.includes('n11') || desc.includes('dolap.com') ||
    desc.includes('defacto') || desc.includes('bujiteri') || desc.includes('giyim')
  ) return 'Alışveriş';

  if (
    desc.includes('akaryakit') || desc.includes('petrol') || desc.includes('lpg') ||
    desc.includes('otogaz') || desc.includes('benzin') || desc.includes('benzenlik') ||
    desc.includes('papel') || desc.includes('yurtpet') || desc.includes('selway') ||
    desc.includes('opet') || desc.includes('shell') || desc.includes('bp ') ||
    desc.includes('total') || desc.includes('aytemiz')
  ) return 'Akaryakıt';

  if (
    desc.includes('vodafone') || desc.includes('teknocell') || desc.includes('superonline') ||
    desc.includes('turkcell') || desc.includes('türk telekom') || desc.includes('turk telekom') ||
    desc.includes('enerjisa') || desc.includes('fatura') || desc.includes('fatur') ||
    desc.includes('elektrik') || desc.includes('su ve kanal') || desc.includes('gaz')
  ) return 'Fatura';

  if (desc.includes('binbin') || desc.includes('taksi') || desc.includes('martı') || desc.includes('marti') || desc.includes('scooter') || desc.includes('uber')) return 'Ulaşım';
  if (desc.includes('eczane') || desc.includes('eczanesi') || desc.includes('hastane') || desc.includes('sağlık') || desc.includes('saglik') || desc.includes('optik')) return 'Sağlık';
  if (desc.includes('obilet') || desc.includes('hotel') || desc.includes('otel') || desc.includes('bilet') || desc.includes('thy') || desc.includes('pegasus')) return 'Seyahat';
  if (desc.includes('allianz') || desc.includes('bes') || desc.includes('sigorta')) return 'Sigorta/BES';
  if (desc.includes('motorlu taşıt') || desc.includes('mtv') || desc.includes('vergi tahsilat')) return 'Vergi';
  if (desc.includes('binance') || desc.includes('kripto') || desc.includes('btcturk')) return 'Kripto';
  if (desc.includes('apple') || desc.includes('microsoft') || desc.includes('chatgpt') ||
    desc.includes('openai') || desc.includes('epic games') || desc.includes('x corp') || desc.includes('netflix') || desc.includes('spotify') || desc.includes('youtube')) return 'Dijital Abonelik';
  if (desc.includes('pet shop') || desc.includes('alfa pet') || desc.includes('veteriner')) return 'Evcil Hayvan';
  if (desc.includes('çiçek') || desc.includes('cicek')) return 'Çiçek';
  if (desc.includes('cafe') || desc.includes('coffee') || desc.includes('coffe') || desc.includes('pastane') ||
    desc.includes('garden') || desc.includes('kahve') || desc.includes('starbucks')) return 'Kafe/Restoran';
  if (desc.includes('car care') || desc.includes('oto') || desc.includes('lastik') || desc.includes('yıkama') || desc.includes('yikama')) return 'Araç Bakım';
  if (desc.includes('kurs') || desc.includes('akademi') || desc.includes('eğitim') || desc.includes('egitim')) return 'Eğitim';
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

    // Match transaction: DD/MM/YYYY or DD/MM/YY + Description + Amount
    const txMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{2,4})(.+?)([-]?\s*[\d.,]+ TL)$/);
    if (txMatch) {
      const day = txMatch[1];
      const month = txMatch[2];
      let year = txMatch[3];
      if (year.length === 2) year = '20' + year;
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
    const multiLineMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{2,4})(.+)$/);
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
          let year = multiLineMatch[3];
          if (year.length === 2) year = '20' + year;

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
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const MOVE_TYPES = [
    'Gelen Transfer', 'Giden Transfer', 'Encard Harcaması', 'Encard', 'Ödeme',
    'Para Yatırma', 'Para Çekme', 'Diğer', 'İptal/İade', 'Alış/Satış',
    'Vergi Kesintisi', 'Masraf/Ücret'
  ];

  const parseAmount = (amtStr: string): number => {
    const clean = amtStr.replace('TL', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(clean);
  };

  // Regex matching both spaced and unspaced amounts and balances:
  // e.g. "- 589,21 TL 9.664,42 TL", "-589,21 TL", "55.001,30 TL 64.205,22 TL", "-5.500,00 TL796,18 TL"
  const amtRegex = /^(.*?)\s*([-]?\s*(?:\d{1,3}\.)*\d{1,3},\d{2}\s*TL)(?:\s*((?:[-]?\s*(?:\d{1,3}\.)*\d{1,3},\d{2}\s*TL)))?$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip page headers/footers and summary lines
    if (
      line.includes('Sayfa') || line.includes('enpara.com') || line.includes('Enpara Bank') ||
      line.includes('Büyük Mükellefler') || line.includes('e-imza') ||
      line.includes('Seri/Sıra') || line.includes('Seri / Sıra') ||
      line.includes('Ad soyad') || line.includes('TC kimlik') ||
      line.includes('Hesap adı') || line.includes('Hesap tipi') ||
      line.includes('IBAN') || line.includes('Dönem başı') || line.includes('Dönem sonu') ||
      line.includes('Ekstre dönemi') || line.includes('Tarih Açıklama Tutar Bakiye') ||
      line.includes('Vade ve faiz') || line.includes('Vadesiz TL - -') ||
      line.includes('Vadesiz USD') || line.includes('Vadesiz EUR') || line.includes('Altın - -') ||
      line.includes('eMuBirikim') || line.includes('Toplam') || line.includes('Yıllık brüt') ||
      line.includes('Bakiyelerin TL') || line.includes('hareketlerinin detayı') ||
      (line.includes('Hareket tipi') && line.includes(':')) ||
      line.includes('İşlem tutarı:') || line.includes('Başlangıç tarihi') ||
      line.includes('Bitiş tarihi') || line.includes('Açıklamada aranan') ||
      line.includes('TarihHareket tipi') || line.includes('Tümü') || line === 'Γ' || line === '62' ||
      /^\d{8}$/.test(line) || line.startsWith(':') ||
      line.includes('Bu belge') || line.includes('kodu ile')
    ) continue;

    // Match date: DD.MM.YYYY or DD/MM/YY(YY)
    const dateMatch = line.match(/^(\d{2})[./](\d{2})[./](\d{2,4})/);
    if (!dateMatch) continue;

    // Ignore date ranges (e.g. "01/08/2026 - 31/08/2026")
    if (line.match(/^\d{2}[./]\d{2}[./]\d{2,4}\s*-\s*\d{2}[./]\d{2}[./]\d{2,4}/)) continue;

    const day = dateMatch[1];
    const month = dateMatch[2];
    let year = dateMatch[3];
    if (year.length === 2) year = '20' + year;
    const date = `${year}-${month}-${day}`;

    let rest = line.substring(dateMatch[0].length).trim();
    let moveType = '';

    // Check moveType on current line
    for (const t of MOVE_TYPES) {
      if (rest.startsWith(t)) {
        moveType = t;
        rest = rest.substring(t.length).trim().replace(/^,/, '').trim();
        break;
      }
    }

    // Check if next line contains moveType (e.g. multi-line entry where date is alone on line)
    if (!moveType && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      for (const t of MOVE_TYPES) {
        if (nextLine.startsWith(t)) {
          moveType = t;
          i++; // consume next line
          rest = nextLine.substring(t.length).trim().replace(/^,/, '').trim();
          break;
        }
      }
    }

    if (!moveType) continue;
    if (moveType === 'Encard') moveType = 'Encard Harcaması';

    let description = '';
    let amount = 0;

    const match = rest.match(amtRegex);
    if (match && match[2]) {
      description = match[1].trim();
      amount = parseAmount(match[2]);
    } else {
      // Amount might be on subsequent line or description spans multiple lines
      let fullDesc = rest;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (!nextLine) continue;

        // If next line starts with a new transaction date, stop looking
        if (nextLine.match(/^(\d{2})[./](\d{2})[./](\d{2,4})/) && !nextLine.match(/^\d{2}[./]\d{2}[./]\d{2,4}\s*-\s*\d{2}[./]\d{2}[./]\d{2,4}/)) {
          break;
        }

        const nextMatch = nextLine.match(amtRegex);
        if (nextMatch && nextMatch[2]) {
          if (nextMatch[1].trim()) {
            fullDesc += ' ' + nextMatch[1].trim();
          }
          amount = parseAmount(nextMatch[2]);
          i = j; // advance loop past consumed line
          break;
        } else {
          fullDesc += ' ' + nextLine;
        }
      }
      description = fullDesc.trim();
    }

    if (description.startsWith(',')) {
      description = description.substring(1).trim();
    }

    if (!amount || isNaN(amount)) continue;

    const absAmount = Math.abs(amount);
    if (absAmount > 500000) continue;

    // In Enpara Vadesiz statement: negative number (- 589,21 TL) = outgoing expense (giden), positive = incoming money (gelen)
    const direction: 'gelen' | 'giden' = amount < 0 ? 'giden' : 'gelen';

    // Clean title
    let title = description;
    const commaIdx = title.indexOf(',');
    if (commaIdx > 0 && commaIdx < 40) {
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
  const lowerText = text.toLowerCase();
  const lowerName = fileName.toLowerCase();

  // Content-based detection (most reliable, immune to misleading filenames)
  const isCreditCardContent =
    lowerText.includes('kredi kartı ekstresi') ||
    lowerText.includes('ekstre borcu') ||
    lowerText.includes('kullanılabilir kart limiti') ||
    lowerText.includes('kart numarası') ||
    lowerText.includes('kart limiti') ||
    lowerText.includes('minimum ödeme');

  const isVadesizContent =
    lowerText.includes('vadesiz tl') ||
    lowerText.includes('dönem sonu bakiyesi') ||
    lowerText.includes('dönem başı bakiyesi') ||
    lowerText.includes('hesap adı/tipi') ||
    lowerText.includes('hesap tipi') ||
    lowerText.includes('vadesiz usd') ||
    lowerText.includes('vadesiz eur') ||
    lowerText.includes('tarih açıklama tutar bakiye') ||
    lowerText.includes('tarihhareket tipi') ||
    lowerText.includes('emubirikim');

  if (isCreditCardContent && !isVadesizContent) return 'kredi_karti';
  if (isVadesizContent && !isCreditCardContent) return 'vadesiz';

  // Secondary checks: filename
  if (lowerName.includes('vadesiz') || lowerName.includes('hesap_ozeti') || lowerName.includes('hesap ozeti')) return 'vadesiz';
  if (lowerName.includes('kredi') || lowerName.includes('kart')) return 'kredi_karti';

  if (isVadesizContent) return 'vadesiz';
  if (isCreditCardContent) return 'kredi_karti';

  if (lowerName.includes('ekstre')) return 'kredi_karti';

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
