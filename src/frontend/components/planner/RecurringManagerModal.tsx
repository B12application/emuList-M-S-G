// src/frontend/components/planner/RecurringManagerModal.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUndo, FaTrash, FaSyncAlt, FaCalendarCheck } from 'react-icons/fa';
import { getRecurringMasters, deleteRecurringSeries } from '../../../backend/services/plannerService';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface RecurringManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function RecurringManagerModal({ isOpen, onClose, onRefresh }: RecurringManagerModalProps) {
  const { user } = useAuth();
  const [masters, setMasters] = useState<PlannerMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMasters = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getRecurringMasters(user.uid);
      setMasters(data);
    } catch (err) {
      console.error(err);
      toast.error('Seriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMasters();
    }
  }, [isOpen, user]);

  const handleDeleteSeries = async (groupId: string) => {
    if (!confirm('Bu seriyi ve tüm gelecek haftalardaki kopyalarını silmek istediğinize emin misiniz?')) return;

    try {
      await deleteRecurringSeries(groupId);
      toast.success('Seri tamamen silindi');
      loadMasters();
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Seri silinirken hata oluştu');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="px-6 py-5 border-b border-stone-100 dark:border-zinc-800 flex justify-between items-center bg-stone-50/50 dark:bg-zinc-800/50">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <FaUndo className="text-rose-500 text-sm" />
              Haftalık Seriler
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">Tekrarlayan görevlerinizi yönetin</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
              <FaSyncAlt className="animate-spin text-rose-500 text-2xl" />
              <span className="text-sm font-medium">Yükleniyor...</span>
            </div>
          ) : masters.length > 0 ? (
            <div className="space-y-4">
              {masters.map((master) => (
                <div
                  key={master.id}
                  className="bg-stone-50 dark:bg-zinc-800/40 border border-stone-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${master.itemType === 'meeting' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' :
                          master.itemType === 'todo' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                        }`}>
                        {master.itemType === 'meeting' ? 'Toplantı' : master.itemType === 'todo' ? 'Görev' : 'Jira'}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500">
                        {master.startTime}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-900 dark:text-white truncate pr-4">
                      {master.title}
                    </h4>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-500 mt-1 flex items-center gap-1">
                      <FaCalendarCheck className="text-[9px]" />
                      Her Hafta · Gelecek 3 hafta aktif
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteSeries(master.recurringGroupId!)}
                    className="p-3 bg-stone-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-900/30 text-stone-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 rounded-xl transition-all"
                    title="Seriyi Sil"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-stone-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUndo className="text-stone-300 dark:text-zinc-700 text-xl" />
              </div>
              <h3 className="font-bold text-stone-800 dark:text-zinc-200">Henüz seri bulunmuyor</h3>
              <p className="text-sm text-stone-500 dark:text-zinc-500 mt-1">
                Yeni bir görev eklerken "Haftalık Tekrarla" seçeneğini kullanarak seri oluşturabilirsiniz.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-stone-50 dark:bg-zinc-800/30 border-t border-stone-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold shadow-lg shadow-stone-900/10 transition-transform active:scale-95"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
}
