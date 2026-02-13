// src/frontend/components/EpisodeTracker.tsx
// Dark palette – emerald/teal accent, no purple

import { useState } from 'react';
import { FaTv, FaPlay, FaCheck, FaCheckDouble, FaUndo, FaChevronDown, FaChevronUp, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import {
    toggleEpisodeWatched,
    markAllEpisodesInSeason,
    clearSeasonEpisodes,
    updateCurrentProgress,
    getSeriesProgress,
} from '../../backend/services/episodeTrackingService';
import type { MediaItem } from '../../backend/types/media';

interface EpisodeTrackerProps {
    item: MediaItem;
    onUpdate: () => void;
    compact?: boolean;
}

export default function EpisodeTracker({ item, onUpdate, compact = false }: EpisodeTrackerProps) {
    const { t } = useLanguage();
    const [activeSeason, setActiveSeason] = useState(item.currentSeason || 1);
    const [marking, setMarking] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [watchedEpisodes, setWatchedEpisodes] = useState<Record<number, number[]>>(
        item.watchedEpisodes || {}
    );
    const [episodesPerSeason, setEpisodesPerSeason] = useState<Record<number, number>>(
        item.episodesPerSeason || {}
    );

    const totalSeasons = item.totalSeasons || 0;
    const progress = getSeriesProgress({ ...item, watchedEpisodes, episodesPerSeason });

    const getNextEpisode = (): { season: number; episode: number } | null => {
        for (let s = 1; s <= totalSeasons; s++) {
            const watched = watchedEpisodes[s] || [];
            const total = episodesPerSeason[s] || 0;
            if (total === 0) continue;
            for (let e = 1; e <= total; e++) {
                if (!watched.includes(e)) return { season: s, episode: e };
            }
        }
        return null;
    };

    const nextEp = getNextEpisode();

    const handleMarkNext = async () => {
        if (!nextEp) return;
        setMarking(true);
        try {
            const newWatched = await toggleEpisodeWatched(item.id, nextEp.season, nextEp.episode, watchedEpisodes);
            setWatchedEpisodes(newWatched);
            await updateCurrentProgress(item.id, nextEp.season, nextEp.episode);
            onUpdate();
        } catch (error) {
            console.error('Bölüm işaretleme hatası:', error);
        } finally {
            setMarking(false);
        }
    };

    const handleToggleEpisode = async (season: number, episodeNum: number) => {
        try {
            const newWatched = await toggleEpisodeWatched(item.id, season, episodeNum, watchedEpisodes);
            setWatchedEpisodes(newWatched);
            const sEps = newWatched[season] || [];
            if (sEps.length > 0) await updateCurrentProgress(item.id, season, Math.max(...sEps));
            onUpdate();
        } catch (error) {
            console.error('Bölüm toggle hatası:', error);
        }
    };

    const handleMarkAllSeason = async () => {
        const totalEps = episodesPerSeason[activeSeason] || 0;
        if (totalEps === 0) return;
        try {
            const newWatched = await markAllEpisodesInSeason(item.id, activeSeason, totalEps, watchedEpisodes);
            setWatchedEpisodes(newWatched);
            await updateCurrentProgress(item.id, activeSeason, totalEps);
            onUpdate();
        } catch (error) {
            console.error('Sezon işaretleme hatası:', error);
        }
    };

    const handleClearSeason = async () => {
        try {
            const newWatched = await clearSeasonEpisodes(item.id, activeSeason, watchedEpisodes);
            setWatchedEpisodes(newWatched);
            onUpdate();
        } catch (error) {
            console.error('Sezon temizleme hatası:', error);
        }
    };

    if (!item.imdbId || totalSeasons === 0) {
        return (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-100 dark:bg-zinc-700/40 flex items-center justify-center mb-2">
                    <FaTv className="text-zinc-300 dark:text-zinc-600" size={18} />
                </div>
                <p className="text-xs font-medium">{!item.imdbId ? t('episodes.noImdbId') : t('episodes.noSeasons')}</p>
            </div>
        );
    }

    const seasonEps = watchedEpisodes[activeSeason] || [];
    const totalSeasonEps = episodesPerSeason[activeSeason] || 0;
    const isSeasonComplete = seasonEps.length === totalSeasonEps && totalSeasonEps > 0;

    return (
        <div className="space-y-3">
            {/* === Next Episode + Progress === */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-200/40 dark:border-zinc-700/25">
                {/* Progress */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        {progress.totalWatched}/{progress.totalEpisodes} {t('episodes.episode')}
                    </span>
                    <span className={`text-[11px] font-bold ${progress.percentage === 100 ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        {progress.percentage}%
                    </span>
                </div>
                <div className="w-full bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full h-1 overflow-hidden mb-3">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${progress.percentage}%`,
                            background: progress.percentage === 100
                                ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                                : 'linear-gradient(90deg, #10b981, #2dd4bf)',
                        }}
                    />
                </div>

                {/* Button */}
                {nextEp ? (
                    <button
                        onClick={handleMarkNext}
                        disabled={marking}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl transition-all hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-2.5">
                            {marking ? <FaSpinner className="animate-spin" size={14} /> : <FaPlay size={12} />}
                            <div className="text-left">
                                <div className="text-[13px] font-bold">S{nextEp.season} E{nextEp.episode}</div>
                                <div className="text-[9px] opacity-50 font-medium">{t('episodes.markNext')}</div>
                            </div>
                        </div>
                        <FaCheck size={14} className="opacity-40" />
                    </button>
                ) : (
                    <div className="w-full text-center py-2.5 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 rounded-xl text-[12px] font-semibold border border-emerald-200/20 dark:border-emerald-700/15">
                        ✓ {t('seasons.completed')}
                    </div>
                )}
            </div>

            {/* Compact toggle */}
            {compact && !showGrid && (
                <button
                    onClick={() => setShowGrid(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-lg transition-colors"
                >
                    <FaChevronDown size={9} />
                    {t('episodes.showDetails')}
                </button>
            )}

            {/* === Season Tabs + Episode Grid === */}
            {(!compact || showGrid) && (
                <>
                    {compact && showGrid && (
                        <button
                            onClick={() => setShowGrid(false)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <FaChevronUp size={9} /> {t('episodes.hideDetails')}
                        </button>
                    )}

                    {/* Season tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(season => {
                            const sEps = watchedEpisodes[season] || [];
                            const totalSEps = episodesPerSeason[season] || 0;
                            const complete = sEps.length === totalSEps && totalSEps > 0;
                            const hasProgress = sEps.length > 0;

                            return (
                                <button
                                    key={season}
                                    onClick={() => setActiveSeason(season)}
                                    className={`
                                        relative flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all
                                        ${activeSeason === season
                                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                            : complete
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/15 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-800/20'
                                                : hasProgress
                                                    ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-600/30'
                                                    : 'bg-zinc-50 text-zinc-400 dark:bg-zinc-800/40 dark:text-zinc-500 border border-zinc-200/30 dark:border-zinc-700/30'
                                        }
                                    `}
                                >
                                    S{season}
                                    {complete && activeSeason !== season && (
                                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <FaCheck size={5} className="text-white" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Season controls */}
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {t('seasons.season')} {activeSeason}: {seasonEps.length}/{totalSeasonEps}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={handleMarkAllSeason}
                                disabled={isSeasonComplete}
                                className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-700/40 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 disabled:opacity-30 transition-colors border border-zinc-200/40 dark:border-zinc-600/25"
                                title={t('episodes.markAllSeason')}
                            >
                                <FaCheckDouble size={8} />
                                {t('seasons.selectAll')}
                            </button>
                            <button
                                onClick={handleClearSeason}
                                disabled={seasonEps.length === 0}
                                className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold rounded-md bg-zinc-50 text-zinc-400 dark:bg-zinc-800/40 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700/40 disabled:opacity-30 transition-colors border border-zinc-200/30 dark:border-zinc-700/25"
                                title={t('seasons.clearAll')}
                            >
                                <FaUndo size={7} />
                            </button>
                        </div>
                    </div>

                    {/* Episode grid */}
                    <div className="max-h-[240px] overflow-y-auto">
                        {totalSeasonEps > 0 ? (
                            <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                                {Array.from({ length: totalSeasonEps }, (_, i) => i + 1).map(epNum => {
                                    const isWatched = seasonEps.includes(epNum);

                                    return (
                                        <button
                                            key={epNum}
                                            onClick={() => handleToggleEpisode(activeSeason, epNum)}
                                            className={`
                                                aspect-square rounded-lg flex items-center justify-center text-[12px] font-bold transition-all duration-100 active:scale-90
                                                ${isWatched
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : 'bg-zinc-100 dark:bg-zinc-700/40 text-zinc-500 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-zinc-200/50 dark:border-zinc-600/30'
                                                }
                                            `}
                                            title={`E${epNum}`}
                                        >
                                            {isWatched ? <FaCheck size={10} /> : epNum}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                                <p>Bölüm verisi bulunamadı.</p>
                                <p className="mt-1 text-zinc-300 dark:text-zinc-600">Ayarlar → Veri Migrasyon sayfasından yükleyebilirsiniz.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
