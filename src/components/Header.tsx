
import { Link, NavLink, useLocation } from 'react-router-dom'; 
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaBars, FaPlus } from 'react-icons/fa6'; 
import Logo from './Logo'; 

interface NavLinkRenderProps {
  isActive: boolean;
  isPending: boolean;
}

const getNavCls = ({ isActive }: NavLinkRenderProps) => {
  return isActive
    ? "text-indigo-600 font-semibold px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30"
    : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-xl";
};

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  
  // 2. Mevcut konumu (URL) al
  const location = useLocation();
  
  // 3. Mevcut türü ('movie', 'series', 'game') URL'den çıkar
  const pathSegments = location.pathname.split('/');
  const potentialType = pathSegments[1];
  let createType = 'movie'; // Varsayılan
  if (potentialType === 'movie' || potentialType === 'series' || potentialType === 'game') {
    createType = potentialType;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/70">
      <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo className="h-6 w-6 text-sky-500" />
          <span className="hidden sm:inline">Mustafa Ulusoy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
          <NavLink to="/" end className={getNavCls}>Home</NavLink>
          <NavLink to="/movie" className={getNavCls}>Movies</NavLink>
          <NavLink to="/series" className={getNavCls}>Series</NavLink>
          <NavLink to="/game" className={getNavCls}>Games</NavLink>
          <NavLink to="/all" className={getNavCls}>All</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          
          {/* 4. 'Create' LİNKİ GÜNCELLENDİ (artık ?type=... parametresi ekliyor) */}
          <Link
            to={`/create?type=${createType}`}
            title="Yeni Kayıt Ekle"
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FaPlus />
            <span className="sr-only">Yeni Kayıt Ekle</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Tema"
          >
            {isDark ? <FaMoon /> : <FaSun />}
            <span className="sr-only">Tema Değiştir</span>
          </button>

          <button
            onClick={onMobileMenuOpen}
            className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Menü"
          >
            <FaBars />
            <span className="sr-only">Menüyü Aç</span>
          </button>
        </div>
      </div>
    </header>
  );
}