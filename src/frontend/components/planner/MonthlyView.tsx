import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useState, useRef, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useShift } from '../../context/ShiftContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlannerMeeting, CalendarAlert } from '../../../backend/types/planner';
import { FaChevronLeft, FaChevronRight, FaSearch, FaTimes } from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';

interface MonthlyViewProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  meetings: PlannerMeeting[];
  onSelectDate: (date: Date) => void;
  calendarAlerts?: CalendarAlert[];
}

export default function MonthlyView({
  currentMonth,
  onMonthChange,
  meetings,
  onSelectDate,
  calendarAlerts = []
}: MonthlyViewProps) {
  const { getShiftInfo } = useShift();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<'all' | 'superlig' | 'championsleague'>('all');
  const { language, t } = useLanguage();
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
    }[] = [];

    calendarAlerts.forEach(alert => {
      if (dateStr >= alert.startDate && dateStr <= alert.endDate) {
        const isStart = dateStr === alert.startDate;
        const isEnd = dateStr === alert.endDate;
        const colInWeek = dayIndex % 7;
        const isRowStart = isStart || colInWeek === 0;
        const isRowEnd = isEnd || colInWeek === 6;
        results.push({ alert, isStart, isEnd, isRowStart, isRowEnd });
      }
    });

    return results;
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
          : (m.description?.includes('Şampiyonlar') || m.category?.includes('Şampiyonlar') || m.description?.includes('Avrupa') || m.category?.includes('Avrupa'));

      const matchSearch = searchQuery.trim() === ''
        || m.title.toLowerCase().includes(searchQuery.toLowerCase())
        || (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchLeague && matchSearch;
    });
  }, [monthMatches, leagueFilter, searchQuery]);

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
              const shift = getShiftInfo(day);
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayMeetings = meetings.filter(m => {
                if (m.itemType === 'jira') {
                  return m.dueDate === dateStr;
                }
                return m.date === dateStr;
              });
              const dayMatches = dayMeetings.filter(m => m.itemType === 'match');
              const nonMatchMeetings = dayMeetings.filter(m => m.itemType !== 'match');

              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const alertInfos = getAlertInfoForDay(day, idx);

              let cellClass = '';
              let shiftBadge = null;

              if (shift) {
                if (shift.type === 'Sabah') {
                  cellClass = 'border-t-[3px] border-t-amber-400 bg-amber-500/[0.02] dark:bg-amber-500/[0.01]';
                  shiftBadge = (
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 tracking-tight">
                      {language === 'tr' ? 'Sabah' : 'Morning'}
                    </div>
                  );
                } else if (shift.type === 'Akşam') {
                  cellClass = 'border-t-[3px] border-t-indigo-400 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01]';
                  shiftBadge = (
                    <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 tracking-tight">
                      {language === 'tr' ? 'Akşam' : 'Evening'}
                    </div>
                  );
                } else if (shift.type === 'Nöbet') {
                  cellClass = 'border-t-[3px] border-t-rose-400 bg-rose-500/[0.02] dark:bg-rose-500/[0.01]';
                  shiftBadge = (
                    <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 tracking-tight">
                      {language === 'tr' ? 'Nöbet' : 'On-call'}
                    </div>
                  );
                } else if (shift.type === 'Tatil') {
                  cellClass = 'border-t-[3px] border-t-stone-300 dark:border-t-zinc-700 bg-stone-500/[0.01]';
                  shiftBadge = (
                    <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-500 tracking-tight">
                      {language === 'tr' ? 'Tatil' : 'Off'}
                    </div>
                  );
                }
              }

              return (
                <div
                  key={day.toString()}
                  data-date={dateStr}
                  onClick={() => onSelectDate(day)}
                  className={`min-h-[90px] sm:min-h-[130px] p-2 sm:p-2.5 cursor-pointer transition-colors hover:bg-stone-50/80 dark:hover:bg-zinc-900/80 relative group flex flex-col justify-between
                    ${!isCurrentMonth ? 'opacity-30 pointer-events-none bg-stone-50/40 dark:bg-zinc-950/40' : ''}
                    ${cellClass}
                    ${dayMatches.length > 0 && showMatches ? 'bg-amber-400/5 dark:bg-amber-400/[0.03]' : ''}
                  `}
                >
                  {/* Gün Başlığı & Numarası */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-xl text-xs sm:text-sm font-black ${
                        isToday 
                          ? 'bg-amber-400 text-stone-950 shadow-sm' 
                          : 'text-stone-700 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                      }`}>
                        {format(day, dateFormat)}
                      </span>
                    </div>

                    {isCurrentMonth && (
                      <div className="flex flex-col items-end gap-0.5">
                        {shiftBadge}
                        {shift && shift.isOverride && (
                          <span className="text-[10px]" title={language === 'tr' ? 'Manuel Vardiya' : 'Manual Override'}>
                            ⚙️
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ─── MAÇ KARTLARI (UZAKTAN BAKILDIĞINDA ANLAŞILIR VE BELİRGİN) ─── */}
                  {dayMatches.length > 0 && (
                    <div className="my-1 space-y-1">
                      {dayMatches.map((m, i) => (
                        <div
                          key={m.id || `match-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMatches(true);
                            onSelectDate(day);
                          }}
                          className="p-1 sm:p-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 dark:bg-amber-400/15 dark:hover:bg-amber-400/25 border border-amber-400/40 dark:border-amber-400/30 transition-all shadow-xs group/pill"
                          title={`${m.title} (${m.description}) - ${m.startTime}`}
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
                            {m.startTime && m.startTime !== 'TBD' && m.startTime !== '--:--' ? (
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

                  {/* Masaüstü Görünüm İçin Normal Etkinlikler */}
                  <div className="hidden sm:block space-y-0.5 mt-auto">
                    {nonMatchMeetings.slice(0, 2).map((m, i) => {
                      const mDateTime = new Date(`${m.date}T${m.startTime}`);
                      const isPast = mDateTime < now;

                      return (
                        <div
                          key={m.id || i}
                          className={`text-[10px] truncate px-1.5 py-[2px] rounded-lg font-bold border-l-[3px] transition-all bg-stone-100/70 dark:bg-zinc-800/40 ${
                            isPast ? 'opacity-40 grayscale-[0.5]' : ''
                          } ${
                            m.itemType === 'jira' ? 'border-l-blue-500 text-stone-700 dark:text-zinc-300' :
                            m.itemType === 'todo' ? 'border-l-emerald-500 text-stone-700 dark:text-zinc-300' :
                            m.itemType === 'sport' ? 'border-l-orange-500 text-stone-700 dark:text-zinc-300' :
                            'border-l-rose-500 text-stone-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="opacity-60 mr-1">{m.startTime}</span>{m.title}
                        </div>
                      );
                    })}
                    {nonMatchMeetings.length > 2 && (
                      <div className="text-[9px] text-stone-500 dark:text-zinc-400 font-bold px-1">
                        +{nonMatchMeetings.length - 2} {t('planner.more')}
                      </div>
                    )}
                  </div>

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

                  {/* ─── CALENDAR ALERT BARS ─── */}
                  {alertInfos.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none hidden sm:block">
                      {alertInfos.map((info, aIdx) => (
                        <div
                          key={`${info.alert.id}-${aIdx}`}
                          className="relative"
                          style={{ marginBottom: aIdx * 14 }}
                        >
                          <div
                            className="h-[3px] absolute bottom-1"
                            style={{
                              backgroundColor: info.alert.color || '#ef4444',
                              left: info.isRowStart ? '4px' : '-1px',
                              right: info.isRowEnd ? '4px' : '-1px',
                              borderRadius: `${info.isStart ? '4px' : '0'} ${info.isEnd ? '4px' : '0'} ${info.isEnd ? '4px' : '0'} ${info.isStart ? '4px' : '0'}`,
                              opacity: 0.8,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
                            {match.startTime && match.startTime !== 'TBD' && match.startTime !== '--:--' ? (
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
                        {match.startTime && match.startTime !== 'TBD' && match.startTime !== '--:--' ? (
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
    </div>
  );
}
