// src/pages/MediaListPage.tsx
import { Link, useSearchParams, useLocation } from 'react-router-dom'; // 1. useLocation eklendi
import { FaFilm, FaTv, FaGamepad, FaClone } from 'react-icons/fa';
import type { FilterType, FilterStatus } from '../types/media';
import useMedia from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';

export default function MediaListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation(); // 2. useLocation hook'u çağrıldı

  // 3. HATA ÇÖZÜMÜ: Tipi useParams() yerine location.pathname'den (URL'den) al
  // location.pathname -> "/movie"
  // .split('/') -> ["", "movie"]
  // [1] -> "movie"
  const type: FilterType = (location.pathname.split('/')[1] as FilterType) || 'all';

  const filter: FilterStatus = (searchParams.get('filter') as FilterStatus) || 'all';
  const page = Number(searchParams.get('page')) || 1;

  // 4. Hook artık doğru 'type' ile çalışacak (örn: "movie")
  const { items, loading, refetch } = useMedia(type, filter, page);

  const getActiveTab = (t: FilterType) => {
    return type === t
      ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 font-semibold"
      : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  };
  
  const getActiveFilter = (f: FilterStatus) => {
    return filter === f
      ? "text-indigo-600 bg-gray-100 dark:bg-gray-800 font-semibold"
      : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800";
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
        
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <button className={`px-4 py-2 text-sm transition ${getActiveFilter("all")}`} onClick={() => handleFilterChange('all')}>All</button>
          <button className={`px-4 py-2 text-sm transition ${getActiveFilter("watched")}`} onClick={() => handleFilterChange('watched')}>Watched</button>
          <button className={`px-4 py-2 text-sm transition ${getActiveFilter("not-watched")}`} onClick={() => handleFilterChange('not-watched')}>Not Watched</button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-center">Yükleniyor...</p>
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