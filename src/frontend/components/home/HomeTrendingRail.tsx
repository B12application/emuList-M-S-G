import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaFire, FaPlus, FaCheck, FaSpinner, FaStar, FaFilm, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaGlobeAmericas } from 'react-icons/fa';
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
}

export default function HomeTrendingRail({ onAdded, onSelect }: HomeTrendingRailProps) {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const [mediaType, setMediaType] = useState<'movie' | 'series'>('movie');
    const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('week');
    const [trendLanguage, setTrendLanguage] = useState<'en-US' | 'tr-TR'>('en-US'); // Default to English for global OMDb alignment
    const [items, setItems] = useState<TMDBMovieResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
    const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // User's existing items map for instant "Already Added" recognition
    useEffect(() => {
        const checkExistingLibraryItems = async () => {
            if (!user || items.length === 0) return;

            try {
                const q = query(
                    collection(db, 'mediaItems'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                const userItems = snapshot.docs.map(d => d.data() as MediaItem);

                const existingMap: Record<string, boolean> = {};
                for (const item of items) {
                    const title = (mediaType === 'movie' ? (item.title || item.original_title) : (item.name || item.original_name)) || '';
                    const origTitle = (mediaType === 'movie' ? item.original_title : item.original_name) || '';
                    const normalized = normalizeMediaTitle(title);
                    const normalizedOrig = normalizeMediaTitle(origTitle);

                    const found = userItems.some(ui => {
                        const uiTitleNorm = normalizeMediaTitle(ui.title);
                        return (uiTitleNorm && (uiTitleNorm === normalized || uiTitleNorm === normalizedOrig));
                    });

                    if (found) {
                        existingMap[String(item.id)] = true;
                    }
                }
                setAddedIds(prev => ({ ...prev, ...existingMap }));
            } catch (err) {
                console.warn('Existing library check failed:', err);
            }
        };

        checkExistingLibraryItems();
    }, [user, items, mediaType]);

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
                genre: details.genres ? details.genres.map(g => g.name).join(', ') : '',
                releaseDate: mediaType === 'movie' ? details.release_date : details.first_air_date,
                runtime: runtimeStr,
                imdbId: details.external_ids?.imdb_id || '',
                totalSeasons: mediaType === 'series' ? details.number_of_seasons : undefined,
                watched: false,
                isFavorite: false,
                createdAt: Timestamp.now()
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
                createdAt: Timestamp.now()
            };
            toast.dismiss(toastId);
            onSelect(tempItem);
        }
    };

    useEffect(() => {
        const fetchTrending = async () => {
            setLoading(true);
            try {
                const results = await getTMDBTrending(mediaType, timeWindow, trendLanguage);
                setItems(results.slice(0, 14)); // Show top 14 trending items
            } catch (error) {
                console.error('Error fetching TMDB trending:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, [mediaType, timeWindow, trendLanguage]);

    const handleQuickAdd = async (item: TMDBMovieResult) => {
        if (!user) {
            toast.error(t('create.loginRequired'));
            return;
        }

        const title = mediaType === 'movie' ? (item.title || item.original_title || '') : (item.name || item.original_name || '');
        const originalTitle = (mediaType === 'movie' ? item.original_title : item.original_name) || '';
        const itemIdStr = String(item.id);

        setAddingIds(prev => ({ ...prev, [itemIdStr]: true }));
        const toastId = toast.loading(trendLanguage === 'tr-TR' ? `${title} ekleniyor...` : `Adding ${title}...`);

        try {
            // 1. Fetch full details first to get exact IMDb ID
            const details = await getTMDBDetails(item.id, mediaType, trendLanguage);
            const imdbId = details.external_ids?.imdb_id || '';

            // 2. Perform intelligent cross-API deduplication check (IMDb ID, English Title, Turkish Title)
            const duplicateCheck = await checkDuplicateMediaItem(user.uid, {
                title,
                originalTitle,
                imdbId,
                type: mediaType
            });

            if (duplicateCheck.isDuplicate) {
                toast.error(duplicateCheck.message || 'Bu içerik zaten kütüphanenizde ekli!', { id: toastId, duration: 4000 });
                setAddedIds(prev => ({ ...prev, [itemIdStr]: true }));
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
                genre: details.genres ? details.genres.map(g => g.name).join(', ') : '',
                releaseDate: releaseDateStr,
                runtime: runtimeStr,
                imdbId: imdbId,
                watched: false,
                isFavorite: false,
                createdAt: Timestamp.now()
            };

            if (mediaType === 'series' && details.number_of_seasons) {
                newItem.totalSeasons = details.number_of_seasons;
                newItem.watchedSeasons = [];
            }

            // 3. Save to Firestore
            const docRef = await addDoc(collection(db, 'mediaItems'), newItem);

            // 4. Sync series episodes if series has IMDb ID
            if (mediaType === 'series' && newItem.imdbId && newItem.totalSeasons) {
                getAllSeriesEpisodeCounts(newItem.imdbId, newItem.totalSeasons)
                    .then(episodesPerSeason => {
                        if (Object.keys(episodesPerSeason).length > 0) {
                            saveEpisodesPerSeason(docRef.id, episodesPerSeason);
                        }
                    })
                    .catch(err => console.warn('Bölüm verisi çekilemedi:', err));
            }

            // 5. Create Library Log Activity
            await createActivity(
                user.uid, 
                user.displayName || 'User', 
                user.photoURL || '', 
                'media_added', 
                { ...newItem, id: docRef.id }
            );

            toast.success(trendLanguage === 'tr-TR' ? 'Koleksiyona eklendi!' : 'Added to collection!', { id: toastId });
            setAddedIds(prev => ({ ...prev, [itemIdStr]: true }));
            onAdded();
        } catch (error) {
            console.error('Error in quick add:', error);
            toast.error(trendLanguage === 'tr-TR' ? 'Ekleme başarısız oldu.' : 'Failed to add item.', { id: toastId });
        } finally {
            setAddingIds(prev => ({ ...prev, [itemIdStr]: false }));
        }
    };

    return (
        <section className="mt-10 bg-white/40 dark:bg-zinc-950/30 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/60 rounded-3xl p-5 sm:p-6 shadow-sm">
            {/* Header Area */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-500 dark:bg-amber-950/55 dark:text-amber-400 shadow-inner shrink-0">
                        <FaFire className="text-lg animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                {trendLanguage === 'tr-TR' ? 'Popüler Trendler' : 'Global Trends'}
                            </h2>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                {trendLanguage === 'tr-TR' ? '🇹🇷 TR' : '🌐 EN / Global'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {trendLanguage === 'tr-TR' ? 'Bu ay en çok izlenen popüler içerikler' : 'Trending popular content in English (OMDb & Global format)'}
                        </p>
                    </div>
                </div>

                {/* Filters & Navigation */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Language Switcher (Global English vs Turkish) */}
                    <div className="flex bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                        <button
                            onClick={() => setTrendLanguage('en-US')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                trendLanguage === 'en-US'
                                    ? 'bg-amber-400 text-stone-950 shadow-sm font-extrabold'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                            title="Global İngilizce İçerikler"
                        >
                            <FaGlobeAmericas className="text-[10px]" />
                            <span>EN</span>
                        </button>
                        <button
                            onClick={() => setTrendLanguage('tr-TR')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                trendLanguage === 'tr-TR'
                                    ? 'bg-amber-400 text-stone-950 shadow-sm font-extrabold'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                            title="Türkçe İçerikler"
                        >
                            <span>TR</span>
                        </button>
                    </div>

                    {/* Media Type Tabs */}
                    <div className="flex bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                        <button
                            onClick={() => setMediaType('movie')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                mediaType === 'movie'
                                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {trendLanguage === 'tr-TR' ? 'Filmler' : 'Movies'}
                        </button>
                        <button
                            onClick={() => setMediaType('series')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                mediaType === 'series'
                                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {trendLanguage === 'tr-TR' ? 'Diziler' : 'Series'}
                        </button>
                    </div>

                    {/* Time Window Tabs */}
                    <div className="flex bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                        <button
                            onClick={() => setTimeWindow('day')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                timeWindow === 'day'
                                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {trendLanguage === 'tr-TR' ? 'Bugün' : 'Today'}
                        </button>
                        <button
                            onClick={() => setTimeWindow('week')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                timeWindow === 'week'
                                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {trendLanguage === 'tr-TR' ? 'Bu Hafta' : 'Week'}
                        </button>
                    </div>

                    {/* Scroll Chevrons */}
                    <div className="flex items-center gap-1.5 ml-1">
                        <button
                            type="button"
                            onClick={() => scroll('left')}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            <FaChevronLeft className="text-[10px]" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll('right')}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            <FaChevronRight className="text-[10px]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <FaSpinner className="h-7 w-7 animate-spin text-amber-500" />
                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                        {trendLanguage === 'tr-TR' ? 'Trend içerikler getiriliyor...' : 'Fetching global trends...'}
                    </span>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 rounded-2xl">
                    <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                        {trendLanguage === 'tr-TR' ? 'Veri bulunamadı.' : 'No data found.'}
                    </p>
                </div>
            ) : (
                /* Horizontal Scroll Container */
                <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth snap-x snap-mandatory font-sans">
                    {items.map((item, idx) => {
                        const title = mediaType === 'movie' ? (item.title || item.original_title || '') : (item.name || item.original_name || '');
                        const poster = getTMDBPosterUrl(item.poster_path);
                        const rating = normalizeTMDBRating(item.vote_average);
                        const releaseDate = mediaType === 'movie' ? item.release_date : item.first_air_date;
                        const year = releaseDate ? releaseDate.split('-')[0] : '';
                        const itemIdStr = String(item.id);
                        const isAlreadyAdded = addedIds[itemIdStr];

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03, duration: 0.25 }}
                                onClick={() => handleCardClick(item)}
                                className="group relative flex flex-col w-[190px] sm:w-[210px] shrink-0 bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all snap-start cursor-pointer"
                            >
                                {/* Poster Image */}
                                <div className="relative aspect-[2/3] overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                    {poster ? (
                                        <img
                                            src={poster}
                                            alt={title}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                            <FaFilm className="h-10 w-10 animate-pulse" />
                                        </div>
                                    )}

                                    {/* Rating badge - top left */}
                                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm shadow-sm border border-white/10">
                                        <FaStar className="text-[9px]" />
                                        <span>{rating}</span>
                                    </div>

                                    {/* Quick Add Button - top right */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }}
                                        disabled={addingIds[itemIdStr]}
                                        className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg shadow-md transition-all active:scale-90 cursor-pointer ${
                                            isAlreadyAdded
                                                ? 'bg-emerald-500 text-white border border-emerald-400'
                                                : 'bg-white/90 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-200 hover:bg-amber-400 hover:text-stone-950 dark:hover:bg-amber-500 border border-slate-200 dark:border-zinc-700'
                                        }`}
                                        title={isAlreadyAdded ? 'Kütüphanende Zaten Ekli' : 'Listeme Ekle'}
                                    >
                                        {addingIds[itemIdStr] ? (
                                            <FaSpinner className="animate-spin text-xs" />
                                        ) : isAlreadyAdded ? (
                                            <FaCheck className="text-xs" />
                                        ) : (
                                            <FaPlus className="text-xs" />
                                        )}
                                    </button>
                                </div>

                                {/* Content Details */}
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" title={title}>
                                        {title}
                                    </h3>
                                    
                                    <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                                        {year && (
                                            <span className="flex items-center gap-1">
                                                <FaCalendarAlt className="text-[9px]" />
                                                <span>{year}</span>
                                            </span>
                                        )}
                                        <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[9px] font-bold">
                                            {mediaType === 'movie' ? 'Film' : 'Dizi'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

