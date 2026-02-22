import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { FaFilm, FaTv, FaGamepad, FaBook, FaClone, FaEye, FaEyeSlash, FaGlobeAmericas, FaSearch, FaInbox, FaSortAlphaDown, FaStar, FaArrowDown, FaSpinner, FaCalendarAlt, FaTh, FaList, FaCheckSquare, FaRegSquare, FaTrash, FaFilePdf, FaTimes, FaCheck, FaClock, FaFilter, FaTheaterMasks } from 'react-icons/fa';
import type { MediaItem, FilterType, FilterStatus } from '../../backend/types/media';
import useMedia from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';
import DetailModal from '../components/DetailModal';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';
import { exportToPDF } from '../utils/pdfExport';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { useLanguage } from '../context/LanguageContext';

export default function MediaListPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const type: FilterType = (location.pathname.split('/')[1] as FilterType) || 'all';
  const filter: FilterStatus = (searchParams.get('filter') as FilterStatus) || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'rating' | 'title' | 'date' | 'releaseDate'>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Advanced Filters
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [ratingRange, setRatingRange] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Bulk Actions state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const isSearchActive = searchQuery.trim().length > 0;
  const isAdvancedFilterActive = genreFilter !== 'all' || ratingRange !== 'all' || yearFilter !== 'all';
  const { items, loading, refetch, loadMore, loadingMore, hasMoreItems } = useMedia(type, filter, isSearchActive || isAdvancedFilterActive, sortOption === 'date' ? 'createdAt' : 'rating');

  // Compute all available genres from items
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    items.forEach(item => {
      if (item.genre) {
        item.genre.split(', ').forEach(g => {
          const trimmed = g.trim();
          if (trimmed) genres.add(trimmed);
        });
      }
    });
    return Array.from(genres).sort();
  }, [items]);

  // Compute all available years from items (based on releaseDate)
  const allYears = useMemo(() => {
    const years = new Set<string>();
    items.forEach(item => {
      if (item.releaseDate) {
        // releaseDate format: "15 Jul 2022" or "2022-07-15" or "2022"
        const match = item.releaseDate.match(/\b(19|20)\d{2}\b/);
        if (match) {
          years.add(match[0]);
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a)); // En yeniden eskiye
  }, [items]);

  // useMemo kullanarak sıralama - sonsuz döngü önlenir
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Arama filtresi
    if (isSearchActive) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(lowerQuery));
    }

    // Yarıda Kalanlar filtresi - istemci tarafında (Firebase desteklemediği için)
    if (filter === 'in-progress') {
      result = result.filter(item =>
        item.type === 'series' &&
        item.totalSeasons &&
        item.watchedSeasons &&
        item.watchedSeasons.length > 0 &&
        item.watchedSeasons.length < item.totalSeasons
      );
    }

    // Genre filter
    if (genreFilter !== 'all') {
      result = result.filter(item => item.genre?.toLowerCase().includes(genreFilter.toLowerCase()));
    }

    // Rating range filter
    if (ratingRange !== 'all') {
      const [min, max] = ratingRange.split('-').map(Number);
      result = result.filter(item => {
        const rating = parseFloat(item.rating) || 0;
        return rating >= min && rating <= max;
      });
    }

    // Year filter (based on releaseDate)
    if (yearFilter !== 'all') {
      result = result.filter(item => {
        if (!item.releaseDate) return false;
        return item.releaseDate.includes(yearFilter);
      });
    }

    // Sadece seçilen kritere göre sırala (izlendi/izlenmedi karışık)
    result.sort((a, b) => {
      let comparison = 0;
      if (sortOption === 'rating') {
        comparison = Number(b.rating) - Number(a.rating);
      } else if (sortOption === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortOption === 'date') {
        comparison = (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      } else if (sortOption === 'releaseDate') {
        // Çıkış tarihine göre sırala (en yeni önce)
        const getYear = (dateStr?: string) => {
          if (!dateStr) return 0;
          const match = dateStr.match(/\b(19|20)\d{2}\b/);
          return match ? parseInt(match[0]) : 0;
        };
        comparison = getYear(b.releaseDate) - getYear(a.releaseDate);
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [items, searchQuery, sortOption, sortDirection, isSearchActive, filter, genreFilter, ratingRange, yearFilter]);

  // Modal senkronizasyonu
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
      else setSelectedItem(null); // Öğe silindiyse modalı kapat
    }
  }, [items, selectedItem]);

  const handleFilterChange = (newFilter: FilterStatus) => {
    refetch(); setSearchParams(prev => { prev.set('filter', newFilter); return prev; }, { replace: true });
  };

  const handleSortChange = (option: typeof sortOption) => {
    if (sortOption === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(option);
      // Başlık için varsayılan A-Z (asc), diğerleri için Yüksekten-Düşüğe (desc)
      setSortDirection(option === 'title' ? 'asc' : 'desc');
    }
  };

  // Bulk Actions handlers
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map(i => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkWatched = async (watched: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        updateDoc(doc(db, 'mediaItems', id), { watched })
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} ${t('bulk.markedAs')} ${watched ? t('media.watched') : t('media.notWatched')}`);
      clearSelection();
      refetch();
    } catch (error) {
      toast.error(t('toast.updateError'));
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} ${t('bulk.deleteConfirm')}`)) return;

    setBulkProcessing(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        deleteDoc(doc(db, 'mediaItems', id))
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} ${t('bulk.deleted')}`);
      clearSelection();
      refetch();
    } catch (error) {
      toast.error(t('toast.deleteError'));
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportPDF = () => {
    const typeName = type === 'all' ? 'Tum-Koleksiyonum' : type === 'movie' ? 'Filmlerim' : type === 'series' ? 'Dizilerim' : type === 'game' ? 'Oyunlarim' : 'Kitaplarim';
    exportToPDF(filteredItems, typeName);
    toast.success(t('bulk.pdfExported'));
  };

  return (
    <section className="py-6">
      {/* ✨ Ultra Modern Kontrol Paneli */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        {/* Modern Minimal Navbar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center justify-center flex-wrap gap-3">

            {/* Kategori İkonları */}
            <div className="flex items-center gap-1.5">
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'movie'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                to="/movie"
              >
                <FaFilm className={`text-lg transition-transform ${type !== 'movie' ? 'group-hover:animate-[wiggle_0.5s_ease-in-out_infinite]' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.movies')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'series'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                to="/series"
              >
                <FaTv className={`text-lg transition-transform ${type !== 'series' ? 'group-hover:animate-bounce' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.series')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'game'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                to="/game"
              >
                <FaGamepad className={`text-lg transition-transform ${type !== 'game' ? 'group-hover:animate-[shake_0.4s_ease-in-out_infinite]' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.games')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'book'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                to="/book"
              >
                <FaBook className={`text-lg transition-transform ${type !== 'book' ? 'group-hover:animate-pulse' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.books')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                to="/all"
              >
                <FaClone className={`text-lg transition-transform ${type !== 'all' ? 'group-hover:animate-spin' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.all')}
                </span>
              </Link>
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Durum Filtresi */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              <button
                title={t('list.all')}
                className={`p-2 rounded-md transition-all duration-200 ${filter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                onClick={() => handleFilterChange('all')}
              >
                <FaGlobeAmericas className="text-sm" />
              </button>
              <button
                title={t('list.watched')}
                className={`p-2 rounded-md transition-all duration-200 ${filter === 'watched'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                  : 'text-gray-400 hover:text-emerald-500'
                  }`}
                onClick={() => handleFilterChange('watched')}
              >
                <FaEye className="text-sm" />
              </button>
              {/* Yarıda Kalanlar - Sadece diziler için */}
              {type === 'series' && (
                <button
                  title={t('list.inProgress')}
                  className={`p-2 rounded-md transition-all duration-200 ${filter === 'in-progress'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-400 hover:text-amber-500'
                    }`}
                  onClick={() => handleFilterChange('in-progress')}
                >
                  <FaTv className="text-sm" />
                </button>
              )}
              <button
                title={t('list.notWatched')}
                className={`p-2 rounded-md transition-all duration-200 ${filter === 'not-watched'
                  ? 'bg-white dark:bg-gray-700 text-rose-600 shadow-sm'
                  : 'text-gray-400 hover:text-rose-500'
                  }`}
                onClick={() => handleFilterChange('not-watched')}
              >
                <FaEyeSlash className="text-sm" />
              </button>
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Sıralama */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              <button
                title={t('list.byRating')}
                className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1 ${sortOption === 'rating'
                  ? 'bg-white dark:bg-gray-700 text-amber-500 shadow-sm'
                  : 'text-gray-400 hover:text-amber-500'
                  }`}
                onClick={() => handleSortChange('rating')}
              >
                <FaStar className="text-sm" />
                {sortOption === 'rating' && (
                  <span className="text-[10px]">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                )}
              </button>
              <button
                title={t('list.byTitle')}
                className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1 ${sortOption === 'title'
                  ? 'bg-white dark:bg-gray-700 text-violet-600 shadow-sm'
                  : 'text-gray-400 hover:text-violet-500'
                  }`}
                onClick={() => handleSortChange('title')}
              >
                <FaSortAlphaDown className="text-sm" />
                {sortOption === 'title' && (
                  <span className="text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </button>
              <button
                title={t('list.byDate')}
                className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1 ${sortOption === 'date'
                  ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm'
                  : 'text-gray-400 hover:text-teal-500'
                  }`}
                onClick={() => handleSortChange('date')}
              >
                <FaCalendarAlt className="text-sm" />
                {sortOption === 'date' && (
                  <span className="text-[10px]">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                )}
              </button>
              <button
                title={t('list.byReleaseDate') || 'Çıkış Tarihine Göre'}
                className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1 ${sortOption === 'releaseDate'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                  : 'text-gray-400 hover:text-emerald-500'
                  }`}
                onClick={() => handleSortChange('releaseDate')}
              >
                <FaFilm className="text-sm" />
                {sortOption === 'releaseDate' && (
                  <span className="text-[10px]">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                )}
              </button>
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Görünüm */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              <button
                title={t('list.grid')}
                className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                onClick={() => setViewMode('grid')}
              >
                <FaTh className="text-sm" />
              </button>
              <button
                title={t('list.listView')}
                className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                onClick={() => setViewMode('list')}
              >
                <FaList className="text-sm" />
              </button>
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Arama */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('list.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 lg:w-40 px-3 py-2 pl-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 focus:outline-none transition-all placeholder:text-gray-400"
              />
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FaTimes className="h-2.5 w-2.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Gelişmiş Filtre Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-lg transition-all duration-200 relative ${showAdvancedFilters || isAdvancedFilterActive
                ? 'bg-violet-500 text-white'
                : 'text-gray-400 hover:text-violet-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              title={t('list.advancedFilters') || 'Gelişmiş Filtreler'}
            >
              <FaFilter className="text-sm" />
              {isAdvancedFilterActive && !showAdvancedFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
              )}
            </button>

            {/* Araçlar */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (selectionMode) {
                    clearSelection();
                  } else {
                    setSelectionMode(true);
                  }
                }}
                className={`p-2 rounded-lg transition-all duration-200 ${selectionMode
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                title={selectionMode ? t('bulk.cancelSelect') : t('bulk.selectMode')}
              >
                {selectionMode ? <FaTimes className="text-sm" /> : <FaCheckSquare className="text-sm" />}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredItems.length === 0}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title={t('bulk.exportPdf')}
              >
                <FaFilePdf className="text-sm" />
              </button>
            </div>

          </div>
        </div>

        {/* Gelişmiş Filtreler Paneli */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800/50">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Tür Filtresi */}
                  <div className="flex items-center gap-2">
                    <FaTheaterMasks className="text-violet-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('list.genreFilter') || 'Tür'}:</span>
                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="all">{t('list.all')}</option>
                      {allGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Puan Aralığı */}
                  <div className="flex items-center gap-2">
                    <FaStar className="text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('list.ratingFilter') || 'Puan'}:</span>
                    <select
                      value={ratingRange}
                      onChange={(e) => setRatingRange(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="all">{t('list.all')}</option>
                      <option value="9-10">★ 9-10 (Mükemmel)</option>
                      <option value="7-9">★ 7-9 (Çok İyi)</option>
                      <option value="5-7">★ 5-7 (İyi)</option>
                      <option value="3-5">★ 3-5 (Orta)</option>
                      <option value="0-3">★ 0-3 (Düşük)</option>
                    </select>
                  </div>

                  {/* Yıl Filtresi */}
                  {allYears.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-emerald-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('list.yearFilter') || 'Yıl'}:</span>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      >
                        <option value="all">{t('list.all')}</option>
                        {allYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Temizle Butonu */}
                  {isAdvancedFilterActive && (
                    <button
                      onClick={() => {
                        setGenreFilter('all');
                        setRatingRange('all');
                        setYearFilter('all');
                      }}
                      className="ml-auto px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
                    >
                      <FaTimes size={10} />
                      {t('list.clearFilters') || 'Filtreleri Temizle'}
                    </button>
                  )}
                </div>

                {/* Aktif Filtre Özeti */}
                {isAdvancedFilterActive && (
                  <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-700/50 flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
                    <span className="font-medium">{t('list.activeFilters') || 'Aktif Filtreler'}:</span>
                    {genreFilter !== 'all' && (
                      <span className="px-2 py-0.5 bg-violet-200 dark:bg-violet-800 rounded-full text-xs">{genreFilter}</span>
                    )}
                    {ratingRange !== 'all' && (
                      <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded-full text-xs">★ {ratingRange}</span>
                    )}
                    {yearFilter !== 'all' && (
                      <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 rounded-full text-xs">📅 {yearFilter}</span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">
                      {filteredItems.length} {t('list.results') || 'sonuç'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {selectedIds.size} {t('bulk.selected')}
            </span>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <FaRegSquare /> {t('bulk.selectAll')}
            </button>

            <button
              onClick={() => handleBulkWatched(true)}
              disabled={bulkProcessing}
              className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaEye /> {t('bulk.markWatched')}
            </button>

            <button
              onClick={() => handleBulkWatched(false)}
              disabled={bulkProcessing}
              className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaEyeSlash /> {t('bulk.markUnwatched')}
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaTrash /> {t('bulk.delete')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div
                  key={item.id}
                  onClick={() => selectionMode ? toggleSelection(item.id) : setSelectedItem(item)}
                  className={`cursor-pointer h-full relative ${selectionMode && selectedIds.has(item.id) ? 'ring-2 ring-sky-500 rounded-2xl' : ''}`}
                >
                  {/* Seçim Checkbox */}
                  {selectionMode && (
                    <div className="absolute top-3 left-3 z-20">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${selectedIds.has(item.id)
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/90 dark:bg-gray-800/90 border-2 border-gray-300 dark:border-gray-600'
                        }`}>
                        {selectedIds.has(item.id) && <FaCheckSquare />}
                      </div>
                    </div>
                  )}
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

                  {/* Çıkış Tarihi - Mobilde gizli */}
                  {item.releaseDate && (
                    <div className="shrink-0 hidden lg:flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <FaFilm size={10} />
                      <span>{item.releaseDate.match(/\b(19|20)\d{2}\b/)?.[0] || item.releaseDate}</span>
                    </div>
                  )}

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
                    {/* Diziler için 3 aşamalı durum */}
                    {item.type === 'series' && item.totalSeasons ? (
                      <>
                        {/* Mobil: Sadece İkon */}
                        <div className="sm:hidden">
                          {item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons ? (
                            <FaCheck className="text-emerald-500" size={16} title={t('media.watched')} />
                          ) : item.watchedSeasons && item.watchedSeasons.length > 0 ? (
                            <FaClock className="text-amber-500" size={16} title={t('media.inProgress')} />
                          ) : (
                            <FaTimes className="text-rose-500" size={16} title={t('media.notWatched')} />
                          )}
                        </div>
                        {/* Desktop: Badge */}
                        <span className={`hidden sm:inline-block text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : item.watchedSeasons && item.watchedSeasons.length > 0
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                          }`}>
                          {item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons
                            ? t('media.watched')
                            : item.watchedSeasons && item.watchedSeasons.length > 0
                              ? t('media.inProgress')
                              : t('media.notWatched')
                          }
                        </span>
                      </>
                    ) : (
                      <>
                        {/* Mobil: Sadece İkon */}
                        <div className="sm:hidden">
                          {item.watched ? (
                            <FaCheck className="text-emerald-500" size={16} title={t('media.watched')} />
                          ) : (
                            <FaTimes className="text-rose-500" size={16} title={t('media.notWatched')} />
                          )}
                        </div>
                        {/* Desktop: Badge */}
                        <span className={`hidden sm:inline-block text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${item.watched
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                          }`}>
                          {item.watched ? t('card.watched') : t('card.notWatched')}
                        </span>
                      </>
                    )}
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