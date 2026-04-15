// src/components/Header.tsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaSignOutAlt, FaFilm, FaTv, FaGamepad, FaBook, FaChevronDown, FaUsersCog } from 'react-icons/fa';
import B12Logo from './B12Logo';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import useUserProfile from '../hooks/useUserProfile';
import { isAdmin } from '../../backend/config/adminConfig';

interface NavLinkRenderProps {
  isActive: boolean;
  isPending: boolean;
}

const getNavCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "relative px-4 py-2 text-sm font-medium text-rose-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20 rounded-full transition-all duration-300"
    : "relative px-4 py-2 text-sm font-medium text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full";
};

const getDropdownItemCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl transition-all"
    : "flex items-center gap-3 px-4 py-3 text-sm text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800/60 hover:text-stone-900 dark:hover:text-zinc-200 rounded-xl transition-all";
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
  const [scrolled, setScrolled] = useState(false);

  // Gender-based avatar URLs
  const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
  const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

  // Get avatar based on gender
  const getAvatar = () => {
    // Only use photoURL if it's a custom one (not our default avatars)
    if (user?.photoURL &&
      user.photoURL !== MALE_AVATAR_URL &&
      user.photoURL !== FEMALE_AVATAR_URL) {
      return user.photoURL;
    }

    // Use gender-based avatar
    if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
    if (profile?.gender === 'male') return MALE_AVATAR_URL;

    // Default fallback
    return MALE_AVATAR_URL;
  };

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
          className={`pointer-events-auto w-full max-w-5xl backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-white/20 dark:border-zinc-700/30 shadow-lg shadow-black/5 dark:shadow-rose-900/5 rounded-2xl transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}
        >
            <div className="px-4 sm:px-6 flex items-center justify-between">
              
              {/* --- LEFT SECTION: Profile --- */}
              <div className="flex-1 flex items-center justify-start overflow-hidden">
                {user && (
                  <div className="relative group shrink-0">
                    <Link
                      to="/profile"
                      className="group relative flex items-center justify-center p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-sm z-10 relative ring-2 transition-all ${location.pathname === '/profile' ? 'ring-rose-500' :
                        location.pathname === '/stats' ? 'ring-amber-500' :
                          location.pathname.startsWith('/lists') ? 'ring-violet-500' :
                            location.pathname === '/settings' ? 'ring-gray-400' :
                              'ring-stone-200 dark:ring-zinc-700'
                        }`}>
                        <img
                          src={getAvatar()}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {['/profile', '/stats', '/settings'].includes(location.pathname) || location.pathname.startsWith('/lists') ? (
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 ${location.pathname === '/profile' ? 'bg-rose-500' :
                          location.pathname === '/stats' ? 'bg-amber-500' :
                            location.pathname.startsWith('/lists') ? 'bg-violet-500' :
                              'bg-gray-400'
                          }`} />
                      ) : null}
                    </Link>

                    {/* User Hover Menu */}
                    <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left z-50">
                      <div className="px-4 py-2 border-b border-stone-200 dark:border-zinc-800 mb-1">
                        <span className="block text-sm font-bold text-stone-900 dark:text-white truncate">
                          {user.displayName || 'Kullanıcı'}
                        </span>
                        <span className="block text-xs text-stone-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </span>
                      </div>

                      {[
                        { to: '/profile', label: t('nav.myProfile'), icon: 'bg-rose-500' },
                        { to: '/stats', label: t('home.stats'), icon: 'bg-amber-500' },
                        { to: '/lists', label: t('lists.title'), icon: 'bg-violet-500' },
                        { to: '/map', label: t('nav.map'), icon: 'bg-indigo-500' },
                        { to: '/settings', label: t('nav.settings'), icon: 'bg-gray-400' }
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${location.pathname.startsWith(item.to)
                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold'
                            : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50'
                            }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${item.icon}`}></div>
                          {item.label}
                        </Link>
                      ))}

                      {isAdmin(user.uid) && (
                        <Link
                          to="/admin"
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${location.pathname === '/admin'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold'
                            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                        >
                          <FaUsersCog className="text-xs" />
                          {t('nav.adminPanel')}
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      >
                        <FaSignOutAlt className="text-xs" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* --- CENTER SECTION: Logo --- */}
              <div className="flex-none flex items-center justify-center z-10">
                <Link to="/" className="flex items-center group">
                  <div className="relative transform transition-all duration-300 group-hover:scale-110">
                    <div className="hidden sm:block">
                      <B12Logo size="md" />
                    </div>
                    <div className="sm:hidden">
                      <B12Logo size="sm" />
                    </div>
                  </div>
                </Link>
              </div>

              {/* --- RIGHT SECTION: Nav & Actions --- */}
              <div className="flex-1 flex items-center justify-end gap-1 sm:gap-1.5 overflow-hidden">
                {/* Desktop Navigation (Hidden on medium screens and below if too many items) */}
                {user && (
                  <nav className="hidden xl:flex items-center gap-1 mr-2 px-2 border-r border-stone-200 dark:border-zinc-800 overflow-hidden">
                    <NavLink to="/" end className={getNavCls}>{t('nav.home')}</NavLink>

                    <div
                      className="relative group"
                      onMouseEnter={() => setShowListsDropdown(true)}
                      onMouseLeave={() => setShowListsDropdown(false)}
                    >
                      <button
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${['/movie', '/series', '/game', '/book'].some(path => location.pathname.startsWith(path))
                          ? "text-rose-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20"
                          : "text-stone-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                      >
                        <span>{getListTitle()}</span>
                        <motion.div
                          animate={{ rotate: showListsDropdown ? 180 : 0 }}
                          className="flex items-center justify-center w-4 h-4"
                        >
                          <FaChevronDown className="w-2 h-2" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {showListsDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full right-0 mt-2 w-56 p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50"
                          >
                             <div className="space-y-1">
                              <NavLink to="/movie" className={getDropdownItemCls}>
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-500"><FaFilm /></div>
                                {t('nav.movies')}
                              </NavLink>
                              <NavLink to="/series" className={getDropdownItemCls}>
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500"><FaTv /></div>
                                {t('nav.series')}
                              </NavLink>
                              <NavLink to="/my-shows" className={getDropdownItemCls}>
                                <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-500"><FaTv /></div>
                                {t('myShows.title')}
                              </NavLink>
                              <NavLink to="/game" className={getDropdownItemCls}>
                                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-500"><FaGamepad /></div>
                                {t('nav.games')}
                              </NavLink>
                              <NavLink to="/book" className={getDropdownItemCls}>
                                <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-500"><FaBook /></div>
                                {t('nav.books')}
                              </NavLink>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <NavLink to="/planner" className={getNavCls}>Takvim</NavLink>
                    <NavLink to="/feed" className={getNavCls}>{t('nav.feed')}</NavLink>
                  </nav>
                )}

                {/* Theme & Language & Notifications */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <NotificationDropdown />

                  <button
                    onClick={toggleTheme}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-stone-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    {isDark ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold text-stone-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    {language === 'tr' ? 'EN' : 'TR'}
                  </button>
                </div>
              </div>

            </div>

            {/* Mobile Menu Button — Bottom Nav Bar kullanıldığı için gizlendi */}
        </motion.header>
      </div>
    </>
  );
}