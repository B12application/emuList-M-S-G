// src/frontend/components/EpisodeTracker.tsx
// Mobil dostu, basit bölüm takip bileşeni

import { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaCheckDouble, FaTv, FaSpinner, FaPlay, FaChevronDown, FaChevronUp, FaUndo } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { getSeasonEpisodes, type OMDbEpisode } from '../../backend/services/omdbApi';
import {
    toggleEpisodeWatched,
    markAllEpisodesInSeason,
    clearSeasonEpisodes,
    updateCurrentProgress,
    getSeriesProgress,
    saveEpisodesPerSeason,
} from '../../backend/services/episodeTrackingService';
import type { MediaItem } from '../../backend/types/media';

interface EpisodeTrackerProps {
    item: MediaItem;
    onUpdate: () => void;
    /** Kompakt mod: sadece "Sonraki Bölüm" kartını gösterir */
    compact?: boolean;
}

export default function EpisodeTracker({ item, onUpdate, compact = false }: EpisodeTrackerProps) {
    const { t } = useLanguage();
    const [activeSeason, setActiveSeason] = useState(item.currentSeason || 1);
    const [episodes, setEpisodes] = useState<OMDbEpisode[]>([]);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [watchedEpisodes, setWatchedEpisodes] = useState<Record<number, number[]>>(
        item.watchedEpisodes || {}
    );
    const [episodesPerSeason, setEpisodesPerSeason] = useState<Record<number, number>>(
        item.episodesPerSeason || {}
    );

    const totalSeasons = item.totalSeasons || 0;
    const progress = getSeriesProgress({
        ...item,
        watchedEpisodes,
        episodesPerSeason,
    });

    // Sonraki bölümü hesapla
    const getNextEpisode = (): { season: number; episode: number } | null => {
        for (let s = 1; s <= totalSeasons; s++) {
            const watched = watchedEpisodes[s] || [];
            const total = episodesPerSeason[s] || 0;
            if (total === 0) continue;

            for (let e = 1; e <= total; e++) {
                if (!watched.includes(e)) {
                    return { season: s, episode: e };
                }
            }
        }
        return null; // Tamamı izlenmiş
    };

    const nextEp = getNextEpisode();

    // Sezon bölümlerini yükle
    const loadEpisodes = useCallback(async (season: number) => {
        if (!item.imdbId) return;
        setLoading(true);
        try {
            const eps = await getSeasonEpisodes(item.imdbId, season);
            setEpisodes(eps);
            if (eps.length > 0 && episodesPerSeason[season] !== eps.length) {
                const newEps = { ...episodesPerSeason, [season]: eps.length };
                setEpisodesPerSeason(newEps);
                await saveEpisodesPerSeason(item.id, newEps);
            }
        } catch {
            setEpisodes([]);
        } finally {
            setLoading(false);
        }
    }, [item.imdbId, item.id, episodesPerSeason]);

    useEffect(() => {
        if (item.imdbId && totalSeasons > 0 && showGrid) {
            loadEpisodes(activeSeason);
        }
    }, [activeSeason, item.imdbId, totalSeasons, showGrid]);

    // Sonraki bölümü izlendi olarak işaretle
    const handleMarkNext = async () => {
        if (!nextEp) return;
        setMarking(true);
        try {
            const newWatched = await toggleEpisodeWatched(
                item.id, nextEp.season, nextEp.episode, watchedEpisodes
            );
            setWatchedEpisodes(newWatched);
            await updateCurrentProgress(item.id, nextEp.season, nextEp.episode);
            onUpdate();
        } catch (error) {
            console.error('Bölüm işaretleme hatası:', error);
        } finally {
            setMarking(false);
        }
    };

    // Tek bölüm toggle
    const handleToggleEpisode = async (season: number, episodeNum: number) => {
        try {
            const newWatched = await toggleEpisodeWatched(
                item.id, season, episodeNum, watchedEpisodes
            );
            setWatchedEpisodes(newWatched);
            const seasonEps = newWatched[season] || [];
            if (seasonEps.length > 0) {
                await updateCurrentProgress(item.id, season, Math.max(...seasonEps));
            }
            onUpdate();
        } catch (error) {
            console.error('Bölüm toggle hatası:', error);
        }
    };

    // Tüm sezonu işaretle
    const handleMarkAllSeason = async () => {
        const totalEps = episodesPerSeason[activeSeason] || episodes.length;
        if (totalEps === 0) return;
        try {
            const newWatched = await markAllEpisodesInSeason(
                item.id, activeSeason, totalEps, watchedEpisodes
            );
            setWatchedEpisodes(newWatched);
            await updateCurrentProgress(item.id, activeSeason, totalEps);
            onUpdate();
        } catch (error) {
            console.error('Sezon işaretleme hatası:', error);
        }
    };

    // Sezonu temizle
    const handleClearSeason = async () => {
        try {
            const newWatched = await clearSeasonEpisodes(
                item.id, activeSeason, watchedEpisodes
            );
            setWatchedEpisodes(newWatched);
            onUpdate();
        } catch (error) {
            console.error('Sezon temizleme hatası:', error);
        }
    };

    if (!item.imdbId || totalSeasons === 0) {
        return (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                <FaTv className="mx-auto mb-1 text-gray-300 dark:text-gray-600" size={20} />
                <p className="text-xs">{!item.imdbId ? t('episodes.noImdbId') : t('episodes.noSeasons')}</p>
            </div>
        );
    }

    const seasonEps = watchedEpisodes[activeSeason] || [];
    const totalSeasonEps = episodesPerSeason[activeSeason] || 0;
    const isSeasonComplete = seasonEps.length === totalSeasonEps && totalSeasonEps > 0;

    return (
        <div className="space-y-3">
            {/* === ANA KART: Sonraki Bölüm + İlerleme === */}
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/30">
                {/* İlerleme */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {progress.totalWatched}/{progress.totalEpisodes} {t('episodes.episode')}
                    </span>
                    <span className={`text-xs font-bold ${progress.percentage === 100 ? 'text-emerald-500' : 'text-purple-500'}`}>
                        %{progress.percentage}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-3">
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

                {/* Sonraki Bölüm Butonu */}
                {nextEp ? (
                    <button
                        onClick={handleMarkNext}
                        disabled={marking}
                        className="w-full flex items-center justify-between px-4 py-3 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white rounded-xl transition-all shadow-md shadow-purple-500/20 disabled:opacity-60"
                    >
                        <div className="flex items-center gap-3">
                            {marking ? (
                                <FaSpinner className="animate-spin" size={16} />
                            ) : (
                                <FaPlay size={14} />
                            )}
                            <div className="text-left">
                                <div className="text-sm font-bold">
                                    S{nextEp.season} B{nextEp.episode}
                                </div>
                                <div className="text-[10px] text-purple-200">
                                    {t('episodes.markNext')}
                                </div>
                            </div>
                        </div>
                        <FaCheck size={16} />
                    </button>
                ) : (
                    <div className="w-full text-center py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold">
                        ✓ {t('seasons.completed')}
                    </div>
                )}
            </div>

            {/* Compact modda burada dur */}
            {compact && !showGrid && (
                <button
                    onClick={() => setShowGrid(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs text-purple-500 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-lg transition-colors"
                >
                    <FaChevronDown size={10} />
                    {t('episodes.showDetails')}
                </button>
            )}

            {/* === DETAY: Sezon Sekmeleri + Bölüm Grid === */}
            {(!compact || showGrid) && (
                <>
                    {/* Grid'i gizle butonu (compact modda) */}
                    {compact && showGrid && (
                        <button
                            onClick={() => setShowGrid(false)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <FaChevronUp size={10} />
                            {t('episodes.hideDetails')}
                        </button>
                    )}

                    {/* Sezon Sekmeleri */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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
                                        relative flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                        ${activeSeason === season
                                            ? 'bg-purple-500 text-white shadow-md'
                                            : complete
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : hasProgress
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                        }
                                    `}
                                >
                                    S{season}
                                    {complete && activeSeason !== season && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <FaCheck size={6} className="text-white" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sezon Kontrolleri */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('seasons.season')} {activeSeason}: {seasonEps.length}/{totalSeasonEps}
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={handleMarkAllSeason}
                                disabled={isSeasonComplete || loading}
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 disabled:opacity-40 transition-colors"
                                title={t('episodes.markAllSeason')}
                            >
                                <FaCheckDouble size={9} />
                                {t('seasons.selectAll')}
                            </button>
                            <button
                                onClick={handleClearSeason}
                                disabled={seasonEps.length === 0 || loading}
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 disabled:opacity-40 transition-colors"
                                title={t('seasons.clearAll')}
                            >
                                <FaUndo size={8} />
                            </button>
                        </div>
                    </div>

                    {/* Bölüm Grid - Mobil dostu, basit numaralı kutular */}
                    <div className="max-h-[250px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <FaSpinner className="animate-spin text-purple-500" size={18} />
                            </div>
                        ) : totalSeasonEps > 0 ? (
                            <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                                {Array.from({ length: totalSeasonEps }, (_, i) => i + 1).map(epNum => {
                                    const isWatched = seasonEps.includes(epNum);
                                    // Bölüm adı episode listesinden bul
                                    const epInfo = episodes.find(e => parseInt(e.Episode, 10) === epNum);

                                    return (
                                        <button
                                            key={epNum}
                                            onClick={() => handleToggleEpisode(activeSeason, epNum)}
                                            className={`
                                                relative aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-90
                                                ${isWatched
                                                    ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/30'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                                }
                                            `}
                                            title={epInfo ? `${epNum}. ${epInfo.Title}` : `B${epNum}`}
                                        >
                                            {isWatched ? <FaCheck size={12} /> : epNum}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            // episodesPerSeason bilinmiyorsa, OMDB'den yükle
                            <button
                                onClick={() => loadEpisodes(activeSeason)}
                                className="w-full py-3 text-xs text-purple-500 hover:text-purple-600 transition-colors"
                            >
                                {t('seasons.fetchFromOmdb')}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
