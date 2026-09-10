import { format, isToday, isTomorrow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import { PiSoccerBallFill } from 'react-icons/pi';

interface PlannerHeaderProps {
  selectedDate: Date;
  meetingCount: number;
  onOpenTeamFixtures?: () => void;
}

export default function PlannerHeader({ selectedDate, meetingCount, onOpenTeamFixtures }: PlannerHeaderProps) {
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
      </div>
    </div>
  );
}
