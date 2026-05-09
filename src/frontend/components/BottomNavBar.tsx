// src/components/BottomNavBar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaFilm, FaPlus, FaBars, FaWallet } from 'react-icons/fa';
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
    { to: '/expenses', icon: FaWallet, label: t('nav.expenses') || 'Harcamalar' },
    { to: '#', icon: FaBars, label: 'Menü', isMenu: true },
  ];

  const isCollectionActive = ['/movie', '/series', '/game', '/book', '/my-shows', '/all'].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] md:hidden">
      {/* Container with safe area padding and a bit extra for Android */}
      <div className="relative mx-3 mb-4 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 border border-white/20 dark:border-zinc-800/50" style={{ marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>

        {/* Background - Glassmorphism */}
        <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-2xl" />

        <div className="relative flex items-center justify-around px-2 py-3">
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
                    className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg bg-stone-900 dark:bg-white"
                  >
                    <FaPlus className="text-white dark:text-stone-900 text-sm" />
                  </motion.div>

                  <span
                    className="text-[9px] font-black uppercase tracking-tighter mt-1 text-stone-400"
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
                    className="flex flex-col items-center gap-1"
                    whileTap={{ scale: 0.9 }}
                  >
                    <div className="flex items-center justify-center w-10 h-10">
                      <FaBars className="text-lg text-stone-400 dark:text-zinc-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-stone-400 dark:text-zinc-500">
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
                  className="flex flex-col items-center gap-1"
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-stone-900 dark:bg-white' 
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon className={`text-lg transition-colors duration-300 ${
                        isActive 
                          ? 'text-white dark:text-stone-900' 
                          : 'text-stone-400 dark:text-zinc-500'
                      }`} />
                    </motion.div>

                    {/* ACTIVE DOT REMOVED IN FAVOR OF BUTTON BG */}
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-300 ${
                      isActive ? 'text-stone-900 dark:text-white' : 'text-stone-400 dark:text-zinc-500'
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