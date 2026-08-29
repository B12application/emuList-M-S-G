// src/backend/services/imdbSyncService.ts
// Kütüphanedeki tüm film ve dizileri tarayarak eksik IMDb ID'lerini OMDb/TMDb üzerinden otomatik eşitleyen servis

import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { MediaItem } from '../types/media';
import { searchMovies, getMovieById } from './omdbApi';
import { searchTMDB, getTMDBDetails } from './tmdbApi';

export interface SyncProgress {
    current: number;
    total: number;
    updatedCount: number;
    currentItemTitle?: string;
}

export interface SyncResult {
    totalChecked: number;
    missingCount: number;
    updatedCount: number;
    failedCount: number;
    alreadyHadImdbCount: number;
    details: Array<{ title: string; imdbId?: string; status: 'updated' | 'already_had' | 'not_found' | 'skipped' }>;
}

/**
 * Kullanıcının kütüphanesindeki tüm film ve dizileri tarayarak eksik olan IMDb ID'lerini bulur ve günceller
 */
export async function syncAllMissingImdbIds(
    userId: string,
    onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
    if (!userId) {
        throw new Error('Kullanıcı oturumu bulunamadı');
    }

    // 1. Kullanıcının tüm medya kayıtlarını getir
    const q = query(
        collection(db, 'mediaItems'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    const allItems = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
    } as MediaItem));

    // Yalnızca film ve dizileri hedefle (kitap ve oyunların IMDb ID'si olmaz)
    const targetItems = allItems.filter(item => item.type === 'movie' || item.type === 'series');

    const result: SyncResult = {
        totalChecked: targetItems.length,
        missingCount: 0,
        updatedCount: 0,
        failedCount: 0,
        alreadyHadImdbCount: 0,
        details: []
    };

    const itemsToUpdate = targetItems.filter(item => !item.imdbId || item.imdbId.trim() === '');
    result.missingCount = itemsToUpdate.length;
    result.alreadyHadImdbCount = targetItems.length - itemsToUpdate.length;

    let current = 0;
    for (const item of itemsToUpdate) {
        current++;
        if (onProgress) {
            onProgress({
                current,
                total: itemsToUpdate.length,
                updatedCount: result.updatedCount,
                currentItemTitle: item.title
            });
        }

        const title = item.title.trim();
        let foundImdbId: string | null = null;

        try {
            // 1. Adım: OMDb üzerinden ara (En doğrudan IMDb ID kaynağı)
            const omdbResults = await searchMovies(title, item.type === 'movie' ? 'movie' : 'series');
            if (omdbResults && omdbResults.length > 0 && omdbResults[0].imdbID) {
                foundImdbId = omdbResults[0].imdbID;
            }

            // 2. Adım: OMDb bulamadıysa TMDb üzerinden ara (Türkçe isimleri İngilizce IMDb ID'ye bağlar)
            if (!foundImdbId) {
                const tmdbResults = await searchTMDB(title, item.type === 'movie' ? 'movie' : 'series', 'tr-TR');
                if (tmdbResults && tmdbResults.length > 0) {
                    const tmdbDetails = await getTMDBDetails(tmdbResults[0].id, item.type === 'movie' ? 'movie' : 'series');
                    if (tmdbDetails.external_ids?.imdb_id) {
                        foundImdbId = tmdbDetails.external_ids.imdb_id;
                    }
                }
            }

            // 3. Adım: TMDb İngilizce arama fallback
            if (!foundImdbId) {
                const tmdbEnResults = await searchTMDB(title, item.type === 'movie' ? 'movie' : 'series', 'en-US');
                if (tmdbEnResults && tmdbEnResults.length > 0) {
                    const tmdbDetails = await getTMDBDetails(tmdbEnResults[0].id, item.type === 'movie' ? 'movie' : 'series');
                    if (tmdbDetails.external_ids?.imdb_id) {
                        foundImdbId = tmdbDetails.external_ids.imdb_id;
                    }
                }
            }

            // Eğer IMDb ID bulunduysa Firestore'da güncelle
            if (foundImdbId) {
                await updateDoc(doc(db, 'mediaItems', item.id), {
                    imdbId: foundImdbId
                });
                result.updatedCount++;
                result.details.push({ title, imdbId: foundImdbId, status: 'updated' });
            } else {
                result.failedCount++;
                result.details.push({ title, status: 'not_found' });
            }
        } catch (err) {
            console.warn(`[IMDb Sync] ${title} için hata:`, err);
            result.failedCount++;
            result.details.push({ title, status: 'not_found' });
        }

        // Rate limit engellemek için küçük gecikme (150ms)
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    return result;
}
