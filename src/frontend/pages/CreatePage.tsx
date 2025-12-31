// src/frontend/pages/CreatePage.tsx
// Refactored: Simplified and modern design

import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../backend/config/firebaseConfig';
import { addDoc, collection, serverTimestamp, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { MediaItem, MediaType } from '../../backend/types/media';
import { FaFilm, FaTv, FaGamepad, FaBook, FaStar, FaCheck } from 'react-icons/fa';
import MediaCard from '../components/MediaCard';
import SearchInput from '../components/create/SearchInput';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createActivity } from '../../backend/services/activityService';

// Predefined genres for each type
const GENRES = {
  movie: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'],
  series: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy'],
  game: ['Action', 'Adventure', 'RPG', 'Strategy', 'Sports', 'Puzzle', 'Shooter', 'Horror'],
  book: ['Fiction', 'Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Biography', 'History'],
};

// Suggested tags
const SUGGESTED_TAGS = ['favorim', 'tekrar-izle', 'klasik', 'keşfet'];

export default function CreatePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') as MediaType | null;

  // Form state
  const [type, setType] = useState<MediaType | undefined>(defaultType || undefined);
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true); // Accordion state

  // Handle search result selection
  const handleSearchSelect = (details: { title: string; image: string; description: string; rating: string; author?: string; genres: string[]; totalSeasons?: number }) => {
    setTitle(details.title);
    setImage(details.image);
    setDescription(details.description);
    setRating(details.rating);
    if (details.author) setAuthor(details.author);
    if (details.genres.length) setGenres(details.genres);
    // Diziler için toplam sezon sayısını kaydet
    if (details.totalSeasons) setTotalSeasons(details.totalSeasons);
  };

  // Toggle genre
  const toggleGenre = (g: string) => {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  // Add tag
  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (normalized && !tags.includes(normalized)) {
      setTags([...tags, normalized]);
    }
  };

  // Remove tag
  const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));

  // Rating color
  const ratingColor = useMemo(() => {
    const r = parseFloat(rating);
    if (r >= 8) return '#22c55e';
    if (r >= 6) return '#eab308';
    if (r >= 4) return '#f97316';
    return '#ef4444';
  }, [rating]);

  // Preview item
  const previewItem: MediaItem = {
    id: 'preview',
    title: title || t('create.titlePlaceholder'),
    image: image || '',
    description: description || '',
    rating,
    watched,
    type: type || 'movie',
    createdAt: Timestamp.now(),
    author: type === 'book' ? author : undefined,
    genre: genres.join(', ') || undefined,
    tags: tags.length > 0 ? tags : undefined,
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t('create.loginRequired')); return; }
    if (!title || !type) { toast.error(t('create.requiredFields')); return; }

    setIsLoading(true);
    try {
      // Check for duplicates
      const q = query(collection(db, 'mediaItems'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const isDuplicate = snap.docs.some(doc =>
        doc.data().title?.trim().toLowerCase() === title.trim().toLowerCase()
      );
      if (isDuplicate) {
        toast.error(t('create.alreadyExists'));
        setIsLoading(false);
        return;
      }

      // Create item
      const newItem: any = {
        title, type, rating, image, description, watched,
        createdAt: serverTimestamp(),
        userId: user.uid
      };
      if (author && type === 'book') newItem.author = author;
      if (genres.length) newItem.genre = genres.join(', ');
      if (tags.length) newItem.tags = tags;
      // Diziler için sezon bilgisini ekle
      if (type === 'series' && totalSeasons) {
        newItem.totalSeasons = totalSeasons;
        newItem.watchedSeasons = [];
      }

      const docRef = await addDoc(collection(db, 'mediaItems'), newItem);

      // Create activity
      await createActivity(user.uid, user.displayName || 'User', user.photoURL || undefined, 'media_added', {
        ...newItem, id: docRef.id
      });

      toast.success(t('create.addSuccess'));
      navigate(`/${type}`);
    } catch (err) {
      toast.error(t('create.errorAdding'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Type config
  const typeConfig = {
    movie: { icon: FaFilm, color: 'blue', label: t('media.movie') },
    series: { icon: FaTv, color: 'emerald', label: t('media.series') },
    game: { icon: FaGamepad, color: 'amber', label: t('media.game') },
    book: { icon: FaBook, color: 'rose', label: t('media.book') },
  };

  return (
    <section className="py-8 px-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('create.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">

          {/* Step 1: Type Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">1. {t('create.selectType')}</h2>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(typeConfig) as MediaType[]).map((t) => {
                const { icon: Icon, color, label } = typeConfig[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${isSelected
                      ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-500'
                      }`}
                  >
                    <Icon className="text-xl" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Search - Collapsible */}
          {type && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  🔍 2. {t('create.searchLabel')}
                  <span className="text-xs font-normal text-gray-400">(opsiyonel)</span>
                </h2>
                <span className={`text-gray-400 transition-transform ${searchOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {searchOpen && (
                <div className="px-4 pb-4">
                  <SearchInput type={type} onSelect={handleSearchSelect} />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {type && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">3. {t('create.detailsLabel')}</h2>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('create.titleLabel')} *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('create.imageLabel')}</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('create.descriptionLabel')}</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm resize-none"
                />
              </div>

              {/* Author (books only) */}
              {type === 'book' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('create.authorLabel')}</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                  />
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <FaStar className="text-yellow-500" /> {t('create.ratingLabel')}: <span className="font-bold" style={{ color: ratingColor }}>{rating}</span>
                </label>
                <Slider
                  value={parseFloat(rating)}
                  onChange={(v) => setRating(String(Array.isArray(v) ? v[0] : v))}
                  min={0} max={10} step={0.1}
                  trackStyle={{ backgroundColor: ratingColor, height: 6 }}
                  handleStyle={{ borderColor: ratingColor, backgroundColor: 'white', height: 18, width: 18, marginTop: -6 }}
                  railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
                />
              </div>

              {/* Watched Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setWatched(!watched)}
                  className={`w-12 h-6 rounded-full transition-colors ${watched ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${watched ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {watched ? <><FaCheck className="inline text-green-500 mr-1" />{t('media.watched')}</> : t('media.notWatched')}
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Genres & Tags */}
          {type && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">4. {t('create.genresAndTags')}</h2>

              {/* Genres */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">🎭 {t('genreLabel')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES[type].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${genres.includes(g)
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-400'
                        }`}
                    >
                      {genres.includes(g) && '✓ '}{g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">🏷️ {t('tags.label')}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); } }}
                    placeholder={t('tags.addPlaceholder')}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                  />
                  <button type="button" onClick={() => { addTag(tagInput); setTagInput(''); }} className="shrink-0 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">+</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(t => (
                    <button key={t} type="button" onClick={() => addTag(t)} className="px-2 py-0.5 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-blue-400 hover:text-blue-500">+{t}</button>
                  ))}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        #{tag}
                        <button type="button" onClick={() => removeTag(i)} className="hover:text-blue-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          {type && (
            <button
              type="submit"
              disabled={isLoading || !title}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? t('common.loading') : t('create.addButton')}
            </button>
          )}
        </form>

        {/* Preview Card */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">{t('create.preview')}</h2>
            <MediaCard item={previewItem} refetch={() => { }} readOnly />
          </div>
        </div>
      </div>
    </section>
  );
}