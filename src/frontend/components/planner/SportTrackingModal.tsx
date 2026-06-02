import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDumbbell, FaCheck, FaFire, FaTrophy } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { updateMeeting } from '../../../backend/services/plannerService';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { format, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

interface SportTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: PlannerMeeting[];
  onUpdated: () => void;
}

export default function SportTrackingModal({ isOpen, onClose, meetings, onUpdated }: SportTrackingModalProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;

  const [activeTab, setActiveTab] = useState<'all' | 'thisWeek' | 'thisMonth'>('thisWeek');

  const sportMeetings = useMemo(() => {
    return meetings.filter(m => m.itemType === 'sport').sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
      return dateB.getTime() - dateA.getTime(); // En yeni en üstte
    });
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    if (activeTab === 'thisWeek') {
      return sportMeetings.filter(m => isThisWeek(parseISO(m.date), { weekStartsOn: 1 }));
    } else if (activeTab === 'thisMonth') {
      return sportMeetings.filter(m => isThisMonth(parseISO(m.date)));
    }
    return sportMeetings;
  }, [sportMeetings, activeTab]);

  const stats = useMemo(() => {
    const completedThisWeek = sportMeetings.filter(m => m.isCompleted && isThisWeek(parseISO(m.date), { weekStartsOn: 1 })).length;
    const completedThisMonth = sportMeetings.filter(m => m.isCompleted && isThisMonth(parseISO(m.date))).length;
    const totalCompleted = sportMeetings.filter(m => m.isCompleted).length;

    return { completedThisWeek, completedThisMonth, totalCompleted };
  }, [sportMeetings]);

  const handleToggleComplete = async (meeting: PlannerMeeting) => {
    if (!meeting.id) return;
    try {
      await updateMeeting(meeting.id, { isCompleted: !meeting.isCompleted });
      onUpdated();
    } catch (err) {
      console.error('Failed to update sport status', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-zinc-800 bg-orange-50 dark:bg-orange-900/20">
            <h3 className="text-xl font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <FaDumbbell className="text-2xl" />
              <span>{language === 'tr' ? 'Spor Takibi' : 'Sport Tracker'}</span>
            </h3>
            <button onClick={onClose} className="p-2 text-stone-500 hover:text-orange-500 transition-colors">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-orange-100/50 dark:bg-orange-900/30 p-3 rounded-2xl border border-orange-200 dark:border-orange-800/50 flex flex-col items-center justify-center text-center">
                <FaFire className="text-orange-500 text-xl mb-1" />
                <span className="text-2xl font-black text-orange-700 dark:text-orange-300">{stats.completedThisWeek}</span>
                <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase">{language === 'tr' ? 'Bu Hafta' : 'This Week'}</span>
              </div>
              <div className="bg-amber-100/50 dark:bg-amber-900/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex flex-col items-center justify-center text-center">
                <FaTrophy className="text-amber-500 text-xl mb-1" />
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.completedThisMonth}</span>
                <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase">{language === 'tr' ? 'Bu Ay' : 'This Month'}</span>
              </div>
              <div className="bg-emerald-100/50 dark:bg-emerald-900/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center justify-center text-center">
                <FaCheck className="text-emerald-500 text-xl mb-1" />
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.totalCompleted}</span>
                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase">{language === 'tr' ? 'Toplam' : 'Total'}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl mb-4">
              {(['thisWeek', 'thisMonth', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white dark:bg-zinc-700 shadow-sm text-orange-600 dark:text-orange-400'
                      : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab === 'thisWeek' ? (language === 'tr' ? 'Bu Hafta' : 'This Week') :
                   tab === 'thisMonth' ? (language === 'tr' ? 'Bu Ay' : 'This Month') :
                   (language === 'tr' ? 'Tümü' : 'All')}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-10 text-stone-400 dark:text-zinc-500 italic text-sm">
                  {language === 'tr' ? 'Bu aralıkta spor planı bulunamadı.' : 'No sport plans found in this range.'}
                </div>
              ) : (
                filteredMeetings.map(m => (
                  <div 
                    key={m.id} 
                    className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                      m.isCompleted 
                        ? 'bg-stone-50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-800 opacity-60' 
                        : 'bg-white dark:bg-zinc-800 border-orange-200 dark:border-orange-900/50 shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleComplete(m)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        m.isCompleted 
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                          : 'bg-stone-100 dark:bg-zinc-700 text-stone-300 dark:text-zinc-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-500 border border-stone-200 dark:border-zinc-600'
                      }`}
                    >
                      <FaCheck size={16} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-bold truncate ${m.isCompleted ? 'line-through text-stone-500 dark:text-zinc-400' : 'text-stone-800 dark:text-zinc-100'}`}>
                          {m.title}
                        </span>
                        {m.notes && <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-zinc-700 text-stone-500 dark:text-zinc-400 rounded">Notlu</span>}
                      </div>
                      <div className="text-xs font-semibold text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <span className="text-orange-500 dark:text-orange-400">{format(parseISO(m.date), 'd MMM', { locale: dateLocale })}</span>
                        <span>•</span>
                        <span>{m.startTime} {m.endTime ? `- ${m.endTime}` : ''}</span>
                      </div>
                      {m.notes && (
                        <div className="text-xs text-stone-400 dark:text-zinc-500 mt-1 italic truncate">
                          {m.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
