// src/hooks/useMediaStats.ts
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

interface MediaStats {
  movieCount: number;
  seriesCount: number;
  gameCount: number;
  totalCount: number;
}

export default function useMediaStats() {
  const [stats, setStats] = useState<MediaStats>({
    movieCount: 0,
    seriesCount: 0,
    gameCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const itemsRef = collection(db, "mediaItems");
        
        // Her tip için ayrı ayrı sayım sorguları atıyoruz
        const movieQuery = query(itemsRef, where("type", "==", "movie"));
        const seriesQuery = query(itemsRef, where("type", "==", "series"));
        const gameQuery = query(itemsRef, where("type", "==", "game"));

        const movieSnapshot = await getCountFromServer(movieQuery);
        const seriesSnapshot = await getCountFromServer(seriesQuery);
        const gameSnapshot = await getCountFromServer(gameQuery);
        
        const movieCount = movieSnapshot.data().count;
        const seriesCount = seriesSnapshot.data().count;
        const gameCount = gameSnapshot.data().count;

        setStats({
          movieCount,
          seriesCount,
          gameCount,
          totalCount: movieCount + seriesCount + gameCount,
        });
      } catch (e) {
        console.error("İstatistikler çekilemedi: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}