import { useMemo } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { FaCalendarAlt, FaTasks, FaFutbol, FaCheckCircle } from 'react-icons/fa';
import { SiJira } from 'react-icons/si';

interface WeeklyViewProps {
  currentDate: Date;
  meetings: PlannerMeeting[];
  onSelectDate: (date: Date) => void;
}

export default function WeeklyView({ currentDate, meetings, onSelectDate }: WeeklyViewProps) {
  // Start week from Monday (weekStartsOn: 1)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const { language, t } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getItemsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Group all items that belong to this day
    const dayItems = meetings.filter((m) => {
      if (m.itemType === 'jira') {
        return m.dueDate === dateStr;
      }
      return m.date === dateStr;
    });

    return dayItems.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'meeting': return <FaCalendarAlt size={10} />;
      case 'todo': return <FaCheckCircle size={10} />;
      case 'jira': return <SiJira size={10} />;
      case 'match': return <FaFutbol size={10} />;
      default: return <FaTasks size={10} />;
    }
  };

  const getColorClassForType = (type?: string) => {
    switch (type) {
      case 'meeting': return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50';
      case 'todo': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'jira': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50';
      case 'match': return 'bg-yellow-50 text-red-600 border-red-200 dark:bg-yellow-900/20 dark:text-red-400 dark:border-red-900/50'; // GS colors
      default: return 'bg-stone-50 text-stone-600 border-stone-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-stone-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
      {/* --- DESKTOP VIEW: Grid Layout --- */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-stone-200 dark:border-zinc-800">
          {weekDays.map((day, idx) => {
            const dayMatches = getItemsForDay(day).filter(m => m.itemType === 'match');
            return (
              <div
                key={idx}
                className={`py-3 text-center border-r relative last:border-r-0 border-stone-200 dark:border-zinc-800 ${isToday(day) ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
              >
                <div className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  {format(day, 'EEE', { locale: dateLocale })}
                </div>
                <div className={`text-lg font-bold ${isToday(day) ? 'text-amber-600 dark:text-amber-500' : 'text-stone-900 dark:text-zinc-100'}`}>
                  {format(day, 'd')}
                </div>
                {dayMatches.length > 0 && (
                  <div className="mt-1 cursor-help" title={`${dayMatches[0].title} — ${dayMatches[0].startTime}`}>
                    <span className="text-sm">⚽</span>
                    <span className="text-[9px] font-bold text-red-500 dark:text-red-400 ml-0.5">{dayMatches[0].startTime}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, idx) => {
            const dayItems = getItemsForDay(day).filter(m => m.itemType !== 'match');
            return (
              <div
                key={idx}
                className={`p-2 border-r last:border-r-0 border-stone-200 dark:border-zinc-800 transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/30 cursor-pointer ${isToday(day) ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}
                onClick={() => onSelectDate(day)}
              >
                <div className="flex flex-col gap-2">
                  {dayItems.map((item, idxx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idxx * 0.05 }}
                      key={item.id || idxx}
                      className={`p-1.5 rounded-xl border shadow-sm flex flex-col gap-0.5 transition-transform hover:scale-[1.05] ${getColorClassForType(item.itemType)}`}
                    >
                      <div className="flex items-center gap-1 font-bold opacity-80 text-[10px]">
                        {getIconForType(item.itemType)}
                        <span className="truncate">{item.startTime || t('planner.allDay')}</span>
                      </div>
                      <div className="font-semibold text-xs leading-tight line-clamp-2">{item.title}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MOBILE VIEW: Vertical List Layout --- */}
      <div className="md:hidden flex flex-col divide-y divide-stone-200 dark:divide-zinc-800">
        {weekDays.map((day, idx) => {
          const dayItems = getItemsForDay(day);
          const hasMatch = dayItems.some(m => m.itemType === 'match');
          const dayMatches = dayItems.filter(m => m.itemType === 'match');
          const otherItems = dayItems.filter(m => m.itemType !== 'match');

          return (
            <div 
              key={idx} 
              className={`p-4 transition-colors ${isToday(day) ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
              onClick={() => onSelectDate(day)}
            >
              {/* Mobile Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border ${
                    isToday(day) 
                      ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20' 
                      : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700'
                  }`}>
                    <span className="text-[10px] uppercase font-black opacity-80 leading-none mb-1">
                      {format(day, 'EEE', { locale: dateLocale })}
                    </span>
                    <span className="text-lg font-black leading-none italic">
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isToday(day) ? 'text-rose-600 dark:text-rose-400' : 'text-stone-900 dark:text-white'}`}>
                      {isToday(day) ? t('planner.today') : format(day, 'd MMMM', { locale: dateLocale })}
                    </div>
                    {hasMatch && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs">⚽</span>
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">
                          {t('planner.matchDay')} {dayMatches[0].startTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-stone-400 dark:text-zinc-600">
                  <FaCalendarAlt size={16} className="opacity-30" />
                </div>
              </div>

              {/* Mobile Item List */}
              <div className="space-y-2 ml-1">
                {otherItems.length > 0 ? (
                  otherItems.map((item, idxx) => (
                    <motion.div
                      key={item.id || idxx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idxx * 0.05 }}
                      className={`p-3 rounded-2xl border flex items-center gap-3 shadow-sm ${getColorClassForType(item.itemType)}`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/50 dark:bg-black/20 shrink-0">
                        {getIconForType(item.itemType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black opacity-60 uppercase mb-0.5 tracking-tight group-hover:opacity-100 transition-opacity">
                          {item.startTime ? `${item.startTime} ${item.endTime ? `- ${item.endTime}` : ''}` : t('planner.allDay')}
                        </div>
                        <div className="text-sm font-bold truncate leading-tight">
                          {item.title}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-2 px-3 rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 text-stone-400 dark:text-zinc-600 text-xs italic">
                    {t('planner.noActivity')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
