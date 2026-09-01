import { motion } from 'framer-motion';

interface B12LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Color theme variant:
   * - 'current': inherits currentColor (ideal for adaptive text/icon colors)
   * - 'brand': solid iconic amber
   * - 'monochrome': pure black/white depending on system
   */
  variant?: 'current' | 'brand' | 'monochrome';
}

/**
 * B12 Official Brand Identity
 * 
 * Concept: The Monolithic Ligature
 * Architectural synthesis of the letter 'B' with embedded numerals '1' and '2'.
 * Built strictly on reductive modernist principles:
 * - Single-color reproducible vector mark
 * - Zero gradients, zero 3D, zero shadows, zero decorative noise
 * - Optical balance calibrated for 16px favicon through 512px billboard scale
 */
export default function B12Logo({ 
  className = '', 
  size = 'md',
  variant = 'current'
}: B12LogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const getFillClass = () => {
    switch (variant) {
      case 'brand':
        return 'fill-amber-500 dark:fill-amber-400';
      case 'monochrome':
        return 'fill-zinc-950 dark:fill-white';
      case 'current':
      default:
        return 'fill-stone-900 dark:fill-amber-400';
    }
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full transition-colors duration-200 ${getFillClass()}`}
        aria-label="B12 Brand Logo"
      >
        {/* Left Component: The Monolithic '1' (Architectural Stem with 45° Beak Terminal) */}
        <path
          d="M14 28L26 16H36V84H14V28Z"
        />

        {/* Right Component: The Dual-Loop 'B' & Grounded '2' (Compound Path with Optical Counters) */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M44 16H68C80.1503 16 90 25.8497 90 38C90 45.5 86.2 52.1 80.5 56C87.4 60.1 92 67.5 92 76C92 80.4 88.4 84 84 84H44V16ZM58 30H66C70.4183 30 74 33.5817 74 38C74 42.4183 70.4183 46 66 46H58V30ZM58 58H68C72.4183 58 76 61.5817 76 66C76 70.4183 72.4183 74 68 74H58V58Z"
        />
      </svg>
    </motion.div>
  );
}
