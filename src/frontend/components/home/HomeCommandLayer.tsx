import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FaCheckCircle,
    FaClock,
    FaStar,
    FaPlay,
    FaCalendarWeek,
    FaChartLine,
    FaTv,
    FaFilm,
    FaGamepad,
    FaBook,
} from 'react-icons/fa';

type TFn = (key: string) => string;

export interface PulseStats {
    watched: number;
    queue: number;
    favorites: number;
    inProgress: number;
    weekAdded: number;
}

export interface MediaCountStats {
    movieCount: number;
    seriesCount: number;
    gameCount: number;
    bookCount: number;
    totalCount: number;
}

interface HomeCommandLayerProps {
    pulse: PulseStats;
    stats?: MediaCountStats;
    t: TFn;
}

export default function HomeCommandLayer({ pulse, stats, t }: HomeCommandLayerProps) {
    const categoryChips = stats ? [
        { label: t('nav.movies') || 'Film', count: stats.movieCount, icon: FaFilm, color: 'text-sky-500 dark:text-sky-400', to: '/movie' },
        { label: t('nav.series') || 'Dizi', count: stats.seriesCount, icon: FaTv, color: 'text-rose-500 dark:text-rose-400', to: '/series' },
        { label: t('nav.games') || 'Oyun', count: stats.gameCount, icon: FaGamepad, color: 'text-amber-500 dark:text-amber-400', to: '/game' },
        { label: t('nav.books') || 'Kitap', count: stats.bookCount, icon: FaBook, color: 'text-violet-500 dark:text-violet-400', to: '/book' },
    ] : [];

    const telemetryPills = [
        {
            id: 'watched',
            icon: FaCheckCircle,
            label: t('home.watchedLabel') || 'İzlendi',
            value: pulse.watched,
            color: 'text-emerald-500 dark:text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
        },
        {
            id: 'queue',
            icon: FaClock,
            label: t('home.queueLabel') || 'Sırada',
            value: pulse.queue,
            color: 'text-sky-500 dark:text-sky-400',
            bg: 'bg-sky-500/10 border-sky-500/20',
        },
        {
            id: 'inProgress',
            icon: FaPlay,
            label: t('home.inProgressLabel') || 'Devam Eden',
            value: pulse.inProgress,
            color: 'text-violet-500 dark:text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
        },
        {
            id: 'favorites',
            icon: FaStar,
            label: t('home.favoritesCountLabel') || 'Vitrin',
            value: pulse.favorites,
            color: 'text-amber-500 dark:text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
        },
        {
            id: 'weekAdded',
            icon: FaCalendarWeek,
            label: t('home.weekAddedLabel') || 'Bu Hafta',
            value: pulse.weekAdded,
            color: 'text-orange-500 dark:text-orange-400',
            bg: 'bg-orange-500/10 border-orange-500/20',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-5"
        >
            {/* Üst Bar: Kütüphane Dağılımı ve Hızlı Navigasyon */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-zinc-800/70">
                <div className="flex flex-wrap items-center gap-2">
                    {stats && (
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs dark:bg-zinc-800 dark:text-zinc-100">
                            <span className="tabular-nums">{stats.totalCount}</span>
                            <span className="text-[11px] font-medium text-slate-300 dark:text-zinc-400">{t('home.totalItems') || 'Kayıt'}</span>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                        {categoryChips.map((chip) => {
                            const Icon = chip.icon;
                            return (
                                <Link
                                    key={chip.label}
                                    to={chip.to}
                                    className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white active:scale-95 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300 dark:hover:border-zinc-700"
                                >
                                    <Icon className={`${chip.color} text-[11px]`} />
                                    <span>{chip.label}</span>
                                    <span className="ml-0.5 rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 tabular-nums">
                                        {chip.count}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Hızlı Bağlantılar */}
                <div className="flex items-center gap-2 ml-auto">
                    <Link
                        to="/stats"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                        <FaChartLine className="text-amber-500 text-xs" />
                        <span>{t('home.openStats') || 'İstatistikler'}</span>
                    </Link>
                    <Link
                        to="/my-shows"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                        <FaTv className="text-rose-500 text-xs" />
                        <span>{t('home.openMyShows') || 'Dizilerim'}</span>
                    </Link>
                </div>
            </div>

            {/* Alt Şerit: Kompakt Durum Telemetrisi (5 Hücre) */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {telemetryPills.map((p) => {
                    const Icon = p.icon;
                    return (
                        <div
                            key={p.id}
                            className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition hover:shadow-2xs ${p.bg}`}
                        >
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-2xs dark:bg-black/30 ${p.color}`}>
                                <Icon className="text-xs" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate">
                                    {p.label}
                                </p>
                                <p className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white leading-tight">
                                    {p.value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}