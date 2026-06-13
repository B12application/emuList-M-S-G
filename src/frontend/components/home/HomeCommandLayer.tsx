import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
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

// Yeni nesil yay (spring) animasyonları ve Typescript çözümü
const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 120, damping: 20 }
    },
};

export default function HomeCommandLayer({ pulse, t }: HomeCommandLayerProps) {
    // HATA ÇÖZÜMÜ: Çeviriden bağımsız, sabit bir 'id' eklendi.
    // TASARIM: Her karta özel renk, gradient ve glow efektleri eklendi.
    const metrics = [
        {
            id: 'watched', // Sabit Key
            icon: FaCheckCircle,
            label: t('home.watchedLabel'),
            value: pulse.watched,
            color: 'text-emerald-500 dark:text-emerald-400',
            bg: 'from-emerald-500/10 to-transparent',
            border: 'border-emerald-500/20',
            glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
            span: 'col-span-2 lg:col-span-2', // Bento Grid: Bu kart daha geniş
        },
        {
            id: 'queue',
            icon: FaClock,
            label: t('home.queueLabel'),
            value: pulse.queue,
            color: 'text-sky-500 dark:text-sky-400',
            bg: 'from-sky-500/10 to-transparent',
            border: 'border-sky-500/20',
            glow: 'group-hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]',
            span: 'col-span-1 lg:col-span-1',
        },
        {
            id: 'favorites',
            icon: FaHeart,
            label: t('home.favoritesCountLabel'),
            value: pulse.favorites,
            color: 'text-rose-500 dark:text-rose-400',
            bg: 'from-rose-500/10 to-transparent',
            border: 'border-rose-500/20',
            glow: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
            span: 'col-span-1 lg:col-span-1',
        },
        {
            id: 'inProgress',
            icon: FaPlay,
            label: t('home.inProgressLabel'),
            value: pulse.inProgress,
            color: 'text-violet-500 dark:text-violet-400',
            bg: 'from-violet-500/10 to-transparent',
            border: 'border-violet-500/20',
            glow: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
            span: 'col-span-1 lg:col-span-1',
        },
        {
            id: 'weekAdded',
            icon: FaCalendarWeek,
            label: t('home.weekAddedLabel'),
            value: pulse.weekAdded,
            color: 'text-amber-500 dark:text-amber-400',
            bg: 'from-amber-500/10 to-transparent',
            border: 'border-amber-500/20',
            glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
            span: 'col-span-1 lg:col-span-1',
        },
    ];

    const dock = [
        { to: '/stats', label: t('home.openStats'), icon: FaChartLine, primary: true },
        { to: '/my-shows', label: t('home.openMyShows'), icon: FaTv, primary: false },
    ];

    return (
        <div className="mb-10 flex flex-col gap-6">

            {/* ── ÜST KISIM (Header & Dock birleşti, Mobilde ve Desktop'ta tek kod) ── */}
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/40 bg-white/30 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/30 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {t('home.pulseTitle')}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-400">
                        {t('home.quickDockTitle')}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {dock.map(({ to, label, icon: Icon, primary }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`group inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 sm:flex-none ${primary
                                ? 'bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Icon className={`text-[14px] transition-transform group-hover:scale-110 ${primary ? 'text-amber-400 dark:text-amber-600' : 'text-slate-400 dark:text-zinc-500'}`} />
                            {label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── BENTO METRICS GRID (Hata Giderildi ve Yenilendi) ── */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6"
            >
                {metrics.map(({ id, icon: Icon, label, value, bg, color, border, glow, span }) => (
                    <motion.div
                        // HATA ÇÖZÜMÜ: key={id} sayesinde dil değişse bile bileşenler yeniden mount olmaz
                        key={id}
                        variants={itemVariants}
                        layout // Layout geçişlerini yumuşatır
                        className={`group relative overflow-hidden rounded-[2rem] border bg-gradient-to-br bg-white p-5 transition-all duration-300 hover:-translate-y-1 dark:bg-zinc-900 md:p-6 ${span} ${bg} ${border} ${glow}`}
                    >
                        {/* İç Tasarım - Modern yerleşim */}
                        <div className="flex h-full flex-col justify-between gap-4">
                            <div className="flex items-start justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/60 shadow-sm backdrop-blur-md dark:bg-black/20 ${color}`}>
                                    <Icon className="text-lg" />
                                </div>
                                <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                                    {label}
                                </div>
                            </div>

                            <div>
                                <p className="text-4xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white md:text-5xl">
                                    {value}
                                </p>
                            </div>
                        </div>

                        {/* Hover arka plan parlaması */}
                        <div className={`absolute -bottom-10 -right-10 h-32 w-32 rounded-full ${bg} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}