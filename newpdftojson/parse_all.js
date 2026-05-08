const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// ========== CATEGORY DETECTION ==========
function detectCategory(description, type) {
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

// ========== PARSE CREDIT CARD STATEMENT ==========
function parseCreditCard(text, fileName) {
  const transactions = [];
  
  // Extract ekstre date from filename: DD.MM.YYYY
  const fileDateMatch = fileName.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const ekstreYear = fileDateMatch ? parseInt(fileDateMatch[3]) : 2025;
  
  // Find transaction lines - format: DD/MM/YYYYDescription Amount
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
      let amountStr = txMatch[5].replace(' TL', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
      let amount = parseFloat(amountStr);
      
      // Check for installment info like (1.234,56 TL) or 2/3
      const installmentMatch = description.match(/\([\d.,]+ TL\)\s*$/);
      if (installmentMatch) {
        description = description.replace(installmentMatch[0], '').trim();
      }
      const taksitMatch = description.match(/(\d+\/\d+)\s*$/);
      let installment = null;
      if (taksitMatch) {
        installment = taksitMatch[1];
        description = description.replace(taksitMatch[0], '').trim();
      }
      
      // Check for (iade) refund
      const isRefund = description.includes('(iade)') || description.includes('İade');
      
      // Ödeme lines are payments (positive direction = reducing debt)
      const isPayment = description.includes('Ödeme -');
      
      const date = `${year}-${month}-${day}`;
      
      // For credit card: all amounts without - are expenses (giden)
      // Amounts with - are payments or refunds (gelen)
      const direction = amount < 0 ? 'gelen' : 'giden';
      const absAmount = Math.abs(amount);
      
      // Clean description
      description = description.replace(/\s+/g, ' ').trim();
      // Remove city info
      description = description.replace(/\s+(İSTANBUL|ISTANBUL|KAYSERI|KARAMAN|TR|TRTR)\s*/gi, ' ').trim();
      
      let title = description.split(/\s{2,}/)[0] || description;
      title = title.replace(/(iade)/gi, '').trim();
      if (title.length > 60) title = title.substring(0, 57) + '...';
      
      const type = isPayment ? 'Ödeme' : (isRefund ? 'İade' : 'Kredi Kartı Harcaması');
      const category = isPayment ? 'Kredi Kartı Ödemesi' : (isRefund ? 'İptal/İade' : detectCategory(description, 'Kredi Kartı'));
      
      transactions.push({
        title: title,
        amount: absAmount,
        date: date,
        direction: direction,
        type: type,
        category: category,
        source: 'Kredi Kartı',
        description: `${type}, ${description}`,
        ...(installment ? { installment } : {})
      });
    }
    
    // Multi-line installment entries with (İşlem tutarı: ...) or (Faiz oranı: ...)
    const multiLineMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{4})(.+)$/);
    if (multiLineMatch && !txMatch) {
      // Check next lines for amount
      let fullDesc = multiLineMatch[4].trim();
      let foundAmount = false;
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (!nextLine) continue;
        const amtMatch = nextLine.match(/^(\d+\/\d+)\s+([-]?\s*[\d.,]+ TL)$/);
        if (amtMatch) {
          const installment = amtMatch[1];
          let amountStr = amtMatch[2].replace(' TL', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
          let amount = parseFloat(amountStr);
          const direction = amount < 0 ? 'gelen' : 'giden';
          const day = multiLineMatch[1];
          const month = multiLineMatch[2];
          const year = multiLineMatch[3];
          
          transactions.push({
            title: fullDesc.substring(0, 60),
            amount: Math.abs(amount),
            date: `${year}-${month}-${day}`,
            direction: direction,
            type: 'Kredi Kartı Harcaması',
            category: detectCategory(fullDesc, 'Kredi Kartı'),
            source: 'Kredi Kartı',
            description: `Kredi Kartı Harcaması, ${fullDesc}`,
            installment: installment
          });
          foundAmount = true;
          break;
        }
        fullDesc += ' ' + nextLine;
      }
    }
  }
  
  // Also match "Bir önceki ekstre bakiyeniz" line to skip it
  return transactions.filter(t => !t.title.includes('Bir önceki ekstre'));
}

