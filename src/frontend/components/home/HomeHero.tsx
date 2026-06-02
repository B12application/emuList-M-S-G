import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus,
    FaArchive,
    FaRandom,
    FaTasks,
    FaBolt,
    FaCloud,
    FaLayerGroup,
    FaHeart,
    FaTimes,
    FaArrowRight,
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
        transition: { delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
    }),
};

export default function HomeHero({
    displayName,
    avatarUrl,
    onAvatarClick: _onAvatarClick,
    onRandom,
    t,
    previewItems,
}: HomeHeroProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const chips = [
        { icon: FaBolt, label: t('home.heroFeatureSmart') },
        { icon: FaCloud, label: t('home.heroFeatureSync') },
        { icon: FaLayerGroup, label: t('home.heroFeatureDepth') },
    ];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            >
                {/* Subtle top accent line */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

                <div className="relative z-10 flex flex-col gap-0 lg:flex-row">
                    {/* ── Left: Content ── */}
                    <div className="flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10">
                        {/* Eyebrow */}
                        <motion.div
                            custom={0}
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {t('home.heroEyebrow')}
                        </motion.div>

                        {/* Greeting */}
                        <motion.h1
                            custom={1}
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl"
                        >
                            {t('home.welcome')},{' '}
                            <span className="text-amber-600 dark:text-amber-400">{displayName}</span>
                        </motion.h1>

                        {/* Tagline */}
                        <motion.p
                            custom={2}
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-base"
                        >
                            {t('home.heroTagline')}
                        </motion.p>

                        {/* Feature chips */}
                        <motion.div
                            custom={3}
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className="mt-5 flex flex-wrap gap-2"
                        >
                            {chips.map(({ icon: Icon, label }) => (
                                <span
                                    key={label}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                                >
                                    <Icon className="text-amber-500 text-xs shrink-0" />
                                    {label}
                                </span>
                            ))}
                        </motion.div>

                        {/* Actions - responsive grid */}
                        <motion.div
                            custom={4}
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
                        >
                            <Link
                                to="/create"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-700 active:scale-[0.98] sm:px-5"
                            >
                                <FaPlus className="shrink-0 text-xs" />
                                <span className="truncate">{t('home.addNew')}</span>
                            </Link>
                            <Link
                                to="/all"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 sm:px-5"
                            >
                                <FaArchive className="shrink-0 text-xs" />
                                <span className="truncate">{t('home.viewCollection')}</span>
                            </Link>
                            <button
                                type="button"
                                onClick={onRandom}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:px-5"
                            >
                                <FaRandom className="shrink-0 text-xs" />
                                <span className="truncate">{t('home.randomButton')}</span>
                            </button>
                            <Link
                                to="/planner?todo=true"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-[0.98] dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900 sm:px-5"
                            >
                                <FaTasks className="shrink-0 text-xs" />
                                <span className="truncate">{t('home.myTasks')}</span>
                            </Link>
                        </motion.div>
                    </div>

                    {/* ── Right: Profile & Preview ── */}
                    <motion.div
                        custom={5}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col items-center justify-center gap-4 border-t border-slate-100 bg-slate-50/50 p-6 sm:p-8 lg:w-[340px] lg:shrink-0 lg:border-l lg:border-t-0 dark:border-zinc-800 dark:bg-zinc-950/50"
                    >
                        {/* Avatar - tıklanınca yerinde büyür */}
                        <button
                            type="button"
                            onClick={() => setIsExpanded(true)}
                            className="group relative"
                        >
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 opacity-0 blur transition-opacity group-hover:opacity-60" />
                            <div className="relative">
                                <img
                                    src={avatarUrl}
                                    alt=""
                                    className="h-24 w-24 rounded-2xl object-cover ring-2 ring-white transition-transform duration-300 group-hover:scale-105 dark:ring-zinc-800 sm:h-28 sm:w-28"
                                />
                                <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md ring-2 ring-white dark:ring-zinc-950">
                                    <FaHeart className="h-3 w-3" />
                                </div>
                            </div>
                        </button>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            {t('home.memoryCenter')}
                        </p>

                        {/* Recent items strip - cleaner */}
                        <div className="w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                {t('home.liveRibbon')}
                            </p>
                            {previewItems.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 px-3">
                                    {previewItems.slice(0, 8).map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800 sm:h-8 sm:w-8"
                                            title={item.title}
                                        >
                                            <ImageWithFallback
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                    {previewItems.length > 8 && (
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 sm:h-8 sm:w-8">
                                            +{previewItems.length - 8}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="px-3 text-xs text-slate-400 dark:text-zinc-500">
                                    {t('home.noRecent')}
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* ── Expanded Profile Overlay ── */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                        onClick={() => setIsExpanded(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-zinc-800">
                                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                                    {t('nav.myProfile')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col items-center p-6">
                                <img
                                    src={avatarUrl}
                                    alt=""
                                    className="h-28 w-28 rounded-2xl border-2 border-slate-100 object-cover shadow-md dark:border-zinc-800 sm:h-32 sm:w-32"
                                />
                                <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-zinc-200">
                                    {displayName}
                                </p>
                                <Link
                                    to="/profile"
                                    onClick={() => setIsExpanded(false)}
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"
                                >
                                    {t('home.profileModalCta')}
                                    <FaArrowRight className="text-xs" />
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}