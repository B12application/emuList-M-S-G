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

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
    }),
};

export default function HomeContinueWatching({ shows, t, getNextEpisode, onQuickMark }: HomeContinueWatchingProps) {
    if (shows.length === 0) return null;

    return (
        <section>
            {/* Header */}
            <div className="mb-5 flex items-end justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {t('myShows.continueWatching')}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
                        {t('home.spotlightHint')}
                    </p>
                </div>
                <Link
                    to="/my-shows"
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                >
                    {t('myShows.viewAll')}
                    <FaArrowRight className="text-[10px] transition group-hover:translate-x-0.5" />
                </Link>
            </div>

            {/* Cards Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
                {shows.map((show, i) => {
                    const progress = getSeriesProgress(show);
                    const nextEp = getNextEpisode(show);

                    return (
                        <motion.div
                            key={show.id}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            className="group relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                        >
                            {/* Poster */}
                            <div className="relative h-[110px] w-[78px] shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-black/5">
                                <ImageWithFallback
                                    src={show.image}
                                    alt={show.title}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                                {/* Progress badge */}
                                <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                                    {progress.percentage}%
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                        {show.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                                        {progress.totalWatched}/{progress.totalEpisodes} {t('myShows.episodes')}
                                    </p>
                                </div>

                                {/* Progress bar - thin modern */}
                                <div className="mt-2">
                                    <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                                            style={{ width: `${Math.max(progress.percentage, 4)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Next episode button */}
                                {nextEp && (
                                    <button
                                        type="button"
                                        onClick={() => onQuickMark(show)}
                                        className="mt-2.5 inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-amber-600 hover:shadow-md active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-amber-500 dark:hover:text-white"
                                    >
                                        <FaPlay className="text-[9px]" />
                                        S{nextEp.season} E{nextEp.episode}
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