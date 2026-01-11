// src/backend/services/runtimeImdbMigrationService.ts
// Mevcut film/dizilere runtime ve imdbId eklemek için migrasyon servisi

import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getMovieByTitle } from './omdbApi';

export interface RuntimeImdbMigrationResult {
    total: number;
    updated: number;
    skipped: number;
    failed: number;
    details: {
        title: string;
        type: string;
        status: 'updated' | 'skipped' | 'failed';
        runtime?: string;
        imdbId?: string;
    }[];
}

/**
 * Tüm film ve dizilere runtime ve imdbId ekler
 * @param userId Kullanıcı ID'si
 * @param onProgress Progress callback
 */
export async function migrateRuntimeAndImdb(
    userId: string,
    onProgress?: (current: number, total: number, title: string) => void
): Promise<RuntimeImdbMigrationResult> {
    const result: RuntimeImdbMigrationResult = {
        total: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        details: [],
    };

    // Kullanıcının sadece film ve dizi içeriklerini çek
    const q = query(
        collection(db, 'mediaItems'),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);

    // Sadece film ve dizileri filtrele
    const movieSeriesDocs = snapshot.docs.filter(docSnap => {
        const type = docSnap.data().type;
        return type === 'movie' || type === 'series';
    });

    result.total = movieSeriesDocs.length;

    for (let i = 0; i < movieSeriesDocs.length; i++) {
        const docSnap = movieSeriesDocs[i];
        const data = docSnap.data();
        const title = data.title;
        const type = data.type;

        // Progress callback
        if (onProgress) {
            onProgress(i + 1, result.total, title);
        }

        // Zaten her iki alan da varsa atla
        if (data.runtime && data.imdbId) {
            result.skipped++;
            result.details.push({
                title,
                type,
                status: 'skipped',
                runtime: data.runtime,
                imdbId: data.imdbId
            });
            continue;
        }

        try {
            // OMDB'den bilgileri çek
            const mediaInfo = await getMovieByTitle(title, type === 'movie' ? 'movie' : 'series');

            const updates: Partial<{ runtime: string; imdbId: string }> = {};

            // Runtime ekle (yoksa)
            if (!data.runtime && mediaInfo.Runtime && mediaInfo.Runtime !== 'N/A') {
                updates.runtime = mediaInfo.Runtime;
            }

            // IMDb ID ekle (yoksa)
            if (!data.imdbId && mediaInfo.imdbID) {
                updates.imdbId = mediaInfo.imdbID;
            }

            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, 'mediaItems', docSnap.id), updates);
                result.updated++;
                result.details.push({
                    title,
                    type,
                    status: 'updated',
                    runtime: updates.runtime || data.runtime,
                    imdbId: updates.imdbId || data.imdbId
                });
            } else {
                result.skipped++;
                result.details.push({ title, type, status: 'skipped' });
            }

            // API rate limiting için bekle
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Migrasyon hatası (${title}):`, error);
            result.failed++;
            result.details.push({ title, type, status: 'failed' });
        }
    }

    return result;
}

/**
 * Tek bir medya içeriği için runtime ve imdbId çeker ve günceller
 */
export async function fetchAndUpdateRuntimeImdb(
    mediaId: string,
    title: string,
    type: 'movie' | 'series'
): Promise<{ success: boolean; runtime?: string; imdbId?: string }> {
    try {
        const mediaInfo = await getMovieByTitle(title, type);

        const updates: Partial<{ runtime: string; imdbId: string }> = {};

        if (mediaInfo.Runtime && mediaInfo.Runtime !== 'N/A') {
            updates.runtime = mediaInfo.Runtime;
        }

        if (mediaInfo.imdbID) {
            updates.imdbId = mediaInfo.imdbID;
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'mediaItems', mediaId), updates);
            return { success: true, ...updates };
        }

        return { success: false };
    } catch (error) {
        console.error(`Runtime/IMDb çekilemedi (${title}):`, error);
        return { success: false };
    }
}
