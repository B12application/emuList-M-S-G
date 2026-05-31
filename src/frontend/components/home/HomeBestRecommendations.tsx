import { useState } from 'react';
import {
    FaStar,
    FaChevronDown,
    FaChevronUp,
    FaCog,
    FaFilm,
    FaTv,
    FaSpinner,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaGamepad,
    FaBook,
    FaTrophy,
} from 'react-icons/fa';
import { groupRecommendationsByCategory } from '../../../backend/services/recommendationService';
import type { Recommendation } from '../../../backend/types/recommendation';

type TFn = (key: string) => string;

interface HomeBestRecommendationsProps {
    recommendations: Recommendation[];
    recsLoading: boolean;
    recsExpanded: boolean;
    setRecsExpanded: (v: boolean) => void;
    userUid: string | undefined;
    adminUid: string;
    onOpenAdmin: () => void;
    handleAddToCollection: (rec: Recommendation) => void;
    recFilmPage: number;
    setRecFilmPage: React.Dispatch<React.SetStateAction<number>>;
    recSeriesPage: number;
    setRecSeriesPage: React.Dispatch<React.SetStateAction<number>>;
    recsPerPage: number;
    t: TFn;
}

// Mini kart component - tekrar eden yapıyı soyutluyoruz
function RecCard({
    rec,
    onAdd,
    accentColor,
    t,
}: {
    rec: Recommendation;
    onAdd: (rec: Recommendation) => void;
    accentColor: string;
    t: TFn;
}) {
    return (
        <button
            type="button"
            onClick={() => onAdd(rec)}
            className="group w-full text-left"
        >
            <div className={`flex gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-${accentColor}-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-${accentColor}-700`}>
                {/* Thumbnail */}
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-zinc-800">
                    {rec.image ? (
                        <img
                            src={rec.image}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                            <FaFilm className="text-lg" />
                        </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                        <FaPlus className="text-white text-sm" />
                    </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-bold text-slate-900 line-clamp-1 dark:text-white">
                        {rec.title}
                    </h5>
                    {rec.description && (
                        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1 dark:text-zinc-400">
                            {rec.description}
                        </p>
                    )}
                    {rec.author && (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">{rec.author}</p>
                    )}
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 dark:bg-amber-950">
                        <FaStar className="text-[10px] text-amber-500" />
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                            {rec.rating}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}

// Poster kart - yatay scroll için
function PosterCard({
    rec,
    onAdd,
    badge,
    badgeColor,
    t,
}: {
    rec: Recommendation;
    onAdd: (rec: Recommendation) => void;
    badge?: string;
    badgeColor?: string;
    t: TFn;
}) {
    return (
        <button
            type="button"
            onClick={() => onAdd(rec)}
            className="group w-40 shrink-0 text-left"
        >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                {/* Poster */}
                <div className="relative aspect-[2/3] overflow-hidden bg-slate-100 dark:bg-zinc-800">
                    {rec.image ? (
                        <img
                            src={rec.image}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                            <FaFilm className="text-2xl" />
                        </div>
                    )}

                    {/* Rating badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/70 px-1.5 py-0.5 text-white backdrop-blur-sm">
                        <FaStar className="text-[10px] text-amber-400" />
                        <span className="text-[11px] font-bold">{rec.rating}</span>
                    </div>

                    {/* Award badge */}
                    {badge && (
                        <div className={`absolute top-2 left-2 rounded-lg ${badgeColor || 'bg-amber-500'} px-1.5 py-0.5 text-[10px] font-bold text-white`}>
                            {badge}
                        </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                            <FaPlus className="inline mr-1 text-[10px]" />
                            {t('home.add')}
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div className="p-2.5">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight dark:text-white">
                        {rec.title}
                    </h4>
                </div>
            </div>
        </button>
    );
}

export default function HomeBestRecommendations(props: HomeBestRecommendationsProps) {
    const {
        recommendations,
        recsLoading,
        recsExpanded,
        setRecsExpanded,
        userUid,
        adminUid,
        onOpenAdmin,
        handleAddToCollection,
        recFilmPage,
        setRecFilmPage,
        recSeriesPage,
        setRecSeriesPage,
        recsPerPage,
        t,
    } = props;

    const isAdmin = userUid === adminUid;

    return (
        <section className="mt-16">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-950 dark:text-amber-400">
                        <FaStar className="text-sm" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            {t('home.bestRecsTitle')}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {recommendations.length} {t('home.bestRecsSeeAll')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenAdmin}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                            <FaCog className="text-[10px]" />
                            {t('home.adminManage')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setRecsExpanded(!recsExpanded)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                        {recsExpanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                    </button>
                </div>
            </div>

            {/* Content */}
            {recsExpanded && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                    {recsLoading ? (
                        <div className="flex items-center justify-center gap-3 py-16">
                            <FaSpinner className="h-5 w-5 animate-spin text-slate-400" />
                            <span className="text-sm text-slate-500">{t('home.loading')}</span>
                        </div>
                    ) : recommendations.length === 0 ? (
                        <div className="py-12 text-center">
                            <FaStar className="mx-auto text-3xl text-slate-300 dark:text-zinc-600" />
                            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{t('home.noRecsTitle')}</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{t('home.noRecsBody')}</p>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={onOpenAdmin}
                                    className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                                >
                                    {t('home.adminManage')}
                                </button>
                            )}
                        </div>
                    ) : (
                        (() => {
                            const grouped = groupRecommendationsByCategory(recommendations);

                            return (
                                <div className="space-y-8">
                                    {/* ── Most Watched 2025 ── */}
                                    {grouped['most-watched-2025'].length > 0 && (() => {
                                        const allFilms = grouped['most-watched-2025'].filter((rec) => rec.type === 'movie');
                                        const allSeries = grouped['most-watched-2025'].filter((rec) => rec.type === 'series');
                                        const totalFilmPages = Math.ceil(allFilms.length / recsPerPage);
                                        const totalSeriesPages = Math.ceil(allSeries.length / recsPerPage);
                                        const films = allFilms.slice((recFilmPage - 1) * recsPerPage, recFilmPage * recsPerPage);
                                        const series = allSeries.slice((recSeriesPage - 1) * recsPerPage, recSeriesPage * recsPerPage);

                                        return (
                                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                {/* Films */}
                                                {allFilms.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <FaFilm className="text-sky-500 text-sm" />
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('nav.movies')}</h4>
                                                            <span className="text-[11px] text-slate-400 dark:text-zinc-500">({allFilms.length})</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {films.map((rec) => (
                                                                <RecCard key={rec.id} rec={rec} onAdd={handleAddToCollection} accentColor="sky" t={t} />
                                                            ))}
                                                        </div>
                                                        {totalFilmPages > 1 && (
                                                            <div className="flex items-center justify-center gap-3 mt-3">
                                                                <button onClick={() => setRecFilmPage((p) => Math.max(1, p - 1))} disabled={recFilmPage === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:hover:bg-zinc-800">
                                                                    <FaChevronLeft className="text-[10px]" />
                                                                </button>
                                                                <span className="text-xs text-slate-400 tabular-nums">{recFilmPage}/{totalFilmPages}</span>
                                                                <button onClick={() => setRecFilmPage((p) => Math.min(totalFilmPages, p + 1))} disabled={recFilmPage === totalFilmPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:hover:bg-zinc-800">
                                                                    <FaChevronRight className="text-[10px]" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Series */}
                                                {allSeries.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <FaTv className="text-rose-500 text-sm" />
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('nav.series')}</h4>
                                                            <span className="text-[11px] text-slate-400 dark:text-zinc-500">({allSeries.length})</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {series.map((rec) => (
                                                                <RecCard key={rec.id} rec={rec} onAdd={handleAddToCollection} accentColor="rose" t={t} />
                                                            ))}
                                                        </div>
                                                        {totalSeriesPages > 1 && (
                                                            <div className="flex items-center justify-center gap-3 mt-3">
                                                                <button onClick={() => setRecSeriesPage((p) => Math.max(1, p - 1))} disabled={recSeriesPage === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:hover:bg-zinc-800">
                                                                    <FaChevronLeft className="text-[10px]" />
                                                                </button>
                                                                <span className="text-xs text-slate-400 tabular-nums">{recSeriesPage}/{totalSeriesPages}</span>
                                                                <button onClick={() => setRecSeriesPage((p) => Math.min(totalSeriesPages, p + 1))} disabled={recSeriesPage === totalSeriesPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:hover:bg-zinc-800">
                                                                    <FaChevronRight className="text-[10px]" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* ── Best Movies ── */}
                                    {grouped['best-movies'].length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaTrophy className="text-amber-500 text-sm" />
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('home.bestRecsBestMovies')}</h3>
                                                <span className="text-[11px] text-slate-400 dark:text-zinc-500">({grouped['best-movies'].length})</span>
                                            </div>
                                            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                {grouped['best-movies'].map((rec) => (
                                                    <PosterCard key={rec.id} rec={rec} onAdd={handleAddToCollection} t={t} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Award Winning ── */}
                                    {grouped['award-winning'].length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaStar className="text-amber-500 text-sm" />
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('home.bestRecsAwardWinning')}</h3>
                                                <span className="text-[11px] text-slate-400 dark:text-zinc-500">({grouped['award-winning'].length})</span>
                                            </div>
                                            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                {grouped['award-winning'].map((rec) => (
                                                    <PosterCard
                                                        key={rec.id}
                                                        rec={rec}
                                                        onAdd={handleAddToCollection}
                                                        badge={rec.award}
                                                        badgeColor="bg-amber-500"
                                                        t={t}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Top Series ── */}
                                    {grouped['top-series'].length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaTv className="text-rose-500 text-sm" />
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('home.bestRecsTopSeries')}</h3>
                                                <span className="text-[11px] text-slate-400 dark:text-zinc-500">({grouped['top-series'].length})</span>
                                            </div>
                                            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                {grouped['top-series'].map((rec) => (
                                                    <PosterCard key={rec.id} rec={rec} onAdd={handleAddToCollection} t={t} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Top Books ── */}
                                    {grouped['top-books'].length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaBook className="text-violet-500 text-sm" />
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('home.bestRecsTopBooks')}</h3>
                                                <span className="text-[11px] text-slate-400 dark:text-zinc-500">({grouped['top-books'].length})</span>
                                            </div>
                                            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                {grouped['top-books'].map((rec) => (
                                                    <PosterCard
                                                        key={rec.id}
                                                        rec={rec}
                                                        onAdd={handleAddToCollection}
                                                        badge={rec.author}
                                                        badgeColor="bg-violet-500"
                                                        t={t}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>
            )}
        </section>
    );
}