import { format, isToday, isTomorrow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import { useShift } from '../../context/ShiftContext';
import { FaSun, FaMoon, FaBed, FaUserShield, FaCog } from 'react-icons/fa';

interface PlannerHeaderProps {
  selectedDate: Date;
  meetingCount: number;
  onEditShifts?: () => void;
}

export default function PlannerHeader({ selectedDate, meetingCount, onEditShifts }: PlannerHeaderProps) {
  const { getShiftInfo } = useShift();
  const shift = getShiftInfo(selectedDate);
  const { language, t } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;
  
  let dateText = format(selectedDate, 'd MMMM yyyy, EEEE', { locale: dateLocale });
  if (isToday(selectedDate)) {
    dateText = language === 'tr' ? `Bugün (${dateText})` : `Today (${dateText})`;
  } else if (isTomorrow(selectedDate)) {
    dateText = language === 'tr' ? `Yarın (${dateText})` : `Tomorrow (${dateText})`;
  }

  // Determine styles and icon based on shift type
  let shiftBg = 'bg-stone-100 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300';
  let Icon = FaBed;
  let summaryText = t('planner.holidayMsg');
  let timeText = '';

  if (shift.type === 'Sabah') {
    shiftBg = 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200';
    Icon = FaSun;
    summaryText = t('planner.morningShift').replace('{day}', shift.dayIndex?.toString() || '');
    timeText = `${shift.startTime} - ${shift.endTime}`;
  } else if (shift.type === 'Akşam') {
    shiftBg = 'bg-indigo-100/50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-200';
    Icon = FaMoon;
    summaryText = t('planner.eveningShift').replace('{day}', shift.dayIndex?.toString() || '');
    timeText = `${shift.startTime} - ${shift.endTime}`;
  } else if (shift.type === 'Nöbet') {
    shiftBg = 'bg-rose-100/50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200';
    Icon = FaUserShield;
    summaryText = language === 'tr' ? 'Nöbet Vardiyası' : 'On-call Shift';
    timeText = `${shift.startTime} - ${shift.endTime}`;
  } else if (shift.type === 'Tatil') {
    shiftBg = 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200';
    summaryText = t('planner.holidayShift').replace('{day}', shift.dayIndex?.toString() || '');
  }

  return (
    <div className={`p-5 rounded-2xl border ${shiftBg} transition-all duration-300 relative overflow-hidden shadow-sm`}>
      {/* Background Icon Watermark */}
      <Icon className="absolute -right-4 -bottom-4 text-7xl opacity-5 transform -rotate-12 pointer-events-none" />
      
      {/* Edit Shifts Button */}
      {onEditShifts && (
        <button
          onClick={onEditShifts}
          className="absolute right-4 top-4 p-2 rounded-xl bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30 border border-current/15 text-current transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 z-20 shadow-sm"
          title={language === 'tr' ? 'Vardiya Ayarları' : 'Shift Settings'}
        >
          <FaCog className="animate-spin-slow text-xs" />
          <span className="hidden sm:inline">{language === 'tr' ? 'Vardiya Düzenle' : 'Edit Shifts'}</span>
        </button>
      )}

      <div className="relative z-10">
        <h2 className="text-sm font-medium opacity-80 mb-1">{dateText}</h2>
        <div className="flex items-center gap-3 pr-28">
          <Icon className="text-xl shrink-0" />
          <h1 className="text-xl md:text-2xl font-bold">{summaryText}</h1>
        </div>
        {timeText && <p className="text-sm mt-1 font-medium opacity-90">{timeText}</p>}
        
        <div className="mt-4 pt-4 border-t border-current/10">
          <p className="text-sm font-semibold">
            {meetingCount > 0 
              ? t('planner.itemsFound').replace('{count}', meetingCount.toString())
              : t('planner.noItems')}
          </p>
        </div>
      </div>
    </div>
  );
}
