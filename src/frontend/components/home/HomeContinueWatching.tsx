import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaArrowRight, FaTv, FaCheck } from 'react-icons/fa';
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

export default function HomeContinueWatching({
    shows,
    t,
    getNextEpisode,
    onQuickMark,
}: HomeContinueWatchingProps) {
    if (shows.length === 0) return null;

    return (
        <section className="mt-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400">
                        <FaTv className="text-xs" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            {t('myShows.continueWatching') || 'İzlemeye Devam Et'}
                        </h2>
                    </div>
                </div>

                <Link
                    to="/my-shows"
                    className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                    <span>{t('myShows.viewAll') || 'Tümünü Gör'}</span>
                    <FaArrowRight className="text-[9px] transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>

            {/* Streaming Cards Grid */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {shows.map((show, i) => {
                    const progress = getSeriesProgress(show);
                    const nextEp = getNextEpisode(show);

                    return (
                        <motion.div
                            key={show.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:bg-zinc-900 p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-zinc-800/80 dark:hover:border-zinc-700"
                        >
                            <div className="flex gap-3">
                                {/* Poster */}
                                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-xs dark:bg-zinc-800">
                                    <ImageWithFallback
                                        src={show.image}
                                        alt={show.title}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Bilgiler */}
                                <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                            {show.title}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                                            {progress.totalWatched} / {progress.totalEpisodes} bölüm
                                        </p>
                                    </div>

                                    {/* Sonraki Bölüm Butonu */}
                                    {nextEp && (
                                        <button
                                            type="button"
                                            onClick={() => onQuickMark(show)}
                                            className="group/btn inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs transition hover:bg-amber-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-amber-500 dark:hover:text-zinc-950 cursor-pointer"
                                            title="Bölümü izlendi olarak işaretle"
                                        >
                                            <FaCheck className="text-[9px] text-amber-400 group-hover/btn:text-white dark:group-hover/btn:text-zinc-950 transition-colors" />
                                            <span>S{nextEp.season} · B{nextEp.episode}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* İlerleme Çubuğu */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mb-1">
                                    <span>İlerleme</span>
                                    <span className="tabular-nums font-bold text-slate-600 dark:text-zinc-300">%{progress.percentage}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                                        style={{ width: `${Math.max(progress.percentage, 5)}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}