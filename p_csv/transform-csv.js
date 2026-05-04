// transform-csv.js
import fs from 'fs';
import csv from 'csv-parser'; 

const csvHeaders = ['ID', 'Title', 'Image', 'Rating', 'Description', 'Watched'];

const normalizeItem = (item, type) => ({
  title: item.Title || '',
  image: item.Image || '',
  rating: item.Rating || '0',
  description: item.Description || '',
  watched: item.Watched === '1' || item.Watched === 'true',
  type: type 
});

const allItems = [];

const processFile = (filename, type) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filename)
      .pipe(csv({ headers: csvHeaders }))
      .on('data', (data) => {
        const { ID, ...rest } = data;
        allItems.push(normalizeItem(rest, type));
      })
      .on('end', () => {
        console.log(`[BAŞARILI] ${filename} dosyası okundu ve işlendi.`);
        resolve();
      })
      .on('error', (error) => {
        console.error(`[HATA] ${filename} okunurken hata:`, error.message);
        reject(error);
      });
  });
};

const runTransform = async () => {
  try {
    console.log('CSV dosyaları okunuyor...');
    await processFile('movies.csv', 'movie');
    await processFile('series.csv', 'series');
    await processFile('games.csv', 'game');

    fs.writeFileSync('import.json', JSON.stringify(allItems, null, 2));
    
    console.log('----------------------------------------------------');
    console.log(`[TAMAMLANDI] Toplam ${allItems.length} kayıt 'import.json' dosyasına yazıldı.`);
    console.log("ŞİMDİ 'node importData.js' komutunu çalıştırabilirsin.");

  } catch (e) {
    console.error('Dönüştürme sırasında bir hata oluştu:', e.message);
  }
};

runTransform();