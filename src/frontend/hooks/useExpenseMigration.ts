import { useState } from 'react';
import { db } from '../../backend/config/firebaseConfig';
import { collection, getDocs, query, where, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORY_MAP: Record<string, string[]> = {
  'Yeme İçme': ['Yemek', 'Yeme-İçme', 'Kafe', 'Restoran', 'Cafe', 'Gıda', 'Market', 'Bakkal', 'Atıştırmalık'],
  'Alışveriş': ['Alışveriş', 'Giyim', 'Teknoloji', 'Kozmetik', 'Aksesuar', 'Ayakkabı', 'Elektronik', 'Alışveriş / Teknoloji'],
  'Akaryakıt': ['Akaryakıt', 'Yakıt'],
  'Araba Harcamaları': ['Araba Harcamaları', 'Araç', 'Otopark', 'HGS', 'Bakım', 'Tamir', 'Yıkama', 'Araç Giderleri'],
  'Ulaşım': ['Ulaşım', 'Taksi', 'Otobüs', 'Metro', 'Yolculuk', 'Bilet', 'Uçak'],
  'Fatura': ['Fatura', 'Abonelik', 'Elektrik', 'Su', 'Doğalgaz', 'İnternet', 'Telefon', 'Netflix', 'Spotify'],
  'Sağlık': ['Sağlık', 'Eczane', 'Hastane', 'Muayene', 'İlaç', 'Diş'],
  'Finans & Vergi': ['Vergi', 'Kamu', 'Ceza', 'Sigorta', 'BES', 'Yatırım', 'Kredi', 'Faiz', 'Kamu / Vergi', 'Vergi / Ceza', 'Vergi ve Ödemeler', 'Sigorta / BES', 'Sigorta ve Yatırım'],
  'Eğlence': ['Eğlence', 'Oyun', 'Sinema', 'Konser', 'Tiyatro', 'Hobi', 'Oyun / Eğlence', 'Eğlence/Cafe'],
  'Diğer': ['Diğer', 'Genel', 'Bağış', 'Hizmet', 'Seyahat', 'Konaklama', 'Yol Üstü Tesis']
};

const normalizeCategory = (name: string): string => {
  if (!name) return 'Diğer';
  const trimmed = name.trim();
  for (const [standard, aliases] of Object.entries(CATEGORY_MAP)) {
    if (standard.toLowerCase() === trimmed.toLowerCase() || aliases.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      return standard;
    }
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export function useExpenseMigration() {
  const { user } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);

  const runMigration = async () => {
    if (!user) return;
    setIsMigrating(true);
    const loadingToast = toast.loading('Veriler normalize ediliyor...');

    try {
      // 1. Get all expenses
      const expensesRef = collection(db, 'expenses');
      const q = query(expensesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let updatedCount = 0;
      const seenCategories = new Set<string>();

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        let currentCategory = data.category;
        const title = (data.title || '').toLowerCase();
        let normalized = normalizeCategory(currentCategory);

        // RECOVERY LOGIC: If it's already "Ulaşım" or "Araç Giderleri", 
        // check the title to see if it should be "Akaryakıt" or "Araba Harcamaları"
        if (normalized === 'Ulaşım' || normalized === 'Araba Harcamaları' || normalized === 'Araç Giderleri') {
          const fuelKeywords = ['akaryakıt', 'yakıt', 'benzin', 'mazot', 'lpg', 'shell', 'opet', 'petrol', 'bp', 'aytemiz', 'total', 'petrol ofisi'];
          const carKeywords = ['araba', 'araç', 'bakım', 'servis', 'yıkama', 'hgs', 'otopark', 'muayene', 'lastik', 'oto'];

          if (fuelKeywords.some(k => title.includes(k))) {
            normalized = 'Akaryakıt';
          } else if (carKeywords.some(k => title.includes(k))) {
            normalized = 'Araba Harcamaları';
          }
        }

        seenCategories.add(normalized);

        if (currentCategory !== normalized) {
          batch.update(docSnap.ref, { category: normalized });
          updatedCount++;
        }
      });

      // 2. Cleanup and Sync Categories collection
      const categoriesRef = collection(db, 'categories');
      const catQuery = query(categoriesRef, where('userId', '==', user.uid));
      const catSnapshot = await getDocs(catQuery);

      // Delete existing categories that are not in our standard list or currently used
      const standardCategories = Object.keys(CATEGORY_MAP);
      catSnapshot.docs.forEach(catDoc => {
        const catName = catDoc.data().name;
        if (!standardCategories.includes(catName) && !seenCategories.has(catName)) {
          batch.delete(catDoc.ref);
        }
      });

      // Ensure standard categories exist if they have expenses
      for (const catName of standardCategories) {
        const exists = catSnapshot.docs.some(d => d.data().name === catName);
        if (!exists && seenCategories.has(catName)) {
          const newCatRef = doc(collection(db, 'categories'));
          batch.set(newCatRef, {
            name: catName,
            userId: user.uid,
            createdAt: Date.now()
          });
        }
      }

      await batch.commit();
      toast.success(`${updatedCount} harcama güncellendi ve kategoriler temizlendi!`, { id: loadingToast });
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Hata oluştu: ' + (error as any).message, { id: loadingToast });
    } finally {
      setIsMigrating(false);
    }
  };

  return { runMigration, isMigrating };
}
