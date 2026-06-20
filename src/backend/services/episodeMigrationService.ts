// src/backend/services/episodeMigrationService.ts
// Mevcut sezon verilerini bölüm takip formatına dönüştüren migrasyon servisi

import { collection, query, where, getDocs, doc, updateDoc, getCountFromServer } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getAllSeriesEpisodeCounts, getMovieById, getSeasonEpisodes } from './omdbApi';
import type { MediaItem } from '../types/media';

interface MigrationProgress {
    current: number;
    total: number;
    title: string;
}

interface MigrationResult {
    updated: number;
    skipped: number;
    failed: number;
}

/**
 * Mevcut dizilerin sezon verilerini bölüm bazlı takip formatına dönüştürür.
 * - OMDB'den bölüm sayılarını çeker (episodesPerSeason)
 * - İzlenmiş sezonları bölüm bazına çevirir (watchedEpisodes)
 * - currentSeason ve currentEpisode bilgilerini hesaplar
 */
export async function migrateToEpisodeTracking(
    userId: string,
    onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
    const result: MigrationResult = { updated: 0, skipped: 0, failed: 0 };

    // Kullanıcının tüm dizilerini çek
    const q = query(
        collection(db, 'mediaItems'),
        where('userId', '==', userId),
        where('type', '==', 'series')
    );
    const snapshot = await getDocs(q);
    const series = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as MediaItem[];

    const total = series.length;

    for (let i = 0; i < series.length; i++) {
        const show = series[i];
        onProgress?.({ current: i + 1, total, title: show.title });

        try {
            // IMDb ID yoksa atla
            if (!show.imdbId) {
                result.skipped++;
                continue;
            }

            // Zaten episodesPerSeason varsa atla
            if (show.episodesPerSeason && Object.keys(show.episodesPerSeason).length > 0) {
                result.skipped++;
                continue;
            }

            // Toplam sezon bilgisi yoksa atla
            if (!show.totalSeasons || show.totalSeasons === 0) {
                result.skipped++;
                continue;
            }

            // OMDB'den bölüm sayılarını çek
            const episodesPerSeason = await getAllSeriesEpisodeCounts(show.imdbId, show.totalSeasons);

            if (Object.keys(episodesPerSeason).length === 0) {
                result.skipped++;
                continue;
            }

            // İzlenmiş sezonları bölüm bazına çevir
            const watchedEpisodes: Record<number, number[]> = {};
            if (show.watchedSeasons && show.watchedSeasons.length > 0) {
                for (const season of show.watchedSeasons) {
                    const totalEps = episodesPerSeason[season];
                    if (totalEps) {
                        // Tüm bölümleri izlendi olarak işaretle
                        watchedEpisodes[season] = Array.from({ length: totalEps }, (_, i) => i + 1);
                    }
                }
            }

            // Son izlenen sezon ve bölümü hesapla
            let currentSeason: number | undefined;
            let currentEpisode: number | undefined;

            if (show.watchedSeasons && show.watchedSeasons.length > 0) {
                const lastWatchedSeason = Math.max(...show.watchedSeasons);
                const epsInLastSeason = episodesPerSeason[lastWatchedSeason] || 0;
                currentSeason = lastWatchedSeason;
                currentEpisode = epsInLastSeason;
            }

            // Firestore'u güncelle
            const itemRef = doc(db, 'mediaItems', show.id);
            await updateDoc(itemRef, {
                episodesPerSeason,
                watchedEpisodes,
                ...(currentSeason !== undefined && { currentSeason }),
                ...(currentEpisode !== undefined && { currentEpisode }),
            });

            result.updated++;

            // API rate limit'e takılmamak için kısa bekleme
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`Migration failed for ${show.title}:`, error);
            result.failed++;
        }
    }

    return result;
}

export interface NewSeasonCheckResult {
    updated: number;
    skipped: number;
    failed: number;
    details: string[];
}

/**
 * Kullanıcının toplam dizi sayısını getirir.
 */
