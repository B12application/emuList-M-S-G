// src/hooks/useMedia.ts
// Refactored with React Query + Infinite Scroll for pagination
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '../../backend/config/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter
} from 'firebase/firestore';
import type { Query, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { MediaItem, FilterType, FilterStatus } from '../../backend/types/media';

const PAGE_SIZE = 20;

// Sayfa tipi - cursor pagination için
interface MediaPage {
  items: MediaItem[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

// Firebase sorgu fonksiyonu - cursor-based pagination
async function fetchMediaPage(
  userId: string,
  type: FilterType,
  filter: FilterStatus,
  sortBy: 'rating' | 'createdAt',
  isSearchActive: boolean,
  pageParam: QueryDocumentSnapshot | null
): Promise<MediaPage> {
  let q: Query<DocumentData> = collection(db, "mediaItems");

  q = query(q, where("userId", "==", userId));
  if (type !== 'all') q = query(q, where("type", "==", type));
  if (filter === 'watched') q = query(q, where("watched", "==", true));
  else if (filter === 'not-watched') q = query(q, where("watched", "==", false));

  q = query(q, orderBy(sortBy, "desc"));

  // isSearchActive true ise limit koyma (tüm veriyi çek - HomePage için)
  if (!isSearchActive) {
    q = query(q, limit(PAGE_SIZE));

    // Cursor varsa startAfter ekle
    if (pageParam) {
      q = query(q, startAfter(pageParam));
    }
  }

  const documentSnapshots = await getDocs(q);

  const items = documentSnapshots.docs.map(doc => ({
    ...doc.data() as Omit<MediaItem, 'id'>,
    id: doc.id
  }));

  const lastDoc = documentSnapshots.docs.length > 0
    ? documentSnapshots.docs[documentSnapshots.docs.length - 1]
    : null;

  const hasMore = !isSearchActive && documentSnapshots.docs.length >= PAGE_SIZE;

  return { items, lastDoc, hasMore };
}

export default function useMedia(
  type: FilterType,
  filter: FilterStatus,
  isSearchActive: boolean,
  sortBy: 'rating' | 'createdAt' = 'rating'
) {
  const queryClient = useQueryClient();
  const currentUserId = auth.currentUser?.uid;

  // Query key - bu key'e göre cache yapılır
  const queryKey = ['media', currentUserId, type, filter, sortBy, isSearchActive];

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,

  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchMediaPage(
      currentUserId!,
      type,
      filter,
      sortBy,
      isSearchActive,
      pageParam
    ),
    initialPageParam: null as QueryDocumentSnapshot | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  // Tüm sayfaların itemlerini birleştir
  const items = data?.pages.flatMap(page => page.items) || [];
  const loading = isLoading;

  // Manual refetch - aynı zamanda ilgili cache'leri de invalidate eder
  const invalidateAndRefetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ['media', currentUserId] });
    await queryClient.invalidateQueries({ queryKey: ['mediaStats', currentUserId] });
    await queryClient.invalidateQueries({ queryKey: ['mediaHistory', currentUserId] });
  };

  // loadMore - sonraki sayfayı yükle
  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  return {
    items,
    loading,
    refetch: invalidateAndRefetch,
    loadMore,
    loadingMore: isFetchingNextPage,
    hasMoreItems: !!hasNextPage
  };
}

// === YARDIMCI: Medya cache'ini invalidate etmek için ===
export function useInvalidateMediaCache() {
  const queryClient = useQueryClient();
  const currentUserId = auth.currentUser?.uid;

  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['media', currentUserId] });
    await queryClient.invalidateQueries({ queryKey: ['mediaStats', currentUserId] });
    await queryClient.invalidateQueries({ queryKey: ['mediaHistory', currentUserId] });
  };
}