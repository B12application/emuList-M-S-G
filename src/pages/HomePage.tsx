// src/pages/HomePage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 1. YENİ İKONLAR EKLENDİ: FaCalendarCheck, FaHistory, FaArrowRight, FaHourglassHalf
import { FaFilm, FaTv, FaGamepad, FaChartPie, FaSpinner, FaLightbulb, FaRandom, FaCalendarCheck, FaHistory,FaHeart, FaArrowRight, FaHourglassHalf, FaPlus, FaArchive } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import useMediaStats from '../hooks/useMediaStats'; 
import useMedia from '../hooks/useMedia';
import RecommendationCard from '../components/RecommendationCard';
import useUserProfile from '../hooks/useUserProfile';
import type { MediaItem } from '../types/media';

import DetailModal from '../components/DetailModal';

const MALE_AVATAR_URL = '/male-avatar.png';
const FEMALE_AVATAR_URL = '/female-avatar.png';
const MUSTAFA_FOTOGRAF_URL = 'https://media.licdn.com/dms/image/v2/D4D03AQFVgcz9aWEWPQ/profile-displayphoto-scale_400_400/B4DZrVBAm4HsAg-/0/1764510406029?e=1766620800&v=beta&t=gombvy-MJsL6YnjW6WtztxL89KG2x1_39u8jP8Nmtak';

