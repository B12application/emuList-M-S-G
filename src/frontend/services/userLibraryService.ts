// src/frontend/services/userLibraryService.ts
// Service and hook for checking if a movie/show is in the user's library and adding it directly

import { useQuery } from '@tanstack/react-query';
import { db, auth } from '../../backend/config/firebaseConfig';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import type { MediaItem, MediaType, CastMember } from '../../backend/types/media';
import { normalizeMediaTitle } from '../../backend/services/mediaDeduplicationService';
import {
    getTMDBDetails,
    getTMDBPosterUrl,
    normalizeTMDBRating,
    type TMDBPersonCreditItem
} from '../../backend/services/tmdbApi';
import { createActivity } from '../../backend/services/activityService';
import { getAllSeriesEpisodeCounts } from '../../backend/services/omdbApi';
import { saveEpisodesPerSeason } from '../../backend/services/episodeTrackingService';

/**
 * Hook to retrieve user's entire library index for fast O(1)/in-memory duplicate checking
 */
export function useUserLibraryLookup() {
    const currentUserId = auth.currentUser?.uid;

    const { data: libraryItems = [], isLoading, refetch } = useQuery({
        queryKey: ['userAllLibraryItems', currentUserId],
        queryFn: async () => {
            if (!currentUserId) return [];
            const q = query(
                collection(db, 'mediaItems'),
                where('userId', '==', currentUserId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MediaItem));
        },
        enabled: !!currentUserId,
        staleTime: 60 * 1000,
    });

    const isItemInLibrary = (
        title?: string,
        originalTitle?: string,
        imdbId?: string
    ): boolean => {
        if (!title && !imdbId) return false;

        const targetNormalized = normalizeMediaTitle(title || '');
        const targetOriginal = originalTitle ? normalizeMediaTitle(originalTitle) : '';
        const targetImdb = (imdbId || '').trim().toLowerCase();

        return libraryItems.some(item => {
            // 1. IMDb ID match
            if (targetImdb && item.imdbId && item.imdbId.trim().toLowerCase() === targetImdb) {
                return true;
            }
            // 2. Normalized title match
            const itemTitleNorm = normalizeMediaTitle(item.title || '');
            if (itemTitleNorm && targetNormalized && itemTitleNorm === targetNormalized) {
                return true;
            }
            // 3. Original title match
            if (targetOriginal && itemTitleNorm && itemTitleNorm === targetOriginal) {
                return true;
            }
            return false;
        });
    };

    return { libraryItems, isItemInLibrary, isLoading, refetch };
}

/**
 * Adds a media item directly from TMDb Person Credit to user's library
 */
export async function addMediaFromTMDB(
    userId: string,
    userDisplayName: string,
    userPhotoUrl: string,
    creditItem: TMDBPersonCreditItem
): Promise<MediaItem> {
    const targetType: MediaType = creditItem.media_type === 'tv' ? 'series' : 'movie';
    const fallbackTitle = creditItem.title || creditItem.name || 'Untitled';

    // 1. Fetch detailed metadata from TMDb (genres, runtime/seasons, imdb_id, cast)
    let detailedData: any = null;
    try {
        detailedData = await getTMDBDetails(creditItem.id, targetType, 'tr-TR');
    } catch {
        // Fallback to English if Turkish fetch fails
        try {
            detailedData = await getTMDBDetails(creditItem.id, targetType, 'en-US');
        } catch (e) {
            console.warn('TMDb detayları alınamadı, creditItem verisi kullanılacak:', e);
        }
    }

    const title = detailedData?.title || detailedData?.name || fallbackTitle;
    const posterPath = detailedData?.poster_path || creditItem.poster_path;
    const overview = detailedData?.overview || creditItem.overview || '';
    const voteAverage = detailedData?.vote_average ?? creditItem.vote_average ?? 0;
    const releaseDate = detailedData?.release_date || detailedData?.first_air_date || creditItem.release_date || creditItem.first_air_date || '';
    const genres = detailedData?.genres ? detailedData.genres.map((g: any) => g.name) : [];
    const imdbId = detailedData?.external_ids?.imdb_id || undefined;
    const totalSeasons = targetType === 'series' && detailedData?.number_of_seasons ? detailedData.number_of_seasons : undefined;
    const runtime = detailedData?.runtime ? `${detailedData.runtime} min` : undefined;

    // Top cast from details
    const cast: CastMember[] = (detailedData?.credits?.cast || []).slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path,
        order: c.order,
        popularity: c.popularity
    }));

    const actors = cast.map(c => c.name);

    const newItem: any = {
        title: title.trim(),
        type: targetType,
        rating: normalizeTMDBRating(voteAverage),
        image: getTMDBPosterUrl(posterPath),
        description: overview.trim(),
        watched: false,
        createdAt: serverTimestamp(),
        userId: userId,
        genre: genres.length > 0 ? genres.join(', ') : '',
        tags: [],
        releaseDate: releaseDate,
        runtime: runtime,
        imdbId: imdbId,
        cast: cast.length > 0 ? cast : undefined,
        actors: actors.length > 0 ? actors : undefined
    };

    if (targetType === 'series' && totalSeasons) {
        newItem.totalSeasons = totalSeasons;
        newItem.watchedSeasons = [];
    }

    // 2. Save to Firestore
    const docRef = await addDoc(collection(db, 'mediaItems'), newItem);

    // 3. If series with IMDb ID, fetch episode counts in background
    if (targetType === 'series' && imdbId && totalSeasons) {
        getAllSeriesEpisodeCounts(imdbId, totalSeasons)
            .then(episodesPerSeason => {
                if (Object.keys(episodesPerSeason).length > 0) {
                    saveEpisodesPerSeason(docRef.id, episodesPerSeason);
                }
            })
            .catch(err => console.warn('Bölüm verisi çekilemedi:', err));
    }

    // 4. Create Activity
    try {
        await createActivity(userId, userDisplayName || 'User', userPhotoUrl || '', 'media_added', {
            ...newItem,
            id: docRef.id,
            createdAt: Timestamp.now()
        });
    } catch {
        // Non-blocking
    }

    return {
        ...newItem,
        id: docRef.id,
        createdAt: Timestamp.now()
    } as MediaItem;
}
