import { FaSun, FaMoon, FaBed, FaUserShield } from 'react-icons/fa';
import { useShift } from '../../context/ShiftContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ShiftLegend() {
  const { shiftSettings } = useShift();
  const { language } = useLanguage();

  const is3Person = shiftSettings.planMode === '3-person';

  return (
    <div className="flex items-center justify-center gap-3 md:gap-6 mt-4 flex-wrap text-xs sm:text-sm border-t border-stone-200 dark:border-zinc-800 pt-4">
      {is3Person ? (
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-650 border border-amber-200/50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/40 font-bold">
            <FaSun className="text-xs" />
            <span>{language === 'tr' ? 'Sabah (06:30 - 16:30)' : 'Morning (06:30 - 16:30)'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-200/50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900/40 font-bold">
            <FaMoon className="text-xs" />
            <span>{language === 'tr' ? 'Akşam (16:00 - 02:00)' : 'Evening (16:00 - 02:00)'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 font-bold">
            <FaBed className="text-xs" />
            <span>{language === 'tr' ? 'Tatil' : 'Off / Holiday'}</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-650 border border-amber-200/50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/40 font-bold">
            <FaSun className="text-xs" />
            <span>{language === 'tr' ? 'Sabah (09:00 - 17:00)' : 'Morning (09:00 - 17:00)'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-200/50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900/40 font-bold">
            <FaMoon className="text-xs" />
            <span>{language === 'tr' ? 'Akşam (17:00 - 01:00)' : 'Evening (17:00 - 01:00)'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-650 border border-rose-200/50 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/40 font-bold">
            <FaUserShield className="text-xs" />
            <span>{language === 'tr' ? 'Nöbet (14:00 - 02:00)' : 'On-call (14:00 - 02:00)'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 font-bold">
            <FaBed className="text-xs" />
            <span>{language === 'tr' ? 'Tatil' : 'Off / Holiday'}</span>
          </div>
        </>
      )}
    </div>
  );
}
