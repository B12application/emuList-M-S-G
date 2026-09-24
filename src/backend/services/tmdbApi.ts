// src/backend/services/tmdbApi.ts

import { getCachedApiResponse, setCachedApiResponse, getOrFetchWithRedisCache, trackApiCall } from './apiQuotaService';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

export interface TMDBMovieResult {
    id: number;
    title?: string; // Movies use title
    name?: string; // TV series use name
    original_title?: string;
    original_name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string; // Movie release date
    first_air_date?: string; // TV series first air date
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
}

export interface TMDBSearchResponse {
    page: number;
    results: TMDBMovieResult[];
    total_pages: number;
    total_results: number;
}

export interface TMDBGenre {
    id: number;
    name: string;
}

export interface TMDBCastMember {
    id: number;
    name: string;
    original_name?: string;
    character: string;
    profile_path: string | null;
    order: number;
    popularity?: number;
}

export interface TMDBMovieDetails {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    runtime?: number;
    episode_run_time?: number[];
    vote_average: number;
    genres: TMDBGenre[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    external_ids?: {
        imdb_id?: string | null;
    };
    credits?: {
        cast: TMDBCastMember[];
    };
}

export interface TMDBPersonCreditItem {
    id: number;
    title?: string; // Movies use title
    name?: string; // TV series use name
    original_title?: string;
    original_name?: string;
    character?: string;
    media_type: 'movie' | 'tv';
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    overview: string;
    genre_ids?: number[];
}

export interface TMDBPersonCombinedCredits {
    id: number;
    cast: TMDBPersonCreditItem[];
}

export interface TMDBPersonDetails {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
}

/**
 * Gets full poster URL from relative TMDB poster path (defaults to optimized w342)
 */
export function getTMDBPosterUrl(
    posterPath: string | null,
    size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'
): string {
    if (!posterPath) return '';
    return `${IMAGE_BASE_URL}${size}${posterPath}`;
}

/**
 * Gets full profile/actor image URL from relative TMDB profile path
 */
export function getTMDBProfileUrl(
    profilePath: string | null,
    size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'
): string {
    if (!profilePath) return '';
    return `${IMAGE_BASE_URL}${size}${profilePath}`;
}

/**
 * Normalizes TMDB rating (0-10 scale) to 0-9.9 scale string
 */
export function normalizeTMDBRating(rating: number): string {
    if (!rating) return '0';
    if (rating >= 10) return '9.9';
    return rating.toFixed(1);
}

/**
 * Searches for movies or TV series on TMDB with configurable language support (defaults to 'tr-TR' for manual Turkish searches, or 'en-US')
 */
export async function searchTMDB(
    query: string,
    type: 'movie' | 'series',
    language: string = 'tr-TR'
): Promise<TMDBMovieResult[]> {
    if (!API_KEY) {
        throw new Error('TMDB API key bulunamadı. Lütfen .env dosyasını kontrol edin.');
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `tmdb_search_${type}_${language}_${normalizedQuery}`;
    const cached = getCachedApiResponse<TMDBMovieResult[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
    const params = new URLSearchParams({
        api_key: API_KEY,
        query: query.trim(),
        language: language,
        include_adult: 'false',
        page: '1',
    });

    try {
        trackApiCall('tmdb');
        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`TMDB API Hatası: ${response.statusText}`);
        }

        const data: TMDBSearchResponse = await response.json();
        const results = data.results || [];
        setCachedApiResponse(cacheKey, results, 24 * 60 * 60 * 1000); // 24 hours
        return results;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('TMDB ile arama yapılırken bir hata oluştu');
    }
}

/**
 * Fetches detailed info for a movie or TV series by TMDB ID, including credits (cast)
 */
export async function getTMDBDetails(
    id: number | string,
    type: 'movie' | 'series',
    language: string = 'en-US'
): Promise<TMDBMovieDetails> {
    const cacheKey = `tmdb_details_${type}_${id}_${language}`;
    const cached = getCachedApiResponse<TMDBMovieDetails>(cacheKey);
    if (cached) {
        return cached;
    }

    const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const params = new URLSearchParams({
        api_key: API_KEY,
        language: language,
        append_to_response: 'external_ids,credits',
    });

    try {
        trackApiCall('tmdb');
        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`TMDB API Hatası: ${response.statusText}`);
        }

        const data: TMDBMovieDetails = await response.json();
        setCachedApiResponse(cacheKey, data, 7 * 24 * 60 * 60 * 1000); // 7 days
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('TMDB detayları getirilirken bir hata oluştu');
    }
}

/**
 * Fetches actor / person details by TMDB Person ID
 */
