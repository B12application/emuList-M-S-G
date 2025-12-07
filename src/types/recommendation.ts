// src/types/recommendation.ts
import type { Timestamp } from 'firebase/firestore';

export type RecommendationCategory =
    | 'most-watched-2025'
    | 'best-movies'
    | 'award-winning'
    | 'top-series'
    | 'top-books';

export type RecommendationType = 'movie' | 'series' | 'book';

export interface Recommendation {
    id: string;
    title: string;
    rating: string;
    image: string;
    type: RecommendationType;
    category: RecommendationCategory;
    award?: string; // For award-winning films
    author?: string; // For books
    description?: string;
    createdAt: Timestamp;
}

export interface RecommendationInput {
    title: string;
    rating: string;
    image: string;
    type: RecommendationType;
    category: RecommendationCategory;
    award?: string;
    author?: string;
    description?: string;
}
