import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    FaPlus,
    FaArchive,
    FaRandom,
    FaTasks,
    FaRegHeart,
    FaTimes,
    FaArrowRight,
    FaRegPlayCircle,
    FaCloud,
    FaLayerGroup,
} from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import ImageWithFallback from '../ui/ImageWithFallback';
import DetailModal from '../../components/DetailModal'; // <-- Kendi klasör yapınıza göre bu yolu düzenleyin

type TFn = (key: string) => string;

interface HomeHeroProps {
    displayName: string;
    avatarUrl: string;
    onAvatarClick: () => void;
    onRandom: () => void;
    t: TFn;
    previewItems: MediaItem[];
}

const bentoItem: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: i * 0.1,
            type: 'spring' as const,
            stiffness: 100,
            damping: 20,
            mass: 1,
        },
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
    // Tıklanan içeriği DetailModal'a göndermek için state
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

    const chips = [
        { icon: FaPlus, label: t('home.heroFeatureSmart') },
        { icon: FaCloud, label: t('home.heroFeatureSync') },
        { icon: FaLayerGroup, label: t('home.heroFeatureDepth') },
    ];

    return (
        <>
            {/* Bento Grid Düzeni */}
            <div className="relative mb-8 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">

                {/* ── BENTO KUTUSU 1: Ana Karşılama ── */}
                <motion.div
                    custom={0}
                    variants={bentoItem}
                    initial="hidden"
                    animate="show"
                    className="relative col-span-1 overflow-hidden rounded-[2.5rem] border border-white/40 bg-gradient-to-br from-slate-100 to-slate-50 p-8 shadow-sm dark:border-white/10 dark:from-zinc-900 dark:to-black lg:col-span-8 lg:p-12"
                >
                    <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-amber-400/20 mix-blend-multiply blur-3xl dark:bg-amber-600/20" />
                    <div className="absolute -bottom-32 -right-10 h-80 w-80 rounded-full bg-violet-400/20 mix-blend-multiply blur-3xl dark:bg-fuchsia-600/20" />

                    <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                        <div>
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200/50 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/60 dark:text-zinc-300">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                </span>
                                {t('home.heroEyebrow')}
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                                {t('home.welcome')},{' '}
                                <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent dark:from-amber-400 dark:to-rose-400">
                                    {displayName}
                                </span>
                            </h1>

                            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-lg">
                                {t('home.heroTagline')}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {chips.map(({ icon: Icon, label }) => (
                                    <span
                                        key={label}
                                        className="flex items-center gap-2 rounded-xl bg-white/50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        <Icon className="text-amber-500" />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to="/create"
                                className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 translate-x-[-100%] transition-transform duration-500 group-hover:translate-x-[100%]" />
                                <FaPlus />
                                {t('home.addNew')}
                            </Link>
                            <Link
                                to="/all"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white/50 px-6 py-3.5 text-sm font-bold text-slate-700 backdrop-blur-sm transition-all hover:bg-white hover:shadow-sm active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                <FaArchive className="text-slate-400 dark:text-zinc-500" />
                                {t('home.viewCollection')}
                            </Link>

                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onRandom}
                                    className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-amber-100 text-amber-600 transition-all hover:bg-amber-200 hover:shadow-sm active:scale-95 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                                    title={t('home.randomButton')}
                                >
                                    <FaRandom className="text-lg" />
                                </button>
                                <Link
                                    to="/planner?todo=true"
                                    className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-all hover:bg-emerald-200 hover:shadow-sm active:scale-95 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                                    title={t('home.myTasks')}
                                >
                                    <FaTasks className="text-lg" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SAĞ SÜTUN ── */}
                <div className="col-span-1 flex flex-col gap-4 lg:col-span-4 lg:gap-6">

                    {/* BENTO KUTUSU 2: Profil Kartı */}
                    <motion.div
                        custom={1}
                        variants={bentoItem}
                        initial="hidden"
                        animate="show"
                        onClick={() => setIsExpanded(true)}
                        className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/40 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-zinc-950/50" />

                        <div className="relative mb-3 h-28 w-28">
                            <div className="absolute -inset-2 animate-spin rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 opacity-20 blur-md duration-[3000ms]" />
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className="relative h-full w-full rounded-full object-cover ring-4 ring-white transition-transform duration-500 group-hover:scale-105 dark:ring-zinc-950"
                            />
                            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-rose-500 text-white dark:border-zinc-950">
                                <FaRegHeart className="h-3 w-3" />
                            </div>
                        </div>

                        <h3 className="relative z-10 text-lg font-bold text-slate-900 dark:text-white">
                            {t('home.memoryCenter')}
                        </h3>
                        <p className="relative z-10 text-xs font-medium text-slate-400 dark:text-zinc-500">
                            {t('nav.myProfile')}'ne Git
                        </p>
                    </motion.div>

                    {/* BENTO KUTUSU 3: Live Ribbon (Canlı Kısım) */}
                    <motion.div
                        custom={2}
                        variants={bentoItem}
                        initial="hidden"
                        animate="show"
                        className="flex flex-1 flex-col justify-center rounded-[2.5rem] border border-white/40 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                <FaRegPlayCircle className="text-amber-500" />
                                {t('home.liveRibbon')}
                            </h4>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                                {previewItems.length}
                            </span>
                        </div>

                        {previewItems.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-2.5">
                                {previewItems.slice(0, 7).map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedItem(item)}
                                        // HATA DÜZELTİLDİ: cursor-pointer eklendi.
                                        className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 transition-all hover:scale-105 hover:shadow-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-800"
                                        title={item.title}
                                    >
                                        <ImageWithFallback
                                            src={item.image}
                                            alt={item.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </button>
                                ))}
                                {/* +X Fazlalık Sayacı Butonu */}
                                {previewItems.length > 7 && (
                                    <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                                        +{previewItems.length - 7}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                                <p className="text-center text-xs font-medium text-slate-400 dark:text-zinc-500">
                                    {t('home.noRecent')}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── İÇERİK DETAY MODALI (DetailModal) ── */}
            {selectedItem && (
                <DetailModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {/* ── GENİŞLETİLMİŞ PROFİL MODALI ── */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xl dark:bg-black/60"
                            onClick={() => setIsExpanded(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-sm cursor-default overflow-hidden rounded-[2rem] bg-white p-1 shadow-2xl dark:bg-zinc-900"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="rounded-[1.8rem] border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                            {t('nav.myProfile')}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsExpanded(false)}
                                            // HATA DÜZELTİLDİ: cursor-pointer eklendi
                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                        >
                                            <FaTimes className="text-sm" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="relative mb-4 p-2">
                                            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-amber-400 to-rose-500 opacity-20 blur-xl" />
                                            <img
                                                src={avatarUrl}
                                                alt=""
                                                className="relative h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg dark:border-zinc-800 sm:h-40 sm:w-40"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {displayName}
                                        </h2>
                                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-400">
                                            {t('home.memoryCenter')} Yönetimi
                                        </p>

                                        <Link
                                            to="/profile"
                                            onClick={() => setIsExpanded(false)}
                                            // HATA DÜZELTİLDİ: cursor-pointer eklendi
                                            className="mt-8 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-zinc-950"
                                        >
                                            {t('home.profileModalCta')}
                                            <FaArrowRight className="text-xs" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}