// src/hooks/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../backend/config/firebaseConfig';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { format, addMonths, parseISO } from 'date-fns';

// CATEGORY_MAP and normalizeCategory removed as we are transitioning to v2 categories directly.

export interface Expense {
  id: string;
  userId: string;
  category: string;
  title: string;
  amount: number;
  date: string; // ISO date string
  description?: string;
  createdAt: number;
  direction?: 'gelen' | 'giden';
  source?: string;
  type?: string;
  contractStart?: string;
  contractYears?: number;
  notifyBeforeDays?: number;
  contractEndDate?: string;
  reminderDate?: string;
  billingCycle?: 'monthly' | 'yearly';
  // Installment fields
  installmentCount?: number;
  installmentCurrent?: number;
  installmentGroupId?: string;
  isDeleted?: boolean;
  deletedAt?: number;
  isExcluded?: boolean;
  excludedAt?: number;
  // Categories 2.0 — title-based re-categorization
  category2?: string;
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
  const expensesRef = collection(db, 'expensedata');
  const q = query(
    expensesRef, 
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Expense))
    .filter(e => !e.isDeleted && !e.isExcluded)
    .sort((a, b) => b.date.localeCompare(a.date));
};

const fetchDeletedExpenses = async (userId: string): Promise<Expense[]> => {
  const expensesRef = collection(db, 'expensedata');
  const q = query(
    expensesRef,
    where('userId', '==', userId),
    where('isDeleted', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Expense))
    .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
};

