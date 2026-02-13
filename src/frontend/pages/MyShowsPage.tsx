// src/frontend/pages/MyShowsPage.tsx
// ─────────────────────────────────────────────────────────
// İzleme Listem — Full-featured watchlist page
// Features: Stats strip, sort, filter, bulk select, tooltips,
// relative time, badges, completion dates
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { MediaItem } from '../../backend/types/media';
import { getSeriesProgress, toggleEpisodeWatched, updateCurrentProgress } from '../../backend/services/episodeTrackingService';
import EpisodeTracker from '../components/EpisodeTracker';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import {
    FaTv, FaPlay, FaCheck, FaPlus, FaSearch,
    FaChevronDown, FaChevronUp, FaFilm,
    FaArrowUp, FaArrowDown, FaSortAmountDown,
    FaFilter, FaCheckSquare, FaTimes, FaClock, FaStar
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type ShowCategory = 'completed' | 'inProgress' | 'notStarted';
type SortOption = 'queue' | 'recent' | 'title' | 'progress' | 'date';

export default function MyShowsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [shows, setShows] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedShow, setExpandedShow] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('queue');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedShows, setSelectedShows] = useState<Set<string>>(new Set());
    const [hoveredShow, setHoveredShow] = useState<string | null>(null);

    /* ── Fetch ── */
    const fetchShows = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'mediaItems'),
                where('userId', '==', user.uid),
                where('type', '==', 'series'),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            setShows(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchShows(); }, [user]);

    /* ── Relative time ── */
    const getRelativeTime = (show: MediaItem): string | null => {
        const ts = show.lastWatchedAt;
        if (!ts) return null;
        const date = (ts as any).toDate ? (ts as any).toDate() : new Date(ts as any);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('myShows.justNow');
        if (mins < 60) return `${mins} ${t('myShows.minutesAgo')} ${t('myShows.agoSuffix')}`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} ${t('myShows.hoursAgo')} ${t('myShows.agoSuffix')}`;
        const days = Math.floor(hours / 24);
        return `${days} ${t('myShows.daysAgo')} ${t('myShows.agoSuffix')}`;
    };

    /* ── Format date ── */
    const formatDate = (ts: any): string => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    };

    /* ── Helpers ── */
    const getNextEpisode = (show: MediaItem): { season: number; episode: number } | null => {
        const ts = show.totalSeasons || 0;
        const we = show.watchedEpisodes || {};
        const eps = show.episodesPerSeason || {};
        for (let s = 1; s <= ts; s++) {
            const w = we[s] || [];
            const tot = eps[s] || 0;
            if (!tot) continue;
            for (let e = 1; e <= tot; e++) { if (!w.includes(e)) return { season: s, episode: e }; }
        }
        return null;
    };

    const getTotalEpisodesCount = (show: MediaItem): number => {
        const eps = show.episodesPerSeason || {};
        return Object.values(eps).reduce((sum, n) => sum + n, 0);
    };

    const getTotalWatchedCount = (show: MediaItem): number => {
        const we = show.watchedEpisodes || {};
        return Object.values(we).reduce((sum, arr) => sum + arr.length, 0);
    };

    const getCategory = (show: MediaItem): ShowCategory => {
        const p = getSeriesProgress(show);
        const hasWE = show.watchedEpisodes && Object.keys(show.watchedEpisodes).length > 0;
        const hasWS = show.watchedSeasons && show.watchedSeasons.length > 0;
        if (p.totalEpisodes > 0) {
            if (p.percentage === 100) return 'completed';
            if (p.totalWatched > 0) return 'inProgress';
            return 'notStarted';
        }
        if (show.watched || (hasWS && show.watchedSeasons!.length === show.totalSeasons)) return 'completed';
        if (hasWS || hasWE) return 'inProgress';
        return 'notStarted';
    };

    /* ── Stats ── */
    const stats = useMemo(() => {
        let totalWatched = 0, totalEps = 0;
        const completedCount = shows.filter(s => getCategory(s) === 'completed').length;
        const inProgressCount = shows.filter(s => getCategory(s) === 'inProgress').length;
        shows.forEach(s => {
            const cat = getCategory(s);
            const epsCount = getTotalEpisodesCount(s);
            totalEps += epsCount;
            if (cat === 'completed' && getTotalWatchedCount(s) === 0 && epsCount > 0) {
                // Completed via watched flag but no episode-level data — count all eps
                totalWatched += epsCount;
            } else {
                totalWatched += getTotalWatchedCount(s);
            }
        });
        const hours = Math.round(totalWatched * 0.75); // ~45 min per ep
        const pct = totalEps > 0 ? Math.round((totalWatched / totalEps) * 100) : 0;
        return { totalShows: shows.length, completedCount, inProgressCount, totalWatched, totalEps, hours, pct };
    }, [shows]);

    /* ── Genres for filter ── */
    const genres = useMemo(() => {
        const genreSet = new Set<string>();
        shows.forEach(s => {
            if (s.genre) {
                s.genre.split(',').map(g => g.trim()).filter(Boolean).forEach(g => genreSet.add(g));
            }
        });
        return Array.from(genreSet).sort();
    }, [shows]);

    /* ── Split into categories ── */
    const completedShows = useMemo(() => {
        let list = shows.filter(s => getCategory(s) === 'completed');
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.title.toLowerCase().includes(q));
        }
        if (selectedGenre) {
            list = list.filter(s => s.genre?.toLowerCase().includes(selectedGenre.toLowerCase()));
        }
        return list.sort((a, b) => (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999));
    }, [shows, searchQuery, selectedGenre]);

    const activeShows = useMemo(() => {
        let list = shows.filter(s => getCategory(s) !== 'completed');

        // Filter by genre
        if (selectedGenre) {
            list = list.filter(s => s.genre?.toLowerCase().includes(selectedGenre.toLowerCase()));
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.title.toLowerCase().includes(q));
        }

        // Sort
        switch (sortBy) {
            case 'recent':
                list.sort((a, b) => {
                    const aTime = a.lastWatchedAt ? (a.lastWatchedAt as any).seconds || 0 : 0;
                    const bTime = b.lastWatchedAt ? (b.lastWatchedAt as any).seconds || 0 : 0;
                    return bTime - aTime;
                });
                break;
            case 'title':
                list.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
                break;
            case 'progress':
                list.sort((a, b) => {
                    const pa = getSeriesProgress(a).percentage;
                    const pb = getSeriesProgress(b).percentage;
                    return pb - pa;
                });
                break;
            case 'date':
                list.sort((a, b) => {
                    const aTime = a.createdAt ? (a.createdAt as any).seconds || 0 : 0;
                    const bTime = b.createdAt ? (b.createdAt as any).seconds || 0 : 0;
                    return bTime - aTime;
                });
                break;
            default: // queue
                list.sort((a, b) => {
                    const pri: Record<ShowCategory, number> = { completed: 0, inProgress: 1, notStarted: 2 };
                    const diff = pri[getCategory(a)] - pri[getCategory(b)];
                    if (diff !== 0) return diff;
                    return (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999);
                });
        }

        return list;
    }, [shows, searchQuery, sortBy, selectedGenre]);

    /* ── Actions ── */
    const handleQuickMark = async (show: MediaItem) => {
        const next = getNextEpisode(show);
        if (!next) return;
        try {
            await toggleEpisodeWatched(show.id, next.season, next.episode, show.watchedEpisodes || {});
            await updateCurrentProgress(show.id, next.season, next.episode);
            toast.success(`S${next.season} E${next.episode} ✓`);
            fetchShows();
        } catch (err) { console.error(err); }
    };

    const handleMoveShow = async (showId: string, direction: 'up' | 'down') => {
        // Work within activeShows list only (already sorted by current sortBy)
        const list = [...activeShows];
        const idx = list.findIndex(s => s.id === showId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= list.length) return;

        // Swap in array
        [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];

        // Assign fresh sequential queueOrder to ALL items so values stay stable
        const updates: Record<string, number> = {};
        list.forEach((s, i) => { updates[s.id] = i; });

        // Apply optimistic local state first for instant feedback
        setShows(prev => prev.map(s => updates[s.id] !== undefined ? { ...s, queueOrder: updates[s.id] } : s));

        // Persist to Firestore
        try {
            await Promise.all(
                list.map((s, i) => updateDoc(doc(db, 'mediaItems', s.id), { queueOrder: i }))
            );
        } catch (err) { console.error(err); }
    };

    /* ── Bulk actions ── */
    const toggleSelect = (id: string) => {
        const next = new Set(selectedShows);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedShows(next);
    };

    const handleBulkMarkCompleted = async () => {
        if (selectedShows.size === 0) return;
        const confirmed = window.confirm(`${selectedShows.size} diziyi tamamlandı olarak işaretle?`);
        if (!confirmed) return;
        try {
            for (const id of selectedShows) {
                await updateDoc(doc(db, 'mediaItems', id), { watched: true });
            }
            toast.success(`✓ ${selectedShows.size} dizi tamamlandı olarak işaretlendi`);
            setSelectedShows(new Set());
            setSelectMode(false);
            fetchShows();
        } catch (err) {
            console.error(err);
            toast.error('Hata oluştu');
        }
    };

    /* ── Sort options ── */
    const sortOptions: { key: SortOption; label: string }[] = [
        { key: 'queue', label: t('myShows.sortQueue') },
        { key: 'recent', label: t('myShows.sortRecent') },
        { key: 'title', label: t('myShows.sortTitle') },
        { key: 'progress', label: t('myShows.sortProgress') },
        { key: 'date', label: t('myShows.sortDate') },
    ];

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/40 flex items-center justify-center animate-pulse">
                        <FaTv className="text-zinc-400 dark:text-zinc-500" size={20} />
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pt-2 pb-6">
            {/* ══════════════ STICKY HEADER ══════════════ */}
            <div className="sticky top-16 z-30 pb-3 pt-4 -mx-4 px-4">
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl px-4 py-3 border border-zinc-200/40 dark:border-zinc-700/30 shadow-lg shadow-black/5 dark:shadow-black/20">
                    <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <FaTv className="text-zinc-500 dark:text-zinc-400" size={13} />
                            </div>
                            <div>
                                <h1 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                                    {t('myShows.title')}
                                </h1>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                    {shows.length} dizi
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {/* Select mode toggle */}
                            <button
                                onClick={() => { setSelectMode(!selectMode); setSelectedShows(new Set()); }}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${selectMode
                                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <FaCheckSquare size={10} />
                                {selectMode ? t('myShows.cancelSelect') : t('myShows.selectMode')}
                            </button>
                            {/* Sort dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortMenu(!showSortMenu)}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                >
                                    <FaSortAmountDown size={10} />
                                    {sortOptions.find(o => o.key === sortBy)?.label}
                                </button>
                                <AnimatePresence>
                                    {showSortMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200/50 dark:border-zinc-700/50 py-1 min-w-[140px] z-50"
                                        >
                                            {sortOptions.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                                                    className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors ${sortBy === opt.key
                                                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20'
                                                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {/* Add button */}
                            <Link
                                to="/create?type=series"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all"
                            >
                                <FaPlus size={9} />
                                {t('myShows.addShow')}
                            </Link>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={10} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('list.searchPlaceholder')}
                            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/60 text-[12px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200/30 dark:border-zinc-700/30 focus:outline-none focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* ══════════════ GENRE FILTER CHIPS ══════════════ */}
            {genres.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 mt-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    <button
                        onClick={() => setSelectedGenre(null)}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${!selectedGenre
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                    >
                        <FaFilter size={7} className="inline mr-1" />
                        {t('myShows.filterAll')}
                    </button>
                    {genres.map(genre => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${selectedGenre === genre
                                ? 'bg-teal-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            )}

            {/* ══════════════ MINI STATS STRIP ══════════════ */}
            <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/15 dark:to-emerald-900/10 rounded-xl p-2.5 text-center border border-teal-100/50 dark:border-teal-800/20">
                    <p className="text-[18px] font-black text-teal-700 dark:text-teal-400 tabular-nums">{stats.completedCount}/{stats.totalShows}</p>
                    <p className="text-[9px] font-semibold text-teal-600/60 dark:text-teal-400/50 uppercase tracking-wider">{t('myShows.completed')}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/15 dark:to-indigo-900/10 rounded-xl p-2.5 text-center border border-blue-100/50 dark:border-blue-800/20">
                    <p className="text-[18px] font-black text-blue-700 dark:text-blue-400 tabular-nums">~{stats.hours}</p>
                    <p className="text-[9px] font-semibold text-blue-600/60 dark:text-blue-400/50 uppercase tracking-wider">{t('myShows.totalHours')}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/15 dark:to-violet-900/10 rounded-xl p-2.5 text-center border border-purple-100/50 dark:border-purple-800/20">
                    <p className="text-[18px] font-black text-purple-700 dark:text-purple-400 tabular-nums">{stats.pct}%</p>
                    <p className="text-[9px] font-semibold text-purple-600/60 dark:text-purple-400/50 uppercase tracking-wider">{t('myShows.overallProgress')}</p>
                </div>
            </div>

            {/* ══════════════ COMPLETED — HORIZONTAL SCROLL STRIP ══════════════ */}
            {completedShows.length > 0 && (
                <div className="mt-2 mb-4">
                    {/* Label */}
                    <div className="flex items-center gap-2 mb-2.5 px-0.5">
                        <FaCheck className="text-emerald-500/40" size={8} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/40 dark:text-emerald-400/30">
                            {t('myShows.completed')}
                        </span>
                        <span className="text-[10px] text-emerald-500/25 font-medium">
                            {completedShows.length}
                        </span>
                        <div className="flex-1 h-px bg-emerald-500/10" />
                    </div>

                    {/* Horizontal scroll */}
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none"
                        style={{
                            scrollbarWidth: 'none', msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}>
                        {completedShows.map((show) => {
                            const hasEpData = show.episodesPerSeason && Object.keys(show.episodesPerSeason).length > 0;
                            const totalEps = getTotalEpisodesCount(show);

                            return (
                                <div
                                    key={show.id}
                                    className="group relative flex-shrink-0 w-[80px] cursor-pointer"
                                    onClick={() => setExpandedShow(expandedShow === show.id ? null : show.id)}
                                >
                                    {/* Poster card */}
                                    <div className="relative w-[80px] h-[112px] rounded-xl overflow-hidden ring-1 ring-emerald-400/15 shadow-sm">
                                        <ImageWithFallback
                                            src={show.image}
                                            alt={show.title}
                                            className="w-full h-full object-cover brightness-[0.5] saturate-[0.2]"
                                        />
                                        {/* Green frost overlay */}
                                        <div className="absolute inset-0 bg-emerald-600/20 backdrop-blur-[0.3px]" />
                                        {/* Check icon */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-7 h-7 rounded-full bg-emerald-500/25 backdrop-blur-sm flex items-center justify-center">
                                                <FaCheck className="text-emerald-100/90" size={10} />
                                            </div>
                                        </div>
                                        {/* Date badge */}
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                                            <span className="px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[8px] font-bold text-emerald-200/70 whitespace-nowrap">
                                                {hasEpData ? `${totalEps} ep` : formatDate(show.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Title */}
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1.5 text-center truncate px-0.5 leading-tight font-medium">
                                        {show.title}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Expanded episode tracker for selected completed show */}
                    <AnimatePresence>
                        {expandedShow && completedShows.some(s => s.id === expandedShow) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden mt-2"
                            >
                                <div className="rounded-xl border border-emerald-200/15 dark:border-emerald-700/15 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                                            {completedShows.find(s => s.id === expandedShow)?.title}
                                        </h4>
                                        <button onClick={() => setExpandedShow(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                            <FaChevronUp size={10} />
                                        </button>
                                    </div>
                                    <EpisodeTracker item={completedShows.find(s => s.id === expandedShow)!} onUpdate={fetchShows} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ══════════════ ACTIVE SHOWS — VERTICAL LIST ══════════════ */}
            {activeShows.length === 0 && completedShows.length === 0 && (
                <div className="text-center py-16 mt-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <FaFilm className="text-zinc-300 dark:text-zinc-600" size={24} />
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">{t('myShows.noShows')}</p>
                </div>
            )}

            {activeShows.length > 0 && (
                <div className="space-y-2">
                    {activeShows.map((show) => {
                        const progress = getSeriesProgress(show);
                        const nextEp = getNextEpisode(show);
                        const isExpanded = expandedShow === show.id;
                        const hasEpData = show.episodesPerSeason && Object.keys(show.episodesPerSeason).length > 0;
                        const cat = getCategory(show);
                        const totalEps = getTotalEpisodesCount(show);
                        const totalWatched = getTotalWatchedCount(show);
                        const remaining = totalEps - totalWatched;
                        const relativeTime = getRelativeTime(show);
                        const isSelected = selectedShows.has(show.id);
                        const isHovered = hoveredShow === show.id;

                        /* ─── IN PROGRESS ─── */
                        if (cat === 'inProgress') {
                            return (
                                <motion.div
                                    key={show.id}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={`group rounded-xl overflow-hidden transition-all duration-200
                                        ${isExpanded
                                            ? 'bg-white dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-600/50 shadow-lg shadow-black/5 dark:shadow-black/20'
                                            : 'bg-white dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/40 shadow-sm hover:shadow-md hover:border-zinc-300/70 dark:hover:border-zinc-600/50'
                                        }
                                        ${isSelected ? 'ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                                >
                                    <div className="flex items-center gap-3 p-3">
                                        {/* Select checkbox or reorder */}
                                        {selectMode ? (
                                            <button
                                                onClick={() => toggleSelect(show.id)}
                                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border ${isSelected
                                                    ? 'bg-teal-500 border-teal-500 text-white'
                                                    : 'border-zinc-300 dark:border-zinc-600 hover:border-teal-400'
                                                    }`}
                                            >
                                                {isSelected && <FaCheck size={8} />}
                                            </button>
                                        ) : (
                                            <div className="flex flex-col gap-px flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleMoveShow(show.id, 'up'); }} className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
                                                    <FaArrowUp size={7} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleMoveShow(show.id, 'down'); }} className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
                                                    <FaArrowDown size={7} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Poster with tooltip */}
                                        <div
                                            className="relative w-[52px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/5 dark:ring-white/5 shadow-sm"
                                            onMouseEnter={() => setHoveredShow(show.id)}
                                            onMouseLeave={() => setHoveredShow(null)}
                                        >
                                            <ImageWithFallback src={show.image} alt={show.title} className="w-full h-full object-cover" />
                                            {/* "Devam Ediyor" badge */}
                                            <div className="absolute top-0 left-0 right-0">
                                                <div className="bg-teal-500/90 text-[6px] font-bold text-white text-center py-0.5 tracking-wider uppercase">
                                                    {t('myShows.continuing')}
                                                </div>
                                            </div>
                                            {/* Tooltip on hover */}
                                            <AnimatePresence>
                                                {isHovered && (show.description || show.rating || show.genre) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute -bottom-1 left-[56px] w-[200px] bg-zinc-900 dark:bg-zinc-700 rounded-lg p-2.5 shadow-xl z-50 pointer-events-none"
                                                    >
                                                        {show.genre && (
                                                            <p className="text-[9px] text-teal-400 font-semibold mb-1">{show.genre}</p>
                                                        )}
                                                        {show.description && (
                                                            <p className="text-[10px] text-zinc-300 leading-relaxed line-clamp-3">{show.description}</p>
                                                        )}
                                                        {show.rating && show.rating !== '0' && (
                                                            <div className="flex items-center gap-1 mt-1.5">
                                                                <FaStar size={8} className="text-amber-400" />
                                                                <span className="text-[10px] font-bold text-amber-400">{show.rating}</span>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">
                                                {show.title}
                                            </h3>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                                {show.totalSeasons && `${show.totalSeasons} ${t('seasons.seasons')}`}
                                                {hasEpData && ` · ${totalEps} ${t('episodes.episode')}`}
                                                {hasEpData && remaining > 0 && (
                                                    <span className="text-teal-600 dark:text-teal-400 font-semibold"> · {remaining} kaldı</span>
                                                )}
                                            </p>
                                            {/* Relative time */}
                                            {relativeTime && (
                                                <p className="text-[9px] text-zinc-400/70 dark:text-zinc-500/60 mt-0.5 flex items-center gap-1">
                                                    <FaClock size={7} />
                                                    {relativeTime}
                                                </p>
                                            )}

                                            {hasEpData && (
                                                <div className="mt-2">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                                            {progress.totalWatched}/{progress.totalEpisodes}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                                                            {progress.percentage}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-100 dark:bg-zinc-700/60 rounded-full h-1.5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress.percentage}%` }}
                                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                                            className="h-full rounded-full"
                                                            style={{ background: 'linear-gradient(90deg, #14b8a6, #0d9488)' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {nextEp && (
                                                <motion.button
                                                    onClick={(e) => { e.stopPropagation(); handleQuickMark(show); }}
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.94 }}
                                                    className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold text-white shadow-lg shadow-teal-500/25 overflow-hidden"
                                                    style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488, #0f766e)' }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                    <FaPlay size={7} />
                                                    <span className="tabular-nums relative z-[1]">S{nextEp.season}E{nextEp.episode}</span>
                                                </motion.button>
                                            )}
                                            {show.imdbId && (
                                                <button
                                                    onClick={() => setExpandedShow(isExpanded ? null : show.id)}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isExpanded
                                                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    {isExpanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                <div className="px-3 pb-3 border-t border-zinc-100 dark:border-zinc-700/30 pt-3">
                                                    <EpisodeTracker item={show} onUpdate={fetchShows} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        }

                        /* ─── NOT STARTED ─── */
                        return (
                            <motion.div
                                key={show.id}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: isExpanded ? 1 : 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => !selectMode && show.imdbId && setExpandedShow(isExpanded ? null : show.id)}
                                className={`group rounded-xl overflow-hidden transition-all duration-200 cursor-pointer
                                    ${isExpanded
                                        ? 'bg-white dark:bg-zinc-800 border border-teal-400/30 dark:border-teal-500/20 shadow-md shadow-teal-500/5'
                                        : 'bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/30 dark:border-zinc-700/25 border-dashed hover:border-solid hover:border-teal-300/40 dark:hover:border-teal-600/30 hover:bg-white dark:hover:bg-zinc-800/60'
                                    }
                                    ${isSelected ? 'ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                            >
                                <div className="flex items-center gap-3 p-2.5">
                                    {/* Select checkbox or reorder */}
                                    {selectMode ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSelect(show.id); }}
                                            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border ${isSelected
                                                ? 'bg-teal-500 border-teal-500 text-white'
                                                : 'border-zinc-300 dark:border-zinc-600 hover:border-teal-400'
                                                }`}
                                        >
                                            {isSelected && <FaCheck size={8} />}
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-px flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleMoveShow(show.id, 'up'); }} className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-400 transition-all">
                                                <FaArrowUp size={7} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleMoveShow(show.id, 'down'); }} className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-400 transition-all">
                                                <FaArrowDown size={7} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Poster */}
                                    <div className="w-[44px] h-[62px] rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-zinc-200/30 dark:ring-zinc-600/20">
                                        <ImageWithFallback src={show.image} alt={show.title} className="w-full h-full object-cover opacity-60 saturate-[0.5] dark:opacity-50 group-hover:opacity-80 group-hover:saturate-[0.8] transition-all duration-300" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 truncate leading-snug group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                                            {show.title}
                                        </h3>
                                        <p className="text-[10px] text-zinc-400/60 dark:text-zinc-500/50 mt-0.5">
                                            {show.totalSeasons && `${show.totalSeasons} ${t('seasons.seasons')}`}
                                            {hasEpData && ` · ${totalEps} ${t('episodes.episode')}`}
                                        </p>
                                    </div>

                                    {/* Expand indicator */}
                                    <div className="flex-shrink-0">
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded
                                                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                                                : 'text-zinc-300 dark:text-zinc-600 group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/15'
                                                }`}
                                        >
                                            <FaChevronDown size={8} />
                                        </motion.div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                                            <div className="px-2.5 pb-2.5 border-t border-teal-200/20 dark:border-teal-700/15 pt-2.5" onClick={e => e.stopPropagation()}>
                                                <EpisodeTracker item={show} onUpdate={fetchShows} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ══════════════ BULK ACTION BAR ══════════════ */}
            <AnimatePresence>
                {selectMode && selectedShows.size > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="flex items-center gap-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl px-5 py-3 shadow-2xl shadow-black/30">
                            <span className="text-[12px] font-bold tabular-nums">
                                {selectedShows.size} {t('myShows.selected')}
                            </span>
                            <div className="w-px h-5 bg-white/20 dark:bg-zinc-300" />
                            <button
                                onClick={handleBulkMarkCompleted}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 transition-colors"
                            >
                                <FaCheck size={9} />
                                {t('myShows.markCompleted')}
                            </button>
                            <button
                                onClick={() => { setSelectMode(false); setSelectedShows(new Set()); }}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 dark:hover:bg-zinc-200 transition-colors"
                            >
                                <FaTimes size={10} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
