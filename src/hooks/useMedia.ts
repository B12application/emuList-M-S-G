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
} from 'firebase/firestore'; // 1. 'limit', 'startAfter', 'QueryDocumentSnapshot' kaldırıldı
import type { DocumentData } from 'firebase/firestore'; 
import type { MediaItem, FilterType, FilterStatus } from '../types/media';

// 2. 'PAGE_SIZE' kaldırıldı. 'page' parametresi kaldırıldı.
export default function useMedia(
  type: FilterType, 
  filter: FilterStatus 
) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0); 
  
  // 3. 'loadingMore', 'lastVisibleDoc', 'hasMoreItems' state'leri kaldırıldı.

  const refetch = () => {
    setKey(prevKey => prevKey + 1);
    setItems([]);
  };

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      
      try {
        let q: Query<DocumentData> = collection(db, "mediaItems");

        // Filtreler (değişmedi)
        if (type !== 'all') {
          q = query(q, where("type", "==", type));
        }
        if (filter === 'watched') {
          q = query(q, where("watched", "==", true));
        } else if (filter === 'not-watched') {
          q = query(q, where("watched", "==", false));
        }
        
        // Sıralama (değişmedi)
        q = query(q, orderBy("rating", "desc"));
        
        // 4. 'limit(PAGE_SIZE)' komutu kaldırıldı. Artık TÜMÜNÜ çekecek.
        const documentSnapshots = await getDocs(q);

        const mediaList = documentSnapshots.docs.map(doc => ({
          ...doc.data() as Omit<MediaItem, 'id'>,
          id: doc.id
        }));
        
        setItems(mediaList);
        
        // 5. Tüm 'loadMore' (sayfalama) mantığı kaldırıldı.
        
      } catch (e) {
        console.error("Veri çekilemedi: ", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [type, filter, key]); 

  // 6. 'loadMore' vb. fonksiyonlar return'den kaldırıldı.
  return { items, loading, refetch };
}