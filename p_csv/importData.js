// importData.js
import fs from 'fs';
import { initializeApp } from 'firebase/app';
// 1. Gerekli importlar eklendi (toplu yükleme için)
import { getFirestore, collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore'; 

// 2. Kendi UID'n
const YOUR_USER_ID = "YOUR_USER_ID_HERE";

// 3. Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// --- Script Başlangıcı ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const importData = async () => {
  try {
    const data = fs.readFileSync('import.json', 'utf8');
    const items = JSON.parse(data);
    const itemsRef = collection(db, 'mediaItems');
    
    // 4. Toplu Yükleme (Batch) Başlat
    const batch = writeBatch(db); 

    console.log(`[BAŞLADI] ${items.length} kayıt, ${YOUR_USER_ID} kullanıcısına ekleniyor...`);

    for (const item of items) {
      const newItem = {
        ...item,
        createdAt: serverTimestamp(),
        userId: YOUR_USER_ID // <<<---- EN ÖNEMLİ EKLEME
      };
      
      // Toplu yükleme için yeni bir doküman referansı oluştur ve ekle
      const docRef = doc(itemsRef); 
      batch.set(docRef, newItem);
    }
    
    // 5. Tüm veriyi tek seferde Firebase'e gönder
    await batch.commit(); 
    console.log(`[BAŞARILI] ${items.length} kayıt hesabına eklendi!`);

  } catch (e) {
    console.error('Hata oluştu:', e);
  }
};

importData();