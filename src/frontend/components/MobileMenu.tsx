// src/components/MobileMenu.tsx
import { NavLink, useLocation, Link } from 'react-router-dom';
import { FaHome, FaFilm, FaTv, FaGamepad, FaBook, FaPlus, FaClone, FaMap, FaUser, FaCog, FaChartBar, FaSignOutAlt, FaHistory, FaListUl, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import useUserProfile from '../hooks/useUserProfile';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

const containerVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30, staggerChildren: 0.04, delayChildren: 0.1 }
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 500, damping: 30 } }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } }
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { t } = useLanguage();
  const location = useLocation();

  const getAvatar = () => {
    if (user?.photoURL && user.photoURL !== MALE_AVATAR_URL && user.photoURL !== FEMALE_AVATAR_URL) {
      return user.photoURL;
    }
    if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
    return MALE_AVATAR_URL;
  };

  const handleLogout = () => {
    signOut(auth);
    onClose();
  };

  const pathSegments = location.pathname.split('/');
  const potentialType = pathSegments[1];
  const createType = ['movie', 'series', 'game', 'book'].includes(potentialType) ? potentialType : undefined;
  const createLink = createType ? `/create?type=${createType}` : '/create';

  // Tüm nav items birleşik - Anasayfa, sonra kategoriler, sonra diğerleri
  const allNavItems = [
    { to: '/', icon: FaHome, label: t('nav.home'), color: 'rose', end: true },
    // Kategoriler
    { to: '/movie', icon: FaFilm, label: t('nav.movies'), color: 'blue' },
    { to: '/series', icon: FaTv, label: t('nav.series'), color: 'emerald' },
    { to: '/game', icon: FaGamepad, label: t('nav.games'), color: 'amber' },
    { to: '/book', icon: FaBook, label: t('nav.books'), color: 'purple' },
    // Diğerleri
    { to: '/all', icon: FaClone, label: t('nav.all'), color: 'rose' },
    { to: '/feed', icon: FaHistory, label: t('nav.feed'), color: 'violet' },
    { to: '/map', icon: FaMap, label: t('nav.map'), color: 'indigo' },
    { to: '/stats', icon: FaChartBar, label: t('home.stats'), color: 'orange' },
    { to: '/lists', icon: FaListUl, label: t('lists.title') || 'Listelerim', color: 'violet' },
  ];

  const getActiveStyles = (color: string) => {
    const styles: Record<string, string> = {
      rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
      orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    };
    return styles[color] || styles.rose;
  };

  const getIconColor = (color: string) => {
    const colors: Record<string, string> = {
      rose: 'text-rose-500', blue: 'text-blue-500', emerald: 'text-emerald-500',
      amber: 'text-amber-500', purple: 'text-purple-500', violet: 'text-violet-500',
      indigo: 'text-indigo-500', orange: 'text-orange-500',
    };
    return colors[color] || 'text-rose-500';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-4 left-4 right-4 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800"
            >
              {user ? (
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-full ring-2 ring-rose-500/50 overflow-hidden"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={getAvatar()} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {user.displayName || 'Kullanıcı'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                      {user.email}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <span className="font-semibold text-gray-900 dark:text-white">Menü</span>
              )}

              <motion.button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-colors"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FaTimes />
              </motion.button>
            </motion.div>

            {/* Navigation Links - Tümü yatay liste halinde */}
            <div className="p-2 max-h-[320px] overflow-y-auto">
              {allNavItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.to}
                    variants={itemVariants}
                    custom={index}
                    whileHover={{ x: 4 }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                          ? getActiveStyles(item.color)
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <motion.div
                            animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            <Icon className={isActive ? getIconColor(item.color) : 'text-gray-400'} />
                          </motion.div>
                          <span>{item.label}</span>
                          {isActive && (
                            <motion.div
                              className={`ml-auto w-1.5 h-1.5 rounded-full ${getIconColor(item.color)}`}
                              layoutId="navDot"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Actions */}
            {user && (
              <motion.div
                variants={buttonVariants}
                className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full"
                  >
                    <FaUser className="text-rose-500 text-xs" /> Profil
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Link
                    to="/settings"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full"
                  >
                    <FaCog className="text-gray-500 text-xs" /> Ayarlar
                  </Link>
                </motion.div>
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center justify-center px-4 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaSignOutAlt />
                </motion.button>
              </motion.div>
            )}

            {/* Not logged in */}
            {!user && (
              <motion.div
                variants={buttonVariants}
                className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2"
              >
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 text-center"
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-rose-600 rounded-xl text-sm font-medium text-white text-center shadow-lg shadow-rose-600/20"
                >
                  Kayıt Ol
                </Link>
              </motion.div>
            )}

            {/* Create Button */}
            <motion.div variants={buttonVariants} className="p-3 pt-0">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={createLink}
                  onClick={onClose}
                  className="relative flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.8, ease: 'easeInOut' }}
                  />
                  <FaPlus className="text-sm relative z-10" />
                  <span className="relative z-10">{t('actions.create')}</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}