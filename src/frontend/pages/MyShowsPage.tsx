// src/frontend/pages/MyShowsPage.tsx
// Mobil dostu "Dizilerim" sayfası - basit ve hızlı bölüm takibi

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { MediaItem } from '../../backend/types/media';
import { getSeriesProgress, toggleEpisodeWatched, updateCurrentProgress } from '../../backend/services/episodeTrackingService';
import EpisodeTracker from '../components/EpisodeTracker';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import { FaTv, FaPlay, FaCheck, FaPlus, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type ShowFilter = 'all' | 'continue' | 'completed' | 'notStarted';

export default function MyShowsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [shows, setShows] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<ShowFilter>('all');
    const [expandedShow, setExpandedShow] = useState<string | null>(null);

    const fetchShows = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'mediaItems'),
                where('userId', '==', user.uid),
                where('type', '==', 'series'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as MediaItem[];
            setShows(items);
        } catch (error) {
            console.error('Diziler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShows();
    }, [user]);

    // Sonraki bölümü hesapla
    const getNextEpisode = (show: MediaItem): { season: number; episode: number } | null => {
        const totalSeasons = show.totalSeasons || 0;
        const watchedEps = show.watchedEpisodes || {};
        const epsPerSeason = show.episodesPerSeason || {};

        for (let s = 1; s <= totalSeasons; s++) {
            const watched = watchedEps[s] || [];
            const total = epsPerSeason[s] || 0;
            if (total === 0) continue;
            for (let e = 1; e <= total; e++) {
                if (!watched.includes(e)) {
                    return { season: s, episode: e };
                }
            }
        }
        return null;
    };

    const categorizedShows = useMemo(() => {
        const continueWatching: MediaItem[] = [];
        const completed: MediaItem[] = [];
        const notStarted: MediaItem[] = [];

        shows.forEach(show => {
            const progress = getSeriesProgress(show);
            const hasWatchedEpisodes = show.watchedEpisodes && Object.keys(show.watchedEpisodes).length > 0;
            const hasWatchedSeasons = show.watchedSeasons && show.watchedSeasons.length > 0;

            if (progress.totalEpisodes > 0) {
                if (progress.percentage === 100) completed.push(show);
                else if (progress.totalWatched > 0) continueWatching.push(show);
                else notStarted.push(show);
            } else if (show.watched || (hasWatchedSeasons && show.watchedSeasons!.length === show.totalSeasons)) {
                completed.push(show);
            } else if (hasWatchedSeasons || hasWatchedEpisodes) {
                continueWatching.push(show);
            } else {
                notStarted.push(show);
            }
        });

        return { continueWatching, completed, notStarted };
    }, [shows]);

    const filteredShows = useMemo(() => {
        switch (activeFilter) {
            case 'continue': return categorizedShows.continueWatching;
            case 'completed': return categorizedShows.completed;
            case 'notStarted': return categorizedShows.notStarted;
            default: return shows;
        }
    }, [activeFilter, shows, categorizedShows]);

    // Hızlı "sonraki bölümü işaretle"
    const handleQuickMark = async (show: MediaItem) => {
        const next = getNextEpisode(show);
        if (!next) return;
        try {
            await toggleEpisodeWatched(show.id, next.season, next.episode, show.watchedEpisodes || {});
            await updateCurrentProgress(show.id, next.season, next.episode);
            toast.success(`S${next.season} B${next.episode} ✓`);
            fetchShows();
        } catch (err) {
            console.error(err);
        }
    };

    const filters: { key: ShowFilter; label: string; count: number }[] = [
        { key: 'all', label: t('myShows.allShows'), count: shows.length },
        { key: 'continue', label: t('myShows.continueWatching'), count: categorizedShows.continueWatching.length },
        { key: 'completed', label: t('myShows.completed'), count: categorizedShows.completed.length },
        { key: 'notStarted', label: t('myShows.notStarted'), count: categorizedShows.notStarted.length },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <FaTv className="text-white" size={15} />
                    </div>
                    {t('myShows.title')}
                </h1>
                <Link
                    to="/create?type=series"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors shadow-md"
                >
                    <FaPlus size={10} />
                    {t('myShows.addShow')}
                </Link>
            </div>

            {/* Filtreler - Yatay scroll, mobil dostu */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={`
              flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all
              ${activeFilter === f.key
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }
            `}
                    >
                        {f.label} <span className="ml-1 opacity-70">{f.count}</span>
                    </button>
                ))}
            </div>

            {/* Dizi Listesi */}
            {filteredShows.length === 0 ? (
                <div className="text-center py-16">
                    <FaTv className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeFilter === 'all' ? t('myShows.noShows') :
                            activeFilter === 'continue' ? t('myShows.noContinue') :
                                activeFilter === 'completed' ? t('myShows.noCompleted') :
                                    t('myShows.noNotStarted')}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    <AnimatePresence mode="popLayout">
                        {filteredShows.map(show => {
                            const progress = getSeriesProgress(show);
                            const nextEp = getNextEpisode(show);
                            const isExpanded = expandedShow === show.id;
                            const hasEpisodeData = show.episodesPerSeason && Object.keys(show.episodesPerSeason).length > 0;

                            return (
                                <motion.div
                                    key={show.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                                >
                                    <div className="flex items-center gap-3 p-3">
                                        {/* Poster */}
                                        <div className="w-12 h-18 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                                            <ImageWithFallback
                                                src={show.image}
                                                alt={show.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Bilgi */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{show.title}</h3>

                                            {/* İlerleme barı */}
                                            {hasEpisodeData && (
                                                <div className="mt-1.5">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[10px] text-gray-400">
                                                            {progress.totalWatched}/{progress.totalEpisodes}
                                                        </span>
                                                        <span className={`text-[10px] font-bold ${progress.percentage === 100 ? 'text-emerald-500' : 'text-purple-500'}`}>
                                                            %{progress.percentage}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${progress.percentage}%`,
                                                                background: progress.percentage === 100
                                                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                                                    : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sağ taraf: Devam Et butonu veya durum */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {nextEp ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleQuickMark(show);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    <FaPlay size={8} />
                                                    <span>S{nextEp.season} B{nextEp.episode}</span>
                                                </button>
                                            ) : progress.percentage === 100 ? (
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <FaCheck className="text-white" size={12} />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <FaTv className="text-gray-400" size={10} />
                                                </div>
                                            )}

                                            {/* Expand butonu */}
                                            {hasEpisodeData && show.imdbId && (
                                                <button
                                                    onClick={() => setExpandedShow(isExpanded ? null : show.id)}
                                                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                >
                                                    {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Genişletilmiş EpisodeTracker */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                                                    <EpisodeTracker item={show} onUpdate={fetchShows} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
