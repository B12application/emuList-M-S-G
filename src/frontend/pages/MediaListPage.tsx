// src/pages/MediaListPage.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { FaFilm, FaTv, FaGamepad, FaBook, FaClone, FaEye, FaEyeSlash, FaGlobeAmericas, FaSearch, FaInbox, FaSortAlphaDown, FaStar, FaArrowDown, FaSpinner, FaCalendarAlt, FaTh, FaList } from 'react-icons/fa';
import type { MediaItem, FilterType, FilterStatus } from '../../backend/types/media';
import useMedia from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';
import DetailModal from '../components/DetailModal';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';

import { useLanguage } from '../context/LanguageContext';

export default function MediaListPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const type: FilterType = (location.pathname.split('/')[1] as FilterType) || 'all';
  const filter: FilterStatus = (searchParams.get('filter') as FilterStatus) || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [sortOption, setSortOption] = useState<'rating' | 'title' | 'date'>('rating');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isSearchActive = searchQuery.trim().length > 0;
  const { items, loading, refetch, loadMore, loadingMore, hasMoreItems } = useMedia(type, filter, isSearchActive, sortOption === 'date' ? 'createdAt' : 'rating');

  useEffect(() => {
    let result = [...items];
    if (isSearchActive) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(lowerQuery));
    }

    // Çoklu sıralama: Önce izlenmemiş (watched:false), sonra izlenmiş (watched:true)
    // Her iki grup içinde seçilen sıralama kriterine göre sırala
    result.sort((a, b) => {
      // 1. Öncelik: İzlenme durumu (izlenmemiş önce)
      if (a.watched !== b.watched) {
        return a.watched ? 1 : -1; // watched=false önce gelsin
      }

      // 2. Öncelik: Seçilen sıralama kriteri
      if (sortOption === 'rating') {
        return Number(b.rating) - Number(a.rating);
      } else if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortOption === 'date') {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
      return 0;
    });

    setFilteredItems(result);
  }, [items, searchQuery, sortOption, isSearchActive]);

  // === 1. YENİ: SENKRONİZASYON (Modal açıkken veri güncellenirse) ===
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [items]);

  const getActiveTab = (t: FilterType) => type === t ? "text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  const getActiveFilter = (f: FilterStatus) => filter === f ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  const getActiveSort = (s: 'rating' | 'title' | 'date') => sortOption === s ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";

  const handleFilterChange = (newFilter: FilterStatus) => {
    refetch(); setSearchParams(prev => { prev.set('filter', newFilter); return prev; }, { replace: true });
  };

  return (
    <section className="py-6">
      {/* Yeni Modern Başlık ve Navigasyon */}
      <div className="mb-8">

        {/* Ana Kontrol Paneli - Modern Card Tasarımı */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Sol: Kategori Tabları */}
            <div className="flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                <Link className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${getActiveTab("movie")} hover:shadow-md`} to="/movie">
                  <FaFilm /> {t('nav.movies')}
                </Link>
                <Link className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${getActiveTab("series")} hover:shadow-md`} to="/series">
                  <FaTv /> {t('nav.series')}
                </Link>
                <Link className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${getActiveTab("game")} hover:shadow-md`} to="/game">
                  <FaGamepad /> {t('nav.games')}
                </Link>
                <Link className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${getActiveTab("book")} hover:shadow-md`} to="/book">
                  <FaBook /> {t('nav.books')}
                </Link>
                <Link className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${getActiveTab("all")} hover:shadow-md`} to="/all">
                  <FaClone /> {t('nav.all')}
                </Link>
              </div>
            </div>

            {/* Dikey Ayraç */}
            <div className="hidden lg:block w-px bg-gray-200 dark:bg-gray-700" />

            {/* Sağ: Filtreler ve Kontroller */}
            <div className="flex-1 flex flex-wrap items-center gap-2">

              {/* Durum Filtresi */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden lg:inline">{t('list.status')}:</span>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                  <button title={t('list.all')} className={`px-3 py-2 text-sm transition ${getActiveFilter("all")}`} onClick={() => handleFilterChange('all')}>
                    <FaGlobeAmericas />
                  </button>
                  <button title={t('list.watched')} className={`px-3 py-2 text-sm transition ${getActiveFilter("watched")}`} onClick={() => handleFilterChange('watched')}>
                    <FaEye />
                  </button>
                  <button title={t('list.notWatched')} className={`px-3 py-2 text-sm transition ${getActiveFilter("not-watched")}`} onClick={() => handleFilterChange('not-watched')}>
                    <FaEyeSlash />
                  </button>
                </div>
              </div>

              {/* Sıralama */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden lg:inline">{t('list.sortBy')}:</span>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                  <button title={t('list.byRating')} className={`px-3 py-2 text-sm transition ${getActiveSort('rating')}`} onClick={() => setSortOption('rating')}>
                    <FaStar />
                  </button>
                  <button title={t('list.byTitle')} className={`px-3 py-2 text-sm transition ${getActiveSort('title')}`} onClick={() => setSortOption('title')}>
                    <FaSortAlphaDown />
                  </button>
                  <button title={t('list.byDate')} className={`px-3 py-2 text-sm transition ${getActiveSort('date')}`} onClick={() => setSortOption('date')}>
                    <FaCalendarAlt />
                  </button>
                </div>
              </div>

              {/* Görünüm */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden lg:inline">{t('list.view')}:</span>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                  <button title={t('list.grid')} className={`px-3 py-2 text-sm transition ${viewMode === 'grid' ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setViewMode('grid')}>
                    <FaTh />
                  </button>
                  <button title={t('list.listView')} className={`px-3 py-2 text-sm transition ${viewMode === 'list' ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setViewMode('list')}>
                    <FaList />
                  </button>
                </div>
              </div>

              {/* Arama */}
              <div className="relative flex-1 min-w-[150px]">
                <input
                  type="text"
                  placeholder={t('list.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ... (Yükleniyor ve Liste) ... */}
      {loading ? (
        <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {/* Grid Görünümü - Kartlar */}
          {viewMode === 'grid' && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map(item => (
                <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer h-full">
                  <MediaCard item={item} refetch={refetch} />
                </div>
              ))}
            </div>
          )}

          {/* Liste Görünümü - Satır Satır */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${idx !== filteredItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                    }`}
                >
                  {/* Küçük Resim */}
                  <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {item.type === 'movie' && <FaFilm size={24} />}
                        {item.type === 'series' && <FaTv size={24} />}
                        {item.type === 'game' && <FaGamepad size={24} />}
                        {item.type === 'book' && <FaBook size={24} />}
                      </div>
                    )}
                  </div>

                  {/* Başlık ve Açıklama */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1 text-sm sm:text-base">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                      {item.description || t('card.noDescription')}
                    </p>
                  </div>

                  {/* Tür Badge - Mobilde gizli */}
                  <div className="shrink-0 hidden md:block">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-sky-500 text-white shadow-sm">
                      {item.type}
                    </span>
                  </div>

                  {/* Puan - Sabit Genişlik */}
                  <div className="shrink-0 w-16 flex items-center justify-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                    <FaStar size={14} />
                    <span className="font-semibold">{item.rating}</span>
                  </div>


                  {/* Durum - Sabit Genişlik */}
                  <div className="shrink-0 w-24 flex items-center justify-center">
                    {/* Mobil: Sadece İkon */}
                    <div className="sm:hidden">
                      {item.watched ? (
                        <FaEye className="text-emerald-600 dark:text-emerald-400" size={18} title="İzlendi" />
                      ) : (
                        <FaEyeSlash className="text-rose-600 dark:text-rose-400" size={18} title="İzlenmedi" />
                      )}
                    </div>
                    {/* Desktop: Badge */}
                    <span className={`hidden sm:inline-block text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${item.watched
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                      }`}>
                      {item.watched ? t('card.watched') : t('card.notWatched')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearchActive && hasMoreItems && (
            <div className="flex justify-center py-8">
              <button onClick={loadMore} disabled={loadingMore} className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-800 transition-all transform hover:-translate-y-1">
                {loadingMore ? <FaSpinner className="animate-spin h-5 w-5" /> : <><span>{t('actions.loadMore')}</span><FaArrowDown className="group-hover:animate-bounce" /></>}
              </button>
            </div>
          )}

          {!isSearchActive && !hasMoreItems && items.length > 0 && (
            <div className="py-4 text-center text-sm text-gray-400 dark:text-gray-600">{t('list.endOfList')}</div>
          )}

          {filteredItems.length === 0 && !loading && (
            <EmptyState icon={<FaInbox />} title={searchQuery ? t('create.noResults') : t('list.noItems')} description={searchQuery ? `"${searchQuery}" ${t('create.tryDifferent')}` : t('list.filterNoItems')} />
          )}

        </div>
      )}

      {/* === 2. DÜZELTME: Modal 'loading' DIŞINA TAŞINDI === */}
      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        refetch={refetch}
      />

    </section>
  );
}