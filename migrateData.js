// migrateData.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';

// 1. BURASI DOĞRU (Senin UID'n)
const YOUR_USER_ID = "ZKU7SObBkeNzMicltUKJjo6ybHH2";

// 2. BURASI DOĞRU (Senin Config'in)
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

const migrateData = async () => {
  // === HATA BURADAYDI ===
  // Güvenlik kontrolü, "ZKU7..." (senin UID'n) ile değil, 
  // "BURAYA..." (placeholder) metni ile yapılmalıydı.
  if (YOUR_USER_ID === "BURAYA_KENDI_KULLANICI_UID_NI_YAPISTIR") { 
    console.error("\n[HATA] Lütfen 1. adımdaki YOUR_USER_ID değişkenini kendi UID'nizle güncelleyin.");
    return;
  }
  // === DÜZELTME BİTTİ ===

  console.log(`Veriler şu kullanıcıya taşınıyor: ${YOUR_USER_ID}`);
  console.log("Sahipsiz kayıtlar aranıyor...");

  const itemsRef = collection(db, 'mediaItems');
  const q = query(itemsRef, where('userId', '==', null)); 
  
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("Tebrikler! Taşınacak sahipsiz kayıt bulunamadı.");
    return;
  }
  console.log(`Bulunan sahipsiz kayıt sayısı: ${snapshot.size}`);

  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    console.log(`Güncelleniyor: ${doc.data().title}`);
    batch.update(doc.ref, { userId: YOUR_USER_ID });
  });

  try {
    await batch.commit();
    console.log("\n[BAŞARILI] Tüm sahipsiz kayıtlar başarıyla hesabınıza aktarıldı!");
  } catch (e) {
    console.error("\n[HATA] Aktarım sırasında bir hata oluştu:", e);
    console.log("\nLÜTFEN KONSOLDAKİ LİNKE TIKLAYIP FIREBASE INDEX'İNİ OLUŞTURUN VE SCRİPT'İ TEKRAR ÇALIŞTIRIN.");
  }
};

migrateData();