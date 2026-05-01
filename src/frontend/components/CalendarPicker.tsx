import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO,
  isValid,
  parse
} from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaTimes } from 'react-icons/fa';

interface CalendarPickerProps {
  selectedDate: string; // ISO yyyy-MM-dd
  onChange: (date: string) => void;
  label?: string;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onChange, label }) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [inputValue, setInputValue] = useState('');
  
  const locale = language === 'tr' ? tr : enUS;
  const dateFormat = language === 'tr' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';

  // Sync internal input value with selectedDate prop
  useEffect(() => {
    try {
      const d = parseISO(selectedDate);
      if (isValid(d)) {
        setInputValue(format(d, dateFormat));
      }
    } catch (e) {}
  }, [selectedDate, dateFormat]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Try to parse the date manually
    try {
      const parsedDate = parse(val, dateFormat, new Date());
      if (isValid(parsedDate)) {
        onChange(format(parsedDate, 'yyyy-MM-dd'));
        setCurrentMonth(parsedDate);
      }
    } catch (e) {
      // Invalid date while typing, don't update state yet
    }
  };

  const days = language === 'tr' 
    ? ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={dateFormat.toLowerCase()}
          className="w-full pl-4 pr-12 py-2.5 bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-2xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all text-sm font-semibold shadow-sm"
        />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
        >
          <FaCalendarAlt className="text-sm" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-[360px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-stone-200 dark:border-zinc-800 p-8"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                <FaTimes />
              </button>

              <div className="flex items-center justify-between mb-8">
                <button 
                  type="button"
                  onClick={prevMonth}
                  className="p-3 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-2xl text-stone-600 dark:text-zinc-400 transition-all"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <div className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-widest">
                  {format(currentMonth, 'MMMM yyyy', { locale })}
                </div>
                <button 
                  type="button"
                  onClick={nextMonth}
                  className="p-3 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-2xl text-stone-600 dark:text-zinc-400 transition-all"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-4">
                {days.map((d) => (
                  <div key={d} className="text-[10px] font-black text-stone-400 dark:text-zinc-600 text-center uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const isSelected = isSameDay(day, parseISO(selectedDate));
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onChange(format(day, 'yyyy-MM-dd'));
                        setIsOpen(false);
                      }}
                      className={`
                        aspect-square flex items-center justify-center rounded-xl text-xs transition-all relative
                        ${isSelected 
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950 font-black shadow-lg scale-110 z-10' 
                          : isCurrentMonth 
                            ? 'text-stone-800 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800' 
                            : 'text-stone-300 dark:text-zinc-700 opacity-40'
                        }
                      `}
                    >
                      <span>{format(day, 'd')}</span>
                      {isTodayDate && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-stone-900 dark:bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange(format(new Date(), 'yyyy-MM-dd'));
                    setCurrentMonth(new Date());
                    setIsOpen(false);
                  }}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl hover:bg-stone-200 transition-all"
                >
                  {language === 'tr' ? 'Bugün' : 'Today'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPicker;
