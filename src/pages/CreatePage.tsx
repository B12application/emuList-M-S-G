// src/pages/CreatePage.tsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// 1. YENİ: 'auth' import edildi
import { db } from '../firebaseConfig'; 
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { MediaItem, MediaType } from '../types/media';
import { FaFilm, FaTv, FaGamepad, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import MediaCard from '../components/MediaCard';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { searchMovies, getMovieById, normalizeRating, type OMDbSearchResult } from '../services/omdbApi';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
// 2. YENİ: 'useAuth' (kullanıcı hafızası) import edildi
import { useAuth } from '../context/AuthContext'; 

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultType = (searchParams.get('type') as MediaType) || undefined;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType | undefined>(defaultType); 
  const [rating, setRating] = useState('0'); 
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [watched, setWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. YENİ: Giriş yapan kullanıcı bilgisi alındı
  const { user } = useAuth();

  // OMDb arama state'leri (Değişmedi)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OMDbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // === 4. DEĞİŞİKLİK BURADA (handleSubmit GÜNCELLENDİ) ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 4a. YENİ: Kullanıcı giriş kontrolü
    if (!user) {
      const errorMessage = "Kayıt eklemek için giriş yapmalısınız.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    if (!title || !type) {
      setError("Başlık ve Tür alanları zorunludur."); return;
    }
    setIsLoading(true); setError(null);
    try {
      const newMediaItem = {
        title, type, rating, image, description, watched,
        createdAt: serverTimestamp(),
        userId: user.uid // 4b. YENİ: Kayda 'userId' eklendi
      };
      await addDoc(collection(db, "mediaItems"), newMediaItem);
      toast.success('Kayıt başarıyla eklendi');
      setIsLoading(false);
      navigate(`/${type}`); 
    } catch (err) {
      setIsLoading(false);
      const errorMessage = "Kayıt sırasında bir hata oluştu.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    }
  };
  // === DEĞİŞİKLİK BİTTİ ===

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
    if (val < 5) return '#ef4444'; // Red-500
    if (val < 8) return '#f59e0b'; // Amber-500
    return '#22c55e'; // Green-500
  };

  const ratingColor = getRatingColor(rating);

  // OMDb arama fonksiyonu (Değişmedi)
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

  // Dışarı tıklandığında (Değişmedi)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Arama sonucu seçildiğinde (Değişmedi)
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
      toast.success('Film bilgileri yüklendi');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Film detayları getirilirken bir hata oluştu';
      setSearchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  // Ön izleme (Değişmedi)
  const previewItem: MediaItem = {
    id: 'preview-id',
    title: title || "Başlık...",
    image: image || "", 
    rating: rating || "0",
    description: description || "Açıklama...",
    watched: watched,
    type: type || 'movie', 
    createdAt: Timestamp.now()
  };

  // === JSX (TÜM GÖRÜNÜM) DEĞİŞMEDİ ===
  return (
    <section className="py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
        Arşive Yeni Kayıt Ekle
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Türü Seçin {type === undefined && <span className="text-red-500">* (Seçim Zorunlu)</span>}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => setType('movie')} className={getTypeButtonCls('movie')}>
                <FaFilm /> Film
              </button>
              <button type="button" onClick={() => setType('series')} className={getTypeButtonCls('series')}>
                <FaTv /> Dizi
              </button>
              <button type="button" onClick={() => setType('game')} className={getTypeButtonCls('game')}>
                <FaGamepad /> Oyun
              </button>
            </div>
          </div>

          {(type === 'movie' || type === 'series') && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg" ref={searchContainerRef}>
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                OMDb'den Ara (Film/Dizi Adı)
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
                    placeholder={`${type === 'movie' ? 'Film' : 'Dizi'} adı girin...`}
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
                      title="Sonuç bulunamadı"
                      description={`"${searchQuery}" için sonuç bulunamadı. Farklı bir arama terimi deneyin.`}
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
                  Başlık
                </label>
                <input type="text" id="title" value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-medium mb-1">
                  Görsel URL
                </label>
                <input type="url" id="image" value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Açıklama
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
                  Puan
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
                  Durum
                </label>
                <button
                  type="button"
                  onClick={() => setWatched(!watched)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    watched ? 'bg-sky-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      watched ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {watched ? "İzlendi" : "İzlenmedi"}
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
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
        
        <div className="lg:col-span-1">
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            Ön İzleme
          </h3>
          <div className="sticky top-24">
            <MediaCard 
              item={previewItem} 
              refetch={() => {}}
            />
          </div>
        </div>

      </div>
    </section>
  );
}