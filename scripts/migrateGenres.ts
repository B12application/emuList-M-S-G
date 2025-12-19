// scripts/migrateGenres.ts
// Bu script mevcut kayıtlara genre bilgisi ekler
// Kullanım: npx tsx scripts/migrateGenres.ts

import { config } from 'dotenv';
import { resolve } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// .env dosyasını proje kökünden yükle
config({ path: resolve(process.cwd(), '.env') });

// Firebase config - .env'den alınacak (doğru değişken isimleri)
const firebaseConfig = {
    apiKey: process.env.VITE_API_KEY,
    authDomain: process.env.VITE_AUTH_DOMAIN,
    projectId: process.env.VITE_PROJECT_ID,
    storageBucket: process.env.VITE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_APP_ID,
};

// Kontrol - API key var mı?
if (!firebaseConfig.apiKey) {
    console.error('❌ HATA: .env dosyası okunamadı veya VITE_API_KEY bulunamadı!');
    console.log('📁 .env dosyasının proje kökünde olduğundan emin ol.');
    console.log('🔍 Aranan: VITE_API_KEY');
    process.exit(1);
}

// API Keys
const OMDB_API_KEY = process.env.VITE_OMDB_API_KEY;
const RAWG_API_KEY = process.env.VITE_RAWG_API_KEY;

console.log('🔑 Firebase Project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DRY_RUN modunda sadece kaç kayıt etkileneceğini gösterir, güncelleme yapmaz
const DRY_RUN = true; // ÖNEMLİ: Önce true ile çalıştır, sonra false yap

interface MediaItem {
    id: string;
    title: string;
    type: 'movie' | 'series' | 'game' | 'book';
    genre?: string;
}

// OMDB'den film/dizi genre'ı çek
async function fetchOMDbGenre(title: string, type: 'movie' | 'series'): Promise<string | null> {
    try {
        const params = new URLSearchParams({
            apikey: OMDB_API_KEY!,
            t: title,
            type: type,
        });

        const response = await fetch(`https://www.omdbapi.com/?${params.toString()}`);
        const data = await response.json();

        if (data.Response === 'True' && data.Genre && data.Genre !== 'N/A') {
            return data.Genre;
        }
        return null;
    } catch (error) {
        console.error(`OMDB error for "${title}":`, error);
        return null;
    }
}

// RAWG'den oyun genre'ı çek
async function fetchRAWGGenre(title: string): Promise<string | null> {
    try {
        const params = new URLSearchParams({
            key: RAWG_API_KEY!,
            search: title,
            page_size: '1',
        });

        const response = await fetch(`https://api.rawg.io/api/games?${params.toString()}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const gameId = data.results[0].id;

            // Get details for genres
            const detailResponse = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}`);
            const detailData = await detailResponse.json();

            if (detailData.genres && detailData.genres.length > 0) {
                return detailData.genres.map((g: any) => g.name).join(', ');
            }
        }
        return null;
    } catch (error) {
        console.error(`RAWG error for "${title}":`, error);
        return null;
    }
}

// Google Books'tan kitap kategorisi çek
async function fetchGoogleBooksGenre(title: string): Promise<string | null> {
    try {
        const params = new URLSearchParams({
            q: title,
            maxResults: '1',
        });

        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const categories = data.items[0].volumeInfo?.categories;
            if (categories && categories.length > 0) {
                return categories.join(', ');
            }
        }
        return null;
    } catch (error) {
        console.error(`Google Books error for "${title}":`, error);
        return null;
    }
}

// Genre çekme fonksiyonu
async function fetchGenre(item: MediaItem): Promise<string | null> {
    switch (item.type) {
        case 'movie':
        case 'series':
            return fetchOMDbGenre(item.title, item.type);
        case 'game':
            return fetchRAWGGenre(item.title);
        case 'book':
            return fetchGoogleBooksGenre(item.title);
        default:
            return null;
    }
}

// Ana migration fonksiyonu
async function migrateGenres() {
    console.log('🚀 Genre Migration Script Started');
    console.log(`📌 Mode: ${DRY_RUN ? 'DRY RUN (simülasyon)' : 'LIVE (gerçek güncelleme)'}`);
    console.log('-----------------------------------\n');

    // Genre'ı olmayan tüm kayıtları çek
    const mediaRef = collection(db, 'mediaItems');
    const snapshot = await getDocs(mediaRef);

    const itemsWithoutGenre: MediaItem[] = [];

    snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.genre) {
            itemsWithoutGenre.push({
                id: docSnap.id,
                title: data.title,
                type: data.type,
            });
        }
    });

    console.log(`📊 Toplam kayıt: ${snapshot.size}`);
    console.log(`🔍 Genre'ı olmayan kayıt: ${itemsWithoutGenre.length}\n`);

    if (itemsWithoutGenre.length === 0) {
        console.log('✅ Tüm kayıtlarda genre mevcut, güncelleme gerekmiyor!');
        return;
    }

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const item of itemsWithoutGenre) {
        console.log(`🔄 İşleniyor: "${item.title}" (${item.type})`);

        // Rate limiting için bekle
        await new Promise(resolve => setTimeout(resolve, 500));

        const genre = await fetchGenre(item);

        if (genre) {
            if (DRY_RUN) {
                console.log(`   ✓ [DRY RUN] Genre bulundu: ${genre}`);
                updated++;
            } else {
                try {
                    await updateDoc(doc(db, 'mediaItems', item.id), { genre });
                    console.log(`   ✓ Güncellendi: ${genre}`);
                    updated++;
                } catch (error) {
                    console.error(`   ✗ Güncelleme hatası:`, error);
                    failed++;
                }
            }
        } else {
            console.log(`   ⚠ Genre bulunamadı, atlandı`);
            skipped++;
        }
    }

    console.log('\n-----------------------------------');
    console.log('📈 Sonuç:');
    console.log(`   ✓ ${DRY_RUN ? 'Güncellenecek' : 'Güncellendi'}: ${updated}`);
    console.log(`   ⚠ Atlandı (genre bulunamadı): ${skipped}`);
    console.log(`   ✗ Hata: ${failed}`);

    if (DRY_RUN) {
        console.log('\n⚡ Gerçek güncelleme için DRY_RUN değişkenini false yapın.');
    }
}

// Script'i çalıştır
migrateGenres()
    .then(() => {
        console.log('\n✅ Script tamamlandı!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script hatası:', error);
        process.exit(1);
    });
