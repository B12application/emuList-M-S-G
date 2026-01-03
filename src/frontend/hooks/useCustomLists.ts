// src/frontend/hooks/useCustomLists.ts
// Custom lists management hook with React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '../../backend/config/firebaseConfig';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import type { CustomList, CustomListInput } from '../../backend/types/customList';
import toast from 'react-hot-toast';

// Fetch user's custom lists
async function fetchCustomLists(userId: string): Promise<CustomList[]> {
    const q = query(
        collection(db, 'customLists'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        ...doc.data() as Omit<CustomList, 'id'>,
        id: doc.id
    }));
}

// Create a new list
async function createList(userId: string, input: CustomListInput): Promise<string> {
    const docRef = await addDoc(collection(db, 'customLists'), {
        ...input,
        userId,
        itemIds: input.itemIds || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

// Update a list
async function updateList(listId: string, data: Partial<CustomListInput>): Promise<void> {
    const ref = doc(db, 'customLists', listId);
    await updateDoc(ref, {
        ...data,
        updatedAt: Timestamp.now()
    });
}

// Delete a list
async function deleteList(listId: string): Promise<void> {
    await deleteDoc(doc(db, 'customLists', listId));
}

// Add item to list
async function addItemToList(listId: string, itemId: string): Promise<void> {
    const ref = doc(db, 'customLists', listId);
    await updateDoc(ref, {
        itemIds: arrayUnion(itemId),
        updatedAt: Timestamp.now()
    });
}

// Remove item from list
async function removeItemFromList(listId: string, itemId: string): Promise<void> {
    const ref = doc(db, 'customLists', listId);
    await updateDoc(ref, {
        itemIds: arrayRemove(itemId),
        updatedAt: Timestamp.now()
    });
}

export default function useCustomLists() {
    const queryClient = useQueryClient();
    const userId = auth.currentUser?.uid;
    const queryKey = ['customLists', userId];

    // Fetch lists
    const { data: lists = [], isLoading } = useQuery({
        queryKey,
        queryFn: () => fetchCustomLists(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (input: CustomListInput) => createList(userId!, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Liste oluşturuldu!');
        },
        onError: () => toast.error('Liste oluşturulamadı')
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ listId, data }: { listId: string; data: Partial<CustomListInput> }) =>
            updateList(listId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Liste güncellendi!');
        },
        onError: () => toast.error('Liste güncellenemedi')
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteList,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Liste silindi!');
        },
        onError: () => toast.error('Liste silinemedi')
    });

    // Add item mutation
    const addItemMutation = useMutation({
        mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
            addItemToList(listId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Öğe listeye eklendi!');
        },
        onError: () => toast.error('Öğe eklenemedi')
    });

    // Remove item mutation
    const removeItemMutation = useMutation({
        mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
            removeItemFromList(listId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Öğe listeden çıkarıldı!');
        },
        onError: () => toast.error('Öğe çıkarılamadı')
    });

    return {
        lists,
        loading: isLoading,
        createList: createMutation.mutate,
        updateList: updateMutation.mutate,
        deleteList: deleteMutation.mutate,
        addItemToList: addItemMutation.mutate,
        removeItemFromList: removeItemMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
}
