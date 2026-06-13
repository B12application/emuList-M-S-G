import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaStar, FaHistory, FaChartBar } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import QuoteWidget from '../QuoteWidget';

type TFn = (key: string) => string;

interface HomeInsightsStripProps {
    t: TFn;
    totalCount: number;
    stats: { movieCount: number; seriesCount: number; gameCount: number; bookCount: number };
    spotlight: MediaItem | null;
    dustyItems: MediaItem[];
    onSelect: (item: MediaItem) => void;
    formatDate: (timestamp: unknown) => string;
}

const STATS_CONFIG = [
    { key: 'movieCount' as const, labelKey: 'nav.movies' as const, icon: '🎬', color: 'bg-sky-500 dark:bg-sky-400' },
    { key: 'seriesCount' as const, labelKey: 'nav.series' as const, icon: '📺', color: 'bg-rose-500 dark:bg-rose-400' },
    { key: 'gameCount' as const, labelKey: 'nav.games' as const, icon: '🎮', color: 'bg-amber-500 dark:bg-amber-400' },
    { key: 'bookCount' as const, labelKey: 'nav.books' as const, icon: '📚', color: 'bg-violet-500 dark:bg-violet-400' },
];

export default function HomeInsightsStrip({
    t,
    totalCount: _totalCount,
    stats,
    spotlight,
    dustyItems,
    onSelect,
    formatDate: _formatDate,
}: HomeInsightsStripProps) {
    const maxVal = Math.max(...Object.values(stats), 1);

    return (
        <div className="mt-8 space-y-4">
            {/* ── Üst Başlık ── */}
            <div className="flex items-center gap-2 px-1">
                <FaChartBar className="text-slate-400 dark:text-zinc-500 text-xs" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {t('home.trendsTitle') || 'İçgörüler'}
                </h2>
            </div>

            {/* ── 3 Sütunlu Kompakt Grid Düzeni ── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                {/* ── KART 1: İstatistik Dağılımı ── */}
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3.5">
                        {t('home.trendsTitle')}
                    </p>
                    <div className="space-y-2.5">
                        {STATS_CONFIG.map((item) => {
                            const value = stats[item.key];
                            const percentage = (value / maxVal) * 100;
                            return (
                                <div key={item.key} className="flex items-center gap-2.5">
                                    <span className="w-4 text-center text-xs shrink-0">{item.icon}</span>
                                    <span className="w-14 shrink-0 text-xs font-medium text-slate-600 dark:text-zinc-400 truncate">
                                        {t(item.labelKey)}
                                    </span>
                                    <div className="flex-1 h-1 rounded-full bg-slate-200/60 dark:bg-zinc-800 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${item.color}`}
                                        />
                                    </div>
                                    <span className="w-5 shrink-0 text-right text-xs font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                        {value}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── KART 2: Spotlight (Öne Çıkan) ── */}
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3.5">
                            {t('home.spotlightTitle')}
                        </p>
                        {spotlight ? (
                            <button
                                type="button"
                                onClick={() => onSelect(spotlight)}
                                className="group flex items-start gap-3 w-full text-left"
                            >
                                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    {spotlight.image ? (
                                        <img src={spotlight.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <FaStar className="text-slate-300 dark:text-zinc-600 text-xs" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                                        {spotlight.title}
                                    </h3>
                                    <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                        ★ {spotlight.rating} · {spotlight.type}
                                    </p>
                                </div>
                            </button>
                        ) : (
                            <div className="flex h-14 items-center justify-center">
                                <p className="text-xs text-slate-400 dark:text-zinc-500">{t('home.noSpotlight')}</p>
                            </div>
                        )}
                    </div>

                    {spotlight && (
                        <button
                            type="button"
                            onClick={() => onSelect(spotlight)}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 self-start"
                        >
                            {t('home.inspectNow')} <FaArrowRight className="text-[8px]" />
                        </button>
                    )}
                </div>

                {/* ── KART 3: Dusty Shelf (Tozlu Raflar) ── */}
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
                    <div className="flex items-center justify-between mb-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            <FaHistory className="inline mr-1 text-amber-500 text-[9px]" />
                            {t('home.dustyShelf')}
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/60 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {dustyItems.length}
                        </span>
                    </div>

                    {dustyItems.length === 0 ? (
                        <div className="flex h-14 items-center justify-center">
                            <p className="text-xs text-slate-400 dark:text-zinc-500">{t('home.noDusty')}</p>
                        </div>
                    ) : (
                        <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {dustyItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="group flex shrink-0 flex-col items-center gap-1 w-[52px]"
                                >
                                    <div className="h-[52px] w-[52px] overflow-hidden rounded-xl bg-white border border-slate-200 transition-all group-hover:border-amber-500 dark:bg-zinc-800 dark:border-zinc-700 dark:group-hover:border-amber-400 shadow-sm">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                                <FaHistory className="text-xs" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="w-full text-[10px] font-medium text-slate-500 text-center truncate dark:text-zinc-400">
                                        {item.title}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BEYAZ KART KALDIRILDI: Söz bileşeni artık doğrudan render ediliyor ── */}
            <QuoteWidget />
        </div>
    );
}