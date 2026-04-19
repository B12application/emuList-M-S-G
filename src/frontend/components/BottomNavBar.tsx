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

  const isCollectionActive = ['/movie', '/series', '/game', '/book', '/my-shows', '/all'].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      <div className="relative mx-3 mb-3 rounded-2xl overflow-hidden shadow-lg shadow-black/10">

        {/* Background */}
        <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/85 backdrop-blur-xl border border-white/30 dark:border-zinc-700/40 rounded-2xl" />

        <div className="relative flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isMovieTab = item.to === '/movie';
            const isActive = isMovieTab
              ? isCollectionActive
              : item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

            // CREATE BUTTON
            if (item.isAction) {
              return (
                <NavLink key={item.to} to={item.to} className="flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-md"
                    style={{
                      backgroundColor: '#573433',
                      boxShadow: '0 6px 18px rgba(87,52,51,0.25)',
                    }}
                  >
                    <FaPlus className="text-white text-sm" />
                  </motion.div>

                  <span
                    className="text-[10px] mt-1"
                    style={{ color: '#5A4D43' }}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            }

            // MENU BUTTON
            if (item.isMenu) {
              return (
                <button
                  key="menu-trigger"
                  onClick={onMenuOpen}
                  className="flex flex-col items-center min-w-[52px]"
                >
                  <motion.div
                    className="flex flex-col items-center gap-0.5"
                    whileTap={{ scale: 0.9 }}
                  >
                    <div className="flex items-center justify-center w-10 h-8">
                      <FaBars className="text-base text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
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
                  className="flex flex-col items-center gap-0.5"
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300"
                      style={{
                        backgroundColor: isActive ? '#F2ECE8' : 'transparent',
                        color: isActive ? '#573433' : undefined,
                      }}
                    >
                      <Icon className="text-base text-zinc-400 dark:text-zinc-500" />
                    </motion.div>

                    {/* ACTIVE DOT */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          key="dot"
                          layoutId="bottomNavDot"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: '#573433' }}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  <span
                    className="text-[10px]"
                    style={{
                      color: isActive ? '#5A4D43' : '',
                    }}
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