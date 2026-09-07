import { motion } from 'framer-motion';
import { FaStar, FaHistory, FaArrowRight, FaCompass, FaFilm, FaPlay, FaArchive } from 'react-icons/fa';
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

    const getTypeLabel = (type: string) => {
        if (type === 'movie') return t('media.movie') || 'Film';
        if (type === 'series') return t('media.series') || 'Dizi';
        if (type === 'book') return t('media.book') || 'Kitap';
        if (type === 'game') return t('media.game') || 'Oyun';
        return type.toUpperCase();
    };

    return (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* ── KART 1: Spotlight (Sırada Ne Var? / En Yüksek Puanlı) - 6 Kolon ── */}
            {spotlight && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`${dustyItems.length > 0 ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'} relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/70 to-amber-500/5 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-amber-950/15`}
                >
                    {/* Üst Kategori ve Puan Rozeti */}
                    <div>
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
                                <FaCompass className="text-amber-500 text-[10px]" />
                                {t('home.spotlightTitle') || 'Sırada Ne Var?'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                <FaStar className="text-[9px] text-amber-500" />
                                {t('home.highestRated') || 'En Yüksek Puanlı'}
                            </span>
                        </div>

                        {/* Büyük Afiş ve Detay Grid'i */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                            {/* Büyük Sinematik Afiş */}
                            <button
                                type="button"
                                onClick={() => onSelect(spotlight)}
                                className="group/poster relative w-36 sm:w-44 aspect-[2/3] shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-md dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                                {spotlight.image ? (
                                    <img
                                        src={spotlight.image}
                                        alt={spotlight.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                        <FaFilm className="text-3xl" />
                                    </div>
                                )}

                                {/* Afiş Üzeri Canlı Puan */}
                                {spotlight.rating && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-black/80 px-2 py-0.5 text-xs font-black text-amber-400 backdrop-blur-md shadow-sm border border-white/10">
                                        <FaStar className="text-[10px]" />
                                        <span>{spotlight.rating}</span>
                                    </div>
                                )}
                            </button>

                            {/* İçerik Bilgileri ve Eylemler */}
                            <div className="min-w-0 flex-1 flex flex-col justify-between h-full text-center sm:text-left">
                                <div>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-stone-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            {getTypeLabel(spotlight.type)}
                                        </span>
                                        {(spotlight.releaseDate || (spotlight as any).year) && (
                                            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 tabular-nums">
                                                {spotlight.releaseDate ? spotlight.releaseDate.split('-')[0] : (spotlight as any).year}
                                            </span>
                                        )}
                                    </div>

                                    <h3
                                        onClick={() => onSelect(spotlight)}
                                        className="text-lg sm:text-xl font-black text-slate-900 dark:text-white line-clamp-2 leading-snug hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                                    >
                                        {spotlight.title}
                                    </h3>

                                    {spotlight.description && (
                                        <p className="mt-2 line-clamp-3 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                            {spotlight.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 flex items-center justify-center sm:justify-start gap-3 border-t border-slate-100 dark:border-zinc-800/80">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(spotlight)}
                                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 text-xs font-black shadow-md shadow-amber-500/20 transition-all active:scale-95"
                                    >
                                        <FaPlay className="text-[10px]" />
                                        <span>{t('home.inspectNow') || 'Şimdi İncele'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── KART 2: Dusty Shelf (Tozlu Raflar / Zaman Kapsülü) - 6 / 7 Kolon ── */}
            {dustyItems.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className={`${spotlight ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'} flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-xs backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 sm:p-6`}
                >
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/15 dark:text-purple-400">
                                    <FaArchive className="text-sm" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">
                                        {t('home.dustyShelf') || 'Tozlu Raflar'}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                        {t('home.waitingInQueue') || 'Sırasını bekleyen içerikler'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Yatay Afiş Dizilimi (Genişletilmiş ve Şıklaştırılmış) */}
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                            {dustyItems.slice(0, 6).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="group relative flex flex-col items-center gap-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-2xl"
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md dark:border-zinc-800 dark:bg-zinc-800">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                                <FaFilm className="text-lg" />
                                            </div>
                                        )}
                                        {item.rating && (
                                            <div className="absolute top-1.5 right-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-black text-amber-400 backdrop-blur-xs">
                                                ★ {item.rating}
                                            </div>
                                        )}
                                    </div>
                                    <p className="w-full text-center text-xs font-bold text-slate-700 line-clamp-1 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {item.title}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
                        <span>{t('home.waitingInQueue') || 'Listende bekleyen içerikler'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-zinc-300 tabular-nums bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                            {dustyItems.length}
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}