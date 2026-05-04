import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { FaTag, FaEdit, FaTrash, FaCheck, FaSearch, FaTimes, FaCalendarAlt, FaWallet, FaSortAmountDown, FaSortAmountUp, FaGem } from 'react-icons/fa';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import type { Expense } from '../../hooks/useExpenses';

interface ExpensesHomeViewProps {
  t: (key: string) => string;
  isDark: boolean;
  dateLocale: any;
  filteredExpenses: Expense[];
  totalFilteredAmount: number;
  totalLifetimeAmount: number;
  monthlyAverage: number;
  selectedMonth: string;
  dailyTrendData: any[];
  categoryBreakdownData: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  sortBy: 'date' | 'amount';
  setSortBy: (val: 'date' | 'amount') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (val: 'asc' | 'desc') => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  handleEditClick: (expense: Expense) => void;
  handleDeleteExpense: (id: string) => void;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  onConvertToInvestment: (expense: Expense) => void;
}

const ExpensesHomeView: React.FC<ExpensesHomeViewProps> = ({
  t,
  isDark,
  dateLocale,
  filteredExpenses,
  totalFilteredAmount,
  totalLifetimeAmount,
  monthlyAverage,
  selectedMonth,
  dailyTrendData,
  categoryBreakdownData,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  handleEditClick,
  handleDeleteExpense,
  visibleCount,
  setVisibleCount,
  onConvertToInvestment
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: t('expenses.totalLabel'), value: totalFilteredAmount, color: 'text-stone-900 dark:text-white' },
          { label: t('expenses.lifetimeLabel') || 'TÜM ZAMANLAR', value: totalLifetimeAmount, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: t('expenses.monthlyAverageLabel') || 'AYLIK ORTALAMA', value: monthlyAverage, color: 'text-blue-600 dark:text-blue-400' },
          { label: t('expenses.averageLabel') || 'İŞLEM ORTALAMA', value: filteredExpenses.length > 0 ? totalFilteredAmount / filteredExpenses.length : 0 }
        ].map((stat: { label: string; value: number; color?: string; suffix?: string }, i) => (
          <div key={i} className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-stone-100 dark:border-zinc-800 hover:border-stone-400 dark:hover:border-zinc-600 transition-all">
            <p className="text-[9px] sm:text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1.5 truncate">{stat.label}</p>
            <h4 className={`text-lg sm:text-xl font-black tracking-tighter ${stat.color || 'text-stone-900 dark:text-white'}`}>
              {!stat.suffix && t('expenses.currency')}
              {stat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {stat.suffix || ''}
            </h4>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      {selectedMonth !== 'all' && dailyTrendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2.5rem] p-6 border border-stone-100 dark:border-zinc-800 h-[280px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest">{t('expenses.dailyTrend') || 'GÜNLÜK HARCAMA AKIŞI'}</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stone-900 dark:bg-white" />
                <span className="text-[9px] font-black text-stone-900 dark:text-white uppercase">₺</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="75%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#ffffff' : '#1c1917'} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={isDark ? '#ffffff' : '#1c1917'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f0f0f0'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#a8a29e' }} />
                <Tooltip
                  cursor={{ stroke: isDark ? '#ffffff20' : '#1c191710', strokeWidth: 2 }}
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    fontSize: '11px',
                    fontWeight: '900'
                  }}
                  formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="amount" stroke={isDark ? '#ffffff' : '#1c1917'} fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2.5rem] p-6 border border-stone-100 dark:border-zinc-800 h-[280px]">
            <h3 className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-6">{t('expenses.categoryDistribution') || 'KATEGORİ DAĞILIMI'}</h3>
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={categoryBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryBreakdownData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={isDark ? ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a', '#3f3f46'][index % 5] : ['#1c1917', '#44403c', '#78716c', '#a8a29e', '#d6d3d1'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    fontSize: '11px',
                    fontWeight: '900'
                  }}
                  formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* List Container */}
      <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header / Unified Toolbar */}
        <div className="p-3 sm:p-6 border-b border-stone-100 dark:border-zinc-800">
          {/* Row 1: Select + Count + Sort */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleSelectAll}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-50 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-700'
                  }`}
              >
                <div className={`w-3 h-3 rounded-md border flex items-center justify-center transition-colors ${selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0
                  ? 'border-transparent'
                  : 'border-stone-300 dark:border-zinc-600'
                  }`}>
                  {selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0 && <FaCheck size={6} />}
                </div>
                <span className="hidden sm:inline">{selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0 ? t('common.deselectAll') : t('common.selectAll')}</span>
              </button>

              <div className="flex flex-col">
                <span className="text-[11px] font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  {filteredExpenses.length} {t('expenses.transactionSuffix') || 'Harcama'}
                </span>
                {selectedIds.size > 0 && (
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    {selectedIds.size} SEÇİLDİ
                  </span>
                )}
              </div>
            </div>

            {/* Sort Controls - compact, always visible */}
            <div className="flex bg-stone-50 dark:bg-zinc-800 p-1 rounded-xl border border-stone-100 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setSortBy('date')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${sortBy === 'date' ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400'}`}
              >
                <FaCalendarAlt size={9} />
                <span className="hidden sm:inline">{t('common.date')}</span>
              </button>
              <button
                onClick={() => setSortBy('amount')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${sortBy === 'amount' ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400'}`}
              >
                <FaWallet size={9} />
                <span className="hidden sm:inline">{t('expenses.amount')}</span>
              </button>
              <div className="w-[1px] h-3.5 bg-stone-200 dark:bg-zinc-700 mx-0.5 self-center" />
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
              >
                {sortOrder === 'desc' ? <FaSortAmountDown size={10} /> : <FaSortAmountUp size={10} />}
              </button>
            </div>
          </div>

          {/* Row 2: Search - full width */}
          <div className="relative group">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 dark:group-focus-within:text-white transition-colors" size={11} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="w-full bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 rounded-xl py-2.5 pl-9 pr-9 text-[11px] font-black uppercase tracking-wider text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-stone-900/5 dark:focus:ring-white/5 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 dark:hover:text-white">
                <FaTimes size={11} />
              </button>
            )}
          </div>
        </div>

        {/* List Content with enforced Scroll */}
        <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar p-3">
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300 dark:text-zinc-700">
              <div className="w-20 h-20 rounded-full bg-stone-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
                <FaTag size={32} className="opacity-20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('expenses.noExpenses')}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {filteredExpenses.slice(0, visibleCount).map((expense) => (
                  <motion.div
                    layout
                    key={expense.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative p-3 sm:p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 ${selectedIds.has(expense.id)
                      ? 'bg-stone-900 dark:bg-white'
                      : 'hover:bg-stone-50 dark:hover:bg-zinc-800/40'
                      }`}
                  >
                    <div
                      onClick={() => toggleSelect(expense.id)}
                      className={`w-5 h-5 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${selectedIds.has(expense.id)
                        ? 'bg-transparent border-white/30 dark:border-black/30'
                        : 'border-stone-200 dark:border-zinc-700'
                        }`}
                    >
                      {selectedIds.has(expense.id) && <FaCheck size={8} className={selectedIds.has(expense.id) ? 'text-white dark:text-black' : ''} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs font-black uppercase tracking-tight truncate ${selectedIds.has(expense.id) ? 'text-white dark:text-black' : 'text-stone-900 dark:text-white'}`}>
                          {expense.title}
                        </h4>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest shrink-0 ${selectedIds.has(expense.id)
                          ? 'bg-white/10 text-white dark:bg-black/10 dark:text-black'
                          : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
                          }`}>
                          {expense.category}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 block ${selectedIds.has(expense.id) ? 'text-white/60 dark:text-black/60' : 'text-stone-400 dark:text-zinc-500'}`}>
                        {format(parseISO(expense.date), 'dd MMM yyyy', { locale: dateLocale })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-black tracking-tighter ${selectedIds.has(expense.id) ? 'text-white dark:text-black' : 'text-stone-900 dark:text-white'}`}>
                        {t('expenses.currency')}{expense.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => onConvertToInvestment(expense)}
                        className={`p-2 rounded-xl transition-all ${selectedIds.has(expense.id) ? 'text-amber-300 hover:text-amber-100 hover:bg-amber-500/20' : 'text-stone-400 hover:text-amber-500 bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700'}`}
                        title="Yatırıma Dönüştür"
                      >
                        <FaGem size={11} />
                      </button>
                      <button
                        onClick={() => handleEditClick(expense)}
                        className={`p-2 rounded-xl transition-all ${selectedIds.has(expense.id) ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-stone-400 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700'}`}
                      >
                        <FaEdit size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className={`p-2 rounded-xl transition-all ${selectedIds.has(expense.id) ? 'text-rose-300 hover:text-rose-100 hover:bg-rose-500/20' : 'text-stone-400 hover:text-rose-500 bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700'}`}
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {visibleCount < filteredExpenses.length && (
                <button
                  onClick={() => setVisibleCount(prev => prev + 50)}
                  className="w-full py-6 text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-[0.3em] hover:text-stone-900 dark:hover:text-white transition-all"
                >
                  {t('common.loadMore')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesHomeView;

