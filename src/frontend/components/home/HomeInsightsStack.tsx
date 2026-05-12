import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { FaHourglassHalf, FaHistory, FaArrowRight, FaMagic } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import QuoteWidget from '../QuoteWidget';

type TFn = (key: string) => string;

interface HomeInsightsStackProps {
    t: TFn;
    totalCount: number;
    stats: { movieCount: number; seriesCount: number; gameCount: number; bookCount: number };
    spotlight: MediaItem | null;
    dustyItems: MediaItem[];
    onSelect: (item: MediaItem) => void;
    formatDate: (timestamp: unknown) => string;
}

const CHART_COLORS = ['#0ea5e9', '#f43f5e', '#f59e0b', '#8b5cf6'];

export default function HomeInsightsStack({
    t,
    totalCount,
    stats,
    spotlight,
    dustyItems,
    onSelect,
    formatDate,
}: HomeInsightsStackProps) {
    const chartData = [
        { name: t('nav.movies'), value: stats.movieCount },
        { name: t('nav.series'), value: stats.seriesCount },
        { name: t('nav.games'), value: stats.gameCount },
        { name: t('nav.books'), value: stats.bookCount },
    ];

    const showOnboarding = totalCount < 8;

    return (
        <div className="space-y-8">
            {showOnboarding && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[1.75rem] border border-violet-200/80 bg-linear-to-br from-violet-600/10 via-white to-cyan-500/10 p-6 shadow-lg dark:border-violet-500/20 dark:from-violet-600/20 dark:via-zinc-950 dark:to-cyan-600/10"
                >
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
                    <div className="relative flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
                            <FaMagic />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{t('home.onboardingTitle')}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{t('home.onboardingBody')}</p>
                            <Link
                                to="/create"
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-zinc-900"
                            >
                                {t('home.onboardingCta')}
                                <FaArrowRight className="text-[10px]" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{t('home.trendsTitle')}</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">{t('home.trendsHint')}</p>
                <div className="mt-4 h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={78}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: '1px solid rgba(148,163,184,0.25)',
                                    background: 'rgba(15,23,42,0.92)',
                                    color: '#f8fafc',
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                                {chartData.map((_, i) => (
                                    <Cell key={chartData[i].name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {spotlight && (
                <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onSelect(spotlight)}
                    className="group relative w-full overflow-hidden rounded-[1.75rem] border border-amber-200/80 bg-linear-to-br from-amber-500/20 via-white to-orange-500/10 p-5 text-left shadow-lg transition hover:border-amber-400 dark:border-amber-500/30 dark:from-amber-600/25 dark:via-zinc-950 dark:to-orange-900/20"
                >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200">{t('home.spotlightTitle')}</p>
                    <p className="text-[11px] text-amber-900/80 dark:text-amber-100/70">{t('home.spotlightHint')}</p>
                    <div className="mt-4 flex gap-4">
                        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-black/10 shadow-md ring-1 ring-black/10">
                            {spotlight.image ? (
                                <img src={spotlight.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                            ) : null}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900 dark:text-white">{spotlight.title}</p>
                            <p className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-200">★ {spotlight.rating}</p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                                {t('home.inspectNow')} <FaArrowRight className="transition group-hover:translate-x-1" />
                            </span>
                        </div>
                    </div>
                </motion.button>
            )}

            <div>
                <div className="mb-3 flex items-center gap-2">
                    <FaHourglassHalf className="text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('home.dustyShelf')}</h3>
                </div>
                <div className="space-y-3">
                    {dustyItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
                            {t('home.noDusty')}
                        </div>
                    ) : (
                        dustyItems.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className="group w-full rounded-2xl border border-amber-200/60 bg-amber-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/20"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                        <FaHistory className="mr-1 inline" />
                                        {t('home.forgotten')}
                                    </span>
                                </div>
                                <p className="mt-1 truncate font-bold text-slate-900 dark:text-white">{item.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                    {t('home.addedOn')}: {formatDate(item.createdAt)}
                                </p>
                                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                                    {t('home.inspectNow')} <FaArrowRight className="text-[10px] transition group-hover:translate-x-1" />
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-1 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/50">
                <QuoteWidget />
            </div>
        </div>
    );
}
