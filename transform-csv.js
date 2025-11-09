// transform-csv.js
import fs from 'fs';
import csv from 'csv-parser'; // csv-parser paketimiz

// SSMS'ten gelen başlık (column) sırası
const csvHeaders = ['ID', 'Title', 'Image', 'Rating', 'Description', 'Watched'];

// Veriyi bizim React projemize uygun hale getirir
const normalizeItem = (item, type) => ({
  title: item.Title || '',
  image: item.Image || '',
  rating: item.Rating || '0',
  description: item.Description || '',
  // CSV'den gelen '0' (false) veya '1' (true) değerini boolean'a çevirir
  watched: item.Watched === '1' || item.Watched === 'true',
  type: type 
});

const allItems = [];

// Tek bir CSV dosyasını okuyup 'allItems' dizisine ekleyen fonksiyon
const processFile = (filename, type) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filename)
      // HATA ÇÖZÜMÜ: 'headers' seçeneğini manuel olarak veriyoruz
      .pipe(csv({ headers: csvHeaders }))
      .on('data', (data) => {
        // ID sütununu almıyoruz, Firebase kendi ID'sini verecek
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

// Ana dönüştürme işlemini başlatan fonksiyon
const runTransform = async () => {
  try {
    console.log('CSV dosyaları okunuyor...');
    
    // Üç dosyayı da sırayla işle
    await processFile('movies.csv', 'movie');
    await processFile('series.csv', 'series');
    await processFile('games.csv', 'game');

    // Yeni 'import.json' dosyasını oluştur
    fs.writeFileSync('import.json', JSON.stringify(allItems, null, 2));
    
    console.log('----------------------------------------------------');
    console.log(`[TAMAMLANDI] Toplam ${allItems.length} kayıt 'import.json' dosyasına yazıldı.`);
    console.log("Artık 'node importData.js' komutunu çalıştırabilirsin.");

  } catch (e) {
    console.error('Dönüştürme sırasında bir hata oluştu:', e.message);
  }
};

runTransform();