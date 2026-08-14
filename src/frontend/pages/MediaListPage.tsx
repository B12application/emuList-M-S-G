import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { FaFilm, FaTv, FaGamepad, FaBook, FaClone, FaEye, FaEyeSlash, FaGlobeAmericas, FaSearch, FaInbox, FaSortAlphaDown, FaStar, FaArrowDown, FaArrowUp, FaExchangeAlt, FaSpinner, FaCalendarAlt, FaTh, FaList, FaCheckSquare, FaRegSquare, FaTrash, FaFilePdf, FaTimes, FaCheck, FaClock, FaFilter, FaTheaterMasks, FaSort, FaSave } from 'react-icons/fa';
import type { MediaItem, FilterType, FilterStatus } from '../../backend/types/media';
import useMedia from '../hooks/useMedia';
import MediaCard from '../components/MediaCard';
import MediaListItem from '../components/MediaListItem';
import DetailModal from '../components/DetailModal';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';
import { exportToPDF } from '../utils/pdfExport';
import { doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getSeriesProgress } from '../../backend/services/episodeTrackingService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useLanguage } from '../context/LanguageContext';

// ─── Sortable Game List Item (Mobile & Desktop Friendly) ───────────────────────
function SortableGameListItem({
  item,
  rank,
  totalItems,
  onMoveUp,
  onMoveDown,
  onMoveToRank,
}: {
  item: MediaItem;
  rank: number;
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToRank: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'ring-2 ring-violet-500 scale-[1.01] shadow-xl z-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="p-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 rounded-xl cursor-grab active:cursor-grabbing hover:bg-stone-200 dark:hover:bg-zinc-700 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
        title="Sürüklemek için basılı tutun"
      >
        <FaSort size={15} />
      </div>

      {/* Rank Badge */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 font-black text-white text-xs shadow-sm">
        {rank}
      </div>

      {/* Image */}
      <div className="w-12 h-16 rounded-lg bg-stone-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-stone-100 dark:border-zinc-800">
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <FaGamepad size={20} />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-stone-900 dark:text-white truncate text-sm sm:text-base">
          {item.title}
        </h4>
        <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-zinc-500 tracking-wider">
          Oyun
        </span>
      </div>

      {/* Nudge / Move Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Move Up */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={rank === 1}
          className="p-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Yukarı taşı"
        >
          <FaArrowUp size={12} />
        </button>

        {/* Move Down */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={rank === totalItems}
          className="p-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Aşağı taşı"
        >
          <FaArrowDown size={12} />
        </button>

        {/* Move to Rank button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveToRank();
          }}
          className="p-2 bg-violet-500/10 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 rounded-xl hover:bg-violet-500/20 transition-colors flex items-center gap-1 text-xs font-bold"
          title="Belirli bir sıraya taşı"
        >
          <FaExchangeAlt size={10} />
          <span className="hidden sm:inline">Konum</span>
        </button>
      </div>
    </div>
  );
}

// ─── Sortable Game Card Wrapper ──────────────────────────────────────────────
function SortableGameCard({
  item,
  rank,
  selectionMode,
  selectedIds,
  toggleSelection,
  setSelectedItem,
  refetch,
}: {
  item: MediaItem;
  rank: number;
  selectionMode: boolean;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  setSelectedItem: (item: MediaItem) => void;
  refetch: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative cursor-pointer h-full ${
        selectionMode && selectedIds.has(item.id) ? 'ring-2 ring-sky-500 rounded-2xl' : ''
      } ${isDragging ? 'scale-[1.03] shadow-2xl rounded-2xl' : ''}`}
      onClick={() => (selectionMode ? toggleSelection(item.id) : setSelectedItem(item))}
    >
      {/* Drag Handle — sağ üst köşe */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 z-30 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white cursor-grab active:cursor-grabbing transition-colors"
        title="Sıralamak için sürükle"
      >
        <FaSort size={11} />
      </div>

      {/* Sıra Rozeti */}
      <div className="absolute top-2 left-2 z-30 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
        <span className="text-[10px] font-black text-white leading-none">{rank}</span>
      </div>

      {/* Seçim Checkbox */}
      {selectionMode && (
        <div className="absolute top-3 left-10 z-20">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              selectedIds.has(item.id)
                ? 'bg-sky-500 text-white'
                : 'bg-white/90 dark:bg-zinc-800/90 border-2 border-gray-300 dark:border-zinc-600'
            }`}
          >
            {selectedIds.has(item.id) && <FaCheckSquare />}
          </div>
        </div>
      )}

      <MediaCard item={item} refetch={refetch} />
    </div>
  );
}

export default function MediaListPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const type: FilterType = (location.pathname.split('/')[1] as FilterType) || 'all';
  const filter: FilterStatus = (searchParams.get('filter') as FilterStatus) || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'rating' | 'title' | 'date' | 'releaseDate' | 'order'>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Advanced Filters
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [ratingRange, setRatingRange] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Game sort mode state
  const [gameSortMode, setGameSortMode] = useState(false);
  const [gameOrderedItems, setGameOrderedItems] = useState<MediaItem[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Bulk Actions state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const isSearchActive = searchQuery.trim().length > 0;
  const isAdvancedFilterActive = genreFilter !== 'all' || ratingRange !== 'all' || yearFilter !== 'all';
  // We fetch 'all' items if the filter is 'watched' so we can locally include series with 100% progress
  const fetchFilter = filter === 'watched' ? 'all' : filter;
  // Game sort mode: fetch all to allow full reorder
  const isGameSortMode = type === 'game' && gameSortMode;
  const { items, loading, refetch, loadMore, loadingMore, hasMoreItems } = useMedia(type, fetchFilter, isSearchActive || isAdvancedFilterActive || filter === 'watched' || isGameSortMode);

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

    // Local 'watched' filter evaluation for series completion
    if (filter === 'watched') {
      result = result.filter(item => {
        const progress = getSeriesProgress(item);
        return item.watched || progress.percentage === 100;
      });
    }

    // Arama filtresi
    if (isSearchActive) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(lowerQuery));
    }

    // Yarıda Kalanlar filtresi - istemci tarafında (Firebase desteklemediği için)
    if (filter === 'in-progress') {
      result = result.filter(item => {
        if (item.type !== 'series') return false;
        
        const progress = getSeriesProgress(item);
        const isFullyWatched = item.watched || progress.percentage === 100;

        // Sezon bazlı takip: en az 1 sezon izlenmiş ama hepsi değil
        const hasPartialSeasons =
          item.totalSeasons &&
          item.watchedSeasons &&
          item.watchedSeasons.length > 0 &&
          item.watchedSeasons.length < item.totalSeasons;
        // Bölüm bazlı takip: en az 1 bölüm izlenmiş ama tümü değil
        const hasWatchedEpisodes =
          item.watchedEpisodes &&
          Object.values(item.watchedEpisodes).some(eps => eps.length > 0);
          
        return (hasPartialSeasons || hasWatchedEpisodes || progress.totalWatched > 0) && !isFullyWatched;
      });
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
    if (sortOption === 'order') {
      // queueOrder'a göre sırala; atanmamışlar sona
      result.sort((a, b) => {
        const oa = a.queueOrder ?? 99999;
        const ob = b.queueOrder ?? 99999;
        return oa - ob;
      });
    } else {
      result.sort((a, b) => {
        let comparison = 0;
        if (sortOption === 'rating') {
          comparison = Number(b.rating) - Number(a.rating);
        } else if (sortOption === 'title') {
          comparison = a.title.localeCompare(b.title);
        } else if (sortOption === 'date') {
          comparison = (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        } else if (sortOption === 'releaseDate') {
          const getYear = (dateStr?: string) => {
            if (!dateStr) return 0;
            const match = dateStr.match(/\b(19|20)\d{2}\b/);
            return match ? parseInt(match[0]) : 0;
          };
          comparison = getYear(b.releaseDate) - getYear(a.releaseDate);
        }
        return sortDirection === 'asc' ? -comparison : comparison;
      });
    }

    return result;
  }, [items, searchQuery, sortOption, sortDirection, isSearchActive, filter, genreFilter, ratingRange, yearFilter]);

  // Game sort mode — sıralı liste (yalnızca sıralama modu açıldığında bir kez ilk değer atanır)
  useEffect(() => {
    if (isGameSortMode) {
      setGameOrderedItems(filteredItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameSortMode]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveItem = useCallback((index: number, newIndex: number) => {
    if (newIndex < 0 || newIndex >= gameOrderedItems.length) return;
    setGameOrderedItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(newIndex, 0, moved);
      return copy;
    });
  }, [gameOrderedItems.length]);

  const handleMoveToRankPrompt = useCallback((currentIndex: number) => {
    const input = prompt(`Bu oyunu kaçıncı sıraya taşımak istersiniz? (1 - ${gameOrderedItems.length}):`, (currentIndex + 1).toString());
    if (input === null) return;
    const targetRank = parseInt(input, 10);
    if (isNaN(targetRank) || targetRank < 1 || targetRank > gameOrderedItems.length) {
      toast.error('Geçersiz sıra numarası.');
      return;
    }
    moveItem(currentIndex, targetRank - 1);
  }, [gameOrderedItems.length, moveItem]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setGameOrderedItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const saveGameOrder = async () => {
    if (gameOrderedItems.length === 0) return;
    setIsSavingOrder(true);
    try {
      const batch = writeBatch(db);
      gameOrderedItems.forEach((item, index) => {
        batch.update(doc(db, 'mediaItems', item.id), { queueOrder: index + 1 });
      });
      await batch.commit();
      await refetch();
      toast.success('Oyun sıralaması kaydedildi! 🎮');
      setGameSortMode(false);
      setSortOption('order');
    } catch {
      toast.error('Sıralama kaydedilemedi.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Modal senkronizasyonu
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
      else setSelectedItem(null); // Öğe silindiyse modalı kapat
    }
  }, [items, selectedItem]);

  // Deep link support: auto-open detail modal if openMediaId is in URL
  useEffect(() => {
    const openMediaId = searchParams.get('openMediaId');
    if (openMediaId && items.length > 0 && !selectedItem) {
      const itemToOpen = items.find(i => i.id === openMediaId);
      if (itemToOpen) {
        setSelectedItem(itemToOpen);
      }
    }
  }, [searchParams, items, selectedItem]);

  const handleFilterChange = (newFilter: FilterStatus) => {
    refetch(); setSearchParams(prev => { prev.set('filter', newFilter); return prev; }, { replace: true });
  };

  const handleSortChange = (option: typeof sortOption) => {
    // Sıralama modu açıkken diğer sortlara geçişi engelle
    if (gameSortMode) return;
    if (sortOption === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(option);
      setSortDirection(option === 'title' ? 'asc' : 'desc');
    }
  };

  const toggleGameSortMode = () => {
    if (gameSortMode) {
      // İptal et
      setGameSortMode(false);
    } else {
      setGameSortMode(true);
      setSortOption('order');
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
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-stone-300 dark:border-zinc-800 px-4 py-3">
          <div className="flex items-center justify-center flex-wrap gap-3">

            {/* Kategori İkonları */}
            <div className="flex items-center gap-1.5">
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'movie'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800'
                  }`}
                to="/movie"
              >
                <FaFilm className={`text-lg transition-transform ${type !== 'movie' ? 'group-hover:animate-[wiggle_0.5s_ease-in-out_infinite]' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-stone-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.movies')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'series'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800'
                  }`}
                to="/series"
              >
                <FaTv className={`text-lg transition-transform ${type !== 'series' ? 'group-hover:animate-bounce' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-stone-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.series')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'game'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800'
                  }`}
                to="/game"
              >
                <FaGamepad className={`text-lg transition-transform ${type !== 'game' ? 'group-hover:animate-[shake_0.4s_ease-in-out_infinite]' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-stone-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.games')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'book'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800'
                  }`}
                to="/book"
              >
                <FaBook className={`text-lg transition-transform ${type !== 'book' ? 'group-hover:animate-pulse' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-stone-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.books')}
                </span>
              </Link>
              <Link
                className={`group relative p-2.5 rounded-lg transition-all duration-200 ${type === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800'
                  }`}
                to="/all"
              >
                <FaClone className={`text-lg transition-transform ${type !== 'all' ? 'group-hover:animate-spin' : ''}`} />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-stone-800 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {t('nav.all')}
                </span>
              </Link>
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />

            {/* Durum Filtresi */}
            <div className="flex items-center bg-stone-200 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                title={t('list.all')}
                className={`p-2 rounded-md transition-all duration-200 ${filter === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
                  }`}
                onClick={() => handleFilterChange('all')}
              >
                <FaGlobeAmericas className="text-sm" />
              </button>
              <button
                title={t('list.watched')}
                className={`p-2 rounded-md transition-all duration-200 ${filter === 'watched'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm'
                  : 'text-stone-400 hover:text-emerald-500'
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
                    ? 'bg-white dark:bg-zinc-700 text-amber-600 shadow-sm'
                    : 'text-stone-400 hover:text-amber-500'
                    }`}
                  onClick={() => handleFilterChange('in-progress')}
                >
                  <FaTv className="text-sm" />
                </button>
              )}
              <button
                title={t('list.notWatched')}
                className={`p-2 rounded-md transition-all duration-200 ${filter === 'not-watched'
                  ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-sm'
                  : 'text-stone-400 hover:text-amber-700'
                  }`}
                onClick={() => handleFilterChange('not-watched')}
              >
                <FaEyeSlash className="text-sm" />
              </button>
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />

            {/* Sıralama */}
            <div className="flex items-center bg-stone-200 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                title={t('list.byRating')}
                className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1 ${sortOption === 'rating'
                  ? 'bg-white dark:bg-zinc-700 text-amber-500 shadow-sm'
                  : 'text-stone-400 hover:text-amber-500'
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
                  ? 'bg-white dark:bg-zinc-700 text-violet-600 shadow-sm'
                  : 'text-stone-400 hover:text-violet-500'
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
                  ? 'bg-white dark:bg-zinc-700 text-teal-600 shadow-sm'
                  : 'text-stone-400 hover:text-teal-500'
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
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm'
                  : 'text-stone-400 hover:text-emerald-500'
                  } ${gameSortMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => handleSortChange('releaseDate')}
                disabled={gameSortMode}
              >
                <FaFilm className="text-sm" />
                {sortOption === 'releaseDate' && (
                  <span className="text-[10px]">{sortDirection === 'desc' ? '▼' : '▲'}</span>
                )}
              </button>

              {/* Sıra Sıralama - her zaman oyunlar için göster */}
              {type === 'game' && !gameSortMode && (
                <button
                  title="Sıralama önceliğine göre"
                  className={`p-2 rounded-md transition-all duration-200 flex items-center gap-1 ${sortOption === 'order'
                    ? 'bg-white dark:bg-zinc-700 text-violet-600 shadow-sm'
                    : 'text-stone-400 hover:text-violet-500'
                    }`}
                  onClick={() => handleSortChange('order')}
                >
                  <FaSort className="text-sm" />
                  {sortOption === 'order' && (
                    <span className="text-[10px]">▲</span>
                  )}
                </button>
              )}
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />

            {/* Görünüm */}
            <div className="flex items-center bg-stone-200 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                title={t('list.grid')}
                className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
                  }`}
                onClick={() => setViewMode('grid')}
              >
                <FaTh className="text-sm" />
              </button>
              <button
                title={t('list.listView')}
                className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'
                  }`}
                onClick={() => setViewMode('list')}
              >
                <FaList className="text-sm" />
              </button>
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />

            {/* Arama */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('list.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 lg:w-40 px-3 py-2 pl-8 rounded-lg border border-stone-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 focus:outline-none transition-all placeholder:text-stone-400"
              />
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-stone-200 dark:hover:bg-zinc-700 transition"
                >
                  <FaTimes className="h-2.5 w-2.5 text-stone-400" />
                </button>
              )}
            </div>

            {/* Ayraç */}
            <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />

            {/* Gelişmiş Filtre Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-lg transition-all duration-200 relative ${showAdvancedFilters || isAdvancedFilterActive
                ? 'bg-violet-500 text-white'
                : 'text-stone-400 hover:text-violet-500 hover:bg-stone-200 dark:hover:bg-zinc-800'
                }`}
              title={t('list.advancedFilters') || 'Gelişmiş Filtreler'}
            >
              <FaFilter className="text-sm" />
              {isAdvancedFilterActive && !showAdvancedFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
              )}
            </button>

            {/* Oyun Sıralama Modu Butonu */}
            {type === 'game' && (
              <>
                <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />
                <button
                  onClick={toggleGameSortMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    gameSortMode
                      ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                      : 'text-stone-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 bg-stone-200 dark:bg-zinc-800'
                  }`}
                  title={gameSortMode ? 'Sıralama modunu kapat' : 'Oyunları sırala'}
                >
                  <FaSort className="text-sm" />
                  <span className="hidden sm:inline">{gameSortMode ? 'Sıralamayı Kapat' : 'Sırala'}</span>
                </button>
              </>
            )}

            {/* Ayraç */}
            <div className="w-px h-6 bg-stone-200 dark:bg-zinc-700" />

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
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-stone-900'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-800'
                  }`}
                title={selectionMode ? t('bulk.cancelSelect') : t('bulk.selectMode')}
              >
                {selectionMode ? <FaTimes className="text-sm" /> : <FaCheckSquare className="text-sm" />}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredItems.length === 0}
                className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
                    <span className="text-sm font-medium text-stone-700 dark:text-zinc-300">{t('list.genreFilter') || 'Tür'}:</span>
                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-700 bg-stone-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
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
                    <span className="text-sm font-medium text-stone-700 dark:text-zinc-300">{t('list.ratingFilter') || 'Puan'}:</span>
                    <select
                      value={ratingRange}
                      onChange={(e) => setRatingRange(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-700 bg-stone-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
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
                      <span className="text-sm font-medium text-stone-700 dark:text-zinc-300">{t('list.yearFilter') || 'Yıl'}:</span>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-700 bg-stone-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
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
                    <span className="ml-auto text-xs text-stone-500">
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-50 dark:bg-zinc-800 rounded-2xl shadow-2xl border border-stone-300 dark:border-zinc-700 px-6 py-4 flex items-center gap-4"
          >
            <span className="text-sm font-semibold text-stone-700 dark:text-zinc-300">
              {selectedIds.size} {t('bulk.selected')}
            </span>

            <div className="h-6 w-px bg-stone-200 dark:bg-zinc-700" />

            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-sm bg-stone-200 dark:bg-zinc-700 rounded-lg hover:bg-stone-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
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

      {/* Floating Game Sort Mode Toolbar */}
      <AnimatePresence>
        {gameSortMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between gap-6 w-[90%] max-w-md"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-sm font-bold text-stone-850 dark:text-zinc-250">
                Sıralama Düzenleniyor
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleGameSortMode}
                className="px-4 py-2 text-sm bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 font-semibold transition"
              >
                İptal
              </button>
              <button
                onClick={saveGameOrder}
                disabled={isSavingOrder}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-semibold shadow-lg shadow-violet-500/20 transition disabled:opacity-50"
              >
                {isSavingOrder ? <FaSpinner className="animate-spin text-sm" /> : <FaSave className="text-sm" />}
                Kaydet
              </button>
            </div>
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
          {/* Oyun Sıralama Modu Banner */}
          {isGameSortMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-300 dark:border-violet-700 rounded-xl"
            >
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                Sıralama modu aktif — oyunları <strong>sürükle-bırak</strong> ile yeniden sırala, sonra <strong>Kaydet</strong>'e bas.
              </span>
            </motion.div>
          )}

          {isGameSortMode ? (
            // ── Drag-and-Drop List (Mobile & Touch Friendly) ──────
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={gameOrderedItems.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full px-2">
                  {gameOrderedItems.map((item, index) => (
                    <SortableGameListItem
                      key={item.id}
                      item={item}
                      rank={index + 1}
                      totalItems={gameOrderedItems.length}
                      onMoveUp={() => moveItem(index, index - 1)}
                      onMoveDown={() => moveItem(index, index + 1)}
                      onMoveToRank={() => handleMoveToRankPrompt(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <>
              {/* Grid Görünümü - Kartlar */}
              {viewMode === 'grid' && (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => selectionMode ? toggleSelection(item.id) : setSelectedItem(item)}
                      className={`cursor-pointer h-full relative ${selectionMode && selectedIds.has(item.id) ? 'ring-2 ring-sky-500 rounded-2xl' : ''}`}
                    >
                      {/* Sıra Rozeti — sortOption === 'order' iken göster */}
                      {type === 'game' && sortOption === 'order' && item.queueOrder && (
                        <div className="absolute top-2 left-2 z-30 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg pointer-events-none">
                          <span className="text-[10px] font-black text-white leading-none">{item.queueOrder}</span>
                        </div>
                      )}
                      {/* Seçim Checkbox */}
                      {selectionMode && (
                        <div className="absolute top-3 left-3 z-20">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${selectedIds.has(item.id)
                            ? 'bg-sky-500 text-white'
                            : 'bg-white/90 dark:bg-zinc-800/90 border-2 border-gray-300 dark:border-zinc-600'
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
            </>
          )}

          {/* Liste Görünümü - Satır Satır */}
          {viewMode === 'list' && (
            <div className="flex flex-col gap-3">
              {filteredItems.map((item, idx) => (
                <MediaListItem 
                  key={item.id} 
                  item={item} 
                  refetch={refetch} 
                  onClick={() => selectionMode ? toggleSelection(item.id) : setSelectedItem(item)}
                  selectionMode={selectionMode}
                  isSelected={selectionMode && selectedIds.has(item.id)}
                  onToggleSelection={toggleSelection}
                />
              ))}
            </div>
          )}

          {!isSearchActive && hasMoreItems && (
            <div className="flex justify-center py-8">
              <button onClick={loadMore} disabled={loadingMore} className="group flex items-center gap-3 px-8 py-3 rounded-full bg-stone-50 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-semibold shadow-md border border-stone-300 dark:border-zinc-700 hover:shadow-lg hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-800 transition-all transform hover:-translate-y-1">
                {loadingMore ? <FaSpinner className="animate-spin h-5 w-5" /> : <><span>{t('actions.loadMore')}</span><FaArrowDown className="group-hover:animate-bounce" /></>}
              </button>
            </div>
          )}

          {!isSearchActive && !hasMoreItems && items.length > 0 && (
            <div className="py-4 text-center text-sm text-stone-400 dark:text-stone-600">{t('list.endOfList')}</div>
          )}

          {filteredItems.length === 0 && !loading && (
            <EmptyState icon={<FaInbox />} title={searchQuery ? t('create.noResults') : t('list.noItems')} description={searchQuery ? `"${searchQuery}" ${t('create.tryDifferent')}` : t('list.filterNoItems')} />
          )}

        </div>
      )}

      {/* === 2. DÜZELTME: Modal 'loading' DIŞINA TAŞINDI === */}
      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => {
          setSelectedItem(null);
          // URL'den openMediaId parametresini temizle
          if (searchParams.has('openMediaId')) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('openMediaId');
            setSearchParams(newParams);
          }
        }}
        item={selectedItem}
        refetch={refetch}
      />

    </section>
  );
}