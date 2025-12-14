// src/backend/services/userSearchService.ts
import {
    collection,
    query,
    getDocs,
    limit,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface SearchableUser {
    userId: string;
    displayName: string;
    email?: string;
    photoURL?: string;
}

/**
 * Search users by display name (case-insensitive partial match)
 * Note: Firestore doesn't support full-text search natively,
 * so we fetch all users and filter on client side for now.
 * For production, consider using Algolia or similar service.
 */
export async function searchUsersByName(searchTerm: string, limitCount: number = 20): Promise<SearchableUser[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('displayName'), limit(100)); // Fetch more for client-side filtering

        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(doc => ({
            userId: doc.id,
            displayName: doc.data().displayName || doc.data().email?.split('@')[0] || 'User',
            email: doc.data().email,
            photoURL: doc.data().photoURL,
        }));

        // Client-side case-insensitive filtering
        const searchLower = searchTerm.toLowerCase();
        const filtered = users.filter(user =>
            user.displayName.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        );

        return filtered.slice(0, limitCount);
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

/**
 * Get all users (for discovery/suggestions)
 */
export async function getAllUsers(limitCount: number = 50): Promise<SearchableUser[]> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('displayName'), limit(limitCount));

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            userId: doc.id,
            displayName: doc.data().displayName || doc.data().email?.split('@')[0] || 'User',
            email: doc.data().email,
            photoURL: doc.data().photoURL,
        }));
    } catch (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
}

/**
 * Get suggested users (exclude current user)
 */
export async function getSuggestedUsers(currentUserId: string, limitCount: number = 10): Promise<SearchableUser[]> {
    try {
        const allUsers = await getAllUsers(limitCount + 1);
        return allUsers.filter(user => user.userId !== currentUserId).slice(0, limitCount);
    } catch (error) {
        console.error('Error fetching suggested users:', error);
        return [];
    }
}
