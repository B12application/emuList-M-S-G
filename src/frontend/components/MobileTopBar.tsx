import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWallet } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import B12Logo from './B12Logo';
import useUserProfile from '../hooks/useUserProfile';

export default function MobileTopBar() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return null;

  const getPageTitle = () => {
    if (location.pathname === '/') return 'EmuList';
    if (location.pathname.startsWith('/movie')) return t('nav.movies');
    if (location.pathname.startsWith('/series')) return t('nav.series');
    if (location.pathname.startsWith('/game')) return t('nav.games');
    if (location.pathname.startsWith('/book')) return t('nav.books');
    if (location.pathname.startsWith('/expenses')) return t('nav.expenses');
    if (location.pathname.startsWith('/planner')) return t('nav.calendar');
    if (location.pathname.startsWith('/profile')) return t('nav.myProfile');
    if (location.pathname.startsWith('/stats')) return t('home.stats');
    if (location.pathname.startsWith('/lists')) return t('lists.title');
    if (location.pathname.startsWith('/map')) return t('nav.map');
    if (location.pathname.startsWith('/feed')) return t('nav.feed');
    return 'EmuList';
  };

  const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
  const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

  const avatarUrl = user.photoURL && 
    user.photoURL !== MALE_AVATAR_URL && 
    user.photoURL !== FEMALE_AVATAR_URL 
      ? user.photoURL 
      : (profile?.gender === 'female' ? FEMALE_AVATAR_URL : MALE_AVATAR_URL);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] md:hidden">
      <div className="mx-3 mt-3 px-4 py-3 bg-white/80 dark:bg-zinc-900/85 backdrop-blur-xl border border-white/30 dark:border-zinc-700/40 rounded-2xl shadow-lg shadow-black/5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <B12Logo size="sm" className="shrink-0" />
          <motion.span 
            key={location.pathname}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-black text-stone-900 dark:text-white tracking-tighter truncate"
          >
            {getPageTitle()}
          </motion.span>
        </Link>

        <div className="flex items-center gap-2">
          <Link 
            to="/expenses" 
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
              location.pathname.startsWith('/expenses')
                ? 'bg-stone-900 text-white dark:bg-white dark:text-zinc-950 shadow-md'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
            }`}
          >
            <FaWallet className="text-xs" />
          </Link>
          <Link to="/profile" className="w-9 h-9 rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-700 shadow-sm transition-transform active:scale-90">
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </Link>
        </div>
      </div>
    </div>
  );
}
