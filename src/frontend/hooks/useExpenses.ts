// src/hooks/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../backend/config/firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { format, addMonths, parseISO } from 'date-fns';

export interface Expense {
  id: string;
  userId: string;
  category: string;
  title: string;
  amount: number;
  date: string; // ISO date string
  description?: string;
  createdAt: number;
  // Installment fields
  installmentCount?: number;
  installmentCurrent?: number;
  installmentGroupId?: string;
}

export type NewExpense = Omit<Expense, 'id' | 'userId' | 'createdAt'> & {
  installmentCount?: number;
};

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
}

const fetchExpenses = async (userId: string): Promise<Expense[]> => {
  const expensesRef = collection(db, 'expenses');
  const q = query(expensesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Expense))
    .sort((a, b) => b.date.localeCompare(a.date));
};

const fetchCategories = async (userId: string): Promise<Category[]> => {
  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export default function useExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses', user?.uid],
    queryFn: () => fetchExpenses(user!.uid),
    enabled: !!user?.uid,
  });

  const { data: dbCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', user?.uid],
    queryFn: () => fetchCategories(user!.uid),
    enabled: !!user?.uid,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (newExpense: NewExpense) => {
      if (!user) throw new Error('User not authenticated');
      
      const installmentCount = newExpense.installmentCount || 1;
      const installmentGroupId = installmentCount > 1 ? crypto.randomUUID() : undefined;
      const perInstallmentAmount = installmentCount > 1 
        ? Math.round((newExpense.amount / installmentCount) * 100) / 100 
        : newExpense.amount;

      const batch = writeBatch(db);
      const expensesRef = collection(db, 'expenses');

      for (let i = 0; i < installmentCount; i++) {
        const installmentDate = installmentCount > 1
          ? format(addMonths(parseISO(newExpense.date), i), 'yyyy-MM-dd')
          : newExpense.date;

        const expenseData = {
          title: newExpense.title,
          category: newExpense.category,
          amount: perInstallmentAmount,
          date: installmentDate,
          description: newExpense.description || '',
          userId: user.uid,
          createdAt: Date.now() + i, // ensure unique ordering
          ...(installmentCount > 1 ? {
            installmentCount,
            installmentCurrent: i + 1,
            installmentGroupId,
          } : {}),
        };

        const newDocRef = doc(expensesRef);
        batch.set(newDocRef, expenseData);
      }

      // Auto-create category if it doesn't exist
      if (!dbCategories.find(c => c.name === newExpense.category)) {
        const catRef = doc(collection(db, 'categories'));
        batch.set(catRef, {
          name: newExpense.category,
          userId: user.uid,
          createdAt: Date.now(),
        });
      }

      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      if (dbCategories.find(c => c.name === name)) return;
      const categoryData = { name, userId: user.uid, createdAt: Date.now() };
      await addDoc(collection(db, 'categories'), categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
    },
  });

  const addBulkExpensesMutation = useMutation({
    mutationFn: async (newExpenses: NewExpense[]) => {
      if (!user) throw new Error('User not authenticated');
      
      // Firestore batch limit is 500, chunk if needed
      const chunks: NewExpense[][] = [];
      for (let i = 0; i < newExpenses.length; i += 450) {
        chunks.push(newExpenses.slice(i, i + 450));
      }

      const categoriesToCreate = new Set<string>();
      
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        
        for (const expense of chunk) {
          const expenseData = {
            title: expense.title,
            category: expense.category,
            amount: expense.amount,
            date: expense.date,
            description: expense.description || '',
            userId: user.uid,
            createdAt: Date.now(),
          };
          const newDocRef = doc(collection(db, 'expenses'));
          batch.set(newDocRef, expenseData);
          
          if (!dbCategories.find(c => c.name === expense.category)) {
            categoriesToCreate.add(expense.category);
          }
        }
        
        // Create missing categories
        for (const catName of categoriesToCreate) {
          const catRef = doc(collection(db, 'categories'));
          batch.set(catRef, {
            name: catName,
            userId: user.uid,
            createdAt: Date.now(),
          });
        }
        
        await batch.commit();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await deleteDoc(doc(db, 'expenses', expenseId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Expense> & { id: string }) => {
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const batch = writeBatch(db);
      
      // Delete expenses in category
      const expensesToDelete = expenses.filter(e => e.category === categoryName);
      expensesToDelete.forEach((exp) => {
        batch.delete(doc(db, 'expenses', exp.id));
      });
      
      // Delete category doc
      const catDoc = dbCategories.find(c => c.name === categoryName);
      if (catDoc) {
        batch.delete(doc(db, 'categories', catDoc.id));
      }
      
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
    },
  });

  // Merge categories from DB and existing expenses (for safety)
  const categories = Array.from(new Set([
    ...dbCategories.map(c => c.name),
    ...expenses.map(e => e.category)
  ])).sort();

  return {
    expenses,
    categories,
    isLoading: isLoadingExpenses || isLoadingCategories,
    addExpense: addExpenseMutation.mutateAsync,
    addCategory: addCategoryMutation.mutateAsync,
    addBulkExpenses: addBulkExpensesMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
    updateExpense: updateExpenseMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    isAdding: addExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
    isUpdating: updateExpenseMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,
    isBulkAdding: addBulkExpensesMutation.isPending,
  };
}
