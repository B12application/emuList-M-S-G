import React from 'react';
import { motion } from 'framer-motion';
import { FaFilter, FaTags, FaCircle, FaPlus, FaChevronDown, FaHistory, FaTrash } from 'react-icons/fa';

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
  deletedCount: number;
  onAddCategory: () => void;
  onDeleteCategory: (category: string) => void;
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
  deletedCount,
  onAddCategory,
  onDeleteCategory,
  onRunMigration,
  isMigrating
}) => {
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = React.useState(false);
  const [categorySort, setCategorySort] = React.useState<'name' | 'count'>('name');

  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      if (categorySort === 'count') {
        const countA = categoryCounts[a] || 0;
        const countB = categoryCounts[b] || 0;
        if (countA !== countB) return countB - countA;
      }
      return a.localeCompare(b);
    });
  }, [categories, categorySort, categoryCounts]);

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
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-black text-stone-900 dark:text-white uppercase tracking-widest whitespace-nowrap"
              >
                {t('expenses.categoriesTitle') || 'NAVİGASYON'}
              </motion.h3>
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

              <div className="pt-6 pb-2 px-1">
                <div
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => setIsCategoriesCollapsed(!isCategoriesCollapsed)}
                >
                  {isSidebarOpen && (
                    <div className="flex items-center gap-2">
                      <FaChevronDown
                        size={8}
                        className={`text-stone-400 transition-transform duration-300 ${isCategoriesCollapsed ? '-rotate-90' : ''}`}
                      />
                      <span className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                        Kategorilerim
                      </span>
                    </div>
                  )}
                  {isSidebarOpen && (
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategorySort(categorySort === 'name' ? 'count' : 'name');
                        }}
                        className={`p-1 rounded-md transition-all ${categorySort === 'count'
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                            : 'bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white'
                          }`}
                        title={categorySort === 'name' ? 'Sayıya göre sırala' : 'İsme göre sırala'}
                      >
                        <FaFilter size={7} />
                      </button>
                    </div>
                  )}
                </div>
                {!isSidebarOpen && <div className="h-[1px] bg-stone-100 dark:bg-zinc-800 mx-2" />}
              </div>

              <motion.div
                initial={false}
                animate={{ height: isCategoriesCollapsed ? 0 : 'auto', opacity: isCategoriesCollapsed ? 0 : 1 }}
                className="space-y-1 overflow-hidden"
              >
                {sortedCategories.map((category) => (
                  <SidebarItem
                    key={category}
                    icon={<FaCircle size={6} />}
                    label={category}
                    isActive={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                    onDelete={() => onDeleteCategory(category)}
                    isOpen={isSidebarOpen}
                    isDark={isDark}
                    count={categoryCounts[category] || 0}
                  />
                ))}
              </motion.div>

              <div className="pt-2">
                <SidebarItem
                  icon={<FaHistory size={10} />}
                  label="Silinenler"
                  isActive={activeCategory === 'deleted'}
                  onClick={() => setActiveCategory('deleted')}
                  isOpen={isSidebarOpen}
                  isDark={isDark}
                  count={deletedCount}
                  variant="danger"
                />
              </div>
            </div>
          </div>

          {isSidebarOpen && (
            <div className="pt-6 mt-auto border-t border-stone-100 dark:border-zinc-800 flex flex-col gap-3">
              <button
                onClick={onAddCategory}
                className="group relative flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-xl hover:shadow-stone-900/10 dark:hover:shadow-white/10 active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <FaPlus size={8} className="relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                <span className="relative z-10">Kategori Ekle</span>
              </button>
              
              {onRunMigration && (
                <button
                  onClick={onRunMigration}
                  disabled={isMigrating}
                  className={`group relative flex items-center justify-center gap-2.5 p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border overflow-hidden ${
                    isMigrating
                      ? 'bg-stone-50 border-stone-100 text-stone-300 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-600'
                      : 'bg-white border-stone-100 text-stone-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-50/30 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-950/20 shadow-sm'
                  }`}
                >
                  <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <motion.div
                    animate={isMigrating ? { rotate: 360 } : {}}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="shrink-0 relative z-10"
                  >
                    <FaCircle size={6} className={isMigrating ? 'text-stone-300' : 'opacity-40 group-hover:opacity-100 group-hover:text-red-500 transition-all duration-300'} />
                  </motion.div>
                  <span className="truncate relative z-10">
                    {isMigrating ? 'Temizleniyor...' : 'Verileri Temizle'}
                  </span>
                </button>
              )}
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
  onDelete?: () => void;
  isOpen: boolean;
  isDark: boolean;
  count: number;
  variant?: 'default' | 'danger';
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick, onDelete, isOpen, count, variant = 'default' }) => (
  <div
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer ${isActive
      ? variant === 'danger' ? 'bg-red-500 text-white shadow-md' : 'bg-stone-900 dark:bg-white shadow-md'
      : 'hover:bg-stone-50 dark:hover:bg-zinc-800/50'
      }`}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
        ? 'bg-white/10 dark:bg-black/10'
        : variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-stone-50 dark:bg-zinc-800'
        }`}>
        <span className={isActive ? 'text-white dark:text-black' : variant === 'danger' ? 'text-red-400' : 'text-stone-400 group-hover:text-stone-600'}>
          {icon}
        </span>
      </div>
      {isOpen && (
        <span
          className={`text-[11px] font-bold uppercase tracking-wide truncate flex-1 text-left ${isActive ? 'text-white dark:text-black' : variant === 'danger' ? 'text-red-400' : 'text-stone-400 group-hover:text-stone-900 dark:hover:text-white'
            }`}
        >
          {label}
        </span>
      )}
    </div>

    {isOpen && (
      <div className="flex items-center gap-2 shrink-0">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-all transform hover:scale-110 shadow-sm"
            title="Kategoriyi Sil"
          >
            <FaTrash size={8} />
          </button>
        )}
        {count > 0 && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isActive
            ? 'bg-white/20 text-white dark:bg-black/10 dark:text-black'
            : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'
            }`}>
            {count}
          </span>
        )}
      </div>
    )}
  </div>
);

export default CategorySidebar;

