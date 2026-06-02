import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FaCheckCircle,
    FaClock,
    FaHeart,
    FaPlay,
    FaCalendarWeek,
    FaChartLine,
    FaTv,
} from 'react-icons/fa';

type TFn = (key: string) => string;

export interface PulseStats {
    watched: number;
    queue: number;
    favorites: number;
    inProgress: number;
    weekAdded: number;
}

interface HomeCommandLayerProps {
    pulse: PulseStats;
    t: TFn;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function HomeCommandLayer({ pulse, t }: HomeCommandLayerProps) {
    const metrics = [
        { icon: FaCheckCircle, label: t('home.watchedLabel'), value: pulse.watched, tone: 'text-emerald-500' },
        { icon: FaClock, label: t('home.queueLabel'), value: pulse.queue, tone: 'text-sky-500' },
        { icon: FaHeart, label: t('home.favoritesCountLabel'), value: pulse.favorites, tone: 'text-rose-500' },
        { icon: FaPlay, label: t('home.inProgressLabel'), value: pulse.inProgress, tone: 'text-violet-500' },
        { icon: FaCalendarWeek, label: t('home.weekAddedLabel'), value: pulse.weekAdded, tone: 'text-amber-500' },
    ];

    const dock = [
        { to: '/stats', label: t('home.openStats'), icon: FaChartLine },
        { to: '/my-shows', label: t('home.openMyShows'), icon: FaTv },
    ];

    return (
        <div className="mb-10 space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {t('home.pulseTitle')}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                        {t('home.quickDockTitle')}
                    </p>
                </div>

                {/* Dock - desktop */}
                <div className="hidden sm:flex gap-2">
                    {dock.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        >
                            <Icon className="text-[10px]" />
                            {label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
            >
                {metrics.map(({ icon: Icon, label, value, tone }) => (
                    <motion.div
                        key={label}
                        variants={item}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500/20"
                    >
                        {/* Subtle glow on hover */}
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-400/10 opacity-0 transition group-hover:opacity-100" />
                        
                        <Icon className={`mb-2.5 text-lg ${tone}`} />
                        <p className="text-[1.75rem] font-black tabular-nums leading-none text-slate-900 dark:text-white">
                            {value}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                            {label}
                        </p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Dock - mobile */}
            <div className="flex gap-2 sm:hidden">
                {dock.map(({ to, label, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-95 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                        <Icon className="text-[10px]" />
                        {label}
                    </Link>
                ))}
            </div>
        </div>
    );
}