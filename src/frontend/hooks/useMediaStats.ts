// src/hooks/useMediaStats.ts
// Refactored with React Query for caching
import { useQuery } from '@tanstack/react-query';
import { db } from '../../backend/config/firebaseConfig';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface MediaStats {
  movieCount: number;
  seriesCount: number;
  gameCount: number;
  bookCount: number;
  totalCount: number;
}

// Firebase'den istatistikleri çeken fonksiyon
async function fetchMediaStats(userId: string): Promise<MediaStats> {
  const itemsRef = collection(db, "mediaItems");
  const baseQuery = query(itemsRef, where("userId", "==", userId));

  // Paralel sorgular - daha hızlı
  const [movieSnapshot, seriesSnapshot, gameSnapshot, bookSnapshot] = await Promise.all([
    getCountFromServer(query(baseQuery, where("type", "==", "movie"))),
    getCountFromServer(query(baseQuery, where("type", "==", "series"))),
    getCountFromServer(query(baseQuery, where("type", "==", "game"))),
    getCountFromServer(query(baseQuery, where("type", "==", "book"))),
  ]);

  const movieCount = movieSnapshot.data().count;
  const seriesCount = seriesSnapshot.data().count;
  const gameCount = gameSnapshot.data().count;
  const bookCount = bookSnapshot.data().count;

  return {
    movieCount,
    seriesCount,
    gameCount,
    bookCount,
    totalCount: movieCount + seriesCount + gameCount + bookCount,
  };
}

export default function useMediaStats() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['mediaStats', user?.uid],
    queryFn: () => fetchMediaStats(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // 5 dakika - stats sık değişmez
  });

  const stats = data || {
    movieCount: 0,
    seriesCount: 0,
    gameCount: 0,
    bookCount: 0,
    totalCount: 0,
  };

  return { stats, loading: isLoading };
}