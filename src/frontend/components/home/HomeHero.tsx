import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import {
    FaPlus,
    FaArchive,
    FaRandom,
    FaTasks,
    FaBolt,
    FaCloud,
    FaLayerGroup,
    FaHeart,
} from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import ImageWithFallback from '../ui/ImageWithFallback';

type TFn = (key: string) => string;

interface HomeHeroProps {
    displayName: string;
    avatarUrl: string;
    onAvatarClick: () => void;
    onRandom: () => void;
    t: TFn;
    previewItems: MediaItem[];
}

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.05 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
    }),
};

export default function HomeHero({
    displayName,
    avatarUrl,
    onAvatarClick,
    onRandom,
    t,
    previewItems,
}: HomeHeroProps) {
    const chips = [
        { icon: FaBolt, label: t('home.heroFeatureSmart') },
        { icon: FaCloud, label: t('home.heroFeatureSync') },
        { icon: FaLayerGroup, label: t('home.heroFeatureDepth') },
    ];

    return (
        <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60 dark:shadow-[0_50px_140px_-50px_rgba(0,0,0,0.85)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl dark:bg-violet-600/25" />
                <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-500/20" />
                <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15" />
                <div
                    className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)`,
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            <div className="relative z-10 grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
                <div>
                    <motion.div
                        custom={0}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        {t('home.heroEyebrow')}
                    </motion.div>

                    <motion.h1
                        custom={1}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="text-balance text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
                    >
                        {t('home.welcome')},{' '}
                        <span className="bg-linear-to-r from-amber-600 via-orange-500 to-rose-600 bg-clip-text text-transparent">
                            {displayName}
                        </span>
                    </motion.h1>

                    <motion.p
                        custom={2}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-slate-600 dark:text-zinc-300"
                    >
                        {t('home.heroTagline')}
                    </motion.p>

                    <motion.div
                        custom={3}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mt-6 flex flex-wrap gap-2"
                    >
                        {chips.map(({ icon: Icon, label }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
                            >
                                <Icon className="text-amber-600 dark:text-amber-400" />
                                {label}
                            </span>
                        ))}
                    </motion.div>

                    <motion.div
                        custom={4}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mt-8 flex flex-wrap gap-3"
                    >
                        <Link
                            to="/create"
                            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-amber-600 to-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-600/40"
                        >
                            <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100" />
                            <FaPlus className="relative transition group-hover:rotate-90" />
                            <span className="relative">{t('home.addNew')}</span>
                        </Link>
                        <Link
                            to="/all"
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/80 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-500"
                        >
                            <FaArchive />
                            {t('home.viewCollection')}
                        </Link>
                        <button
                            type="button"
                            onClick={onRandom}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-900/10 bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 dark:border-white/10 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        >
                            <FaRandom className="transition duration-500 group-hover:rotate-180" />
                            {t('home.randomButton')}
                        </button>
                        <Link
                            to="/planner?todo=true"
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3.5 text-sm font-bold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-500/20 dark:text-emerald-200"
                        >
                            <FaTasks />
                            {t('home.myTasks')}
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    custom={5}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="relative flex flex-col items-center gap-6"
                >
                    <button
                        type="button"
                        onClick={onAvatarClick}
                        className="group relative"
                    >
                        <div className="absolute -inset-6 rounded-full bg-linear-to-tr from-amber-400/40 via-violet-400/30 to-cyan-400/40 opacity-70 blur-2xl transition group-hover:opacity-100" />
                        <div className="relative">
                            <img
                                src={avatarUrl}
                                alt=""
                                className="h-40 w-40 rounded-[2rem] object-cover shadow-2xl ring-4 ring-white/80 transition duration-500 group-hover:scale-[1.03] group-hover:ring-amber-400/60 dark:ring-zinc-800/80 dark:group-hover:ring-amber-500/40 sm:h-44 sm:w-44"
                            />
                            <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-amber-600 text-white shadow-lg ring-4 ring-white dark:ring-zinc-950">
                                <FaHeart className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                            {t('home.memoryCenter')}
                        </p>
                    </button>

                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 py-3 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/50">
                        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-zinc-500">
                            {t('home.liveRibbon')}
                        </p>
                        {previewItems.length > 0 ? (
                            <Marquee speed={32} gradient gradientColor="rgba(255,255,255,0.9)" gradientWidth={40}>
                                {previewItems.map((item) => (
                                    <span
                                        key={item.id}
                                        className="mx-3 inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200"
                                    >
                                        <span className="flex h-6 w-6 overflow-hidden rounded-md">
                                            <ImageWithFallback
                                                src={item.image}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </span>
                                        <span className="max-w-[140px] truncate">{item.title}</span>
                                    </span>
                                ))}
                            </Marquee>
                        ) : (
                            <p className="px-4 text-sm text-slate-500 dark:text-zinc-400">{t('home.noRecent')}</p>
                        )}
                    </div>

                    <div className="hidden w-full max-w-sm rounded-3xl border border-dashed border-slate-300/80 p-4 text-center text-xs text-slate-500 dark:border-zinc-700 dark:text-zinc-500 sm:block">
                        {t('home.heroDescription')}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
