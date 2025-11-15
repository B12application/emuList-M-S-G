// src/components/MobileMenu.tsx
import { NavLink, useLocation } from 'react-router-dom'; 
import { FaHome, FaFilm, FaTv, FaGamepad, FaPlus, FaClone } from 'react-icons/fa';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation();

  // === HATA DÜZELTMESİ BURADA ===
  const pathSegments = location.pathname.split('/');
  const potentialType = pathSegments[1];
  
  const createType = (potentialType === 'movie' || potentialType === 'series' || potentialType === 'game') 
    ? potentialType 
    : undefined;

  const createLink = createType ? `/create?type=${createType}` : '/create';

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${isOpen ? '' : 'hidden'}`}>
      
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
      ></div>

      <div className="absolute right-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4">
        <nav className="flex flex-col gap-2 text-base">
          
          <NavLink onClick={onClose} to="/" end className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <FaHome className="w-6" /> Home
          </NavLink>
          <NavLink onClick={onClose} to="/movie" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <FaFilm className="w-6" /> Movies
          </NavLink>
          <NavLink onClick={onClose} to="/series" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <FaTv className="w-6" /> Series
          </NavLink>
          <NavLink onClick={onClose} to="/game" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <FaGamepad className="w-6" /> Games
          </NavLink>
          <NavLink onClick={onClose} to="/all" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <FaClone className="w-6" /> All
          </NavLink>
          
          <hr className="my-2 border-gray-200 dark:border-gray-700" />

          {/* 'Create' LİNKİ GÜNCELLENDİ (yeni 'createLink' değişkenini kullanır) */}
          <NavLink 
            onClick={onClose} 
            to={createLink} 
            className="flex items-center justify-center gap-3 px-3 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors"
          >
            <FaPlus className="w-5" /> Create
          </NavLink>
          
        </nav>
      </div>
    </div>
  );
}