// src/frontend/pages/CreatePage.tsx
import { useState, useMemo, Fragment } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../backend/config/firebaseConfig';
import { addDoc, collection, serverTimestamp, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { MediaItem, MediaType } from '../../backend/types/media';
import {
  FaFilm, FaTv, FaGamepad, FaBook, FaStar, FaCheck,
  FaSearch, FaChevronDown, FaPen, FaTags
} from 'react-icons/fa';
import { Listbox, Transition } from '@headlessui/react';
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
  movie: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'],
  series: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'],
  game: ['Action', 'Adventure', 'RPG', 'Strategy', 'Sports', 'Puzzle', 'Shooter', 'Horror'],
  book: ['Fiction', 'Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Biography', 'History'],
};

// Suggested tags
const SUGGESTED_TAGS = ['favorim', 'tekrar-izle', 'klasik', 'keşfet'];

// Type Configuration for Dropdown (Kompakt versiyon)
const TYPE_CONFIG = {
  movie: { id: 'movie' as MediaType, icon: FaFilm, color: 'text-sky-500', label: 'Film' },
  series: { id: 'series' as MediaType, icon: FaTv, color: 'text-emerald-500', label: 'Dizi' },
  game: { id: 'game' as MediaType, icon: FaGamepad, color: 'text-amber-500', label: 'Oyun' },
  book: { id: 'book' as MediaType, icon: FaBook, color: 'text-rose-500', label: 'Kitap' },
};

export default function CreatePage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') as MediaType | null;

  const [type, setType] = useState<MediaType>(defaultType || 'movie');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('5');
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

  const currentType = TYPE_CONFIG[type];

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

    toast.success(`${details.title} başarıyla aktarıldı`);
  };

  const toggleGenre = (g: string) => {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (normalized && !tags.includes(normalized)) setTags([...tags, normalized]);
  };

  const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));

  const ratingColor = useMemo(() => {
    const r = parseFloat(rating);
    if (r >= 8) return '#10b981';
    if (r >= 6) return '#eab308';
    if (r >= 4) return '#f97316';
    return '#f43f5e';
  }, [rating]);

  const previewItem: MediaItem = {
    id: 'preview',
    title: title || t('create.titlePlaceholder'),
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
    if (!title || !type) { toast.error(t('create.requiredFields')); return; }

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
        title, type, rating, image, description, watched,
        createdAt: serverTimestamp(), userId: user.uid
      };

      if (author && type === 'book') newItem.author = author;
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

  return (
    <section className="py-6 px-4 max-w-5xl mx-auto min-h-screen">

      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center shadow-sm">
          <FaPen className="text-white dark:text-slate-900 text-sm" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('create.title') || 'İçerik Ekle'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ═══ SOL KOLON: FORM ═══ */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 flex flex-col gap-4">

          {/* 1. ARAMA VE TÜR SEÇİMİ (Kompakt) */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FaSearch className="text-sky-500 text-sm" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">API ile Otomatik Doldur</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-40 shrink-0 relative z-50">
                <Listbox value={type} onChange={setType}>
                  <Listbox.Button className="w-full h-10 px-3 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg hover:border-slate-300 dark:hover:border-zinc-600 transition-colors text-sm">
                    <div className="flex items-center gap-2">
                      <currentType.icon className={currentType.color} />
                      <span className="font-semibold text-slate-700 dark:text-zinc-200">{t(`media.${type}`)}</span>
                    </div>
                    <FaChevronDown className="text-slate-400 text-xs" />
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 py-1">
                      {(Object.values(TYPE_CONFIG)).map((opt) => (
                        <Listbox.Option key={opt.id} value={opt.id} className={({ active }) => `flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${active ? 'bg-slate-100 dark:bg-zinc-700' : ''}`}>
                          <opt.icon className={opt.color} />
                          <span className={`font-semibold ${type === opt.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-zinc-400'}`}>
                            {t(`media.${opt.id}`)}
                          </span>
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </Listbox>
              </div>

              <div className="flex-1 relative z-40">
                {/* SearchInput bileşeninin de içeride h-10 gibi kompakt bir yapı kullandığını varsayıyoruz */}
                <SearchInput type={type} onSelect={handleSearchSelect} />
              </div>
            </div>
          </div>

          {/* 2. MANUEL DETAYLAR (İnce Inputlar) */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-sm relative z-30">
            <div className="flex items-center gap-2 mb-4">
              <FaPen className="text-emerald-500 text-sm" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">İçerik Detayları</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">{t('create.titleLabel')} *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-400"
                  />
                </div>
                {type === 'book' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">{t('create.authorLabel')}</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">{t('create.imageLabel')}</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">{t('create.descriptionLabel')}</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-400 resize-none custom-scrollbar"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-4 items-center">
                {/* İnce Puan Slider */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase mb-2">
                    <FaStar className="text-amber-400 text-xs" /> Puan: <span className="text-sm font-black" style={{ color: ratingColor }}>{rating}</span>
                  </label>
                  <div className="px-1.5">
                    <Slider
                      value={parseFloat(rating)}
                      onChange={(v) => setRating(String(Array.isArray(v) ? v[0] : v))}
                      min={0} max={10} step={0.1}
                      trackStyle={{ backgroundColor: ratingColor, height: 4 }}
                      handleStyle={{ borderColor: ratingColor, backgroundColor: 'white', height: 14, width: 14, marginTop: -5, opacity: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                      railStyle={{ backgroundColor: '#e2e8f0', height: 4 }}
                    />
                  </div>
                </div>

                {/* Minimal Standart Toggle */}
                <div className="flex flex-col items-end justify-center">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Durum</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      {watched ? t('media.watched') : t('media.notWatched')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWatched(!watched)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${watched ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${watched ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. TÜRLER VE ETİKETLER */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-sm relative z-20">
            <div className="flex items-center gap-2 mb-4">
              <FaTags className="text-purple-500 text-sm" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Tür & Etiketler</h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {GENRES[type].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${genres.includes(g)
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); } }}
                    placeholder="Etiket yazıp Enter'a basın..."
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => { addTag(tagInput); setTagInput(''); }} className="px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">
                    Ekle
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(t => (
                    <button key={t} type="button" onClick={() => addTag(t)} className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-dashed border-slate-300 dark:border-zinc-700 text-slate-400 hover:text-purple-500 transition-colors">
                      + {t}
                    </button>
                  ))}
                  {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      #{tag}
                      <button type="button" onClick={() => removeTag(i)} className="hover:text-purple-500 ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !title}
            className="w-full h-11 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-xl shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <span>Kaydediliyor...</span> : <><FaCheck className="text-xs" /> Kütüphaneye Ekle</>}
          </button>
        </form>

        {/* ═══ SAĞ KOLON: ÖNİZLEME (Sticky) ═══ */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-6 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Önizleme</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Aktif</span>
              </div>
            </div>
            <div className="w-full max-w-[240px] mx-auto">
              <MediaCard item={previewItem} refetch={() => { }} readOnly />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}