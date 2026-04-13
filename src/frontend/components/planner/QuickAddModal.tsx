import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendarPlus, FaTasks } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { addMeeting } from '../../../backend/services/plannerService';
import { format } from 'date-fns';
import { showMarqueeToast } from '../MarqueeToast';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAdded: () => void;
}

type TabType = 'meeting' | 'todo' | 'jira';

export default function QuickAddModal({ isOpen, onClose, selectedDate, onAdded }: QuickAddModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('meeting');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addMeeting({
        userId: user.uid,
        title,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: activeTab === 'meeting' ? startTime : '', // no time for todos
        endTime: activeTab === 'meeting' ? endTime : '',
        dueDate: activeTab === 'jira' ? dueDate : '',
        itemType: activeTab,
        ...(activeTab === 'todo' || activeTab === 'jira' ? { isCompleted: false } : {}),
      });
      showMarqueeToast({
        message: activeTab === 'meeting' ? 'Toplantı eklendi' : activeTab === 'todo' ? 'Görev eklendi' : 'Task eklendi',
        type: 'watched',
        mediaType: 'movie'
      });
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setDueDate('');
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      showMarqueeToast({ message: 'Ekleme başarısız', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <FaCalendarPlus className="text-rose-500" />
              <span>Hızlı Ekle</span>
            </h3>
            <button onClick={onClose} className="p-2 text-stone-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors">
              <FaTimes />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4">
            <div className="flex bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('meeting')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'meeting'
                    ? 'bg-white dark:bg-zinc-700 shadow text-rose-600 dark:text-rose-400'
                    : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
              >
                <FaCalendarPlus size={12} />
                Toplantı
              </button>
              <button
                onClick={() => setActiveTab('todo')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'todo'
                    ? 'bg-white dark:bg-zinc-700 shadow text-emerald-600 dark:text-emerald-400'
                    : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
              >
                <FaTasks size={12} />
                Görev
              </button>
              <button
                onClick={() => setActiveTab('jira')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'jira'
                    ? 'bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400'
                    : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
              >
                <FaTasks size={12} />
                Jira / Task
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Tarih
              </label>
              <div className="w-full px-4 py-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl text-sm font-medium">
                {format(selectedDate, 'dd.MM.yyyy')}
              </div>
            </div>

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
                {isSubmitting ? 'Ekleniyor...' : (activeTab === 'todo' ? 'Görev Ekle' : activeTab === 'jira' ? 'Task Ekle' : 'Toplantı Ekle')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
