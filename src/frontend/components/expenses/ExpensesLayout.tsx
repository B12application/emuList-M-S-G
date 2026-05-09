import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaChevronDown, FaCalendarAlt, FaPlus, FaTags } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';

interface ExpensesLayoutProps {
  activeTab: 'harcamalar' | 'raporlar' | 'silinenler';
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  children: React.ReactNode;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthOptions: { value: string; label: string }[];
  onAddClick?: () => void;
  showAddButton?: boolean;
  categories?: string[];
  activeCategory?: string;
  setActiveCategory?: (val: string) => void;
  onAddCategory?: () => void;
}

const ExpensesLayout: React.FC<ExpensesLayoutProps> = ({
  activeTab,
  children,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
  onAddClick,
  showAddButton = false,
  categories = [],
  activeCategory = 'all',
  setActiveCategory,
  onAddCategory
}) => {
  const { t } = useLanguage();

  const categoryOptions = useMemo(() => {
    const options = [{ value: 'all', label: t('expenses.allCategories') || 'Tümü' }];
    categories.forEach(cat => options.push({ value: cat, label: cat }));
    return options;
  }, [categories, t]);

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || '';
  const selectedCategoryLabel = categoryOptions.find(c => c.value === activeCategory)?.label || '';

  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 min-h-full">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 sm:w-3 h-[2px] bg-stone-900 dark:bg-white shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.25em] truncate">
                  {t('expenses.pageSubtitle') || 'FİNANSAL YÖNETİM'}
                </span>
              </div>
              <h1 className="text-xl sm:text-4xl lg:text-5xl font-black text-stone-900 dark:text-white tracking-tighter leading-none truncate">
                {t('expenses.pageTitle')}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-stone-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 px-2 sm:px-3 py-1 sm:py-1.5 shrink-0">
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] text-stone-400 dark:text-zinc-500 whitespace-nowrap">
                {activeTab === 'harcamalar' ? t('expenses.expensesTab') : activeTab === 'silinenler' ? 'ÇÖP KUTUSU' : t('expenses.reportsTab')}
              </span>
            </div>
          </div>
        </header>

        {/* Action Bar & Filter Section */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Month Filter */}
            <Listbox
              value={selectedMonth}
              onChange={(val: string) => setSelectedMonth(val)}
            >
              <div className="relative flex-1 min-w-0">
                <ListboxButton className="relative w-full cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 text-left border border-stone-200/50 dark:border-zinc-800/50 focus:outline-none focus-within:ring-2 focus-within:ring-stone-900 dark:focus-within:ring-white transition-all shadow-sm py-2.5 pl-10 pr-9">
                  <span className="block truncate text-[11px] font-black uppercase tracking-wider leading-5 text-stone-900 dark:text-white">
                    {selectedMonthLabel}
                  </span>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                    <FaCalendarAlt size={13} />
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
                    <FaChevronDown size={10} aria-hidden="true" />
                  </div>
                </ListboxButton>
                <Transition
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white dark:bg-zinc-900 py-2 text-base shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none sm:text-sm custom-scrollbar">
                    {monthOptions.map((month) => (
                      <ListboxOption
                        key={month.value}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 px-6 transition-colors ${active ? 'bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white' : 'text-stone-500 dark:text-zinc-400'
                          }`
                        }
                        value={month.value}
                      >
                        {({ selected }) => (
                          <span className={`block truncate text-[10px] font-black uppercase tracking-widest ${selected ? 'text-stone-900 dark:text-white' : ''}`}>
                            {month.label}
                          </span>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>

            {/* Category Filter (Mobile Only or Integrated) */}
            <div className="flex items-center gap-2 md:hidden flex-1">
              <div className="flex-1 min-w-0">
                <Listbox
                  value={activeCategory}
                  onChange={(val: string) => setActiveCategory?.(val)}
                >
                  <div className="relative w-full">
                    <ListboxButton className="relative w-full cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 text-left border border-stone-200/50 dark:border-zinc-800/50 focus:outline-none focus-within:ring-2 focus-within:ring-stone-900 dark:focus-within:ring-white transition-all shadow-sm py-2.5 pl-10 pr-9">
                      <span className="block truncate text-[11px] font-black uppercase tracking-wider leading-5 text-stone-900 dark:text-white">
                        {selectedCategoryLabel}
                      </span>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                        <FaTags size={12} />
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
                        <FaChevronDown size={10} aria-hidden="true" />
                      </div>
                    </ListboxButton>
                    <Transition
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white dark:bg-zinc-900 py-2 text-base shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none sm:text-sm custom-scrollbar">
                        {categoryOptions.map((cat) => (
                          <ListboxOption
                            key={cat.value}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-3 px-6 transition-colors ${active ? 'bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white' : 'text-stone-500 dark:text-zinc-400'
                              }`
                            }
                            value={cat.value}
                          >
                            {({ selected }) => (
                              <span className={`block truncate text-[10px] font-black uppercase tracking-widest ${selected ? 'text-stone-900 dark:text-white' : ''}`}>
                                {cat.label}
                              </span>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>
              
              {onAddCategory && (
                <button
                  onClick={onAddCategory}
                  className="p-2.5 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm transition-all active:scale-95"
                  title="Yeni Kategori"
                >
                  <FaPlus size={12} />
                </button>
              )}
            </div>

            {/* Add Button - Mobile Full Width or Desktop Compact */}
            {showAddButton && onAddClick && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddClick}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group shrink-0"
              >
                <div className="absolute inset-0 bg-stone-800 dark:bg-stone-100 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <FaPlus size={11} className="relative z-10" />
                <span className="relative z-10">{t('expenses.addExpense') || 'Ekle'}</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ExpensesLayout;
