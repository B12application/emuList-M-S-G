// src/backend/services/episodeTrackingService.ts
// Bölüm seviyesinde dizi takip servisi

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { MediaItem } from '../types/media';

/**
 * Tek bir bölümü izlendi/izlenmedi olarak işaretle
 */
export async function toggleEpisodeWatched(
    mediaId: string,
    season: number,
    episode: number,
    currentWatchedEpisodes: Record<number, number[]> = {}
): Promise<Record<number, number[]>> {
    const seasonEpisodes = currentWatchedEpisodes[season] || [];
    let newSeasonEpisodes: number[];

    if (seasonEpisodes.includes(episode)) {
        newSeasonEpisodes = seasonEpisodes.filter(e => e !== episode);
    } else {
        newSeasonEpisodes = [...seasonEpisodes, episode].sort((a, b) => a - b);
    }

    const newWatchedEpisodes = {
        ...currentWatchedEpisodes,
        [season]: newSeasonEpisodes,
    };

    // Boş sezon dizilerini temizle
    if (newSeasonEpisodes.length === 0) {
        delete newWatchedEpisodes[season];
    }

    await updateDoc(doc(db, 'mediaItems', mediaId), {
        watchedEpisodes: newWatchedEpisodes,
        lastWatchedAt: serverTimestamp(),
    });

    return newWatchedEpisodes;
}

/**
 * Bir sezonun tüm bölümlerini izlendi olarak işaretle
 */
export async function markAllEpisodesInSeason(
    mediaId: string,
    season: number,
    totalEpisodes: number,
    currentWatchedEpisodes: Record<number, number[]> = {}
): Promise<Record<number, number[]>> {
    const allEpisodes = Array.from({ length: totalEpisodes }, (_, i) => i + 1);

    const newWatchedEpisodes = {
        ...currentWatchedEpisodes,
        [season]: allEpisodes,
    };

    await updateDoc(doc(db, 'mediaItems', mediaId), {
        watchedEpisodes: newWatchedEpisodes,
        lastWatchedAt: serverTimestamp(),
    });

    return newWatchedEpisodes;
}

/**
 * Bir sezonun tüm bölümlerini izlenmedi olarak işaretle
 */
export async function clearSeasonEpisodes(
    mediaId: string,
    season: number,
    currentWatchedEpisodes: Record<number, number[]> = {}
): Promise<Record<number, number[]>> {
    const newWatchedEpisodes = { ...currentWatchedEpisodes };
    delete newWatchedEpisodes[season];

    await updateDoc(doc(db, 'mediaItems', mediaId), {
        watchedEpisodes: newWatchedEpisodes,
    });

    return newWatchedEpisodes;
}

/**
 * "Kaldığım yer" bilgisini güncelle
 */
export async function updateCurrentProgress(
    mediaId: string,
    season: number,
    episode: number
): Promise<void> {
    await updateDoc(doc(db, 'mediaItems', mediaId), {
        currentSeason: season,
        currentEpisode: episode,
        lastWatchedAt: serverTimestamp(),
    });
}

/**
 * Bir dizinin genel izleme ilerlemesini hesapla
 */
export function getSeriesProgress(item: MediaItem): {
    totalWatched: number;
    totalEpisodes: number;
    percentage: number;
} {
    const watchedEpisodes = item.watchedEpisodes || {};
    const episodesPerSeason = item.episodesPerSeason || {};

    let totalWatched = 0;
    let totalEpisodes = 0;

    for (const season of Object.keys(episodesPerSeason)) {
        const seasonNum = Number(season);
        totalEpisodes += episodesPerSeason[seasonNum];
        totalWatched += (watchedEpisodes[seasonNum] || []).length;
    }

    return {
        totalWatched,
        totalEpisodes,
        percentage: totalEpisodes > 0 ? Math.round((totalWatched / totalEpisodes) * 100) : 0,
    };
}

/**
 * episodesPerSeason verisini Firestore'a kaydet
 */
export async function saveEpisodesPerSeason(
    mediaId: string,
    episodesPerSeason: Record<number, number>
): Promise<void> {
    await updateDoc(doc(db, 'mediaItems', mediaId), {
        episodesPerSeason,
    });
}

/**
 * Mark a series as fully watched across all seasons and episodes.
 */
export async function markSeriesFullyWatched(item: MediaItem): Promise<void> {
    if (!item.id || item.type !== 'series') return;

    const totalSeasons = item.totalSeasons || 0;
    const episodesPerSeason = item.episodesPerSeason || {};
    const watchedSeasons = Array.from({ length: totalSeasons }, (_, i) => i + 1);
    
    const watchedEpisodes: Record<number, number[]> = {};
    let lastEpisode = 1;

    for (const season of watchedSeasons) {
        const epsInSeason = episodesPerSeason[season] || 0;
        if (epsInSeason > 0) {
            watchedEpisodes[season] = Array.from({ length: epsInSeason }, (_, i) => i + 1);
            if (season === totalSeasons) {
                lastEpisode = epsInSeason;
            }
        }
    }

    await updateDoc(doc(db, 'mediaItems', item.id), {
        watched: true,
        watchedSeasons,
        watchedEpisodes,
        currentSeason: totalSeasons > 0 ? totalSeasons : 1,
        currentEpisode: lastEpisode,
        lastWatchedAt: serverTimestamp(),
    });
}

/**
 * Mark a series as unwatched completely.
 */
export async function markSeriesUnwatched(item: MediaItem): Promise<void> {
    if (!item.id || item.type !== 'series') return;

    await updateDoc(doc(db, 'mediaItems', item.id), {
        watched: false,
        watchedSeasons: [],
        watchedEpisodes: {},
        currentSeason: 1,
        currentEpisode: 1,
    });
}

/**
 * Mark a series up to a specific episode in a season.
 */
export async function markSeriesUpToEpisode(
    item: MediaItem,
    targetSeason: number,
    targetEpisode: number
): Promise<void> {
    if (!item.id || item.type !== 'series') return;

    const episodesPerSeason = item.episodesPerSeason || {};
    const watchedEpisodes: Record<number, number[]> = {};
    const watchedSeasons: number[] = [];

    for (let s = 1; s <= (item.totalSeasons || 0); s++) {
        if (s < targetSeason) {
            const epsInSeason = episodesPerSeason[s] || 0;
            if (epsInSeason > 0) {
                watchedEpisodes[s] = Array.from({ length: epsInSeason }, (_, i) => i + 1);
                watchedSeasons.push(s);
            }
        } else if (s === targetSeason) {
            if (targetEpisode > 0) {
                watchedEpisodes[s] = Array.from({ length: targetEpisode }, (_, i) => i + 1);
                if (targetEpisode === (episodesPerSeason[s] || 0)) {
                    watchedSeasons.push(s);
                }
            }
            break;
        }
    }

    const isFullyWatched = watchedSeasons.length === (item.totalSeasons || 0) && (item.totalSeasons || 0) > 0;

    await updateDoc(doc(db, 'mediaItems', item.id), {
        watched: isFullyWatched,
        watchedSeasons,
        watchedEpisodes,
        currentSeason: targetSeason,
        currentEpisode: targetEpisode,
        lastWatchedAt: serverTimestamp(),
    });
}
