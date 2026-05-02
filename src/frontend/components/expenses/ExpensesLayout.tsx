import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaChartLine, FaCar, FaChevronDown, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';

interface ExpensesLayoutProps {
  activeTab: 'harcamalar' | 'raporlar' | 'araclar';
  setActiveTab: (tab: 'harcamalar' | 'raporlar' | 'araclar') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  children: React.ReactNode;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  monthOptions: { value: string; label: string }[];
}

const ExpensesLayout: React.FC<ExpensesLayoutProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  children,
  selectedMonth,
  setSelectedMonth,
  monthOptions
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
        <header className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-[2px] bg-stone-900 dark:bg-white" />
                <span className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
                  {t('expenses.pageSubtitle') || 'FİNANSAL YÖNETİM'}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white tracking-tighter">
                {t('expenses.pageTitle')}
              </h1>
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex items-center gap-1 bg-white/50 dark:bg-zinc-900/50 p-1.5 rounded-[1.5rem] border border-stone-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
              {[
                { id: 'harcamalar', icon: FaWallet, label: t('expenses.expensesTab') },
                { id: 'raporlar', icon: FaChartLine, label: t('expenses.reportsTab') },
                { id: 'araclar', icon: FaCar, label: t('expenses.vehicleTab') }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-2.5 px-6 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                    activeTab === tab.id 
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
        </header>

        {/* Action Bar & Month Filter */}
        {activeTab !== 'araclar' && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Combobox value={selectedMonth} onChange={setSelectedMonth}>
                <div className="relative w-full sm:w-64">
                  <div className="relative w-full cursor-default overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 text-left border border-stone-200/50 dark:border-zinc-800/50 focus-within:ring-2 focus-within:ring-stone-900 dark:focus-within:ring-white transition-all shadow-sm">
                    <ComboboxInput
                      className="w-full border-none py-3 pl-11 pr-10 text-[11px] font-black uppercase tracking-wider leading-5 text-stone-900 dark:text-white bg-transparent outline-none"
                      displayValue={() => selectedMonthLabel}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Ay Seçin..."
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                      <FaCalendarAlt size={14} />
                    </div>
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400">
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
                              `relative cursor-pointer select-none py-3 px-6 transition-colors ${
                                active ? 'bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white' : 'text-stone-500 dark:text-zinc-400'
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
            </div>
          </div>
        )}

        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ExpensesLayout;
