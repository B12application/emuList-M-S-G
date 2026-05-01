// src/pages/ExpensesPage.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import useExpenses from '../hooks/useExpenses';
import type { NewExpense, Expense } from '../hooks/useExpenses';
import { FaPlus, FaTrash, FaWallet, FaChartBar, FaList, FaTag, FaEdit, FaFileImport, FaCalendarAlt, FaCheckCircle, FaCheck, FaSearch, FaTimes, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { format, parse, isValid, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import toast from 'react-hot-toast';
import CalendarPicker from '../components/CalendarPicker';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';

export default function ExpensesPage() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const {
    expenses,
    categories,
    addExpense,
    addCategory,
    addBulkExpenses,
    deleteExpense,
    updateExpense,
    bulkUpdateCategory,
    deleteCategory,
    isLoading
  } = useExpenses();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'expenses' | 'reports'>('expenses');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    variant: 'danger',
  });

  // Import State
  const [importText, setImportText] = useState('');
  const [parsedImportData, setParsedImportData] = useState<NewExpense[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    newCategory: '',
    description: '',
    installmentCount: '1',
  });

  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');

  // Clear selection when category or month changes
  useEffect(() => {
    setSelectedIds(new Set());
    setIsBulkCategoryModalOpen(false);
  }, [activeCategory, selectedMonth]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const dateLocale = language === 'tr' ? tr : enUS;

  // Month Options for filtering
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(exp => {
      try {
        const date = parseISO(exp.date);
        if (isValid(date)) {
          months.add(format(date, 'yyyy-MM'));
        }
      } catch (e) { }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [activeCategory, selectedMonth, searchTerm, sortBy, sortOrder]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    if (activeCategory !== 'all') {
      filtered = filtered.filter((e) => e.category === activeCategory);
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter((e) => e.date.startsWith(selectedMonth));
    }

    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((e) => 
        e.title.toLowerCase().includes(lowerSearch) || 
        e.category.toLowerCase().includes(lowerSearch) ||
        e.amount.toString().includes(lowerSearch) ||
        (e.description && e.description.toLowerCase().includes(lowerSearch))
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      } else {
        return sortOrder === 'desc'
          ? b.amount - a.amount
          : a.amount - b.amount;
      }
    });
  }, [expenses, activeCategory, selectedMonth, searchTerm, sortBy, sortOrder]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};

    filteredExpenses.forEach((exp) => {
      const monthKey = format(parseISO(exp.date), 'MMM yyyy', { locale: dateLocale });
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = 0;
      }
      monthlyTotals[monthKey] += exp.amount;
    });

    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month, total }))
      .reverse(); // assuming expenses are sorted desc by date
  }, [filteredExpenses, dateLocale]);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.category,
      newCategory: '',
      description: expense.description || '',
      installmentCount: expense.installmentCount?.toString() || '1',
    });
    setIsNewCategory(false);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingExpense) {
        await updateExpense({
          id: editingExpense.id,
          title: formData.title,
          amount: parseFloat(formData.amount),
          date: formData.date,
          category: formData.category,
          description: formData.description,
        });
        toast.success(t('expenses.updateSuccess'));
      } else if (isNewCategory && !formData.title) {
        await addCategory(formData.newCategory);
        toast.success(t('expenses.categoryAddSuccess'));
        setActiveCategory(formData.newCategory);
      } else {
        const expense: NewExpense = {
          title: formData.title,
          amount: parseFloat(formData.amount),
          date: formData.date,
          category: isNewCategory ? formData.newCategory : formData.category,
          description: formData.description,
          installmentCount: parseInt(formData.installmentCount),
        };

        await addExpense(expense);
        toast.success(t('expenses.addSuccess'));
        if (isNewCategory) {
          setActiveCategory(expense.category);
        }
      }

      setIsAddModalOpen(false);
      setEditingExpense(null);
      setFormData({
        title: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: categories.length > 0 ? categories[0] : '',
        newCategory: '',
        description: '',
        installmentCount: '1',
      });
      setIsNewCategory(false);
    } catch (error) {
      console.error(error);
      toast.error(t('common.error'));
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (selectedIds.size === 0 || !selectedBulkCategory) return;

    try {
      await bulkUpdateCategory({
        ids: Array.from(selectedIds),
        category: selectedBulkCategory
      });
      setSelectedIds(new Set());
      setIsBulkCategoryModalOpen(false);
      setSelectedBulkCategory('');
      toast.success(t('expenses.updateSuccess'));
    } catch (error) {
      console.error('Bulk category update error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setConfirmConfig({
      isOpen: true,
      title: t('expenses.bulkDeleteTitle'),
      message: t('expenses.bulkDeleteMessage').replace('{count}', selectedIds.size.toString()),
      variant: 'danger',
      onConfirm: async () => {
        try {
          for (const id of Array.from(selectedIds)) {
            await deleteExpense(id);
          }
          setSelectedIds(new Set());
          toast.success(t('expenses.bulkDeleteSuccess'));
        } catch (error) {
          console.error('Bulk delete error:', error);
          toast.error(t('expenses.bulkDeleteError'));
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExpenses.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteExpense = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t('common.delete'),
      message: t('expenses.confirmDelete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteExpense(id);
          toast.success(t('expenses.deleteSuccess'));
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          toast.error(t('common.error'));
        }
      }
    });
  };

  const handleDeleteCategory = (category: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t('expenses.confirmDeleteCategoryTitle'),
      message: t('expenses.confirmDeleteCategory'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCategory(category);
          toast.success(t('expenses.deleteCategorySuccess'));
          if (activeCategory === category) {
            setActiveCategory('all');
          }
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          toast.error(t('common.error'));
        }
      }
    });
  };

  // Statement Parser
  const handleParseStatement = useCallback(() => {
    if (!importText.trim()) return;

    const lines = importText.split('\n');
    const expenses: NewExpense[] = [];

    lines.forEach(line => {
      const dateMatch = line.match(/(\d{2}[./-]\d{2}[./-]\d{2,4})|(\d{4}[./-]\d{2}[./-]\d{2})/);
      if (dateMatch) {
        const fullDate = dateMatch[0];
        let dateStr = '';

        try {
          const formats = ['dd.MM.yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy'];
          for (const f of formats) {
            const parsed = parse(fullDate, f, new Date());
            if (isValid(parsed)) {
              dateStr = format(parsed, 'yyyy-MM-dd');
              break;
            }
          }
        } catch (e) { }

        if (dateStr) {
          const rest = line.replace(fullDate, '').trim();
          const amountMatch = rest.match(/(\d+[,.]\d{2})$|(\d+[,.]\d{2})\s|(\d+)$/);

          if (amountMatch) {
            const amountStr = (amountMatch[1] || amountMatch[2] || amountMatch[3]).replace(',', '.');
            const amount = parseFloat(amountStr);
            const title = rest.replace(amountMatch[0], '').trim() || 'Imported Expense';

            if (!isNaN(amount)) {
              expenses.push({
                title,
                amount,
                date: dateStr,
                category: categories[0] || 'General',
                description: 'Imported'
              });
            }
          }
        }
      }
    });

    if (expenses.length > 0) {
      setParsedImportData(expenses);
      setIsPreviewModalOpen(true);
    } else {
      toast.error(t('expenses.noDataParsed'));
    }
  }, [importText, categories, t]);

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setParsedImportData(json);
          setIsPreviewModalOpen(true);
          toast.success(t('expenses.jsonLoaded'));
        } else {
          toast.error(t('expenses.invalidJson'));
        }
      } catch (err) {
        toast.error(t('expenses.invalidJson'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    try {
      await addBulkExpenses(parsedImportData);
      toast.success(t('expenses.importSuccess'));
      setIsPreviewModalOpen(false);
      setImportText('');
      setParsedImportData([]);
    } catch (error) {
      console.error(error);
      toast.error(t('common.error'));
    }
  };

  // Monthly Summary Data
  const monthlySummary = useMemo(() => {
    const summary: Record<string, { total: number; count: number; date: Date }> = {};

    expenses.forEach(exp => {
      const date = parseISO(exp.date);
      const monthKey = format(date, 'yyyy-MM');
      if (!summary[monthKey]) {
        summary[monthKey] = { total: 0, count: 0, date };
      }
      summary[monthKey].total += exp.amount;
      summary[monthKey].count += 1;
    });

    return Object.entries(summary)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, data]) => ({
        month: format(data.date, 'MMMM yyyy', { locale: dateLocale }),
        total: data.total,
        count: data.count
      }));
  }, [expenses, dateLocale]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const totalLifetimeAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  // Sorted Categories by frequency (highest to lowest)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const countA = expenses.filter(e => e.category === a).length;
      const countB = expenses.filter(e => e.category === b).length;
      return countB - countA;
    });
  }, [categories, expenses]);

  // Daily trend for the selected month
  const dailyTrendData = useMemo(() => {
    if (selectedMonth === 'all') return [];

    const daysInMonth = new Date(
      parseInt(selectedMonth.split('-')[0]),
      parseInt(selectedMonth.split('-')[1]),
      0
    ).getDate();

    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: 0
    }));

    filteredExpenses.forEach(exp => {
      const day = new Date(exp.date).getDate();
      if (data[day - 1]) {
        data[day - 1].amount += exp.amount;
      }
    });

    return data;
  }, [filteredExpenses, selectedMonth]);

  // Category breakdown for the selected month/view
  const categoryBreakdownData = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount;
    });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen text-stone-500 dark:text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-2 sm:px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative z-0">
      {/* Sidebar - Categories */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 sticky top-28">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <FaWallet className="text-stone-400 dark:text-zinc-500" />
              {t('expenses.title')}
            </h2>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[calc(100vh-420px)] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`text-left px-3 py-2.5 rounded-xl transition-all duration-300 font-bold text-[11px] flex items-center justify-between uppercase tracking-wider ${activeCategory === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950 shadow-md'
                : 'text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800/50'
                }`}
            >
              <span>{t('list.all')}</span>
              <span className="opacity-50 font-black">{expenses.length}</span>
            </button>

            {sortedCategories.map((cat) => (
              <div key={cat} className="relative group">
                <div
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full cursor-pointer text-left px-3 py-2.5 rounded-xl transition-all duration-300 font-bold text-[11px] flex items-center justify-between ${activeCategory === cat
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950 shadow-lg scale-[1.02]'
                    : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800/50'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center transition-colors ${activeCategory === cat ? 'bg-stone-800 dark:bg-stone-100' : 'bg-stone-100 dark:bg-zinc-800'}`}>
                      <FaTag className={`text-[8px] ${activeCategory === cat ? 'text-white dark:text-stone-900' : 'text-stone-400'}`} />
                    </div>
                    <span className="truncate pr-2">{cat}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-black ${activeCategory === cat ? 'opacity-60' : 'opacity-40'}`}>
                      {expenses.filter(e => e.category === cat).length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat);
                      }}
                      className={`p-1.5 rounded-lg transition-all ${activeCategory === cat
                        ? 'text-white/50 hover:text-red-400'
                        : 'text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100'
                        }`}
                      title={t('common.delete')}
                    >
                      <FaTrash className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                setIsNewCategory(true);
                setIsAddModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-50 dark:bg-zinc-800/50 text-stone-600 dark:text-zinc-400 rounded-2xl font-bold text-xs hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors border border-stone-100 dark:border-zinc-800"
            >
              <FaPlus className="text-[10px]" />
              {t('expenses.addCategory')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-8">
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white">
              {activeCategory === 'all' ? t('expenses.title') : activeCategory}
            </h1>
            <p className="text-sm font-medium text-stone-500 dark:text-zinc-400 mt-1">
              {t('expenses.totalLabel')}: <span className="text-stone-900 dark:text-white font-bold">{t('expenses.currency')}{totalFilteredAmount.toLocaleString()}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setIsNewCategory(false);
              if (activeCategory !== 'all') {
                setFormData(prev => ({ ...prev, category: activeCategory }));
              } else if (categories.length > 0) {
                setFormData(prev => ({ ...prev, category: categories[0] }));
              }
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-sm shadow-lg hover:scale-105 transition-transform"
          >
            <FaPlus />
            {t('expenses.addExpense')}
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex bg-stone-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-full sm:w-72">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'expenses'
                ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-300'
                }`}
            >
              <FaList />
              {t('expenses.expensesTab')}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'reports'
                ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-300'
                }`}
            >
              <FaChartBar />
              {t('expenses.reportsTab')}
            </button>
          </div>

          {activeTab === 'expenses' && (
            <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-4 min-w-0">
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedMonth('all')}
                    className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === 'all'
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950'
                      : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                      }`}
                  >
                    {t('list.all')}
                  </button>
                  {monthOptions.map((month) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === month
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                      {format(parseISO(`${month}-01`), 'MMM yyyy', { locale: dateLocale })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group w-full md:w-64 shrink-0">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 dark:group-focus-within:text-white transition-colors text-[10px]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('common.searchPlaceholder')}
                  className="w-full bg-stone-100 dark:bg-zinc-800 border-none rounded-2xl py-3 pl-11 pr-11 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                )}
              </div>

              {/* Sort Controls */}
              <div className="flex bg-stone-100 dark:bg-zinc-800 p-1 rounded-2xl shrink-0">
                <button
                  onClick={() => setSortBy('date')}
                  className={`p-2.5 rounded-xl transition-all ${sortBy === 'date'
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-400'
                    }`}
                  title={t('common.sortDate')}
                >
                  <FaCalendarAlt className="text-xs" />
                </button>
                <button
                  onClick={() => setSortBy('amount')}
                  className={`p-2.5 rounded-xl transition-all ${sortBy === 'amount'
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-400'
                    }`}
                  title={t('common.sortAmount')}
                >
                  <FaWallet className="text-xs" />
                </button>
                <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-700 mx-1 self-center" />
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="p-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-400 rounded-xl transition-all"
                  title={sortOrder === 'desc' ? t('common.desc') : t('common.asc')}
                >
                  {sortOrder === 'desc' ? (
                    <FaSortAmountDown className="text-xs" />
                  ) : (
                    <FaSortAmountUp className="text-xs" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'reports' ? (
          <div className="space-y-8">
            {/* Charts Section */}
            {chartData.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
                <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                  <FaChartBar className="text-stone-400 dark:text-zinc-500" />
                  {t('expenses.monthlyChartTitle')}
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f5f5f4'} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDark ? '#a1a1aa' : '#78716c', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDark ? '#a1a1aa' : '#78716c', fontSize: 12 }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? '#27272a' : '#f5f5f4' }}
                        contentStyle={{
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          borderRadius: '12px',
                          border: isDark ? '1px solid #27272a' : '1px solid #e7e5e4',
                          color: isDark ? '#ffffff' : '#1c1917',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: any) => [`${t('expenses.currency')}${value?.toLocaleString() ?? 0}`, t('expenses.totalLabel')]}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={isDark ? '#ffffff' : '#1c1917'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Monthly Summary Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" />
                {t('expenses.monthlySummary')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest border-b border-stone-100 dark:border-zinc-800">
                      <th className="pb-4 pl-2">{t('expenses.monthColumn')}</th>
                      <th className="pb-4 text-center">{t('expenses.countColumn')}</th>
                      <th className="pb-4 text-right pr-2">{t('expenses.totalLabel')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/50">
                    {monthlySummary.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-stone-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 pl-2 text-sm font-bold text-stone-700 dark:text-zinc-300">{item.month}</td>
                        <td className="py-4 text-center text-sm font-semibold text-stone-500 dark:text-zinc-500">{item.count}</td>
                        <td className="py-4 text-right pr-2 text-sm font-black text-stone-900 dark:text-white">
                          {t('expenses.currency')}{item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Module */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                <FaFileImport className="text-stone-400 dark:text-zinc-500" />
                {t('expenses.importStatement')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mb-4 leading-relaxed">
                {t('expenses.pasteStatement')}
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                className="w-full p-4 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-stone-900 dark:focus:ring-white outline-none resize-none mb-4"
                placeholder="Örn: 01.05.2024 Market Harcaması 150.00"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleParseStatement}
                  className="flex-1 py-3 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <FaCheckCircle className="text-sm" />
                  {t('expenses.parseAndImport')}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <FaFileImport className="text-sm" />
                  JSON
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleJsonImport}
                  accept=".json"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Expenses List & Stats */
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-4 sm:p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t('expenses.totalLabel')}</p>
                <h4 className="text-xl font-black text-stone-900 dark:text-white">
                  {t('expenses.currency')}{totalFilteredAmount.toLocaleString()}
                </h4>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-4 sm:p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Toplam (Tüm Zamanlar)</p>
                <h4 className="text-xl font-black text-stone-900 dark:text-white text-emerald-600 dark:text-emerald-400">
                  {t('expenses.currency')}{totalLifetimeAmount.toLocaleString()}
                </h4>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-4 sm:p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t('expenses.countColumn')}</p>
                <h4 className="text-xl font-black text-stone-900 dark:text-white">
                  {filteredExpenses.length} <span className="text-xs font-bold text-stone-400">İşlem</span>
                </h4>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-4 sm:p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Ortalama</p>
                <h4 className="text-xl font-black text-stone-900 dark:text-white">
                  {t('expenses.currency')}{(filteredExpenses.length > 0 ? totalFilteredAmount / filteredExpenses.length : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h4>
              </div>
            </div>

            {/* Charts Section */}
            {selectedMonth !== 'all' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 h-[300px]">
                  <h3 className="text-xs font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Harcama Akışı (Günlük)</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={dailyTrendData}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1c1917" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#1c1917" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, 'Tutar']}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#1c1917" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 h-[300px]">
                  <h3 className="text-xs font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Kategori Dağılımı</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryBreakdownData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#1c1917', '#44403c', '#78716c', '#a8a29e', '#d6d3d1'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] px-2 py-4 sm:p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
              <div className="flex items-center justify-between mb-4 sm:mb-6 px-2 sm:px-0">
                <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <FaList className="text-stone-400 dark:text-zinc-500" />
                  {selectedMonth === 'all' ? t('expenses.title') : format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: dateLocale })}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="text-[10px] font-black text-stone-400 hover:text-stone-900 dark:hover:text-white uppercase tracking-widest transition-colors"
                    >
                      {selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0 ? t('common.deselectAll') : t('common.selectAll')}
                    </button>
                    <div className="w-1 h-1 rounded-full bg-stone-200 dark:bg-zinc-800" />
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      {filteredExpenses.length} {t('expenses.transactionCount')}
                    </span>
                  </div>
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-stone-400 dark:text-zinc-500">
                  <FaTag className="text-4xl mb-4 opacity-20" />
                  <p className="text-sm font-medium">{t('expenses.noExpenses')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredExpenses.slice(0, visibleCount).map((expense) => (
                      <motion.div
                        layout
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group p-3 sm:p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ${selectedIds.has(expense.id)
                          ? 'bg-stone-900 border-stone-900 dark:bg-white dark:border-white shadow-lg translate-x-1'
                          : 'bg-stone-50/50 dark:bg-zinc-800/30 border-stone-100 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md'
                          }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto flex-1 min-w-0">
                          {/* Selection Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(expense.id);
                            }}
                            className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.has(expense.id)
                              ? 'bg-transparent border-white/30 dark:border-zinc-950/30'
                              : 'border-stone-200 dark:border-zinc-700 hover:border-stone-400 dark:hover:border-zinc-500'
                              }`}
                          >
                            {selectedIds.has(expense.id) && (
                              <FaCheck className={`text-[8px] ${selectedIds.has(expense.id) ? 'text-white dark:text-zinc-950' : ''}`} />
                            )}
                          </div>

                          <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center shadow-inner transition-colors ${selectedIds.has(expense.id) ? 'bg-white/10' : 'bg-white dark:bg-zinc-900'}`}>
                            <FaTag className={`text-[10px] sm:text-xs ${selectedIds.has(expense.id) ? 'text-white dark:text-zinc-950' : 'text-stone-400'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-sm font-bold truncate ${selectedIds.has(expense.id) ? 'text-white dark:text-zinc-950' : 'text-stone-900 dark:text-white'}`}>
                              {expense.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                              <span className={`text-[10px] font-medium ${selectedIds.has(expense.id) ? 'text-white/60 dark:text-zinc-950/60' : 'text-stone-400 dark:text-zinc-500'}`}>
                                {format(parseISO(expense.date), 'dd MMM yyyy', { locale: dateLocale })}
                              </span>
                              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight ${selectedIds.has(expense.id)
                                ? 'bg-white/10 text-white dark:bg-zinc-950/10 dark:text-zinc-950'
                                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
                                }`}>
                                {expense.category}
                              </span>
                            </div>
                            {expense.installmentCount && expense.installmentCount > 1 && (
                              <span className="text-[9px] sm:text-[10px] inline-block mt-1 font-black px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-900/50">
                                {t('expenses.installmentNote').replace('{current}', expense.installmentCurrent?.toString() || '1').replace('{total}', expense.installmentCount.toString())}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-8 sm:pl-0">
                          <span className="font-black text-base sm:text-lg text-stone-900 dark:text-white mr-auto sm:mr-3">
                            {t('expenses.currency')}{expense.amount.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1.5 sm:gap-2 transition-opacity shrink-0">
                            <button
                              onClick={() => handleEditClick(expense)}
                              className="p-2 sm:p-2.5 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white transition-all bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-700 hover:scale-110"
                              title={t('common.edit')}
                            >
                              <FaEdit className="text-xs sm:text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-2 sm:p-2.5 text-stone-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-all bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-700 hover:scale-110"
                              title={t('common.delete')}
                            >
                              <FaTrash className="text-xs sm:text-sm" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {visibleCount < filteredExpenses.length && (
                    <div className="pt-6 pb-2 flex justify-center">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 50)}
                        className="px-6 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                      >
                        {t('common.loadMore') || 'Daha Fazla Yükle'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg"
                >
                  <div className="bg-stone-900 dark:bg-white text-white dark:text-zinc-950 px-6 py-4 rounded-3xl shadow-2xl border border-white/10 dark:border-zinc-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-xs font-black shadow-lg shadow-red-500/20">
                        {selectedIds.size}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{t('expenses.selectedCount')}</p>
                        <p className="text-sm font-black">
                          {t('expenses.totalValue')}: {t('expenses.currency')}
                          {filteredExpenses.filter(e => selectedIds.has(e.id)).reduce((a, b) => a + b.amount, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsBulkCategoryModalOpen(true)}
                        className="px-6 py-2.5 bg-stone-800 dark:bg-stone-100 hover:bg-stone-700 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                      >
                        <FaTag />
                        {t('bulk.changeCategory')}
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant as 'danger' | 'warning'}
      />

      {/* Bulk Category Change Modal */}
      <AnimatePresence>
        {isBulkCategoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkCategoryModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-stone-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center">
                  <FaTag className="text-xl text-stone-900 dark:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 dark:text-white">
                    {t('bulk.bulkCategoryTitle')}
                  </h3>
                  <p className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-widest">
                    {selectedIds.size} {t('expenses.selectedCount')}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <CustomSelect
                  label={t('bulk.bulkCategorySelect')}
                  options={categories}
                  value={selectedBulkCategory}
                  onChange={setSelectedBulkCategory}
                  placeholder={t('expenses.selectCategory')}
                />

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsBulkCategoryModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleBulkCategoryUpdate}
                    disabled={!selectedBulkCategory}
                    className="flex-1 py-3 px-4 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {t('common.confirm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Preview Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute inset-0 bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl border border-stone-200/50 dark:border-zinc-800/50 max-h-[80vh] flex flex-col"
            >
              <h2 className="text-xl font-black text-stone-900 dark:text-white mb-6 flex items-center gap-3">
                <FaFileImport className="text-stone-400" />
                {t('expenses.previewImport')}
                <span className="text-xs font-bold px-2 py-1 bg-stone-100 dark:bg-zinc-800 text-stone-500 rounded-lg ml-auto">
                  {t('expenses.parsedExpenses').replace('{count}', parsedImportData.length.toString())}
                </span>
              </h2>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-6">
                {parsedImportData.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">{item.title}</p>
                      <p className="text-[10px] text-stone-500 font-medium">{item.date}</p>
                    </div>
                    <span className="text-sm font-black text-stone-900 dark:text-white">
                      {t('expenses.currency')}{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="flex-1 py-3.5 bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-stone-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleImportConfirm}
                  className="flex-[2] py-3.5 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
                >
                  {t('expenses.confirmImport')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[400px] bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-stone-200/50 dark:border-zinc-800/50"
            >
              <h2 className="text-lg font-black text-stone-900 dark:text-white mb-6 px-1">
                {editingExpense
                  ? t('expenses.editExpense')
                  : isNewCategory
                    ? t('expenses.addCategory')
                    : t('expenses.addExpense')}
              </h2>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {!editingExpense && (
                  <div className="flex bg-stone-100 dark:bg-zinc-800 p-1 rounded-2xl mb-4">
                    <button
                      type="button"
                      onClick={() => setIsNewCategory(false)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${!isNewCategory ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500'}`}
                    >
                      {t('expenses.addExpense')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewCategory(true)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${isNewCategory ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500'}`}
                    >
                      {t('expenses.addCategory')}
                    </button>
                  </div>
                )}

                {isNewCategory ? (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 mb-1.5 ml-1">
                      {t('expenses.categoryName')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.newCategory}
                      onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-2xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all text-sm font-semibold"
                      placeholder={t('expenses.newCategoryPlaceholder')}
                    />
                    <p className="text-[10px] text-stone-400 mt-2 ml-1 italic">
                      {t('expenses.confirmDeleteCategory').split('?')[0]}?
                    </p>
                  </div>
                ) : (
                  <>
                    <CustomSelect
                      label={t('expenses.category')}
                      options={categories}
                      value={formData.category}
                      onChange={(val) => setFormData({ ...formData, category: val })}
                      placeholder={t('expenses.selectCategory')}
                    />

                    <div>
                      <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 mb-1.5 ml-1">
                        {t('expenses.expenseTitle')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-2xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all text-sm font-semibold"
                        placeholder="e.g., Gas, Hotel"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 mb-1.5 ml-1">
                          {t('expenses.amount')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-400 dark:text-zinc-500">
                            {t('expenses.currency')}
                          </span>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full pl-8 pr-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-2xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all text-sm font-black"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <CalendarPicker
                        label={t('expenses.date')}
                        selectedDate={formData.date}
                        onChange={(val) => setFormData({ ...formData, date: val })}
                      />
                    </div>

                    {!editingExpense && (
                      <CustomSelect
                        label={t('expenses.installmentCount')}
                        options={['1', '2', '3', '6', '9', '12'].map(num =>
                          num === '1' ? t('expenses.singlePayment') : `${num} ${t('expenses.installments')}`
                        )}
                        value={formData.installmentCount === '1'
                          ? t('expenses.singlePayment')
                          : `${formData.installmentCount} ${t('expenses.installments')}`
                        }
                        onChange={(val) => {
                          const num = val === t('expenses.singlePayment') ? '1' : val.split(' ')[0];
                          setFormData({ ...formData, installmentCount: num });
                        }}
                      />
                    )}

                    <div>
                      <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 mb-1.5 ml-1">
                        {t('expenses.description')}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-2xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all text-sm font-semibold resize-none"
                        placeholder="Optional details..."
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingExpense(null);
                    }}
                    className="flex-1 py-2.5 px-4 bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white rounded-xl font-bold text-sm hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
                  >
                    {editingExpense
                      ? t('common.save')
                      : isNewCategory
                        ? (formData.title ? t('expenses.addExpense') : t('expenses.createCategory'))
                        : t('expenses.addExpense')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