export async function getPersonDetails(
    personId: number,
    language: string = 'en-US'
): Promise<TMDBPersonDetails> {
    const cacheKey = `tmdb_person_details_${personId}_${language}`;
    return getOrFetchWithRedisCache(cacheKey, async () => {
        trackApiCall('tmdb');
        const response = await fetch(`${BASE_URL}/person/${personId}?api_key=${API_KEY}&language=${language}`);
        if (!response.ok) {
            throw new Error(`TMDB Kişi Detayı Hatası: ${response.statusText}`);
        }
        return await response.json();
    }, 14 * 24 * 60 * 60 * 1000);
}

/**
 * Fetches all movie and TV series credits for a person, combined
 */
export async function getPersonCombinedCredits(
    personId: number,
    language: string = 'en-US'
): Promise<TMDBPersonCreditItem[]> {
    if (!API_KEY) {
        throw new Error('TMDB API key bulunamadı.');
    }

    const cacheKey = `tmdb_person_credits_${personId}_${language}`;
    return getOrFetchWithRedisCache(cacheKey, async () => {
        trackApiCall('tmdb');
        const response = await fetch(`${BASE_URL}/person/${personId}/combined_credits?api_key=${API_KEY}&language=${language}`);
        if (!response.ok) {
            throw new Error(`TMDB Filmografi Hatası: ${response.statusText}`);
        }
        const data: TMDBPersonCombinedCredits = await response.json();
        return data.cast || [];
    }, 14 * 24 * 60 * 60 * 1000);
}

/**
 * Fetches cast for a media item using either IMDb ID or title & media type
 */
export async function getMediaCreditsByImdbOrTitle(
    imdbId?: string,
    title?: string,
    type: 'movie' | 'series' = 'movie',
    language: string = 'en-US'
): Promise<TMDBCastMember[]> {
    if (!API_KEY) return [];

    const normKey = (imdbId || title || '').trim().toLowerCase();
    const cacheKey = `tmdb_media_credits_${normKey}_${type}_${language}`;
    const cached = getCachedApiResponse<TMDBCastMember[]>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        // 1. IMDb ID ile ara
        if (imdbId && imdbId.startsWith('tt')) {
            trackApiCall('tmdb');
            const findUrl = `${BASE_URL}/find/${imdbId}?api_key=${API_KEY}&external_source=imdb_id&language=${language}`;
            const findRes = await fetch(findUrl);
            if (findRes.ok) {
                const findData = await findRes.json();
                const matchedMovie = findData.movie_results?.[0];
                const matchedTv = findData.tv_results?.[0];
                const target = type === 'series' ? (matchedTv || matchedMovie) : (matchedMovie || matchedTv);

                if (target?.id) {
                    const details = await getTMDBDetails(target.id, matchedTv && !matchedMovie ? 'series' : type, language);
                    if (details.credits?.cast?.length) {
                        setCachedApiResponse(cacheKey, details.credits.cast, 14 * 24 * 60 * 60 * 1000);
                        return details.credits.cast;
                    }
                }
            }
        }

        // 2. Başlık ile ara
        if (title && title.trim()) {
            const searchResults = await searchTMDB(title.trim(), type, language);
            if (searchResults.length > 0) {
                const firstId = searchResults[0].id;
                const details = await getTMDBDetails(firstId, type, language);
                if (details.credits?.cast?.length) {
                    setCachedApiResponse(cacheKey, details.credits.cast, 14 * 24 * 60 * 60 * 1000);
                    return details.credits.cast;
                }
            }
        }

        return [];
    } catch (err) {
        console.warn('getMediaCreditsByImdbOrTitle hatası:', err);
        return [];
    }
}

/**
 * Fetches trending movies or TV series from TMDB (defaults to English / Global 'en-US')
 * type: 'movie' | 'series'
 * timeWindow: 'day' | 'week'
 */
export async function getTMDBTrending(
    type: 'movie' | 'series',
    timeWindow: 'day' | 'week' = 'week',
    language: string = 'en-US'
): Promise<TMDBMovieResult[]> {
    if (!API_KEY) {
        throw new Error('TMDB API key bulunamadı. Lütfen .env dosyasını kontrol edin.');
    }

    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const endpoint = `/trending/${mediaType}/${timeWindow}`;
    const params = new URLSearchParams({
        api_key: API_KEY,
        language: language,
    });

    try {
        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`TMDB API Hatası: ${response.statusText}`);
        }

        const data: TMDBSearchResponse = await response.json();
        return data.results || [];
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('TMDB trend verileri getirilirken bir hata oluştu');
    }
}


