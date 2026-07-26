import { motion } from 'framer-motion';
import { getAttractionCategory } from '../../services/travelService';

interface AttractionPinProps {
  name: string;
  kinds: string;
  isVisited?: boolean;
  isPlanned?: boolean;
  isSelected?: boolean;
  order?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AttractionPin({
  name,
  kinds,
  isVisited = false,
  isPlanned = false,
  isSelected = false,
  order,
  onClick,
  size = 'md',
}: AttractionPinProps) {
  const category = getAttractionCategory(kinds);

  const sizeMap = {
    sm: { pin: 'w-6 h-6', text: 'text-[8px]', dot: 'w-2 h-2' },
    md: { pin: 'w-8 h-8', text: 'text-[10px]', dot: 'w-3 h-3' },
    lg: { pin: 'w-10 h-10', text: 'text-xs', dot: 'w-4 h-4' },
  };

  const s = sizeMap[size];

  const pinColor = isVisited
    ? 'bg-emerald-500 shadow-emerald-500/30'
    : isPlanned
    ? 'bg-sky-500 shadow-sky-500/30'
    : 'bg-red-500 shadow-red-500/30';

  const ringColor = isSelected
    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900'
    : '';

  return (
    <motion.div
      initial={{ scale: 0, y: -20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      whileHover={{ scale: 1.2, zIndex: 50 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="relative group cursor-pointer"
      style={{ zIndex: isSelected ? 40 : 10 }}
    >
      {/* Pin body */}
      <div className={`${s.pin} ${pinColor} ${ringColor} rounded-full flex items-center justify-center shadow-lg relative`}>
        {order !== undefined ? (
          <span className="text-white font-bold" style={{ fontSize: size === 'sm' ? 8 : size === 'md' ? 10 : 12 }}>
            {order}
          </span>
        ) : (
          <span style={{ fontSize: size === 'sm' ? 10 : size === 'md' ? 14 : 18 }}>
            {category.icon}
          </span>
        )}

        {/* Pulse effect for selected */}
        {isSelected && (
          <motion.div
            className={`absolute inset-0 rounded-full ${pinColor} opacity-30`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Visited checkmark */}
        {isVisited && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[8px]">✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Pin tail */}
      <div className="flex justify-center -mt-0.5">
        <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${
          isVisited ? 'border-t-emerald-500' : isPlanned ? 'border-t-sky-500' : 'border-t-red-500'
        }`} />
      </div>

      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
        <div className="bg-zinc-900 dark:bg-zinc-700 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
          {name}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-900 dark:border-t-zinc-700" />
        </div>
      </div>
    </motion.div>
  );
}
