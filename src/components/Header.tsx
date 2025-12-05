// src/components/Header.tsx
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaBars, FaPlus, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaMap } from 'react-icons/fa';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

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

  const pathSegments = location.pathname.split('/');
  const potentialType = pathSegments[1];
  const createType = (potentialType === 'movie' || potentialType === 'series' || potentialType === 'game')
    ? potentialType
    : undefined;
  const createLink = createType ? `/create?type=${createType}` : '/create';

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-2xl">
          <Logo className="h-8 w-8 text-rose-500" />
          <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
            B12
          </span>
        </Link>

        {/* Navigasyon */}
        {user && (
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            <NavLink to="/" end className={getNavCls}>Anasayfa</NavLink>
            <NavLink to="/movie" className={getNavCls}>Filmler</NavLink>
            <NavLink to="/series" className={getNavCls}>Diziler</NavLink>
            <NavLink to="/game" className={getNavCls}>Oyunlar</NavLink>
            <NavLink to="/all" className={getNavCls}>Hepsi</NavLink>
            <NavLink to="/map" className={getNavCls}><FaMap /></NavLink>
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