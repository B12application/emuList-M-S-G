// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import { FaFilm, FaTv, FaGamepad, FaChartPie, FaSpinner, FaLightbulb } from 'react-icons/fa';
import useMediaStats from '../hooks/useMediaStats'; 
import useMedia from '../hooks/useMedia'; // 1. useMedia hook'unu import et
import RecommendationCard from '../components/RecommendationCard'; // 2. Yeni Kartı import et

export default function HomePage() {
  const { stats, loading } = useMediaStats();
  
  // 3. Veritabanından izlenmeyen önerileri çek
  const { items: movieRecs, loading: movieLoading } = useMedia('movie', 'not-watched', 1);
  const { items: seriesRecs, loading: seriesLoading } = useMedia('series', 'not-watched', 1);
  const { items: gameRecs, loading: gameLoading } = useMedia('game', 'not-watched', 1);

  const movieRecommendation = movieRecs[0];
  const seriesRecommendation = seriesRecs[0];
  const gameRecommendation = gameRecs[0];
  
  const recommendationsLoading = movieLoading || seriesLoading || gameLoading;

  return (
    <section className="py-10">
      
      {/* === BAŞLIK BÖLÜMÜ (Değişmedi) === */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          eMulusoy List
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Film, dizi ve oyun arşivine hoş geldin.
        </p>
      </div>

      {/* === İSTATİSTİK BÖLÜMÜ (Değişmedi) === */}
      <div className="mt-16 mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaChartPie /> İstatistikler
        </h2>
        {loading ? (
          <div className="flex justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <FaSpinner className="animate-spin h-8 w-8 text-indigo-500" />
            <span className="ml-3 text-lg">İstatistikler yükleniyor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Toplam Kayıt</h4>
              <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Film Sayısı</h4>
              <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.movieCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Dizi Sayısı</h4>
              <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.seriesCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Oyun Sayısı</h4>
              <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.gameCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* === MEVCUT NAVİGASYON KARTLARI (Değişmedi) === */}
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {/* Film Kartı */}
        <Link 
          to="/movie" 
          className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8"
        >
          <div>
            <FaFilm className="h-12 w-12 text-indigo-500" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Filmler
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              İzlediğin veya izleyeceğin filmleri listele.
            </p>
          </div>
          <span className="mt-6 font-semibold text-indigo-600 group-hover:underline">
            Listeye Git &rarr;
          </span>
        </Link>
        {/* Dizi Kartı */}
        <Link 
          to="/series" 
          className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8"
        >
          <div>
            <FaTv className="h-12 w-12 text-indigo-500" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Diziler
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Tüm dizi koleksiyonunu yönet.
            </p>
          </div>
          <span className="mt-6 font-semibold text-indigo-600 group-hover:underline">
            Listeye Git &rarr;
          </span>
        </Link>
        {/* Oyun Kartı */}
        <Link 
          to="/game" 
          className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8"
        >
          <div>
            <FaGamepad className="h-12 w-12 text-indigo-500" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Oyunlar
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Oynadığın veya bitirdiğin oyunlar.
            </p>
          </div>
          <span className="mt-6 font-semibold text-indigo-600 group-hover:underline">
            Listeye Git &rarr;
          </span>
        </Link>
      </div>

      {/* === YENİ ÖNERİ BÖLÜMÜ (Değiştirildi) === */}
      {/* Statik "Haftanın Önerileri" yerine dinamik öneriler geldi */}
      <div className="mt-20">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaLightbulb /> Senin İçin Öneriler (İzlenmeyenler)
        </h2>
        {recommendationsLoading ? (
          <div className="flex justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <FaSpinner className="animate-spin h-8 w-8 text-indigo-500" />
            <span className="ml-3 text-lg">Öneriler yükleniyor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RecommendationCard item={movieRecommendation} typeLabel="Film" />
            <RecommendationCard item={seriesRecommendation} typeLabel="Dizi" />
            <RecommendationCard item={gameRecommendation} typeLabel="Oyun" />
          </div>
        )}
      </div>
      
    </section>
  );
}