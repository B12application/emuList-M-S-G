import { useState, useEffect } from 'react';
import { db, auth } from '../../backend/config/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
// Imports removed

// Optimize by only selecting needed fields if possible, but Firestore client doesn't support 'select' fields easily without admin SDK or specialized indexes. 
// We will fetch full docs but it's okay for per-user data volume (usually < 1000 items).

export interface HistoryItem {
    id: string;
    type: 'movie' | 'series' | 'game' | 'book';
    title: string;
    rating: string;
    watched: boolean;
    createdAt: any; // Timestamp
    isFavorite?: boolean;
}

export default function useMediaHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, "mediaItems"),
                    where("userId", "==", currentUserId),
                    orderBy("createdAt", "desc") // Get all items, sorted by date
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        type: d.type,
                        title: d.title,
                        rating: d.rating,
                        watched: d.watched,
                        createdAt: d.createdAt, // Keep as Timestamp for now, convert in component
                        isFavorite: d.isFavorite
                    } as HistoryItem;
                });

                setHistory(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return { history, loading };
}
