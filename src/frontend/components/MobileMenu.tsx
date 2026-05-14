import { NavLink, Link } from 'react-router-dom';
import { FaHome, FaFilm, FaTv, FaGamepad, FaBook, FaClone, FaMap, FaCog, FaChartBar, FaSignOutAlt, FaHistory, FaListUl, FaTimes, FaCalendarAlt, FaWallet, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import useUserProfile from '../hooks/useUserProfile';
import { getShiftInfo } from '../utils/shiftLogic';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, damping: 25, stiffness: 200 }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { type: 'tween' as const, duration: 0.25, ease: 'easeInOut' as const }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { t } = useLanguage();

  if (!user) return null;

  const todayShift = getShiftInfo(new Date(), true);

  const getAvatar = () => {
    if (user?.photoURL && user.photoURL !== MALE_AVATAR_URL && user.photoURL !== FEMALE_AVATAR_URL) {
      return user.photoURL;
    }
    return profile?.gender === 'female' ? FEMALE_AVATAR_URL : MALE_AVATAR_URL;
  };

  const handleLogout = () => {
    signOut(auth);
    onClose();
  };

  const menuGroups = [
    {
      title: 'Koleksiyonlar',
      items: [
        { to: '/movie', icon: FaFilm, label: t('nav.movies') },
        { to: '/series', icon: FaTv, label: t('nav.series') },
        { to: '/game', icon: FaGamepad, label: t('nav.games') },
        { to: '/book', icon: FaBook, label: t('nav.books') },
        { to: '/my-shows', icon: FaTv, label: t('myShows.title') },
      ]
    },
    {
      title: 'Araçlar',
      items: [
        { to: '/planner', icon: FaCalendarAlt, label: 'Takvim/Plan' },
        { to: '/lists', icon: FaListUl, label: 'Listelerim' },
        { to: '/expenses', icon: FaWallet, label: 'Harcamalar' },
        { to: '/stats', icon: FaChartBar, label: 'İstatistikler' },
        { to: '/feed', icon: FaHistory, label: 'Akış' },
        { to: '/map', icon: FaMap, label: 'Harita' },
        { to: '/all', icon: FaClone, label: 'Tümü' },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] md:hidden">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-0 right-0 bottom-0 w-[80vw] max-w-[320px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden border-l border-stone-200/50 dark:border-zinc-800/50"
          >
            {/* Header Profile Area */}
            <div className="px-5 pt-12 pb-5 bg-stone-50 dark:bg-zinc-950/50 border-b border-stone-100 dark:border-zinc-800 shrink-0 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-200/50 dark:bg-zinc-800/50 text-stone-500 dark:text-zinc-400 hover:bg-stone-300/50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>

              <Link to="/profile" onClick={onClose} className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm shrink-0">
                  <img src={getAvatar()} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                    {profile?.displayName || user.displayName || 'Kullanıcı'}
                  </h3>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-zinc-500 truncate">
                    {user.email}
                  </p>
                </div>
                <FaChevronRight className="text-stone-300 dark:text-zinc-600 text-xs shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>

              {todayShift && (
                <div className="mt-4 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600 dark:text-zinc-300">Günün Vardiyası</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${todayShift.type === 'Sabah' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      todayShift.type === 'Akşam' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                    {todayShift.type}
                  </span>
                </div>
              )}
            </div>

            {/* Nav Items Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
              <NavLink
                to="/"
                onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl mb-4 transition-colors ${isActive
                    ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white font-bold'
                    : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium'
                  }`}
              >
                <FaHome className="text-lg opacity-80" />
                <span className="text-sm">Ana Sayfa</span>
              </NavLink>

              {menuGroups.map((group, idx) => (
                <div key={idx} className="mb-6">
                  <h4 className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-zinc-600">
                    {group.title}
                  </h4>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                            ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white font-bold'
                            : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800/50 font-medium hover:pl-4'
                          }`}
                      >
                        <item.icon className="text-base opacity-70" />
                        <span className="text-sm">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-4 pb-8 bg-stone-50 dark:bg-zinc-950/50 border-t border-stone-100 dark:border-zinc-800 shrink-0">
              <Link
                to="/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 font-medium transition-colors mb-1"
              >
                <FaCog className="text-base opacity-70" />
                <span className="text-sm">Ayarlar</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              >
                <FaSignOutAlt className="text-base opacity-70" />
                <span className="text-sm">Çıkış Yap</span>
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}