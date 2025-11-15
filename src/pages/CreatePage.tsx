// src/pages/CreatePage.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { MediaItem, MediaType } from '../types/media';
import { FaFilm, FaTv, FaGamepad } from 'react-icons/fa';
import MediaCard from '../components/MediaCard';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // === HATA DÜZELTMESİ BURADA ===
  // '|| 'movie'' varsayımını kaldırıyoruz.
  const defaultType = (searchParams.get('type') as MediaType) || undefined;

  const [title, setTitle] = useState('');
  // State artık 'undefined' (tanımsız) olarak başlayabilir
  const [type, setType] = useState<MediaType | undefined>(defaultType); 
  const [rating, setRating] = useState('0'); 
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [watched, setWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 'type' seçilmemişse hata ver (bu kontrol zaten vardı ama artık daha anlamlı)
    if (!title || !type) {
      setError("Başlık ve Tür alanları zorunludur."); return;
    }
    setIsLoading(true); setError(null);
    try {
      const newMediaItem = {
        title, type, rating, image, description, watched,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "mediaItems"), newMediaItem);
      setIsLoading(false);
      navigate(`/${type}`); 
    } catch (err) {
      setIsLoading(false);
      setError("Kayıt sırasında bir hata oluştu."); console.error(err);
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
    if (val < 5) return '#ef4444'; // Red-500
    if (val < 8) return '#f59e0b'; // Amber-500
    return '#22c55e'; // Green-500
  };

  const ratingColor = getRatingColor(rating);

  const previewItem: MediaItem = {
    id: 'preview-id',
    title: title || "Başlık...",
    image: image || "", 
    rating: rating || "0",
    description: description || "Açıklama...",
    watched: watched,
    // 'type' tanımsızsa, kartta bir hata olmasın diye 'movie' varsay
    type: type || 'movie', 
    createdAt: Timestamp.now()
  };

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

          {/* ... (Formun geri kalanı aynı) ... */}
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