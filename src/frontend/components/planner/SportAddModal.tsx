import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDumbbell, FaWalking, FaSwimmer, FaBiking } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useAppSound } from '../../context/SoundContext';
import { useLanguage } from '../../context/LanguageContext';
import { useShift } from '../../context/ShiftContext';
import { addMeeting } from '../../../backend/services/plannerService';
import { format, addMinutes } from 'date-fns';
import { showMarqueeToast } from '../MarqueeToast';

interface SportAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onAdded: () => void;
}

const SPORT_TYPES = [
  { id: 'Fitness', label: 'Fitness', icon: FaDumbbell, color: 'bg-orange-500' },
  { id: 'Running', label: 'Koşu', icon: FaWalking, color: 'bg-emerald-500' },
  { id: 'Swimming', label: 'Yüzme', icon: FaSwimmer, color: 'bg-blue-500' },
  { id: 'Cycling', label: 'Bisiklet', icon: FaBiking, color: 'bg-rose-500' },
];

export default function SportAddModal({ isOpen, onClose, selectedDate, onAdded }: SportAddModalProps) {
  const { user } = useAuth();
  const { playSuccess } = useAppSound();
  const { t, language } = useLanguage();
  const { getShiftInfo } = useShift();

  const [sportType, setSportType] = useState('Fitness');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedMessage, setSuggestedMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const shift = getShiftInfo(selectedDate);
      
      // Varsayılan saatleri vardiyaya göre ayarla
      if (shift.type === 'Sabah') {
        setStartTime('18:30');
        setEndTime('20:00');
        setSuggestedMessage(language === 'tr' ? 'Sabah vardiyasında olduğun için akşam saatleri önerildi.' : 'Evening hours suggested due to morning shift.');
      } else if (shift.type === 'Akşam') {
        setStartTime('09:30');
        setEndTime('11:00');
        setSuggestedMessage(language === 'tr' ? 'Akşam vardiyasında olduğun için sabah saatleri önerildi.' : 'Morning hours suggested due to evening shift.');
      } else {
        // Tatil veya nöbet
        setStartTime('10:00');
        setEndTime('11:30');
        setSuggestedMessage(language === 'tr' ? 'Tatil gününde istediğin saatte spor yapabilirsin!' : 'You can exercise anytime on your day off!');
      }
      setNotes('');
    }
  }, [isOpen, selectedDate]);

  // Auto-duration (1.5 hours default if changed manually)
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    try {
      const [hours, minutes] = newStartTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addMinutes(startDate, 90);
      setEndTime(format(endDate, 'HH:mm'));
    } catch (err) {
      console.error('Time calculation error', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const meetingData = {
        userId: user.uid,
        title: sportType,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        notes: notes.trim(),
        itemType: 'sport' as const,
        category: 'sport',
        isCompleted: false,
      };

      await addMeeting(meetingData, false);
      
      showMarqueeToast({
        message: language === 'tr' ? 'Spor programı eklendi!' : 'Sport schedule added!',
        type: 'success'
      });
      playSuccess();
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      showMarqueeToast({ message: t('planner.actionFailed'), type: 'error' });
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
          <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800 bg-orange-50 dark:bg-orange-900/20">
            <h3 className="text-lg font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <FaDumbbell />
              <span>{language === 'tr' ? 'Spor Planla' : 'Plan Sport'}</span>
            </h3>
            <button onClick={onClose} className="p-2 text-stone-500 hover:text-orange-500 transition-colors">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Vardiya Mesajı */}
            <div className="bg-orange-100/50 dark:bg-orange-900/30 p-3 rounded-xl border border-orange-200 dark:border-orange-800/50">
              <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                💡 {suggestedMessage}
              </p>
            </div>

            {/* Spor Türü */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                {language === 'tr' ? 'Spor Türü' : 'Sport Type'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SPORT_TYPES.map(type => {
                  const Icon = type.icon;
                  const isActive = sportType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSportType(type.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                        isActive 
                          ? `${type.color} text-white shadow-md border-transparent scale-[1.02]` 
                          : 'bg-stone-50 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-bold">{language === 'tr' ? type.label : type.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saatler */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                  {t('planner.startTime')}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all block text-sm"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                  {t('planner.endTime')}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all block text-sm"
                  required
                />
              </div>
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                {t('planner.notes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'tr' ? 'Hangi kas grubu, program detayı vs.' : 'Workout details, muscle groups etc.'}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm min-h-[80px] resize-none"
              />
            </div>

            {/* Gönder */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:active:scale-100 active:scale-95 bg-orange-600 hover:bg-orange-700 shadow-orange-600/20"
              >
                {isSubmitting ? t('planner.adding') : (language === 'tr' ? 'Spora Yazıl' : 'Schedule Sport')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
