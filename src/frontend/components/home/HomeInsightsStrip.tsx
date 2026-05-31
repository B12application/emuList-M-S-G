import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaMagic, FaStar, FaHistory, FaChartBar } from 'react-icons/fa';
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
    { key: 'movieCount' as const, labelKey: 'nav.movies' as const, icon: '🎬', color: 'bg-sky-500' },
    { key: 'seriesCount' as const, labelKey: 'nav.series' as const, icon: '📺', color: 'bg-rose-500' },
    { key: 'gameCount' as const, labelKey: 'nav.games' as const, icon: '🎮', color: 'bg-amber-500' },
    { key: 'bookCount' as const, labelKey: 'nav.books' as const, icon: '📚', color: 'bg-violet-500' },
];

export default function HomeInsightsStrip({
    t,
    totalCount,
    stats,
    spotlight,
    dustyItems,
    onSelect,
    formatDate,
}: HomeInsightsStripProps) {
    const showOnboarding = totalCount < 8;
    const maxVal = Math.max(...Object.values(stats), 1);

    return (
        <div className="mt-10 space-y-4">
            {/* Başlık */}
            <div className="flex items-center gap-2">
                <FaChartBar className="text-slate-400 text-sm" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {t('home.trendsTitle') || 'İçgörüler'}
                </h2>
            </div>

            {/* Yatay strip */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* ── Kart 1: İstatistikler ── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4">
                        {t('home.trendsTitle')}
                    </p>
                    <div className="space-y-3">
                        {STATS_CONFIG.map((item) => {
                            const value = stats[item.key];
                            const percentage = (value / maxVal) * 100;
                            return (
                                <div key={item.key} className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-5 text-center text-xs shrink-0">{item.icon}</span>
                                    <span className="w-12 shrink-0 text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                        {t(item.labelKey)}
                                    </span>
                                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden min-w-0">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${item.color}`}
                                        />
                                    </div>
                                    <span className="w-6 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-700 dark:text-zinc-300">
                                        {value}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Kart 2: Spotlight + Dusty ── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                    {spotlight ? (
                        <>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                                {t('home.spotlightTitle')}
                            </p>
                            <button
                                type="button"
                                onClick={() => onSelect(spotlight)}
                                className="group w-full text-left"
                            >
                                <div className="flex gap-3">
                                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-zinc-800">
                                        {spotlight.image ? (
                                            <img src={spotlight.image} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <FaStar className="text-slate-300 dark:text-zinc-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                                            {spotlight.title}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                                            ★ {spotlight.rating} · {spotlight.type}
                                        </p>
                                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 dark:text-zinc-400 dark:group-hover:text-white">
                                            {t('home.inspectNow')} <FaArrowRight className="text-[9px]" />
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[80px]">
                            <p className="text-xs text-slate-400 dark:text-zinc-500">{t('home.noSpotlight') || 'Henüz spotlight yok'}</p>
                        </div>
                    )}
                </div>

                {/* ── Kart 3: Dusty Shelf ── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            <FaHistory className="inline mr-1 text-amber-500 text-[10px]" />
                            {t('home.dustyShelf')}
                        </p>
                        <span className="text-[10px] text-slate-400">{dustyItems.length}</span>
                    </div>

                    {dustyItems.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">
                            {t('home.noDusty')}
                        </p>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {dustyItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="group flex shrink-0 flex-col items-center gap-1 w-[64px]"
                                >
                                    <div className="h-[64px] w-[64px] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5 transition-all group-hover:ring-2 group-hover:ring-amber-400 dark:bg-zinc-800 dark:ring-white/5">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                                <FaHistory className="text-base" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="w-full text-[10px] font-medium text-slate-600 text-center line-clamp-1 dark:text-zinc-400">
                                        {item.title}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Quote Widget ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <QuoteWidget />
            </div>
        </div>
    );
}