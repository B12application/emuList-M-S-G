import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { FaTag, FaEdit, FaTrash, FaCheck, FaSearch, FaTimes, FaCalendarAlt, FaWallet, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import type { Expense } from '../../hooks/useExpenses';

interface ExpensesTabProps {
  t: (key: string) => string;
  isDark: boolean;
  dateLocale: any;
  filteredExpenses: Expense[];
  totalFilteredAmount: number;
  totalLifetimeAmount: number;
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
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({
  t,
  isDark,
  dateLocale,
  filteredExpenses,
  totalFilteredAmount,
  totalLifetimeAmount,
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
  setVisibleCount
}) => {
  return (
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
                    <stop offset="5%" stopColor={isDark ? '#ffffff' : '#1c1917'} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={isDark ? '#ffffff' : '#1c1917'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f0f0f0'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    color: isDark ? '#ffffff' : '#1c1917'
                  }}
                  formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, 'Tutar']}
                />
                <Area type="monotone" dataKey="amount" stroke={isDark ? '#ffffff' : '#1c1917'} fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
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
                    <Cell key={`cell-${index}`} fill={isDark ? ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a', '#3f3f46'][index % 5] : ['#1c1917', '#44403c', '#78716c', '#a8a29e', '#d6d3d1'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    color: isDark ? '#ffffff' : '#1c1917'
                  }}
                  formatter={(val: any) => [`₺${Number(val || 0).toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] px-2 py-4 sm:p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-2 sm:px-0">
          <div className="flex items-center gap-4">
             <button
                onClick={toggleSelectAll}
                className="text-[10px] font-black text-stone-900 dark:text-white bg-stone-100 dark:bg-zinc-800 px-3 py-2 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors uppercase tracking-widest flex items-center gap-2 shadow-sm"
              >
                <div className={`w-3 h-3 rounded border ${selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0 ? 'bg-stone-900 border-stone-900 dark:bg-white dark:border-white' : 'border-stone-400'}`}>
                  {selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0 && <FaCheck className="text-[6px] text-white dark:text-stone-900 m-auto" />}
                </div>
                {selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0 ? t('common.deselectAll') : t('common.selectAll')}
              </button>
              <span className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest bg-stone-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl border border-stone-100 dark:border-zinc-800">
                {filteredExpenses.length} {t('expenses.transactionCount')}
              </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Bar */}
            <div className="relative group w-full sm:w-56">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-[10px]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="w-full bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800 rounded-2xl py-2.5 pl-11 pr-8 text-[11px] font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 dark:hover:text-white">
                  <FaTimes className="text-[10px]" />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex bg-stone-50 dark:bg-zinc-800/50 p-1 rounded-2xl border border-stone-100 dark:border-zinc-800">
              <button
                onClick={() => setSortBy('date')}
                className={`p-2 rounded-xl transition-all ${sortBy === 'date'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
                  }`}
                title={t('common.sortDate')}
              >
                <FaCalendarAlt className="text-[10px]" />
              </button>
              <button
                onClick={() => setSortBy('amount')}
                className={`p-2 rounded-xl transition-all ${sortBy === 'amount'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
                  }`}
                title={t('common.sortAmount')}
              >
                <FaWallet className="text-[10px]" />
              </button>
              <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-700 mx-1 self-center" />
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl transition-all"
                title={sortOrder === 'desc' ? t('common.desc') : t('common.asc')}
              >
                {sortOrder === 'desc' ? <FaSortAmountDown className="text-[10px]" /> : <FaSortAmountUp className="text-[10px]" />}
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
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
      </div>
    </div>
  );
};

export default ExpensesTab;
