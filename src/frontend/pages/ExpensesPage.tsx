import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { FaLayerGroup, FaTrash, FaWallet, FaChartLine, FaCar, FaGem, FaUndo, FaHistory, FaReceipt, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useExpenses from '../hooks/useExpenses';
import type { Expense } from '../hooks/useExpenses';
import useInvestments from '../hooks/useInvestments';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { ParsedTransaction } from '../utils/pdfParserService';
import { FaBars, FaTimes } from 'react-icons/fa';


// Modular Components
import CategorySidebar from '../components/expenses/CategorySidebar';
import ExpensesLayout from '../components/expenses/ExpensesLayout';
import ExpensesHomeView from '../components/expenses/ExpensesHomeView';
import ReportsTab from '../components/expenses/ReportsTab';
import VehicleTab from '../components/expenses/VehicleTab';
import InvoiceTab from '../components/expenses/InvoiceTab';
import InvestmentsTab from '../components/expenses/InvestmentsTab';
import BudgetPlanner from '../components/expenses/BudgetPlanner';
import ExpenseModals from '../components/expenses/ExpenseModals';
import { useExpenseMigration } from '../hooks/useExpenseMigration';
import { useCategoryV2Migration } from '../hooks/useCategoryV2Migration';

const ExpensesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const {
    expenses,
    deletedExpenses,
    excludedExpenses,
    categories,
    isLoading: isLoadingExpenses,
    addExpense,
    addCategory,
    deleteExpense,
    restoreExpense,
    excludeExpense,
    includeExpense,
    hardDeleteExpense,
    updateExpense,
    bulkUpdateCategory,
    bulkDeleteExpenses,
    bulkExcludeExpenses,
    deleteCategory,
    addBulkExpenses
  } = useExpenses();

  const { user } = useAuth();

  const {
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    isLoading: isLoadingInvestments
  } = useInvestments();

  const { runMigration, isMigrating } = useExpenseMigration();
  const { runV2Migration, isMigrating: isMigratingV2 } = useCategoryV2Migration();



  // Check if v2 data exists
  const hasV2Data = useMemo(() => expenses.some(e => !!e.category2), [expenses]);

  // Active category field based on version
  const getCategoryField = useCallback((e: Expense) => {
    return e.category2 || e.category;
  }, []);

  const [activeTab, setActiveTab] = useState<'harcamalar' | 'raporlar' | 'araclar' | 'yatirimlar' | 'silinenler' | 'faturalar' | 'butce' | 'mukerrer'>('harcamalar');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'gelen' | 'giden'>('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isInvestmentEditing, setIsInvestmentEditing] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  //second navbar
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Missing States Added Here
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ParsedTransaction[]>([]);
  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // Delete Confirmation Modal
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [deleteItemTitle, setDeleteItemTitle] = useState('');
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<() => void>(() => () => { });

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    category: categories[0] || 'Genel',
    date: format(new Date(), 'yyyy-MM-dd'),
    installmentCount: 1,
    installmentCurrent: 1,
    direction: 'giden',
    type: '',
    source: '',
    description: ''
  });

  const [bulkCategory, setBulkCategory] = useState(categories[0] || 'Genel');

  // Investment Modal
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    title: '',
    amount: 0,
    buyPrice: 0,
    type: 'gold' as const,
    date: format(new Date(), 'yyyy-MM-dd')
  });

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
    let result = activeCategory === 'deleted' ? [...deletedExpenses] 
               : activeCategory === 'excluded' ? [...excludedExpenses] 
               : [...expenses];
    if (activeCategory !== 'all' && activeCategory !== 'deleted' && activeCategory !== 'excluded') {
      // v2 modunda category2 alanına göre filtrele
      result = result.filter(e => getCategoryField(e) === activeCategory);
    }
    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const start = startOfMonth(new Date(year, month - 1));
      const end = endOfMonth(new Date(year, month - 1));
      result = result.filter(e => isWithinInterval(parseISO(e.date), { start, end }));
    }
    if (directionFilter !== 'all') {
      result = result.filter(e => e.direction === directionFilter);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(e => {
        const dateObj = parseISO(e.date);
        const dateStr1 = format(dateObj, 'd MMMM yyyy', { locale: dateLocale }).toLowerCase();
        const dateStr2 = format(dateObj, 'dd.MM.yyyy');
        const dateStr3 = format(dateObj, 'dd/MM/yyyy');
        const catField = getCategoryField(e);

        const amountStr = e.amount.toString();
        const amountWithSign = e.direction === 'gelen' ? `+${amountStr}` : `-${amountStr}`;
        const dirStr = e.direction === 'gelen' ? 'gelir' : 'gider';
        
        return e.title.toLowerCase().includes(lowerSearch) ||
          catField.toLowerCase().includes(lowerSearch) ||
          dateStr1.includes(lowerSearch) ||
          dateStr2.includes(lowerSearch) ||
          dateStr3.includes(lowerSearch) ||
          e.date.includes(lowerSearch) ||
          amountStr.includes(lowerSearch) ||
          amountWithSign.includes(lowerSearch) ||
          dirStr.includes(lowerSearch);
      });
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
  }, [expenses, deletedExpenses, excludedExpenses, activeCategory, selectedMonth, directionFilter, searchTerm, sortBy, sortOrder, getCategoryField]);

  const totalFilteredAmount = useMemo(() => filteredExpenses.filter(e => e.direction !== 'gelen').reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  const totalLifetimeAmount = useMemo(() => expenses.filter(e => e.direction !== 'gelen').reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const dailyTrendData = useMemo(() => {
    if (selectedMonth === 'all') return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const amount = filteredExpenses
        .filter(e => e.date === dayStr && e.direction !== 'gelen')
        .reduce((sum, e) => sum + e.amount, 0);
      data.push({ day: i, amount });
    }
    return data;
  }, [selectedMonth, filteredExpenses]);

  const categoryBreakdownData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.filter(e => e.direction !== 'gelen').forEach(e => {
      const cat = getCategoryField(e);
      data[cat] = (data[cat] || 0) + e.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, getCategoryField]);

  const monthlyChartData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.filter(e => e.direction !== 'gelen').forEach(e => {
      const month = format(parseISO(e.date), 'MMM yy', { locale: dateLocale });
      data[month] = (data[month] || 0) + e.amount;
    });
    return Object.entries(data).map(([month, amount]) => ({ month, amount })).reverse().slice(-12);
  }, [expenses, dateLocale]);

  const monthlySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    expenses.filter(e => e.direction !== 'gelen').forEach(e => {
      const month = format(parseISO(e.date), 'MMMM yyyy', { locale: dateLocale });
      summary[month] = (summary[month] || 0) + e.amount;
    });
    return Object.entries(summary).map(([month, amount]) => ({ month, amount })).reverse();
  }, [expenses, dateLocale]);

  const monthlyAverage = useMemo(() => {
    if (monthlySummary.length === 0) return 0;
    return totalLifetimeAmount / monthlySummary.length;
  }, [totalLifetimeAmount, monthlySummary]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = getCategoryField(e);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [expenses, getCategoryField]);


  const totalCount = expenses.length;
  const mainTabs = [
    { id: 'harcamalar', icon: FaWallet, label: t('expenses.expensesTab') },
    { id: 'araclar', icon: FaCar, label: t('expenses.vehicleTab') },
  ] as const;

  const menuTabs = [
    { id: 'raporlar', icon: FaChartLine, label: t('expenses.reportsTab') },
    { id: 'butce', icon: FaHistory, label: 'Bütçe' },
    { id: 'yatirimlar', icon: FaGem, label: 'Yatırımlarım' },
    { id: 'faturalar', icon: FaReceipt, label: t('expenses.invoicesTab') },
  ] as const;
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

  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount || isSubmittingExpense) return;
    setIsSubmittingExpense(true);
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
        date: format(new Date(), 'yyyy-MM-dd'), installmentCount: 1, installmentCurrent: 1,
        direction: 'giden', type: '', source: '', description: ''
      });
    } catch (error) { console.error('Error handling expense:', error); }
    finally { setIsSubmittingExpense(false); }
  };

  const handleExcludeExpense = async (id: string) => {
    await excludeExpense(id);
    toast.success('Harcama Liste Dışı bırakıldı.', { icon: '👁️‍🗨️' });
  };

  const handleIncludeExpense = async (id: string) => {
    await includeExpense(id);
    toast.success('Harcama Listeye eklendi.', { icon: '🔄' });
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    toast.success('Harcama silindi. "Silinenler" kısmından geri alabilirsiniz.', {
      icon: '🗑️',
      duration: 3000
    });
  };

  const handleRestoreExpense = async (id: string) => {
    await restoreExpense(id);
    toast.success('Harcama geri yüklendi.', { icon: '🔄' });
  };

  const handleHardDeleteExpense = async (id: string) => {
    const expense = deletedExpenses.find(e => e.id === id);
    if (!expense) return;

    setDeleteItemTitle(expense.title);
    setConfirmDeleteAction(() => async () => {
      await hardDeleteExpense(id);
      toast.success('Harcama kalıcı olarak silindi.');
      setIsDeleteConfirmModalOpen(false);
    });
    setIsDeleteConfirmModalOpen(true);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    setDeleteItemTitle(categoryName);
    setConfirmDeleteAction(() => async () => {
      try {
        await deleteCategory(categoryName);
        toast.success(`${categoryName} kategorisi ve içeriği silindi.`);
        if (activeCategory === categoryName) setActiveCategory('all');
        setIsDeleteConfirmModalOpen(false);
      } catch (error) {
        toast.error('Kategori silinirken bir hata oluştu.');
      }
    });
    setIsDeleteConfirmModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setDeleteItemTitle(`${selectedIds.size} harcama`);
    setConfirmDeleteAction(() => async () => {
      await bulkDeleteExpenses(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsDeleteConfirmModalOpen(false);
      toast.success(`${selectedIds.size} harcama silindi.`);
    });
    setIsDeleteConfirmModalOpen(true);
  };

  const handleBulkExclude = async () => {
    if (window.confirm(t('expenses.bulkExcludeConfirm') || 'Seçili harcamaları liste dışı bırakmak istediğinize emin misiniz?')) {
      await bulkExcludeExpenses(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast.success('Seçili harcamalar liste dışı bırakıldı.', { icon: '👁️‍🗨️' });
    }
  };

  const handleEditClick = (expense: Expense) => {
    setNewExpense({
      ...expense,
      category: expense.category2 || expense.category
    });
    setIsEditing(true);
    setEditingId(expense.id);
    setIsAddModalOpen(true);
  };

  const [isBulkApplying, setIsBulkApplying] = useState(false);

  const applyBulkCategory = async () => {
    if (isBulkApplying) return;
    setIsBulkApplying(true);
    try {
      await bulkUpdateCategory({ ids: Array.from(selectedIds), category: bulkCategory });
      setIsBulkCategoryModalOpen(false);
      setSelectedIds(new Set());
    } finally {
      setIsBulkApplying(false);
    }
  };

  const confirmImport = async () => {
    try {
      const expensesToSave = importPreview.map(item => ({
        title: item.title,
        amount: Number(item.amount),
        date: item.date || new Date().toISOString().split('T')[0],
        category: item.category || 'Diğer',
        direction: item.direction || 'giden',
        source: item.source || '',
        type: item.type || '',
        description: item.description || '',
        installmentCount: 1
      }));

      await toast.promise(addBulkExpenses(expensesToSave), {
        loading: 'Harcamalar kaydediliyor...',
        success: 'Harcamalar başarıyla eklendi!',
        error: 'Kaydedilirken bir hata oluştu.',
      });

      setIsImportPreviewOpen(false);
      setImportPreview([]);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleDeletePreviewItem = (idx: number) => setImportPreview(prev => prev.filter((_, i) => i !== idx));

  const handlePdfImport = useCallback((transactions: ParsedTransaction[]) => {
    setImportPreview(transactions);
    setIsImportPreviewOpen(true);
  }, []);

  const handleJsonParse = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
      setImportPreview(dataArray);
      setIsJsonImportModalOpen(false);
      setIsImportPreviewOpen(true);
      setJsonInput('');
    } catch (error) {
      toast.error('Geçersiz JSON formatı. Lütfen kontrol edip tekrar deneyin.');
    }
  };

  const handleAddInvestment = async () => {
    if (!newInvestment.title || !newInvestment.amount || !newInvestment.buyPrice) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }
    try {
      if (isInvestmentEditing && editingInvestmentId) {
        await updateInvestment({
          id: editingInvestmentId,
          title: newInvestment.title,
          amount: Number(newInvestment.amount),
          buyPrice: Number(newInvestment.buyPrice),
          date: newInvestment.date
        });
        toast.success('Yatırım başarıyla güncellendi!');
      } else {
        await addInvestment({
          title: newInvestment.title,
          amount: Number(newInvestment.amount),
          buyPrice: Number(newInvestment.buyPrice),
          date: newInvestment.date,
          type: 'gold'
        } as any);
        toast.success('Yatırım başarıyla eklendi!');
      }

      setIsInvestmentModalOpen(false);
      setIsInvestmentEditing(false);
      setEditingInvestmentId(null);
      setNewInvestment({
        title: '',
        amount: 0,
        buyPrice: 0,
        type: 'gold' as const,
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Yatırım hatası:', error);
      toast.error('Yatırım kaydedilirken bir hata oluştu.');
    }
  };

  const handleEditInvestmentClick = (inv: any) => {
    setNewInvestment({
      title: inv.title,
      amount: inv.amount,
      buyPrice: inv.buyPrice,
      date: inv.date,
      type: inv.type
    });
    setIsInvestmentEditing(true);
    setEditingInvestmentId(inv.id);
    setIsInvestmentModalOpen(true);
  };

  const handleConvertToInvestment = (expense: Expense) => {
    setNewInvestment({
      title: expense.title,
      amount: 0,
      buyPrice: expense.amount,
      date: expense.date,
      type: 'gold'
    });
    setIsInvestmentModalOpen(true);
  };

  return (
    <div className="pt-3 md:pt-6 selection:bg-stone-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500">
      <div className="mb-8 flex items-center justify-center sm:justify-end">
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          {/* Ana sekmeler - her zaman görünür */}
          {[
            { id: 'harcamalar', icon: FaWallet, label: t('expenses.expensesTab') },
            { id: 'araclar', icon: FaCar, label: t('expenses.vehicleTab') },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMenuOpen(false);
                if (tab.id === 'harcamalar' && activeCategory === 'deleted') {
                  setActiveCategory('all');
                }
              }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-slate-900 dark:bg-white rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <tab.icon className="relative z-10 text-sm" />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          ))}

          {/* Ayraç */}
          <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1" />

          {/* Hamburger menü */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isMenuOpen || ['raporlar', 'butce', 'yatirimlar', 'faturalar', 'mukerrer'].includes(activeTab)
                ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                }`}
            >
              {isMenuOpen ? (
                <FaTimes className="text-sm" />
              ) : (
                <FaBars className="text-sm" />
              )}
              <span className="hidden sm:inline">Diğer</span>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl p-2 z-50"
                >
                  {[
                    { id: 'raporlar', icon: FaChartLine, label: t('expenses.reportsTab') },
                    { id: 'butce', icon: FaHistory, label: 'Bütçe' },
                    { id: 'yatirimlar', icon: FaGem, label: 'Yatırımlarım' },
                    { id: 'faturalar', icon: FaReceipt, label: t('expenses.invoicesTab') },
                  ].map((tab: any) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                        ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                      <tab.icon className="text-sm" />
                      <span>{tab.label}</span>
                      {activeTab === tab.id && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>
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
      ) : activeTab === 'faturalar' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="faturalar-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <InvoiceTab />
          </motion.div>
        </AnimatePresence>
      ) : activeTab === 'butce' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="butce-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <BudgetPlanner
              t={t}
              isDark={isDark}
              expenses={expenses}
              selectedMonth={selectedMonth}
            />
          </motion.div>
        </AnimatePresence>
      ) : activeTab === 'yatirimlar' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="yatirimlar-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <InvestmentsTab
              t={t}
              isDark={isDark}
              investments={investments}
              isLoading={isLoadingInvestments}
              onAddClick={() => {
                setIsInvestmentEditing(false);
                setEditingInvestmentId(null);
                setNewInvestment({
                  title: '',
                  amount: 0,
                  buyPrice: 0,
                  type: 'gold' as const,
                  date: format(new Date(), 'yyyy-MM-dd')
                });
                setIsInvestmentModalOpen(true);
              }}
              onEdit={handleEditInvestmentClick}
              onDelete={deleteInvestment}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 relative">
          <AnimatePresence>
            {isLoadingExpenses && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm rounded-[2.5rem]"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-stone-200 dark:border-zinc-800 border-t-stone-900 dark:border-t-white rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{t('common.loading') || 'Yükleniyor...'}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <CategorySidebar
            t={t}
            isDark={isDark}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categoryCounts={categoryCounts}
            totalCount={totalCount}
            deletedCount={deletedExpenses.length}
            excludedCount={excludedExpenses.length}
            onAddCategory={() => {
              const name = window.prompt(t('expenses.newCategoryPlaceholder'));
              if (name) addCategory(name);
            }}
            onDeleteCategory={handleDeleteCategory}
            onRunMigration={runMigration}
            isMigrating={isMigrating}
          />

          <div className="flex-1">
            <ExpensesLayout
              activeTab={activeTab as 'harcamalar' | 'raporlar' | 'silinenler'}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              monthOptions={monthOptions}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              showAddButton={activeTab === 'harcamalar'}
              onAddCategory={() => {
                const name = window.prompt(t('expenses.newCategoryPlaceholder'));
                if (name) addCategory(name);
              }}
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
                      <button onClick={handleBulkExclude} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all" title="Seçilenleri Liste Dışı Bırak">
                        <FaEyeSlash size={12} />
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
                  key={activeTab === 'harcamalar' ? activeCategory : activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {(activeTab === 'harcamalar' || activeTab === 'silinenler') && (
                    <ExpensesHomeView
                      t={t}
                      isDark={isDark}
                      dateLocale={dateLocale}
                      filteredExpenses={filteredExpenses}
                      totalFilteredAmount={activeCategory === 'deleted' || activeTab === 'silinenler' ? 0 : totalFilteredAmount}
                      totalLifetimeAmount={activeCategory === 'deleted' || activeTab === 'silinenler' ? 0 : totalLifetimeAmount}
                      monthlyAverage={activeCategory === 'deleted' || activeTab === 'silinenler' ? 0 : monthlyAverage}
                      selectedMonth={selectedMonth}
                      dailyTrendData={activeCategory === 'deleted' || activeTab === 'silinenler' ? [] : dailyTrendData}
                      categoryBreakdownData={activeCategory === 'deleted' || activeTab === 'silinenler' ? [] : categoryBreakdownData}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      sortOrder={sortOrder}
                      setSortOrder={setSortOrder}
                      directionFilter={directionFilter}
                      setDirectionFilter={setDirectionFilter}
                      selectedIds={selectedIds}
                      toggleSelect={toggleSelect}
                      toggleSelectAll={toggleSelectAll}
                      handleEditClick={activeCategory === 'deleted' || activeTab === 'silinenler' ? (e: Expense) => handleRestoreExpense(e.id) : handleEditClick}
                      handleDeleteExpense={activeCategory === 'deleted' || activeTab === 'silinenler' ? handleHardDeleteExpense : handleDeleteExpense}
                      onExcludeExpense={handleExcludeExpense}
                      onIncludeExpense={handleIncludeExpense}
                      isTrashView={activeCategory === 'deleted' || activeTab === 'silinenler'}
                      isExcludedView={activeCategory === 'excluded'}
                      visibleCount={visibleCount}
                      setVisibleCount={setVisibleCount}
                      onConvertToInvestment={handleConvertToInvestment}
                      getCategoryField={getCategoryField}
                    />
                  )}
                  {activeTab === 'raporlar' && (
                    <ReportsTab
                      t={t}
                      isDark={isDark}
                      monthlyChartData={monthlyChartData}
                      monthlySummary={monthlySummary}
                      onPdfImport={handlePdfImport}
                      expenses={expenses}
                      categories={categories}
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
        isInvestmentModalOpen={isInvestmentModalOpen}
        setIsInvestmentModalOpen={(open) => {
          setIsInvestmentModalOpen(open);
          if (!open) {
            setIsInvestmentEditing(false);
            setEditingInvestmentId(null);
          }
        }}
        newInvestment={newInvestment}
        setNewInvestment={setNewInvestment}
        handleAddInvestment={handleAddInvestment}
        isInvestmentEditing={isInvestmentEditing}
        isDeleteConfirmModalOpen={isDeleteConfirmModalOpen}
        setIsDeleteConfirmModalOpen={setIsDeleteConfirmModalOpen}
        deleteItemTitle={deleteItemTitle}
        confirmDeleteAction={confirmDeleteAction}
        isJsonImportModalOpen={isJsonImportModalOpen}
        setIsJsonImportModalOpen={setIsJsonImportModalOpen}
        jsonInput={jsonInput}
        setJsonInput={setJsonInput}
        handleJsonParse={handleJsonParse}
      />
    </div>
  );
};

export default ExpensesPage;