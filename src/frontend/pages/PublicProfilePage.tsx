// src/frontend/pages/PublicProfilePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFilm, FaTv, FaGamepad, FaBook, FaSpinner, FaUser, FaStar, FaHeart } from 'react-icons/fa';
import { getUserProfile, getUserMediaItems, getUserStats, type PublicUserProfile, type UserStats } from '../../backend/services/userProfileService';
import type { MediaItem, MediaType, FilterStatus } from '../../backend/types/media';
import { useLanguage } from '../context/LanguageContext';
import { ProfileSkeleton, MediaCardSkeleton } from '../components/ui/SkeletonLoader';
import DetailModal from '../components/DetailModal';
import { motion } from 'framer-motion';

export default function PublicProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [profile, setProfile] = useState<PublicUserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
    const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

    useEffect(() => {
        if (!userId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [userProfile, userStats, userMedia] = await Promise.all([
                    getUserProfile(userId),
                    getUserStats(userId),
                    getUserMediaItems(userId, selectedType === 'all' ? undefined : selectedType, selectedFilter === 'all' ? undefined : selectedFilter)
                ]);

                setProfile(userProfile);
                setStats(userStats);
                setMediaItems(userMedia);
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [userId, selectedType, selectedFilter]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: 'long' }).format(date);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'movie': return <FaFilm className="text-blue-500" />;
            case 'series': return <FaTv className="text-emerald-500" />;
            case 'game': return <FaGamepad className="text-amber-500" />;
            case 'book': return <FaBook className="text-purple-500" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin h-12 w-12 text-rose-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                <div className="text-center">
                    <FaUser className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Kullanıcı bulunamadı</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/feed')}
                    className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                    <FaArrowLeft /> {t('publicProfile.backToFeed')}
                </button>

                {/* User Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 mb-8"
                >
                    <div className="flex items-center gap-6">
                        <img
                            src={profile.photoURL || 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png'}
                            alt={profile.displayName}
                            className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-700"
                        />
                        <div className="flex-1">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                                {profile.displayName}
                            </h1>
                            {profile.createdAt && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('publicProfile.memberSince')} {formatDate(profile.createdAt)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCount}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('home.totalItems')}</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.movieCount}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.movies')}</p>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.seriesCount}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.series')}</p>
                            </div>
                            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.gameCount}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.games')}</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Media Library */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">

                    {/* Library Header - Sticky */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
                        <div className="p-6 pb-3">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                                    {t('publicProfile.userLibrary')}
                                </span>
                                {mediaItems.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                        ({mediaItems.length})
                                    </span>
                                )}
                            </h2>
                        </div>

                        {/* Type Filter Tabs - Modern Navbar */}
                        <div className="px-6 pb-4">
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl">
                                <button
                                    onClick={() => setSelectedType('all')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedType === 'all'
                                        ? 'bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {t('list.all')}
                                </button>
                                <button
                                    onClick={() => setSelectedType('movie')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedType === 'movie'
                                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <FaFilm className={selectedType === 'movie' ? 'text-blue-500' : ''} />
                                    <span className="hidden sm:inline">{t('nav.movies')}</span>
                                </button>
                                <button
                                    onClick={() => setSelectedType('series')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedType === 'series'
                                        ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <FaTv className={selectedType === 'series' ? 'text-emerald-500' : ''} />
                                    <span className="hidden sm:inline">{t('nav.series')}</span>
                                </button>
                                <button
                                    onClick={() => setSelectedType('game')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedType === 'game'
                                        ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <FaGamepad className={selectedType === 'game' ? 'text-amber-500' : ''} />
                                    <span className="hidden sm:inline">{t('nav.games')}</span>
                                </button>
                                <button
                                    onClick={() => setSelectedType('book')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedType === 'book'
                                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <FaBook className={selectedType === 'book' ? 'text-purple-500' : ''} />
                                    <span className="hidden sm:inline">{t('nav.books')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Status Filter - Compact Pills */}
                        <div className="px-6 pb-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
                                    Filtre:
                                </span>
                                <button
                                    onClick={() => setSelectedFilter('all')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedFilter === 'all'
                                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {t('list.all')}
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('watched')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedFilter === 'watched'
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {t('list.watched')}
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('not-watched')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedFilter === 'not-watched'
                                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {t('list.notWatched')}
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('favorites')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedFilter === 'favorites'
                                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <FaHeart className="text-[10px]" /> Favoriler
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Media Grid */}
                    <div className="p-6">

                        {mediaItems.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {mediaItems.map(item => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => setSelectedMedia(item)}
                                        className="group cursor-pointer bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                                    >
                                        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    {getTypeIcon(item.type)}
                                                </div>
                                            )}

                                            {/* Badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-black/70 text-white">
                                                    {item.type}
                                                </span>
                                            </div>

                                            {item.isFavorite && (
                                                <div className="absolute top-2 right-2">
                                                    <FaHeart className="text-red-500 text-sm drop-shadow-lg" />
                                                </div>
                                            )}

                                            {/* Watched Overlay - Visual Indicator */}
                                            {item.watched && (
                                                <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center">
                                                    <div className="bg-emerald-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg">
                                                        ✓ {item.type === 'book' ? t('media.readByUser') : item.type === 'game' ? t('media.playedByUser') : t('media.watchedByUser')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3">
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate mb-1">
                                                {item.title}
                                            </h4>

                                            {/* Rating & Watched Status */}
                                            <div className="flex items-center justify-between text-xs gap-2">
                                                {item.rating && (
                                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                        <FaStar /> {item.rating}
                                                    </span>
                                                )}

                                                {/* Watched Badge - More Prominent */}
                                                <span className={`px-2 py-1 rounded-full font-semibold ${item.watched
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {item.watched
                                                        ? '✓ ' + (item.type === 'book' ? t('media.readByUser') : item.type === 'game' ? t('media.playedByUser') : t('media.watchedByUser'))
                                                        : (item.type === 'book' ? t('media.notReadByUser') : item.type === 'game' ? t('media.notPlayedByUser') : t('media.notWatchedByUser'))
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('publicProfile.noItems')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Modal (Read-only) */}
                {selectedMedia && (
                    <DetailModal
                        item={selectedMedia}
                        onClose={() => setSelectedMedia(null)}
                        refetch={() => { }}
                        readOnly={true}
                    />
                )}
            </div>
        </div>
    );
}

