// src/pages/ExpensesPage.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import useExpenses from '../hooks/useExpenses';
import type { NewExpense, Expense } from '../hooks/useExpenses';
import { FaPlus, FaTrash, FaWallet, FaChartBar, FaList, FaTag, FaEdit, FaFileImport, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import { format, parse, isValid, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
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
    deleteCategory,
    isLoading 
  } = useExpenses();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'expenses' | 'reports'>('expenses');
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
    onConfirm: () => {},
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const dateLocale = language === 'tr' ? tr : enUS;

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    if (activeCategory === 'all') return expenses;
    return expenses.filter((e) => e.category === activeCategory);
  }, [expenses, activeCategory]);

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

    // Enhanced regex to match typical bank statement lines: Date - Description - Amount
    // Example: 01/05/2026 MARKET HARCAMASI 125.50
    const lines = importText.split('\n');
    const expenses: NewExpense[] = [];
    const dateRegex = /(\d{2})[./-](\d{2})[./-](\d{2,4})/;

    lines.forEach(line => {
      // More flexible date regex: matches DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
      const dateMatch = line.match(/(\d{2}[./-]\d{2}[./-]\d{2,4})|(\d{4}[./-]\d{2}[./-]\d{2})/);
      if (dateMatch) {
        const fullDate = dateMatch[0];
        let dateStr = '';
        
        // Try to parse whatever format we found
        try {
          const formats = ['dd.MM.yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy'];
          for (const f of formats) {
            const parsed = parse(fullDate, f, new Date());
            if (isValid(parsed)) {
              dateStr = format(parsed, 'yyyy-MM-dd');
              break;
            }
          }
        } catch (e) {}

        if (dateStr) {
          // Remove date and try to extract amount
          const rest = line.replace(fullDate, '').trim();
          // Extract amount at end or middle: handles 123.45 or 1.234,56
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
    // Reset input
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
      .map(([key, data]) => ({
        month: format(data.date, 'MMMM yyyy', { locale: dateLocale }),
        total: data.total,
        count: data.count
      }));
  }, [expenses, dateLocale]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen text-stone-500 dark:text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative z-0">
      {/* Sidebar - Categories */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 sticky top-28">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <FaWallet className="text-stone-400 dark:text-zinc-500" />
              {t('expenses.title')}
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`text-left px-4 py-3 rounded-2xl transition-all duration-300 font-medium text-sm flex items-center justify-between ${activeCategory === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950 shadow-md'
                : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800/50'
                }`}
            >
              <span>{t('list.all')}</span>
              {activeCategory === 'all' && (
                <span className="text-xs opacity-70">
                  {t('expenses.currency')}{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </span>
              )}
            </button>

            {categories.map((cat) => (
              <div key={cat} className="relative group">
                <div
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full cursor-pointer text-left px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm flex items-center justify-between ${
                    activeCategory === cat
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950 shadow-lg scale-[1.02]'
                      : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeCategory === cat ? 'bg-stone-800 dark:bg-stone-100' : 'bg-stone-100 dark:bg-zinc-800'}`}>
                      <FaTag className={`text-[10px] ${activeCategory === cat ? 'text-white dark:text-stone-900' : 'text-stone-400'}`} />
                    </div>
                    <span className="truncate max-w-[100px]">{cat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black ${activeCategory === cat ? 'opacity-60' : 'opacity-40'}`}>
                      {expenses.filter(e => e.category === cat).length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat);
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        activeCategory === cat 
                          ? 'text-white/50 hover:text-red-400' 
                          : 'text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100'
                      }`}
                      title={t('common.delete')}
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                setIsNewCategory(true);
                setIsAddModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <FaPlus className="text-xs" />
              {t('expenses.addCategory')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-8">
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
        <div className="flex bg-stone-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-full sm:w-72">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'expenses' 
                ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm' 
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-300'
            }`}
          >
            <FaList />
            {t('expenses.expensesTab')}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'reports' 
                ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm' 
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-300'
            }`}
          >
            <FaChartBar />
            {t('expenses.reportsTab')}
          </button>
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
          /* Expenses List */
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 flex-1">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
              <FaList className="text-stone-400 dark:text-zinc-500" />
              {t('expenses.title')}
            </h3>

          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400 dark:text-zinc-500">
              <FaTag className="text-4xl mb-4 opacity-20" />
              <p className="text-sm font-medium">{t('expenses.noExpenses')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredExpenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 group hover:border-stone-200 dark:hover:border-zinc-700 transition-colors gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-stone-900 dark:text-white">{expense.title}</h4>
                        {activeCategory === 'all' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-200 dark:bg-zinc-700 text-stone-600 dark:text-zinc-300 rounded-full">
                            {expense.category}
                          </span>
                        )}
                        {expense.installmentCount && expense.installmentCount > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-900/50">
                            {t('expenses.installmentNote').replace('{current}', expense.installmentCurrent?.toString() || '1').replace('{total}', expense.installmentCount.toString())}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                        {format(parseISO(expense.date), 'dd MMM yyyy', { locale: dateLocale })}
                        {expense.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{expense.description}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className="font-black text-lg text-stone-900 dark:text-white mr-3">
                        {t('expenses.currency')}{expense.amount.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2 transition-opacity">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="p-2.5 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white transition-all bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-700 hover:scale-110"
                          title={t('common.edit')}
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2.5 text-stone-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-all bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-700 hover:scale-110"
                          title={t('common.delete')}
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
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
        variant={confirmConfig.variant}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
      />

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
