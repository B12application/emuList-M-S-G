// src/backend/services/rawgApi.ts

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

export interface RAWGGameResult {
    id: number;
    slug: string;
    name: string;
    released: string;
    tba: boolean;
    background_image: string;
    rating: number;
    rating_top: number;
    ratings: Record<string, any>[];
    ratings_count: number;
    reviews_text_count: number;
    added: number;
    added_by_status: Record<string, any>;
    metacritic: number;
    playtime: number;
    suggestions_count: number;
    updated: string;
    esrb_rating: { id: number; name: string; slug: string } | null;
    platforms: Array<{ platform: { id: number; name: string; slug: string } }>;
}

export interface RAWGSearchResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: RAWGGameResult[];
}

export interface RAWGGameDetails extends RAWGGameResult {
    description: string;
    description_raw: string;
    metacritic_platforms: Array<{ metascore: number; url: string; platform: { platform: number; name: string; slug: string } }>;
    background_image_additional: string;
    website: string;
    alternative_names: string[];
    metacritic_url: string;
    parents_count: number;
    additions_count: number;
    game_series_count: number;
    publishers: Array<{ id: number; name: string; slug: string; image_background: string }>;
    developers: Array<{ id: number; name: string; slug: string; image_background: string }>;
    genres: Array<{ id: number; name: string; slug: string; image_background: string }>;
    tags: Array<{ id: number; name: string; slug: string; language: string; games_count: number; image_background: string }>;
}

/**
 * Searches for games using RAWG API
 * @param query Search term
 * @returns List of games found
 */
export async function searchGames(query: string): Promise<RAWGGameResult[]> {
    if (!API_KEY) {
        throw new Error('RAWG API key not found. Please check .env file.');
    }

    if (!query.trim()) {
        return [];
    }

    const params = new URLSearchParams({
        key: API_KEY,
        search: query.trim(),
        page_size: '10', // Limit to 10 results
    });

    try {
        const response = await fetch(`${BASE_URL}/games?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`RAWG API Error: ${response.statusText}`);
        }
        const data: RAWGSearchResponse = await response.json();
        return data.results || [];
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An error occurred while searching for games.');
    }
}

/**
 * Fetches game details by ID
 * @param id Game ID
 * @returns Game details
 */
export async function getGameById(id: number): Promise<RAWGGameDetails> {
    if (!API_KEY) {
        throw new Error('RAWG API key not found. Please check .env file.');
    }

    try {
        const response = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`RAWG API Error: ${response.statusText}`);
        }
        const data: RAWGGameDetails = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An error occurred while fetching game details.');
    }
}

/**
 * Normalizes RAWG rating (0-5) to 0-9.9 scale
 * @param rating RAWG rating (0-5)
 * @returns Normalized rating string (0-9.9)
 */
export function normalizeGameRating(rating: number): string {
    if (!rating) return '0';
    // RAWG is 5 stars, we map to ~10
    const normalized = Math.min(rating * 2, 9.9);
    return normalized.toFixed(1);
}
