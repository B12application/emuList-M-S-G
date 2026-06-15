import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaTag } from 'react-icons/fa';

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 mb-1.5 ml-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3.5 bg-stone-50 dark:bg-zinc-800/50 border rounded-2xl text-stone-900 dark:text-white flex items-center justify-between transition-all duration-300 text-sm font-semibold shadow-sm ${
          isOpen 
            ? 'border-stone-900 dark:border-white ring-4 ring-stone-900/5 dark:ring-white/5' 
            : 'border-stone-200 dark:border-zinc-700 hover:border-stone-400 dark:hover:border-zinc-500'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-2 rounded-xl shrink-0 transition-colors ${isOpen ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'}`}>
            <FaTag className="text-[10px]" />
          </div>
          <span className={`truncate text-left ${value ? '' : 'text-stone-400 dark:text-zinc-500 italic font-medium'}`}>
            {value || placeholder || 'Select...'}
          </span>
        </div>
        <FaChevronDown className={`text-stone-400 text-xs transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute left-0 right-0 top-full mt-2 z-[120] bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-xl"
          >
            {options.length === 0 ? (
              <div className="px-4 py-8 text-xs text-stone-400 dark:text-zinc-500 text-center italic flex flex-col items-center gap-2">
                <FaTag className="opacity-20 text-xl" />
                No options available
              </div>
            ) : (
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all hover:pl-6 flex items-center justify-between group ${
                      value === option 
                        ? 'text-stone-900 dark:text-white bg-stone-50 dark:bg-zinc-800' 
                        : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{option}</span>
                    {value === option && (
                      <motion.div 
                        layoutId="active-dot"
                        className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.2)] dark:shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
