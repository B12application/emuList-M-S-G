// src/hooks/useMediaHistory.ts
// Refactored with React Query for caching
import { useQuery } from '@tanstack/react-query';
import { db, auth } from '../../backend/config/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface HistoryItem {
    id: string;
    type: 'movie' | 'series' | 'game' | 'book';
    title: string;
    rating: string;
    watched: boolean;
    createdAt: any; // Timestamp
    isFavorite?: boolean;
    genre?: string;
}

// Firebase'den history çeken fonksiyon
async function fetchMediaHistory(userId: string): Promise<HistoryItem[]> {
    const q = query(
        collection(db, "mediaItems"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const d = doc.data();
        return {
            id: doc.id,
            type: d.type,
            title: d.title,
            rating: d.rating,
            watched: d.watched,
            createdAt: d.createdAt,
            isFavorite: d.isFavorite,
            genre: d.genre
        } as HistoryItem;
    });
}

export default function useMediaHistory() {
    const currentUserId = auth.currentUser?.uid;

    const { data, isLoading } = useQuery({
        queryKey: ['mediaHistory', currentUserId],
        queryFn: () => fetchMediaHistory(currentUserId!),
        enabled: !!currentUserId,
        staleTime: 1000 * 60 * 5, // 5 dakika
    });

    return {
        history: data || [],
        loading: isLoading
    };
}
