import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { getShiftInfo } from '../../utils/shiftLogic';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface MonthlyViewProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  meetings: PlannerMeeting[];
  onSelectDate: (date: Date) => void;
}

export default function MonthlyView({ currentMonth, onMonthChange, meetings, onSelectDate }: MonthlyViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  
  // Takvim gridi Pazartesi'den başlamalı. (weekStartsOn: 1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const prevMonth = () => onMonthChange(subMonths(currentMonth, 1));

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: tr })}</h2>
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); prevMonth(); }} className="p-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition">
            <FaChevronLeft className="text-stone-600 dark:text-zinc-300 text-sm" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); nextMonth(); }} className="p-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition">
            <FaChevronRight className="text-stone-600 dark:text-zinc-300 text-sm" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day, idx) => {
          const shift = getShiftInfo(day);
          const dayMeetings = meetings.filter(m => m.date === format(day, 'yyyy-MM-dd'));
          
          let shiftBg = 'bg-stone-100 dark:bg-zinc-700/50 block'; // Tatil
          if (shift.type === 'Sabah') shiftBg = 'bg-amber-400 border border-amber-500';
          if (shift.type === 'Akşam') shiftBg = 'bg-indigo-500 border border-indigo-600';

          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={`min-h-[85px] sm:min-h-[110px] p-2 border-r border-b border-stone-100 dark:border-zinc-800/80 cursor-pointer transition-all hover:bg-stone-50 dark:hover:bg-zinc-800/50 relative
                ${!isCurrentMonth ? 'opacity-40 bg-stone-50/50 dark:bg-zinc-900/50' : ''}
                ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${isToday ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' : 'text-stone-700 dark:text-zinc-300'}`}>
                  {format(day, dateFormat)}
                </span>
                
                {/* Mini Shift Indicator Box */}
                {isCurrentMonth && (
                  <div className={`w-3 h-3 rounded shadow-sm ${shiftBg}`} title={shift.type} />
                )}
              </div>
              
              <div className="mt-2 space-y-1">
                {dayMeetings.slice(0, 3).map((m, i) => (
                  <div key={m.id || i} className="text-[9px] sm:text-[10px] truncate px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 font-semibold border border-rose-100 dark:border-rose-900/50">
                    <span className="opacity-70 mr-1">{m.startTime}</span>{m.title}
                  </div>
                ))}
                {dayMeetings.length > 3 && (
                  <div className="text-[10px] text-stone-500 dark:text-zinc-500 font-medium px-1">
                    +{dayMeetings.length - 3} daha
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
