import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShiftInfo } from '../../utils/shiftLogic';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';

interface MonthlyViewProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  meetings: PlannerMeeting[];
  onSelectDate: (date: Date) => void;
}

interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function MonthlyView({ currentMonth, onMonthChange, meetings, onSelectDate }: MonthlyViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateFormat = 'd';

  // 'days' i memoize et; yoksa her render'da yeni dizi oluşup sonsuz döngüye giriyor
  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate.getTime(), endDate.getTime()]
  );

  const now = new Date();

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const nextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const prevMonth = () => onMonthChange(subMonths(currentMonth, 1));

  const monthMatches = useMemo(() =>
    meetings
      .filter(m => m.itemType === 'match' && days.some(d => format(d, 'yyyy-MM-dd') === m.date))
      .slice(0, 6),
    [meetings, days]
  );

  const calculateArrows = () => {
    if (!wrapperRef.current || !sidebarRef.current || !calendarRef.current) return;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const newArrows: Arrow[] = [];

    monthMatches.forEach(match => {
      const cell = calendarRef.current!.querySelector(`[data-date="${match.date}"]`);
      const label = sidebarRef.current!.querySelector(`[data-match-id="${match.id}"]`);
      if (!cell || !label) return;

      const cellRect = cell.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();

      newArrows.push({
        id: match.id!,
        startX: cellRect.right - wrapperRect.left,
        startY: cellRect.top + cellRect.height / 2 - wrapperRect.top,
        endX: labelRect.left - wrapperRect.left,
        endY: labelRect.top + labelRect.height / 2 - wrapperRect.top,
      });
    });

    setArrows(newArrows);
  };

  // showMatches veya ay değiştiğinde okları hesapla ya da sıfırla
  useEffect(() => {
    if (!showMatches) { setArrows([]); return; }
    const timer = setTimeout(calculateArrows, 450);
    return () => clearTimeout(timer);
  }, [showMatches, currentMonth.getTime()]);

  return (
    // Wrapper: tam genişlik, takvim + sidebar yan yana
    <div ref={wrapperRef} className="relative">
      <div className="flex items-start gap-0">

        {/* TAKVİM — showMatches açıkken flex-1 ile daralır, kapalıyken tam genişlik */}
        <motion.div
          ref={calendarRef}
          layout
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm min-w-0"
          style={{ flexGrow: 1, flexShrink: 1, flexBasis: '0%' }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: tr })}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMatches(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  showMatches
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                    : monthMatches.length > 0
                      ? 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                      : 'bg-stone-100 text-stone-400 dark:bg-zinc-800/50 dark:text-zinc-600 cursor-not-allowed'
                }`}
                disabled={!showMatches && monthMatches.length === 0}
                title={monthMatches.length === 0 ? 'Bu ay maç yok' : ''}
              >
                <PiSoccerBallFill size={14} />
                <span className="hidden sm:inline">
                  {showMatches ? 'Fikstürü Gizle' : `Maçlara Bak${monthMatches.length > 0 ? ` (${monthMatches.length})` : ''}`}
                </span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); prevMonth(); }} className="p-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition">
                <FaChevronLeft className="text-stone-600 dark:text-zinc-300 text-sm" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextMonth(); }} className="p-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition">
                <FaChevronRight className="text-stone-600 dark:text-zinc-300 text-sm" />
              </button>
            </div>
          </div>

          {/* GÜN BAŞLIKLARI */}
          <div className="grid grid-cols-7 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* TAKVİM HÜCRE GRİDİ */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, idx) => {
              const shift = getShiftInfo(day);
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayMeetings = meetings.filter(m => {
                  if (m.itemType === 'jira') {
                    return m.dueDate === dateStr;
                  }
                  return m.date === dateStr;
                });
              const hasMatch = dayMeetings.some(m => m.itemType === 'match');
              const match = dayMeetings.find(m => m.itemType === 'match');

              let shiftBg = 'bg-stone-100 dark:bg-zinc-700/50';
              if (shift.type === 'Sabah') shiftBg = 'bg-amber-400 border border-amber-500';
              if (shift.type === 'Akşam') shiftBg = 'bg-indigo-500 border border-indigo-600';

              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  data-date={dateStr}
                  onClick={() => onSelectDate(day)}
                  className={`min-h-[85px] sm:min-h-[110px] p-2 border-r border-b border-stone-100 dark:border-zinc-800/80 cursor-pointer transition-all hover:bg-stone-50 dark:hover:bg-zinc-800/50 relative
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                    ${hasMatch && showMatches ? 'ring-1 ring-inset ring-red-400/40 bg-red-50/30 dark:bg-red-900/10' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${isToday ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' : 'text-stone-700 dark:text-zinc-300'}`}>
                        {format(day, dateFormat)}
                      </span>
                      {hasMatch && match && (
                        <span
                          className={`flex items-center gap-0.5 cursor-pointer transition-transform ${showMatches ? 'scale-110' : 'hover:scale-125'}`}
                          onClick={(e) => { e.stopPropagation(); setShowMatches(true); }}
                          title={`${match.title} — ${match.startTime}`}
                        >
                          <span className="text-sm">⚽</span>
                          <span className="text-[9px] font-bold text-red-500 dark:text-red-400">{match.startTime}</span>
                        </span>
                      )}
                    </div>
                    {isCurrentMonth && (
                      <div className={`w-3 h-3 rounded shadow-sm ${shiftBg}`} title={shift.type} />
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayMeetings.filter(m => m.itemType !== 'match').slice(0, 3).map((m, i) => {
                      const mDateTime = new Date(`${m.date}T${m.startTime}`);
                      const isPast = mDateTime < now;
                      
                      const getStatusAccent = (statusKey: string) => {
                        switch(statusKey) {
                          case 'planned': return 'bg-indigo-500';
                          case 'dev': return 'bg-sky-500';
                          case 'test': return 'bg-amber-500';
                          case 'done': return 'bg-emerald-500';
                          default: return 'bg-zinc-400';
                        }
                      };

                      return (
                        <div key={m.id || i} className={`text-[9px] sm:text-[10px] truncate pr-1.5 pl-2 py-0.5 rounded font-semibold border transition-all relative overflow-hidden
                          ${isPast ? 'opacity-40 grayscale-[0.5]' : ''}
                          ${m.itemType === 'jira' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/50' :
                            m.itemType === 'todo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/50' :
                            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/50'}`}
                        >
                          {m.itemType === 'jira' && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusAccent(m.status || 'todo')}`} />
                          )}
                          <span className="opacity-70 mr-1">{m.startTime}</span>{m.title}
                        </div>
                      );
                    })}
                    {dayMeetings.filter(m => m.itemType !== 'match').length > 3 && (
                      <div className="text-[10px] text-stone-500 dark:text-zinc-500 font-medium px-1">
                        +{dayMeetings.filter(m => m.itemType !== 'match').length - 3} daha
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* FİKSTÜR SIDEBAR — showMatches=true olunca sağdan kayarak açılır */}
        <AnimatePresence>
          {showMatches && monthMatches.length > 0 && (
            <motion.div
              ref={sidebarRef}
              key="fixture-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden flex-shrink-0 hidden xl:block"
            >
              <div className="pl-6 pt-20 space-y-4 w-[280px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-red-600 rounded-full" />
                  <h3 className="text-base font-bold text-stone-800 dark:text-zinc-100">Fikstür Bilgisi</h3>
                </div>
                {monthMatches.map(match => (
                    <div
                      key={match.id}
                      data-match-id={match.id}
                      className={`bg-white dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-700 shadow-sm hover:border-red-400/60 transition-all
                        ${new Date(`${match.date}T${match.startTime}`) < now ? 'opacity-40 grayscale-[0.5]' : ''}`}
                    >
                    <div className="text-[10px] font-bold text-red-500 dark:text-red-400 mb-1 flex items-center gap-1.5">
                      <span>{format(new Date(match.date), 'd MMMM', { locale: tr })}</span>
                      <span className="w-1 h-1 bg-stone-300 rounded-full" />
                      <span>{match.startTime}</span>
                    </div>
                    <div className="text-sm font-semibold text-stone-800 dark:text-zinc-100 leading-snug">
                      {match.title}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SVG OKLAR — Takvim hücresi sağ kenarından sidebar kartına */}
      <AnimatePresence>
        {showMatches && arrows.length > 0 && (
          <motion.svg
            key="arrows-svg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-0 pointer-events-none z-20 hidden xl:block"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" opacity="0.6" />
              </marker>
            </defs>
            {arrows.map((arrow, i) => (
              <motion.path
                key={arrow.id}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                d={`M ${arrow.startX} ${arrow.startY} C ${arrow.startX + 50} ${arrow.startY}, ${arrow.endX - 50} ${arrow.endY}, ${arrow.endX} ${arrow.endY}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="5 3"
                markerEnd="url(#arrowhead)"
              />
            ))}
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
