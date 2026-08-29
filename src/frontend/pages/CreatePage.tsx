import { useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../backend/config/firebaseConfig';
import { addDoc, collection, serverTimestamp, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { MediaItem, MediaType } from '../../backend/types/media';
import {
  FaFilm, FaTv, FaGamepad, FaBook, FaStar, FaCheck,
  FaSearch, FaPen, FaTags, FaMagic, FaEye, FaEyeSlash,
  FaPlus, FaTimes, FaLayerGroup, FaInfoCircle, FaCalendarAlt,
  FaClock, FaHashtag, FaUserEdit, FaLink, FaSlidersH, FaChevronDown,
  FaChevronUp, FaCheckCircle, FaExternalLinkAlt, FaExclamationTriangle
} from 'react-icons/fa';

import { motion, AnimatePresence } from 'framer-motion';
import MediaCard from '../components/MediaCard';
import SearchInput from '../components/create/SearchInput';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createActivity } from '../../backend/services/activityService';
import { getAllSeriesEpisodeCounts } from '../../backend/services/omdbApi';
import { saveEpisodesPerSeason } from '../../backend/services/episodeTrackingService';
import { checkDuplicateMediaItem } from '../../backend/services/mediaDeduplicationService';
import ImageWithFallback from '../components/ui/ImageWithFallback';

// Predefined genres
const GENRES = {
  movie: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy', 'Animation', 'Documentary'],
  series: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy', 'Anime', 'Mini-Series'],
  game: ['Action', 'Adventure', 'RPG', 'Strategy', 'Sports', 'Puzzle', 'Shooter', 'Horror', 'Open World', 'Indie'],
  book: ['Fiction', 'Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Biography', 'History', 'Self-Help', 'Non-Fiction'],
};

// Suggested tags
const SUGGESTED_TAGS = ['favorim', 'tekrar-izle', 'klasik', 'keşfet', 'beğendim', '2026'];

// Media Type Configuration with rich theme tokens
const MEDIA_TYPES = [
  {
    id: 'movie' as MediaType,
    labelKey: 'media.movie',
    defaultLabel: 'Film',
    icon: FaFilm,
    color: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-50 dark:bg-sky-950/30',
    borderColor: 'border-sky-200 dark:border-sky-800/50',
    textColor: 'text-sky-600 dark:text-sky-400',
    ringColor: 'ring-sky-500/50',
    shadowColor: 'shadow-sky-500/20',
    badgeGradient: 'bg-gradient-to-r from-sky-500 to-blue-600'
  },
  {
    id: 'series' as MediaType,
    labelKey: 'media.series',
    defaultLabel: 'Dizi',
    icon: FaTv,
    color: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    ringColor: 'ring-emerald-500/50',
    shadowColor: 'shadow-emerald-500/20',
    badgeGradient: 'bg-gradient-to-r from-emerald-500 to-teal-600'
  },
  {
    id: 'game' as MediaType,
    labelKey: 'media.game',
    defaultLabel: 'Oyun',
    icon: FaGamepad,
    color: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    ringColor: 'ring-amber-500/50',
    shadowColor: 'shadow-amber-500/20',
    badgeGradient: 'bg-gradient-to-r from-amber-500 to-orange-600'
  },
  {
    id: 'book' as MediaType,
    labelKey: 'media.book',
    defaultLabel: 'Kitap',
    icon: FaBook,
    color: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800/50',
    textColor: 'text-rose-600 dark:text-rose-400',
    ringColor: 'ring-rose-500/50',
    shadowColor: 'shadow-rose-500/20',
    badgeGradient: 'bg-gradient-to-r from-rose-500 to-pink-600'
  },
];

export default function CreatePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') as MediaType | null;


  const [type, setType] = useState<MediaType>(defaultType || 'movie');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('8.0');
  const [watched, setWatched] = useState(false);
  const [author, setAuthor] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [totalSeasons, setTotalSeasons] = useState<number | undefined>(undefined);
  const [releaseDate, setReleaseDate] = useState<string | undefined>(undefined);
  const [runtime, setRuntime] = useState<string | undefined>(undefined);
  const [imdbId, setImdbId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isJustSelected, setIsJustSelected] = useState(false);
  
  // Mobile accordion expand state for advanced options (genres, rating, notes)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Ref for the Live Preview Section to scroll to automatically on mobile selection
  const previewRef = useRef<HTMLDivElement>(null);
  const searchInputTopRef = useRef<HTMLDivElement>(null);

  // Duplicate item resolution state
  const [duplicateModalItem, setDuplicateModalItem] = useState<{
    item: MediaItem;
    message: string;
  } | null>(null);

  const activeTheme = useMemo(() => {
    return MEDIA_TYPES.find(m => m.id === type) || MEDIA_TYPES[0];
  }, [type]);

  const handleSearchSelect = (details: {
    title: string;
    image: string;
    description: string;
    rating: string;
    author?: string;
    genres: string[];
    totalSeasons?: number;
    releaseDate?: string;
    runtime?: string;
    imdbId?: string;
  }) => {
    // Blur any active keyboard on mobile
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setTitle(details.title);
    setImage(details.image);
    setDescription(details.description);
    setRating(details.rating);
    if (details.author) setAuthor(details.author);
    if (details.genres.length) setGenres(details.genres);
    if (details.totalSeasons) setTotalSeasons(details.totalSeasons);
    if (details.releaseDate) setReleaseDate(details.releaseDate);
    if (details.runtime) setRuntime(details.runtime);
    if (details.imdbId) setImdbId(details.imdbId);

    // Trigger visual feedback highlight
    setIsJustSelected(true);
    setTimeout(() => setIsJustSelected(false), 2500);

    // On mobile, scroll smoothly to preview
    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    toast.success(`${details.title} bilgileri aktarıldı! ✨`);
  };

  const toggleGenre = (g: string) => {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (normalized && !tags.includes(normalized)) setTags([...tags, normalized]);
  };

  const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));

  const ratingNumeric = parseFloat(rating) || 5;

  const ratingInfo = useMemo(() => {
    const r = ratingNumeric;
    if (r >= 9) return { label: 'Şaheser', color: '#10b981', bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
    if (r >= 8) return { label: 'Çok İyi', color: '#10b981', bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
    if (r >= 6.5) return { label: 'İyi', color: '#3b82f6', bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' };
    if (r >= 5) return { label: 'Ortalama', color: '#f59e0b', bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
    return { label: 'Zayıf', color: '#ef4444', bg: 'bg-red-500/15 text-red-600 dark:text-red-400' };
  }, [ratingNumeric]);

  const previewItem: MediaItem = {
    id: 'preview',
    title: title || t('create.titlePlaceholder') || 'İçerik Başlığı',
    image: image || '',
    description: description || '',
    rating,
    watched,
    type,
    createdAt: Timestamp.now(),
    author: type === 'book' ? author : undefined,
    genre: genres.join(', ') || '',
    tags: tags.length > 0 ? tags : [],
    releaseDate: releaseDate || '',
    runtime: runtime || '',
    imdbId: imdbId || '',
    platform: undefined,
    addedAt: undefined
  };

  const resetForm = () => {
    setTitle('');
    setImage('');
    setDescription('');
    setRating('8.0');
    setWatched(false);
    setAuthor('');
    setGenres([]);
    setTags([]);
    setTagInput('');
    setTotalSeasons(undefined);
    setReleaseDate(undefined);
    setRuntime(undefined);
    setImdbId(undefined);
    setShowAdvancedOptions(false);
    
    // Scroll back to top search input so user can quickly add another item
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t('create.loginRequired')); return; }
    if (!title.trim() || !type) { toast.error(t('create.requiredFields')); return; }

    setIsLoading(true);
    try {
      const duplicateCheck = await checkDuplicateMediaItem(user.uid, {
        title: title.trim(),
        imdbId: imdbId ? imdbId.trim() : undefined,
        type: type
      });

      if (duplicateCheck.isDuplicate) {
        setIsLoading(false);
        if (duplicateCheck.existingItem) {
          setDuplicateModalItem({
            item: duplicateCheck.existingItem,
            message: duplicateCheck.message || 'Bu içerik zaten kütüphanenizde ekli!'
          });
        } else {
          toast.error(duplicateCheck.message || t('create.alreadyExists'), { duration: 4000 });
        }
        return;
      }

      const newItem: any = {
        title: title.trim(),
        type,
        rating,
        image: image.trim(),
        description: description.trim(),
        watched,
        createdAt: serverTimestamp(),
        userId: user.uid
      };



      if (author && type === 'book') newItem.author = author.trim();
      if (genres.length) newItem.genre = genres.join(', ');
      if (tags.length) newItem.tags = tags;
      if (type === 'series' && totalSeasons) { newItem.totalSeasons = totalSeasons; newItem.watchedSeasons = []; }
      if (releaseDate) newItem.releaseDate = releaseDate;
      if (runtime) newItem.runtime = runtime;
      if (imdbId) newItem.imdbId = imdbId;

      const docRef = await addDoc(collection(db, 'mediaItems'), newItem);

      if (type === 'series' && imdbId && totalSeasons) {
        getAllSeriesEpisodeCounts(imdbId, totalSeasons)
          .then(episodesPerSeason => {
            if (Object.keys(episodesPerSeason).length > 0) saveEpisodesPerSeason(docRef.id, episodesPerSeason);
          }).catch(err => console.warn('Bölüm verisi çekilemedi:', err));
      }

      await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', 'media_added', { ...newItem, id: docRef.id });

      const addedTitle = title;
      toast.success(`${addedTitle} kütüphanene eklendi! 🎉 Yenisini ekleyebilirsin.`);
      
      // Stay on the page and reset for consecutive additions!
      resetForm();
    } catch (err) {
      toast.error(t('create.errorAdding'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = () => {
    if (type === 'book') return watched ? 'Okundu' : 'Okunacak';
    if (type === 'game') return watched ? 'Oynandı' : 'Oynanacak';
    return watched ? 'İzlendi' : 'İzlenecek';
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="py-2 sm:py-6 px-2 sm:px-4 max-w-7xl mx-auto min-h-screen pb-36"
    >
      {/* ═══ TOP HERO BANNER & STICKY CATEGORY PICKER ═══ */}
      <div ref={searchInputTopRef} className="relative mb-4 p-4 sm:p-7 rounded-3xl bg-gradient-to-br from-stone-900 via-zinc-900 to-black text-white shadow-2xl overflow-hidden border border-stone-800/80">
        {/* Glow accent backdrop */}
        <div className={`absolute -right-16 -top-16 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${activeTheme.color} transition-all duration-700 pointer-events-none`} />
        <div className={`absolute -left-16 -bottom-16 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl opacity-20 bg-gradient-to-tr ${activeTheme.color} transition-all duration-700 pointer-events-none`} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md border border-white/15 text-stone-200">
              <FaMagic className="text-amber-400 text-xs animate-pulse" />
              <span>{t('create.title') || 'Yeni İçerik Ekle'}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Kütüphanene Ekle
            </h1>
            <p className="text-xs text-stone-400 max-w-md hidden sm:block">
              Arama kutusundan seçerek otomatik aktar veya detayları manuel gir.
            </p>
          </div>

          {/* MEDIA TYPE CATEGORY TABS */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 bg-stone-950/90 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
            {MEDIA_TYPES.map((media) => {
              const Icon = media.icon;
              const isActive = type === media.id;
              return (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => {
                    setType(media.id);
                    setGenres([]);
                  }}
                  className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-extrabold text-xs transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'text-white shadow-lg shadow-black/50 scale-[1.02]'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMediaTab"
                      className={`absolute inset-0 rounded-xl ${media.badgeGradient}`}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon className={`relative z-10 text-sm ${isActive ? 'text-white' : ''}`} />
                  <span className="relative z-10 text-[11px] sm:text-xs">{t(media.labelKey) || media.defaultLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ 2-COLUMN GRID SYSTEM ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">

        {/* ═══ SOL KOLON: AKILLI FORM (7 COLUMNS) ═══ */}
        <form id="create-media-form" onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">

          {/* 1. AKILLI ARAMA & TEMEL BİLGİLER CARD */}
          <motion.div
            layout
            className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg relative z-30 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${activeTheme.color} text-white shadow-md`}>
                  <FaSearch className="text-xs sm:text-sm" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">Akıllı Arama & Bilgiler</h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">İçeriği ara ve seç; tüm alanlar otomatik dolsun.</p>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${activeTheme.lightBg} ${activeTheme.textColor} border ${activeTheme.borderColor} shrink-0`}>
                {t(`media.${type}`)}
              </span>
            </div>

            {/* API Search Component */}
            <div className="relative z-50">
              <SearchInput type={type} onSelect={handleSearchSelect} />
            </div>

            {/* Inputs: Başlık & Görsel / Yazar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                  {t('create.titleLabel') || 'İçerik Adı'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('create.titlePlaceholder') || 'Örn: Inception, Breaking Bad...'}
                    required
                    className="w-full h-11 px-3.5 pl-9 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder:text-stone-400 font-medium"
                  />
                  <FaPen className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                </div>
              </div>

              {type === 'book' ? (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                    {t('create.authorLabel') || 'Yazar / Çevirmen'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Örn: George Orwell..."
                      className="w-full h-11 px-3.5 pl-9 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-stone-400 font-medium"
                    />
                    <FaUserEdit className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                    {t('create.imageLabel') || 'Afiş / Görsel URL'}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-11 px-3.5 pl-9 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder:text-stone-400 font-medium"
                    />
                    <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                  </div>
                </div>
              )}
            </div>

            {type === 'book' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                  {t('create.imageLabel') || 'Kapak Görseli URL'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-11 px-3.5 pl-9 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-stone-400 font-medium"
                  />
                  <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                </div>
              </div>
            )}
          </motion.div>

          {/* MOBILE QUICK ACTION: Accordion Toggle for Puan, Türler & Notlar */}
          <div className="block lg:hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full py-3 px-4 bg-white/90 dark:bg-zinc-900/90 rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-stone-800 dark:text-zinc-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FaSlidersH className="text-amber-500" />
                <span>Puan, Durum ve Ekstra Detayları Özelleştir</span>
              </div>
              {showAdvancedOptions ? <FaChevronUp className="text-stone-400" /> : <FaChevronDown className="text-stone-400" />}
            </button>
          </div>

          {/* 2. DETAYLAR, PUANLAMA & DURUM CARD (Desktop or expanded on Mobile) */}
          <div className={`${showAdvancedOptions ? 'block' : 'hidden lg:block'} space-y-4 sm:space-y-6`}>
            <motion.div
              layout
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg relative z-20 space-y-4"
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-zinc-800/80">
                <div className="p-2 rounded-xl bg-stone-900 dark:bg-zinc-100 text-white dark:text-stone-900 shadow-md">
                  <FaStar className="text-xs sm:text-sm text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">Değerlendirme & Durum</h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">Puanını belirle ve izleme / tamamlanma durumunu işaretle.</p>
                </div>
              </div>

              {/* Rating Slider & Watched Toggle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                
                {/* Rating Slider */}
                <div className="sm:col-span-7 bg-stone-50/80 dark:bg-zinc-950/80 p-3.5 rounded-2xl border border-stone-200/70 dark:border-zinc-800/80 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                      <FaStar className="text-amber-400 text-xs" /> Puanın
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${ratingInfo.bg}`}>
                        {ratingInfo.label}
                      </span>
                      <span className="text-base font-black tracking-tight text-stone-900 dark:text-white">
                        {rating}<span className="text-xs opacity-40 font-normal">/10</span>
                      </span>
                    </div>
                  </div>

                  <div className="px-1 py-1">
                    <Slider
                      value={ratingNumeric}
                      onChange={(v) => setRating(String(Array.isArray(v) ? v[0] : v))}
                      min={0} max={10} step={0.1}
                      trackStyle={{ backgroundColor: ratingInfo.color, height: 6, borderRadius: 4 }}
                      handleStyle={{ borderColor: ratingInfo.color, backgroundColor: 'white', height: 18, width: 18, marginTop: -6, opacity: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
                      railStyle={{ backgroundColor: '#e2e8f0', height: 6, borderRadius: 4 }}
                    />
                  </div>
                </div>

                {/* Watched / Completed Toggle */}
                <div className="sm:col-span-5 bg-stone-50/80 dark:bg-zinc-950/80 p-3.5 rounded-2xl border border-stone-200/70 dark:border-zinc-800/80 flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Tamamlanma Durumu
                  </span>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-stone-800 dark:text-zinc-200 flex items-center gap-2">
                      {watched ? <FaEye className="text-emerald-500 text-sm" /> : <FaEyeSlash className="text-stone-400 text-sm" />}
                      {getStatusText()}
                    </span>

                    <button
                      type="button"
                      onClick={() => setWatched(!watched)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                        watched ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-stone-300 dark:bg-zinc-700'
                      }`}
                      aria-label="Tamamlanma Durumunu Değiştir"
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                        watched ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                  {t('create.descriptionLabel') || 'Açıklama / Kişisel Notlar'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="İçerik hakkında düşüncelerin veya özet bilgi..."
                  className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder:text-stone-400 resize-none custom-scrollbar font-medium"
                />
              </div>
            </motion.div>

            {/* 3. KATEGORİLER & ETİKETLER CARD */}
            <motion.div
              layout
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg space-y-4"
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-zinc-800/80">
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                  <FaTags className="text-xs sm:text-sm" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">Türler & Özel Etiketler</h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">Uygun türleri işaretle ve arama etiketleri tanımla.</p>
                </div>
              </div>

              {/* Genres Selection */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                  {t(`media.${type}`)} Türleri
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {GENRES[type].map((g) => {
                    const isSelected = genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isSelected
                            ? `${activeTheme.badgeGradient} text-white shadow-md scale-[1.02]`
                            : 'bg-stone-100 dark:bg-zinc-800/90 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {isSelected && <FaCheck className="text-[10px]" />}
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags Input */}
              <div className="pt-3 border-t border-stone-100 dark:border-zinc-800/80 space-y-2.5">
                <label className="block text-[11px] font-extrabold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                  Özel Etiket Ekle (#favorim, #2026...)
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); } }}
                      placeholder="Etiket yazıp Enter'a bas..."
                      className="w-full h-10 px-3.5 pl-8 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-stone-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500/40 placeholder:text-stone-400 font-medium"
                    />
                    <FaHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                  </div>
                  <button
                    type="button"
                    onClick={() => { addTag(tagInput); setTagInput(''); }}
                    className="px-3.5 sm:px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 active:scale-95"
                  >
                    <FaPlus className="text-[10px]" /> Ekle
                  </button>
                </div>

                {/* Tag Chips */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                  {tags.map((tag, i) => (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 shadow-xs"
                    >
                      #{tag}
                      <button type="button" onClick={() => removeTag(i)} className="hover:text-rose-500 transition-colors ml-0.5 cursor-pointer" aria-label="Etiketi Sil">
                        <FaTimes className="text-[10px]" />
                      </button>
                    </motion.span>
                  ))}

                  {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(suggestedTag => (
                    <button
                      key={suggestedTag}
                      type="button"
                      onClick={() => addTag(suggestedTag)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-xl border border-dashed border-stone-300 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-400 transition-all cursor-pointer active:scale-95"
                    >
                      + #{suggestedTag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </form>

        {/* ═══ SAĞ KOLON: CANLI ÖNİZLEME & KAYDET (5 COLUMNS) ═══ */}
        <div ref={previewRef} className="lg:col-span-5 scroll-mt-24">
          <div className="lg:sticky lg:top-6 space-y-4 sm:space-y-6">

            {/* MAIN PREVIEW & SAVE CARD */}
            <div 
              className={`bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-2xl relative overflow-hidden space-y-4 transition-all duration-500 ${
                isJustSelected 
                  ? 'ring-4 ring-amber-400/90 shadow-amber-500/20 scale-[1.01]' 
                  : ''
              }`}
            >
              
              {/* Header Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${activeTheme.badgeGradient} text-white shadow-md`}>
                    <FaLayerGroup className="text-xs" />
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                      Canlı Önizleme
                    </h2>
                    <p className="text-[10px] text-stone-400">Kütüphanende böyle listelenecek</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {isJustSelected ? 'Seçildi ✨' : 'Canlı'}
                  </span>
                </div>
              </div>

              {/* Real MediaCard Component Preview Container */}
              <div className="w-full max-w-[270px] mx-auto py-1 transition-transform hover:scale-[1.02] duration-300">
                <MediaCard item={previewItem} refetch={() => { }} readOnly />
              </div>

              {/* Extra Metadata Pill Badges */}
              {(releaseDate || runtime || imdbId || genres.length > 0) && (
                <div className="pt-2 border-t border-stone-100 dark:border-zinc-800/80 flex flex-wrap gap-1.5 sm:gap-2 justify-center text-[10px] font-bold text-stone-500 dark:text-zinc-400">
                  {releaseDate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 border border-stone-200/50 dark:border-zinc-700/50">
                      <FaCalendarAlt className="text-stone-400" /> {releaseDate}
                    </span>
                  )}
                  {runtime && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 border border-stone-200/50 dark:border-zinc-700/50">
                      <FaClock className="text-stone-400" /> {runtime}
                    </span>
                  )}
                  {imdbId && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      IMDb: {imdbId}
                    </span>
                  )}
                </div>
              )}

              {/* INLINE SAVE BUTTON */}
              <button
                form="create-media-form"
                type="submit"
                disabled={isLoading || !title.trim()}
                className={`w-full h-12 ${activeTheme.badgeGradient} text-white font-extrabold text-xs rounded-2xl shadow-xl ${activeTheme.shadowColor} hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  <>
                    <FaCheckCircle className="text-sm" />
                    <span>Kütüphaneye Ekle (Kaydet)</span>
                  </>
                )}
              </button>
            </div>

            {/* Smart Tip Card */}
            <div className="bg-stone-100/70 dark:bg-zinc-900/60 rounded-3xl p-4 border border-stone-200/70 dark:border-zinc-800/70 text-xs text-stone-500 dark:text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-zinc-200">
                <FaInfoCircle className="text-amber-500 text-sm" />
                <span>Seri Ekleme Kolaylığı</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Kaydettikten sonra sayfada kalırsınız ve form otomatik sıfırlanır. Arka arkaya dilediğiniz kadar içerik ekleyebilirsiniz.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ═══ FLOATING BOTTOM ACTION BAR (RULE 3: z-[110] & bottom-24 md:bottom-6) ═══ */}
      <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[94%] max-w-xl bg-stone-900/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-white/15 p-2.5 sm:p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          {image ? (
            <div className="w-9 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-xs">
              <ImageWithFallback src={image} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`p-2.5 rounded-xl ${activeTheme.badgeGradient} text-white shrink-0 shadow-md`}>
              <FaCheck className="text-xs" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-black truncate text-white">
              {title || 'Yeni İçerik'}
            </h4>
            <p className="text-[10px] text-stone-400 truncate flex items-center gap-1">
              <span>{t(`media.${type}`)}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">★ {rating}</span>
            </p>
          </div>
        </div>

        <button
          form="create-media-form"
          type="submit"
          disabled={isLoading || !title.trim()}
          className={`px-5 py-2.5 rounded-xl font-black text-xs text-white ${activeTheme.badgeGradient} shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5 cursor-pointer`}
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FaCheck className="text-[10px]" />
              <span>Kaydet</span>
            </>
          )}
        </button>
      </div>

      {/* ═══ DUPLICATE RESOLUTION MODAL (YENİ EKLENEN İÇERİK ZATEN VARSA) ═══ */}
      <AnimatePresence>
        {duplicateModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[200] p-4"
            onClick={() => setDuplicateModalItem(null)}
          >

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 w-full max-w-md border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-white space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <FaExclamationTriangle className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Bu İçerik Zaten Ekli!</h3>
                    <p className="text-[11px] text-stone-400">Kütüphanenizde eşleşen kayıt bulundu</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateModalItem(null)}
                  className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-white rounded-xl transition"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Matched item preview card */}
              <div className="flex items-center gap-3.5 p-3.5 bg-stone-50 dark:bg-zinc-800/80 rounded-2xl border border-stone-200/70 dark:border-zinc-700/70">
                {duplicateModalItem.item.image ? (
                  <div className="w-14 h-18 rounded-xl overflow-hidden shrink-0 border border-stone-200 dark:border-zinc-700 shadow-sm">
                    <ImageWithFallback src={duplicateModalItem.item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-18 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xl shrink-0">
                    ★
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {t(`media.${duplicateModalItem.item.type}`)}
                    </span>
                    {duplicateModalItem.item.imdbId && (
                      <span className="text-[10px] font-mono text-stone-400">
                        {duplicateModalItem.item.imdbId}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                    {duplicateModalItem.item.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Puan: <strong className="text-amber-500">★ {duplicateModalItem.item.rating}</strong> • {duplicateModalItem.item.watched ? 'İzlendi' : 'İzlenecek'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                Bu içeriği daha önce farklı dilde veya kaynaktan eklemişsiniz. Mevcut içeriği görüntüleyebilir, silebilir veya güncelleyebilirsiniz.
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDuplicateModalItem(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs hover:bg-stone-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                >
                  Burada Kal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const existing = duplicateModalItem.item;
                    setDuplicateModalItem(null);
                    // Navigate to the list page with openMediaId to immediately trigger its detail view
                    navigate(`/${existing.type}?openMediaId=${existing.id}`);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FaExternalLinkAlt className="text-[11px]" />
                  <span>Mevcut İçeriğe Git</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}