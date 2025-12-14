// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 1. YENİ İKONLAR EKLENDİ: FaCalendarCheck, FaHistory, FaArrowRight, FaHourglassHalf, FaStar
import { FaFilm, FaTv, FaGamepad, FaBook, FaChartPie, FaSpinner, FaLightbulb, FaRandom, FaCalendarCheck, FaHistory, FaHeart, FaArrowRight, FaHourglassHalf, FaPlus, FaArchive, FaStar, FaChevronDown, FaChevronUp, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import useMediaStats from '../hooks/useMediaStats';
import useMedia from '../hooks/useMedia';
import RecommendationCard from '../components/RecommendationCard';
import useUserProfile from '../hooks/useUserProfile';
import type { MediaItem } from '../../backend/types/media';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import LuckyDipModal from '../components/LuckyDipModal';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

import DetailModal from '../components/DetailModal';
import AdminRecommendationsPanel from '../components/AdminRecommendationsPanel';
import { fetchRecommendations, groupRecommendationsByCategory } from '../../backend/services/recommendationService';
import type { Recommendation } from '../../backend/types/recommendation';

const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';
const MUSTAFA_FOTOGRAF_URL = 'https://media.licdn.com/dms/image/v2/D4D03AQFVgcz9aWEWPQ/profile-displayphoto-scale_400_400/B4DZrVBAm4HsAg-/0/1764510406029?e=1766620800&v=beta&t=gombvy-MJsL6YnjW6WtztxL89KG2x1_39u8jP8Nmtak';

export default function HomePage() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [randomItem, setRandomItem] = useState<MediaItem | null>(null);
    const [selectedRecentItem, setSelectedRecentItem] = useState<MediaItem | null>(null);
    const [favoritesPage, setFavoritesPage] = useState(0);
    const FAVORITES_PER_PAGE = 4;

    // Best Recommendations State
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsExpanded, setRecsExpanded] = useState(true); // Başta açık gelsin
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [collectionRecsExpanded, setCollectionRecsExpanded] = useState(true); // Koleksiyon önerileri açık başlasın

    // Pagination State for 2025 Best Recommendations
    const [recFilmPage, setRecFilmPage] = useState(1);
    const [recSeriesPage, setRecSeriesPage] = useState(1);
    const RECS_PER_PAGE = 4;

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
    const { items: bookRecs, loading: bookLoading, refetch: bookRefetch } = useMedia('book', 'not-watched', false);

    const movieRecommendation = movieRecs[0];
    const seriesRecommendation = seriesRecs[0];
    const gameRecommendation = gameRecs[0];
    const bookRecommendation = bookRecs[0];
    const recommendationsLoading = movieLoading || seriesLoading || gameLoading || bookLoading;

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

    // Load recommendations from Firebase
    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        setRecsLoading(true);
        const recs = await fetchRecommendations();
        setRecommendations(recs);
        setRecsLoading(false);
    };

    // Add recommendation to user's collection
    const handleAddToCollection = async (rec: Recommendation) => {
        if (!user) {
            toast.error(t('create.loginRequired'));
            return;
        }

        try {
            // Check if item already exists
            const q = query(
                collection(db, 'mediaItems'),
                where('userId', '==', user.uid),
                where('title', '==', rec.title)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                toast.error(t('home.alreadyInCollection'));
                return;
            }

            // Add to collection
            await addDoc(collection(db, 'mediaItems'), {
                userId: user.uid,
                title: rec.title,
                type: rec.type,
                image: rec.image || '',
                description: rec.description || '',
                rating: rec.rating || '0',
                watched: false,
                isFavorite: false,
                createdAt: Timestamp.now()
            });

            toast.success(t('home.addedToCollection'));
            allRefetch(); // Refresh user's items
        } catch (error) {
            console.error('Error adding to collection:', error);
            toast.error(t('home.adminRecError'));
        }
    };

    // Profil (Değişmedi)
    const displayName = user.displayName || user.email?.split('@')[0] || "Kullanıcı";
    const getAvatar = () => {
        // Special case for Mustafa
        if (user.uid === 'ZKU7SObBkeNzMicltUKJjo6ybHH2') return MUSTAFA_FOTOGRAF_URL;

        // Only use photoURL if it's a custom one (not our default avatars)
        if (user.photoURL &&
            user.photoURL !== MALE_AVATAR_URL &&
            user.photoURL !== FEMALE_AVATAR_URL) {
            return user.photoURL;
        }

        // Use gender-based avatar
        if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
        if (profile?.gender === 'male') return MALE_AVATAR_URL;

        // Default fallback
        return MALE_AVATAR_URL;
    };


    const handleRandomPick = () => {
        // 1. User's unwatched items
        const userPool = [...movieRecs, ...seriesRecs, ...gameRecs, ...bookRecs];

        // 2. Admin recommendations (mapped to MediaItem compatible format)
        const adminPool = recommendations.map(rec => ({
            id: rec.id,
            title: rec.title,
            image: rec.image,
            rating: rec.rating,
            description: rec.description,
            type: rec.type as any, // Cast for compatibility
            watched: false,
            createdAt: rec.createdAt,
            isFavorite: false,
            _source: 'recommendation' // Tag source
        } as MediaItem));

        // Combine pools
        const fullPool = [...userPool, ...adminPool];

        if (fullPool.length > 0) {
            const random = fullPool[Math.floor(Math.random() * fullPool.length)];
            setRandomItem(random);
        } else {
            toast.error(t('home.noItemsToPick') || 'Şeçilecek öğe bulunamadı!');
        }
    };



    return (
        <section className="py-10">

            {/* === AÇILIŞ EKRANI (SENİN TASARIMIN) === */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 p-8 md:p-12 mb-16 shadow-2xl">
                {/* Arka plan dekorları */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-24 translate-y-24" />

                <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">

                    {/* Avatar */}
                    <Link to="/profile" className="shrink-0 relative group cursor-pointer">
                        <div className="absolute -inset-4 bg-linear-to-r from-white/40 to-transparent rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
                        <img
                            src={getAvatar()}
                            alt="Profil"
                            className="relative h-36 w-36 md:h-44 md:w-44 rounded-full object-cover shadow-2xl border-4 border-white/50 ring-4 ring-white/30 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-red-500 p-2 rounded-full shadow-lg group-hover:bg-red-600 transition-colors">
                            <FaHeart className="h-5 w-5 text-white" />
                        </div>
                    </Link>

                    {/* Sağ taraf */}
                    <div className="flex-1 text-gray-900 dark:text-gray-200">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm mb-4">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-wider">{t('home.memoryCenter')}</span>
                        </div>

                        {/* Başlık */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                            {t('home.welcome')},{" "}
                            <span className="bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                {displayName}
                            </span>
                        </h1>

                        <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                            {t('home.heroDescription')}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">

                            {/* Yeni Ekle */}
                            <Link
                                to="/create"
                                className="group px-6 py-3 rounded-xl bg-red-500 text-white font-bold 
             shadow-lg shadow-red-500/30 transition-all transform 
             hover:-translate-y-1 hover:shadow-red-500/50 
             hover:bg-linear-to-r hover:from-red-500 hover:to-red-600 
             flex items-center gap-2"
                            >
                                <FaPlus className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                                {t('home.addNew')}
                            </Link>

                            {/* Koleksiyon */}
                            <Link
                                to="/all"
                                className="group px-6 py-3 rounded-xl bg-transparent border-2 border-gray-600 
             dark:border-gray-300 text-gray-900 dark:text-gray-200 font-bold 
             transition-all relative overflow-hidden flex items-center gap-2
             hover:-translate-y-1 hover:shadow-xl">
                                {/* Hafif parıltı animasyonu */}
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 
                  transition-opacity duration-300" />

                                <FaArchive className="transition-transform duration-300 group-hover:-translate-x-1" />
                                {t('home.viewCollection')}
                            </Link>

                            {/* Şansıma */}
                            <button
                                onClick={handleRandomPick}
                                className="group px-6 py-3 rounded-xl bg-linear-to-r from-gray-700 to-gray-900 
             text-white font-bold shadow-lg shadow-gray-700/30 
             hover:shadow-gray-700/50 transition-all transform 
             hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <FaRandom className="group-hover:rotate-180 transition-transform duration-500" />
                                {t('home.randomButton')}
                            </button>

                        </div>
                    </div>

                </div>

                {/* B12 Pill Design */}
                <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex rounded-full overflow-hidden shadow-lg font-black text-sm md:text-base z-20 select-none transform hover:scale-105 transition-transform duration-300">
                    <div className="bg-white/40 dark:bg-black/30 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-red-500 hover:text-white transition-all duration-300 px-4 py-2 cursor-pointer flex items-center justify-center">
                        B
                    </div>
                    <div className="bg-white/40 dark:bg-black/30 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-blue-600 hover:text-white transition-all duration-300 px-3 py-2 cursor-pointer flex items-center justify-center">
                        12
                    </div>
                </div>
            </div>


            {/* === İSTATİSTİK BÖLÜMÜ (SENİN TASARIMIN) === */}
            <div className="mt-16 mb-12">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-gray-900 dark:text-gray-200">
                    <FaChartPie className="text-red-500" /> {t('home.stats')}
                </h2>

                {statsLoading ? (
                    <div className="flex flex-col justify-center items-center p-10 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl border border-white/20 backdrop-blur-md">
                        <FaSpinner className="animate-spin h-10 w-10 text-red-500" />
                        <span className="mt-3 text-lg text-gray-700 dark:text-gray-300 font-medium">
                            {t('home.statsLoading')}
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">

                        {/* Kart */}
                        <div className="group bg-linear-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200/70 dark:border-gray-700/40 hover:-translate-y-1 hover:shadow-2xl transition-all text-center">
                            <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400">{t('home.totalItems')}</h4>
                            <p className="text-4xl font-black mt-2 bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                {stats.totalCount}
                            </p>
                        </div>

                        {/* Kart */}
                        <div className="group bg-linear-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200/70 dark:border-gray-700/40 hover:-translate-y-1 hover:shadow-2xl transition-all text-center">
                            <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400">{t('home.movieCount')}</h4>
                            <p className="text-4xl font-black mt-2 bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                {stats.movieCount}
                            </p>
                        </div>

                        {/* Kart */}
                        <div className="group bg-linear-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200/70 dark:border-gray-700/40 hover:-translate-y-1 hover:shadow-2xl transition-all text-center">
                            <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400">{t('home.seriesCount')}</h4>
                            <p className="text-4xl font-black mt-2 bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                {stats.seriesCount}
                            </p>
                        </div>

                        {/* Kart */}
                        <div className="group bg-linear-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200/70 dark:border-gray-700/40 hover:-translate-y-1 hover:shadow-2xl transition-all text-center">
                            <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400">{t('home.gameCount')}</h4>
                            <p className="text-4xl font-black mt-2 bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                {stats.gameCount}
                            </p>
                        </div>

                        {/* Kart - Kitap */}
                        <div className="group bg-linear-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200/70 dark:border-gray-700/40 hover:-translate-y-1 hover:shadow-2xl transition-all text-center">
                            <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400">{t('home.bookCount')}</h4>
                            <p className="text-4xl font-black mt-2 bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                {stats.bookCount}
                            </p>
                        </div>

                    </div>
                )}
            </div>


            {/* === FAVORİLER BÖLÜMÜ === */}
            <div className="mt-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-3 text-gray-900 dark:text-gray-200">
                        <FaHeart className="text-red-500" /> {t('home.favorites')}
                    </h2>
                </div>

                {allLoading ? (
                    <div className="flex justify-center items-center p-10 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl border border-white/20 backdrop-blur-md">
                        <FaSpinner className="animate-spin h-10 w-10 text-red-500" />
                        <span className="ml-3 text-lg text-gray-700 dark:text-gray-300 font-medium">
                            Favoriler yükleniyor...
                        </span>
                    </div>
                ) : (() => {
                    const favoriteItems = allItems.filter(item => item.isFavorite);
                    const startIdx = favoritesPage * FAVORITES_PER_PAGE;
                    const displayedFavorites = favoriteItems.slice(startIdx, startIdx + FAVORITES_PER_PAGE);
                    const totalPages = Math.ceil(favoriteItems.length / FAVORITES_PER_PAGE);

                    return favoriteItems.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {displayedFavorites.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedRecentItem(item)}
                                        className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer"
                                    >
                                        {/* Resim */}
                                        <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <FaFilm size={48} />
                                                </div>
                                            )}

                                            {/* Kalp İkonu (Overlay) */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateDoc(doc(db, "mediaItems", item.id), { isFavorite: false }).then(() => {
                                                        allRefetch();
                                                    });
                                                }}
                                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                                title="Favorilerden çıkar"
                                            >
                                                <FaHeart />
                                            </button>

                                            {/* Tür Badge */}
                                            <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-sky-500 text-white shadow-md">
                                                {item.type}
                                            </span>
                                        </div>

                                        {/* İçerik */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate mb-2 group-hover:text-red-500 transition-colors">
                                                {item.title}
                                            </h3>

                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                    <FaStar /> {item.rating}
                                                </span>

                                                <span className={`text-xs px-2 py-0.5 rounded-full ${item.watched
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                                                    }`}>
                                                    {item.watched
                                                        ? (item.type === 'book' ? t('media.read') : item.type === 'game' ? t('media.played') : t('media.watched'))
                                                        : (item.type === 'book' ? t('media.notRead') : item.type === 'game' ? t('media.notPlayed') : t('media.notWatched'))
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Sayfalama Kontrolleri */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setFavoritesPage(Math.max(0, favoritesPage - 1))}
                                        disabled={favoritesPage === 0}
                                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <FaArrowRight className="rotate-180" /> {t('home.prev')}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('home.page')} {favoritesPage + 1} / {totalPages}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-500">
                                            ({favoriteItems.length} favori)
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setFavoritesPage(Math.min(totalPages - 1, favoritesPage + 1))}
                                        disabled={favoritesPage >= totalPages - 1}
                                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {t('home.next')} <FaArrowRight />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-12 text-center border-2 border-dashed border-blue-200 dark:border-blue-800">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/30 rounded-full blur-2xl translate-y-12 -translate-x-12" />

                            <div className="relative">
                                <FaHeart className="mx-auto h-16 w-16 text-blue-300 dark:text-blue-700 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">
                                    {t('home.noFavoritesTitle')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    {t('home.noFavoritesDesc')}
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>


            {/* === 4. YENİ BÖLÜM: GELİŞTİRİCİ GÜNLÜĞÜ & TOZLU RAFLAR === */}
            {/* Burası "Tarih Eklemesi" ile ilgili istediğin yeni bölüm */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* SOL: Kütüphane Günlüğü (Timeline) */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                            <FaCalendarCheck className="text-sky-500" /> {t('home.recentActivity')}
                        </h2>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex-1">
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
                                    <div className="shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                                        {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><FaFilm /></div>}
                                    </div>

                                    {/* Bilgi */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">{item.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description || t('home.noDescription')}</p>
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
                            <div className="p-8 text-center text-gray-500 text-sm">{t('home.noRecent')}</div>
                        )}
                    </div>
                </div>

                {/* SAĞ: Tozlu Raflar (Backlog) */}
                <div className="lg:col-span-1 flex flex-col">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                        <FaHourglassHalf className="text-amber-500" /> {t('home.dustyShelf')}
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden p-4 flex-1">
                        <div className="space-y-4">
                            {dustyItems.length > 0 ? (
                                dustyItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedRecentItem(item)}
                                        className="relative group bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl hover:shadow-lg hover:-translate-y-1 hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="absolute top-3 right-3">
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                <FaHistory /> {t('home.forgotten')}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white pr-16 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{item.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                                            Eklenme: {formatDate(item.createdAt)}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 group-hover:gap-2 transition-all">
                                            {t('home.inspectNow')} <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
                                    {t('home.noDusty')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* === NAVİGASYON KARTLARI === */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {/* FİLM KARTI */}
                <Link to="/movie" className="group relative flex flex-col justify-between rounded-3xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                    {/* Arka Plan Gradyanı (Hover'da görünür) */}
                    <div className="absolute inset-0 bg-linear-to-r from-sky-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Varsayılan Arka Plan */}
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 group-hover:opacity-0 transition-opacity duration-300" />

                    {/* İçerik */}
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white text-sky-600 dark:text-sky-400 transition-colors">
                            <FaFilm size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-white">{t('nav.movies')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm group-hover:text-blue-100">{t('home.movieDesc')}</p>
                    </div>
                    <div className="relative z-10 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 group-hover:border-white/20">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 group-hover:text-white group-hover:translate-x-2 transition-all">
                            {t('home.goToList')} <FaArrowRight />
                        </span>
                    </div>
                </Link>

                {/* DİZİ KARTI */}
                <Link to="/series" className="group relative flex flex-col justify-between rounded-3xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-emerald-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 group-hover:opacity-0 transition-opacity duration-300" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white text-emerald-600 dark:text-emerald-400 transition-colors">
                            <FaTv size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-white">{t('nav.series')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm group-hover:text-emerald-100">{t('home.seriesDesc')}</p>
                    </div>
                    <div className="relative z-10 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 group-hover:border-white/20">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 group-hover:text-white group-hover:translate-x-2 transition-all">
                            {t('home.goToList')} <FaArrowRight />
                        </span>
                    </div>
                </Link>

                {/* OYUN KARTI */}
                <Link to="/game" className="group relative flex flex-col justify-between rounded-3xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 group-hover:opacity-0 transition-opacity duration-300" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white text-amber-600 dark:text-amber-400 transition-colors">
                            <FaGamepad size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-white">{t('nav.games')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm group-hover:text-amber-100">{t('home.gameDesc')}</p>
                    </div>
                    <div className="relative z-10 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 group-hover:border-white/20">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 group-hover:text-white group-hover:translate-x-2 transition-all">
                            {t('home.goToList')} <FaArrowRight />
                        </span>
                    </div>
                </Link>

                {/* KİTAP KARTI */}
                <Link to="/book" className="group relative flex flex-col justify-between rounded-3xl p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-400 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 group-hover:opacity-0 transition-opacity duration-300" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white text-purple-600 dark:text-purple-400 transition-colors">
                            <FaBook size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-white">{t('nav.books')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm group-hover:text-purple-100">{t('home.bookDesc')}</p>
                    </div>
                    <div className="relative z-10 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 group-hover:border-white/20">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 group-hover:text-white group-hover:translate-x-2 transition-all">
                            {t('home.goToList')} <FaArrowRight />
                        </span>
                    </div>
                </Link>
            </div>

            {/* === EN İYİ ÖNERİLER BÖLÜMÜ (DİNAMİK & YÖNETİLEBİLİR) === */}
            <div className="mt-20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-3">
                        <FaStar className="text-amber-500" /> {t('home.bestRecsTitle')}
                    </h2>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAdminPanel(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition"
                        >
                            <FaCog /> {t('home.adminManage')}
                        </button>

                        <button
                            onClick={() => setRecsExpanded(!recsExpanded)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
                            title={recsExpanded ? t('home.collapseRecs') : t('home.expandRecs')}
                        >
                            {recsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                    </div>
                </div>

                {recsExpanded && (
                    <div className="space-y-12">
                        {recsLoading ? (
                            <div className="flex justify-center py-12">
                                <FaSpinner className="animate-spin h-10 w-10 text-amber-500" />
                            </div>
                        ) : (() => {
                            const grouped = groupRecommendationsByCategory(recommendations);

                            return (
                                <>
                                    {/* FİLMLER VE DİZİLER - Yan Yana Modern Tasarım */}
                                    {grouped['most-watched-2025'].length > 0 && (() => {
                                        const allFilms = grouped['most-watched-2025'].filter(rec => rec.type === 'movie');
                                        const allSeries = grouped['most-watched-2025'].filter(rec => rec.type === 'series');

                                        // Pagination Logic
                                        const totalFilmPages = Math.ceil(allFilms.length / RECS_PER_PAGE);
                                        const totalSeriesPages = Math.ceil(allSeries.length / RECS_PER_PAGE);

                                        const films = allFilms.slice((recFilmPage - 1) * RECS_PER_PAGE, recFilmPage * RECS_PER_PAGE);
                                        const series = allSeries.slice((recSeriesPage - 1) * RECS_PER_PAGE, recSeriesPage * RECS_PER_PAGE);

                                        return (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                                {/* SOL: Filmler */}
                                                {allFilms.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                                                                <FaFilm className="text-white" size={18} />
                                                            </div>
                                                            <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                                                {t('nav.movies')}
                                                            </h4>
                                                            <span className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-semibold">
                                                                {allFilms.length}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-3 min-h-[500px]">
                                                            {films.map((rec) => (
                                                                <div
                                                                    key={rec.id}
                                                                    onClick={() => handleAddToCollection(rec)}
                                                                    className="group cursor-pointer"
                                                                >
                                                                    <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500">
                                                                        <div className="flex">
                                                                            <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden">
                                                                                {rec.image && (
                                                                                    <img
                                                                                        src={rec.image}
                                                                                        alt={rec.title}
                                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                                    />
                                                                                )}
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                                                    <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transform scale-90 group-hover:scale-100 transition-transform">
                                                                                        + {t('home.add')}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-1 p-3 flex flex-col justify-between">
                                                                                <div>
                                                                                    <h5 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                                                                                        {rec.title}
                                                                                    </h5>
                                                                                    {rec.description && (
                                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{rec.description}</p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-1 mt-2">
                                                                                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                                                                                        <FaStar size={11} className="text-amber-500" />
                                                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{rec.rating}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Film Pagination Controls */}
                                                        {totalFilmPages > 1 && (
                                                            <div className="flex justify-center items-center gap-4 mt-4">
                                                                <button
                                                                    onClick={() => setRecFilmPage(p => Math.max(1, p - 1))}
                                                                    disabled={recFilmPage === 1}
                                                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                                >
                                                                    <FaChevronUp className="-rotate-90" />
                                                                </button>
                                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                                    {recFilmPage} / {totalFilmPages}
                                                                </span>
                                                                <button
                                                                    onClick={() => setRecFilmPage(p => Math.min(totalFilmPages, p + 1))}
                                                                    disabled={recFilmPage === totalFilmPages}
                                                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                                >
                                                                    <FaChevronDown className="-rotate-90" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* SAĞ: Diziler */}
                                                {allSeries.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md">
                                                                <FaTv className="text-white" size={18} />
                                                            </div>
                                                            <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                                                {t('nav.series')}
                                                            </h4>
                                                            <span className="ml-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
                                                                {allSeries.length}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-3 min-h-[500px]">
                                                            {series.map((rec) => (
                                                                <div
                                                                    key={rec.id}
                                                                    onClick={() => handleAddToCollection(rec)}
                                                                    className="group cursor-pointer"
                                                                >
                                                                    <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:scale-[1.02] hover:border-emerald-400 dark:hover:border-emerald-500">
                                                                        <div className="flex">
                                                                            <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden">
                                                                                {rec.image && (
                                                                                    <img
                                                                                        src={rec.image}
                                                                                        alt={rec.title}
                                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                                    />
                                                                                )}
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                                                    <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transform scale-90 group-hover:scale-100 transition-transform">
                                                                                        + {t('home.add')}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-1 p-3 flex flex-col justify-between">
                                                                                <div>
                                                                                    <h5 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-1">
                                                                                        {rec.title}
                                                                                    </h5>
                                                                                    {rec.description && (
                                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{rec.description}</p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-1 mt-2">
                                                                                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                                                                                        <FaStar size={11} className="text-amber-500" />
                                                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{rec.rating}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Series Pagination Controls */}
                                                        {totalSeriesPages > 1 && (
                                                            <div className="flex justify-center items-center gap-4 mt-4">
                                                                <button
                                                                    onClick={() => setRecSeriesPage(p => Math.max(1, p - 1))}
                                                                    disabled={recSeriesPage === 1}
                                                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                                >
                                                                    <FaChevronUp className="-rotate-90" />
                                                                </button>
                                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                                    {recSeriesPage} / {totalSeriesPages}
                                                                </span>
                                                                <button
                                                                    onClick={() => setRecSeriesPage(p => Math.min(totalSeriesPages, p + 1))}
                                                                    disabled={recSeriesPage === totalSeriesPages}
                                                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                                >
                                                                    <FaChevronDown className="-rotate-90" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                            </div>
                                        );
                                    })()}

                                    {/* En İyi Filmler */}

                                    {grouped['best-movies'].length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-300">
                                                {t('home.bestRecsBestMovies')}
                                            </h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                                                {grouped['best-movies'].map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group flex-shrink-0 w-48 snap-start cursor-pointer"
                                                    >
                                                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                                            <div className="relative h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                                {rec.image && <img src={rec.image} alt={rec.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />}
                                                                <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-white font-bold text-sm px-4 py-2 bg-red-500 rounded-lg">
                                                                        {t('home.addToCollection')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-red-500 transition-colors">{rec.title}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ödüllü Filmler */}
                                    {grouped['award-winning'].length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-300 flex items-center gap-2">
                                                <FaStar className="text-amber-500" />
                                                {t('home.bestRecsAwardWinning')}
                                            </h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                                                {grouped['award-winning'].map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group flex-shrink-0 w-48 snap-start cursor-pointer"
                                                    >
                                                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                                            <div className="relative h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                                {rec.image && <img src={rec.image} alt={rec.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />}
                                                                {rec.award && (
                                                                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                                                                        {rec.award}
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-white font-bold text-sm px-4 py-2 bg-red-500 rounded-lg">
                                                                        {t('home.addToCollection')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">{rec.title}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Öne Çıkan Diziler */}
                                    {grouped['top-series'].length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-300">
                                                {t('home.bestRecsTopSeries')}
                                            </h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                                                {grouped['top-series'].map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group flex-shrink-0 w-48 snap-start cursor-pointer"
                                                    >
                                                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                                            <div className="relative h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                                {rec.image && <img src={rec.image} alt={rec.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />}
                                                                <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-white font-bold text-sm px-4 py-2 bg-red-500 rounded-lg">
                                                                        {t('home.addToCollection')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">{rec.title}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Önerilen Kitaplar */}
                                    {grouped['top-books'].length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-300">
                                                {t('home.bestRecsTop Books')}
                                            </h3>
                                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                                                {grouped['top-books'].map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group flex-shrink-0 w-48 snap-start cursor-pointer"
                                                    >
                                                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                                            <div className="relative h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                                {rec.image && <img src={rec.image} alt={rec.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />}
                                                                <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-white font-bold text-sm px-4 py-2 bg-red-500 rounded-lg">
                                                                        {t('home.addToCollection')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-purple-500 transition-colors">{rec.title}</h4>
                                                                {rec.author && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{rec.author}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No recommendations message */}
                                    {recommendations.length === 0 && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                                            <FaStar className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
                                            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Henüz öneri eklenmemiş!
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                                Admin panelinden öneri ekleyebilirsiniz.
                                            </p>
                                            <button
                                                onClick={() => setShowAdminPanel(true)}
                                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
                                            >
                                                {t('home.adminManage')}
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )
                }
            </div >

            {/* Admin Panel Modal */}
            < AdminRecommendationsPanel
                isOpen={showAdminPanel}
                onClose={() => setShowAdminPanel(false)
                }
                onUpdate={loadRecommendations}
            />


            {/* === KOLEKSİYONUNDAKİ ÖNERİLER BÖLÜMÜ (AÇILIR/KAPANIR) === */}
            < div className="mt-20" >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-3">
                        <FaLightbulb className="text-yellow-500" /> {t('home.collectionRecommendations')}
                    </h2>
                    <button
                        onClick={() => setCollectionRecsExpanded(!collectionRecsExpanded)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-400"
                        title={collectionRecsExpanded ? t('home.collapseRecs') : t('home.expandRecs')}
                    >
                        {collectionRecsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                </div>

                {
                    collectionRecsExpanded && (
                        <>
                            {recommendationsLoading ? (
                                <div className="flex justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                                    <FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
                                    <span className="ml-3 text-lg">{t('home.recommendationsLoading')}</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <RecommendationCard item={movieRecommendation} typeLabel="Film" refetch={movieRefetch} />
                                    <RecommendationCard item={seriesRecommendation} typeLabel="Dizi" refetch={seriesRefetch} />
                                    <RecommendationCard item={gameRecommendation} typeLabel="Oyun" refetch={gameRefetch} />
                                    <RecommendationCard item={bookRecommendation} typeLabel="Kitap" refetch={bookRefetch} />
                                </div>
                            )}
                        </>
                    )
                }
            </div >


            {/* === FOOTER */}
            < div className="mt-20 relative overflow-hidden rounded-3xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 p-8 md:p-12 text-center shadow-2xl" >

                {/* Arka plan ışık efektleri */}
                < div className="absolute top-0 left-0 w-56 h-56 bg-white/30 rounded-full blur-3xl -translate-x-20 -translate-y-20" />
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-red-500/20 rounded-full blur-2xl translate-x-20 translate-y-20" />

                <div className="relative">

                    <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                        {t('home.footerTitle')}
                    </h3>

                    <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                        {t('home.footerText')}
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">

                        {/* İçerik Ekle */}
                        <Link
                            to="/create"
                            className="group px-6 py-3 rounded-xl bg-red-500 text-white font-bold 
             shadow-lg shadow-red-500/30 transition-all transform 
             hover:-translate-y-1 hover:shadow-red-500/50 
             hover:bg-linear-to-r hover:from-red-500 hover:to-red-600 
             flex items-center gap-2"
                        >
                            <FaPlus className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                            {t('home.footerAdd')}
                        </Link>

                        {/* Koleksiyon */}
                        <Link
                            to="/all"
                            className="px-8 py-3 bg-transparent border-2 border-gray-800 dark:border-gray-300 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-900/10 dark:hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <FaArchive /> {t('home.footerCollection')}
                        </Link>

                    </div>

                    {/* B12 Logo - Bottom Right */}
                    <div className="absolute bottom-4 right-4">
                        <img src="/logob12.png" alt="B12 Logo" className="h-16 w-16 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div >


            {/* Modallar */}
            <LuckyDipModal
                isOpen={!!randomItem}
                onClose={() => setRandomItem(null)}
                item={randomItem}
                onSpinAgain={handleRandomPick}
            />
            < DetailModal isOpen={!!selectedRecentItem} onClose={() => setSelectedRecentItem(null)} item={selectedRecentItem} refetch={allRefetch} />

        </section >
    );
}