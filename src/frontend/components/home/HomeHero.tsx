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
    hidden: { opacity: 0, y: 20 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.04 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
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
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-[0_30px_100px_-30px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60 dark:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]">
            {/* Ambient Lighting Backdrops */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-600/20" />
                <div className="absolute -right-10 top-1/4 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl dark:bg-amber-500/15" />
                <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/10" />
                <div
                    className="absolute inset-0 opacity-[0.3] dark:opacity-[0.15]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
                {/* Left Area: Texts and Actions */}
                <div className="flex flex-col items-start">
                    {/* Eyebrow Label */}
                    <motion.div
                        custom={0}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] text-violet-800 dark:border-violet-400/30 dark:text-violet-200 max-w-full overflow-hidden"
                    >
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        <span className="truncate">{t('home.heroEyebrow')}</span>
                    </motion.div>

                    {/* Main Greeting */}
                    <motion.h1
                        custom={1}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="text-balance text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight"
                    >
                        {t('home.welcome')},{' '}
                        <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-rose-600 bg-clip-text text-transparent block sm:inline">
                            {displayName}
                        </span>
                    </motion.h1>

                    {/* Tagline */}
                    <motion.p
                        custom={2}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mt-2 max-w-xl text-pretty text-xs sm:text-base leading-relaxed text-slate-600 dark:text-zinc-300"
                    >
                        {t('home.heroTagline')}
                    </motion.p>

                    {/* Feature Chips */}
                    <motion.div
                        custom={3}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mt-4 flex flex-wrap gap-1.5"
                    >
                        {chips.map(({ icon: Icon, label }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
                            >
                                <Icon className="text-amber-600 dark:text-amber-500 text-[9px] shrink-0" />
                                {label}
                            </span>
                        ))}
                    </motion.div>

                    {/* Call to Actions - Perfectly optimized for mobile grids */}
                    <motion.div
                        custom={4}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="mt-5 w-full grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
                    >
                        <Link
                                to="/create"
                                className="group relative w-full flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-bold text-white shadow-md shadow-amber-600/20 transition hover:-translate-y-0.5"
                            >
                            <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100" />
                            <FaPlus className="shrink-0 transition group-hover:rotate-90 text-[10px]" />
                            <span className="truncate">{t('home.addNew')}</span>
                        </Link>
                        <Link
                            to="/all"
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-bold text-slate-900 shadow-2xs transition hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        >
                            <FaArchive className="shrink-0 text-[10px]" />
                            <span className="truncate">{t('home.viewCollection')}</span>
                        </Link>
                        <button
                            type="button"
                            onClick={onRandom}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-900/10 bg-slate-900 px-3 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                            <FaRandom className="shrink-0 text-[10px]" />
                            <span className="truncate">{t('home.randomButton')}</span>
                        </button>
                        <Link
                            to="/planner?todo=true"
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 sm:px-5 sm:py-3 text-[11px] sm:text-xs font-bold text-emerald-800 transition hover:-translate-y-0.5 dark:text-emerald-300"
                        >
                            <FaTasks className="shrink-0 text-[10px]" />
                            <span className="truncate">{t('home.myTasks')}</span>
                        </Link>
                    </motion.div>
                </div>

                {/* Right Area: Memory Layer and Live Feed Carousel */}
                <motion.div
                    custom={5}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="relative flex flex-col items-center gap-4 pt-3 sm:pt-0 border-t border-slate-100 dark:border-zinc-900 lg:border-t-0"
                >
                    {/* Compact Avatar Section */}
                    <button
                        type="button"
                        onClick={onAvatarClick}
                        className="group relative flex flex-col items-center"
                    >
                        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-amber-400/30 via-violet-400/20 to-cyan-400/30 opacity-60 blur-lg transition group-hover:opacity-100" />
                        <div className="relative">
                            <img
                                src={avatarUrl}
                                alt=""
                                className="h-20 w-20 sm:h-32 sm:w-32 rounded-[1.25rem] sm:rounded-[1.75rem] object-cover shadow-lg ring-2 ring-white/80 transition duration-300 group-hover:scale-105 dark:ring-zinc-800"
                            />
                            <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
                                <FaHeart className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                            {t('home.memoryCenter')}
                        </p>
                    </button>

                    {/* Live Feed Strip */}
                    <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 py-2 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/50">
                        <p className="mb-1 px-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
                            {t('home.liveRibbon')}
                        </p>
                        {previewItems.length > 0 ? (
                            <Marquee speed={28} gradient={false}>
                                {previewItems.map((item) => (
                                    <span
                                        key={item.id}
                                        className="mx-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white px-2 py-0.5 text-[10px] sm:text-xs font-medium text-slate-700 shadow-2xs dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                                    >
                                        <span className="flex h-4 w-4 sm:h-5 sm:w-5 overflow-hidden rounded-sm shrink-0">
                                            <ImageWithFallback
                                                src={item.image}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </span>
                                        <span className="max-w-[100px] sm:max-w-[130px] truncate">{item.title}</span>
                                    </span>
                                ))}
                            </Marquee>
                        ) : (
                            <p className="px-3 text-[11px] text-slate-500 dark:text-zinc-400">{t('home.noRecent')}</p>
                        )}
                    </div>

                    {/* Desktop description snippet */}
                    <div className="hidden lg:block w-full max-w-xs rounded-xl border border-dashed border-slate-300/80 p-2 text-center text-[10px] text-slate-500 dark:border-zinc-800 dark:text-zinc-500">
                        {t('home.heroDescription')}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
