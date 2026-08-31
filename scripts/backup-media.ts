// scripts/backup-media.ts
// Otomatik Medya (Film, Dizi, Oyun, Kitap) Yedekleme Job Scripti
// Kütüphaneyi Firestore'dan çeker ve projedeki /backups/media/ klasörüne JSON ve TXT olarak kaydeder.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from .env
dotenv.config({ path: path.join(projectRoot, '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_API_KEY || 'AIzaSyDbxNvt8gT5VUQjb1I0MS6sLTQaTTh9f_0',
    authDomain: process.env.VITE_AUTH_DOMAIN || 'emucalendarbinbin.firebaseapp.com',
    projectId: process.env.VITE_PROJECT_ID || 'emucalendarbinbin',
    storageBucket: process.env.VITE_STORAGE_BUCKET || 'emucalendarbinbin.firebasestorage.app',
    messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID || '851837361679',
    appId: process.env.VITE_APP_ID || '1:851837361679:web:84643d98dbe5edf6a5cd7a',
};

const targetUserId = process.env.VITE_ADMIN_UID || 'ZKU7SObBkeNzMicltUKJjo6ybHH2';
const authEmail = process.env.FIREBASE_AUTH_EMAIL || process.env.BACKUP_AUTH_EMAIL || process.env.BACKUP_EMAIL || process.env.ADMIN_EMAIL;
const authPassword = process.env.FIREBASE_AUTH_PASSWORD || process.env.BACKUP_AUTH_PASSWORD || process.env.BACKUP_PASSWORD || process.env.ADMIN_PASSWORD;

async function runMediaBackup() {
    console.log('🚀 [Media Backup Job] Medya yedekleme başlatılıyor...');
    console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Oturum Açma (Firestore Güvenlik Kuralları yetkisi için)
    if (authEmail && authPassword) {
        try {
            console.log(`🔐 [Auth] '${authEmail}' ile Firebase oturumu açılıyor...`);
            await signInWithEmailAndPassword(auth, authEmail, authPassword);
            console.log('✅ [Auth] Başarıyla oturum açıldı.');
        } catch (authErr: any) {
            console.error('❌ [Auth Giriş Hatası]:', authErr.message);
            console.error('Lütfen GitHub Secrets veya .env içerisindeki FIREBASE_AUTH_EMAIL ve FIREBASE_AUTH_PASSWORD bilgilerini kontrol edin.');
            throw authErr;
        }
    } else {
        console.warn('⚠️  [UYARI] Auth bilgileri (FIREBASE_AUTH_EMAIL & FIREBASE_AUTH_PASSWORD) bulunamadı.');
        console.warn('Firestore güvenlik kuralları oturum gerektiriyorsa işlem yetki hatası verecektir.');
    }

    // Ensure output directories exist
    const backupDir = path.join(projectRoot, 'backups', 'media');
    const historyDir = path.join(backupDir, 'history');
    fs.mkdirSync(backupDir, { recursive: true });
    fs.mkdirSync(historyDir, { recursive: true });

    let q;
    if (targetUserId) {
        q = query(collection(db, 'mediaItems'), where('userId', '==', targetUserId));
    } else {
        q = collection(db, 'mediaItems');
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as any[];

    console.log(`📦 Toplam ${items.length} adet medya içeriği bulundu.`);

    const dateIso = new Date().toISOString();
    const dateStr = dateIso.slice(0, 10);

    const movies = items.filter(i => i.type === 'movie');
    const series = items.filter(i => i.type === 'series');
    const games = items.filter(i => i.type === 'game');
    const books = items.filter(i => i.type === 'book');

    const payload = {
        version: '2.0',
        exportedAt: dateIso,
        targetUserId: targetUserId || 'all',
        totalCount: items.length,
        stats: {
            movieCount: movies.length,
            seriesCount: series.length,
            gameCount: games.length,
            bookCount: books.length
        },
        items: items.map(item => ({
            id: item.id,
            title: item.title,
            type: item.type,
            rating: item.rating,
            image: item.image,
            description: item.description,
            watched: item.watched,
            genre: item.genre,
            tags: item.tags,
            imdbId: item.imdbId,
            totalSeasons: item.totalSeasons,
            releaseDate: item.releaseDate,
            runtime: item.runtime,
            author: item.author
        }))
    };

    // 1. Write Latest JSON
    const latestJsonPath = path.join(backupDir, 'media_backup_latest.json');
    fs.writeFileSync(latestJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    // 2. Write Timestamped JSON in history
    const historyJsonPath = path.join(historyDir, `media_backup_${dateStr}.json`);
    fs.writeFileSync(historyJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    // 3. Generate Human-Readable Text File
    let txt = `=======================================================\n`;
    txt += `              EMULIST MEDYA KOLEKSIYON ARSIVI\n`;
    txt += `           Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
    txt += `           Toplam Icerik: ${items.length}\n`;
    txt += `           Filmler: ${movies.length} | Diziler: ${series.length} | Oyunlar: ${games.length} | Kitaplar: ${books.length}\n`;
    txt += `=======================================================\n\n`;

    if (movies.length > 0) {
        txt += `🎬 FILMLER (${movies.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        movies.forEach((m, idx) => {
            txt += `${idx + 1}. ${m.title} [Puan: ${m.rating || '-'}] [Durum: ${m.watched ? 'Izlendi' : 'Izlenecek'}] ${m.imdbId ? `(IMDb: ${m.imdbId})` : ''}\n`;
            if (m.genre) txt += `   Tur: ${m.genre}\n`;
            if (m.releaseDate) txt += `   Yil: ${m.releaseDate}\n`;
        });
        txt += `\n`;
    }

    if (series.length > 0) {
        txt += `📺 DIZILER (${series.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        series.forEach((s, idx) => {
            txt += `${idx + 1}. ${s.title} [Puan: ${s.rating || '-'}] [Durum: ${s.watched ? 'Izlendi' : 'Izlenecek'}] ${s.imdbId ? `(IMDb: ${s.imdbId})` : ''} ${s.totalSeasons ? `[${s.totalSeasons} Sezon]` : ''}\n`;
            if (s.genre) txt += `   Tur: ${s.genre}\n`;
        });
        txt += `\n`;
    }

    if (games.length > 0) {
        txt += `🎮 OYUNLAR (${games.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        games.forEach((g, idx) => {
            txt += `${idx + 1}. ${g.title} [Puan: ${g.rating || '-'}] [Durum: ${g.watched ? 'Oynandi' : 'Oynanacak'}]\n`;
        });
        txt += `\n`;
    }

    if (books.length > 0) {
        txt += `📚 KITAPLAR (${books.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        books.forEach((b, idx) => {
            txt += `${idx + 1}. ${b.title} ${b.author ? `(Yazar: ${b.author})` : ''} [Puan: ${b.rating || '-'}] [Durum: ${b.watched ? 'Okundu' : 'Okunacak'}]\n`;
        });
        txt += `\n`;
    }

    txt += `=======================================================\n`;
    txt += `Otomatik Yedekleme Tamamlandi (Job: Daily Media Guard)\n`;

    const latestTxtPath = path.join(backupDir, 'media_archive_latest.txt');
    fs.writeFileSync(latestTxtPath, txt, 'utf-8');

    console.log(`✅ [Media Backup Job] Başarıyla kaydedildi:`);
    console.log(`   📄 JSON: ${latestJsonPath}`);
    console.log(`   📝 TXT : ${latestTxtPath}`);
    process.exit(0);
}

runMediaBackup().catch(err => {
    console.error('❌ [Media Backup Job Hata]:', err);
    process.exit(1);
});
