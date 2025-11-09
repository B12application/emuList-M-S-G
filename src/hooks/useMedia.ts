// src/hooks/useMedia.ts
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Query,
  limit
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore'; 
import type { MediaItem, FilterType, FilterStatus } from '../types/media';

const PAGE_SIZE = 16;

export default function useMedia(type: FilterType, filter: FilterStatus, page: number = 1) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const refetch = () => setKey(prevKey => prevKey + 1);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      
      try {
        const itemsRef = collection(db, "mediaItems");
        
        let q: Query<DocumentData> = itemsRef;

        if (type !== 'all') {
          q = query(q, where("type", "==", type));
        }

        if (filter === 'watched') {
          q = query(q, where("watched", "==", true));
        } else if (filter === 'not-watched') {
          q = query(q, where("watched", "==", false));
        }

        q = query(q, orderBy("rating", "desc"), limit(PAGE_SIZE));

        const documentSnapshots = await getDocs(q);

        const mediaList = documentSnapshots.docs.map(doc => ({
          ...doc.data() as Omit<MediaItem, 'id'>,
          id: doc.id
        }));

        setItems(mediaList);
      } catch (e) {
        console.error("Veri çekilemedi: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [type, filter, page, key]); 

  return { items, loading, refetch };
}