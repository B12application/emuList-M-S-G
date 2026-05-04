import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { FaLayerGroup, FaTrash, FaWallet, FaChartLine, FaCar } from 'react-icons/fa';
import toast from 'react-hot-toast';

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
  const [visibleCount, setVisibleCount] = useState(10);
  const [usage, setUsage] = useState({ count: 0, limit: 20 });

  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const USAGE_ENDPOINT = `${API_BASE_URL}/.netlify/functions/usage`;
  const ANALYZE_ENDPOINT = `${API_BASE_URL}/.netlify/functions/analyze-statement`;

  const fetchUsage = async () => {
    try {
      const response = await fetch(USAGE_ENDPOINT);
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Usage fetch error:', error);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

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

  const monthlyAverage = useMemo(() => {
    if (monthlySummary.length === 0) return 0;
    return totalLifetimeAmount / monthlySummary.length;
  }, [totalLifetimeAmount, monthlySummary]);

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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const analyzePromise = (async () => {
          const response = await fetch(ANALYZE_ENDPOINT, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Analiz hatası');
          }

          return response.json();
        })();

        toast.promise(analyzePromise, {
          loading: 'PDF Analiz ediliyor (Gemini AI)...',
          success: 'Analiz tamamlandı!',
          error: (err) => `Hata: ${err.message}`,
        });

        const data = await analyzePromise;
        setImportPreview(data);
        setIsImportPreviewOpen(true);
        fetchUsage(); // Update usage after successful analysis
      } catch (error: any) {
        console.error('Import error:', error);
      }
    };
    input.click();
  };

  const confirmImport = async () => {
    for (const item of importPreview) await addExpense(item);
    setIsImportPreviewOpen(false);
    setImportPreview([]);
  };

  const handleDeletePreviewItem = (idx: number) => setImportPreview(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="pt-3 md:pt-6 selection:bg-stone-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500">
      <div className="mb-8 flex items-center justify-center sm:justify-end overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-1 bg-white/50 dark:bg-zinc-900/50 p-1.5 rounded-[1.5rem] border border-stone-200/50 dark:border-zinc-800/50 backdrop-blur-sm min-w-max">
          {[
            { id: 'harcamalar', icon: FaWallet, label: t('expenses.expensesTab') },
            { id: 'raporlar', icon: FaChartLine, label: t('expenses.reportsTab') },
            { id: 'araclar', icon: FaCar, label: t('expenses.vehicleTab') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'harcamalar' | 'raporlar' | 'araclar')}
              className={`relative flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                ? 'text-white dark:text-stone-900'
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
                }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-stone-900 dark:bg-white rounded-[1.2rem] shadow-lg shadow-stone-900/10 dark:shadow-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon size={12} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'araclar' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="araclar-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <VehicleTab />
          </motion.div>
        </AnimatePresence>
      ) : (
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
              activeTab={activeTab as 'harcamalar' | 'raporlar'}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              monthOptions={monthOptions}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              showAddButton={activeTab === 'harcamalar'}
              onAddClick={() => {
                setIsEditing(false);
                setNewExpense({
                  title: '', amount: 0, category: categories[0] || 'Genel',
                  date: format(new Date(), 'yyyy-MM-dd'), installmentCount: 1, installmentCurrent: 1
                });
                setIsAddModalOpen(true);
              }}
            >
              <AnimatePresence>
                {activeTab === 'harcamalar' && selectedIds.size > 0 && (
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
                      monthlyAverage={monthlyAverage}
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
                      usage={usage}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </ExpensesLayout>
          </div>
        </div>
      )}



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