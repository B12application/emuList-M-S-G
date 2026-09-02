// src/backend/services/tmdbApi.ts

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

export interface TMDBMovieDetails {
    id: number;
    title?: string;
    name?: string;
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

    if (!query.trim()) {
        return [];
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
        throw new Error('TMDB ile arama yapılırken bir hata oluştu');
    }
}

/**
 * Fetches detailed info for a movie or TV series by TMDB ID
 */
export async function getTMDBDetails(
    id: number | string,
    type: 'movie' | 'series',
    language: string = 'en-US'
): Promise<TMDBMovieDetails> {
    if (!API_KEY) {
        throw new Error('TMDB API key bulunamadı. Lütfen .env dosyasını kontrol edin.');
    }

    const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const params = new URLSearchParams({
        api_key: API_KEY,
        language: language,
        append_to_response: 'external_ids',
    });

    try {
        const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`TMDB API Hatası: ${response.statusText}`);
        }

        const data: TMDBMovieDetails = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('TMDB detayları getirilirken bir hata oluştu');
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