const fetchExcludedExpenses = async (userId: string): Promise<Expense[]> => {
  const expensesRef = collection(db, 'expensedata');
  const q = query(
    expensesRef,
    where('userId', '==', userId),
    where('isExcluded', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Expense))
    .filter(e => !e.isDeleted)
    .sort((a, b) => (b.excludedAt || 0) - (a.excludedAt || 0));
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

  const { data: deletedExpenses = [], isLoading: isLoadingDeleted } = useQuery({
    queryKey: ['deletedExpenses', user?.uid],
    queryFn: () => fetchDeletedExpenses(user!.uid),
    enabled: !!user?.uid,
  });

  const { data: excludedExpenses = [], isLoading: isLoadingExcluded } = useQuery({
    queryKey: ['excludedExpenses', user?.uid],
    queryFn: () => fetchExcludedExpenses(user!.uid),
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
      const expensesRef = collection(db, 'expensedata');

      const selectedCategory = newExpense.category || 'Diğer';

      for (let i = 0; i < installmentCount; i++) {
        const installmentDate = installmentCount > 1
          ? format(addMonths(parseISO(newExpense.date), i), 'yyyy-MM-dd')
          : newExpense.date;

        const expenseData = {
          title: newExpense.title,
          category: selectedCategory,
          category2: selectedCategory,
          amount: perInstallmentAmount,
          date: installmentDate,
          description: newExpense.description || '',
          direction: newExpense.direction || 'giden',
          source: newExpense.source || '',
          type: newExpense.type || '',
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
      if (!dbCategories.find(c => c.name === selectedCategory)) {
        const catRef = doc(collection(db, 'categories'));
        batch.set(catRef, {
          name: selectedCategory,
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
          const selectedCategory = expense.category || 'Diğer';
          const expenseData = {
            title: expense.title,
            category: selectedCategory,
            category2: selectedCategory,
            amount: expense.amount,
            date: expense.date,
            description: expense.description || '',
            direction: expense.direction || 'giden',
            source: expense.source || '',
            type: expense.type || '',
            userId: user.uid,
            createdAt: Date.now(),
          };
          const newDocRef = doc(collection(db, 'expensedata'));
          batch.set(newDocRef, expenseData);

          if (!dbCategories.find(c => c.name === selectedCategory)) {
            categoriesToCreate.add(selectedCategory);
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
      const expenseRef = doc(db, 'expensedata', expenseId);
      await updateDoc(expenseRef, {
        isDeleted: true,
        deletedAt: Date.now()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['deletedExpenses', user?.uid] });
    },
  });

  const restoreExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const expenseRef = doc(db, 'expensedata', expenseId);
      await updateDoc(expenseRef, {
        isDeleted: false,
        deletedAt: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['deletedExpenses', user?.uid] });
    },
  });

  const excludeExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const expenseRef = doc(db, 'expensedata', expenseId);
      await updateDoc(expenseRef, {
        isExcluded: true,
        excludedAt: Date.now()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['excludedExpenses', user?.uid] });
    },
  });

  const includeExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const expenseRef = doc(db, 'expensedata', expenseId);
      await updateDoc(expenseRef, {
        isExcluded: false,
        excludedAt: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['excludedExpenses', user?.uid] });
    },
  });

  const hardDeleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await deleteDoc(doc(db, 'expensedata', expenseId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletedExpenses', user?.uid] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Expense> & { id: string }) => {
      if ('category' in updateData) {
        updateData.category2 = updateData.category;
      }
      const expenseRef = doc(db, 'expensedata', id);
      await updateDoc(expenseRef, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
    },
  });

  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: async ({ ids, category }: { ids: string[]; category: string }) => {
      if (!user) throw new Error('User not authenticated');
      const batch = writeBatch(db);
      ids.forEach(id => {
        const ref = doc(db, 'expensedata', id);
        batch.update(ref, { category, category2: category });
      });
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
    },
  });

  const bulkDeleteExpensesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error('User not authenticated');
      const batch = writeBatch(db);
      ids.forEach(id => {
        const ref = doc(db, 'expensedata', id);
        batch.update(ref, {
          isDeleted: true,
          deletedAt: Date.now()
        });
      });
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['deletedExpenses', user?.uid] });
    },
  });

  const bulkExcludeExpensesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error('User not authenticated');
      const batch = writeBatch(db);
      ids.forEach(id => {
        const ref = doc(db, 'expensedata', id);
        batch.update(ref, {
          isExcluded: true,
          excludedAt: Date.now()
        });
      });
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['excludedExpenses', user?.uid] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      if (!user) throw new Error('User not authenticated');
      const batch = writeBatch(db);

      // Delete expenses in category
      const expensesToDelete = expenses.filter(e => (e.category2 || e.category) === categoryName);
      expensesToDelete.forEach((exp) => {
        batch.delete(doc(db, 'expensedata', exp.id));
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

  // Sadece aktif kullanılan ve yeni eklenen kategorileri al (V1 ve v2_ çöplerini temizle)
  const activeExpenseCats = expenses.map(e => e.category2).filter(Boolean) as string[];
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  
  const cleanDbCats = dbCategories
    .filter(c => !c.name.startsWith('v2_'))
    .filter(c => {
      const isUsed = activeExpenseCats.includes(c.name);
      const isRecent = Date.now() - c.createdAt < SEVEN_DAYS_MS;
      return isUsed || isRecent;
    })
    .map(c => c.name);

  const categories = Array.from(new Set([
    ...activeExpenseCats,
    ...cleanDbCats
  ])).filter(Boolean).sort();

  return {
    expenses,
    deletedExpenses,
    excludedExpenses,
    categories,
    isLoading: isLoadingExpenses || isLoadingCategories || isLoadingDeleted || isLoadingExcluded,
    addExpense: addExpenseMutation.mutateAsync,
    addCategory: addCategoryMutation.mutateAsync,
    addBulkExpenses: addBulkExpensesMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
    restoreExpense: restoreExpenseMutation.mutateAsync,
    excludeExpense: excludeExpenseMutation.mutateAsync,
    includeExpense: includeExpenseMutation.mutateAsync,
    hardDeleteExpense: hardDeleteExpenseMutation.mutateAsync,
    updateExpense: updateExpenseMutation.mutateAsync,
    bulkUpdateCategory: bulkUpdateCategoryMutation.mutateAsync,
    bulkDeleteExpenses: bulkDeleteExpensesMutation.mutateAsync,
    bulkExcludeExpenses: bulkExcludeExpensesMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    isAdding: addExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
    isRestoring: restoreExpenseMutation.isPending,
    isUpdating: updateExpenseMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,
    isBulkAdding: addBulkExpensesMutation.isPending,
    isBulkUpdating: bulkUpdateCategoryMutation.isPending,
    isBulkDeleting: bulkDeleteExpensesMutation.isPending,
    isBulkExcluding: bulkExcludeExpensesMutation.isPending,
  };
}
