// src/frontend/pages/CreatePage.tsx
import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../backend/config/firebaseConfig';
import { addDoc, collection, serverTimestamp, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { MediaItem, MediaType } from '../../backend/types/media';
import {
  FaFilm, FaTv, FaGamepad, FaBook, FaStar, FaCheck,
  FaSearch, FaPen, FaTags, FaMagic, FaEye, FaEyeSlash,
  FaPlus, FaTimes, FaLayerGroup, FaInfoCircle
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

  const activeTheme = useMemo(() => {
    return MEDIA_TYPES.find(m => m.id === type) || MEDIA_TYPES[0];
  }, [type]);

  const handleSearchSelect = (details: { title: string; image: string; description: string; rating: string; author?: string; genres: string[]; totalSeasons?: number; releaseDate?: string; runtime?: string; imdbId?: string }) => {
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
    if (r >= 9) return { label: 'Şaheser', color: '#10b981', bg: 'bg-emerald-500/10 text-emerald-500' };
    if (r >= 8) return { label: 'Çok İyi', color: '#10b981', bg: 'bg-emerald-500/10 text-emerald-500' };
    if (r >= 6.5) return { label: 'İyi', color: '#3b82f6', bg: 'bg-blue-500/10 text-blue-500' };
    if (r >= 5) return { label: 'Ortalama', color: '#f59e0b', bg: 'bg-amber-500/10 text-amber-500' };
    return { label: 'Zayıf', color: '#ef4444', bg: 'bg-red-500/10 text-red-500' };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t('create.loginRequired')); return; }
    if (!title.trim() || !type) { toast.error(t('create.requiredFields')); return; }

    setIsLoading(true);
    try {
      const q = query(collection(db, 'mediaItems'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const isDuplicate = snap.docs.some(doc => doc.data().title?.trim().toLowerCase() === title.trim().toLowerCase());

      if (isDuplicate) {
        toast.error(t('create.alreadyExists'));
        setIsLoading(false);
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

      toast.success(t('create.addSuccess'));
      navigate(`/${type}`);
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
      transition={{ duration: 0.4 }}
      className="py-8 px-4 max-w-6xl mx-auto min-h-screen pb-28"
    >
      {/* ═══ HEADER BANNER ═══ */}
      <div className="relative mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-zinc-900 to-stone-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-white shadow-2xl overflow-hidden border border-stone-800/80">
        {/* Glow accent element */}
        <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${activeTheme.color} transition-all duration-500`} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/10 text-stone-200">
              <FaMagic className="text-amber-400 text-xs animate-pulse" />
              <span>{t('create.title') || 'Yeni İçerik Oluştur'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Kütüphaneni Genişlet
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 max-w-lg leading-relaxed">
              İzlediğin filmleri, dizileri, oynadığın oyunları ve okuduğun kitapları ekle; puanla, etiketle ve kişisel arşivini yarat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* ═══ TÜR SEÇİM SEKMELERİ (Visual Cards) ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-950/60 dark:bg-black/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-lg shrink-0">
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
                    className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
                      isActive
                        ? 'text-white shadow-lg shadow-black/40 scale-[1.02]'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeMediaTab"
                        className={`absolute inset-0 rounded-xl ${media.badgeGradient}`}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={`relative z-10 text-sm ${isActive ? 'text-white' : ''}`} />
                    <span className="relative z-10">{t(media.labelKey) || media.defaultLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ═══ SOL KOLON: FORM ═══ */}
        <form id="create-media-form" onSubmit={handleSubmit} className="lg:col-span-8 flex flex-col gap-6">

          {/* 1. AKILLI ARAMA (API INTEGRATION CARD) */}
          <motion.div 
            layout
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-sm relative z-30 overflow-visible"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${activeTheme.color} text-white shadow-sm`}>
                  <FaSearch className="text-xs" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-800 dark:text-white">Otomatik Bilgi Tamamlama</h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">İçerik adını yazarak afiş, açıklama ve puan verilerini otomatik getir.</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${activeTheme.lightBg} ${activeTheme.textColor} border ${activeTheme.borderColor}`}>
                {t(`media.${type}`)} Modu
              </span>
            </div>

            <div className="relative z-50">
              <SearchInput type={type} onSelect={handleSearchSelect} />
            </div>
          </motion.div>

          {/* 2. MANUEL DETAYLAR FORMU */}
          <motion.div 
            layout
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-sm space-y-5 relative z-20"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-zinc-800">
              <div className="p-2 rounded-xl bg-stone-900 dark:bg-zinc-100 text-white dark:text-stone-900 shadow-sm">
                <FaPen className="text-xs" />
              </div>
              <h2 className="text-sm font-bold text-stone-800 dark:text-white">Detaylar & İçerik Bilgileri</h2>
            </div>

            <div className="space-y-4">
              {/* BAŞLIK VE YAZAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('create.titleLabel') || 'İçerik Adı'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('create.titlePlaceholder') || 'Örn: Inception, The Last of Us...'}
                    required
                    className="w-full h-11 px-3.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-stone-400"
                  />
                </div>

                {type === 'book' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                      {t('create.authorLabel') || 'Yazar / Çevirmen'}
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Örn: George Orwell, Dostoyevski..."
                      className="w-full h-11 px-3.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all placeholder:text-stone-400"
                    />
                  </div>
                )}
              </div>

              {/* GÖRÜNTÜ / AFİŞ URL */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('create.imageLabel') || 'Görsel / Afiş Bağlantısı (URL)'}
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-stone-400"
                />
              </div>

              {/* AÇIKLAMA / NOTLAR */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('create.descriptionLabel') || 'Açıklama veya Kişisel Notlar'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="İçerik hakkında düşüncelerin veya özet bilgi..."
                  className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-stone-400 resize-none custom-scrollbar"
                />
              </div>

              {/* PUANLAMA VE DURUM SEÇİMİ (Grid Card Container) */}
              <div className="pt-4 border-t border-stone-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* INTERACTIVE SLIDER */}
                <div className="sm:col-span-7 bg-stone-50 dark:bg-zinc-950 p-4 rounded-xl border border-stone-200/60 dark:border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-zinc-300 uppercase tracking-wider">
                      <FaStar className="text-amber-400 text-xs" /> Değerlendirme Puanı
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

                {/* ANIMATED WATCH/COMPLETED TOGGLE */}
                <div className="sm:col-span-5 bg-stone-50 dark:bg-zinc-950 p-4 rounded-xl border border-stone-200/60 dark:border-zinc-800/80 flex flex-col justify-between h-full">
                  <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Durum Bilgisi
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-200 flex items-center gap-1.5">
                      {watched ? <FaEye className="text-emerald-500" /> : <FaEyeSlash className="text-stone-400" />}
                      {getStatusText()}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setWatched(!watched)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                        watched ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-stone-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                        watched ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. TÜRLER VE ETİKETLER */}
          <motion.div 
            layout
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-zinc-800">
              <div className="p-2 rounded-xl bg-purple-500 text-white shadow-sm">
                <FaTags className="text-xs" />
              </div>
              <h2 className="text-sm font-bold text-stone-800 dark:text-white">Kategoriler & Özel Etiketler</h2>
            </div>

            {/* GENRES SELECTION CHIPS */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                {t(`media.${type}`)} Türleri Seç
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES[type].map((g) => {
                  const isSelected = genres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                        isSelected
                          ? `${activeTheme.badgeGradient} text-white shadow-sm scale-[1.03]`
                          : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {isSelected && <FaCheck className="text-[10px]" />}
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM TAGS INPUT */}
            <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 space-y-3">
              <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                Özel Etiket Ekle (#favorim, #2026...)
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); } }}
                  placeholder="Etiket yazıp Enter'a bas veya Ekle'ye tıkla..."
                  className="flex-1 h-10 px-3.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-50/60 dark:bg-zinc-950/60 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500/40 placeholder:text-stone-400"
                />
                <button 
                  type="button" 
                  onClick={() => { addTag(tagInput); setTagInput(''); }}
                  className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <FaPlus className="text-[10px]" /> Ekle
                </button>
              </div>

              {/* TAG CHIPS & SUGGESTIONS */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {tags.map((tag, i) => (
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={i} 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 shadow-sm"
                  >
                    #{tag}
                    <button type="button" onClick={() => removeTag(i)} className="hover:text-rose-500 transition-colors ml-0.5">
                      <FaTimes className="text-[10px]" />
                    </button>
                  </motion.span>
                ))}

                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(suggestedTag => (
                  <button 
                    key={suggestedTag} 
                    type="button" 
                    onClick={() => addTag(suggestedTag)} 
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-dashed border-stone-300 dark:border-zinc-700 text-stone-400 hover:text-purple-600 hover:border-purple-400 transition-all"
                  >
                    + #{suggestedTag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </form>

        {/* ═══ SAĞ KOLON: ÖNİZLEME (STICKY CARD & SAVE BUTTON) ═══ */}
        <div className="lg:col-span-4 mt-4 lg:mt-0">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-5 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg relative overflow-hidden space-y-4">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <FaLayerGroup className="text-stone-400 text-xs" />
                  <h2 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                    Canlı Önizleme
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Canlı
                  </span>
                </div>
              </div>

              {/* Real MediaCard Component Preview */}
              <div className="w-full max-w-[260px] mx-auto transition-transform hover:scale-[1.02] duration-300">
                <MediaCard item={previewItem} refetch={() => { }} readOnly />
              </div>

              {/* QUICK STICKY SAVE BUTTON FOR DESKTOP */}
              <button
                form="create-media-form"
                type="submit"
                disabled={isLoading || !title.trim()}
                className={`w-full h-11 ${activeTheme.badgeGradient} text-white font-extrabold text-xs rounded-xl shadow-lg ${activeTheme.shadowColor} hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  <>
                    <FaCheck className="text-xs" /> 
                    <span>Kütüphaneye Kaydet</span>
                  </>
                )}
              </button>
            </div>

            {/* Smart Tip Card */}
            <div className="bg-stone-100/60 dark:bg-zinc-900/40 rounded-2xl p-4 border border-stone-200/50 dark:border-zinc-800/50 text-xs text-stone-500 dark:text-zinc-400 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-zinc-300">
                <FaInfoCircle className="text-sky-500" />
                <span>İpucu</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Arama kutusuna başlık yazıp önerilere tıkladığında görsel, açıklama ve tür bilgileri saniyeler içinde otomatik doldurulur.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ═══ FLOATING BOTTOM BAR (MOBİL & EKOSİSTEM İÇİN HER AN ERİŞİLEBİLİR YÜZEN KAYDET BAR) ═══ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-stone-900/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl ${activeTheme.badgeGradient} text-white shrink-0 shadow-md`}>
            <FaCheck className="text-xs" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold truncate text-white">
              {title || 'Yeni İçerik'}
            </h4>
            <p className="text-[10px] text-stone-400 truncate">
              {t(`media.${type}`)} • Puan: {rating}
            </p>
          </div>
        </div>

        <button
          form="create-media-form"
          type="submit"
          disabled={isLoading || !title.trim()}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white ${activeTheme.badgeGradient} shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0 flex items-center gap-2 cursor-pointer`}
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
    </motion.section>
  );
}