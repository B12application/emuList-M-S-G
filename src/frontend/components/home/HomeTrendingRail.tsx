import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaFire,
    FaPlus,
    FaCheck,
    FaSpinner,
    FaStar,
    FaFilm,
    FaCalendarAlt,
    FaChevronLeft,
    FaChevronRight,
    FaGlobeAmericas,
    FaTrophy,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../../backend/config/firebaseConfig';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getTMDBTrending, getTMDBDetails, getTMDBPosterUrl, normalizeTMDBRating } from '../../../backend/services/tmdbApi';
import type { TMDBMovieResult } from '../../../backend/services/tmdbApi';
import type { MediaItem } from '../../../backend/types/media';
import { getAllSeriesEpisodeCounts } from '../../../backend/services/omdbApi';
import { saveEpisodesPerSeason } from '../../../backend/services/episodeTrackingService';
import { createActivity } from '../../../backend/services/activityService';
import { checkDuplicateMediaItem, normalizeMediaTitle } from '../../../backend/services/mediaDeduplicationService';
import toast from 'react-hot-toast';

interface HomeTrendingRailProps {
    onAdded: () => void;
    onSelect: (item: MediaItem) => void;
    existingItems?: MediaItem[];
}

export default function HomeTrendingRail({ onAdded, onSelect, existingItems }: HomeTrendingRailProps) {
    const { user } = useAuth();
    const { t } = useLanguage();

    const [mediaType, setMediaType] = useState<'movie' | 'series'>('movie');
    const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('week');
    const [trendLanguage, setTrendLanguage] = useState<'en-US' | 'tr-TR'>('en-US');
    const [items, setItems] = useState<TMDBMovieResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
    const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
    const [currentPage, setCurrentPage] = useState(0);

    const ITEMS_PER_PAGE = 6;

    // Check existing library items
    useEffect(() => {
        const checkExistingLibraryItems = async () => {
            if (!user || items.length === 0) return;

            try {
                let userItems = existingItems;
                if (!userItems) {
                    const q = query(
                        collection(db, 'mediaItems'),
                        where('userId', '==', user.uid)
                    );
                    const snapshot = await getDocs(q);
                    userItems = snapshot.docs.map((d) => d.data() as MediaItem);
                }

                const existingMap: Record<string, boolean> = {};
                for (const item of items) {
                    const title = (mediaType === 'movie' ? (item.title || item.original_title) : (item.name || item.original_name)) || '';
                    const origTitle = (mediaType === 'movie' ? item.original_title : item.original_name) || '';
                    const normalized = normalizeMediaTitle(title);
                    const normalizedOrig = normalizeMediaTitle(origTitle);

                    const found = userItems.some((ui) => {
                        const uiTitleNorm = normalizeMediaTitle(ui.title);
                        return (uiTitleNorm && (uiTitleNorm === normalized || uiTitleNorm === normalizedOrig));
                    });

                    if (found) {
                        existingMap[String(item.id)] = true;
                    }
                }
                setAddedIds((prev) => ({ ...prev, ...existingMap }));
            } catch (err) {
                console.warn('Existing library check failed:', err);
            }
        };

        checkExistingLibraryItems();
    }, [user, items, mediaType, existingItems]);

    // Fetch trending
    useEffect(() => {
        const fetchTrending = async () => {
            setLoading(true);
            try {
                const results = await getTMDBTrending(mediaType, timeWindow, trendLanguage);
                setItems(results.slice(0, 12)); // Top 12 trending
                setCurrentPage(0);
            } catch (error) {
                console.error('Error fetching TMDB trending:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, [mediaType, timeWindow, trendLanguage]);

    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const visibleItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    const handleCardClick = async (item: TMDBMovieResult) => {
        const title = mediaType === 'movie' ? (item.title || item.original_title || '') : (item.name || item.original_name || '');
        const poster = getTMDBPosterUrl(item.poster_path);
        const rating = normalizeTMDBRating(item.vote_average);
        const releaseDate = mediaType === 'movie' ? item.release_date : item.first_air_date;

        const toastId = toast.loading(trendLanguage === 'tr-TR' ? 'Detaylar yükleniyor...' : 'Loading details...');
        try {
            const details = await getTMDBDetails(item.id, mediaType, trendLanguage);
            const runtimeStr = details.runtime
                ? `${details.runtime} min`
                : (details.episode_run_time && details.episode_run_time[0] ? `${details.episode_run_time[0]} min` : '');

            const tempItem: any = {
                id: `tmdb-temp-${item.id}`,
                title: title,
                type: mediaType,
                image: getTMDBPosterUrl(details.poster_path) || poster || '',
                description: details.overview || item.overview || '',
                rating: normalizeTMDBRating(details.vote_average || item.vote_average),
                genre: details.genres ? details.genres.map((g) => g.name).join(', ') : '',
                releaseDate: mediaType === 'movie' ? details.release_date : details.first_air_date,
                runtime: runtimeStr,
                imdbId: details.external_ids?.imdb_id || '',
                totalSeasons: mediaType === 'series' ? details.number_of_seasons : undefined,
                watched: false,
                isFavorite: false,
                createdAt: Timestamp.now(),
            };
            toast.dismiss(toastId);
            onSelect(tempItem);
        } catch (error) {
            console.error('Error fetching TMDB details:', error);
            const tempItem: any = {
                id: `tmdb-temp-${item.id}`,
                title: title,
                type: mediaType,
                image: poster || '',
                description: item.overview || '',
                rating: rating,
                releaseDate: releaseDate || '',
                watched: false,
                isFavorite: false,
                createdAt: Timestamp.now(),
            };
            toast.dismiss(toastId);
            onSelect(tempItem);
        }
    };

    const handleQuickAdd = async (item: TMDBMovieResult) => {
        if (!user) {
            toast.error(t('create.loginRequired'));
            return;
        }

        const title = mediaType === 'movie' ? (item.title || item.original_title || '') : (item.name || item.original_name || '');
        const originalTitle = (mediaType === 'movie' ? item.original_title : item.original_name) || '';
        const itemIdStr = String(item.id);

        setAddingIds((prev) => ({ ...prev, [itemIdStr]: true }));
        const toastId = toast.loading(trendLanguage === 'tr-TR' ? `${title} ekleniyor...` : `Adding ${title}...`);

        try {
            const details = await getTMDBDetails(item.id, mediaType, trendLanguage);
            const imdbId = details.external_ids?.imdb_id || '';

            const duplicateCheck = await checkDuplicateMediaItem(user.uid, {
                title,
                originalTitle,
                imdbId,
                type: mediaType,
            });

            if (duplicateCheck.isDuplicate) {
                toast.error(duplicateCheck.message || 'Bu içerik zaten kütüphanenizde ekli!', { id: toastId, duration: 4000 });
                setAddedIds((prev) => ({ ...prev, [itemIdStr]: true }));
                return;
            }

            const releaseDateStr = mediaType === 'movie' ? (details.release_date || '') : (details.first_air_date || '');
            const runtimeStr = details.runtime
                ? `${details.runtime} min`
                : (details.episode_run_time && details.episode_run_time[0] ? `${details.episode_run_time[0]} min` : '');

            const newItem: any = {
                userId: user.uid,
                title: title,
                type: mediaType,
                image: getTMDBPosterUrl(details.poster_path) || getTMDBPosterUrl(item.poster_path) || '',
                description: details.overview || item.overview || '',
                rating: normalizeTMDBRating(details.vote_average || item.vote_average),
                genre: details.genres ? details.genres.map((g) => g.name).join(', ') : '',
                releaseDate: releaseDateStr,
                runtime: runtimeStr,
                imdbId: imdbId,
                watched: false,
                isFavorite: false,
                createdAt: Timestamp.now(),
            };

            if (mediaType === 'series' && details.number_of_seasons) {
                newItem.totalSeasons = details.number_of_seasons;
                newItem.watchedSeasons = [];
            }

            const docRef = await addDoc(collection(db, 'mediaItems'), newItem);

            if (mediaType === 'series' && newItem.imdbId && newItem.totalSeasons) {
                getAllSeriesEpisodeCounts(newItem.imdbId, newItem.totalSeasons)
                    .then((episodesPerSeason) => {
                        if (Object.keys(episodesPerSeason).length > 0) {
                            saveEpisodesPerSeason(docRef.id, episodesPerSeason);
                        }
                    })
                    .catch((err) => console.warn('Bölüm verisi çekilemedi:', err));
            }

            await createActivity(
                user.uid,
                user.displayName || 'User',
                user.photoURL || '',
                'media_added',
                { ...newItem, id: docRef.id }
            );

            toast.success(trendLanguage === 'tr-TR' ? 'Koleksiyona eklendi!' : 'Added to collection!', { id: toastId });
            setAddedIds((prev) => ({ ...prev, [itemIdStr]: true }));
            onAdded();
        } catch (error) {
            console.error('Error in quick add:', error);
            toast.error(trendLanguage === 'tr-TR' ? 'Ekleme başarısız oldu.' : 'Failed to add item.', { id: toastId });
        } finally {
            setAddingIds((prev) => ({ ...prev, [itemIdStr]: false }));
        }
    };

    const getRankStyle = (index: number) => {
        if (index === 0) {
            return {
                bg: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 shadow-amber-500/30',
                icon: <FaTrophy className="text-[10px] text-stone-950" />,
            };
        }
        if (index === 1) {
            return {
                bg: 'bg-gradient-to-r from-slate-200 to-slate-400 text-stone-950 shadow-slate-400/30',
                icon: null,
            };
        }
        if (index === 2) {
            return {
                bg: 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 shadow-amber-900/30',
                icon: null,
            };
        }
        return {
            bg: 'bg-stone-900/85 text-stone-200 backdrop-blur-md border border-white/10 shadow-black/40',
            icon: null,
        };
    };

    return (
        <section className="mt-10 rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-xs backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 sm:p-6">
            {/* Header Area */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner dark:bg-amber-500/15 dark:text-amber-400">
                        <FaFire className="animate-pulse text-lg" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                                {t('home.trendingTitle') || 'Global Trends'}
                            </h2>
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                                {trendLanguage === 'tr-TR' ? '🇹🇷 TR' : '🌐 EN'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {t('home.trendingSubtitle') || 'En popüler ve trend içerikler'}
                        </p>
                    </div>
                </div>

                {/* Filters & Pagination Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Language Switcher */}
                    <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/80">
                        <button
                            type="button"
                            onClick={() => setTrendLanguage('en-US')}
                            className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                trendLanguage === 'en-US'
                                    ? 'bg-amber-400 font-black text-stone-950 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                            title="Global English"
                        >
                            <FaGlobeAmericas className="text-[10px]" />
                            <span>EN</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTrendLanguage('tr-TR')}
                            className={`flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                trendLanguage === 'tr-TR'
                                    ? 'bg-amber-400 font-black text-stone-950 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                            title="Türkçe İçerikler"
                        >
                            <span>TR</span>
                        </button>
                    </div>

                    {/* Media Type Tabs */}
                    <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/80">
                        <button
                            type="button"
                            onClick={() => setMediaType('movie')}
                            className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                mediaType === 'movie'
                                    ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-700 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('media.movie') || 'Film'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMediaType('series')}
                            className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                mediaType === 'series'
                                    ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-700 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('media.series') || 'Dizi'}
                        </button>
                    </div>

                    {/* Time Window Tabs */}
                    <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/80">
                        <button
                            type="button"
                            onClick={() => setTimeWindow('day')}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                timeWindow === 'day'
                                    ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-700 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('home.today') || 'Bugün'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeWindow('week')}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                timeWindow === 'week'
                                    ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-700 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('home.thisWeek') || 'Bu Hafta'}
                        </button>
                    </div>

                    {/* Page Navigation */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5 ml-1">
                            <button
                                type="button"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                title={t('home.prev') || 'Önceki'}
                            >
                                <FaChevronLeft className="text-[10px]" />
                            </button>
                            <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-zinc-400 px-1">
                                {currentPage + 1} / {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                title={t('home.next') || 'Sonraki'}
                            >
                                <FaChevronRight className="text-[10px]" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area - Responsive Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <FaSpinner className="h-7 w-7 animate-spin text-amber-500" />
                    <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                        {trendLanguage === 'tr-TR' ? 'Trend içerikler hazırlanıyor...' : 'Fetching global trends...'}
                    </span>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-zinc-800">
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                        {trendLanguage === 'tr-TR' ? 'Veri bulunamadı.' : 'No trending data found.'}
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentPage}-${mediaType}-${timeWindow}-${trendLanguage}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6"
                    >
                        {visibleItems.map((item, idx) => {
                            const globalIndex = currentPage * ITEMS_PER_PAGE + idx;
                            const title = mediaType === 'movie' ? (item.title || item.original_title || '') : (item.name || item.original_name || '');
                            const poster = getTMDBPosterUrl(item.poster_path);
                            const rating = normalizeTMDBRating(item.vote_average);
                            const releaseDate = mediaType === 'movie' ? item.release_date : item.first_air_date;
                            const year = releaseDate ? releaseDate.split('-')[0] : '';
                            const itemIdStr = String(item.id);
                            const isAlreadyAdded = addedIds[itemIdStr];
                            const isAdding = addingIds[itemIdStr];
                            const rankStyle = getRankStyle(globalIndex);

                            return (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => handleCardClick(item)}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-amber-400/50 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900 cursor-pointer"
                                >
                                    {/* Poster Image */}
                                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                        {poster ? (
                                            <img
                                                src={poster}
                                                alt={title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                                <FaFilm className="h-8 w-8 animate-pulse" />
                                            </div>
                                        )}

                                        {/* Rank Badge - Top Left */}
                                        <div
                                            className={`absolute left-2 top-2 flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black shadow-md ${rankStyle.bg}`}
                                        >
                                            {rankStyle.icon}
                                            <span>#{globalIndex + 1}</span>
                                        </div>

                                        {/* Rating badge - Top Right */}
                                        {rating && (
                                            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-xs shadow-xs border border-white/10">
                                                <FaStar className="text-[8px]" />
                                                <span>{rating}</span>
                                            </div>
                                        )}

                                        {/* Quick Add overlay button */}
                                        <div className="absolute inset-x-2 bottom-2 z-10">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isAlreadyAdded) handleQuickAdd(item);
                                                }}
                                                disabled={isAdding || isAlreadyAdded}
                                                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
                                                    isAlreadyAdded
                                                        ? 'bg-emerald-500/90 text-white cursor-default border border-emerald-400/40'
                                                        : 'bg-stone-950/85 text-white hover:bg-amber-400 hover:text-stone-950 dark:bg-white/90 dark:text-stone-950 dark:hover:bg-amber-400 border border-white/20'
                                                }`}
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <FaSpinner className="animate-spin text-[10px]" />
                                                        <span className="truncate">{t('home.addingToLibrary')}</span>
                                                    </>
                                                ) : isAlreadyAdded ? (
                                                    <>
                                                        <FaCheck className="text-[10px]" />
                                                        <span className="truncate">{t('home.inLibrary')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPlus className="text-[9px]" />
                                                        <span className="truncate">{t('home.addToLibrary')}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Details */}
                                    <div className="flex flex-1 flex-col p-3">
                                        <h3
                                            className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400 transition-colors"
                                            title={title}
                                        >
                                            {title}
                                        </h3>

                                        <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                                            {year ? (
                                                <span className="flex items-center gap-1">
                                                    <FaCalendarAlt className="text-[8px]" />
                                                    <span>{year}</span>
                                                </span>
                                            ) : <span />}
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                {mediaType === 'movie' ? (t('media.movie') || 'Film') : (t('media.series') || 'Dizi')}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            )}
        </section>
    );
}
