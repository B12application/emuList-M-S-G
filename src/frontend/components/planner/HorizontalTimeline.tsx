import { useRef, useEffect } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import { getShiftInfo } from '../../utils/shiftLogic';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface HorizontalTimelineProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function HorizontalTimeline({ selectedDate, onSelectDate }: HorizontalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const { language } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;

  // Generate 15 days around the selected date (7 before, 1 after? Or just 15 days starting from today - 3)
  const today = new Date();

  // We'll show a window of 45 days
  const startDate = addDays(today, -10);
  const days = Array.from({ length: 90 }).map((_, i) => addDays(startDate, i));

  // Sayda açıldığında veya tarih değiştiğinde aktif öğeye kaydır
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center' // Use center for better focus
      });
    }
  }, [selectedDate]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 200 : scrollLeft + 200;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {/* Navigation Buttons - Only visible or prominent on hover/active but let's keep them accessible */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md 
                   border border-stone-200 dark:border-zinc-700 rounded-full shadow-lg text-stone-600 dark:text-zinc-400
                   hover:text-rose-500 dark:hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 md:opacity-100 -left-2"
      >
        <FaChevronLeft size={12} />
      </button>

      <div
        ref={scrollRef}
        className="w-full overflow-x-auto pb-4 pt-2 hide-scrollbar scroll-smooth"
      >
        <div className="flex gap-2 min-w-max px-6">
          {days.map((date, idx) => {
            const shift = getShiftInfo(date);
            const isSelected = isSameDay(date, selectedDate);

            let shiftIndicator = 'bg-stone-300 dark:bg-zinc-600'; // Tatil
            if (shift.type === 'Sabah') shiftIndicator = 'bg-amber-400';
            if (shift.type === 'Akşam') shiftIndicator = 'bg-indigo-500';

            return (
              <button
                key={idx}
                ref={isSelected ? activeRef : null}
                onClick={() => onSelectDate(date)}
                className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-2xl border transition-all duration-200 ${isSelected
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-105'
                  : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-white/80' : 'opacity-70'}`}>
                  {format(date, 'EEE', { locale: dateLocale })}
                </span>
                <span className="text-xl font-bold mb-1">
                  {format(date, 'd')}
                </span>
                <div className={`w-3 h-3 rounded-full mt-auto ${shiftIndicator} ${isSelected ? 'ring-2 ring-white' : ''}`} title={shift.type} />
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md 
                   border border-stone-200 dark:border-zinc-700 rounded-full shadow-lg text-stone-600 dark:text-zinc-400
                   hover:text-rose-500 dark:hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 md:opacity-100 -right-2"
      >
        <FaChevronRight size={12} />
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
