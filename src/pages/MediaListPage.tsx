// src/pages/MediaListPage.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
// 1. YENİ İKONLAR: FaList (Liste) ve FaThLarge (Izgara/Grid) eklendi
import { FaFilm, FaTv, FaGamepad, FaClone, FaEye, FaEyeSlash, FaGlobeAmericas, FaSearch, FaInbox, FaSortAlphaDown, FaStar, FaArrowDown, FaSpinner, FaList, FaThLarge } from 'react-icons/fa';
import type { MediaItem, FilterType, FilterStatus } from '../types/media';
import useMedia from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';
import MediaRowSlider from '../components/MediaRowSlider'; 
import MobileMediaItem from '../components/MobileMediaItem'; 
import DetailModal from '../components/DetailModal'; 
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';

export default function MediaListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation(); 

  const type: FilterType = (location.pathname.split('/')[1] as FilterType) || 'all';
  const filter: FilterStatus = (searchParams.get('filter') as FilterStatus) || 'all';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [sortOption, setSortOption] = useState<'rating' | 'title'>('rating');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // 2. YENİ STATE: Görünüm Modu (Varsayılan 'list')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const isSearchActive = searchQuery.trim().length > 0;
  const { items, loading, refetch, loadMore, loadingMore, hasMoreItems } = useMedia(type, filter, isSearchActive);

  useEffect(() => {
    let result = [...items];
    if (isSearchActive) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(lowerQuery));
    }
    if (sortOption === 'rating') {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortOption === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    setFilteredItems(result);
  }, [items, searchQuery, sortOption, isSearchActive]); 

  const ITEMS_PER_ROW_POOL = 12; 
  const chunkedItems = [];
  for (let i = 0; i < filteredItems.length; i += ITEMS_PER_ROW_POOL) {
    chunkedItems.push(filteredItems.slice(i, i + ITEMS_PER_ROW_POOL));
  }

  const getActiveTab = (t: FilterType) => type === t ? "text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  const getActiveFilter = (f: FilterStatus) => filter === f ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  const getActiveSort = (s: 'rating' | 'title') => sortOption === s ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  
  // 3. YENİ: Görünüm butonları için aktiflik stili
  const getActiveView = (v: 'list' | 'grid') => viewMode === v ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";

  const handleFilterChange = (newFilter: FilterStatus) => {
    refetch(); setSearchParams(prev => { prev.set('filter', newFilter); return prev; }, { replace: true });
  };
  const getTitle = () => {
    if (type === 'series') return 'Series'; if (type === 'game') return 'Games'; if (type === 'movie') return 'Movies'; return 'All';
  };

  return (
    <section className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap mb-8">
        <h1 className="text-2xl font-bold tracking-tight">List – {getTitle()}</h1>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("movie")}`} to="/movie"><FaFilm className="mr-2 inline" /> Movies</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("series")}`} to="/series"><FaTv className="mr-2 inline" /> Series</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("game")}`} to="/game"><FaGamepad className="mr-2 inline" /> Games</Link>
          <Link className={`px-4 py-2 text-sm transition ${getActiveTab("all")}`} to="/all"><FaClone className="mr-2 inline" /> All</Link>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Filtreler */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden self-start">
            <button title="Tümü" className={`px-4 py-2 text-sm transition ${getActiveFilter("all")}`} onClick={() => handleFilterChange('all')}><FaGlobeAmericas /></button>
            <button title="İzlenenler" className={`px-4 py-2 text-sm transition ${getActiveFilter("watched")}`} onClick={() => handleFilterChange('watched')}><FaEye /></button>
            <button title="İzlenmeyenler" className={`px-4 py-2 text-sm transition ${getActiveFilter("not-watched")}`} onClick={() => handleFilterChange('not-watched')}><FaEyeSlash /></button>
          </div>
          
          {/* Sıralama */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden self-start">
            <button title="Puana Göre" className={`px-4 py-2 text-sm transition ${getActiveSort('rating')}`} onClick={() => setSortOption('rating')}><FaStar /></button>
            <button title="İsme Göre" className={`px-4 py-2 text-sm transition ${getActiveSort('title')}`} onClick={() => setSortOption('title')}><FaSortAlphaDown /></button>
          </div>

          {/* 4. YENİ: Görünüm Değiştirme Butonları (Sadece Mobilde İşe Yarar ama Her Yerde Görünmesi Erişim İçin İyidir) */}
          <div className="flex lg:hidden rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden self-start">
            <button title="Liste Görünümü" className={`px-4 py-2 text-sm transition ${getActiveView('list')}`} onClick={() => setViewMode('list')}><FaList /></button>
            <button title="Izgara Görünümü" className={`px-4 py-2 text-sm transition ${getActiveView('grid')}`} onClick={() => setViewMode('grid')}><FaThLarge /></button>
          </div>

          {/* Arama */}
          <div className="relative flex-1 sm:flex-auto">
            <input type="text" placeholder="Başlığa göre ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition" />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          
          {/* ======================================================== */}
          {/* 5. YENİ: MOBİL GÖRÜNÜM (Switch Mantığı)                */}
          {/* ======================================================== */}
          <div className="block lg:hidden">
             {viewMode === 'list' ? (
               // LISTE MODU (MobileMediaItem)
               <div className="space-y-4">
                 {filteredItems.map(item => (
                    <MobileMediaItem 
                      key={item.id} 
                      item={item} 
                      refetch={refetch} 
                      onClick={() => setSelectedItem(item)} 
                    />
                 ))}
               </div>
             ) : (
               // IZGARA MODU (MediaCard)
               <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {filteredItems.map(item => (
                    <MediaCard key={item.id} item={item} refetch={refetch} />
                  ))}
               </div>
             )}
          </div>

          {/* MASAÜSTÜ GÖRÜNÜM (Değişmedi - Slider) */}
          <div className="hidden lg:block space-y-8 px-6">
            {chunkedItems.map((chunk, index) => (
               <div key={index} className="relative">
                  <MediaRowSlider items={chunk} refetch={refetch} rowIndex={index} />
               </div>
            ))}
          </div>

          {/* Load More Butonu */}
          {!isSearchActive && hasMoreItems && (
            <div className="flex justify-center py-8">
              <button onClick={loadMore} disabled={loadingMore} className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-800 transition-all transform hover:-translate-y-1">
                {loadingMore ? <FaSpinner className="animate-spin h-5 w-5" /> : <><span>Daha Fazla Yükle</span><FaArrowDown className="group-hover:animate-bounce" /></>}
              </button>
            </div>
          )}

          {filteredItems.length === 0 && !loading && (
            <EmptyState icon={<FaInbox />} title={searchQuery ? "Arama sonucu bulunamadı" : "Henüz kayıt yok"} description={searchQuery ? `"${searchQuery}" için sonuç yok.` : "Bu filtreye uygun kayıt yok."} />
          )}
          
          <DetailModal 
            isOpen={!!selectedItem} 
            onClose={() => setSelectedItem(null)} 
            item={selectedItem}
            refetch={refetch}
          />

        </div>
      )}
    </section>
  );
}