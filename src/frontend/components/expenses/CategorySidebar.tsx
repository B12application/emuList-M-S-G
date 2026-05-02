import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaFilter, FaTags, FaCircle } from 'react-icons/fa';

interface CategorySidebarProps {
  t: (key: string) => string;
  isDark: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  categories: string[];
  activeCategory: string;
  setActiveCategory: (val: string) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  t,
  isDark,
  isSidebarOpen,
  setIsSidebarOpen,
  categories,
  activeCategory,
  setActiveCategory
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
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-black text-stone-900 dark:text-white uppercase tracking-widest whitespace-nowrap"
              >
                {t('expenses.categoriesTitle') || 'KATEGORİLER'}
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
                />
              ))}
            </div>
          </div>
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
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick, isOpen, isDark }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group ${
      isActive
        ? 'bg-stone-900 dark:bg-white shadow-md'
        : 'hover:bg-stone-50 dark:hover:bg-zinc-800/50'
    }`}
  >
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
      isActive
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
        className={`text-[11px] font-bold uppercase tracking-wide truncate ${
          isActive ? 'text-white dark:text-black' : 'text-stone-400 group-hover:text-stone-900 dark:hover:text-white'
        }`}
      >
        {label}
      </motion.span>
    )}
  </button>
);

export default CategorySidebar;

