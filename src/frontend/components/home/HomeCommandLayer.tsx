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
        { icon: FaCheckCircle, label: t('home.watchedLabel'), value: pulse.watched, tone: 'text-emerald-600 dark:text-emerald-400' },
        { icon: FaClock, label: t('home.queueLabel'), value: pulse.queue, tone: 'text-sky-600 dark:text-sky-400' },
        { icon: FaHeart, label: t('home.favoritesCountLabel'), value: pulse.favorites, tone: 'text-rose-600 dark:text-rose-400' },
        { icon: FaPlay, label: t('home.inProgressLabel'), value: pulse.inProgress, tone: 'text-violet-600 dark:text-violet-300' },
        { icon: FaCalendarWeek, label: t('home.weekAddedLabel'), value: pulse.weekAdded, tone: 'text-amber-600 dark:text-amber-400' },
    ];

    const dock = [
        { to: '/stats', label: t('home.openStats'), icon: FaChartLine },
        { to: '/my-shows', label: t('home.openMyShows'), icon: FaTv },
    ];

    return (
        <div className="mb-10 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t('home.pulseTitle')}</h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">{t('home.quickDockTitle')}</p>
                </div>
            </div>

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
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400/40 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-amber-500/30"
                    >
                        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-linear-to-br from-amber-400/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                        <Icon className={`mb-2 text-lg ${tone}`} />
                        <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{label}</p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex flex-wrap gap-2"
            >
                {dock.map(({ to, label, icon: Icon }) => (
                    <motion.div key={to} variants={item}>
                        <Link
                            to={to}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-slate-800 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        >
                            <Icon />
                            {label}
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
