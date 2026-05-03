import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChevronDown, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';

interface ExpensesLayoutProps {
  activeTab: 'harcamalar' | 'raporlar';
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  children: React.ReactNode;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthOptions: { value: string; label: string }[];
  onAddClick?: () => void;
  showAddButton?: boolean;
}

const ExpensesLayout: React.FC<ExpensesLayoutProps> = ({
  activeTab,
  children,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
  onAddClick,
  showAddButton = false
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const filteredMonths = query === ''
    ? monthOptions
    : monthOptions.filter((month) =>
      month.label.toLowerCase().includes(query.toLowerCase())
    );

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 min-h-full">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <header className="mb-8">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-[2px] bg-stone-900 dark:bg-white shrink-0" />
                <span className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-[0.25em] truncate">
                  {t('expenses.pageSubtitle') || 'FİNANSAL YÖNETİM'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-stone-900 dark:text-white tracking-tighter leading-none">
                {t('expenses.pageTitle')}
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-stone-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 px-3 py-1.5 shrink-0">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-400 dark:text-zinc-500 whitespace-nowrap">
                {activeTab === 'harcamalar' ? t('expenses.expensesTab') : t('expenses.reportsTab')}
              </span>
            </div>
          </div>
        </header>

        {/* Action Bar & Month Filter */}
        <div className="mb-6 flex items-center gap-3">
          <Combobox
            value={selectedMonth}
            onChange={(val: string | null) => setSelectedMonth(val ?? 'all')}
          >
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-64">
              <div className="relative w-full cursor-default overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 text-left border border-stone-200/50 dark:border-zinc-800/50 focus-within:ring-2 focus-within:ring-stone-900 dark:focus-within:ring-white transition-all shadow-sm">
                <ComboboxInput
                  className="w-full border-none py-2.5 pl-10 pr-9 text-[11px] font-black uppercase tracking-wider leading-5 text-stone-900 dark:text-white bg-transparent outline-none"
                  displayValue={() => selectedMonthLabel}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ay Seçin..."
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                  <FaCalendarAlt size={13} />
                </div>
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
                  <FaChevronDown size={10} aria-hidden="true" />
                </ComboboxButton>
              </div>
              <Transition
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setQuery('')}
              >
                <ComboboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white dark:bg-zinc-900 py-2 text-base shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none sm:text-sm custom-scrollbar">
                  {filteredMonths.length === 0 && query !== '' ? (
                    <div className="relative cursor-default select-none py-3 px-6 text-[10px] font-black text-stone-400 uppercase">
                      Sonuç bulunamadı.
                    </div>
                  ) : (
                    filteredMonths.map((month) => (
                      <ComboboxOption
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
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              </Transition>
            </div>
          </Combobox>

          {showAddButton && onAddClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group shrink-0"
            >
              <div className="absolute inset-0 bg-stone-800 dark:bg-stone-100 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <FaPlus size={11} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">{t('expenses.addExpense') || 'Ekle'}</span>
            </motion.button>
          )}
        </div>

        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ExpensesLayout;
