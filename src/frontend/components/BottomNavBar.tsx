// src/components/BottomNavBar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaFilm, FaCalendarAlt, FaPlus, FaBars } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
  isAction?: boolean;
  isMenu?: boolean;
}

interface BottomNavBarProps {
  onMenuOpen?: () => void;
}

export default function BottomNavBar({ onMenuOpen }: BottomNavBarProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return null;

  const navItems: NavItem[] = [
    { to: '/', icon: FaHome, label: t('nav.home'), end: true },
    { to: '/movie', icon: FaFilm, label: t('nav.collection') || 'Koleksiyon' },
    { to: '/create', icon: FaPlus, label: t('actions.create') || 'Ekle', isAction: true },
    { to: '/planner', icon: FaCalendarAlt, label: 'Takvim' },
    { to: '#', icon: FaBars, label: 'Menü', isMenu: true },
  ];

  // Koleksiyon sekmesi — movie/series/game/book herhangi biri aktifse active say
  const isCollectionActive = ['/movie', '/series', '/game', '/book', '/my-shows', '/all'].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      {/* Glassmorphism bar */}
      <div className="relative mx-3 mb-3 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        {/* Blur + background */}
        <div className="absolute inset-0 bg-white/85 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/30 dark:border-zinc-700/40 rounded-2xl" />

        <div className="relative flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            // Özel aktiflik kontrolü: koleksiyon sekmesi için
            const isMovieTab = item.to === '/movie';
            const isActive = isMovieTab
              ? isCollectionActive
              : item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            // Orta "Ekle" butonu — özel stil
            if (item.isAction) {
              return (
                <NavLink key={item.to} to={item.to} className="flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/40"
                  >
                    {/* Shimmer */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.8, ease: 'easeInOut' }}
                    />
                    <FaPlus className="text-white text-sm relative z-10" />
                  </motion.div>
                  <span className="text-[10px] font-medium text-rose-500 dark:text-rose-400 mt-1">
                    {item.label}
                  </span>
                </NavLink>
              );
            }

            // Menü butonu — MobileMenu'yu açar
            if (item.isMenu) {
              return (
                <button
                  key="menu-trigger"
                  onClick={onMenuOpen}
                  className="flex flex-col items-center min-w-[52px]"
                >
                  <motion.div
                    className="relative flex flex-col items-center gap-0.5"
                    whileTap={{ scale: 0.9 }}
                  >
                    <div className="flex items-center justify-center w-10 h-8 rounded-xl bg-transparent">
                      <FaBars className="text-base text-stone-400 dark:text-zinc-500" />
                    </div>
                    <span className="text-[10px] font-medium leading-none text-stone-400 dark:text-zinc-500">
                      {item.label}
                    </span>
                  </motion.div>
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center min-w-[52px]"
              >
                <motion.div
                  className="relative flex flex-col items-center gap-0.5"
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Icon container */}
                  <div className="relative">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-rose-100 dark:bg-rose-900/30'
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon
                        className={`text-base transition-colors duration-300 ${
                          isActive
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-stone-400 dark:text-zinc-500'
                        }`}
                      />
                    </motion.div>

                    {/* Active dot indicator */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          key="dot"
                          layoutId="bottomNavDot"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] font-medium leading-none transition-colors duration-300 ${
                      isActive
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-stone-400 dark:text-zinc-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
