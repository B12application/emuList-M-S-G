// src/components/BottomNavBar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaFilm, FaPlus, FaWallet, FaBars } from 'react-icons/fa';
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
    { to: '/', icon: FaHome, label: t('nav.home') || 'Ana Sayfa', end: true },
    { to: '/movie', icon: FaFilm, label: t('nav.collection') || 'Koleksiyon' },
    { to: '/create', icon: FaPlus, label: t('actions.create') || 'Ekle', isAction: true },
    { to: '/expenses', icon: FaWallet, label: t('nav.expenses') || 'Harcamalar' },
    { to: '#', icon: FaBars, label: 'Menü', isMenu: true },
  ];

  const isCollectionActive = ['/movie', '/series', '/game', '/book', '/my-shows', '/all'].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <div 
      className="fixed bottom-0 inset-x-0 z-[100] md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-t border-stone-200/80 dark:border-zinc-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-colors duration-200"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      {/* Top subtle golden shimmer line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

      <div className="relative grid grid-cols-5 items-center px-1 pt-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          // CENTER ACTION BUTTON (+ EKLE)
          if (item.isAction) {
            const isActionActive = location.pathname.startsWith('/create');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center py-1 select-none"
              >
                <motion.div
                  className="flex flex-col items-center gap-1"
                  whileTap={{ scale: 0.92 }}
                >
                  <div className="flex items-center justify-center w-11 h-8 rounded-xl bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/25 border border-amber-300">
                    <FaPlus className="text-xs font-black" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tight ${
                    isActionActive ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-zinc-400'
                  }`}>
                    {item.label}
                  </span>
                </motion.div>
              </NavLink>
            );
          }

          // MENU BUTTON
          if (item.isMenu) {
            return (
              <button
                key="menu-trigger"
                onClick={onMenuOpen}
                className="flex flex-col items-center justify-center py-1 select-none"
              >
                <motion.div
                  className="flex flex-col items-center gap-1"
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="flex items-center justify-center w-11 h-8 text-stone-400 dark:text-zinc-500">
                    <FaBars className="text-lg" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-stone-400 dark:text-zinc-500">
                    {item.label}
                  </span>
                </motion.div>
              </button>
            );
          }

          const isMovieTab = item.to === '/movie';
          const isActive = isMovieTab
            ? isCollectionActive
            : item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-col items-center justify-center py-1 select-none"
            >
              <motion.div
                className="flex flex-col items-center gap-1 relative"
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-center justify-center w-11 h-8 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-md' 
                        : 'bg-transparent'
                    }`}
                  >
                    <Icon className={`text-base transition-colors duration-300 ${
                      isActive 
                        ? 'text-white dark:text-stone-950 font-bold' 
                        : 'text-stone-400 dark:text-zinc-500'
                    }`} />
                  </motion.div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase tracking-tight transition-colors duration-300 ${
                    isActive ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-400 dark:text-zinc-500'
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
  );
}