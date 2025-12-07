// src/components/Header.tsx
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaBars, FaPlus, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaFilm, FaTv, FaGamepad, FaBook, FaLayerGroup } from 'react-icons/fa';
import EyeTracker from './EyeTracker';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useLanguage } from '../context/LanguageContext';

interface NavLinkRenderProps {
  isActive: boolean;
  isPending: boolean;
}

const getNavCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "text-rose-600 dark:text-rose-400 font-semibold px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/30"
    : "text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition";
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

  const pathSegments = location.pathname.split('/');
  const potentialType = pathSegments[1];
  const createType = (potentialType === 'movie' || potentialType === 'series' || potentialType === 'game' || potentialType === 'book')
    ? potentialType
    : undefined;
  const createLink = createType ? `/create?type=${createType}` : '/create';

  /* New logic for active icon */
  const getActiveIcon = () => {
    if (location.pathname.startsWith('/movie')) return <FaFilm className="text-blue-500" />;
    if (location.pathname.startsWith('/series')) return <FaTv className="text-emerald-500" />;
    if (location.pathname.startsWith('/game')) return <FaGamepad className="text-amber-500" />;
    if (location.pathname.startsWith('/book')) return <FaBook className="text-purple-500" />;
    return <FaLayerGroup className="text-gray-400 group-hover:text-rose-500" />;
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Sol - Gözler */}
        <Link to="/">
          <EyeTracker />
        </Link>

        {/* Orta - Anasayfa, Listeler, Harita */}
        {user && (
          <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-2 text-sm font-medium">
            <NavLink to="/" end className={getNavCls}>{t('nav.home')}</NavLink>

            {/* Koleksiyonum Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowListsDropdown(true)}
              onMouseLeave={() => setShowListsDropdown(false)}
            >
              <button
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 group ${['/movie', '/series', '/game', '/book'].some(path => location.pathname.startsWith(path))
                  ? "text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/30"
                  : "text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                aria-expanded={showListsDropdown}
              >
                {/* Dynamic Icon */}
                {getActiveIcon()}

                <span>{t('nav.collection')}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showListsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showListsDropdown && (
                <div className="absolute top-full left-0 pt-2 min-w-[160px] z-50">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 overflow-hidden">
                    <NavLink
                      to="/movie"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <FaFilm className="text-blue-500" />
                      {t('nav.movies')}
                    </NavLink>
                    <NavLink
                      to="/series"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <FaTv className="text-emerald-500" />
                      {t('nav.series')}
                    </NavLink>
                    <NavLink
                      to="/game"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <FaGamepad className="text-amber-500" />
                      {t('nav.games')}
                    </NavLink>
                    <NavLink
                      to="/book"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <FaBook className="text-purple-500" />
                      {t('nav.books')}
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* Harita */}
            <NavLink to="/map" className={getNavCls}>
              {t('nav.map')}
            </NavLink>
          </nav>
        )}


        <div className="flex items-center gap-2">

          {user ? (
            <>
              <Link
                to={createLink}
                title="Yeni Kayıt Ekle"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <FaPlus />
              </Link>

              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-red-200 text-red-600 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <FaSignOutAlt />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                <FaSignInAlt /> Giriş Yap
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                <FaUserPlus /> Kayıt Ol
              </Link>
            </>
          )}

          <button
            onClick={toggleTheme}
            className={`h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${!user ? 'hidden sm:inline-flex' : ''}`}
            title="Tema"
          >
            {isDark ? <FaMoon /> : <FaSun />}
          </button>

          {/* Dil Seçici */}
          <button
            onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            className={`h-10 px-3 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-semibold ${!user ? 'hidden sm:inline-flex' : ''}`}
            title="Language / Dil"
          >
            {language === 'tr' ? 'EN' : 'TR'}
          </button>

          {user && (
            <button
              onClick={onMobileMenuOpen}
              className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Menü"
            >
              <FaBars />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}