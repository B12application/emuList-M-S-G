// src/hooks/useMediaStats.ts
import { useState, useEffect } from 'react';
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

// === DEĞİŞİKLİK BURADA ===
// Fonksiyonun başına "export" yerine "export default" ekle
export default function useMediaStats() {
  const [stats, setStats] = useState<MediaStats>({
    movieCount: 0, seriesCount: 0, gameCount: 0, bookCount: 0, totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        setStats({ movieCount: 0, seriesCount: 0, gameCount: 0, bookCount: 0, totalCount: 0 });
        return;
      }

      setLoading(true);
      try {
        const itemsRef = collection(db, "mediaItems");
        const baseQuery = query(itemsRef, where("userId", "==", user.uid));

        const movieQuery = query(baseQuery, where("type", "==", "movie"));
        const seriesQuery = query(baseQuery, where("type", "==", "series"));
        const gameQuery = query(baseQuery, where("type", "==", "game"));
        const bookQuery = query(baseQuery, where("type", "==", "book"));

        const movieSnapshot = await getCountFromServer(movieQuery);
        const seriesSnapshot = await getCountFromServer(seriesQuery);
        const gameSnapshot = await getCountFromServer(gameQuery);
        const bookSnapshot = await getCountFromServer(bookQuery);

        const movieCount = movieSnapshot.data().count;
        const seriesCount = seriesSnapshot.data().count;
        const gameCount = gameSnapshot.data().count;
        const bookCount = bookSnapshot.data().count;

        setStats({
          movieCount,
          seriesCount,
          gameCount,
          bookCount,
          totalCount: movieCount + seriesCount + gameCount + bookCount,
        });
      } catch (e) {
        console.error("İstatistikler çekilemedi: ", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  return { stats, loading };
}