import { format, isToday, isTomorrow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import { useShift } from '../../context/ShiftContext';
import { FaSun, FaMoon, FaBed, FaUserShield, FaCog } from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';

interface PlannerHeaderProps {
  selectedDate: Date;
  meetingCount: number;
  onEditShifts?: () => void;
  onOpenTeamFixtures?: () => void;
}

export default function PlannerHeader({ selectedDate, meetingCount, onEditShifts, onOpenTeamFixtures }: PlannerHeaderProps) {
  const { getShiftInfo, shiftSettings } = useShift();
  const shift = getShiftInfo(selectedDate);
  const { language, t } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;
  
  let dateText = format(selectedDate, 'd MMMM yyyy, EEEE', { locale: dateLocale });
  if (isToday(selectedDate)) {
    dateText = language === 'tr' ? `Bugün` : `Today`;
  } else if (isTomorrow(selectedDate)) {
    dateText = language === 'tr' ? `Yarın` : `Tomorrow`;
  }

  const fullDateText = format(selectedDate, 'd MMMM yyyy, EEEE', { locale: dateLocale });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-5 px-1 border-b border-stone-200/80 dark:border-zinc-800 gap-4 mb-6 font-sans">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {isToday(selectedDate) || isTomorrow(selectedDate) ? (
            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg bg-rose-500 text-white tracking-wider shadow-sm shadow-rose-500/10">
              {dateText}
            </span>
          ) : null}
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 tracking-tight">
            {fullDateText}
          </h2>
        </div>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5 font-bold uppercase tracking-wider">
          {meetingCount > 0 
            ? t('planner.itemsFound').replace('{count}', meetingCount.toString())
            : t('planner.noItems')}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {shiftSettings.enableShiftSystem && (
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold shadow-sm ${
            shift.type === 'Sabah' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
            shift.type === 'Akşam' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
            shift.type === 'Nöbet' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            {shift.type === 'Sabah' && <FaSun className="text-amber-500 text-sm" />}
            {shift.type === 'Akşam' && <FaMoon className="text-indigo-500 text-sm" />}
            {shift.type === 'Nöbet' && <FaUserShield className="text-rose-500 text-sm" />}
            {shift.type === 'Tatil' && <FaBed className="text-emerald-500 text-sm" />}
            <span>
              {shift.type === 'Sabah' ? (language === 'tr' ? 'Mesai' : 'Work') : 
               shift.type === 'Akşam' ? (language === 'tr' ? 'Akşam Vardiyası' : 'Evening') :
               shift.type === 'Nöbet' ? (language === 'tr' ? 'Nöbet Vardiyası' : 'On-call') :
               (language === 'tr' ? 'Tatil / İzin' : 'Day Off')}
            </span>
            {shift.startTime && <span className="opacity-60 font-medium">({shift.startTime} - {shift.endTime})</span>}
          </div>
        )}

        {onOpenTeamFixtures && (
          <button
            onClick={onOpenTeamFixtures}
            className="px-3.5 py-2 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-700 dark:text-amber-300 border border-amber-400/30 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-sm cursor-pointer"
            title="Takip edilen takım fikstürlerini seç"
          >
            <PiSoccerBallFill className="text-sm text-amber-500" />
            <span>Takımlar & Fikstür</span>
          </button>
        )}

        {onEditShifts && shiftSettings.enableShiftSystem && (
          <button
            onClick={onEditShifts}
            className="px-3.5 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-800 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-sm cursor-pointer"
          >
            <FaCog className="text-xs" />
            <span>Vardiya Düzenle</span>
          </button>
        )}
      </div>
    </div>
  );
}
