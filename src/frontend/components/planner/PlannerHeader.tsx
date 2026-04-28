import { format, isToday, isTomorrow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import { getShiftInfo } from '../../utils/shiftLogic';
import { FaSun, FaMoon, FaBed } from 'react-icons/fa';

interface PlannerHeaderProps {
  selectedDate: Date;
  meetingCount: number;
}

export default function PlannerHeader({ selectedDate, meetingCount }: PlannerHeaderProps) {
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
  } else if (shift.type === 'Tatil') {
    shiftBg = 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200';
    summaryText = t('planner.holidayShift').replace('{day}', shift.dayIndex?.toString() || '');
  }

  return (
    <div className={`p-5 rounded-2xl border ${shiftBg} transition-all duration-300 relative overflow-hidden shadow-sm`}>
      {/* Background Icon Watermark */}
      <Icon className="absolute -right-4 -bottom-4 text-7xl opacity-5 transform -rotate-12" />
      
      <div className="relative z-10">
        <h2 className="text-sm font-medium opacity-80 mb-1">{dateText}</h2>
        <div className="flex items-center gap-3">
          <Icon className="text-xl" />
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
