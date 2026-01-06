// src/backend/services/releaseDateMigrationService.ts
// Mevcut içeriklere çıkış tarihi eklemek için migrasyon servisi

import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getMovieByTitle } from './omdbApi';
import { searchBooks, getBookById } from './googleBooksApi';
import { searchGames, getGameById } from './rawgApi';

export interface ReleaseDateMigrationResult {
    total: number;
    updated: number;
    skipped: number;
    failed: number;
    details: { title: string; type: string; status: 'updated' | 'skipped' | 'failed'; releaseDate?: string }[];
}

/**
 * Tüm medya içeriklerine çıkış tarihi ekler
 * @param userId Kullanıcı ID'si
 * @param onProgress Progress callback
 */
export async function migrateReleaseDates(
    userId: string,
    onProgress?: (current: number, total: number, title: string) => void
): Promise<ReleaseDateMigrationResult> {
    const result: ReleaseDateMigrationResult = {
        total: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        details: [],
    };

    // Kullanıcının tüm medya içeriklerini çek
    const q = query(
        collection(db, 'mediaItems'),
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    result.total = snapshot.docs.length;

    for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnap = snapshot.docs[i];
        const data = docSnap.data();
        const title = data.title;
        const type = data.type;

        // Progress callback
        if (onProgress) {
            onProgress(i + 1, result.total, title);
        }

        // Zaten releaseDate varsa atla
        if (data.releaseDate) {
            result.skipped++;
            result.details.push({ title, type, status: 'skipped', releaseDate: data.releaseDate });
            continue;
        }

        try {
            let releaseDate: string | undefined;

            if (type === 'movie' || type === 'series') {
                // OMDB'den çek
                const mediaInfo = await getMovieByTitle(title, type === 'movie' ? 'movie' : 'series');
                if (mediaInfo && mediaInfo.Released && mediaInfo.Released !== 'N/A') {
                    releaseDate = mediaInfo.Released;
                }
            } else if (type === 'book') {
                // Google Books'tan çek
                const searchResults = await searchBooks(title);
                if (searchResults.length > 0) {
                    const bookInfo = await getBookById(searchResults[0].id);
                    if (bookInfo.volumeInfo.publishedDate) {
                        releaseDate = bookInfo.volumeInfo.publishedDate;
                    }
                }
            } else if (type === 'game') {
                // RAWG'den çek
                const searchResults = await searchGames(title);
                if (searchResults.length > 0) {
                    const gameInfo = await getGameById(searchResults[0].id);
                    if (gameInfo.released) {
                        releaseDate = gameInfo.released;
                    }
                }
            }

            if (releaseDate) {
                await updateDoc(doc(db, 'mediaItems', docSnap.id), {
                    releaseDate,
                });
                result.updated++;
                result.details.push({ title, type, status: 'updated', releaseDate });
            } else {
                result.failed++;
                result.details.push({ title, type, status: 'failed' });
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
 * Tek bir medya içeriği için çıkış tarihi çeker ve günceller
 */
export async function fetchAndUpdateReleaseDate(
    mediaId: string,
    title: string,
    type: 'movie' | 'series' | 'book' | 'game'
): Promise<{ success: boolean; releaseDate?: string }> {
    try {
        let releaseDate: string | undefined;

        if (type === 'movie' || type === 'series') {
            const mediaInfo = await getMovieByTitle(title, type === 'movie' ? 'movie' : 'series');
            if (mediaInfo && mediaInfo.Released && mediaInfo.Released !== 'N/A') {
                releaseDate = mediaInfo.Released;
            }
        } else if (type === 'book') {
            const searchResults = await searchBooks(title);
            if (searchResults.length > 0) {
                const bookInfo = await getBookById(searchResults[0].id);
                if (bookInfo.volumeInfo.publishedDate) {
                    releaseDate = bookInfo.volumeInfo.publishedDate;
                }
            }
        } else if (type === 'game') {
            const searchResults = await searchGames(title);
            if (searchResults.length > 0) {
                const gameInfo = await getGameById(searchResults[0].id);
                if (gameInfo.released) {
                    releaseDate = gameInfo.released;
                }
            }
        }

        if (releaseDate) {
            await updateDoc(doc(db, 'mediaItems', mediaId), {
                releaseDate,
            });
            return { success: true, releaseDate };
        }

        return { success: false };
    } catch (error) {
        console.error(`Çıkış tarihi çekilemedi (${title}):`, error);
        return { success: false };
    }
}
