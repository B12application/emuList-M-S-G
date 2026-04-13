import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendarPlus, FaTasks, FaSyncAlt, FaEdit } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { addMeeting, updateMeeting } from '../../../backend/services/plannerService';
import { format, addMinutes } from 'date-fns';
import { showMarqueeToast } from '../MarqueeToast';
import type { PlannerMeeting } from '../../../backend/types/planner';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAdded: () => void;
  initialData?: PlannerMeeting | null; // For Edit mode
}

type TabType = 'meeting' | 'todo' | 'jira';

export default function QuickAddModal({ isOpen, onClose, selectedDate, onAdded, initialData }: QuickAddModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('meeting');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setActiveTab(initialData.itemType as TabType || 'meeting');
      setTitle(initialData.title);
      setStartTime(initialData.startTime || '09:00');
      setEndTime(initialData.endTime || '09:30');
      setNotes(initialData.notes || '');
      setIsRecurring(!!initialData.isRecurring);
      setDueDate(initialData.dueDate || '');
    } else {
      // Reset for New
      setTitle('');
      setStartTime('09:00');
      setNotes('');
      setIsRecurring(false);
      setDueDate('');
    }
  }, [initialData, isOpen]);

  // Auto-duration logic: When startTime changes, set endTime to +30 mins
  useEffect(() => {
    if (activeTab === 'meeting' && startTime) {
      try {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, 30);
        setEndTime(format(endDate, 'HH:mm'));
      } catch (err) {
        console.error('Time calculation error', err);
      }
    }
  }, [startTime, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const meetingData = {
        userId: user.uid,
        title,
        date: initialData?.date || format(selectedDate, 'yyyy-MM-dd'),
        startTime: activeTab === 'meeting' ? startTime : '',
        endTime: activeTab === 'meeting' ? endTime : '',
        notes: notes.trim() || undefined,
        dueDate: activeTab === 'jira' ? dueDate : '',
        itemType: activeTab,
        ...(activeTab === 'todo' || activeTab === 'jira' ? { isCompleted: initialData?.isCompleted ?? false } : {}),
        isRecurring,
      };

      if (isEditMode && initialData?.id) {
        await updateMeeting(initialData.id, meetingData);
        showMarqueeToast({ message: 'Güncellendi', type: 'watched', mediaType: 'movie' });
      } else {
        await addMeeting(meetingData, isRecurring);
        showMarqueeToast({
          message: isRecurring ? 'Haftalık seri oluşturuldu' : 'Eklendi',
          type: 'watched',
          mediaType: 'movie'
        });
      }

      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      showMarqueeToast({ message: 'İşlem başarısız', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotesInAddMode = activeTab !== 'meeting';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold flex items-center gap-2">
              {isEditMode ? <FaEdit className="text-rose-500" /> : <FaCalendarPlus className="text-rose-500" />}
              <span>{isEditMode ? 'Düzenle' : 'Hızlı Ekle'}</span>
            </h3>
            <button onClick={onClose} className="p-2 text-stone-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors">
              <FaTimes />
            </button>
          </div>

          {!isEditMode && (
            <div className="px-5 pt-4">
              <div className="flex bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl">
                {(['meeting', 'todo', 'jira'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === tab
                      ? 'bg-white dark:bg-zinc-700 shadow text-rose-600 dark:text-rose-400'
                      : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                  >
                    {tab === 'meeting' ? <FaCalendarPlus size={12} /> : <FaTasks size={12} />}
                    {tab === 'meeting' ? 'Toplantı' : tab === 'todo' ? 'Görev' : 'Jira'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {!isEditMode && (
              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                  Tarih
                </label>
                <div className="w-full px-4 py-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl text-sm font-medium">
                  {format(selectedDate, 'dd.MM.yyyy')}
                </div>
              </div>
            )}

            {activeTab === 'meeting' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-4"
              >
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                    Başlangıç
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all block text-sm"
                    required={activeTab === 'meeting'}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                    Bitiş
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all block text-sm"
                    required={activeTab === 'meeting'}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'jira' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                  Son Gün (Due Date)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all block text-sm"
                  required={activeTab === 'jira'}
                />
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                {activeTab === 'meeting' ? 'Konu' : activeTab === 'jira' ? 'Jira Task/Özet' : 'Ne Yapılacak?'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeTab === 'meeting' ? 'Örn: Ekip Toplantısı' : activeTab === 'jira' ? 'Örn: PROJ-123 API Integrasyonu' : 'Örn: Spora git'}
                className={`w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all text-sm ${activeTab === 'todo' ? 'focus:ring-emerald-500' : activeTab === 'jira' ? 'focus:ring-blue-500' : 'focus:ring-rose-500'
                  }`}
                required
              />
            </div>

            {(isEditMode || showNotesInAddMode) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                  Notlar {activeTab === 'meeting' && !isEditMode && '(Toplantı Sonrası)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={activeTab === 'meeting' ? "Toplantı bittikten sonra alınan notlar..." : "Görev detayları..."}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm min-h-[80px] resize-none"
                />
              </motion.div>
            )}

            {/* Recurrence Switch */}
            <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2">
                <FaSyncAlt className={`text-xs ${isRecurring ? 'text-rose-500 animate-spin-slow' : 'text-stone-400'}`} />
                <span className="text-sm font-semibold text-stone-700 dark:text-zinc-300">Haftalık Tekrarla</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isRecurring ? 'bg-rose-500' : 'bg-stone-300 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isRecurring ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:active:scale-100 active:scale-95 ${activeTab === 'todo'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : activeTab === 'jira'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
              >
                {isSubmitting ? (isEditMode ? 'Güncelleniyor...' : 'Ekleniyor...') : (isEditMode ? 'Güncelle' : (activeTab === 'todo' ? 'Görev Ekle' : activeTab === 'jira' ? 'Task Ekle' : 'Toplantı Ekle'))}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
