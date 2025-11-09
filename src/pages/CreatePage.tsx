import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { MediaType } from '../types/media';

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const defaultType = (searchParams.get('type') as MediaType) || 'movie';

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>(defaultType);
  const [rating, setRating] = useState('0');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [watched, setWatched] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type) {
      setError("Başlık ve Tür alanları zorunludur.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const newMediaItem = {
        title,
        type,
        rating,
        image,
        description,
        watched,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "mediaItems"), newMediaItem);
      
      setIsLoading(false);
      navigate(`/${type}`); 

    } catch (err) {
      setIsLoading(false);
      setError("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(err);
    }
  };

  return (
    <section className="py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Yeni Kayıt Ekle</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1">
            Tür
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as MediaType)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="movie">Film (Movie)</option>
            <option value="series">Dizi (Series)</option>
            <option value="game">Oyun (Game)</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Başlık
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm font-medium mb-1">
            Puan (örn: 8.5)
          </label>
          <input
            type="text"
            id="rating"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">
            Görsel URL
          </label>
          <input
            type="url"
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Açıklama
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="watched"
            checked={watched}
            onChange={(e) => setWatched(e.target.checked)}
            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="watched" className="text-sm font-medium">
            İzlendi / Oynandı
          </label>
        </div>

        <hr className="dark:border-gray-700" />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isLoading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </section>
  );
}