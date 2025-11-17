// src/hooks/useMedia.ts
import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig'; // 1. auth import edildi
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Query,
  limit,
  startAfter, 
  QueryDocumentSnapshot 
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore'; 
import type { MediaItem, FilterType, FilterStatus } from '../types/media';

const PAGE_SIZE = 16; 

export default function useMedia(
  type: FilterType, 
  filter: FilterStatus 
) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0); 

  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  
  // 2. YENİ: Giriş yapan kullanıcının kimliğini (UID) al
  const currentUserId = auth.currentUser?.uid;

  const refetch = () => {
    setKey(prevKey => prevKey + 1);
    setItems([]);
    setLastVisibleDoc(null);
  };

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setHasMoreItems(true); 

      // 3. YENİ: Kullanıcı giriş yapmamışsa sorguyu çalıştırma
      if (!currentUserId) {
        setLoading(false);
        setItems([]);
        return; 
      }
      
      try {
        let q: Query<DocumentData> = collection(db, "mediaItems");

        // 4. YENİ: EN ÖNEMLİ KURAL
        // Sorguya "sahibi benim olanları" ekle
        q = query(q, where("userId", "==", currentUserId));

        // Filtreler
        if (type !== 'all') {
          q = query(q, where("type", "==", type));
        }
        if (filter === 'watched') {
          q = query(q, where("watched", "==", true));
        } else if (filter === 'not-watched') {
          q = query(q, where("watched", "==", false));
        }
        
        q = query(q, orderBy("rating", "desc"));
        
        const firstPageQuery = query(q, limit(PAGE_SIZE));
        const documentSnapshots = await getDocs(firstPageQuery);

        const mediaList = documentSnapshots.docs.map(doc => ({
          ...doc.data() as Omit<MediaItem, 'id'>,
          id: doc.id
        }));
        
        setItems(mediaList); 

        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisibleDoc(lastDoc);

        if (documentSnapshots.docs.length < PAGE_SIZE) {
          setHasMoreItems(false);
        }
        
      } catch (e) {
        console.error("Veri çekilemedi: ", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  // 5. currentUserId'yi bağımlılıklara ekle
  }, [type, filter, key, currentUserId]); 

  const loadMore = async () => {
    // 6. YENİ: Kullanıcı ID'sini tekrar al
    const currentUserId = auth.currentUser?.uid;
    if (!lastVisibleDoc || loadingMore || !currentUserId) return; 
    
    setLoadingMore(true);
    try {
      let q: Query<DocumentData> = collection(db, "mediaItems");
      
      // 7. YENİ: "Daha Fazla Yükle" sorgusuna da 'userId' ekle
      q = query(q, where("userId", "==", currentUserId));
      
      if (type !== 'all') q = query(q, where("type", "==", type));
      if (filter === 'watched') q = query(q, where("watched", "==", true));
      else if (filter === 'not-watched') q = query(q, where("watched", "==", false));
      q = query(q, orderBy("rating", "desc"));

      const nextQuery = query(q, startAfter(lastVisibleDoc), limit(PAGE_SIZE));
      
      const documentSnapshots = await getDocs(nextQuery);

      const newItems = documentSnapshots.docs.map(doc => ({
        ...doc.data() as Omit<MediaItem, 'id'>,
        id: doc.id
      }));

      setItems(prevItems => [...prevItems, ...newItems]); 

      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisibleDoc(lastDoc);

      if (documentSnapshots.docs.length < PAGE_SIZE) {
        setHasMoreItems(false);
      }

    } catch (e) {
      console.error("Daha fazla veri çekilemedi: ", e);
    } finally {
      setLoadingMore(false);
    }
  };

  return { items, loading, refetch, loadMore, loadingMore, hasMoreItems };
}