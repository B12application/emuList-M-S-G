// src/pages/MediaListPage.tsx
import { Link, useSearchParams, useLocation } from 'react-router-dom';
// 1. Gerekli ikonlar import edildi
import { FaFilm, FaTv, FaGamepad, FaClone, FaSpinner, FaEye, FaEyeSlash, FaGlobeAmericas } from 'react-icons/fa';
import type { FilterType, FilterStatus } from '../types/media';
import useMedia from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';

export default function MediaListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation(); 

  const type: FilterType = (location.pathname.split('/')[1] as FilterType) || 'all';
  const filter: FilterStatus = (searchParams.get('filter') as FilterStatus) || 'all';
  const page = Number(searchParams.get('page')) || 1;

  // 2. 'sortBy' state'i ve hook parametresi kaldırıldı
  const { items, loading, refetch } = useMedia(type, filter, page);

  const getActiveTab = (t: FilterType) => {
    return type === t
      ? "text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold"
      : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  };
  
  const getActiveFilter = (f: FilterStatus) => {
    return filter === f
      ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold"
      : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  };

  const handleFilterChange = (newFilter: FilterStatus) => {
    setSearchParams(prev => {
      prev.set('filter', newFilter);
      prev.set('page', '1');
      return prev;
    }, { replace: true });
  };
  
  const getTitle = () => {
    if (type === 'series') return 'Series';
    if (type === 'game') return 'Games';
    if (type === 'movie') return 'Movies';
    return 'All';
  };

  return (
    <section className="py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          List – {getTitle()}
        </h1>

        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("movie")}`} to="/movie"><FaFilm className="mr-2 inline" /> Movies</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("series")}`} to="/series"><FaTv className="mr-2 inline" /> Series</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("game")}`} to="/game"><FaGamepad className="mr-2 inline" /> Games</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("all")}`} to="/all"><FaClone className="mr-2 inline" /> All</Link>
        </div>
        
        {/* 3. TASARIM DEĞİŞİKLİĞİ: Filtre butonları ikonlu hale getirildi */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <button title="All" className={`px-4 py-2 text-sm transition ${getActiveFilter("all")}`} onClick={() => handleFilterChange('all')}>
            <FaGlobeAmericas />
          </button>
          <button title="Watched" className={`px-4 py-2 text-sm transition ${getActiveFilter("watched")}`} onClick={() => handleFilterChange('watched')}>
            <FaEye />
          </button>
          <button title="Not Watched" className={`px-4 py-2 text-sm transition ${getActiveFilter("not-watched")}`} onClick={() => handleFilterChange('not-watched')}>
            <FaEyeSlash />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8 mt-6">
          <FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
          <span className="ml-3 text-lg">Yükleniyor...</span>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(item => (
              <MediaCard 
                key={item.id} 
                item={item} 
                refetch={refetch} 
            	/>
            ))}
          </div>

          {items.length === 0 && !loading && (
            <p className="mt-6 text-center text-gray-500">Bu filtreye uygun kayıt bulunamadı.</p>
          )}
        </>
      )}
    </section>
  );
}