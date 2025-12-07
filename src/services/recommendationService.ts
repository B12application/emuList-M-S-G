// src/services/recommendationService.ts
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Recommendation, RecommendationInput, RecommendationCategory } from '../types/recommendation';

const RECOMMENDATIONS_COLLECTION = 'recommendations';

/**
 * Fetch all recommendations from Firestore
 */
export async function fetchRecommendations(): Promise<Recommendation[]> {
    try {
        const q = query(
            collection(db, RECOMMENDATIONS_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Recommendation[];
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

/**
 * Fetch recommendations filtered by category
 */
export async function fetchRecommendationsByCategory(
    category: RecommendationCategory
): Promise<Recommendation[]> {
    try {
        const q = query(
            collection(db, RECOMMENDATIONS_COLLECTION),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Recommendation[];
    } catch (error) {
        console.error('Error fetching recommendations by category:', error);
        return [];
    }
}

/**
 * Add a new recommendation to Firestore
 */
export async function addRecommendation(data: RecommendationInput): Promise<string | null> {
    try {
        const docRef = await addDoc(collection(db, RECOMMENDATIONS_COLLECTION), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding recommendation:', error);
        return null;
    }
}

/**
 * Update an existing recommendation
 */
export async function updateRecommendation(
    id: string,
    data: Partial<RecommendationInput>
): Promise<boolean> {
    try {
        const docRef = doc(db, RECOMMENDATIONS_COLLECTION, id);
        await updateDoc(docRef, data);
        return true;
    } catch (error) {
        console.error('Error updating recommendation:', error);
        return false;
    }
}

/**
 * Delete a recommendation
 */
export async function deleteRecommendation(id: string): Promise<boolean> {
    try {
        const docRef = doc(db, RECOMMENDATIONS_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        return false;
    }
}

/**
 * Group recommendations by category
 */
export function groupRecommendationsByCategory(
    recommendations: Recommendation[]
): Record<RecommendationCategory, Recommendation[]> {
    const grouped: Record<RecommendationCategory, Recommendation[]> = {
        'most-watched-2025': [],
        'best-movies': [],
        'award-winning': [],
        'top-series': [],
        'top-books': []
    };

    recommendations.forEach(rec => {
        if (grouped[rec.category]) {
            grouped[rec.category].push(rec);
        }
    });

    return grouped;
}
