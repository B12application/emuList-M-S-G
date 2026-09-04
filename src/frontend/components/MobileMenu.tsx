import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  FaHome, FaFilm, FaTv, FaGamepad, FaBook, FaClone, 
  FaMap, FaCog, FaChartBar, FaSignOutAlt, FaHistory, 
  FaListUl, FaTimes, FaCalendarAlt, FaWallet, FaChevronRight, 
  FaCompass, FaStickyNote, FaUsersCog, FaUserShield, FaFire, FaChartPie, FaHeartbeat 
} from 'react-icons/fa';
import { PiSoccerBallFill } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../backend/config/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import useUserProfile from '../hooks/useUserProfile';
import { useShift } from '../context/ShiftContext';
import { isAdmin } from '../../backend/config/adminConfig';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

const drawerVariants = {
  hidden: { x: '100%', y: 12, opacity: 0 },
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, damping: 25, stiffness: 200 }
  },
  exit: {
    x: '100%',
    y: 12,
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
  const { getShiftInfo } = useShift();
  const { hasAccess } = useFeatureAccess();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!user) return null;

  const todayShift = getShiftInfo(new Date(), true);
  const userIsAdmin = isAdmin(user.uid);

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
      title: 'Ajanda & Planlama',
      items: [
        { to: '/planner', icon: FaCalendarAlt, label: t('nav.calendar') || 'Takvim & Planlayıcı' },
        { to: '/notes', icon: FaStickyNote, label: t('nav.notes') || 'Notlarım' },
        { to: '/planner?fixtures=true', icon: PiSoccerBallFill, label: 'Takımlar & Fikstür' },
      ]
    },
    {
      title: 'Koleksiyonlar',
      items: [
        { to: '/movie', icon: FaFilm, label: t('nav.movies') || 'Filmler' },
        { to: '/series', icon: FaTv, label: t('nav.series') || 'Diziler' },
        { to: '/game', icon: FaGamepad, label: t('nav.games') || 'Oyunlar' },
        { to: '/book', icon: FaBook, label: t('nav.books') || 'Kitaplar' },
        { to: '/my-shows', icon: FaTv, label: t('myShows.title') || 'Dizi Takibi' },
      ]
    },
    {
      title: 'Araçlar & Yaşam',
      items: [
        { to: '/expenses', icon: FaWallet, label: t('nav.expenses') || 'Harcamalar' },
        { to: '/travel-planner', icon: FaCompass, label: t('nav.travelPlanner') || 'Gezi Planlayıcı' },
        { to: '/lists', icon: FaListUl, label: t('lists.title') || 'Listelerim' },
        { to: '/stats', icon: FaChartBar, label: t('home.stats') || 'İstatistikler' },
        { to: '/feed', icon: FaHistory, label: t('nav.feed') || 'Aktiviteler' },
        { to: '/map', icon: FaMap, label: t('nav.map') || 'Harita' },
        { to: '/all', icon: FaClone, label: t('nav.all') || 'Tüm Liste' },
        ...(hasAccess('calorieAi') ? [
          { to: '/calorie-details', icon: FaChartPie, label: 'Kalori Raporu' },
          { to: '/body-profile', icon: FaHeartbeat, label: 'Beden Profili' },
        ] : []),
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
            className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-[2px] cursor-pointer"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-0 right-0 bottom-0 w-[82vw] max-w-[330px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden border-l border-stone-200/50 dark:border-zinc-800/50"
          >
            {/* Header Profile Area */}
            <div className="px-5 pt-12 pb-4 bg-gradient-to-b from-amber-500/10 via-stone-50 to-stone-50 dark:from-amber-500/5 dark:via-zinc-950/70 dark:to-zinc-950/50 border-b border-stone-100 dark:border-zinc-800 shrink-0 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-200/60 dark:bg-zinc-800/60 text-stone-500 dark:text-zinc-400 hover:bg-stone-300 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Menüyü Kapat"
              >
                <FaTimes className="text-xs" />
              </button>

              <Link to="/profile" onClick={onClose} className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 dark:border-amber-400 shadow-sm shrink-0">
                  <img src={getAvatar()} alt="Profile" className="w-full h-full object-cover" />
                  {userIsAdmin && (
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-amber-400 rounded-full text-stone-950 shadow-xs" title="Admin">
                      <FaUserShield className="text-[10px]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                      {profile?.displayName || user.displayName || 'Kullanıcı'}
                    </h3>
                    {userIsAdmin && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-400 text-stone-950 shadow-xs">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-stone-500 dark:text-zinc-500 truncate">
                    {user.email}
                  </p>
                </div>
                <FaChevronRight className="text-stone-300 dark:text-zinc-600 text-xs shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Nav Items Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-4">
              <NavLink
                to="/"
                onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${isActive
                    ? 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/60 font-semibold'
                  }`}
              >
                <FaHome className="text-base opacity-80" />
                <span className="text-sm">{t('nav.home') || 'Ana Sayfa'}</span>
              </NavLink>

              {/* Admin Panel Section (Visible if user is admin) */}
              {userIsAdmin && (
                <div className="p-1 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/30">
                  <NavLink
                    to="/admin"
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${isActive
                        ? 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/30'
                        : 'text-amber-700 dark:text-amber-300 hover:bg-amber-400/20 font-bold'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <FaUsersCog className="text-base text-amber-600 dark:text-amber-400" />
                      <span className="text-sm">{t('nav.adminPanel') || 'Admin Paneli'}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-800 dark:text-amber-200">
                      Yönetim
                    </span>
                  </NavLink>
                </div>
              )}

              {menuGroups.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="px-3 text-[10px] font-extrabold tracking-widest uppercase text-stone-400 dark:text-zinc-500">
                    {group.title}
                  </h4>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${isActive
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
            <div className="p-4 pb-8 bg-stone-50 dark:bg-zinc-950/60 border-t border-stone-100 dark:border-zinc-800 shrink-0 space-y-1">
              <Link
                to="/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 font-medium transition-colors"
              >
                <FaCog className="text-base opacity-70" />
                <span className="text-sm">{t('nav.settings') || 'Ayarlar'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              >
                <FaSignOutAlt className="text-base opacity-70" />
                <span className="text-sm">{t('nav.logout') || 'Çıkış Yap'}</span>
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}