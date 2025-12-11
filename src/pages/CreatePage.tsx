// src/pages/CreatePage.tsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
// 1. YENİ: getDocs, query, where import edildi
import { addDoc, collection, serverTimestamp, Timestamp, getDocs, query, where } from 'firebase/firestore';
import type { MediaItem, MediaType } from '../types/media';
import { FaFilm, FaTv, FaGamepad, FaBook, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import MediaCard from '../components/MediaCard';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { searchMovies, getMovieById, normalizeRating, type OMDbSearchResult } from '../services/omdbApi';
import { searchBooks, getBookById, normalizeBookRating, getBookCoverUrl, formatAuthors, type GoogleBooksSearchResult } from '../services/googleBooksApi';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function CreatePage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultType = (searchParams.get('type') as MediaType) || undefined;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType | undefined>(defaultType);
  const [rating, setRating] = useState('0');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState(''); // Kitaplar için yazar
  const [watched, setWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OMDbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Book search states
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<GoogleBooksSearchResult[]>([]);
  const [isBookSearching, setIsBookSearching] = useState(false);
  const [bookSearchError, setBookSearchError] = useState<string | null>(null);
  const [showBookSearchResults, setShowBookSearchResults] = useState(false);
  const bookSearchTimeoutRef = useRef<number | null>(null);
  const bookSearchContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      const errorMessage = t('create.loginRequired');
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (!title || !type) {
      setError(t('create.requiredFields')); return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // === 2. YENİ: BENZERLİK KONTROLÜ (Bu kısım eksikti) ===
      // Kullanıcının tüm kayıtlarını çekip başlık kontrolü yapıyoruz.
      const q = query(collection(db, "mediaItems"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      // Girilen başlığı normalize et (boşlukları sil, küçük harfe çevir)
      const normalizedNewTitle = title.trim().toLowerCase();

      const isDuplicate = querySnapshot.docs.some(doc => {
        const existingTitle = doc.data().title;
        // Mevcut başlığı normalize et ve karşılaştır
        return existingTitle && existingTitle.trim().toLowerCase() === normalizedNewTitle;
      });

      if (isDuplicate) {
        const errorMsg = `"${title}" ${t('create.alreadyExists')}`;
        setError(errorMsg);
        toast.error(errorMsg, { duration: 4000 });
        setIsLoading(false);
        return; // İşlemi durdur, kaydetme
      }
      // === KONTROL BİTİŞİ ===

      const newMediaItem: any = {
        title, type, rating, image, description, watched,
        createdAt: serverTimestamp(),
        userId: user.uid
      };

      // Kitaplar için yazar bilgisini ekle
      if (type === 'book' && author) {
        newMediaItem.author = author;
      }

      await addDoc(collection(db, "mediaItems"), newMediaItem);
      toast.success(t('create.successAdded'));
      setIsLoading(false);
      navigate(`/${type}`);
    } catch (err) {
      setIsLoading(false);
      const errorMessage = t('create.errorAdding');
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    }
  };

  const getTypeButtonCls = (buttonType: MediaType) => {
    const baseCls = "flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-colors";
    if (type === buttonType) {
      return `${baseCls} bg-sky-600 text-white shadow-lg`;
    }
    return `${baseCls} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700`;
  };

  const handleSliderChange = (newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setRating(String(value));
  };

  const handleRatingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") setRating('0');
    const numVal = parseFloat(val);
    if (numVal > 9.9) setRating('9.9');
    else if (numVal < 0) setRating('0');
    else setRating(val);
  };

  const getRatingColor = (r: string): string => {
    const val = parseFloat(r) || 0;
    if (val < 5) return '#ef4444';
    if (val < 8) return '#f59e0b';
    return '#22c55e';
  };

  const ratingColor = getRatingColor(rating);

  // OMDb arama fonksiyonu
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!searchQuery.trim() || (type !== 'movie' && type !== 'series')) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchMovies(searchQuery, type);
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Arama sırasında bir hata oluştu';
        setSearchError(errorMessage);
        setSearchResults([]);
        setShowSearchResults(false);
        toast.error(errorMessage);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, type]);

  // Dışarı tıklandığında
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (bookSearchContainerRef.current && !bookSearchContainerRef.current.contains(event.target as Node)) {
        setShowBookSearchResults(false);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchResults(false);
        setShowBookSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Google Books arama fonksiyonu
  useEffect(() => {
    if (bookSearchTimeoutRef.current) {
      clearTimeout(bookSearchTimeoutRef.current);
    }
    if (!bookSearchQuery.trim() || type !== 'book') {
      setBookSearchResults([]);
      setShowBookSearchResults(false);
      return;
    }
    bookSearchTimeoutRef.current = setTimeout(async () => {
      setIsBookSearching(true);
      setBookSearchError(null);
      try {
        const results = await searchBooks(bookSearchQuery);
        setBookSearchResults(results);
        setShowBookSearchResults(results.length > 0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Kitap arama sırasında bir hata oluştu';
        setBookSearchError(errorMessage);
        setBookSearchResults([]);
        setShowBookSearchResults(false);
        toast.error(errorMessage);
      } finally {
        setIsBookSearching(false);
      }
    }, 500);

    return () => {
      if (bookSearchTimeoutRef.current) {
        clearTimeout(bookSearchTimeoutRef.current);
      }
    };
  }, [bookSearchQuery, type]);

  // Arama sonucu seçildiğinde
  const handleSelectSearchResult = async (result: OMDbSearchResult) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      const details = await getMovieById(result.imdbID);
      setTitle(details.Title);
      setImage(details.Poster && details.Poster !== 'N/A' ? details.Poster : '');
      setDescription(details.Plot && details.Plot !== 'N/A' ? details.Plot : '');
      if (details.imdbRating && details.imdbRating !== 'N/A') {
        setRating(normalizeRating(details.imdbRating));
      }
      setShowSearchResults(false);
      setSearchQuery('');
      toast.success(t('create.loaded'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error');
      setSearchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  // Kitap arama sonucu seçildiğinde
  const handleSelectBookResult = async (result: GoogleBooksSearchResult) => {
    try {
      setIsBookSearching(true);
      setBookSearchError(null);
      const details = await getBookById(result.id);

      setTitle(details.volumeInfo.title);
      const coverUrl = getBookCoverUrl(details.volumeInfo.imageLinks);
      setImage(coverUrl);
      setDescription(details.volumeInfo.description || '');

      // Yazar bilgisini kaydet
      const authorInfo = formatAuthors(details.volumeInfo.authors);
      setAuthor(authorInfo);

      if (details.volumeInfo.averageRating) {
        setRating(normalizeBookRating(details.volumeInfo.averageRating));
      }

      setShowBookSearchResults(false);
      setBookSearchQuery('');
      toast.success(t('create.loaded'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error');
      setBookSearchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsBookSearching(false);
    }
  };

  const previewItem: MediaItem = {
    id: 'preview-id',
    title: title || "Başlık...",
    image: image || "",
    rating: rating || "0",
    description: description || "Açıklama...",
    watched: watched,
    type: type || 'movie',
    createdAt: Timestamp.now(),
    author: type === 'book' ? author : undefined // Kitaplar için yazar göster
  };

  return (
    <section className="py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
        {t('create.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              {t('create.selectType')} {type === undefined && <span className="text-red-500">* {t('create.typeRequired')}</span>}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => setType('movie')} className={getTypeButtonCls('movie')}>
                <FaFilm /> {t('media.movie')}
              </button>
              <button type="button" onClick={() => setType('series')} className={getTypeButtonCls('series')}>
                <FaTv /> {t('media.series')}
              </button>
              <button type="button" onClick={() => setType('game')} className={getTypeButtonCls('game')}>
                <FaGamepad /> {t('media.game')}
              </button>
              <button type="button" onClick={() => setType('book')} className={getTypeButtonCls('book')}>
                <FaBook /> {t('media.book')}
              </button>
            </div>
          </div>

          {(type === 'movie' || type === 'series') && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg" ref={searchContainerRef}>
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                {t('create.searchOMDb')}
              </label>
              <div className="relative">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    placeholder={`${type === 'movie' ? t('media.movie') : t('media.series')} ${t('create.searchPlaceholder')}`}
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <FaTimes />
                    </button>
                  )}
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FaSpinner className="animate-spin text-sky-500" />
                    </div>
                  )}
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.imdbID}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <ImageWithFallback
                          src={result.Poster}
                          alt={result.Title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {result.Title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {result.Year}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchError && (
                  <div className="mt-2 text-sm text-red-500">
                    {searchError}
                  </div>
                )}

                {!isSearching && searchQuery.trim() && searchResults.length === 0 && !searchError && (
                  <div className="mt-4">
                    <EmptyState
                      icon={<FaSearch />}
                      title={t('create.noResults')}
                      description={`"${searchQuery}" ${t('create.tryDifferent')}`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {type === 'book' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg" ref={bookSearchContainerRef}>
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                {t('create.searchGoogleBooks')}
              </label>
              <div className="relative">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (bookSearchResults.length > 0) {
                        setShowBookSearchResults(true);
                      }
                    }}
                    placeholder={t('create.bookSearchPlaceholder')}
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {bookSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setBookSearchQuery('');
                        setBookSearchResults([]);
                        setShowBookSearchResults(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <FaTimes />
                    </button>
                  )}
                  {isBookSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FaSpinner className="animate-spin text-sky-500" />
                    </div>
                  )}
                </div>

                {showBookSearchResults && bookSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-96 overflow-y-auto">
                    {bookSearchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelectBookResult(result)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <ImageWithFallback
                          src={result.volumeInfo.imageLinks?.thumbnail || ''}
                          alt={result.volumeInfo.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {result.volumeInfo.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {formatAuthors(result.volumeInfo.authors)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {result.volumeInfo.publishedDate?.split('-')[0] || ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {bookSearchError && (
                  <div className="mt-2 text-sm text-red-500">
                    {bookSearchError}
                  </div>
                )}

                {!isBookSearching && bookSearchQuery.trim() && bookSearchResults.length === 0 && !bookSearchError && (
                  <div className="mt-4">
                    <EmptyState
                      icon={<FaSearch />}
                      title={t('create.noResults')}
                      description={`"${bookSearchQuery}" ${t('create.tryDifferent')}`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col gap-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  {t('create.titleLabel')}
                </label>
                <input type="text" id="title" value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-medium mb-1">
                  {t('create.imageLabel')}
                </label>
                <input type="url" id="image" value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  {t('create.descriptionLabel')}
                </label>
                <textarea id="description" rows={4} value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col gap-5">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium mb-2">
                  {t('create.ratingLabel')}
                </label>
                <div className="px-1">
                  <Slider
                    value={parseFloat(rating) || 0}
                    onChange={handleSliderChange}
                    min={0}
                    max={9.9}
                    step={0.1}
                    trackStyle={{ backgroundColor: ratingColor, height: 6 }}
                    handleStyle={{
                      borderColor: ratingColor,
                      backgroundColor: 'white',
                      height: 18,
                      width: 18,
                      marginTop: -6,
                      opacity: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
                  />
                </div>
                <input
                  type="number"
                  id="rating"
                  value={rating}
                  onChange={handleRatingInputChange}
                  min="0"
                  max="9.9"
                  step="0.1"
                  className="w-full mt-3 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('create.statusLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => setWatched(!watched)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${watched ? 'bg-sky-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${watched ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {watched
                    ? (type === 'game' ? t('media.played') : type === 'book' ? t('media.read') : t('media.watched'))
                    : (type === 'game' ? t('media.notPlayed') : type === 'book' ? t('media.notRead') : t('media.notWatched'))
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 rounded-xl bg-sky-600 text-white font-semibold text-lg hover:bg-sky-700 transition disabled:opacity-50"
            >
              {isLoading ? t('create.saving') : t('actions.save')}
            </button>
          </div>
        </form>

        <div className="lg:col-span-1">
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            {t('create.preview')}
          </h3>
          <div className="sticky top-24">
            <MediaCard
              item={previewItem}
              refetch={() => { }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}