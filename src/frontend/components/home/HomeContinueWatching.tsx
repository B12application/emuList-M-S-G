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
        <section className="mt-8 sm:mt-10">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400 border border-amber-500/20">
                        <FaTv className="text-sm" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                            {t('myShows.continueWatching') || 'İzlemeye Devam Et'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {t('home.continueWatchingSubtitle') || 'Kaldığın yerden devam et'}
                        </p>
                    </div>
                </div>

                <Link
                    to="/my-shows"
                    className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                >
                    <span>{t('myShows.viewAll') || 'Tümünü Gör'}</span>
                    <FaArrowRight className="text-[10px] transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            {/* Streaming Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {shows.map((show, i) => {
                    const progress = getSeriesProgress(show);
                    const nextEp = getNextEpisode(show);

                    return (
                        <motion.div
                            key={show.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 dark:bg-zinc-900/90 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-lg dark:border-zinc-800/80"
                        >
                            <div className="flex gap-3.5">
                                {/* Poster */}
                                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-md dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80">
                                    <ImageWithFallback
                                        src={show.image}
                                        alt={show.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Bilgiler ve Gelişmiş Stepper Butonu */}
                                <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 line-clamp-1 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                            {show.title}
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                                            {progress.totalWatched} / {progress.totalEpisodes} Bölüm
                                        </p>
                                    </div>

                                    {/* Yenilenmiş Sezon / Bölüm Artırma Butonu */}
                                    {nextEp && (
                                        <div className="mt-2.5 flex items-center gap-1.5">
                                            {/* Hedef Bölüm Rozeti */}
                                            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-black text-[11px] tracking-tight border border-slate-200/60 dark:border-zinc-700/60">
                                                S{nextEp.season} E{nextEp.episode}
                                            </span>

                                            {/* Hızlı Artırma / Tamamlama Butonu */}
                                            <button
                                                type="button"
                                                onClick={() => onQuickMark(show)}
                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm shadow-amber-500/20 active:scale-90 transition-all"
                                                title={`Sezon ${nextEp.season} Bölüm ${nextEp.episode}'i izlendi olarak işaretle`}
                                            >
                                                <FaPlay className="text-[9px] text-stone-950" />
                                                <span>+1 İzle</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* İlerleme Çubuğu */}
                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5">
                                    <span>İlerleme Durumu</span>
                                    <span className="tabular-nums font-black text-amber-600 dark:text-amber-400">%{progress.percentage}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(progress.percentage, 6)}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 shadow-xs shadow-amber-500/50"
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