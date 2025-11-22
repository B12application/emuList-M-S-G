// src/hooks/useMedia.ts
import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Query,
  limit,
  startAfter, // Geri geldi
  QueryDocumentSnapshot // Geri geldi
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore'; 
import type { MediaItem, FilterType, FilterStatus } from '../types/media';

const PAGE_SIZE = 16; 

export default function useMedia(
  type: FilterType, 
  filter: FilterStatus,
  isSearchActive: boolean // 1. YENİ: Arama yapılıyor mu?
) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0); 

  // Silinen State'ler GERİ GELDİ
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  
  const refetch = () => {
    setKey(prevKey => prevKey + 1);
    setItems([]);
    setLastVisibleDoc(null);
  };

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    const fetchMedia = async () => {
      setLoading(true);
      setHasMoreItems(true); 

      if (!currentUserId) {
        setLoading(false);
        setItems([]);
        return; 
      }
      
      try {
        let q: Query<DocumentData> = collection(db, "mediaItems");

        // Temel Sorgular
        q = query(q, where("userId", "==", currentUserId));
        if (type !== 'all') q = query(q, where("type", "==", type));
        if (filter === 'watched') q = query(q, where("watched", "==", true));
        else if (filter === 'not-watched') q = query(q, where("watched", "==", false));
        
        q = query(q, orderBy("rating", "desc"));
        
        // 2. ÖNEMLİ MANTIK: 
        // Eğer arama yapılıyorsa (isSearchActive), limiti KALDIR (Hepsini çek).
        // Eğer arama yoksa, limiti (PAGE_SIZE) UYGULA.
        if (!isSearchActive) {
            q = query(q, limit(PAGE_SIZE));
        }
        
        const documentSnapshots = await getDocs(q);

        const mediaList = documentSnapshots.docs.map(doc => ({
          ...doc.data() as Omit<MediaItem, 'id'>,
          id: doc.id
        }));
        
        setItems(mediaList); 

        // Pagination için son dökümanı kaydet (Sadece normal modda)
        if (!isSearchActive && documentSnapshots.docs.length > 0) {
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisibleDoc(lastDoc);
            
            if (documentSnapshots.docs.length < PAGE_SIZE) {
              setHasMoreItems(false);
            }
        } else {
            // Arama modundaysak veya veri yoksa 'Daha Fazla Yükle'yi kapat
            setHasMoreItems(false);
        }
        
      } catch (e) {
        console.error("Veri çekilemedi: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [type, filter, key, isSearchActive]); // isSearchActive değişince yeniden çalışır

  // Silinen 'loadMore' Fonksiyonu GERİ GELDİ
  const loadMore = async () => {
    const currentUserId = auth.currentUser?.uid;
    // Arama yapılıyorsa loadMore çalışmasın
    if (!lastVisibleDoc || loadingMore || !currentUserId || isSearchActive) return; 
    
    setLoadingMore(true);
    try {
      let q: Query<DocumentData> = collection(db, "mediaItems");
      q = query(q, where("userId", "==", currentUserId));
      
      if (type !== 'all') q = query(q, where("type", "==", type));
      if (filter === 'watched') q = query(q, where("watched", "==", true));
      else if (filter === 'not-watched') q = query(q, where("watched", "==", false));
      q = query(q, orderBy("rating", "desc"));

      // Kaldığın yerden devam et
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