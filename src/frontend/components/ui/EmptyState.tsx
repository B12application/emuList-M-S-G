// src/components/ui/EmptyState.tsx
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'colorful';
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'colorful',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col items-center justify-center py-16 px-6 text-center overflow-hidden rounded-3xl ${variant === 'colorful'
          ? 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-dashed border-blue-200/50 dark:border-blue-800/50'
          : ''
        } ${className}`}
    >
      {/* Dekoratif arka plan öğeleri */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-300/30 to-purple-300/30 rounded-full blur-3xl -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-300/30 to-orange-300/30 rounded-full blur-2xl translate-y-12 -translate-x-12" />

      {icon && (
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-6"
        >
          <div className="relative z-10 text-6xl text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-gray-800/50 p-6 rounded-full shadow-lg backdrop-blur-sm">
            {icon}
          </div>
          {/* Glow efekti */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl scale-150" />
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 text-xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6 leading-relaxed"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

