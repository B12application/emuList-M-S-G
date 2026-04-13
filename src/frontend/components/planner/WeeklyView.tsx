import { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getItemsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Group all items that belong to this day
    const dayItems = meetings.filter((m) => {
      // Due Date tracking for jira/tasks
      if (m.itemType === 'jira' && m.dueDate) {
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
      <div className="grid grid-cols-7 border-b border-stone-200 dark:border-zinc-800">
        {weekDays.map((day, idx) => {
          const dayMatches = getItemsForDay(day).filter(m => m.itemType === 'match');
          
          return (
            <div 
              key={idx} 
              className={`py-3 text-center border-r relative last:border-r-0 border-stone-200 dark:border-zinc-800 ${isToday(day) ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
            >
              <div className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                {format(day, 'EEE')}
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

      {/* Grid Row */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {weekDays.map((day, idx) => {
          // Maçları ana listeden ayırıyoruz, çünkü onları Date/Tarih kısmının yanına çizdik
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
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idxx * 0.05 }}
                    key={item.id || idxx}
                    title={item.title}
                    className={`p-1.5 rounded-xl border shadow-sm flex flex-col gap-0.5 transition-transform hover:scale-[1.02] ${getColorClassForType(item.itemType)}`}
                  >
                    <div className="flex items-center gap-1 font-bold opacity-80 text-[10px]">
                      {getIconForType(item.itemType)}
                      <span className="truncate">
                        {item.startTime ? `${item.startTime}` : 'Tüm Gün'}
                      </span>
                    </div>
                    <div className="font-semibold text-xs leading-tight line-clamp-2">
                      {item.title}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