export async function getSeriesCountForUser(userId: string): Promise<number> {
    const q = query(
        collection(db, 'mediaItems'),
        where('userId', '==', userId),
        where('type', '==', 'series')
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

/**
 * Mevcut diziler için yeni sezon veya yeni bölüm kontrolü yapar.
 * Eğer OMDB API'de daha fazla sezon veya mevcut sezonda daha fazla bölüm varsa veritabanını günceller.
 */
export async function checkNewSeasonsForUser(
    userId: string,
    onProgress?: (progress: MigrationProgress) => void
): Promise<NewSeasonCheckResult> {
    const result: NewSeasonCheckResult = { updated: 0, skipped: 0, failed: 0, details: [] };

    // Kullanıcının tüm dizilerini çek
    const q = query(
        collection(db, 'mediaItems'),
        where('userId', '==', userId),
        where('type', '==', 'series')
    );
    const snapshot = await getDocs(q);
    const series = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as MediaItem[];

    const total = series.length;

    for (let i = 0; i < series.length; i++) {
        const show = series[i];
        onProgress?.({ current: i + 1, total, title: show.title });

        try {
            // IMDb ID yoksa atla
            if (!show.imdbId) {
                result.skipped++;
                continue;
            }

            // OMDB'den güncel dizi bilgisini çek
            const omdbDetails = await getMovieById(show.imdbId);
            const currentTotalSeasonsStr = omdbDetails.totalSeasons;
            
            if (!currentTotalSeasonsStr || currentTotalSeasonsStr === 'N/A') {
                result.skipped++;
                continue;
            }

            const currentTotalSeasons = parseInt(currentTotalSeasonsStr, 10);
            const dbTotalSeasons = show.totalSeasons || 0;
            
            let updated = false;
            let addedSeasons = 0;
            let addedEpisodes = 0;
            const newEpisodesPerSeason = { ...(show.episodesPerSeason || {}) };

            // 1. Yeni Sezon Kontrolü
            if (currentTotalSeasons > dbTotalSeasons) {
                addedSeasons = currentTotalSeasons - dbTotalSeasons;
                // Yeni sezonların bölüm sayılarını çek
                for (let s = dbTotalSeasons + 1; s <= currentTotalSeasons; s++) {
                    const episodes = await getSeasonEpisodes(show.imdbId, s);
                    if (episodes && episodes.length > 0) {
                        newEpisodesPerSeason[s] = episodes.length;
                        addedEpisodes += episodes.length;
                    }
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                updated = true;
            }

            // 2. Mevcut Son Sezonda Yeni Bölüm Kontrolü
            // Eğer dizi bitmediyse, genelde son sezona yeni bölümler eklenir.
            if (dbTotalSeasons > 0 && currentTotalSeasons >= dbTotalSeasons) {
                const latestDbSeason = dbTotalSeasons;
                const episodes = await getSeasonEpisodes(show.imdbId, latestDbSeason);
                if (episodes && episodes.length > 0) {
                    const currentEpisodesCount = episodes.length;
                    const dbEpisodesCount = newEpisodesPerSeason[latestDbSeason] || 0;
                    
                    if (currentEpisodesCount > dbEpisodesCount) {
                        const diff = currentEpisodesCount - dbEpisodesCount;
                        addedEpisodes += diff;
                        newEpisodesPerSeason[latestDbSeason] = currentEpisodesCount;
                        updated = true;
                    }
                }
            }

            if (updated) {
                // Firestore'u güncelle
                const itemRef = doc(db, 'mediaItems', show.id);
                await updateDoc(itemRef, {
                    totalSeasons: currentTotalSeasons,
                    episodesPerSeason: newEpisodesPerSeason
                });

                result.updated++;
                
                // Detay string'ini oluştur
                let detailStr = `${show.title} için`;
                if (addedSeasons > 0) {
                    detailStr += ` ${addedSeasons} yeni sezon`;
                }
                if (addedSeasons > 0 && addedEpisodes > 0) detailStr += ` ve`;
                if (addedEpisodes > 0) {
                    detailStr += ` ${addedEpisodes} yeni bölüm`;
                }
                detailStr += ` eklendi.`;
                result.details.push(detailStr);
            } else {
                result.skipped++;
            }

            // API rate limit'e takılmamak için bekleme
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`Season check failed for ${show.title}:`, error);
            result.failed++;
        }
    }

    return result;
}
