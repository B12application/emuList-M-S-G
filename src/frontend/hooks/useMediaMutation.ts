// src/hooks/useMediaMutation.ts
// Mutation handlers for CRUD operations with cache invalidation
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '../../backend/config/firebaseConfig';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp
} from 'firebase/firestore';
import type { MediaItem } from '../../backend/types/media';

// === ADD MEDIA ===
interface AddMediaInput {
    title: string;
    type: 'movie' | 'series' | 'game' | 'book';
    image?: string;
    description?: string;
    rating?: string;
    genre?: string;
    watched?: boolean;
    isFavorite?: boolean;
}

export function useAddMedia() {
    const queryClient = useQueryClient();
    const currentUserId = auth.currentUser?.uid;

    return useMutation({
        mutationFn: async (input: AddMediaInput) => {
            if (!currentUserId) throw new Error('User not authenticated');

            const docRef = await addDoc(collection(db, 'mediaItems'), {
                ...input,
                userId: currentUserId,
                watched: input.watched ?? false,
                isFavorite: input.isFavorite ?? false,
                createdAt: Timestamp.now(),
                rating: input.rating || '0',
            });

            return docRef.id;
        },
        onSuccess: () => {
            // Tüm ilgili cache'leri invalidate et
            queryClient.invalidateQueries({ queryKey: ['media', currentUserId] });
            queryClient.invalidateQueries({ queryKey: ['mediaStats', currentUserId] });
            queryClient.invalidateQueries({ queryKey: ['mediaHistory', currentUserId] });
        },
    });
}

// === UPDATE MEDIA ===
interface UpdateMediaInput {
    id: string;
    updates: Partial<Omit<MediaItem, 'id' | 'userId' | 'createdAt'>>;
}

export function useUpdateMedia() {
    const queryClient = useQueryClient();
    const currentUserId = auth.currentUser?.uid;

    return useMutation({
        mutationFn: async ({ id, updates }: UpdateMediaInput) => {
            await updateDoc(doc(db, 'mediaItems', id), updates);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', currentUserId] });
            queryClient.invalidateQueries({ queryKey: ['mediaStats', currentUserId] });
            queryClient.invalidateQueries({ queryKey: ['mediaHistory', currentUserId] });
        },
    });
}

// === DELETE MEDIA ===
export function useDeleteMedia() {
    const queryClient = useQueryClient();
    const currentUserId = auth.currentUser?.uid;

    return useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, 'mediaItems', id));
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', currentUserId] });
            queryClient.invalidateQueries({ queryKey: ['mediaStats', currentUserId] });
            queryClient.invalidateQueries({ queryKey: ['mediaHistory', currentUserId] });
        },
    });
}

// === TOGGLE WATCHED ===
export function useToggleWatched() {
    const queryClient = useQueryClient();
    const currentUserId = auth.currentUser?.uid;

    return useMutation({
        mutationFn: async ({ id, watched }: { id: string; watched: boolean }) => {
            await updateDoc(doc(db, 'mediaItems', id), { watched });
            return { id, watched };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', currentUserId] });
            queryClient.invalidateQueries({ queryKey: ['mediaStats', currentUserId] });
        },
    });
}

// === TOGGLE FAVORITE ===
export function useToggleFavorite() {
    const queryClient = useQueryClient();
    const currentUserId = auth.currentUser?.uid;

    return useMutation({
        mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
            await updateDoc(doc(db, 'mediaItems', id), { isFavorite });
            return { id, isFavorite };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', currentUserId] });
        },
    });
}
