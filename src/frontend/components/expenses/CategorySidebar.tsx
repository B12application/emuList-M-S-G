import React from 'react';
import { motion } from 'framer-motion';
import { FaFilter, FaTags, FaCircle, FaPlus } from 'react-icons/fa';

interface CategorySidebarProps {
  t: (key: string) => string;
  isDark: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  categories: string[];
  activeCategory: string;
  setActiveCategory: (val: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  onAddCategory: () => void;
  onRunMigration?: () => void;
  isMigrating?: boolean;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  t,
  isDark,
  isSidebarOpen,
  setIsSidebarOpen,
  categories,
  activeCategory,
  setActiveCategory,
  categoryCounts,
  totalCount,
  onAddCategory,
  onRunMigration,
  isMigrating
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? 240 : 72,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      }}
      className="relative flex-shrink-0 hidden md:block"
    >
      <div className="sticky top-24 h-[calc(100vh-120px)] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-stone-200/50 dark:border-zinc-800/50 overflow-hidden flex flex-col transition-colors duration-300">

        {/* Toggle Button - Sleek and integrated */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute right-0 top-0 bottom-0 w-3 hover:bg-stone-50 dark:hover:bg-zinc-800/50 flex items-center justify-center group transition-colors"
        >
          <div className="w-1 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 group-hover:bg-stone-300 dark:group-hover:bg-zinc-600 transition-colors" />
        </button>

        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className={`w-8 h-8 rounded-xl bg-stone-900 dark:bg-white flex items-center justify-center shrink-0 shadow-lg shadow-stone-900/10 transition-all ${!isSidebarOpen ? 'mx-auto' : ''}`}>
              <FaFilter className="text-white dark:text-stone-900 text-[10px]" />
            </div>
            {isSidebarOpen && (
              <div className="flex items-center justify-between w-full">
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-black text-stone-900 dark:text-white uppercase tracking-widest whitespace-nowrap"
                >
                  {t('expenses.categoriesTitle') || 'KATEGORİLER'}
                </motion.h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddCategory();
                  }}
                  className="p-1.5 rounded-lg bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  title={t('expenses.addCategory')}
                >
                  <FaPlus size={8} />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-1">
              <SidebarItem
                icon={<FaTags size={10} />}
                label={t('expenses.allCategories')}
                isActive={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
                isOpen={isSidebarOpen}
                isDark={isDark}
                count={totalCount}
              />

              {categories.map((category) => (
                <SidebarItem
                  key={category}
                  icon={<FaCircle size={6} />}
                  label={category}
                  isActive={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  isOpen={isSidebarOpen}
                  isDark={isDark}
                  count={categoryCounts[category] || 0}
                />
              ))}
            </div>
          </div>

          {isSidebarOpen && onRunMigration && (
            <div className="pt-4 mt-auto border-t border-stone-100 dark:border-zinc-800">
              <button
                onClick={onRunMigration}
                disabled={isMigrating}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isMigrating
                    ? 'bg-stone-50 text-stone-300 dark:bg-zinc-800 dark:text-zinc-600'
                    : 'bg-stone-50 dark:bg-zinc-800 text-stone-500 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 shadow-sm'
                }`}
              >
                <FaCircle className={isMigrating ? 'animate-pulse' : ''} size={6} />
                {isMigrating ? 'Temizleniyor...' : 'Verileri Temizle'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isOpen: boolean;
  isDark: boolean;
  count: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick, isOpen, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group ${isActive
      ? 'bg-stone-900 dark:bg-white shadow-md'
      : 'hover:bg-stone-50 dark:hover:bg-zinc-800/50'
      }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
        ? 'bg-white/10 dark:bg-black/10'
        : 'bg-stone-50 dark:bg-zinc-800'
        }`}>
        <span className={isActive ? 'text-white dark:text-black' : 'text-stone-400 group-hover:text-stone-600'}>
          {icon}
        </span>
      </div>
      {isOpen && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-[11px] font-bold uppercase tracking-wide truncate ${isActive ? 'text-white dark:text-black' : 'text-stone-400 group-hover:text-stone-900 dark:hover:text-white'
            }`}
        >
          {label}
        </motion.span>
      )}
    </div>
    {isOpen && count > 0 && (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isActive
        ? 'bg-white/20 text-white dark:bg-black/10 dark:text-black'
        : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'
        }`}>
        {count}
      </span>
    )}
  </button>
);

export default CategorySidebar;

