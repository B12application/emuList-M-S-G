// src/frontend/components/planner/DeleteChoiceModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaCalendarTimes, FaLayerGroup } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

interface DeleteChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSingle: () => void;
  onConfirmSeries: () => void;
  title: string;
}

export default function DeleteChoiceModal({ 
  isOpen, 
  onClose, 
  onConfirmSingle, 
  onConfirmSeries,
  title 
}: DeleteChoiceModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 dark:border-zinc-800"
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaTrash className="text-rose-500 text-2xl" />
            </div>
            
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
              {t('planner.deleteOptions')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-zinc-400 mb-8 px-4">
              "<span className="font-semibold text-stone-700 dark:text-zinc-200">{title}</span>" <br/> {t('planner.deleteHow')}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  onConfirmSingle();
                  onClose();
                }}
                className="w-full group flex items-center justify-between p-4 bg-stone-50 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-900/20 border border-stone-200 dark:border-zinc-700 rounded-2xl transition-all hover:border-rose-200 dark:hover:border-rose-900/50"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-white dark:bg-zinc-700 rounded-xl border border-stone-100 dark:border-zinc-600 group-hover:text-rose-500">
                    <FaCalendarTimes size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-800 dark:text-white">{t('planner.deleteSingle')}</div>
                    <div className="text-[10px] text-stone-500">{t('planner.deleteSingleDesc')}</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onConfirmSeries();
                  onClose();
                }}
                className="w-full group flex items-center justify-between p-4 bg-stone-50 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-900/20 border border-stone-200 dark:border-zinc-700 rounded-2xl transition-all hover:border-rose-200 dark:hover:border-rose-900/50"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-white dark:bg-zinc-700 rounded-xl border border-stone-100 dark:border-zinc-600 group-hover:text-rose-500">
                    <FaLayerGroup size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-800 dark:text-white">{t('planner.deleteAllSeries')}</div>
                    <div className="text-[10px] text-stone-500">{t('planner.deleteAllSeriesDesc')}</div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-6 text-xs font-bold text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
            >
              {t('planner.giveUp')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
