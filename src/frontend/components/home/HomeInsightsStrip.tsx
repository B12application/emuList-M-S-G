import { motion } from 'framer-motion';
import { FaStar, FaHistory, FaArrowRight, FaCompass, FaFilm } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';

type TFn = (key: string) => string;

interface HomeInsightsStripProps {
    t: TFn;
    totalCount?: number;
    stats?: { movieCount: number; seriesCount: number; gameCount: number; bookCount: number };
    spotlight: MediaItem | null;
    dustyItems: MediaItem[];
    onSelect: (item: MediaItem) => void;
    formatDate?: (timestamp: unknown) => string;
}

export default function HomeInsightsStrip({
    t,
    spotlight,
    dustyItems,
    onSelect,
}: HomeInsightsStripProps) {
    if (!spotlight && dustyItems.length === 0) return null;

    return (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* ── KART 1: Spotlight (Günün Öne Çıkanı) - 5 Kolon ── */}
            {spotlight && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`${dustyItems.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12'} relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/60 to-amber-50/20 p-5 shadow-xs backdrop-blur-xl dark:border-zinc-800/80 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-amber-950/10`}
                >
                    <div>
                        <div className="mb-3.5 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                                <FaCompass className="text-amber-500 text-[9px]" />
                                {t('home.spotlightTitle') || 'Günün Öne Çıkanı'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                                En Yüksek Puanlı
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => onSelect(spotlight)}
                            className="group flex w-full cursor-pointer items-start gap-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl"
                        >
                            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                {spotlight.image ? (
                                    <img
                                        src={spotlight.image}
                                        alt={spotlight.title}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                        <FaFilm className="text-xl" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400 transition-colors">
                                    {spotlight.title}
                                </h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                        <FaStar className="text-amber-500 text-[9px]" />
                                        {spotlight.rating}
                                    </span>
                                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500">
                                        {spotlight.type}
                                    </span>
                                </div>
                                {spotlight.description && (
                                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                        {spotlight.description}
                                    </p>
                                )}
                            </div>
                        </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">Kütüphanenden henüz izlenmedi</span>
                        <button
                            type="button"
                            onClick={() => onSelect(spotlight)}
                            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                            <span>{t('home.inspectNow') || 'Detayları Gör'}</span>
                            <FaArrowRight className="text-[9px]" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ── KART 2: Dusty Shelf (Tozlu Raflar / Zaman Kapsülü) - 7 Kolon ── */}
            {dustyItems.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className={`${spotlight ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/70 p-5 shadow-xs backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60`}
                >
                    <div>
                        <div className="mb-3.5 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <FaHistory className="text-amber-500 text-[9px]" />
                                {t('home.dustyShelf') || 'Tozlu Raflar'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                                Sırasını bekleyenler
                            </span>
                        </div>

                        {/* Yatay afiş dizilimi */}
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                            {dustyItems.slice(0, 6).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="group relative flex flex-col items-center gap-1.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl"
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-2xs transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md dark:border-zinc-800 dark:bg-zinc-800">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                                <FaFilm className="text-base" />
                                            </div>
                                        )}
                                        {item.rating && (
                                            <div className="absolute top-1 right-1 rounded-md bg-black/70 px-1 py-0.2 text-[8px] font-bold text-amber-400 backdrop-blur-xs">
                                                ★ {item.rating}
                                            </div>
                                        )}
                                    </div>
                                    <p className="w-full text-center text-[11px] font-medium text-slate-700 line-clamp-1 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {item.title}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                        <span>Listende uzun zamandır bekleyen içerikler</span>
                        <span className="font-bold text-slate-600 dark:text-zinc-400 tabular-nums">{dustyItems.length} içerik</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}