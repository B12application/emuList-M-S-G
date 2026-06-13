// src/frontend/pages/MyShowsPage.tsx

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
import { useModalLock } from '../hooks/useModalLock';
import Portal from '../components/ui/Portal';

import {
    FaTv, FaPlay, FaCheck, FaPlus, FaSearch,
    FaChevronDown, FaChevronUp, FaStar, FaClock,
    FaTimes, FaFilter
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type ShowCategory = 'completed' | 'inProgress' | 'notStarted';
type LayoutMode = 'grid' | 'rows' | 'compact';

export default function MyShowsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [shows, setShows] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedShow, setExpandedShow] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<ShowCategory | 'all'>('all');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
    const [showFilters, setShowFilters] = useState(false);
    useModalLock(!!expandedShow && layoutMode === 'grid');

    const fetchShows = async () => {
        if (!user) return;
        try {
            const q = query(collection(db, 'mediaItems'), where('userId', '==', user.uid), where('type', '==', 'series'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setShows(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchShows(); }, [user]);

    const getCategory = (show: MediaItem): ShowCategory => {
        const p = getSeriesProgress(show);
        const hasWE = show.watchedEpisodes && Object.values(show.watchedEpisodes).some((eps: any) => eps.length > 0);
        if (show.watched) return 'completed';
        if (p.totalEpisodes > 0 && p.percentage === 100) return 'completed';
        if (p.totalWatched > 0 || hasWE) return 'inProgress';
        return 'notStarted';
    };

    const getTotalEpisodes = (show: MediaItem): number => {
        const eps = show.episodesPerSeason || {};
        return Object.values(eps).reduce((sum: number, n: any) => sum + n, 0);
    };

    const getTotalWatched = (show: MediaItem): number => {
        const we = show.watchedEpisodes || {};
        return Object.values(we).reduce((sum: number, arr: any) => sum + arr.length, 0);
    };

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

    const getRelativeTime = (show: MediaItem): string | null => {
        const ts = show.lastWatchedAt;
        if (!ts) return null;
        const date = (ts as any).toDate ? (ts as any).toDate() : new Date(ts as any);
        const diff = Date.now() - date.getTime();
        const days = Math.floor(diff / 86400000);
        if (days < 1) return 'Bugün';
        if (days === 1) return 'Dün';
        if (days < 7) return `${days}g`;
        if (days < 30) return `${Math.floor(days / 7)}h`;
        return `${Math.floor(days / 30)}a`;
    };

    const stats = useMemo(() => {
        const completed = shows.filter(s => getCategory(s) === 'completed').length;
        const inProgress = shows.filter(s => getCategory(s) === 'inProgress').length;
        const notStarted = shows.filter(s => getCategory(s) === 'notStarted').length;
        let totalEps = 0, watchedEps = 0;
        shows.forEach(s => {
            totalEps += getTotalEpisodes(s);
            watchedEps += getTotalWatched(s);
        });
        const hours = Math.round(watchedEps * 0.75);
        const pct = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;
        return { total: shows.length, completed, inProgress, notStarted, hours, pct, totalEps, watchedEps };
    }, [shows]);

    const genres = useMemo(() => {
        const s = new Set<string>();
        shows.forEach(show => {
            if (show.genre) show.genre.split(',').map(g => g.trim()).filter(Boolean).forEach(g => s.add(g));
        });
        return Array.from(s).sort();
    }, [shows]);

    const filteredShows = useMemo(() => {
        let list = [...shows];
        if (activeFilter !== 'all') list = list.filter(s => getCategory(s) === activeFilter);
        if (selectedGenre) list = list.filter(s => s.genre?.toLowerCase().includes(selectedGenre.toLowerCase()));
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.title.toLowerCase().includes(q));
        }
        const pri: Record<ShowCategory, number> = { inProgress: 0, notStarted: 1, completed: 2 };
        list.sort((a, b) => pri[getCategory(a)] - pri[getCategory(b)]);
        return list;
    }, [shows, activeFilter, selectedGenre, searchQuery]);

    const handleQuickMark = async (show: MediaItem) => {
        const next = getNextEpisode(show);
        if (!next) return;
        try {
            await toggleEpisodeWatched(show.id, next.season, next.episode, show.watchedEpisodes || {});
            await updateCurrentProgress(show.id, next.season, next.episode);
            toast.success(`S${next.season} E${next.episode} işaretlendi`);
            fetchShows();
        } catch (err) { console.error(err); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
            </div>
        );
    }
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FaTv className="text-slate-400 text-lg" />
                        İzleme Listem
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500">{stats.total} dizi</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">{stats.completed} tamamlandı</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                        <span className="text-sm text-rose-500">{stats.inProgress} devam</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/create?type=series"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-zinc-200 transition active:scale-95"
                    >
                        <FaPlus className="text-xs" />
                        Dizi Ekle
                    </Link>
                </div>
            </div>

            {/* ═══ İLERLEME BAR ═══ */}
            <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Genel İlerleme</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-700"
                        style={{ width: `${stats.pct}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>{stats.watchedEps} / {stats.totalEps} bölüm</span>
                    <span>~{stats.hours} saat</span>
                </div>
            </div>

            {/* ═══ ARAÇ ÇUBUĞU ═══ */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Arama */}
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Dizi ara..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-300 dark:focus:border-zinc-700 transition"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <FaTimes className="text-xs" />
                        </button>
                    )}
                </div>

                {/* Filtreler */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${showFilters || selectedGenre || activeFilter !== 'all'
                            ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700'
                            }`}
                    >
                        <FaFilter className="text-[10px]" />
                        Filtre
                    </button>

                    {/* Layout toggle */}
                    <div className="flex rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                        {(['rows', 'grid', 'compact'] as LayoutMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setLayoutMode(mode)}
                                className={`px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider transition ${layoutMode === mode
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {mode === 'rows' ? '≡' : mode === 'grid' ? '⊞' : '⊟'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Genişletilmiş filtreler */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-4">
                            {/* Kategori */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Durum</p>
                                <div className="flex gap-1.5 flex-wrap">
                                    {[
                                        { key: 'all' as const, label: 'Tümü' },
                                        { key: 'inProgress' as const, label: 'Devam Eden', color: 'rose' },
                                        { key: 'notStarted' as const, label: 'Başlanmadı', color: 'slate' },
                                        { key: 'completed' as const, label: 'Tamamlandı', color: 'emerald' },
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setActiveFilter(f.key)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeFilter === f.key
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Genre */}
                            {genres.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tür</p>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {genres.map(genre => (
                                            <button
                                                key={genre}
                                                onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedGenre === genre
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                                    }`}
                                            >
                                                {genre}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ LİSTE ═══ */}
            {filteredShows.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                        <FaTv className="text-2xl text-slate-300 dark:text-zinc-600" />
                    </div>
                    <p className="text-sm text-slate-500">
                        {searchQuery ? 'Aramanızla eşleşen dizi bulunamadı.' : 'Henüz dizi eklenmemiş.'}
                    </p>
                    <Link to="/create?type=series" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-slate-900 dark:text-white hover:underline">
                        <FaPlus className="text-xs" /> İlk dizini ekle
                    </Link>
                </div>
            ) : layoutMode === 'grid' ? (
                /* ═══ GRID LAYOUT ═══ */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredShows.map(show => {
                        const cat = getCategory(show);
                        const progress = getSeriesProgress(show);
                        const nextEp = getNextEpisode(show);
                        const isExpanded = expandedShow === show.id;
                        return (
                            <div key={show.id}>
                                <motion.button
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => setExpandedShow(isExpanded ? null : show.id)}
                                    className={`group relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 w-full ${cat === 'completed' ? 'opacity-50' : ''
                                        } ${isExpanded ? 'ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-zinc-950' : ''}`}
                                >
                                    <ImageWithFallback src={show.image} alt={show.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                    {/* Top badges */}
                                    <div className="absolute top-2 left-2 flex gap-1.5">
                                        {cat === 'completed' && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-[9px] font-bold text-white">✓</span>
                                        )}
                                        {cat === 'inProgress' && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/90 text-[9px] font-bold text-white">{progress.percentage}%</span>
                                        )}
                                    </div>

                                    {/* Bottom info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                        <p className="text-xs font-bold text-white line-clamp-1 leading-tight">{show.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {show.totalSeasons && (
                                                <span className="text-[9px] text-white/70">{show.totalSeasons} sezon</span>
                                            )}
                                            {nextEp && cat === 'inProgress' && (
                                                <span className="text-[9px] font-bold text-rose-300 bg-black/40 px-1.5 py-0.5 rounded">
                                                    S{nextEp.season}E{nextEp.episode}
                                                </span>
                                            )}
                                        </div>
                                        {cat === 'inProgress' && progress.totalEpisodes > 0 && (
                                            <div className="w-full h-1 rounded-full bg-white/20 mt-2 overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${progress.percentage}%` }} />
                                            </div>
                                        )}
                                    </div>
                                </motion.button>

                            </div>
                        );
                    })}
                </div>
            ) : layoutMode === 'compact' ? (
                /* ═══ COMPACT LAYOUT ═══ */
                <div className="space-y-1">
                    {filteredShows.map(show => {
                        const cat = getCategory(show);
                        const progress = getSeriesProgress(show);
                        const nextEp = getNextEpisode(show);
                        const relTime = getRelativeTime(show);
                        return (
                            <div key={show.id}>
                                <div
                                    onClick={() => setExpandedShow(expandedShow === show.id ? null : show.id)}
                                    className={`flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer transition hover:bg-slate-50 dark:hover:bg-zinc-900 ${cat === 'completed' ? 'opacity-50' : ''
                                        }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat === 'completed' ? 'bg-emerald-500' : cat === 'inProgress' ? 'bg-rose-500' : 'bg-slate-300 dark:bg-zinc-700'
                                        }`} />
                                    <span className={`text-sm flex-1 truncate ${cat === 'completed' ? 'line-through' : 'font-medium text-slate-900 dark:text-white'}`}>
                                        {show.title}
                                    </span>
                                    {cat === 'inProgress' && progress.totalEpisodes > 0 && (
                                        <span className="text-[11px] text-rose-500 font-semibold shrink-0">{progress.percentage}%</span>
                                    )}
                                    {relTime && <span className="text-[10px] text-slate-400 shrink-0">{relTime}</span>}
                                    {nextEp && cat === 'inProgress' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleQuickMark(show); }}
                                            className="shrink-0 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition"
                                        >
                                            S{nextEp.season}E{nextEp.episode}
                                        </button>
                                    )}
                                    <FaChevronDown className={`text-[10px] text-slate-400 transition ${expandedShow === show.id ? 'rotate-180' : ''}`} />
                                </div>
                                <AnimatePresence>
                                    {expandedShow === show.id && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="ml-6 pl-4 border-l-2 border-slate-200 dark:border-zinc-800 py-3">
                                                <EpisodeTracker item={show} onUpdate={fetchShows} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ═══ ROWS LAYOUT (default) ═══ */
                <div className="space-y-2">
                    {filteredShows.map(show => {
                        const cat = getCategory(show);
                        const progress = getSeriesProgress(show);
                        const nextEp = getNextEpisode(show);
                        const totalEps = getTotalEpisodes(show);
                        const isExpanded = expandedShow === show.id;
                        return (
                            <div key={show.id} className={`rounded-2xl border transition-all ${cat === 'completed'
                                ? 'border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-950/50 opacity-60'
                                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-sm'
                                }`}>
                                <div
                                    onClick={() => setExpandedShow(isExpanded ? null : show.id)}
                                    className="flex items-center gap-4 p-4 cursor-pointer"
                                >
                                    {/* Poster */}
                                    <div className="w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800 ring-1 ring-black/5">
                                        <ImageWithFallback src={show.image} alt={show.title} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {cat === 'completed' && <FaCheck className="text-emerald-500 text-[10px] shrink-0" />}
                                            <h3 className={`text-sm font-bold truncate ${cat === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                {show.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {show.totalSeasons && <span className="text-[11px] text-slate-400">{show.totalSeasons} sezon</span>}
                                            {totalEps > 0 && <span className="text-[11px] text-slate-400">{totalEps} bölüm</span>}
                                            {show.rating && show.rating !== '0' && (
                                                <span className="text-[11px] text-amber-500 flex items-center gap-0.5">
                                                    <FaStar className="text-[9px]" /> {show.rating}
                                                </span>
                                            )}
                                        </div>
                                        {cat === 'inProgress' && progress.totalEpisodes > 0 && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                                    <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${progress.percentage}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-rose-500 shrink-0">{progress.percentage}%</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {nextEp && cat === 'inProgress' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleQuickMark(show); }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white text-[11px] font-bold rounded-lg hover:bg-rose-600 active:scale-95 transition"
                                            >
                                                <FaPlay className="text-[8px]" />
                                                S{nextEp.season}E{nextEp.episode}
                                            </button>
                                        )}
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${isExpanded ? 'bg-slate-100 dark:bg-zinc-800' : 'text-slate-400'
                                            }`}>
                                            <FaChevronDown className={`text-[10px] transition ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded tracker */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="px-4 pb-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
                                                <EpisodeTracker item={show} onUpdate={fetchShows} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* ═══ GRID MODAL — Bölüm Takip ═══ */}

            <AnimatePresence>
                {layoutMode === 'grid' && expandedShow && (() => {
                    const show = shows.find(s => s.id === expandedShow);
                    if (!show) return null;
                    const nextEp = getNextEpisode(show);
                    const cat = getCategory(show);

                    return (
                        <Portal key="grid-modal-portal">
                            <div
                                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                                onClick={() => setExpandedShow(null)}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-auto"
                                    style={{ maxHeight: '90vh' }}
                                >
                                    {/* Header */}
                                    <div className="relative h-40 overflow-hidden">
                                        <ImageWithFallback src={show.image} alt={show.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-white/60 dark:via-zinc-950/60 to-transparent" />
                                        <button
                                            onClick={() => setExpandedShow(null)}
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition backdrop-blur-sm"
                                        >
                                            <FaTimes className="text-sm" />
                                        </button>
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{show.title}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {show.totalSeasons && <span className="text-xs text-slate-500">{show.totalSeasons} sezon</span>}
                                                {show.rating && show.rating !== '0' && (
                                                    <span className="text-xs text-amber-500 flex items-center gap-0.5"><FaStar className="text-[10px]" /> {show.rating}</span>
                                                )}
                                                <span className="text-xs text-slate-400">•</span>
                                                <span className="text-xs text-slate-500">{getTotalWatched(show)}/{getTotalEpisodes(show)} bölüm</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick action */}
                                    {nextEp && cat === 'inProgress' && (
                                        <div className="px-4 pt-3">
                                            <button
                                                onClick={() => handleQuickMark(show)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 active:scale-[0.98] transition"
                                            >
                                                <FaPlay className="text-[10px]" />
                                                Sonraki: S{nextEp.season} Bölüm {nextEp.episode}
                                            </button>
                                        </div>
                                    )}

                                    {/* Episode tracker */}
                                    <div className="px-4 py-4">
                                        <EpisodeTracker item={show} onUpdate={fetchShows} />
                                    </div>
                                </motion.div>
                            </div>
                        </Portal>
                    );
                })()}
            </AnimatePresence>
        </div>

    );

}