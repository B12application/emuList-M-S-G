// src/backend/services/userProfileService.ts
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { MediaItem, MediaType, FilterStatus } from '../types/media';

export interface PublicUserProfile {
    userId: string;
    displayName: string;
    photoURL?: string;
    email?: string;
    createdAt?: Timestamp;
    bio?: string;
    location?: string;
    gender?: 'male' | 'female';
    socialLinks?: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        instagram?: string;
        website?: string;
    };
}

export interface UserStats {
    totalCount: number;
    movieCount: number;
    seriesCount: number;
    gameCount: number;
    bookCount: number;
    watchedCount: number;
    readCount: number;
    playedCount: number;
}

/**
 * Get public user profile information
 */
export async function getUserProfile(userId: string): Promise<PublicUserProfile | null> {
    try {
        // Fetch from users collection if it exists
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                userId,
                displayName: data.displayName || data.email?.split('@')[0] || 'User',
                photoURL: data.photoURL || data.avatarUrl,
                email: data.email,
                createdAt: data.createdAt,
                bio: data.bio,
                location: data.location,
                gender: data.gender,
                socialLinks: data.socialLinks,
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Get user's media items with optional filtering
 */
export async function getUserMediaItems(
    userId: string,
    type?: MediaType,
    filterStatus?: FilterStatus
): Promise<MediaItem[]> {
    try {
        let q = query(
            collection(db, 'mediaItems'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        let items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MediaItem));

        // Apply type filter
        if (type && (type as string) !== 'all') {
            items = items.filter(item => item.type === type);
        }

        // Apply status filter
        if (filterStatus === 'watched') {
            items = items.filter(item => item.watched === true);
        } else if (filterStatus === 'not-watched') {
            items = items.filter(item => item.watched === false);
        } else if (filterStatus && filterStatus === 'favorites') {
            items = items.filter(item => item.isFavorite === true);
        }

        return items;
    } catch (error) {
        console.error('Error fetching user media items:', error);
        return [];
    }
}

/**
 * Get user's statistics
 */
export async function getUserStats(userId: string): Promise<UserStats> {
    try {
        const q = query(
            collection(db, 'mediaItems'),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => doc.data() as MediaItem);

        const stats: UserStats = {
            totalCount: items.length,
            movieCount: items.filter(item => item.type === 'movie').length,
            seriesCount: items.filter(item => item.type === 'series').length,
            gameCount: items.filter(item => item.type === 'game').length,
            bookCount: items.filter(item => item.type === 'book').length,
            watchedCount: items.filter(item => item.type === 'movie' && item.watched).length +
                items.filter(item => item.type === 'series' && item.watched).length,
            readCount: items.filter(item => item.type === 'book' && item.watched).length,
            playedCount: items.filter(item => item.type === 'game' && item.watched).length,
        };

        return stats;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return {
            totalCount: 0,
            movieCount: 0,
            seriesCount: 0,
            gameCount: 0,
            bookCount: 0,
            watchedCount: 0,
            readCount: 0,
            playedCount: 0,
        };
    }
}
