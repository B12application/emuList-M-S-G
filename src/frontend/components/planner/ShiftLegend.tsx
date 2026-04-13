import { FaSun, FaMoon, FaBed } from 'react-icons/fa';

export default function ShiftLegend() {
  return (
    <div className="flex items-center justify-center gap-3 md:gap-6 mt-4 flex-wrap text-sm border-t border-stone-200 dark:border-zinc-800 pt-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
        <FaSun className="text-xs" />
        <span className="font-medium">Sabah (06:30 - 16:30)</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
        <FaMoon className="text-xs" />
        <span className="font-medium">Akşam (16:00 - 02:00)</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400">
        <FaBed className="text-xs" />
        <span className="font-medium">Tatil</span>
      </div>
    </div>
  );
}
