// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import { FaFilm, FaTv, FaGamepad, FaChartPie, FaSpinner, FaLightbulb } from 'react-icons/fa';
import useMediaStats from '../hooks/useMediaStats'; 
import useMedia from '../hooks/useMedia';
import RecommendationCard from '../components/RecommendationCard';

const PROFIL_FOTOGRAFI_URL = 'https://media.licdn.com/dms/image/v2/D4D03AQHRoyTjZps44Q/profile-displayphoto-scale_400_400/B4DZoQHQIrJUAg-/0/1761206929282?e=1764806400&v=beta&t=tusG_nDiaOVkRzK7XKZi-FwS-u3OrhCQOF7WSyn1Ano'; // Burayı kendi fotoğrafınla güncellemeyi unutma

export default function HomePage() {
  const { stats, loading } = useMediaStats();
 const { items: movieRecs, loading: movieLoading, refetch: movieRefetch } = useMedia('movie', 'not-watched');
  const { items: seriesRecs, loading: seriesLoading, refetch: seriesRefetch } = useMedia('series', 'not-watched');
  const { items: gameRecs, loading: gameLoading, refetch: gameRefetch } = useMedia('game', 'not-watched');

  const movieRecommendation = movieRecs[0];
  const seriesRecommendation = seriesRecs[0];
  const gameRecommendation = gameRecs[0];
  
  const recommendationsLoading = movieLoading || seriesLoading || gameLoading;

  return (
    <section className="py-10">
      
      {/* === AÇILIŞ EKRANI === */}
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16">
        
        <div className="flex-shrink-0">
          <img 
            src={PROFIL_FOTOGRAFI_URL} 
            alt="Mustafa Ulusoy" 
            className="h-40 w-40 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-800"
          />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            mustafa ulusoy
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Film, dizi ve oyun arşivine hoş geldin. Bu kişisel projede,
            izlediğim ve oynamayı planladığım içerikleri listeliyorum.
          </p>
          <div className="mt-6 flex gap-4">
            {/* RENK DEĞİŞİKLİĞİ: 'bg-rose-600' -> 'bg-sky-600' */}
            <Link 
              to="/all" 
              className="px-5 py-3 rounded-lg bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition"
            >
              Tüm Arşivi Gör
            </Link>
            <Link 
              to="/create" 
              className="px-5 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Yeni Kayıt Ekle
            </Link>
          </div>
        </div>
      </div>

      {/* === İSTATİSTİK BÖLÜMÜ === */}
      <div className="mt-16 mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaChartPie /> İstatistikler
        </h2>
        {loading ? (
          <div className="flex justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            {/* RENK DEĞİŞİKLİĞİ: 'text-indigo-500' -> 'text-sky-500' */}
            <FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
            <span className="ml-3 text-lg">İstatistikler yükleniyor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Toplam Kayıt</h4>
              {/* RENK DEĞİŞİKLİĞİ: 'text-indigo-600' -> 'text-sky-600' */}
              <p className="text-4xl font-bold text-sky-600 dark:text-sky-400">{stats.totalCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Film Sayısı</h4>
              <p className="text-4xl font-bold text-sky-600 dark:text-sky-400">{stats.movieCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Dizi Sayısı</h4>
              <p className="text-4xl font-bold text-sky-600 dark:text-sky-400">{stats.seriesCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Oyun Sayısı</h4>
              <p className="text-4xl font-bold text-sky-600 dark:text-sky-400">{stats.gameCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* === NAVİGASYON KARTLARI BÖLÜMÜ === */}
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <Link 
          to="/movie" 
          className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8"
        >
          <div>
            {/* RENK DEĞİŞİKLİĞİ: 'text-indigo-500' -> 'text-sky-500' */}
            <FaFilm className="h-12 w-12 text-sky-500" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Filmler
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              İzlediğin veya izleyeceğin filmleri listele.
            </p>
          </div>
          {/* RENK DEĞİŞİKLİĞİ: 'text-indigo-600' -> 'text-sky-600' */}
          <span className="mt-6 font-semibold text-sky-600 group-hover:underline">
            Listeye Git &rarr;
          </span>
        </Link>
        <Link 
          to="/series" 
          className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8"
        >
          <div>
            <FaTv className="h-12 w-12 text-sky-500" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Diziler
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Tüm dizi koleksiyonunu yönet.
            </p>
          </div>
          <span className="mt-6 font-semibold text-sky-600 group-hover:underline">
            Listeye Git &rarr;
          </span>
        </Link>
        <Link 
          to="/game" 
          className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8"
        >
          <div>
            <FaGamepad className="h-12 w-12 text-sky-500" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Oyunlar
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Oynadığın veya bitirdiğin oyunlar.
            </p>
          </div>
          <span className="mt-6 font-semibold text-sky-600 group-hover:underline">
            Listeye Git &rarr;
          </span>
        </Link>
      </div>

      {/* === ÖNERİLER BÖLÜMÜ === */}
      <div className="mt-20">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaLightbulb /> Senin İçin Öneriler (İzlenmeyenler)
        </h2>
        {recommendationsLoading ? (
          <div className="flex justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
          	<span className="ml-3 text-lg">Öneriler yükleniyor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RecommendationCard item={movieRecommendation} typeLabel="Film" refetch={movieRefetch} />
        	<RecommendationCard item={seriesRecommendation} typeLabel="Dizi" refetch={seriesRefetch} />
        	<RecommendationCard item={gameRecommendation} typeLabel="Oyun" refetch={gameRefetch} />
          </div>
        )}
      </div>
      
    </section>
  );
}