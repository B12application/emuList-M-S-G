// src/frontend/hooks/useInvestments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../backend/config/firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface Investment {
  id: string;
  userId: string;
  type: 'gold' | 'other';
  title: string;
  amount: number; // e.g., 5 grams
  buyPrice: number; // price per unit at purchase
  date: string;
  createdAt: number;
}

export type NewInvestment = Omit<Investment, 'id' | 'userId' | 'createdAt'>;

const fetchInvestments = async (userId: string): Promise<Investment[]> => {
  console.log('fetching investments for userId:', userId);
  const investmentsRef = collection(db, 'investments');
  const q = query(investmentsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  console.log('found investments count:', snapshot.size);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
};

export default function useInvestments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ['investments', user?.uid],
    queryFn: () => fetchInvestments(user!.uid),
    enabled: !!user?.uid,
  });

  const addInvestmentMutation = useMutation({
    mutationFn: async (newInv: NewInvestment) => {
      if (!user) throw new Error('User not authenticated');
      const investmentData = {
        ...newInv,
        userId: user.uid,
        createdAt: Date.now(),
      };
      await addDoc(collection(db, 'investments'), investmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', user?.uid] });
    },
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'investments', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', user?.uid] });
    },
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Investment> & { id: string }) => {
      const ref = doc(db, 'investments', id);
      await updateDoc(ref, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', user?.uid] });
    },
  });

  return {
    investments,
    isLoading,
    addInvestment: addInvestmentMutation.mutateAsync,
    deleteInvestment: deleteInvestmentMutation.mutateAsync,
    updateInvestment: updateInvestmentMutation.mutateAsync,
    isAdding: addInvestmentMutation.isPending,
  };
}
