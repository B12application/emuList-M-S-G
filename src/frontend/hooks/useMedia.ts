// src/hooks/useMedia.ts
import { useState, useEffect } from 'react';
import { db, auth } from '../../backend/config/firebaseConfig';
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
import type { MediaItem, FilterType, FilterStatus } from '../../backend/types/media';

const PAGE_SIZE = 20;

export default function useMedia(
  type: FilterType,
  filter: FilterStatus,
  isSearchActive: boolean,
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

    // === 1. DÜZELTME: Değişiklik olduğu an eski listeyi SİL ===
    setItems([]);
    setLoading(true);
    setHasMoreItems(true);
    setLastVisibleDoc(null);

    const fetchMedia = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        let q: Query<DocumentData> = collection(db, "mediaItems");

        q = query(q, where("userId", "==", currentUserId));
        if (type !== 'all') q = query(q, where("type", "==", type));
        if (filter === 'watched') q = query(q, where("watched", "==", true));
        else if (filter === 'not-watched') q = query(q, where("watched", "==", false));

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
        // Hata durumunda da listeyi boş bırak (Eski veri görünmesin)
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
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