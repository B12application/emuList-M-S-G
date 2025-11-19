// src/pages/HomePage.tsx
import { Link, useNavigate } from 'react-router-dom'; // 1. YENİ: useNavigate eklendi
import { FaFilm, FaTv, FaGamepad, FaChartPie, FaSpinner, FaLightbulb } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import useMediaStats from '../hooks/useMediaStats';
import useMedia from '../hooks/useMedia';
import RecommendationCard from '../components/RecommendationCard';
import useUserProfile from '../hooks/useUserProfile'; // 3. YENİ: useUserProfile (cinsiyet için) import edildi

// 4. Varsayılan avatarlar (E-posta ile kayıtta kullanılacak)
const MALE_AVATAR_URL = '/male-avatar.png';
const FEMALE_AVATAR_URL = '/female-avatar.png';
// Senin LinkedIn fotoğrafın (Google ile girişte bu ezilecek)
const MUSTAFA_FOTOGRAF_URL = 'https://media.licdn.com/dms/image/v2/D4D03AQHRoyTjZps44Q/profile-displayphoto-scale_400_400/B4DZoQHQIrJUAg-/0/1761206929282?e=1764806400&v=beta&t=tusG_nDiaOVkRzK7XKZi-FwS-u3OrhCQOF7WSyn1Ano';

export default function HomePage() {
  // 5. YENİ: Kullanıcı bilgileri ve yönlendirici
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  // 6. YENİ: Korumalı Rota Mantığı
  // Eğer (AuthContext) kontrolü bitmediyse (loading) veya kullanıcı yoksa,
  // onu login'e yönlendir.
  if (!user) {
    navigate('/login');
    return null; // Yönlendirirken boş sayfa göster
  }

  // --- Buradan sonrası sadece giriş yapmış kullanıcılar için ---

  const { stats, loading: statsLoading } = useMediaStats();
  
  // 7. YENİ: useMedia çağrıları artık 2 argüman alıyor (page kaldırıldı)
  const { items: movieRecs, loading: movieLoading, refetch: movieRefetch } = useMedia('movie', 'not-watched');
  const { items: seriesRecs, loading: seriesLoading, refetch: seriesRefetch } = useMedia('series', 'not-watched');
  const { items: gameRecs, loading: gameLoading, refetch: gameRefetch } = useMedia('game', 'not-watched');

  const movieRecommendation = movieRecs[0];
  const seriesRecommendation = seriesRecs[0];
  const gameRecommendation = gameRecs[0];
  
  const recommendationsLoading = movieLoading || seriesLoading || gameLoading;

  // 8. YENİ: Dinamik İsim ve Fotoğraf mantığı
  const displayName = user.displayName || user.email?.split('@')[0] || "Kullanıcı";
  
  const getAvatar = () => {
    if (user.photoURL) return user.photoURL; // Google fotoğrafı
    if (profile?.gender === 'male') return MALE_AVATAR_URL;
    if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
    // Eğer senin UID'inle giriş yapıldıysa (ve Google fotoğrafı yoksa) LinkedIn fotoğrafını göster
    if (user.uid === 'ZKU7SObBkeNzMicltUKJjo6ybHH2') return MUSTAFA_FOTOGRAF_URL;
    return MALE_AVATAR_URL; // Varsayılan
  };

  return (
    <section className="py-10">
      
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16">
        
        <div className="flex-shrink-0">
          <img 
            src={getAvatar()} 
            alt="Profil" 
            className="h-40 w-40 rounded-full object-cover shadow-xl border-4 border-white dark:border-gray-800 ring-4 ring-rose-100 dark:ring-rose-900/30"
          />
        </div>
      	<div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-xs font-bold uppercase tracking-wide">
              Unutkanlığa Son
            </span>
          </div>
          
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Dijital Hafıza <span className="text-rose-500">Vitamini.</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            <strong>{displayName}</strong>, hafızanı taze tutmaya hoş geldin! 
            İzlediğin filmleri, bitirdiğin oyunları unutmamak için günde bir doz 
            <strong> B12</strong> almayı unutma. 
          </p>
          
          <div className="mt-8 flex gap-4">
            <Link 
              to="/create" 
              className="px-6 py-3 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/30 hover:bg-rose-700 hover:shadow-rose-500/50 transition-all transform hover:-translate-y-1"
            >
              + Doz Ekle
            </Link>
            <Link 
              to="/all" 
              className="px-6 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold border border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-rose-900 transition-all"
            >
              Arşivi İncele
            </Link>
          </div>
        </div>
      </div>

    	{/* === İSTATİSTİK BÖLÜMÜ (Değişmedi) === */}
    	<div className="mt-16 mb-12">
      	<h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        	<FaChartPie /> İstatistikler
      	</h2>
      	{statsLoading ? ( // 'loading' -> 'statsLoading' olarak düzeltildi
        	<div className="flex justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          	<FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
          	<span className="ml-3 text-lg">İstatistikler yükleniyor...</span>
        	</div>
      	) : (
        	<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          	<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
            	<h4 className="text-lg font-medium text-gray-500 dark:text-gray-400">Toplam Kayıt</h4>
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

    	{/* === NAVİGASYON KARTLARI (Değişmedi) === */}
    	<div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
      	<Link 
        	to="/movie" 
        	className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8"
      	>
        	<div>
          	<FaFilm className="h-12 w-12 text-sky-500" />
          	<h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            	Filmler
          	</h3>
        	</div>
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
      	</div>
      	<span className="mt-6 font-semibold text-sky-600 group-hover:underline">
        	Listeye Git &rarr;
      	</span>
  	</Link>
  </div>

  	{/* === ÖNERİLER BÖLÜMÜ (Değişmedi) === */}
  	<div className="mt-20">
  		<h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
    		<FaLightbulb /> Senin İçin Öneriler (İzlenmeyenler)
  		</h2>
  		{recommendationsLoading ? (
  		<div className="flex justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
    		<FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
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