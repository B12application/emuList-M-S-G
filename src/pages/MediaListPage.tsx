// src/pages/MediaListPage.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
// 1. YENİ İKONLAR: FaSortAlphaDown (A-Z) ve FaStar (Puan)
import { FaFilm, FaTv, FaGamepad, FaClone, FaEye, FaEyeSlash, FaGlobeAmericas, FaSearch, FaInbox, FaSortAlphaDown, FaStar } from 'react-icons/fa';
import type { MediaItem, FilterType, FilterStatus } from '../types/media';
import useMedia from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';

export default function MediaListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation(); 

  const type: FilterType = (location.pathname.split('/')[1] as FilterType) || 'all';
  const filter: FilterStatus = (searchParams.get('filter') as FilterStatus) || 'all';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  
  // 2. YENİ: Sıralama State'i (Varsayılan: 'rating')
  const [sortOption, setSortOption] = useState<'rating' | 'title'>('rating');
  
  const isSearchActive = searchQuery.trim() !== '';
  const { items, loading, refetch } = useMedia(type, filter, isSearchActive);

  // 3. GÜNCELLENDİ: Hem Arama Hem Sıralama Mantığı
  useEffect(() => {
    let result = [...items];

    // A. Arama Filtresi
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(lowerQuery)
      );
    }

    // B. Sıralama Mantığı
    if (sortOption === 'rating') {
      // Puana Göre (Yüksekten Düşüğe)
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortOption === 'title') {
      // İsim A-Z (Alfabetik)
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredItems(result);
  }, [items, searchQuery, sortOption]); 

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

  // 4. YENİ: Sıralama butonları için aktiflik stili
  const getActiveSort = (s: 'rating' | 'title') => {
    return sortOption === s
      ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold"
      : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  };

  const handleFilterChange = (newFilter: FilterStatus) => {
    refetch(); 
    setSearchParams(prev => {
      prev.set('filter', newFilter);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">
          List – {getTitle()}
        </h1>
        
        {/* Tür Linkleri */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("movie")}`} to="/movie"><FaFilm className="mr-2 inline" /> Movies</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("series")}`} to="/series"><FaTv className="mr-2 inline" /> Series</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("game")}`} to="/game"><FaGamepad className="mr-2 inline" /> Games</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("all")}`} to="/all"><FaClone className="mr-2 inline" /> All</Link>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          
          {/* 1. Grup: Durum Filtreleri (All, Watched, Not Watched) */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden self-start">
            <button title="Tümü" className={`px-4 py-2 text-sm transition ${getActiveFilter("all")}`} onClick={() => handleFilterChange('all')}>
              <FaGlobeAmericas />
            </button>
            <button title="İzlenenler" className={`px-4 py-2 text-sm transition ${getActiveFilter("watched")}`} onClick={() => handleFilterChange('watched')}>
              <FaEye />
            </button>
            <button title="İzlenmeyenler" className={`px-4 py-2 text-sm transition ${getActiveFilter("not-watched")}`} onClick={() => handleFilterChange('not-watched')}>
              <FaEyeSlash />
            </button>
          </div>

          {/* 5. YENİ GRUP: Sıralama Butonları (Puan, A-Z) */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden self-start">
            <button 
              title="Puana Göre Sırala" 
              className={`px-4 py-2 text-sm transition ${getActiveSort('rating')}`} 
              onClick={() => setSortOption('rating')}
            >
              <FaStar />
            </button>
            <button 
              title="İsme Göre (A-Z) Sırala" 
              className={`px-4 py-2 text-sm transition ${getActiveSort('title')}`} 
              onClick={() => setSortOption('title')}
            >
              <FaSortAlphaDown />
            </button>
          </div>
          
          {/* Arama Çubuğu */}
          <div className="relative flex-1 sm:flex-auto">
            <input 
              type="text"
              placeholder="Başlığa göre ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map(item => (
              <MediaCard 
                key={item.id} 
                item={item} 
                refetch={refetch} 
              />
            ))}
          </div>

          {filteredItems.length === 0 && !loading && (
            <EmptyState
              icon={<FaInbox />}
              title={searchQuery ? "Arama sonucu bulunamadı" : "Henüz kayıt yok"}
              description={
                searchQuery
                  ? `"${searchQuery}" aramasına uygun kayıt bulunamadı. Farklı bir arama terimi deneyin.`
                  : "Bu filtreye uygun kayıt bulunmuyor. Yeni bir kayıt eklemek için 'Yeni Kayıt Ekle' butonunu kullanabilirsiniz."
              }
            />
          )}
        </>
      )}
    </section>
  );
}