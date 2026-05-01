import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const inputDir = './hesapözetleri';
const outputDir = './scripts/output';

// Category mapping based on common keywords
const categoryMap = {
  'MARKET': 'Market',
  'MIGROS': 'Market',
  'A101': 'Market',
  'BIM': 'Market',
  'SOK': 'Market',
  'CARREFOUR': 'Market',
  'SHELL': 'Akaryakıt',
  'OPET': 'Akaryakıt',
  'BP ': 'Akaryakıt',
  'PETROL': 'Akaryakıt',
  'RESTORAN': 'Yemek',
  'CAFE': 'Yemek',
  'KAHVE': 'Yemek',
  'STARBUCKS': 'Yemek',
  'BURGER KING': 'Yemek',
  'MC DONALDS': 'Yemek',
  'YEMEKSEPETI': 'Yemek',
  'GETIR': 'Yemek',
  'TRENDYOL': 'Alışveriş',
  'HEPSIBURADA': 'Alışveriş',
  'AMAZON': 'Alışveriş',
  'APPLE': 'Teknoloji',
  'NETFLIX': 'Eğlence',
  'SPOTIFY': 'Eğlence',
  'ECZANE': 'Sağlık',
  'HASTANE': 'Sağlık',
};

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function parseStatement(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  
  try {
    const data = await pdf(dataBuffer);
    const text = data.text;
    const lines = text.split('\n');
    const expenses = [];
    const dateRegex = /(\d{2})[./-](\d{2})[./-](\d{2,4})/;

    lines.forEach(line => {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        let [fullDate, d, m, y] = dateMatch;
        if (y.length === 2) y = '20' + y;
        const dateStr = `${y}-${m}-${d}`;
        
        // Match amount (handles formats like 1.250,50 or 1250.50)
        // We look for amounts usually at the end of a transaction line
        const amountMatch = line.match(/(\d{1,3}(?:\.\d{3})*,\d{2})|(\d+[,.]\d{2})$|(\d+)$/);
        
        if (amountMatch) {
          let amountStr = amountMatch[0].replace(/\./g, '').replace(',', '.');
          const amount = parseFloat(amountStr);
          const title = line.replace(fullDate, '').replace(amountMatch[0], '').trim();
          
          if (!isNaN(amount) && amount > 0 && title.length > 2) {
            // Determine category
            let category = 'Genel';
            const upperTitle = title.toUpperCase();
            for (const [key, cat] of Object.entries(categoryMap)) {
              if (upperTitle.includes(key)) {
                category = cat;
                break;
              }
            }

            expenses.push({
              title: title,
              amount: amount,
              date: dateStr,
              category: category,
              description: `Imported from ${path.basename(filePath)}`
            });
          }
        }
      }
    });

    return expenses;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

async function run() {
  if (!fs.existsSync(inputDir)) {
    console.error(`Directory not found: ${inputDir}`);
    fs.mkdirSync(inputDir);
    console.log(`Created ${inputDir} directory. Please put your PDF statements there.`);
    return;
  }

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
  if (files.length === 0) {
    console.log('No PDF files found in ./hesapözetleri');
    return;
  }

  let allExpenses = [];
  console.log(`Found ${files.length} PDF files. Starting parse...`);

  for (const file of files) {
    const expenses = await parseStatement(path.join(inputDir, file));
    console.log(`- ${file}: ${expenses.length} expenses found.`);
    allExpenses = allExpenses.concat(expenses);
  }

  // Remove duplicates (based on title, date, and amount)
  const uniqueExpenses = allExpenses.filter((v, i, a) => 
    a.findIndex(t => t.title === v.title && t.date === v.date && t.amount === v.amount) === i
  );

  const outputPath = path.join(outputDir, 'import_me.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueExpenses, null, 2));
  
  console.log('\n' + '='.repeat(30));
  console.log(`SUCCESS! Total unique expenses: ${uniqueExpenses.length}`);
  console.log(`File saved to: ${outputPath}`);
  console.log('='.repeat(30));
  console.log('\nINSTRUCTIONS:');
  console.log('1. Open your Expenses page in the app.');
  console.log('2. Go to "Reports/Import" tab.');
  console.log('3. Use the new "Upload JSON" button and select "scripts/output/import_me.json".');
}

run();
