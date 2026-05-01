import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-stone-200/50 dark:border-zinc-800/50"
          >
            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              variant === 'danger' 
                ? 'bg-red-50 dark:bg-red-950/30' 
                : 'bg-amber-50 dark:bg-amber-950/30'
            }`}>
              {variant === 'danger' ? (
                <FaTrash className="text-xl text-red-500 dark:text-red-400" />
              ) : (
                <FaExclamationTriangle className="text-xl text-amber-500 dark:text-amber-400" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-stone-900 dark:text-white text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-stone-500 dark:text-zinc-400 text-center leading-relaxed mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] shadow-lg disabled:opacity-50 ${
                  variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
