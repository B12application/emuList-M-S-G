import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSun, FaMoon, FaBars, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import B12Logo from './B12Logo';
import useUserProfile from '../hooks/useUserProfile';
import { isAdmin } from '../../backend/config/adminConfig';

interface MobileTopBarProps {
  onMenuOpen?: () => void;
}

export default function MobileTopBar({ onMenuOpen }: MobileTopBarProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  if (!user) return null;

  const userIsAdmin = isAdmin(user.uid);

  const getPageTitle = () => {
    const defaultName = profile?.displayName || user.displayName || 'B12';
    if (location.pathname === '/') return defaultName;

    if (location.pathname.startsWith('/movie')) return t('nav.movies') || 'Filmler';
    if (location.pathname.startsWith('/series')) return t('nav.series') || 'Diziler';
    if (location.pathname.startsWith('/game')) return t('nav.games') || 'Oyunlar';
    if (location.pathname.startsWith('/book')) return t('nav.books') || 'Kitaplar';
    if (location.pathname.startsWith('/my-shows')) return t('myShows.title') || 'Dizi Takibi';
    if (location.pathname.startsWith('/all')) return t('nav.all') || 'Tüm Liste';
    if (location.pathname.startsWith('/create')) return t('create.title') || 'Yeni İçerik';
    if (location.pathname.startsWith('/notes')) return t('nav.notes') || 'Notlarım';
    if (location.pathname.startsWith('/planner')) return t('nav.calendar') || 'Takvim & Plan';
    if (location.pathname.startsWith('/expenses')) return t('nav.expenses') || 'Harcamalar';
    if (location.pathname.startsWith('/travel-planner')) return 'Gezi Planlayıcı';
    if (location.pathname.startsWith('/profile')) return t('nav.myProfile') || 'Profilim';
    if (location.pathname.startsWith('/stats')) return t('home.stats') || 'İstatistikler';
    if (location.pathname.startsWith('/lists')) return t('lists.title') || 'Listelerim';
    if (location.pathname.startsWith('/map')) return t('nav.map') || 'Harita';
    if (location.pathname.startsWith('/feed')) return t('nav.feed') || 'Aktiviteler';
    if (location.pathname.startsWith('/settings')) return t('nav.settings') || 'Ayarlar';
    if (location.pathname.startsWith('/admin')) return t('nav.adminPanel') || 'Admin Paneli';
    if (location.pathname.startsWith('/wrapped')) return 'B12 Wrapped';
    return defaultName;
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
      <div className="mx-3 mt-3 px-3 py-2.5 bg-white/85 dark:bg-zinc-900/90 backdrop-blur-xl border border-amber-400/35 dark:border-amber-500/25 rounded-2xl shadow-lg shadow-amber-500/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            onClick={onMenuOpen}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-400/15 dark:bg-amber-400/10 text-stone-800 dark:text-amber-300 hover:bg-amber-400/25 transition-colors shrink-0 border border-amber-400/30"
            aria-label="Menüyü Aç"
          >
            <FaBars className="text-base" />
          </button>
          <Link to="/" className="flex items-center gap-2 overflow-hidden min-w-0">
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
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-stone-200/50 dark:border-zinc-700/50 shadow-inner">
            <button
              onClick={toggleTheme}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-xs"
              aria-label="Tema Değiştir"
            >
              {isDark ? <FaMoon className="text-xs" /> : <FaSun className="text-xs" />}
            </button>
            <button
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold text-stone-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-white transition-all shadow-xs"
              aria-label="Dil Değiştir"
            >
              {language === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
          <Link to="/profile" className="relative w-9 h-9 rounded-xl overflow-hidden border border-stone-200 dark:border-zinc-700 shadow-sm transition-transform active:scale-90 shrink-0">
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            {userIsAdmin && (
              <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-amber-400 rounded-full text-stone-950 shadow-xs" title="Admin">
                <FaUserShield className="text-[8px]" />
              </div>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

