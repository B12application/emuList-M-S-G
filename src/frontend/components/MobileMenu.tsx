// src/components/MobileMenu.tsx
import { NavLink, useLocation, Link } from 'react-router-dom';
import { FaHome, FaFilm, FaTv, FaGamepad, FaBook, FaPlus, FaClone, FaMap, FaUser, FaCog, FaChartBar, FaSignOutAlt, FaHistory } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const handleLogout = () => {
    signOut(auth);
    onClose();
  };

  const pathSegments = location.pathname.split('/');
  const potentialType = pathSegments[1];
  const createType = (potentialType === 'movie' || potentialType === 'series' || potentialType === 'game' || potentialType === 'book')
    ? potentialType
    : undefined;
  const createLink = createType ? `/create?type=${createType}` : '/create';

  const getNavLinkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${isActive
      ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`;



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="relative w-80 h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
        <div className="flex flex-col h-full">

          {/* User Header */}
          {user ? (
            <div className="p-6 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-b border-rose-100 dark:border-gray-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full p-1 bg-white dark:bg-gray-800 shadow-sm">
                  <img
                    src={user.photoURL || 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png'}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {user.displayName || t('profile.title')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/profile" onClick={onClose} className="flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-700">
                  <FaUser className="text-rose-500" /> Profil
                </Link>
                <Link to="/settings" onClick={onClose} className="flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-700">
                  <FaCog className="text-gray-500" /> Ayarlar
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col gap-3">
                <Link to="/login" onClick={onClose} className="w-full py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold text-center text-gray-700 dark:text-gray-300 shadow-sm">
                  {t('auth.login')}
                </Link>
                <Link to="/signup" onClick={onClose} className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold text-center shadow-lg shadow-rose-200 dark:shadow-rose-900/20">
                  {t('auth.signup')}
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 p-4 space-y-1">
            <NavLink onClick={onClose} to="/" end className={getNavLinkCls}>
              {({ isActive }) => <><FaHome className={isActive ? "text-rose-500" : "text-gray-400"} /> {t('nav.home')}</>}
            </NavLink>

            <div className="my-2 border-t border-gray-100 dark:border-gray-800 mx-4" />

            <NavLink onClick={onClose} to="/movie" className={getNavLinkCls}>
              {({ isActive }) => <><FaFilm className={isActive ? "text-blue-500" : "text-gray-400"} /> {t('nav.movies')}</>}
            </NavLink>
            <NavLink onClick={onClose} to="/series" className={getNavLinkCls}>
              {({ isActive }) => <><FaTv className={isActive ? "text-emerald-500" : "text-gray-400"} /> {t('nav.series')}</>}
            </NavLink>
            <NavLink onClick={onClose} to="/game" className={getNavLinkCls}>
              {({ isActive }) => <><FaGamepad className={isActive ? "text-amber-500" : "text-gray-400"} /> {t('nav.games')}</>}
            </NavLink>
            <NavLink onClick={onClose} to="/book" className={getNavLinkCls}>
              {({ isActive }) => <><FaBook className={isActive ? "text-purple-500" : "text-gray-400"} /> {t('nav.books')}</>}
            </NavLink>

            <div className="my-2 border-t border-gray-100 dark:border-gray-800 mx-4" />

            <NavLink onClick={onClose} to="/all" className={getNavLinkCls}>
              {({ isActive }) => <><FaClone className={isActive ? "text-rose-500" : "text-gray-400"} /> {t('nav.all')}</>}
            </NavLink>
            <NavLink onClick={onClose} to="/feed" className={getNavLinkCls}>
              {({ isActive }) => <><FaHistory className={isActive ? "text-violet-500" : "text-gray-400"} /> {t('nav.feed')}</>}
            </NavLink>
            <NavLink onClick={onClose} to="/map" className={getNavLinkCls}>
              {({ isActive }) => <><FaMap className={isActive ? "text-indigo-500" : "text-gray-400"} /> {t('nav.map')}</>}
            </NavLink>
            <NavLink onClick={onClose} to="/stats" className={getNavLinkCls}>
              {({ isActive }) => <><FaChartBar className={isActive ? "text-orange-500" : "text-gray-400"} /> {t('home.stats')}</>}
            </NavLink>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
            {user && (
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium">
                <FaSignOutAlt /> {t('auth.logout')}
              </button>
            )}

            <Link
              onClick={onClose}
              to={createLink}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 dark:shadow-sky-900/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <FaPlus /> {t('actions.create')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}