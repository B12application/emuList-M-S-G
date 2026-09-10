// src/components/Header.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaSignOutAlt, FaFilm, FaTv, FaGamepad, FaBook, FaChevronDown, FaUsersCog, FaPlus, FaCalendarPlus, FaCoffee, FaUserShield, FaCompass, FaHome, FaWallet, FaCalendarAlt, FaLayerGroup, FaStickyNote, FaFire, FaTools, FaChartPie, FaUser, FaCog, FaListUl, FaMap, FaHistory, FaHeartbeat } from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';
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
import { useShift } from '../context/ShiftContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

interface NavLinkRenderProps {
  isActive: boolean;
  isPending: boolean;
}

const getNavCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "relative px-5 py-2.5 text-sm font-black text-stone-950 bg-amber-400 dark:bg-amber-400 rounded-full transition-all duration-300 shadow-md shadow-amber-500/25 border border-amber-300 dark:border-amber-300 scale-105 cursor-pointer"
    : "relative px-5 py-2.5 text-sm font-bold text-stone-600 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-300 hover:bg-amber-400/10 rounded-full border border-transparent cursor-pointer";
};

interface HeaderProps {
  onMobileMenuOpen?: () => void;
}

export default function Header({ onMobileMenuOpen: _onMobileMenuOpen }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [showListsDropdown, setShowListsDropdown] = useState(false);
  const [showAgendaDropdown, setShowAgendaDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const listsDropdownRef = useRef<HTMLDivElement | null>(null);
  const agendaDropdownRef = useRef<HTMLDivElement | null>(null);
  const toolsDropdownRef = useRef<HTMLDivElement | null>(null);
  const addDropdownRef = useRef<HTMLDivElement | null>(null);
  const { getShiftInfo } = useShift();
  const { hasAccess } = useFeatureAccess();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayShift = getShiftInfo(currentTime, true);

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
      if (agendaDropdownRef.current && !agendaDropdownRef.current.contains(target)) {
        setShowAgendaDropdown(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(target)) {
        setShowToolsDropdown(false);
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
      <div className="fixed top-0 inset-x-0 z-50 hidden md:flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`pointer-events-auto w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] backdrop-blur-2xl bg-white/80 dark:bg-zinc-950/80 border border-amber-400/30 dark:border-amber-500/20 shadow-[0_8px_30px_rgba(251,191,36,0.12)] dark:shadow-[0_8px_30px_rgba(251,191,36,0.08)] rounded-3xl transition-all duration-300 hidden md:block ${scrolled ? 'py-2.5 sm:py-3' : 'py-3.5 sm:py-4'}`}
        >
          <div className="relative px-4 sm:px-6 md:px-8 2xl:px-10 flex items-center justify-between">

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
            <div className="pointer-events-none flex-1 flex items-center justify-center px-4 overflow-visible">
              {user && (
              <nav className="pointer-events-auto hidden md:flex items-center gap-2 overflow-visible">
                <NavLink to="/" end className={getNavCls}>
                  <span className="flex items-center gap-1.5"><FaHome className="text-xs opacity-80" />{t('nav.home')}</span>
                </NavLink>

                <div
                  ref={listsDropdownRef}
                  className="relative group"
                  onMouseEnter={() => setShowListsDropdown(true)}
                  onMouseLeave={() => setShowListsDropdown(false)}
                >
                  <button
                    onClick={() => setShowListsDropdown((prev) => !prev)}
                    className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 border ${['/movie', '/series', '/game', '/book'].some(path => location.pathname.startsWith(path))
                      ? "text-stone-950 bg-amber-400 font-black shadow-md shadow-amber-500/25 border-amber-300 scale-105"
                      : "text-stone-600 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-400/10 border-transparent"
                      }`}
                  >
                    <span className="flex items-center gap-1.5"><FaLayerGroup className="text-xs opacity-80" />{getListTitle()}</span>
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
                        className="absolute top-full mt-2 w-64 p-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 origin-top left-1/2 -translate-x-1/2"
                      >
                        <div className="flex flex-col gap-0.5">
                          <NavLink
                            to="/my-shows"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                              <FaTv className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('myShows.title') || 'İzlediklerim'}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.myShowsSub') || 'İzlenen dizi ve bölümler'}
                              </div>
                            </div>
                          </NavLink>

                          <div className="h-px bg-stone-100 dark:bg-zinc-800 my-0.5 mx-2" />

                          <NavLink
                            to="/movie"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                              <FaFilm className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('nav.movies')}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.moviesSub') || 'İzlenenler ve vizyon'}
                              </div>
                            </div>
                          </NavLink>

                          <NavLink
                            to="/series"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                              <FaTv className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('nav.series')}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.seriesSub') || 'Sezon ve bölüm takibi'}
                              </div>
                            </div>
                          </NavLink>

                          <NavLink
                            to="/game"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <FaGamepad className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('nav.games')}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.gamesSub') || 'Oynananlar ve puanlar'}
                              </div>
                            </div>
                          </NavLink>

                          <NavLink
                            to="/book"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <FaBook className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('nav.books')}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.booksSub') || 'Okunanlar ve hedefler'}
                              </div>
                            </div>
                          </NavLink>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ajanda (Takvim & Notlar) Dropdown */}
                <div
                  ref={agendaDropdownRef}
                  className="relative group"
                  onMouseEnter={() => setShowAgendaDropdown(true)}
                  onMouseLeave={() => setShowAgendaDropdown(false)}
                >
                  <button
                    onClick={() => setShowAgendaDropdown((prev) => !prev)}
                    className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 border ${['/planner', '/notes'].some(path => location.pathname.startsWith(path))
                      ? "text-stone-950 bg-amber-400 font-black shadow-md shadow-amber-500/25 border-amber-300 scale-105"
                      : "text-stone-600 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-400/10 border-transparent"
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-xs opacity-80" />
                      {location.pathname.startsWith('/notes') ? (t('nav.notes') || 'Notlarım') : (t('nav.calendar') || 'Ajanda')}
                    </span>
                    <motion.div
                      animate={{ rotate: showAgendaDropdown ? 180 : 0 }}
                      className="flex items-center justify-center"
                    >
                      <FaChevronDown className="w-2.5 h-2.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showAgendaDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full mt-2 w-64 p-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 origin-top left-1/2 -translate-x-1/2"
                      >
                        <div className="flex flex-col gap-0.5">
                          <NavLink
                            to="/planner"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <FaCalendarAlt className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('nav.calendar') || 'Takvim & Planlayıcı'}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.calendarSub') || 'Aylık, haftalık ajanda'}
                              </div>
                            </div>
                          </NavLink>

                          <NavLink
                            to="/notes"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                              <FaStickyNote className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('nav.notes') || 'Notlarım'}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.notesSub') || 'Klasörler & zengin notlar'}
                              </div>
                            </div>
                          </NavLink>

                          <div className="h-px bg-stone-100 dark:bg-zinc-800 my-0.5 mx-2" />

                          <NavLink
                            to="/planner?fixtures=true"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                              <PiSoccerBallFill className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                Takımlar & Fikstür
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.fixturesSub') || 'Süper Lig & Avrupa maçları'}
                              </div>
                            </div>
                          </NavLink>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <NavLink to="/expenses" className={getNavCls}>
                  <span className="flex items-center gap-1.5"><FaWallet className="text-xs opacity-80" />{t('expenses.title')}</span>
                </NavLink>

                {/* Araçlar & Yaşam Dropdown */}
                <div
                  ref={toolsDropdownRef}
                  className="relative group"
                  onMouseEnter={() => setShowToolsDropdown(true)}
                  onMouseLeave={() => setShowToolsDropdown(false)}
                >
                  <button
                    onClick={() => setShowToolsDropdown((prev) => !prev)}
                    className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 border ${['/travel-planner', '/calorie-details', '/calorie-chat', '/body-profile'].some(path => location.pathname.startsWith(path))
                      ? "text-stone-950 bg-amber-400 font-black shadow-md shadow-amber-500/25 border-amber-300 scale-105"
                      : "text-stone-600 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-400/10 border-transparent"
                      }`}
                  >
                    <span className="flex items-center gap-1.5"><FaTools className="text-xs opacity-80" />Araçlar</span>
                    <motion.div
                      animate={{ rotate: showToolsDropdown ? 180 : 0 }}
                      className="flex items-center justify-center"
                    >
                      <FaChevronDown className="w-2.5 h-2.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showToolsDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full mt-2 w-64 p-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 origin-top left-1/2 -translate-x-1/2"
                      >
                        <div className="flex flex-col gap-0.5">
                          <NavLink
                            to="/travel-planner"
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isActive
                                  ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                              }`
                            }
                          >
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <FaCompass className="text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                {t('nav.travelPlanner')}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                {t('nav.travelPlannerSub') || 'Rotalar & seyahat listesi'}
                              </div>
                            </div>
                          </NavLink>

                          {hasAccess('calorieAi') && (
                            <NavLink
                              to="/calorie-details"
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                  isActive
                                    ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                                }`
                              }
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <FaChartPie className="text-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                    Kalori Raporu
                                  </span>
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-600 dark:text-amber-300">
                                    Yeni
                                  </span>
                                </div>
                                <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                  {t('nav.calorieSub') || 'Günlük besin ve kalori'}
                                </div>
                              </div>
                            </NavLink>
                          )}

                          {hasAccess('calorieAi') && (
                            <NavLink
                              to="/body-profile"
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                  isActive
                                    ? 'bg-amber-500/15 text-stone-900 dark:text-white font-bold'
                                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium'
                                }`
                              }
                            >
                              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <FaHeartbeat className="text-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                  Beden Profili
                                </div>
                                <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                  {t('nav.bodySub') || 'Vücut ölçüleri ve analiz'}
                                </div>
                              </div>
                            </NavLink>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>
            )}
            </div>

            {/* --- RIGHT SECTION: Actions & Profile --- */}
            <div className="shrink-0 flex items-center justify-end gap-3 sm:gap-4 overflow-visible">

              {/* Theme & Language & Notifications */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-full border border-stone-200/50 dark:border-zinc-700/50 shadow-inner">

                {user && (
                  <div
                    ref={addDropdownRef}
                    className="relative group"
                    onMouseEnter={() => setShowAddDropdown(true)}
                    onMouseLeave={() => setShowAddDropdown(false)}
                  >
                    <button
                      onClick={() => setShowAddDropdown((prev) => !prev)}
                      className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full text-stone-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm"
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
                          className="absolute top-full right-0 md:-right-6 mt-2 w-64 p-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 origin-top-right"
                        >
                          <div className="flex flex-col gap-0.5">
                            <Link
                              to="/create"
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium transition-colors"
                              onClick={() => setShowAddDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <FaPlus className="text-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                  {t('create.title')}
                                </div>
                                <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                  {t('nav.createSub') || 'Yeni medya kaydı ekle'}
                                </div>
                              </div>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setShowAddDropdown(false);
                                setIsQuickAddOpen(true);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-medium transition-colors text-left cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                <FaCalendarPlus className="text-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight truncate">
                                  {t('actions.addNew')}
                                </div>
                                <div className="text-[10px] text-stone-400 dark:text-zinc-400 font-normal truncate">
                                  {t('nav.quickEventSub') || 'Ajandaya plan ekle'}
                                </div>
                              </div>
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
                  className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full text-stone-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm"
                >
                  {isDark ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                  className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold text-stone-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm"
                >
                  {language === 'tr' ? 'EN' : 'TR'}
                </button>
              </div>

              {/* Profile */}
              {user && (
                <div className="relative group shrink-0">
                  <Link
                    to="/profile"
                    className="cursor-pointer group relative flex items-center justify-center p-1 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shadow-sm z-10 relative ring-2 transition-all ${location.pathname === '/profile' ? 'ring-amber-500 ring-offset-2 dark:ring-offset-zinc-950' :
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
                      <span className={`absolute -bottom-0 -right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950 ${location.pathname === '/profile' ? 'bg-amber-500' : 'bg-stone-400 dark:bg-zinc-500'}`} />
                    ) : null}
                  </Link>

                  {/* User Hover Menu (Redesigned & Organized) */}
                  <div className="absolute top-full right-0 mt-2.5 w-72 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-stone-200/80 dark:border-zinc-800/80 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50 overflow-hidden">
                    {/* User Card Header */}
                    <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent dark:from-amber-500/5 border-b border-stone-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 shadow-sm">
                          <img src={getAvatar()} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="block text-sm font-black text-stone-900 dark:text-white truncate">
                              {profile?.displayName || user.displayName || 'Kullanıcı'}
                            </span>
                            {isAdmin(user.uid) && (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-stone-950 shrink-0">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="block text-xs text-stone-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Group 1: Hesap & Analiz */}
                    <div className="px-2 py-1.5">
                      <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                        Hesap & Analiz
                      </div>
                      <Link
                        to="/profile"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname === '/profile' ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 font-medium'}`}
                      >
                        <FaUser className="text-xs opacity-70" />
                        <span>{t('nav.myProfile') || 'Profilim'}</span>
                      </Link>
                      <Link
                        to="/stats"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname === '/stats' ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 font-medium'}`}
                      >
                        <FaChartPie className="text-xs opacity-70" />
                        <span>{t('home.stats') || 'İstatistikler'}</span>
                      </Link>
                      <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname === '/settings' ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 font-medium'}`}
                      >
                        <FaCog className="text-xs opacity-70" />
                        <span>{t('nav.settings') || 'Ayarlar'}</span>
                      </Link>
                    </div>

                    {/* Group 2: Koleksiyon & Keşif */}
                    <div className="px-2 py-1.5 border-t border-stone-100 dark:border-zinc-800/80">
                      <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                        Koleksiyon & Keşif
                      </div>
                      <Link
                        to="/lists"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname.startsWith('/lists') ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 font-medium'}`}
                      >
                        <FaListUl className="text-xs opacity-70" />
                        <span>{t('lists.title') || 'Listelerim'}</span>
                      </Link>
                      <Link
                        to="/map"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname.startsWith('/map') ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 font-medium'}`}
                      >
                        <FaMap className="text-xs opacity-70" />
                        <span>{t('nav.map') || 'Ziyaret Haritası'}</span>
                      </Link>
                      <Link
                        to="/feed"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname.startsWith('/feed') ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 font-medium'}`}
                      >
                        <FaHistory className="text-xs opacity-70" />
                        <span>{t('nav.feed') || 'Aktiviteler'}</span>
                      </Link>
                      <Link
                        to="/wrapped"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname.startsWith('/wrapped') ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 font-medium'}`}
                      >
                        <FaFire className="text-xs text-rose-500" />
                        <span>B12 Wrapped</span>
                        <span className="ml-auto text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">Özet</span>
                      </Link>
                    </div>

                    {/* Admin Panel Link */}
                    {isAdmin(user.uid) && (
                      <div className="px-2 py-1.5 border-t border-stone-100 dark:border-zinc-800/80">
                        <Link
                          to="/admin"
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${location.pathname === '/admin' ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 font-bold'}`}
                        >
                          <FaUsersCog className="text-xs text-amber-500" />
                          <span>{t('nav.adminPanel') || 'Admin Paneli'}</span>
                        </Link>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="p-2 border-t border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/40">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold transition-colors text-left"
                      >
                        <FaSignOutAlt className="text-xs" />
                        <span>{t('nav.logout') || 'Çıkış Yap'}</span>
                      </button>
                    </div>
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
