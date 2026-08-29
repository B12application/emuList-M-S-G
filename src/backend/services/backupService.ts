// src/backend/services/backupService.ts
// Veritabanı silinmelerine veya kayıplara karşı tam JSON ve TXT yedekleme, indirme ve geri yükleme servisi

import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { MediaItem } from '../types/media';

export interface BackupPayload {
    version: string;
    exportedAt: string;
    userId: string;
    totalCount: number;
    stats: {
        movieCount: number;
        seriesCount: number;
        gameCount: number;
        bookCount: number;
    };
    items: Array<Partial<MediaItem>>;
}

/**
 * Kullanıcının kütüphanesini otomatik olarak tarayıcı yerel hafızasına (localStorage) yedekler
 */
export function autoBackupToLocalStorage(userId: string, items: MediaItem[]) {
    if (!userId || !items || items.length === 0) return;

    try {
        const payload: BackupPayload = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            userId,
            totalCount: items.length,
            stats: {
                movieCount: items.filter(i => i.type === 'movie').length,
                seriesCount: items.filter(i => i.type === 'series').length,
                gameCount: items.filter(i => i.type === 'game').length,
                bookCount: items.filter(i => i.type === 'book').length
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

        localStorage.setItem(`emulist_vault_backup_${userId}`, JSON.stringify(payload));
        localStorage.setItem(`emulist_vault_backup_meta_${userId}`, JSON.stringify({
            count: items.length,
            time: new Date().toISOString()
        }));
    } catch (e) {
        console.warn('Lokal yedek kaydedilemedi:', e);
    }
}

/**
 * Lokal yedek bilgisini döner
 */
export function getLocalBackupInfo(userId: string): { exists: boolean; count: number; dateString: string } {
    if (!userId) return { exists: false, count: 0, dateString: '' };

    try {
        const metaStr = localStorage.getItem(`emulist_vault_backup_meta_${userId}`);
        if (!metaStr) return { exists: false, count: 0, dateString: '' };

        const meta = JSON.parse(metaStr);
        const date = new Date(meta.time);
        return {
            exists: true,
            count: meta.count || 0,
            dateString: date.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    } catch {
        return { exists: false, count: 0, dateString: '' };
    }
}

/**
 * Kullanıcının tüm kütüphanesini tam JSON formatında hazırlar ve dosya olarak indirir
 */
export async function downloadLibraryAsJson(userId: string) {
    if (!userId) throw new Error('Kullanıcı oturumu bulunamadı');

    const q = query(collection(db, 'mediaItems'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as MediaItem));

    const payload: BackupPayload = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        userId,
        totalCount: items.length,
        stats: {
            movieCount: items.filter(i => i.type === 'movie').length,
            seriesCount: items.filter(i => i.type === 'series').length,
            gameCount: items.filter(i => i.type === 'game').length,
            bookCount: items.filter(i => i.type === 'book').length
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

    // Auto-save local snapshot as well
    autoBackupToLocalStorage(userId, items);

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    const fileName = `emulist_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    return items.length;
}

/**
 * Kullanıcının tüm kütüphanesini metin (TXT) listesi olarak indirir
 */
export async function downloadLibraryAsText(userId: string) {
    if (!userId) throw new Error('Kullanıcı oturumu bulunamadı');

    const q = query(collection(db, 'mediaItems'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map(doc => doc.data() as MediaItem);

    const movies = items.filter(i => i.type === 'movie');
    const series = items.filter(i => i.type === 'series');
    const games = items.filter(i => i.type === 'game');
    const books = items.filter(i => i.type === 'book');

    let txt = `=======================================================\n`;
    txt += `              B12 KOLEKSİYON VE YAŞAM ARŞİVİ\n`;
    txt += `           Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
    txt += `           Toplam İçerik: ${items.length}\n`;
    txt += `=======================================================\n\n`;

    if (movies.length > 0) {
        txt += `\n🎬 FILMLER (${movies.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        movies.forEach((m, idx) => {
            txt += `${idx + 1}. ${m.title} [Puan: ${m.rating || '-'}] [Durum: ${m.watched ? 'İzlendi' : 'İzlenecek'}] ${m.imdbId ? `(IMDb: ${m.imdbId})` : ''}\n`;
            if (m.genre) txt += `   Tür: ${m.genre}\n`;
            if (m.releaseDate) txt += `   Yıl: ${m.releaseDate}\n`;
        });
    }

    if (series.length > 0) {
        txt += `\n📺 DIZILER (${series.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        series.forEach((s, idx) => {
            txt += `${idx + 1}. ${s.title} [Puan: ${s.rating || '-'}] [Durum: ${s.watched ? 'İzlendi' : 'İzlenecek'}] ${s.imdbId ? `(IMDb: ${s.imdbId})` : ''} ${s.totalSeasons ? `[${s.totalSeasons} Sezon]` : ''}\n`;
            if (s.genre) txt += `   Tür: ${s.genre}\n`;
        });
    }

    if (games.length > 0) {
        txt += `\n🎮 OYUNLAR (${games.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        games.forEach((g, idx) => {
            txt += `${idx + 1}. ${g.title} [Puan: ${g.rating || '-'}] [Durum: ${g.watched ? 'Oynandı' : 'Oynanacak'}]\n`;
        });
    }

    if (books.length > 0) {
        txt += `\n📚 KITAPLAR (${books.length} Adet)\n`;
        txt += `-------------------------------------------------------\n`;
        books.forEach((b, idx) => {
            txt += `${idx + 1}. ${b.title} ${b.author ? `(Yazar: ${b.author})` : ''} [Puan: ${b.rating || '-'}] [Durum: ${b.watched ? 'Okundu' : 'Okunacak'}]\n`;
        });
    }

    txt += `\n=======================================================\n`;
    txt += `B12 Personal Life OS & Vault Guard\n`;

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    const downloadAnchor = document.createElement('a');
    const fileName = `b12_arsiv_listesi_${new Date().toISOString().slice(0, 10)}.txt`;

    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    return items.length;
}

/**
 * JSON yedeğinden veritabanına geri yükleme (Import / Recovery) yapar
 */
export async function restoreLibraryFromJson(userId: string, jsonString: string): Promise<{ importedCount: number; skippedCount: number }> {
    if (!userId) throw new Error('Kullanıcı oturumu bulunamadı');

    const parsed: BackupPayload = JSON.parse(jsonString);
    if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error('Geçersiz yedek dosyası formatı');
    }

    // Mevcut kayıtları çekerek duplicate'leri önle
    const q = query(collection(db, 'mediaItems'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const existingTitles = new Set(snapshot.docs.map(d => d.data().title?.trim().toLowerCase()));
    const existingImdbIds = new Set(snapshot.docs.map(d => d.data().imdbId?.trim()).filter(Boolean));

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of parsed.items) {
        if (!item.title || !item.type) {
            skippedCount++;
            continue;
        }

        const titleLower = item.title.trim().toLowerCase();
        const itemImdb = item.imdbId ? item.imdbId.trim() : '';

        // Eğer zaten varsa atla
        if (existingTitles.has(titleLower) || (itemImdb && existingImdbIds.has(itemImdb))) {
            skippedCount++;
            continue;
        }

        const newItem: any = {
            userId,
            title: item.title.trim(),
            type: item.type,
            rating: item.rating || '8.0',
            image: item.image || '',
            description: item.description || '',
            watched: item.watched || false,
            genre: item.genre || '',
            tags: item.tags || [],
            createdAt: serverTimestamp()
        };

        if (item.imdbId) newItem.imdbId = item.imdbId;
        if (item.totalSeasons) newItem.totalSeasons = item.totalSeasons;
        if (item.releaseDate) newItem.releaseDate = item.releaseDate;
        if (item.runtime) newItem.runtime = item.runtime;
        if (item.author) newItem.author = item.author;

        await addDoc(collection(db, 'mediaItems'), newItem);
        existingTitles.add(titleLower);
        if (itemImdb) existingImdbIds.add(itemImdb);
        importedCount++;
    }

    return { importedCount, skippedCount };
}

/**
 * Kullanıcının harcamalarını JSON olarak indirir
 */
export async function downloadExpensesAsJson(userId: string) {
    if (!userId) throw new Error('Kullanıcı oturumu bulunamadı');

    let q = query(collection(db, 'expensedata'), where('userId', '==', userId));
    let snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    if (items.length === 0) {
        let q2 = query(collection(db, 'expenses'), where('userId', '==', userId));
        let snap2 = await getDocs(q2);
        items = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    }

    const payload = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        userId,
        totalCount: items.length,
        items
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    const fileName = `emulist_harcamalar_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    return items.length;
}

/**
 * Harcama JSON yedeğinden Firestore'a geri yükleme yapar
 */
export async function restoreExpensesFromJson(userId: string, jsonString: string): Promise<{ importedCount: number; skippedCount: number }> {
    if (!userId) throw new Error('Kullanıcı oturumu bulunamadı');

    const parsed = JSON.parse(jsonString);
    if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error('Geçersiz harcama yedek dosyası formatı');
    }

    const q = query(collection(db, 'expensedata'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const existingIds = new Set(snapshot.docs.map(d => d.id));

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of parsed.items) {
        if (!item.title || item.amount === undefined) {
            skippedCount++;
            continue;
        }

        const cleanItem = {
            ...item,
            userId,
            createdAt: item.createdAt || Date.now()
        };
        delete cleanItem.id;

        await addDoc(collection(db, 'expensedata'), cleanItem);
        importedCount++;
    }

    return { importedCount, skippedCount };
}

