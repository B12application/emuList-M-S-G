// importData.js
import fs from 'fs';
import { initializeApp } from 'firebase/app';
// 1. Gerekli importlar eklendi (toplu yükleme için)
import { getFirestore, collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore'; 

// 2. Kendi UID'n
const YOUR_USER_ID = "ZKU7SObBkeNzMicltUKJjo6ybHH2";

// 3. Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDbxNvt8gT5VUQjb1I0MS6sLTQaTTh9f_0",
  authDomain: "emucalendarbinbin.firebaseapp.com",
  projectId: "emucalendarbinbin",
  storageBucket: "emucalendarbinbin.firebasestorage.app",
  messagingSenderId: "851837361679",
  appId: "1:851837361679:web:84643d98dbe5edf6a5cd7a"
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