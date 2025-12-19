import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { FaFilm, FaTv, FaGamepad, FaBook, FaClone, FaEye, FaEyeSlash, FaGlobeAmericas, FaSearch, FaInbox, FaSortAlphaDown, FaStar, FaArrowDown, FaSpinner, FaCalendarAlt, FaTh, FaList, FaCheckSquare, FaRegSquare, FaTrash, FaFilePdf, FaTimes } from 'react-icons/fa';
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
  const [sortOption, setSortOption] = useState<'rating' | 'title' | 'date'>('rating');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Bulk Actions state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const isSearchActive = searchQuery.trim().length > 0;
  const { items, loading, refetch, loadMore, loadingMore, hasMoreItems } = useMedia(type, filter, isSearchActive, sortOption === 'date' ? 'createdAt' : 'rating');

  // useMemo kullanarak sıralama - sonsuz döngü önlenir
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Arama filtresi
    if (isSearchActive) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(lowerQuery));
    }

    // Sadece seçilen kritere göre sırala (izlendi/izlenmedi karışık)
    result.sort((a, b) => {
      if (sortOption === 'rating') {
        return Number(b.rating) - Number(a.rating);
      } else if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortOption === 'date') {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, sortOption, isSearchActive]);

  // Modal senkronizasyonu
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [items, selectedItem]);

  const getActiveTab = (t: FilterType) => type === t ? "text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  const getActiveFilter = (f: FilterStatus) => filter === f ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";
  const getActiveSort = (s: 'rating' | 'title' | 'date') => sortOption === s ? "text-sky-600 bg-gray-100 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-800";

  const handleFilterChange = (newFilter: FilterStatus) => {
    refetch(); setSearchParams(prev => { prev.set('filter', newFilter); return prev; }, { replace: true });
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

            {/* Sağ: Filtreler ve Kontroller - TEK SATIR */}
            <div className="flex items-center gap-2 overflow-x-auto">

              {/* Durum Filtresi */}
              <div className="flex items-center gap-1.5 shrink-0">
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
              <div className="flex items-center gap-1.5 shrink-0">
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
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                  <button title={t('list.grid')} className={`px-3 py-2 text-sm transition ${viewMode === 'grid' ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setViewMode('grid')}>
                    <FaTh />
                  </button>
                  <button title={t('list.listView')} className={`px-3 py-2 text-sm transition ${viewMode === 'list' ? 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-sky-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => setViewMode('list')}>
                    <FaList />
                  </button>
                </div>
              </div>

              {/* Arama - Daha Kompakt */}
              <div className="relative shrink-0 w-32 lg:w-36">
                <input
                  type="text"
                  placeholder={t('list.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 py-2 pl-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
                <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              </div>

              {/* Seçim Modu Toggle */}
              <button
                onClick={() => {
                  if (selectionMode) {
                    clearSelection();
                  } else {
                    setSelectionMode(true);
                  }
                }}
                className={`p-2 rounded-lg transition shrink-0 ${selectionMode
                  ? 'bg-sky-500 text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                title={selectionMode ? t('bulk.cancelSelect') : t('bulk.selectMode')}
              >
                {selectionMode ? <FaTimes /> : <FaCheckSquare />}
              </button>

              {/* PDF Export */}
              <button
                onClick={handleExportPDF}
                disabled={filteredItems.length === 0}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('bulk.exportPdf')}
              >
                <FaFilePdf />
              </button>

            </div>
          </div>
        </div>
      </div>

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