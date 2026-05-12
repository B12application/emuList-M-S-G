import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaArrowRight } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import { getSeriesProgress } from '../../../backend/services/episodeTrackingService';
import ImageWithFallback from '../ui/ImageWithFallback';

type TFn = (key: string) => string;

interface HomeContinueWatchingProps {
    shows: MediaItem[];
    t: TFn;
    getNextEpisode: (show: MediaItem) => { season: number; episode: number } | null;
    onQuickMark: (show: MediaItem) => void;
}

export default function HomeContinueWatching({ shows, t, getNextEpisode, onQuickMark }: HomeContinueWatchingProps) {
    if (shows.length === 0) return null;

    return (
        <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('myShows.continueWatching')}</h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">{t('home.spotlightHint')}</p>
                </div>
                <Link
                    to="/my-shows"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
                >
                    {t('myShows.viewAll')}
                    <FaArrowRight className="text-xs" />
                </Link>
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {shows.map((show, i) => {
                    const progress = getSeriesProgress(show);
                    const nextEp = getNextEpisode(show);
                    return (
                        <motion.div
                            key={show.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="snap-start"
                            style={{ minWidth: 'min(100%, 320px)' }}
                        >
                            <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-md transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/80">
                                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/0 via-transparent to-cyan-500/10 opacity-0 transition group-hover:opacity-100" />
                                <div className="relative flex flex-1 gap-4 p-4">
                                    <div className="h-[100px] w-[72px] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 shadow-md">
                                        <ImageWithFallback src={show.image} alt={show.title} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                                        <div>
                                            <h3 className="truncate font-bold text-slate-900 transition group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                                                {show.title}
                                            </h3>
                                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
                                                {progress.totalWatched}/{progress.totalEpisodes} {t('myShows.episodes')}
                                            </p>
                                        </div>
                                        <div className="mt-3">
                                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                                                <div
                                                    className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                            <p className="mt-1 text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{progress.percentage}%</p>
                                        </div>
                                    </div>
                                </div>
                                {nextEp && (
                                    <button
                                        type="button"
                                        onClick={() => onQuickMark(show)}
                                        className="relative flex w-full items-center justify-center gap-2 bg-linear-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white transition hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99]"
                                    >
                                        <FaPlay className="text-[10px]" />
                                        S{nextEp.season}E{nextEp.episode} — {t('myShows.continueWatchingHome')}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
