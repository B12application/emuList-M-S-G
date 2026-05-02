import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { FaPlus, FaLayerGroup, FaTrash } from 'react-icons/fa';

import useExpenses from '../hooks/useExpenses';
import type { Expense } from '../hooks/useExpenses';
import { useTheme } from '../context/ThemeContext';

// Modular Components
import CategorySidebar from '../components/expenses/CategorySidebar';
import ExpensesLayout from '../components/expenses/ExpensesLayout';
import ExpensesHomeView from '../components/expenses/ExpensesHomeView';
import ReportsTab from '../components/expenses/ReportsTab';
import VehicleTab from '../components/expenses/VehicleTab';
import ExpenseModals from '../components/expenses/ExpenseModals';

const ExpensesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const {
    expenses,
    categories,
    addExpense,
    deleteExpense,
    updateExpense,
    bulkUpdateCategory,
    bulkDeleteExpenses
  } = useExpenses();

  const [activeTab, setActiveTab] = useState<'harcamalar' | 'raporlar' | 'araclar'>('harcamalar');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleCount, setVisibleCount] = useState(50);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    category: categories[0] || 'Genel',
    date: format(new Date(), 'yyyy-MM-dd'),
    installmentCount: 1,
    installmentCurrent: 1
  });

  const [bulkCategory, setBulkCategory] = useState(categories[0] || 'Genel');
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const dateLocale = language === 'tr' ? tr : enUS;

  // Derived Data
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: dateLocale })
      });
    }
    return [{ value: 'all', label: t('expenses.allTime') || 'Tüm Zamanlar' }, ...options];
  }, [dateLocale, t]);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    if (activeCategory !== 'all') result = result.filter(e => e.category === activeCategory);
    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const start = startOfMonth(new Date(year, month - 1));
      const end = endOfMonth(new Date(year, month - 1));
      result = result.filter(e => isWithinInterval(parseISO(e.date), { start, end }));
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(lowerSearch) ||
        e.category.toLowerCase().includes(lowerSearch)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });
    return result;
  }, [expenses, activeCategory, selectedMonth, searchTerm, sortBy, sortOrder]);

  const totalFilteredAmount = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  const totalLifetimeAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const dailyTrendData = useMemo(() => {
    if (selectedMonth === 'all') return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const amount = filteredExpenses
        .filter(e => e.date === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      data.push({ day: i, amount });
    }
    return data;
  }, [selectedMonth, filteredExpenses]);

  const categoryBreakdownData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.forEach(e => { data[e.category] = (data[e.category] || 0) + e.amount; });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const monthlyChartData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(e => {
      const month = format(parseISO(e.date), 'MMM yy', { locale: dateLocale });
      data[month] = (data[month] || 0) + e.amount;
    });
    return Object.entries(data).map(([month, amount]) => ({ month, amount })).reverse().slice(-12);
  }, [expenses, dateLocale]);

  const monthlySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    expenses.forEach(e => {
      const month = format(parseISO(e.date), 'MMMM yyyy', { locale: dateLocale });
      summary[month] = (summary[month] || 0) + e.amount;
    });
    return Object.entries(summary).map(([month, amount]) => ({ month, amount })).reverse();
  }, [expenses, dateLocale]);

  // Handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredExpenses.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredExpenses.map(e => e.id)));
  }, [selectedIds, filteredExpenses]);

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    try {
      if (isEditing && editingId) {
        await updateExpense({ id: editingId, ...newExpense } as Expense);
      } else {
        await addExpense(newExpense as Omit<Expense, 'id'>);
      }
      setIsAddModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      setNewExpense({
        title: '', amount: 0, category: categories[0] || 'Genel',
        date: format(new Date(), 'yyyy-MM-dd'), installmentCount: 1, installmentCurrent: 1
      });
    } catch (error) { console.error('Error handling expense:', error); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm(t('common.confirmDelete'))) await deleteExpense(id);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`${selectedIds.size} harcamayı silmek istediğinize emin misiniz?`)) {
      await bulkDeleteExpenses(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleEditClick = (expense: Expense) => {
    setNewExpense(expense);
    setIsEditing(true);
    setEditingId(expense.id);
    setIsAddModalOpen(true);
  };

  const applyBulkCategory = async () => {
    await bulkUpdateCategory({ ids: Array.from(selectedIds), category: bulkCategory });
    setIsBulkCategoryModalOpen(false);
    setSelectedIds(new Set());
  };

  const handleImportFile = () => {
    const mockData = [
      { title: 'STARBUCKS COFFEE', amount: 145, date: '2024-05-10', category: 'Yemek' },
      { title: 'OPET PETROLCULUK', amount: 1250, date: '2024-05-12', category: 'Ulaşım' },
    ];
    setImportPreview(mockData);
    setIsImportPreviewOpen(true);
  };

  const confirmImport = async () => {
    for (const item of importPreview) await addExpense(item);
    setIsImportPreviewOpen(false);
    setImportPreview([]);
  };

  const handleDeletePreviewItem = (idx: number) => setImportPreview(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="selection:bg-stone-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

        <CategorySidebar
          t={t}
          isDark={isDark}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <div className="flex-1">
          <ExpensesLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthOptions={monthOptions}
          >
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-stone-900 dark:bg-white px-6 py-3 rounded-full shadow-2xl border border-stone-800 dark:border-stone-100"
                >
                  <span className="text-[10px] font-black text-white dark:text-stone-900 uppercase tracking-[0.2em]">
                    {selectedIds.size} {t('expenses.selectedCount') || 'SEÇİLDİ'}
                  </span>
                  <div className="w-[1px] h-4 bg-white/20 dark:bg-black/20" />
                  <div className="flex gap-2">
                    <button onClick={() => setIsBulkCategoryModalOpen(true)} className="p-2 text-white dark:text-stone-900 hover:bg-white/10 dark:hover:bg-black/5 rounded-xl transition-all" title="Kategori Değiştir">
                      <FaLayerGroup size={12} />
                    </button>
                    <button onClick={handleBulkDelete} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-all" title="Seçilenleri Sil">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'harcamalar' && (
                  <ExpensesHomeView
                    t={t}
                    isDark={isDark}
                    dateLocale={dateLocale}
                    filteredExpenses={filteredExpenses}
                    totalFilteredAmount={totalFilteredAmount}
                    totalLifetimeAmount={totalLifetimeAmount}
                    selectedMonth={selectedMonth}
                    dailyTrendData={dailyTrendData}
                    categoryBreakdownData={categoryBreakdownData}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                    toggleSelectAll={toggleSelectAll}
                    handleEditClick={handleEditClick}
                    handleDeleteExpense={handleDeleteExpense}
                    visibleCount={visibleCount}
                    setVisibleCount={setVisibleCount}
                  />
                )}
                {activeTab === 'raporlar' && (
                  <ReportsTab
                    t={t}
                    isDark={isDark}
                    monthlyChartData={monthlyChartData}
                    monthlySummary={monthlySummary}
                    onImportClick={handleImportFile}
                  />
                )}
                {activeTab === 'araclar' && (
                  <VehicleTab />
                )}
              </motion.div>
            </AnimatePresence>
          </ExpensesLayout>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsEditing(false);
          setNewExpense({
            title: '', amount: 0, category: categories[0] || 'Genel',
            date: format(new Date(), 'yyyy-MM-dd'), installmentCount: 1, installmentCurrent: 1
          });
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-8 right-8 sm:bottom-12 sm:right-12 w-14 h-14 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl flex items-center justify-center shadow-2xl z-40 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-stone-800 dark:bg-stone-100 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <FaPlus className="relative z-10 text-lg" />
      </motion.button>

      <ExpenseModals
        t={t} isDark={isDark} dateLocale={dateLocale}
        isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen}
        isEditing={isEditing} newExpense={newExpense} setNewExpense={setNewExpense}
        handleAddExpense={handleAddExpense} categories={categories}
        isBulkCategoryModalOpen={isBulkCategoryModalOpen} setIsBulkCategoryModalOpen={setIsBulkCategoryModalOpen}
        bulkCategory={bulkCategory} setBulkCategory={setBulkCategory} applyBulkCategory={applyBulkCategory}
        selectedIds={selectedIds} isImportPreviewOpen={isImportPreviewOpen} setIsImportPreviewOpen={setIsImportPreviewOpen}
        importPreview={importPreview} confirmImport={confirmImport} handleDeletePreviewItem={handleDeletePreviewItem}
      />
    </div>
  );
};

export default ExpensesPage;