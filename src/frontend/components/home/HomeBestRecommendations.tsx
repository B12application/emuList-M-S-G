import {
    FaStar,
    FaChevronDown,
    FaChevronUp,
    FaCog,
    FaFilm,
    FaTv,
    FaSpinner,
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

export default function HomeBestRecommendations({
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
}: HomeBestRecommendationsProps) {
    const isAdmin = userUid === adminUid;

    return (
        <section className="relative mt-16 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/50 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.12),transparent_40%)]" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <FaStar className="text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{t('home.bestRecsTitle')}</h2>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">{t('home.bestRecsSeeAll')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenAdmin}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                            <FaCog /> {t('home.adminManage')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setRecsExpanded(!recsExpanded)}
                        className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        title={recsExpanded ? t('home.collapseRecs') : t('home.expandRecs')}
                    >
                        {recsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                </div>
            </div>

            {recsExpanded && (
                <div className="relative mt-10 space-y-10">
                    {recsLoading ? (
                        <div className="flex justify-center py-10">
                            <FaSpinner className="h-10 w-10 animate-spin text-amber-500" />
                        </div>
                    ) : (
                        (() => {
                            const grouped = groupRecommendationsByCategory(recommendations);

                            return (
                                <>
                                    {grouped['most-watched-2025'].length > 0 &&
                                        (() => {
                                            const allFilms = grouped['most-watched-2025'].filter((rec) => rec.type === 'movie');
                                            const allSeries = grouped['most-watched-2025'].filter((rec) => rec.type === 'series');
                                            const totalFilmPages = Math.ceil(allFilms.length / recsPerPage);
                                            const totalSeriesPages = Math.ceil(allSeries.length / recsPerPage);
                                            const films = allFilms.slice((recFilmPage - 1) * recsPerPage, recFilmPage * recsPerPage);
                                            const series = allSeries.slice((recSeriesPage - 1) * recsPerPage, recSeriesPage * recsPerPage);

                                            return (
                                                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                                                    {allFilms.length > 0 && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="rounded-xl bg-linear-to-br from-sky-500 to-blue-600 p-2 shadow-md">
                                                                    <FaFilm className="text-white" size={18} />
                                                                </div>
                                                                <h4 className="text-xl font-bold text-slate-800 dark:text-zinc-200">{t('nav.movies')}</h4>
                                                                <span className="ml-auto rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                                                                    {allFilms.length}
                                                                </span>
                                                            </div>
                                                            <div className="min-h-[420px] space-y-3">
                                                                {films.map((rec) => (
                                                                    <button
                                                                        type="button"
                                                                        key={rec.id}
                                                                        onClick={() => handleAddToCollection(rec)}
                                                                        className="group w-full text-left"
                                                                    >
                                                                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white to-slate-50 shadow-md transition hover:scale-[1.01] hover:border-sky-400 hover:shadow-2xl dark:border-zinc-700/60 dark:from-zinc-800 dark:to-zinc-900/80 dark:hover:border-sky-500">
                                                                            <div className="flex">
                                                                                <div className="relative h-36 w-28 shrink-0 overflow-hidden sm:h-32 sm:w-24">
                                                                                    {rec.image && (
                                                                                        <img
                                                                                            src={rec.image}
                                                                                            alt=""
                                                                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                                                                        />
                                                                                    )}
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                                                                        <span className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white">+ {t('home.add')}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-1 flex-col justify-between p-4">
                                                                                    <div>
                                                                                        <h5 className="line-clamp-2 text-sm font-bold text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                                                                                            {rec.title}
                                                                                        </h5>
                                                                                        {rec.description && (
                                                                                            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-zinc-400">{rec.description}</p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 dark:bg-amber-900/25">
                                                                                        <FaStar size={11} className="text-amber-500" />
                                                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{rec.rating}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {totalFilmPages > 1 && (
                                                                <div className="flex items-center justify-center gap-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setRecFilmPage((p) => Math.max(1, p - 1))}
                                                                        disabled={recFilmPage === 1}
                                                                        className="rounded-full bg-slate-200 p-2 text-slate-600 transition hover:bg-sky-100 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-sky-900/30"
                                                                    >
                                                                        <FaChevronUp className="-rotate-90" />
                                                                    </button>
                                                                    <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                                                                        {recFilmPage} / {totalFilmPages}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setRecFilmPage((p) => Math.min(totalFilmPages, p + 1))}
                                                                        disabled={recFilmPage === totalFilmPages}
                                                                        className="rounded-full bg-slate-200 p-2 text-slate-600 transition hover:bg-sky-100 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-sky-900/30"
                                                                    >
                                                                        <FaChevronDown className="-rotate-90" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {allSeries.length > 0 && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="rounded-xl bg-linear-to-br from-rose-500 to-red-600 p-2 shadow-md">
                                                                    <FaTv className="text-white" size={18} />
                                                                </div>
                                                                <h4 className="text-xl font-bold text-slate-800 dark:text-zinc-200">{t('nav.series')}</h4>
                                                                <span className="ml-auto rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
                                                                    {allSeries.length}
                                                                </span>
                                                            </div>
                                                            <div className="min-h-[420px] space-y-3">
                                                                {series.map((rec) => (
                                                                    <button
                                                                        type="button"
                                                                        key={rec.id}
                                                                        onClick={() => handleAddToCollection(rec)}
                                                                        className="group w-full text-left"
                                                                    >
                                                                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white to-slate-50 shadow-md transition hover:scale-[1.01] hover:border-rose-400 hover:shadow-2xl dark:border-zinc-700/60 dark:from-zinc-800 dark:to-zinc-900/80 dark:hover:border-rose-500">
                                                                            <div className="flex">
                                                                                <div className="relative h-36 w-28 shrink-0 overflow-hidden sm:h-32 sm:w-24">
                                                                                    {rec.image && (
                                                                                        <img
                                                                                            src={rec.image}
                                                                                            alt=""
                                                                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                                                                        />
                                                                                    )}
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                                                                        <span className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">+ {t('home.add')}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-1 flex-col justify-between p-4">
                                                                                    <div>
                                                                                        <h5 className="line-clamp-2 text-sm font-bold text-slate-900 transition group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400">
                                                                                            {rec.title}
                                                                                        </h5>
                                                                                        {rec.description && (
                                                                                            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-zinc-400">{rec.description}</p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 dark:bg-amber-900/25">
                                                                                        <FaStar size={11} className="text-amber-500" />
                                                                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{rec.rating}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {totalSeriesPages > 1 && (
                                                                <div className="flex items-center justify-center gap-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setRecSeriesPage((p) => Math.max(1, p - 1))}
                                                                        disabled={recSeriesPage === 1}
                                                                        className="rounded-full bg-slate-200 p-2 text-slate-600 transition hover:bg-rose-100 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-rose-900/30"
                                                                    >
                                                                        <FaChevronUp className="-rotate-90" />
                                                                    </button>
                                                                    <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                                                                        {recSeriesPage} / {totalSeriesPages}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setRecSeriesPage((p) => Math.min(totalSeriesPages, p + 1))}
                                                                        disabled={recSeriesPage === totalSeriesPages}
                                                                        className="rounded-full bg-slate-200 p-2 text-slate-600 transition hover:bg-rose-100 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-rose-900/30"
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

                                    {grouped['best-movies'].length > 0 && (
                                        <div>
                                            <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-zinc-300">{t('home.bestRecsBestMovies')}</h3>
                                            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                                                {grouped['best-movies'].map((rec) => (
                                                    <button
                                                        type="button"
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group w-48 shrink-0 snap-start text-left"
                                                    >
                                                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
                                                            <div className="relative h-64 overflow-hidden bg-slate-200 dark:bg-zinc-700">
                                                                {rec.image && (
                                                                    <img src={rec.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                                                                )}
                                                                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-white shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                                                    <span className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white">{t('home.addToCollection')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-amber-700 dark:text-white">{rec.title}</h4>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {grouped['award-winning'].length > 0 && (
                                        <div>
                                            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-zinc-300">
                                                <FaStar className="text-amber-500" />
                                                {t('home.bestRecsAwardWinning')}
                                            </h3>
                                            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                                                {grouped['award-winning'].map((rec) => (
                                                    <button
                                                        type="button"
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group w-48 shrink-0 snap-start text-left"
                                                    >
                                                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
                                                            <div className="relative h-64 overflow-hidden bg-slate-200 dark:bg-zinc-700">
                                                                {rec.image && (
                                                                    <img src={rec.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                                                                )}
                                                                {rec.award && (
                                                                    <div className="absolute left-2 top-2 rounded-lg bg-amber-500 px-2 py-1 text-xs font-bold text-white shadow-lg">{rec.award}</div>
                                                                )}
                                                                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-white shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                                                    <span className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white">{t('home.addToCollection')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-amber-500 dark:text-white">{rec.title}</h4>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {grouped['top-series'].length > 0 && (
                                        <div>
                                            <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-zinc-300">{t('home.bestRecsTopSeries')}</h3>
                                            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                                                {grouped['top-series'].map((rec) => (
                                                    <button
                                                        type="button"
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group w-48 shrink-0 snap-start text-left"
                                                    >
                                                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
                                                            <div className="relative h-64 overflow-hidden bg-slate-200 dark:bg-zinc-700">
                                                                {rec.image && (
                                                                    <img src={rec.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                                                                )}
                                                                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-rose-500 px-2 py-1 text-white shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                                                    <span className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white">{t('home.addToCollection')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-rose-500 dark:text-white">{rec.title}</h4>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {grouped['top-books'].length > 0 && (
                                        <div>
                                            <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-zinc-300">{t('home.bestRecsTopBooks')}</h3>
                                            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                                                {grouped['top-books'].map((rec) => (
                                                    <button
                                                        type="button"
                                                        key={rec.id}
                                                        onClick={() => handleAddToCollection(rec)}
                                                        className="group w-48 shrink-0 snap-start text-left"
                                                    >
                                                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
                                                            <div className="relative h-64 overflow-hidden bg-slate-200 dark:bg-zinc-700">
                                                                {rec.image && (
                                                                    <img src={rec.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                                                                )}
                                                                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-purple-500 px-2 py-1 text-white shadow-lg">
                                                                    <FaStar size={12} /> <span className="text-sm font-bold">{rec.rating}</span>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                                                    <span className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white">{t('home.addToCollection')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-purple-500 dark:text-white">{rec.title}</h4>
                                                                {rec.author && <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{rec.author}</p>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {recommendations.length === 0 && (
                                        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                                            <FaStar className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-zinc-600" />
                                            <h3 className="text-xl font-bold text-slate-700 dark:text-zinc-300">{t('home.noRecsTitle')}</h3>
                                            <p className="mx-auto mt-2 max-w-md text-slate-500 dark:text-zinc-400">{t('home.noRecsBody')}</p>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={onOpenAdmin}
                                                    className="mt-6 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-amber-700"
                                                >
                                                    {t('home.adminManage')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            );
                        })()
                    )}
                </div>
            )}
        </section>
    );
}