export default function HomePage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  
  const [randomItem, setRandomItem] = useState<MediaItem | null>(null);
  const [selectedRecentItem, setSelectedRecentItem] = useState<MediaItem | null>(null);

  // 2. YENİ: Tarihçe ve Günlük için TÜM verileri çekiyoruz
  // 3. parametre 'true' olduğu için limit olmadan hepsini çeker.
  const { items: allItems, loading: allLoading, refetch: allRefetch } = useMedia('all', 'all', true);

  if (!user) {
    navigate('/login');
    return null; 
  }

  const { stats, loading: statsLoading } = useMediaStats();
 
  // Öneriler için veri çekme (Değişmedi)
  const { items: movieRecs, loading: movieLoading, refetch: movieRefetch } = useMedia('movie', 'not-watched', false);
  const { items: seriesRecs, loading: seriesLoading, refetch: seriesRefetch } = useMedia('series', 'not-watched', false);
  const { items: gameRecs, loading: gameLoading, refetch: gameRefetch } = useMedia('game', 'not-watched', false);

  const movieRecommendation = movieRecs[0];
  const seriesRecommendation = seriesRecs[0];
  const gameRecommendation = gameRecs[0];
  const recommendationsLoading = movieLoading || seriesLoading || gameLoading;

  // 3. YENİ: VERİ İŞLEME (Günlük ve Tozlu Raflar)
  
  // A. Kütüphane Günlüğü (En Son Eklenen 5 Kayıt)
  const recentActivity = [...allItems]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  // B. Tozlu Raflar (En Eski Eklenen ve Hala İzlenmemiş 3 Kayıt)
  const dustyItems = [...allItems]
    .filter(item => !item.watched && item.createdAt) // İzlenmemiş ve tarihi olanlar
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)) // Eskiden yeniye
    .slice(0, 3);

  // Tarih Formatlayıcı
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Tarih yok';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(date);
  };

  // Profil (Değişmedi)
  const displayName = user.displayName || user.email?.split('@')[0] || "Kullanıcı";
  const getAvatar = () => {
    if (user.photoURL) return user.photoURL;
    if (user.uid === 'ZKU7SObBkeNzMicltUKJjo6ybHH2') return MUSTAFA_FOTOGRAF_URL;
    if (profile?.gender === 'male') return MALE_AVATAR_URL;
    if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
    return MALE_AVATAR_URL;
  };

  const handleRandomPick = () => {
    const pool = [...movieRecs, ...seriesRecs, ...gameRecs];
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      setRandomItem(random);
    }
  };

  return (
    <section className="py-10">
      
      {/* === AÇILIŞ EKRANI (SENİN TASARIMIN) === */}
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 p-8 md:p-12 mb-16 shadow-2xl">
  {/* Arka plan dekorları */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-32 translate-x-32" />
  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-24 translate-y-24" />
  
  <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">

    {/* Avatar */}
    <div className="flex-shrink-0 relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-white/40 to-transparent rounded-full blur-xl" />
      <img 
        src={getAvatar()} 
        alt="Profil" 
        className="relative h-36 w-36 md:h-44 md:w-44 rounded-full object-cover shadow-2xl border-4 border-white/50 ring-4 ring-white/30"
      />
      <div className="absolute -bottom-2 -right-2 bg-red-500 p-2 rounded-full shadow-lg">
        <FaHeart className="h-5 w-5 text-white" />
      </div>
    </div>

    {/* Sağ taraf */}
    <div className="flex-1 text-gray-900 dark:text-gray-200">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm mb-4">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-bold uppercase tracking-wider">Hafıza Merkezi</span>
      </div>

      {/* Başlık */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
        Merhaba,{" "}
        <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
          {displayName}
        </span>
      </h1>

      <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
        Dijital hafızanı yönetmenin akıllı yolu. İzlediklerini, oynadıklarını ve
        keşfettiklerini asla unutma!
      </p>

      <div className="mt-8 flex flex-wrap gap-4">

        {/* Yeni Ekle */}
        <Link 
          to="/create"
          className="group px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <FaPlus /> Yeni Ekle
        </Link>

        {/* Koleksiyon */}
        <Link 
          to="/all"
          className="group px-6 py-3 rounded-xl bg-transparent border-2 border-gray-600 dark:border-gray-300 text-gray-900 dark:text-gray-200 font-bold hover:bg-white/20 transition-all flex items-center gap-2"
        >
          <FaArchive /> Koleksiyonu Gör
        </Link>

        {/* Şansıma */}
        <button 
          onClick={handleRandomPick}
          className="group px-6 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white font-bold shadow-lg shadow-gray-700/30 hover:shadow-gray-700/50 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <FaRandom className="group-hover:rotate-180 transition-transform duration-500" /> 
          Şansıma Ne Çıkar?
        </button>

      </div>
    </div>

  </div>
</div>


      {/* === İSTATİSTİK BÖLÜMÜ (SENİN TASARIMIN) === */}
      <div className="mt-16 mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaChartPie /> İstatistikler
        </h2>
        {statsLoading ? (
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

      {/* === 4. YENİ BÖLÜM: GELİŞTİRİCİ GÜNLÜĞÜ & TOZLU RAFLAR === */}
      {/* Burası "Tarih Eklemesi" ile ilgili istediğin yeni bölüm */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL: Kütüphane Günlüğü (Timeline) */}
        <div className="lg:col-span-2">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                 <FaCalendarCheck className="text-sky-500" /> Kütüphane Günlüğü
              </h2>
           </div>
           
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              {allLoading ? (
                 <div className="p-8 flex justify-center"><FaSpinner className="animate-spin h-6 w-6 text-sky-500" /></div>
              ) : recentActivity.length > 0 ? (
                 recentActivity.map((item, idx) => (
                    <div 
                        key={item.id} 
                        onClick={() => setSelectedRecentItem(item)}
                        className={`flex items-center gap-4 p-4 cursor-pointer ${idx !== recentActivity.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group`}
                    >
                       {/* Küçük Resim */}
                       <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                          {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><FaFilm /></div>}
                       </div>
                       
                       {/* Bilgi */}
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">{item.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description || 'Açıklama yok'}</p>
                       </div>

                       {/* Tarih ve Tür */}
                       <div className="text-right">
                          <span className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-md mb-1 w-fit ml-auto">
                             {item.type.toUpperCase()}
                          </span>
                          <span className="block text-[10px] text-gray-400">
                             {formatDate(item.createdAt)}
                          </span>
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="p-8 text-center text-gray-500 text-sm">Henüz kayıt eklenmemiş.</div>
              )}
           </div>
        </div>

        {/* SAĞ: Tozlu Raflar (Backlog) */}
        <div className="lg:col-span-1">
           <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
              <FaHourglassHalf className="text-amber-500" /> Tozlu Raflar
           </h2>
           <div className="space-y-4">
              {dustyItems.length > 0 ? (
                 dustyItems.map(item => (
                    <div key={item.id} className="relative group bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl hover:shadow-md transition-all">
                       <div className="absolute top-3 right-3">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                             <FaHistory /> Unutuldu
                          </span>
                       </div>
                       <h4 className="font-bold text-gray-900 dark:text-white pr-16 truncate">{item.title}</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                          Eklenme: {formatDate(item.createdAt)}
                       </p>
                       <button 
                          onClick={() => setSelectedRecentItem(item)} 
                          className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:hover:text-sky-400 flex items-center gap-1"
                       >
                          Şimdi İncele <FaArrowRight size={10} />
                       </button>
                    </div>
                 ))
              ) : (
                 <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl text-center text-sm text-gray-500 border border-dashed border-gray-300 dark:border-gray-700">
                    Harika! Hiçbir içeriği unutmamışsın.
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* === NAVİGASYON KARTLARI (Değişmedi) === */}
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <Link to="/movie" className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8">
          <div><FaFilm className="h-12 w-12 text-sky-500" /><h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Filmler</h3><p className="mt-2 text-gray-600 dark:text-gray-400">İzlediğin veya izleyeceğin filmleri listele.</p></div><span className="mt-6 font-semibold text-sky-600 group-hover:underline">Listeye Git &rarr;</span>
        </Link>
        <Link to="/series" className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8">
          <div><FaTv className="h-12 w-12 text-sky-500" /><h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Diziler</h3><p className="mt-2 text-gray-600 dark:text-gray-400">Tüm dizi koleksiyonunu yönet.</p></div><span className="mt-6 font-semibold text-sky-600 group-hover:underline">Listeye Git &rarr;</span>
        </Link>
        <Link to="/game" className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow p-8">
          <div><FaGamepad className="h-12 w-12 text-sky-500" /><h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Oyunlar</h3><p className="mt-2 text-gray-600 dark:text-gray-400">Oynadığın veya bitirdiğin oyunlar.</p></div><span className="mt-6 font-semibold text-sky-600 group-hover:underline">Listeye Git &rarr;</span>
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

      {/* === FOOTER */}
      <div className="mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 p-8 md:p-12 text-center shadow-2xl">

  {/* Arka plan ışık efektleri */}
  <div className="absolute top-0 left-0 w-56 h-56 bg-white/30 rounded-full blur-3xl -translate-x-20 -translate-y-20" />
  <div className="absolute bottom-0 right-0 w-72 h-72 bg-red-500/20 rounded-full blur-2xl translate-x-20 translate-y-20" />

  <div className="relative">

    <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
      Hafızanı dijitalleştir, asla unutma!
    </h3>

    <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
      Filmler, diziler, oyunlar... Tüm dijital deneyimlerini tek bir yerde topla. 
      Geçmişini keşfet, geleceğini planla.
    </p>

    <div className="flex flex-wrap justify-center gap-4">

      {/* İçerik Ekle */}
      <Link 
        to="/create" 
        className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-all hover:-translate-y-1 flex items-center gap-2"
      >
        <FaPlus /> İçerik Ekle
      </Link>

      {/* Koleksiyon */}
      <Link 
        to="/all" 
        className="px-8 py-3 bg-transparent border-2 border-gray-800 dark:border-gray-300 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-900/10 dark:hover:bg-white/10 transition-all flex items-center gap-2"
      >
        <FaArchive /> Tüm Koleksiyonu Gör
      </Link>

    </div>
  </div>
</div>


      {/* Modallar */}
      <DetailModal isOpen={!!randomItem} onClose={() => setRandomItem(null)} item={randomItem} refetch={() => {}} />
      <DetailModal isOpen={!!selectedRecentItem} onClose={() => setSelectedRecentItem(null)} item={selectedRecentItem} refetch={allRefetch} />
      
    </section>
  );
}