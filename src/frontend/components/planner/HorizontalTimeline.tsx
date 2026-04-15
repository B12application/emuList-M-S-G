import { useRef, useEffect } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getShiftInfo } from '../../utils/shiftLogic';

interface HorizontalTimelineProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function HorizontalTimeline({ selectedDate, onSelectDate }: HorizontalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

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
        inline: 'center'
      });
    }
  }, [selectedDate]);

  return (
    <div 
      ref={scrollRef}
      className="w-full overflow-x-auto pb-4 pt-2 hide-scrollbar scroll-smooth"
    >
      <div className="flex gap-2 min-w-max px-2">
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
              className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-2xl border transition-all duration-200 ${
                isSelected 
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-105' 
                  : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-white/80' : 'opacity-70'}`}>
                {format(date, 'EEE', { locale: tr })}
              </span>
              <span className="text-xl font-bold mb-1">
                {format(date, 'd')}
              </span>
              <div className={`w-3 h-3 rounded-full mt-auto ${shiftIndicator} ${isSelected ? 'ring-2 ring-white' : ''}`} title={shift.type} />
            </button>
          );
        })}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
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
