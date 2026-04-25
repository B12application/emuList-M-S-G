// src/components/Header.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaSignOutAlt, FaFilm, FaTv, FaGamepad, FaBook, FaChevronDown, FaUsersCog, FaPlus, FaCalendarPlus, FaCoffee } from 'react-icons/fa';
import B12Logo from './B12Logo';
import QuickAddModal from './planner/QuickAddModal';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import useUserProfile from '../hooks/useUserProfile';
import { isAdmin } from '../../backend/config/adminConfig';
import { getShiftInfo } from '../utils/shiftLogic';

interface NavLinkRenderProps {
  isActive: boolean;
  isPending: boolean;
}

const getNavCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "relative px-5 py-2.5 text-sm font-bold text-stone-900 dark:text-white bg-stone-100 dark:bg-zinc-800/80 rounded-full transition-all duration-300 shadow-sm border border-stone-200/50 dark:border-zinc-700/50"
    : "relative px-5 py-2.5 text-sm font-semibold text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition-colors duration-300 hover:bg-stone-50 dark:hover:bg-zinc-800/40 rounded-full border border-transparent";
};


interface HeaderProps {
  onMobileMenuOpen?: () => void;
}

export default function Header({ }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [showListsDropdown, setShowListsDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const listsDropdownRef = useRef<HTMLDivElement | null>(null);
  const addDropdownRef = useRef<HTMLDivElement | null>(null);
  const todayShift = getShiftInfo(new Date(), true);

  // Gender-based avatar URLs
  const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
  const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

  // Get avatar based on gender
  const getAvatar = () => {
    if (user?.photoURL &&
      user.photoURL !== MALE_AVATAR_URL &&
      user.photoURL !== FEMALE_AVATAR_URL) {
      return user.photoURL;
    }
    if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
    if (profile?.gender === 'male') return MALE_AVATAR_URL;
    return MALE_AVATAR_URL;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (listsDropdownRef.current && !listsDropdownRef.current.contains(target)) {
        setShowListsDropdown(false);
      }
      if (addDropdownRef.current && !addDropdownRef.current.contains(target)) {
        setShowAddDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getListTitle = () => {
    if (location.pathname.startsWith('/movie')) return t('nav.movies');
    if (location.pathname.startsWith('/series')) return t('nav.series');
    if (location.pathname.startsWith('/game')) return t('nav.games');
    if (location.pathname.startsWith('/book')) return t('nav.books');
    return t('nav.collection');
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`pointer-events-auto w-full max-w-7xl backdrop-blur-2xl bg-white/70 dark:bg-zinc-950/70 border border-stone-200/50 dark:border-zinc-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}
        >
          <div className="relative px-6 md:px-8 flex items-center justify-between">

            {/* --- LEFT SECTION: Logo --- */}
            <div className="shrink-0 flex items-center justify-start z-10 transition-transform duration-300 hover:scale-105">
              <Link to="/" className="flex items-center">
                <div className="hidden sm:block">
                  <B12Logo size="md" />
                </div>
                <div className="sm:hidden">
                  <B12Logo size="sm" />
                </div>
              </Link>
            </div>

            {/* --- CENTER SECTION: Navigation --- */}
            <div className="pointer-events-none flex-1 flex items-center justify-start ml-16 md:ml-24 lg:ml-62 overflow-visible">              {user && (
                <nav className="pointer-events-auto hidden md:flex items-center gap-2 overflow-visible">
                  <NavLink to="/" end className={getNavCls}>{t('nav.home')}</NavLink>

                  <div
                    ref={listsDropdownRef}
                    className="relative group"
                    onMouseEnter={() => setShowListsDropdown(true)}
                    onMouseLeave={() => setShowListsDropdown(false)}
                  >
                    <button
                      onClick={() => setShowListsDropdown((prev) => !prev)}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 border border-transparent ${['/movie', '/series', '/game', '/book'].some(path => location.pathname.startsWith(path))
                        ? "text-stone-900 dark:text-white bg-stone-100 dark:bg-zinc-800/80 shadow-sm border-stone-200/50 dark:border-zinc-700/50"
                        : "text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-zinc-800/40"
                        }`}
                    >
                      <span>{getListTitle()}</span>
                      <motion.div
                        animate={{ rotate: showListsDropdown ? 180 : 0 }}
                        className="flex items-center justify-center"
                      >
                        <FaChevronDown className="w-2.5 h-2.5" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showListsDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full mt-2 w-56 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 origin-top left-1/2 -translate-x-1/2"
                        >
                          <div className="flex flex-col">
                            <NavLink to="/my-shows" className={({ isActive }) => `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isActive ? 'bg-stone-50 dark:bg-zinc-800/50 text-stone-900 dark:text-white font-bold' : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'}`}>
                              <FaTv className="text-sm opacity-70" />
                              {t('myShows.title')}
                            </NavLink>
                            <div className="h-px bg-stone-100 dark:bg-zinc-800 my-1 mx-3" />
                            <NavLink to="/movie" className={({ isActive }) => `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isActive ? 'bg-stone-50 dark:bg-zinc-800/50 text-stone-900 dark:text-white font-bold' : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'}`}>
                              <FaFilm className="text-sm opacity-70" />
                              {t('nav.movies')}
                            </NavLink>
                            <NavLink to="/series" className={({ isActive }) => `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isActive ? 'bg-stone-50 dark:bg-zinc-800/50 text-stone-900 dark:text-white font-bold' : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'}`}>
                              <FaTv className="text-sm opacity-70" />
                              {t('nav.series')}
                            </NavLink>
                            <NavLink to="/game" className={({ isActive }) => `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isActive ? 'bg-stone-50 dark:bg-zinc-800/50 text-stone-900 dark:text-white font-bold' : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'}`}>
                              <FaGamepad className="text-sm opacity-70" />
                              {t('nav.games')}
                            </NavLink>
                            <NavLink to="/book" className={({ isActive }) => `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isActive ? 'bg-stone-50 dark:bg-zinc-800/50 text-stone-900 dark:text-white font-bold' : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'}`}>
                              <FaBook className="text-sm opacity-70" />
                              {t('nav.books')}
                            </NavLink>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <NavLink to="/planner" className={getNavCls}>{t('nav.calendar')}</NavLink>
                  <NavLink to="/feed" className={getNavCls}>{t('nav.feed')}</NavLink>
                </nav>
              )}
            </div>

            {/* --- RIGHT SECTION: Actions & Profile --- */}
            <div className="shrink-0 flex items-center justify-end gap-3 sm:gap-4 overflow-visible">

              {/* Theme & Language & Notifications */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-full border border-stone-200/50 dark:border-zinc-700/50 shadow-inner">
                {user && (
                  <div
                    className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${todayShift.type === 'Sabah'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                      : todayShift.type === 'Akşam'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                      }`}
                    title={todayShift.type === 'Tatil' ? 'Tatil Günü' : `${todayShift.type} Vardiyası`}
                  >
                    {todayShift.type === 'Sabah' && <FaSun className="w-3.5 h-3.5" />}
                    {todayShift.type === 'Akşam' && <FaMoon className="w-3.5 h-3.5" />}
                    {todayShift.type === 'Tatil' && <FaCoffee className="w-3.5 h-3.5" />}
                    <span>{todayShift.type === 'Tatil' ? 'Tatil' : todayShift.type}</span>
                  </div>
                )}

                {user && (
                  <div
                    ref={addDropdownRef}
                    className="relative group"
                    onMouseEnter={() => setShowAddDropdown(true)}
                    onMouseLeave={() => setShowAddDropdown(false)}
                  >
                    <button
                      onClick={() => setShowAddDropdown((prev) => !prev)}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-stone-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm"
                    >
                      <FaPlus className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showAddDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full right-0 md:-right-12 mt-2 w-56 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 origin-top-right"
                        >
                          <div className="flex flex-col">
                            <Link 
                              to="/create" 
                              className="flex items-center gap-3 px-5 py-2.5 text-sm text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium transition-colors"
                              onClick={() => setShowAddDropdown(false)}
                            >
                              <FaPlus className="text-sm opacity-70" />
                              {t('create.title')}
                            </Link>
                            <button 
                              onClick={() => {
                                setShowAddDropdown(false);
                                setIsQuickAddOpen(true);
                              }}
                              className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium transition-colors text-left"
                            >
                              <FaCalendarPlus className="text-sm opacity-70" />
                              {t('actions.addNew')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <NotificationDropdown />

                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-stone-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm"
                >
                  {isDark ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold text-stone-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm"
                >
                  {language === 'tr' ? 'EN' : 'TR'}
                </button>
              </div>

              {/* Profile */}
              {user && (
                <div className="relative group shrink-0">
                  <Link
                    to="/profile"
                    className="group relative flex items-center justify-center p-1 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shadow-sm z-10 relative ring-2 transition-all ${location.pathname === '/profile' ? 'ring-stone-900 dark:ring-white ring-offset-2 dark:ring-offset-zinc-950' :
                      location.pathname === '/stats' ? 'ring-stone-400 dark:ring-zinc-500' :
                        location.pathname.startsWith('/lists') ? 'ring-stone-400 dark:ring-zinc-500' :
                          location.pathname === '/settings' ? 'ring-stone-400 dark:ring-zinc-500' :
                            'ring-stone-200 dark:ring-zinc-700'
                      }`}>
                      <img
                        src={getAvatar()}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {['/profile', '/stats', '/settings'].includes(location.pathname) || location.pathname.startsWith('/lists') ? (
                      <span className={`absolute -bottom-0 -right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950 ${location.pathname === '/profile' ? 'bg-stone-900 dark:bg-white' : 'bg-stone-400 dark:bg-zinc-500'}`} />
                    ) : null}
                  </Link>

                  {/* User Hover Menu */}
                  <div className="absolute top-full right-0 mt-2 w-56 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50">
                    <div className="px-5 py-3 border-b border-stone-100 dark:border-zinc-800 mb-1">
                      <span className="block text-sm font-bold text-stone-900 dark:text-white truncate">
                        {user.displayName || 'Kullanıcı'}
                      </span>
                      <span className="block text-xs text-stone-500 dark:text-zinc-400 truncate mt-0.5">
                        {user.email}
                      </span>
                    </div>

                    {[
                      { to: '/profile', label: t('nav.myProfile'), icon: 'bg-stone-800 dark:bg-white' },
                      { to: '/stats', label: t('home.stats'), icon: 'bg-stone-500' },
                      { to: '/lists', label: t('lists.title'), icon: 'bg-stone-500' },
                      { to: '/map', label: t('nav.map'), icon: 'bg-stone-500' },
                      { to: '/settings', label: t('nav.settings'), icon: 'bg-stone-500' }
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${location.pathname.startsWith(item.to)
                          ? 'bg-stone-50 dark:bg-zinc-800/50 text-stone-900 dark:text-white font-bold'
                          : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${item.icon}`}></div>
                        {item.label}
                      </Link>
                    ))}

                    {isAdmin(user.uid) && (
                      <Link
                        to="/admin"
                        className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors mt-1 border-t border-stone-100 dark:border-zinc-800 pt-3 ${location.pathname === '/admin'
                          ? 'bg-stone-100 dark:bg-zinc-800/80 text-stone-900 dark:text-white font-bold'
                          : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'
                          }`}
                      >
                        <FaUsersCog className="text-sm" />
                        {t('nav.adminPanel')}
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors text-left font-medium"
                    >
                      <FaSignOutAlt className="text-sm" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </motion.header>
      </div>
      
      {isQuickAddOpen && (
        <QuickAddModal 
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          selectedDate={new Date()}
          onAdded={() => setIsQuickAddOpen(false)}
        />
      )}
    </>
  );
}
