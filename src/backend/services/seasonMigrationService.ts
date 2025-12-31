// src/backend/services/seasonMigrationService.ts
// Frontend'den çalıştırılabilecek dizi sezon migrasyon servisi

import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getMovieByTitle } from './omdbApi';

export interface MigrationResult {
    total: number;
    updated: number;
    skipped: number;
    failed: number;
    details: { title: string; status: 'updated' | 'skipped' | 'failed'; seasons?: number }[];
}

/**
 * Tüm dizilere OMDB'den sezon bilgisi ekler
 * @param userId Kullanıcı ID'si
 * @param onProgress Progress callback
 */
export async function migrateSeriesSeasons(
    userId: string,
    onProgress?: (current: number, total: number, title: string) => void
): Promise<MigrationResult> {
    const result: MigrationResult = {
        total: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        details: [],
    };

    // Kullanıcının tüm dizilerini çek
    const q = query(
        collection(db, 'mediaItems'),
        where('userId', '==', userId),
        where('type', '==', 'series')
    );

    const snapshot = await getDocs(q);
    result.total = snapshot.docs.length;

    for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnap = snapshot.docs[i];
        const data = docSnap.data();
        const title = data.title;

        // Progress callback
        if (onProgress) {
            onProgress(i + 1, result.total, title);
        }

        try {
            let totalSeasons = data.totalSeasons;
            let needsOmdbFetch = !totalSeasons || totalSeasons <= 0;

            // Eğer sezon bilgisi yoksa OMDB'den çek
            if (needsOmdbFetch) {
                const seriesInfo = await getMovieByTitle(title, 'series');
                if (seriesInfo && seriesInfo.totalSeasons) {
                    totalSeasons = parseInt(seriesInfo.totalSeasons, 10);
                } else {
                    result.failed++;
                    result.details.push({ title, status: 'failed' });
                    // API rate limiting için bekle
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
            }

            // Eğer dizi "izlendi" olarak işaretlenmişse, tüm sezonları doldur
            let watchedSeasons = data.watchedSeasons || [];
            const needsWatchedSeasonsUpdate = data.watched === true &&
                (watchedSeasons.length !== totalSeasons);

            if (data.watched === true && totalSeasons > 0) {
                // Tüm sezonları doldur: [1, 2, 3, ..., totalSeasons]
                watchedSeasons = Array.from({ length: totalSeasons }, (_, i) => i + 1);
            }

            // Güncelleme gerekiyorsa Firestore'u güncelle
            if (needsOmdbFetch || needsWatchedSeasonsUpdate) {
                await updateDoc(doc(db, 'mediaItems', docSnap.id), {
                    totalSeasons,
                    watchedSeasons,
                });
                result.updated++;
                result.details.push({ title, status: 'updated', seasons: totalSeasons });
            } else {
                result.skipped++;
                result.details.push({ title, status: 'skipped', seasons: totalSeasons });
            }

            // API rate limiting için bekle (sadece OMDB çağrısı yapıldıysa)
            if (needsOmdbFetch) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(`Migrasyon hatası (${title}):`, error);
            result.failed++;
            result.details.push({ title, status: 'failed' });
        }
    }

    return result;
}

/**
 * Tek bir dizi için OMDB'den sezon bilgisi çeker ve günceller
 */
export async function fetchAndUpdateSeriesSeasons(
    mediaId: string,
    title: string
): Promise<{ success: boolean; totalSeasons?: number }> {
    try {
        const seriesInfo = await getMovieByTitle(title, 'series');

        if (seriesInfo && seriesInfo.totalSeasons) {
            const totalSeasons = parseInt(seriesInfo.totalSeasons, 10);

            await updateDoc(doc(db, 'mediaItems', mediaId), {
                totalSeasons,
            });

            return { success: true, totalSeasons };
        }

        return { success: false };
    } catch (error) {
        console.error(`Sezon bilgisi çekilemedi (${title}):`, error);
        return { success: false };
    }
}
