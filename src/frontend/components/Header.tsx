// src/components/Header.tsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaBars, FaPlus, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaFilm, FaTv, FaGamepad, FaBook, FaLayerGroup, FaChevronDown } from 'react-icons/fa';
import EyeTracker from './EyeTracker';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NavLinkRenderProps {
  isActive: boolean;
  isPending: boolean;
}

const getNavCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "relative px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20 rounded-full transition-all duration-300"
    : "relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full";
};

const getDropdownItemCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl transition-all"
    : "flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 rounded-xl transition-all";
};

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [showListsDropdown, setShowListsDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for additional styling if needed (e.g. shrinking)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // URL parsing removed as createLink logic was unused
  // const createLink = '/create';

  /* New logic for active icon */
  const getActiveIcon = () => {
    if (location.pathname.startsWith('/movie')) return <FaFilm className="text-blue-500" />;
    if (location.pathname.startsWith('/series')) return <FaTv className="text-emerald-500" />;
    if (location.pathname.startsWith('/game')) return <FaGamepad className="text-amber-500" />;
    if (location.pathname.startsWith('/book')) return <FaBook className="text-purple-500" />;
    return <FaLayerGroup className="text-gray-400 group-hover:text-rose-500 transition-colors" />;
  };

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
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`pointer-events-auto w-full max-w-5xl backdrop-blur-xl bg-white/80 dark:bg-black/60 border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-rose-900/5 rounded-2xl transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}
        >
          <div className="px-4 sm:px-6 flex items-center justify-between">

            {/* Logo Area */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative transform transition-transform duration-300 group-hover:scale-110">
                <EyeTracker />
              </div>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/" end className={getNavCls}>{t('nav.home')}</NavLink>

                {/* Dropdown */}
                <div
                  className="relative group"
                  onMouseEnter={() => setShowListsDropdown(true)}
                  onMouseLeave={() => setShowListsDropdown(false)}
                >
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${['/movie', '/series', '/game', '/book'].some(path => location.pathname.startsWith(path))
                      ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20"
                      : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                  >
                    {getActiveIcon()}
                    <span>{getListTitle()}</span>
                    <FaChevronDown className={`w-3 h-3 transition-transform duration-300 ${showListsDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showListsDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="space-y-1">
                          <NavLink to="/movie" className={getDropdownItemCls}>
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-500">
                              <FaFilm />
                            </div>
                            {t('nav.movies')}
                          </NavLink>
                          <NavLink to="/series" className={getDropdownItemCls}>
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500">
                              <FaTv />
                            </div>
                            {t('nav.series')}
                          </NavLink>
                          <NavLink to="/game" className={getDropdownItemCls}>
                            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-500">
                              <FaGamepad />
                            </div>
                            {t('nav.games')}
                          </NavLink>
                          <NavLink to="/book" className={getDropdownItemCls}>
                            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-500">
                              <FaBook />
                            </div>
                            {t('nav.books')}
                          </NavLink>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <NavLink to="/map" className={getNavCls}>{t('nav.map')}</NavLink>
              </nav>
            )}

            {/* Actions Area */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to="/create"
                    className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all duration-300"
                    title="Yeni Kayıt Ekle"
                  >
                    <FaPlus className="transform transition-transform group-hover:rotate-90" />
                  </Link>

                  <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                  <div className="relative group">
                    <Link
                      to="/profile"
                      className="group relative flex items-center justify-center p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm z-10 relative">
                        <img
                          src={user.photoURL || 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png'}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* User Hover Menu */}
                    <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50">

                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white truncate">
                          {user.displayName || 'Kullanıcı'}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        Profilim
                      </Link>

                      <Link
                        to="/stats"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        {t('home.stats')}
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        Ayarlar
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      >
                        <FaSignOutAlt className="text-xs" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <FaSignInAlt />
                    <span>Giriş Yap</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-lg shadow-rose-600/20 transition-all transform hover:scale-105"
                  >
                    <FaUserPlus />
                    <span>Kayıt Ol</span>
                  </Link>
                </>
              )}

              {/* Theme & Language Toggles */}
              <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-800">
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="Tema"
                >
                  {isDark ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="Language / Dil"
                >
                  {language === 'tr' ? 'EN' : 'TR'}
                </button>
              </div>

              {/* Mobile Menu Button */}
              {user && (
                <button
                  onClick={onMobileMenuOpen}
                  className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <FaBars />
                </button>
              )}
            </div>
          </div>
        </motion.header>
      </div>
    </>
  );
}