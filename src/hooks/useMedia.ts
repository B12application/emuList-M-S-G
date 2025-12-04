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
  startAfter, 
  QueryDocumentSnapshot 
  
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore'; 
import type { MediaItem, FilterType, FilterStatus } from '../types/media';

const PAGE_SIZE = 16; 

export default function useMedia(
  type: FilterType, 
  filter: FilterStatus,
  isSearchActive: boolean,
  // 1. YENİ: Sıralama parametresi eklendi (Varsayılan: Puan)
  sortBy: 'rating' | 'createdAt' = 'rating' 
) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0); 

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

        q = query(q, where("userId", "==", currentUserId));
        if (type !== 'all') q = query(q, where("type", "==", type));
        if (filter === 'watched') q = query(q, where("watched", "==", true));
        else if (filter === 'not-watched') q = query(q, where("watched", "==", false));
        
        // 2. GÜNCELLENDİ: Parametreden gelen 'sortBy'a göre sırala
        q = query(q, orderBy(sortBy, "desc"));
        
        if (!isSearchActive) {
            q = query(q, limit(PAGE_SIZE));
        }
        
        const documentSnapshots = await getDocs(q);

        const mediaList = documentSnapshots.docs.map(doc => ({
          ...doc.data() as Omit<MediaItem, 'id'>,
          id: doc.id
        }));
        
        setItems(mediaList); 

        if (!isSearchActive && documentSnapshots.docs.length > 0) {
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisibleDoc(lastDoc);
            
            if (documentSnapshots.docs.length < PAGE_SIZE) {
              setHasMoreItems(false);
            }
        } else {
            setHasMoreItems(false);
        }
        
      } catch (e) {
        console.error("Veri çekilemedi: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  // 3. sortBy bağımlılıklara eklendi
  }, [type, filter, key, isSearchActive, sortBy]); 

  const loadMore = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!lastVisibleDoc || loadingMore || !currentUserId || isSearchActive) return; 
    
    setLoadingMore(true);
    try {
      let q: Query<DocumentData> = collection(db, "mediaItems");
      q = query(q, where("userId", "==", currentUserId));
      
      if (type !== 'all') q = query(q, where("type", "==", type));
      if (filter === 'watched') q = query(q, where("watched", "==", true));
      else if (filter === 'not-watched') q = query(q, where("watched", "==", false));
      
      // 4. GÜNCELLENDİ: Load More da aynı sıralamayı kullanmalı
      q = query(q, orderBy(sortBy, "desc"));

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