// ========== PARSE VADESIZ HESAP ==========
function parseVadesiz(text) {
  const transactions = [];
  const lines = text.split('\n');
  
  const MOVE_TYPES = [
    'Gelen Transfer', 'Giden Transfer', 'Encard\nHarcaması', 'Ödeme', 
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
        line.includes('Hareket tipi') && line.includes(':') ||
        line.includes('İşlem tutarı:') || line.includes('Başlangıç tarihi') ||
        line.includes('Bitiş tarihi') || line.includes('Açıklamada aranan') ||
        line.includes('TarihHareket tipi') || line.includes('Vadesiz TL') ||
        line.includes('Tümü') || line === 'Γ' || line === '62' ||
        line.match(/^\d{8}$/) || line.startsWith(':') ||
        line.includes('Bu belge') || line.includes('kodu ile')) continue;
    
    // Match date DD.MM.YYYY
    const dateMatch = line.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dateMatch) continue;
    
    const day = dateMatch[1];
    const month = dateMatch[2];
    const year = dateMatch[3];
    const date = `${year}-${month}-${day}`;
    const rest = line.substring(10).trim();
    
    // Detect hareket tipi
    let moveType = '';
    let description = '';
    let amount = 0;
    let balance = 0;
    
    // Check for Encard Harcaması (multi-line)
    if (rest === '' && i + 1 < lines.length && lines[i + 1].trim() === 'Encard') {
      moveType = 'Encard Harcaması';
      // Skip "Encard" and "Harcaması" lines
      i += 2;
      // Next line has description + amount + balance
      if (i < lines.length) {
        const descLine = lines[i].trim();
        // Extract amounts from end: -1.234,56 TL123.456,78 TL
        const amtMatch = descLine.match(/(.+?)([-]?(?:\d{1,3}\.)*\d{1,3},\d{2} TL)((?:\d{1,3}\.)*\d{1,3},\d{2} TL)$/);
        if (amtMatch) {
          description = amtMatch[1].trim();
          let amtStr = amtMatch[2].replace(' TL', '').replace(/\./g, '').replace(',', '.');
          amount = parseFloat(amtStr);
          let balStr = amtMatch[3].replace(' TL', '').replace(/\./g, '').replace(',', '.');
          balance = parseFloat(balStr);
        }
      }
    } else {
      // Single-line or multi-line with type on same line
      // Try to find type
      for (const t of ['Gelen Transfer', 'Giden Transfer', 'Para Yatırma', 'Para Çekme',
                        'İptal/İade', 'Alış/Satış', 'Vergi Kesintisi', 'Masraf/Ücret', 'Ödeme', 'Diğer']) {
        if (rest.startsWith(t)) {
          moveType = t;
          let afterType = rest.substring(t.length).trim();
          
          // Try to extract amounts from this line
          const amtMatch = afterType.match(/(.+?)([-]?(?:\d{1,3}\.)*\d{1,3},\d{2} TL)((?:\d{1,3}\.)*\d{1,3},\d{2} TL)$/);
          if (amtMatch) {
            description = amtMatch[1].trim();
            let amtStr = amtMatch[2].replace(' TL', '').replace(/\./g, '').replace(',', '.');
            amount = parseFloat(amtStr);
          } else {
            // Multi-line description, gather next lines
            let fullDesc = afterType;
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              const nextLine = lines[j].trim();
              if (!nextLine) continue;
              const endMatch = nextLine.match(/^(.*?)([-]?(?:\d{1,3}\.)*\d{1,3},\d{2} TL)((?:\d{1,3}\.)*\d{1,3},\d{2} TL)$/);
              if (endMatch) {
                fullDesc += ' ' + endMatch[1].trim();
                let amtStr = endMatch[2].replace(' TL', '').replace(/\./g, '').replace(',', '.');
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
    // Sanity check - skip obviously wrong amounts
    if (absAmount > 500000) continue;
    const direction = amount < 0 ? 'giden' : 'gelen';
    
    // Generate title
    let title = description;
    // Clean up description for title
    const commaIdx = title.indexOf(',');
    if (commaIdx > 0 && commaIdx < 50) {
      title = title.substring(0, commaIdx).trim();
    }
    // Remove EFT/FAST info
    title = title.replace(/,?\s*EFT \(FAST\) sorgu no:?\s*\d+/g, '').trim();
    title = title.replace(/,?\s*Bireysel Ödeme/g, '').trim();
    title = title.replace(/,?\s*tarafından aktarılan/g, '').trim();
    // Remove POS codes
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
      description: `${moveType}, ${description}`
    });
  }
  
  return transactions;
}

// ========== MAIN ==========
async function main() {
  const dir = path.join(__dirname, 'ekstreler');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  
  console.log(`Found ${files.length} PDF files`);
  
  let allTransactions = [];
  
  for (const file of files) {
    console.log(`Processing: ${file}`);
    const buf = fs.readFileSync(path.join(dir, file));
    const data = await pdfParse(buf);
    
    let transactions;
    if (file.includes('vadesiz')) {
      transactions = parseVadesiz(data.text);
    } else {
      transactions = parseCreditCard(data.text, file);
    }
    
    console.log(`  -> ${transactions.length} transactions found`);
    allTransactions = allTransactions.concat(transactions);
  }
  
  // Sort by date descending
  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Stats
  const gelen = allTransactions.filter(t => t.direction === 'gelen');
  const giden = allTransactions.filter(t => t.direction === 'giden');
  const gelenTotal = gelen.reduce((s, t) => s + t.amount, 0);
  const gidenTotal = giden.reduce((s, t) => s + t.amount, 0);
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total transactions: ${allTransactions.length}`);
  console.log(`Gelen (income): ${gelen.length} transactions, ${gelenTotal.toLocaleString('tr-TR')} TL`);
  console.log(`Giden (expense): ${giden.length} transactions, ${gidenTotal.toLocaleString('tr-TR')} TL`);
  console.log(`Net: ${(gelenTotal - gidenTotal).toLocaleString('tr-TR')} TL`);
  
  // Categories breakdown
  const cats = {};
  allTransactions.forEach(t => {
    if (!cats[t.category]) cats[t.category] = { count: 0, gelen: 0, giden: 0 };
    cats[t.category].count++;
    if (t.direction === 'gelen') cats[t.category].gelen += t.amount;
    else cats[t.category].giden += t.amount;
  });
  console.log(`\nCategories:`);
  Object.entries(cats).sort((a, b) => b[1].count - a[1].count).forEach(([cat, data]) => {
    console.log(`  ${cat}: ${data.count} tx | Gelen: ${data.gelen.toLocaleString('tr-TR')} | Giden: ${data.giden.toLocaleString('tr-TR')}`);
  });
  
  // Write JSON
  const outputPath = path.join(__dirname, 'expenses_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allTransactions, null, 2), 'utf8');
  console.log(`\nWritten to: ${outputPath}`);
}

main().catch(console.error);
