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
      {/* ✨ Ultra Modern Kontrol Paneli */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        {/* Glassmorphism Container with Animated Border */}
        <div className="relative group">
          {/* Animated Gradient Border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-x" />

          <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-5 overflow-hidden">

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-sky-500/10 to-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-rose-500/10 to-amber-500/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col xl:flex-row gap-6">

              {/* 🎬 Kategori İkonları - Premium Design */}
              <div className="flex-shrink-0">
                <div className="flex items-center gap-1 mb-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('nav.categories') || 'Kategoriler'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Film */}
                  <Link
                    className={`group/icon relative p-4 rounded-2xl transition-all duration-500 transform ${type === 'movie'
                      ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 text-white shadow-xl shadow-rose-500/40 scale-110 -rotate-2'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500'
                      } hover:shadow-2xl hover:-translate-y-1`}
                    to="/movie"
                    title={t('nav.movies')}
                  >
                    <FaFilm className={`text-2xl transition-all duration-500 ${type === 'movie' ? 'animate-pulse drop-shadow-lg' : 'group-hover/icon:animate-[wiggle_0.5s_ease-in-out_infinite] group-hover/icon:scale-110'}`} />
                    {type === 'movie' && (
                      <>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                      </>
                    )}
                  </Link>

                  {/* Dizi */}
                  <Link
                    className={`group/icon relative p-4 rounded-2xl transition-all duration-500 transform ${type === 'series'
                      ? 'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-xl shadow-indigo-500/40 scale-110 rotate-2'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-500'
                      } hover:shadow-2xl hover:-translate-y-1`}
                    to="/series"
                    title={t('nav.series')}
                  >
                    <FaTv className={`text-2xl transition-all duration-500 ${type === 'series' ? 'animate-pulse drop-shadow-lg' : 'group-hover/icon:animate-[bounce_0.6s_ease-in-out_infinite] group-hover/icon:scale-110'}`} />
                    {type === 'series' && (
                      <>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                      </>
                    )}
                  </Link>

                  {/* Oyun */}
                  <Link
                    className={`group/icon relative p-4 rounded-2xl transition-all duration-500 transform ${type === 'game'
                      ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-xl shadow-emerald-500/40 scale-110 -rotate-2'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-500'
                      } hover:shadow-2xl hover:-translate-y-1`}
                    to="/game"
                    title={t('nav.games')}
                  >
                    <FaGamepad className={`text-2xl transition-all duration-500 ${type === 'game' ? 'animate-pulse drop-shadow-lg' : 'group-hover/icon:animate-[shake_0.4s_ease-in-out_infinite] group-hover/icon:scale-110'}`} />
                    {type === 'game' && (
                      <>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                      </>
                    )}
                  </Link>

                  {/* Kitap */}
                  <Link
                    className={`group/icon relative p-4 rounded-2xl transition-all duration-500 transform ${type === 'book'
                      ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white shadow-xl shadow-amber-500/40 scale-110 rotate-2'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-500'
                      } hover:shadow-2xl hover:-translate-y-1`}
                    to="/book"
                    title={t('nav.books')}
                  >
                    <FaBook className={`text-2xl transition-all duration-500 ${type === 'book' ? 'animate-pulse drop-shadow-lg' : 'group-hover/icon:animate-[flip_0.6s_ease-in-out_infinite] group-hover/icon:scale-110'}`} />
                    {type === 'book' && (
                      <>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                      </>
                    )}
                  </Link>

                  {/* Hepsi */}
                  <Link
                    className={`group/icon relative p-4 rounded-2xl transition-all duration-500 transform ${type === 'all'
                      ? 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white shadow-xl shadow-sky-500/40 scale-110'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-500'
                      } hover:shadow-2xl hover:-translate-y-1`}
                    to="/all"
                    title={t('nav.all')}
                  >
                    <FaClone className={`text-2xl transition-all duration-500 ${type === 'all' ? 'animate-pulse drop-shadow-lg' : 'group-hover/icon:animate-spin group-hover/icon:scale-110'}`} />
                    {type === 'all' && (
                      <>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                      </>
                    )}
                  </Link>
                </div>
              </div>

              {/* ✦ Dikey Gradient Ayraç */}
              <div className="hidden xl:flex items-center">
                <div className="w-px h-16 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
              </div>

              {/* 🎛️ Kontroller Grid */}
              <div className="flex-1 flex flex-wrap items-center gap-4">

                {/* 👁️ Durum Filtresi */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <FaEye className="text-[8px]" /> {t('list.status') || 'Durum'}
                  </span>
                  <div className="flex rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 p-1 gap-1">
                    <button
                      title={t('list.all')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${filter === 'all'
                        ? 'bg-white dark:bg-gray-700 text-sky-600 shadow-lg shadow-sky-500/20'
                        : 'text-gray-500 hover:text-sky-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => handleFilterChange('all')}
                    >
                      <FaGlobeAmericas className={`text-lg transition-transform ${filter === 'all' ? 'scale-110' : 'group-hover/btn:scale-110 group-hover/btn:rotate-12'}`} />
                    </button>
                    <button
                      title={t('list.watched')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${filter === 'watched'
                        ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-lg shadow-emerald-500/20'
                        : 'text-gray-500 hover:text-emerald-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => handleFilterChange('watched')}
                    >
                      <FaEye className={`text-lg transition-transform ${filter === 'watched' ? 'scale-110' : 'group-hover/btn:scale-125'}`} />
                    </button>
                    <button
                      title={t('list.notWatched')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${filter === 'not-watched'
                        ? 'bg-white dark:bg-gray-700 text-rose-600 shadow-lg shadow-rose-500/20'
                        : 'text-gray-500 hover:text-rose-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => handleFilterChange('not-watched')}
                    >
                      <FaEyeSlash className={`text-lg transition-transform ${filter === 'not-watched' ? 'scale-110' : 'group-hover/btn:scale-110'}`} />
                    </button>
                  </div>
                </div>

                {/* ⭐ Sıralama */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <FaStar className="text-[8px]" /> {t('list.sort') || 'Sırala'}
                  </span>
                  <div className="flex rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 p-1 gap-1">
                    <button
                      title={t('list.byRating')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${sortOption === 'rating'
                        ? 'bg-white dark:bg-gray-700 text-amber-500 shadow-lg shadow-amber-500/20'
                        : 'text-gray-500 hover:text-amber-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => setSortOption('rating')}
                    >
                      <FaStar className={`text-lg transition-all ${sortOption === 'rating' ? 'scale-110 animate-pulse' : 'group-hover/btn:scale-125 group-hover/btn:rotate-[20deg]'}`} />
                    </button>
                    <button
                      title={t('list.byTitle')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${sortOption === 'title'
                        ? 'bg-white dark:bg-gray-700 text-violet-600 shadow-lg shadow-violet-500/20'
                        : 'text-gray-500 hover:text-violet-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => setSortOption('title')}
                    >
                      <FaSortAlphaDown className={`text-lg transition-transform ${sortOption === 'title' ? 'scale-110' : 'group-hover/btn:scale-110'}`} />
                    </button>
                    <button
                      title={t('list.byDate')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${sortOption === 'date'
                        ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-lg shadow-teal-500/20'
                        : 'text-gray-500 hover:text-teal-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => setSortOption('date')}
                    >
                      <FaCalendarAlt className={`text-lg transition-transform ${sortOption === 'date' ? 'scale-110' : 'group-hover/btn:scale-110 group-hover/btn:-rotate-6'}`} />
                    </button>
                  </div>
                </div>

                {/* 📐 Görünüm */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <FaTh className="text-[8px]" /> {t('list.view') || 'Görünüm'}
                  </span>
                  <div className="flex rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 p-1 gap-1">
                    <button
                      title={t('list.grid')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-700 text-sky-600 shadow-lg shadow-sky-500/20'
                        : 'text-gray-500 hover:text-sky-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => setViewMode('grid')}
                    >
                      <FaTh className={`text-lg transition-transform ${viewMode === 'grid' ? 'scale-110' : 'group-hover/btn:scale-110'}`} />
                    </button>
                    <button
                      title={t('list.listView')}
                      className={`group/btn p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 text-sky-600 shadow-lg shadow-sky-500/20'
                        : 'text-gray-500 hover:text-sky-500 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      onClick={() => setViewMode('list')}
                    >
                      <FaList className={`text-lg transition-transform ${viewMode === 'list' ? 'scale-110' : 'group-hover/btn:scale-110'}`} />
                    </button>
                  </div>
                </div>

                {/* 🔍 Arama */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <FaSearch className="text-[8px]" /> {t('list.search') || 'Ara'}
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('list.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-36 lg:w-44 px-3 py-2.5 pl-9 rounded-2xl border-0 bg-gray-100/80 dark:bg-gray-800/60 text-sm focus:ring-2 focus:ring-sky-500/50 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all duration-300 placeholder:text-gray-400"
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      >
                        <FaTimes className="h-3 w-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 🛠️ Araçlar */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('list.tools') || 'Araçlar'}</span>
                  <div className="flex gap-2">
                    {/* Seçim Modu */}
                    <button
                      onClick={() => {
                        if (selectionMode) {
                          clearSelection();
                        } else {
                          setSelectionMode(true);
                        }
                      }}
                      className={`group/btn p-2.5 rounded-2xl transition-all duration-300 ${selectionMode
                        ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/40'
                        : 'bg-gray-100/80 dark:bg-gray-800/60 text-gray-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30'
                        }`}
                      title={selectionMode ? t('bulk.cancelSelect') : t('bulk.selectMode')}
                    >
                      {selectionMode
                        ? <FaTimes className="text-lg animate-spin" />
                        : <FaCheckSquare className="text-lg group-hover/btn:scale-110 transition-transform" />
                      }
                    </button>

                    {/* PDF Export */}
                    <button
                      onClick={handleExportPDF}
                      disabled={filteredItems.length === 0}
                      className="group/btn p-2.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100/80"
                      title={t('bulk.exportPdf')}
                    >
                      <FaFilePdf className="text-lg group-hover/btn:scale-110 group-hover/btn:-rotate-6 transition-transform" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
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