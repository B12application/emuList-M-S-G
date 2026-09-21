import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths,
  differenceInDays, parseISO
} from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useState, useRef, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlannerMeeting, CalendarAlert } from '../../../backend/types/planner';
import { FaChevronLeft, FaChevronRight, FaSearch, FaTimes, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';

interface MonthlyViewProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  meetings: PlannerMeeting[];
  onSelectDate: (date: Date) => void;
  calendarAlerts?: CalendarAlert[];
  onItemDateChange?: (itemId: string, newDateStr: string, itemType?: string) => void;
}

export default function MonthlyView({
  currentMonth,
  onMonthChange,
  meetings,
  onSelectDate,
  calendarAlerts = [],
  onItemDateChange
}: MonthlyViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<'all' | 'superlig' | 'championsleague'>('all');
  const [hoveredMatch, setHoveredMatch] = useState<{ match: PlannerMeeting; rect: DOMRect } | null>(null);
  const [hoveredDayTasks, setHoveredDayTasks] = useState<{ date: Date; dateStr: string; tasks: PlannerMeeting[] } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const openDayTasksModal = (date: Date, dateStr: string, tasks: PlannerMeeting[]) => {
    if (draggingItemId) return;
    setHoveredDayTasks({ date, dateStr, tasks });
  };

  // Escape tuşuna basıldığında modalı kapat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHoveredDayTasks(null);
      }
    };
    if (hoveredDayTasks) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [hoveredDayTasks]);

  /**
   * Görevleri sıralar:
   * 1. Tamamlanmamışlar en üstte (öncelik sırasına göre: urgent > high > jira > medium > low)
   * 2. Tamamlanmışlar en altta
   */
  const sortPlannerTasks = (tasks: PlannerMeeting[]) => {
    return [...tasks].sort((a, b) => {
      const aDone = !!(a.isCompleted || a.status === 'done');
      const bDone = !!(b.isCompleted || b.status === 'done');
      if (aDone !== bDone) return aDone ? 1 : -1;

      const getPriorityWeight = (m: PlannerMeeting) => {
        if (m.priority === 'urgent') return 1;
        if (m.priority === 'high') return 2;
        if (m.itemType === 'jira') return 2.5;
        if (m.priority === 'medium') return 3;
        if (m.priority === 'low') return 4;
        return 3.5;
      };

      const weightA = getPriorityWeight(a);
      const weightB = getPriorityWeight(b);
      if (weightA !== weightB) return weightA - weightB;

      return (a.startTime || '99:99').localeCompare(b.startTime || '99:99');
    });
  };

  const dateLocale = language === 'tr' ? tr : enUS;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateFormat = 'd';

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate.getTime(), endDate.getTime()]
  );

  const now = new Date();

  const weekDays = language === 'tr' ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getAlertInfoForDay = (day: Date, dayIndex: number) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const results: {
      alert: CalendarAlert;
      isStart: boolean;
      isEnd: boolean;
      isRowStart: boolean;
      isRowEnd: boolean;
      diffDays: number;
      currentDayIndex: number;
    }[] = [];

    calendarAlerts.forEach(alert => {
      if (dateStr >= alert.startDate && dateStr <= alert.endDate) {
        const isStart = dateStr === alert.startDate;
        const isEnd = dateStr === alert.endDate;
        const colInWeek = dayIndex % 7;
        const isRowStart = isStart || colInWeek === 0;
        const isRowEnd = isEnd || colInWeek === 6;
        let diffDays = 1;
        let currentDayIndex = 1;
        try {
          diffDays = differenceInDays(parseISO(alert.endDate), parseISO(alert.startDate)) + 1;
          currentDayIndex = differenceInDays(parseISO(dateStr), parseISO(alert.startDate)) + 1;
        } catch {
          diffDays = 1;
          currentDayIndex = 1;
        }
        results.push({ alert, isStart, isEnd, isRowStart, isRowEnd, diffDays, currentDayIndex });
      }
    });

    return results;
  };

  const getPopoverStyle = (rect: DOMRect, width: number = 320, expectedHeight: number = 360) => {
    if (typeof window === 'undefined') {
      return { top: `${rect.bottom + 6}px`, left: `${rect.left}px` };
    }

    const margin = 12;
    // Hücrenin veya görevlerin üstünü örtmemek için öncelikle yan tarafa (sağa veya sola) konumlandır
    const hasRightSpace = rect.right + width + margin <= window.innerWidth;
    const hasLeftSpace = rect.left - width - margin >= 0;

    let left: number;
    let top = rect.top;

    // Dikeyde ekran sınırları içinde tut
    if (top + expectedHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - expectedHeight - margin);
    }
    if (top < margin) {
      top = margin;
    }

    if (hasRightSpace && (rect.left < window.innerWidth / 2 || !hasLeftSpace)) {
      // Hücrenin SAĞINA açılır
      left = rect.right + 8;
    } else if (hasLeftSpace) {
      // Hücrenin SOLUNA açılır
      left = rect.left - width - 8;
    } else {
      // Çok dar mobil/tablet ekranlarda fallback (ortala ve üst/alt aç)
      left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin));
      if (rect.bottom + expectedHeight + margin <= window.innerHeight) {
        top = rect.bottom + 6;
      } else {
        top = Math.max(margin, rect.top - expectedHeight - 6);
      }
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };
  const prevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  // Tüm seçili ay içindeki maçlar
  const monthMatches = useMemo(() => {
    const currentMatches = meetings.filter(
      m => m.itemType === 'match' && days.some(d => format(d, 'yyyy-MM-dd') === m.date)
    );
    if (currentMatches.length > 0) return currentMatches;

    // Eğer o ayda maç yoksa tüm gelecek maçlardan getir
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return meetings
      .filter(m => m.itemType === 'match' && m.date >= todayStr)
      .slice(0, 15);
  }, [meetings, days]);

  // Filtrelenmiş maçlar (Lig ve Arama)
  const filteredMatches = useMemo(() => {
    return monthMatches.filter(m => {
      const matchLeague = leagueFilter === 'all'
        ? true
        : leagueFilter === 'superlig'
          ? (m.description?.includes('Süper Lig') || m.category?.includes('Süper Lig'))
          : (
              m.description?.includes('Şampiyonlar') || 
              m.category?.includes('Şampiyonlar') || 
              m.description?.includes('Avrupa') || 
              m.category?.includes('Avrupa') ||
              ['La Liga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1'].includes(m.category || '')
            );

      const matchSearch = searchQuery.trim() === ''
        || m.title.toLowerCase().includes(searchQuery.toLowerCase())
        || (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchLeague && matchSearch;
    });
  }, [monthMatches, leagueFilter, searchQuery]);

  // Aktif ay içindeki özel takvim uyarıları
  const activeMonthAlerts = useMemo(() => {
    const mStartStr = format(monthStart, 'yyyy-MM-dd');
    const mEndStr = format(monthEnd, 'yyyy-MM-dd');
    return calendarAlerts.filter(a => a.startDate <= mEndStr && a.endDate >= mStartStr);
  }, [calendarAlerts, monthStart, monthEnd]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-start gap-4">
        {/* TAKVİM ANA TABLOSU */}
        <motion.div
          ref={calendarRef}
          layout
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm min-w-0 flex-1"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-zinc-800/80">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-800 dark:text-zinc-100 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMatches(v => !v)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  showMatches
                    ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20'
                    : monthMatches.length > 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-400/30'
                      : 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                }`}
                title={monthMatches.length === 0 ? t('planner.noMatches') : ''}
              >
                <PiSoccerBallFill size={15} />
                <span>
                  {showMatches ? 'Fikstürü Gizle' : `Fikstür (${monthMatches.length})`}
                </span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); prevMonth(); }}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition text-stone-600 dark:text-zinc-300"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextMonth(); }}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition text-stone-600 dark:text-zinc-300"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>

          {/* BU AYKİ ÖZEL DÖNEMLER / UYARILAR BİLGİ ŞERİDİ */}
          {activeMonthAlerts.length > 0 && (
            <div className="px-6 py-2.5 bg-stone-50/70 dark:bg-zinc-900/50 border-b border-stone-100 dark:border-zinc-800/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <span className="text-[11px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-red-500 text-xs" />
                {language === 'tr' ? 'Bu Ayki Dönemler / Uyarılar:' : 'Special Alerts This Month:'}
              </span>
              {activeMonthAlerts.map(alert => (
                <div
                  key={alert.id || alert.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 border"
                  style={{
                    backgroundColor: `${alert.color || '#ef4444'}15`,
                    borderColor: `${alert.color || '#ef4444'}35`,
                    color: alert.color || '#ef4444',
                  }}
                >
                  <span>{alert.label}</span>
                  <span className="text-[10px] opacity-75 font-medium">
                    ({format(parseISO(alert.startDate), 'd MMM', { locale: dateLocale })} - {format(parseISO(alert.endDate), 'd MMM', { locale: dateLocale })})
                  </span>
                  {alert.isCompleted && <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">✓</span>}
                </div>
              ))}
            </div>
          )}

          {/* GÜN BAŞLIKLARI */}
          <div className="grid grid-cols-7 border-b border-stone-200/60 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-900/40">
            {weekDays.map(day => (
              <div key={day} className="py-2.5 text-center text-[11px] font-black text-stone-500 dark:text-zinc-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* TAKVİM HÜCRE GRİDİ */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-100 dark:divide-zinc-800/60">
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayMeetings = meetings.filter(m => {
                if (m.itemType === 'jira') {
                  return m.dueDate === dateStr;
                }
                return m.date === dateStr;
              });
              const dayMatches = dayMeetings.filter(m => m.itemType === 'match');
              const nonMatchMeetings = sortPlannerTasks(dayMeetings.filter(m => m.itemType !== 'match'));

              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const alertInfos = getAlertInfoForDay(day, idx);
              const primaryAlert = alertInfos[0]?.alert;
              const isAlertActive = alertInfos.length > 0 && isCurrentMonth;

              return (
                <div
                  key={day.toString()}
                  data-date={dateStr}
                  onClick={() => onSelectDate(day)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverDate !== dateStr) {
                      setDragOverDate(dateStr);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      if (dragOverDate === dateStr) {
                        setDragOverDate(null);
                      }
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDate(null);
                    setDraggingItemId(null);
                    const raw = e.dataTransfer.getData('text/plain');
                    if (!raw) return;
                    try {
                      const itemData = JSON.parse(raw);
                      if (itemData.id && itemData.date !== dateStr) {
                        onItemDateChange?.(itemData.id, dateStr, itemData.itemType);
                      }
                    } catch (err) {
                      console.error('Drop error:', err);
                    }
                  }}
                  className={`min-h-[95px] sm:min-h-[125px] p-2 sm:p-2.5 cursor-pointer transition-all hover:bg-stone-50/80 dark:hover:bg-zinc-900/80 relative group flex flex-col justify-between min-w-0 w-full overflow-hidden
                    ${!isCurrentMonth ? 'opacity-30 pointer-events-none bg-stone-50/40 dark:bg-zinc-950/40' : ''}
                    ${dayMatches.length > 0 && showMatches ? 'bg-amber-400/5 dark:bg-amber-400/[0.03]' : ''}
                    ${dragOverDate === dateStr ? 'bg-amber-400/20 dark:bg-amber-400/20 ring-2 ring-inset ring-amber-400 z-10' : ''}
                  `}
                  style={{
                    backgroundColor: isAlertActive && primaryAlert?.color && !(dayMatches.length > 0 && showMatches) && dragOverDate !== dateStr
                      ? `${primaryAlert.color}0c`
                      : undefined,
                  }}
                >
                  {/* Kesintisiz Üst Dönem Şeridi (Continuous Top Period Bar) */}
                  {isCurrentMonth && alertInfos.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 flex flex-col pointer-events-none z-10">
                      {alertInfos.map((info, aIdx) => (
                        <div
                          key={`${info.alert.id || info.alert.label}-${aIdx}`}
                          className="h-[3.5px] w-full transition-all"
                          style={{
                            backgroundColor: info.alert.color || '#ef4444',
                            opacity: info.alert.isCompleted ? 0.4 : 0.85,
                            borderTopLeftRadius: info.isRowStart ? '4px' : '0px',
                            borderBottomLeftRadius: info.isRowStart ? '4px' : '0px',
                            borderTopRightRadius: info.isRowEnd ? '4px' : '0px',
                            borderBottomRightRadius: info.isRowEnd ? '4px' : '0px',
                          }}
                          title={`${info.alert.label} (${info.currentDayIndex}/${info.diffDays}. Gün)`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Gün Başlığı: Numara ve Zarif Dönem Göstergesi */}
                  <div className="flex justify-between items-center gap-1 mb-1 min-w-0">
                    <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
                      isToday 
                        ? 'bg-amber-400 text-stone-950 shadow-sm' 
                        : 'text-stone-700 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                    }`}>
                      {format(day, dateFormat)}
                    </span>

                    {/* Dönem Rozeti / Göstergesi */}
                    {isCurrentMonth && alertInfos.length > 0 && (
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        {alertInfos.map((info, aIdx) => {
                          const color = info.alert.color || '#ef4444';
                          const isDone = !!info.alert.isCompleted;

                          // Tek günlük uyarı veya çok günlünün Başlangıç Günü
                          if (info.diffDays <= 1 || info.isStart) {
                            return (
                              <span
                                key={`${info.alert.id}-${aIdx}`}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black border transition-all truncate shadow-2xs ${
                                  isDone ? 'opacity-40 grayscale line-through' : ''
                                }`}
                                style={{
                                  backgroundColor: `${color}18`,
                                  borderColor: `${color}45`,
                                  color: color,
                                }}
                                title={`${info.alert.label} (${format(parseISO(info.alert.startDate), 'd MMM', { locale: dateLocale })} → ${format(parseISO(info.alert.endDate), 'd MMM', { locale: dateLocale })}${info.diffDays > 1 ? ` · ${info.diffDays} gün` : ''})`}
                              >
                                {isDone ? (
                                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black shrink-0">✓</span>
                                ) : (
                                  <FaMapMarkerAlt className="shrink-0 text-[8px]" />
                                )}
                                <span className="truncate">{info.alert.label}</span>
                                {info.diffDays > 1 && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-white/80 dark:bg-black/40 font-bold shrink-0">
                                    {info.diffDays}g
                                  </span>
                                )}
                              </span>
                            );
                          }

                          // Çok günlünün Bitiş Günü
                          if (info.isEnd) {
                            return (
                              <span
                                key={`${info.alert.id}-${aIdx}-end`}
                                className={`flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold border transition-all truncate ${
                                  isDone ? 'opacity-40 grayscale line-through' : ''
                                }`}
                                style={{
                                  backgroundColor: `${color}12`,
                                  borderColor: `${color}35`,
                                  color: color,
                                }}
                                title={`${info.alert.label} Son Gün (${info.diffDays}/${info.diffDays})`}
                              >
                                <span>🏁</span>
                                <span className="truncate hidden sm:inline">{info.alert.label}</span>
                              </span>
                            );
                          }

                          // Çok günlünün Ara Günleri: Gün numarasının yanında minik renkli nokta
                          return (
                            <span
                              key={`${info.alert.id}-${aIdx}-dot`}
                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs hover:scale-125 transition-transform"
                              style={{ backgroundColor: color }}
                              title={`${info.alert.label} (${info.currentDayIndex}/${info.diffDays}. Gün)`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ─── MAÇ KARTLARI (YUKARIDA, GÜN BAŞLIĞININ ALTINDA) ─── */}
                  {dayMatches.length > 0 && (
                    <div className="my-1 space-y-1">
                      {dayMatches.map((m, i) => (
                        <div
                          key={m.id || `match-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Maça tıklanınca gün sayfasına yönlendirme engellendi
                          }}
                          onMouseEnter={(e) => {
                            if (draggingItemId) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredMatch({ match: m, rect });
                          }}
                          onMouseLeave={() => setHoveredMatch(null)}
                          className="p-1 sm:p-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 dark:bg-amber-400/15 dark:hover:bg-amber-400/25 border border-amber-400/40 dark:border-amber-400/30 transition-all shadow-xs group/pill cursor-pointer"
                          title={`${m.title} (${m.description || ''}) - ${m.startTime}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              {m.teamBadge ? (
                                <img src={m.teamBadge} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                              ) : (
                                <span className="text-[10px] shrink-0">⚽</span>
                              )}
                              <span className="text-[11px] font-black text-amber-950 dark:text-amber-200 truncate leading-none">
                                {m.title}
                              </span>
                            </div>
                            {m.score ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 shrink-0 border border-emerald-500/35" title="Maç Sonucu">
                                {m.score}
                              </span>
                            ) : m.startTime && m.startTime !== 'TBD' && m.startTime !== '--:--' ? (
                              <span className="text-[9px] font-black px-1 py-0.2 rounded bg-amber-400/40 text-amber-950 dark:text-amber-200 shrink-0">
                                {m.startTime}
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-stone-200/80 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 shrink-0" title="Maç saati henüz kesinleşmedi">
                                Belli Değil
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Masaüstü Görünüm İçin Normal Etkinlikler (AŞAĞIDA, mt-auto) */}
                  {(() => {
                    const maxTasksToShow = dayMatches.length > 0 ? 2 : 3;
                    return (
                      <div
                        className="hidden sm:block space-y-0.5 mt-auto pt-1"
                      >
                        {nonMatchMeetings.slice(0, maxTasksToShow).map((m, i) => {
                          const isDone = !!(m.isCompleted || m.status === 'done');
                          const mDateTime = new Date(`${m.date}T${m.startTime}`);
                          const isPast = mDateTime < now;

                          return (
                            <div
                              key={m.id || i}
                              draggable={true}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setHoveredDayTasks(null);
                                setHoveredMatch(null);
                                setDraggingItemId(m.id || null);
                                e.dataTransfer.setData('text/plain', JSON.stringify({ id: m.id, date: m.date, itemType: m.itemType }));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                setDraggingItemId(null);
                                setDragOverDate(null);
                              }}
                              className={`text-[10px] truncate px-1.5 py-[2px] rounded-lg font-bold border-l-[3px] transition-all cursor-grab active:cursor-grabbing select-none ${
                                isDone
                                  ? 'opacity-45 line-through bg-stone-100/50 dark:bg-zinc-800/30 text-stone-400 dark:text-zinc-500 border-l-emerald-500'
                                  : isPast
                                  ? 'opacity-60 bg-stone-100/70 dark:bg-zinc-800/40 text-stone-600 dark:text-zinc-300'
                                  : 'bg-stone-100/90 dark:bg-zinc-800/70 text-stone-700 dark:text-zinc-200 shadow-2xs hover:scale-[1.02]'
                              } ${
                                !isDone ? (
                                  m.itemType === 'jira' ? 'border-l-blue-500' :
                                  m.itemType === 'todo' ? 'border-l-emerald-500' :
                                  m.itemType === 'sport' ? 'border-l-orange-500' :
                                  'border-l-rose-500'
                                ) : ''
                              }`}
                            >
                              {isDone ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-black mr-1 text-[9px]">✓</span>
                              ) : (
                                <span className="opacity-60 mr-1">{m.startTime}</span>
                              )}
                              <span>{m.title}</span>
                            </div>
                          );
                        })}
                        {nonMatchMeetings.length > maxTasksToShow && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDayTasksModal(day, dateStr, nonMatchMeetings);
                            }}
                            className="text-[9px] text-amber-600 dark:text-amber-400 font-black px-1.5 py-0.5 rounded-md hover:bg-amber-400/15 transition-colors cursor-pointer flex items-center justify-between group/more select-none"
                            title={language === 'tr' ? 'Tüm görevleri görmek için tıklayın' : 'Click to view all tasks'}
                          >
                            <span>+{nonMatchMeetings.length - maxTasksToShow} {t('planner.more')}</span>
                            <span className="text-[8px] opacity-60 group-hover/more:translate-x-0.5 transition-transform">➔</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Mobil Görünüm İçin Noktalar */}
                  <div className="sm:hidden flex flex-wrap gap-0.5 mt-auto pt-1">
                    {nonMatchMeetings.slice(0, 3).map((m, i) => (
                      <div
                        key={m.id || i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          m.itemType === 'jira' ? 'bg-blue-500' :
                          m.itemType === 'todo' ? 'bg-emerald-500' :
                          m.itemType === 'sport' ? 'bg-orange-500' :
                          'bg-rose-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ─── GELİŞMİŞ VE SCROLLABLE FİKSTÜR YAN PANELİ (DESKTOP) ─── */}
        <AnimatePresence>
          {showMatches && (
            <motion.div
              key="fixture-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 330, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden shrink-0 hidden xl:block"
            >
              <div className="w-[330px] bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800/80 rounded-3xl p-4 shadow-sm flex flex-col max-h-[calc(100vh-180px)] 2xl:max-h-[calc(100vh-160px)]">
                {/* Header */}
                <div className="pb-3 border-b border-stone-100 dark:border-zinc-800 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
                        <PiSoccerBallFill />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-stone-900 dark:text-white">
                          Fikstür Listesi
                        </h3>
                        <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium">
                          {filteredMatches.length} Maç Bulundu
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMatches(false)}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mt-2">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Maç veya takım ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 text-stone-800 dark:text-zinc-200"
                    />
                  </div>

                  {/* League Filter Tabs */}
                  <div className="flex items-center gap-1 mt-2.5 bg-stone-100/70 dark:bg-zinc-900 p-0.5 rounded-xl border border-stone-200/50 dark:border-zinc-800">
                    <button
                      onClick={() => setLeagueFilter('all')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        leagueFilter === 'all'
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      Tümü
                    </button>
                    <button
                      onClick={() => setLeagueFilter('superlig')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        leagueFilter === 'superlig'
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      Süper Lig
                    </button>
                    <button
                      onClick={() => setLeagueFilter('championsleague')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        leagueFilter === 'championsleague'
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      Şampiyonlar
                    </button>
                  </div>
                </div>

                {/* Match List (Scrollable Container) */}
                <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-2.5 custom-scrollbar">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map(match => (
                      <motion.div
                        key={match.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => {
                          if (match.date) {
                            const [y, m, d] = match.date.split('-').map(Number);
                            onSelectDate(new Date(y, m - 1, d));
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer bg-stone-50/60 dark:bg-zinc-900/60 border-stone-200/80 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-400/80 shadow-xs ${
                          new Date(`${match.date}T${match.startTime}`) < now ? 'opacity-40 grayscale-[0.4]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <span>{format(new Date(match.date), 'd MMMM yyyy', { locale: tr })}</span>
                            <span className="w-1 h-1 bg-stone-300 dark:bg-zinc-600 rounded-full" />
                            {match.score ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                                MS • {match.score}
                              </span>
                            ) : match.startTime && match.startTime !== 'TBD' && match.startTime !== '--:--' ? (
                              <span>{match.startTime}</span>
                            ) : (
                              <span className="italic text-stone-500 dark:text-zinc-400 font-semibold">Saat Belli Değil</span>
                            )}
                          </div>
                          {match.teamBadge && (
                            <img src={match.teamBadge} alt="" className="w-4 h-4 object-contain shrink-0" />
                          )}
                        </div>

                        <div className="text-xs font-black text-stone-900 dark:text-zinc-100 leading-snug">
                          {match.title}
                        </div>

                        {match.description && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                            <span>{match.description}</span>
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-10 px-3 border border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl text-xs text-stone-400 dark:text-zinc-500">
                      Aradığınız kritere uygun maç bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── MOBİL / TABLET FİKSTÜR LİSTESİ ─── */}
      <AnimatePresence>
        {showMatches && (
          <motion.div
            key="mobile-fixture-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="xl:hidden mt-4 bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
                  <PiSoccerBallFill />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white">
                    Fikstür Listesi
                  </h3>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium">
                    {filteredMatches.length} Maç
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowMatches(false)}
                className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Match List (Max Height with Scroll) */}
            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {filteredMatches.length > 0 ? (
                filteredMatches.map(match => (
                  <div
                    key={match.id}
                    onClick={() => {
                      if (match.date) {
                        const [y, m, d] = match.date.split('-').map(Number);
                        onSelectDate(new Date(y, m - 1, d));
                      }
                    }}
                    className={`p-3 rounded-2xl border bg-stone-50 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 transition-all ${
                      new Date(`${match.date}T${match.startTime}`) < now ? 'opacity-40 grayscale-[0.4]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span>{format(new Date(match.date), 'd MMMM yyyy', { locale: tr })}</span>
                        <span className="w-1 h-1 bg-stone-300 dark:bg-zinc-600 rounded-full" />
                        {match.score ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                            MS • {match.score}
                          </span>
                        ) : match.startTime && match.startTime !== 'TBD' && match.startTime !== '--:--' ? (
                          <span>{match.startTime}</span>
                        ) : (
                          <span className="italic text-stone-500 dark:text-zinc-400 font-semibold">Saat Belli Değil</span>
                        )}
                      </div>
                      {match.teamBadge && (
                        <img src={match.teamBadge} alt="" className="w-4 h-4 object-contain shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-black text-stone-800 dark:text-zinc-100">
                      {match.title}
                    </div>
                    {match.description && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                        <span>{match.description}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-stone-400 dark:text-zinc-500">
                  Bu kritere uygun maç bulunamadı.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HOVER PREVIEW POPOVER FOR MATCH ─── */}
      <AnimatePresence>
        {hoveredMatch && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={getPopoverStyle(hoveredMatch.rect, 290)}
            className="fixed z-[150] w-[290px] p-3.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/90 dark:border-zinc-800 shadow-2xl pointer-events-none"
          >
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
                <PiSoccerBallFill className="text-sm" />
                <span>Maç Önizlemesi</span>
              </div>
              {hoveredMatch.match.score ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">
                  MS: {hoveredMatch.match.score}
                </span>
              ) : hoveredMatch.match.startTime && hoveredMatch.match.startTime !== 'TBD' && hoveredMatch.match.startTime !== '--:--' ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-400/25 text-amber-950 dark:text-amber-300 font-black text-[10px]">
                  {hoveredMatch.match.startTime}
                </span>
              ) : (
                <span className="text-[10px] text-stone-400 italic">Saat Belli Değil</span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              {hoveredMatch.match.teamBadge ? (
                <img src={hoveredMatch.match.teamBadge} alt="" className="w-6 h-6 object-contain shrink-0" />
              ) : (
                <span className="text-lg shrink-0">⚽</span>
              )}
              <div className="text-xs font-black text-stone-900 dark:text-zinc-100 leading-snug">
                {hoveredMatch.match.title}
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-stone-600 dark:text-zinc-400">
              {hoveredMatch.match.category && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-400 dark:text-zinc-500">Turnuva:</span>
                  <span className="font-bold text-stone-800 dark:text-zinc-200">{hoveredMatch.match.category}</span>
                </div>
              )}
              {hoveredMatch.match.description && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-400 dark:text-zinc-500">Açıklama:</span>
                  <span className="text-stone-700 dark:text-zinc-300 truncate">{hoveredMatch.match.description}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-stone-500 dark:text-zinc-400 text-[10px] pt-1">
                <FaClock className="text-[9px]" />
                <span>{format(new Date(hoveredMatch.match.date), 'dd MMMM yyyy', { locale: dateLocale })}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TÜM GÜN GÖREVLERİ STANDART B12 MODALI (SÜRÜKLE-BIRAK DESTEKLİ) ─── */}
      <AnimatePresence>
        {hoveredDayTasks && (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setHoveredDayTasks(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-900/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-black">
                    📅
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 dark:text-zinc-100 leading-snug">
                      {format(hoveredDayTasks.date, 'd MMMM yyyy, EEEE', { locale: dateLocale })}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-zinc-400 font-medium">
                      <span>{hoveredDayTasks.tasks.length} {language === 'tr' ? 'Görev' : 'Tasks'}</span>
                      <span className="w-1 h-1 bg-stone-300 dark:bg-zinc-600 rounded-full" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {hoveredDayTasks.tasks.filter(t => t.isCompleted || t.status === 'done').length} {language === 'tr' ? 'Tamamlandı' : 'Completed'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHoveredDayTasks(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
                  title={language === 'tr' ? 'Kapat' : 'Close'}
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>

              {/* Scrollable Tasks Body */}
              <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-1 max-h-[55vh]">
                {sortPlannerTasks(hoveredDayTasks.tasks).map((task, idx) => {
                  const isDone = !!(task.isCompleted || task.status === 'done');
                  return (
                    <div
                      key={task.id || idx}
                      draggable={true}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        // Tarayıcının drag ghost görüntüsünü oluşturabilmesi için çok kısa gecikmeyle modalı kapat
                        setTimeout(() => {
                          setHoveredDayTasks(null);
                        }, 20);
                        setDraggingItemId(task.id || null);
                        e.dataTransfer.setData('text/plain', JSON.stringify({
                          id: task.id,
                          date: task.date || hoveredDayTasks.dateStr,
                          itemType: task.itemType
                        }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        setDraggingItemId(null);
                        setDragOverDate(null);
                      }}
                      onClick={() => {
                        onSelectDate(hoveredDayTasks.date);
                        setHoveredDayTasks(null);
                      }}
                      className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-grab active:cursor-grabbing hover:scale-[1.01] select-none ${
                        isDone
                          ? 'bg-stone-50/70 dark:bg-zinc-900/40 border-stone-200/60 dark:border-zinc-800/60 opacity-60'
                          : 'bg-stone-50/90 dark:bg-zinc-800/60 border-stone-200/90 dark:border-zinc-700/80 hover:border-amber-400/60 shadow-xs'
                      }`}
                      title={language === 'tr' ? 'Tarihini değiştirmek için takvime sürükleyebilirsiniz' : 'Drag onto calendar to change date'}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            task.itemType === 'jira' ? 'bg-blue-500' :
                            task.itemType === 'todo' ? 'bg-emerald-500' :
                            task.itemType === 'sport' ? 'bg-orange-500' : 'bg-rose-500'
                          }`} />
                          <span className={`text-xs font-black truncate ${isDone ? 'line-through text-stone-400 dark:text-zinc-500' : 'text-stone-900 dark:text-zinc-100'}`}>
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 pl-4">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0 text-[11px] gap-1">
                        {isDone ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">
                            ✓ {language === 'tr' ? 'Tamamlandı' : 'Done'}
                          </span>
                        ) : (
                          <span className="font-bold text-stone-600 dark:text-zinc-300 bg-stone-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded-md text-[10px]">
                            {task.startTime || '--:--'}
                          </span>
                        )}
                        {task.priority && !isDone && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                            task.priority === 'urgent' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                            task.priority === 'high' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                            'bg-stone-200/50 text-stone-500 dark:text-zinc-400'
                          }`}>
                            {task.priority === 'urgent' ? (language === 'tr' ? 'Acil' : 'Urgent') :
                             task.priority === 'high' ? (language === 'tr' ? 'Yüksek' : 'High') : task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>{language === 'tr' ? 'Sürükleyerek başka bir güne taşıyabilirsiniz' : 'Drag to move to another day'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDate(hoveredDayTasks.date);
                    setHoveredDayTasks(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs transition shadow-xs"
                >
                  {language === 'tr' ? 'Günü Aç' : 'Open Day'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
