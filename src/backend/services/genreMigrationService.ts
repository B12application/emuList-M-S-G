// src/backend/services/genreMigrationService.ts
// Bu servis mevcut kayıtlara genre bilgisi ekler (uygulama içinden)

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { searchMovies, getMovieById } from './omdbApi';
import { searchGames, getGameById } from './rawgApi';
import { searchBooks, getBookById } from './googleBooksApi';
import type { MediaType } from '../types/media';

interface MigrationProgress {
    total: number;
    processed: number;
    updated: number;
    skipped: number;
    failed: number;
    currentItem: string;
}

type ProgressCallback = (progress: MigrationProgress) => void;

/**
 * Film/Dizi için OMDB'den genre çek
 */
async function fetchOMDbGenre(title: string, type: 'movie' | 'series'): Promise<string | null> {
    try {
        const results = await searchMovies(title, type);
        if (results.length > 0) {
            const details = await getMovieById(results[0].imdbID);
            if (details.Genre && details.Genre !== 'N/A') {
                return details.Genre;
            }
        }
        return null;
    } catch (error) {
        console.error(`OMDB error for "${title}":`, error);
        return null;
    }
}

/**
 * Oyun için RAWG'den genre çek
 */
async function fetchRAWGGenre(title: string): Promise<string | null> {
    try {
        const results = await searchGames(title);
        if (results.length > 0) {
            const details = await getGameById(results[0].id);
            if (details.genres && details.genres.length > 0) {
                return details.genres.map((g: any) => g.name).join(', ');
            }
        }
        return null;
    } catch (error) {
        console.error(`RAWG error for "${title}":`, error);
        return null;
    }
}

/**
 * Kitap için Google Books'tan kategori çek
 */
async function fetchGoogleBooksGenre(title: string): Promise<string | null> {
    try {
        const results = await searchBooks(title);
        if (results.length > 0) {
            const details = await getBookById(results[0].id);
            if (details.volumeInfo.categories && details.volumeInfo.categories.length > 0) {
                return details.volumeInfo.categories.join(', ');
            }
        }
        return null;
    } catch (error) {
        console.error(`Google Books error for "${title}":`, error);
        return null;
    }
}

/**
 * Tür'e göre genre çek
 */
async function fetchGenreForItem(title: string, type: MediaType): Promise<string | null> {
    switch (type) {
        case 'movie':
        case 'series':
            return fetchOMDbGenre(title, type);
        case 'game':
            return fetchRAWGGenre(title);
        case 'book':
            return fetchGoogleBooksGenre(title);
        default:
            return null;
    }
}

/**
 * Kullanıcının genre'ı olmayan kayıtlarını say
 */
export async function countItemsWithoutGenre(userId: string): Promise<number> {
    const q = query(collection(db, 'mediaItems'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    let count = 0;
    snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.genre) {
            count++;
        }
    });

    return count;
}

/**
 * Kullanıcının kayıtlarına genre ekle
 * @param userId Kullanıcı ID
 * @param onProgress İlerleme callback'i
 * @param dryRun Sadece simülasyon yap, güncelleme yapma
 */
export async function migrateGenresForUser(
    userId: string,
    onProgress?: ProgressCallback,
    dryRun: boolean = false
): Promise<MigrationProgress> {
    const q = query(collection(db, 'mediaItems'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    interface ItemToMigrate {
        id: string;
        title: string;
        type: MediaType;
    }

    const itemsToMigrate: ItemToMigrate[] = [];

    snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.genre) {
            itemsToMigrate.push({
                id: docSnap.id,
                title: data.title,
                type: data.type,
            });
        }
    });

    const progress: MigrationProgress = {
        total: itemsToMigrate.length,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        currentItem: '',
    };

    if (onProgress) onProgress({ ...progress });

    for (const item of itemsToMigrate) {
        progress.currentItem = item.title;
        progress.processed++;

        if (onProgress) onProgress({ ...progress });

        // Rate limiting - API'leri yormamak için
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const genre = await fetchGenreForItem(item.title, item.type);

            if (genre) {
                if (!dryRun) {
                    await updateDoc(doc(db, 'mediaItems', item.id), { genre });
                }
                progress.updated++;
            } else {
                progress.skipped++;
            }
        } catch (error) {
            console.error(`Migration error for "${item.title}":`, error);
            progress.failed++;
        }

        if (onProgress) onProgress({ ...progress });
    }

    progress.currentItem = '';
    if (onProgress) onProgress({ ...progress });

    return progress;
}
