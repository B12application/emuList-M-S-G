import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendarPlus } from 'react-icons/fa';
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

export default function QuickAddModal({ isOpen, onClose, selectedDate, onAdded }: QuickAddModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
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
        startTime,
      });
      showMarqueeToast({ message: 'Toplantı eklendi', type: 'watched', mediaType: 'movie' });
      setTitle('');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
          
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Tarih
              </label>
              <div className="w-full px-4 py-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl text-sm font-medium">
                {format(selectedDate, 'dd.MM.yyyy')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Saat
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all block text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Konu
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Ekip Toplantısı"
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? 'Ekleniyor...' : 'Toplantı Ekle'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
