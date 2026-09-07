import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronDown, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  remainingCount?: number;
  label?: string;
  className?: string;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onClick,
  loading = false,
  remainingCount,
  label,
  className = ''
}) => {
  const { t } = useLanguage();
  const displayLabel = label || t('actions.loadMore') || 'Daha Fazla Yükle';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 border border-stone-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-amber-400/60 dark:hover:border-amber-400/60 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <FaSpinner className="animate-spin text-xs text-amber-500 dark:text-amber-400 shrink-0" />
      ) : (
        <FaChevronDown className="text-[10px] text-amber-500 dark:text-amber-400 transition-transform duration-300 group-hover:translate-y-0.5 shrink-0" />
      )}

      <span className="text-xs font-black uppercase tracking-[0.12em] text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
        {displayLabel}
      </span>

      {typeof remainingCount === 'number' && remainingCount > 0 && (
        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
          +{Math.min(50, remainingCount)}
        </span>
      )}
    </motion.button>
  );
};

export default LoadMoreButton;
