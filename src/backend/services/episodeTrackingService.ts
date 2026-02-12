// src/backend/services/episodeTrackingService.ts
// Bölüm seviyesinde dizi takip servisi

import { doc, updateDoc } from 'firebase/firestore';
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
