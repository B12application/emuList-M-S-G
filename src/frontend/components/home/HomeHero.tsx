import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus,
    FaArchive,
    FaRandom,
    FaTasks,
    FaTimes,
    FaArrowRight,
    FaFilm,
    FaTv,
    FaGamepad,
    FaBook,
    FaCompass,
    FaCrown,
    FaStar,
} from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import ImageWithFallback from '../ui/ImageWithFallback';
import DetailModal from '../../components/DetailModal';

type TFn = (key: string) => string;

interface HomeHeroProps {
    displayName: string;
    avatarUrl: string;
    onAvatarClick?: () => void;
    onRandom: () => void;
    t: TFn;
    previewItems: MediaItem[];
}

export default function HomeHero({
    displayName,
    avatarUrl,
    onRandom,
    t,
    previewItems,
}: HomeHeroProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

    // Günün saatine göre lüks ve akıllı selamlama mesajı
    const timeGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Günaydın';
        if (hour >= 12 && hour < 18) return 'İyi günler';
        if (hour >= 18 && hour < 23) return 'İyi akşamlar';
        return 'İyi geceler';
    }, []);

    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'movie': return <FaFilm className="text-sky-400" size={10} />;
            case 'series': return <FaTv className="text-rose-400" size={10} />;
            case 'game': return <FaGamepad className="text-emerald-400" size={10} />;
            case 'book': return <FaBook className="text-amber-400" size={10} />;
            default: return <FaFilm className="text-sky-400" size={10} />;
        }
    };

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/40 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-white/[0.07] dark:bg-gradient-to-br dark:from-zinc-900/90 dark:via-[#111218]/90 dark:to-zinc-950/95 dark:shadow-2xl dark:shadow-black/50 sm:p-8 lg:p-10"
            >
                {/* Lüks Ambient Işıklandırması */}
                <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-amber-500/[0.08] blur-[120px] dark:bg-amber-500/[0.06]" />
                <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-500/[0.06] blur-[100px] dark:bg-indigo-600/[0.05]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] dark:opacity-20" />

                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between">

                    {/* ── SOL SÜTUN: Karşılama, Başlık ve Hızlı İşlemler ── */}
                    <div className="flex flex-1 flex-col justify-between">
                        <div>
                            {/* Üst Rozet Barı */}
                            <div className="mb-4 flex flex-wrap items-center gap-2.5">
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold tracking-wider text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                                    </span>
                                    <span>B12 APP</span>
                                </div>

                                <div className="hidden items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-[11px] font-medium text-slate-500 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 sm:inline-flex">
                                    <FaStar className="text-amber-500" size={10} />
                                    <span>{timeGreeting}</span>
                                </div>
                            </div>

                            {/* Ana Karşılama Başlığı */}
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
                                {t('home.welcome')},{' '}
                                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent dark:from-amber-400 dark:via-amber-200 dark:to-orange-400">
                                    {displayName}
                                </span>
                            </h1>

                            <p className="mt-3 max-w-xl text-sm font-normal leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-base">
                                Medya arşivinizi, izleme listelerinizi ve günlük hedeflerinizi tek bir modern komuta merkezinden yönetin.
                            </p>
                        </div>

                        {/* Aksiyon Butonları & Hızlı Araçlar */}
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            {/* Ana Aksiyon: Yeni Ekle */}
                            <Link
                                to="/create"
                                className="group relative inline-flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] dark:bg-gradient-to-r dark:from-amber-500 dark:to-amber-600 dark:text-zinc-950 dark:shadow-amber-500/20 dark:hover:from-amber-400 dark:hover:to-amber-500"
                            >
                                <FaPlus size={12} className="transition-transform group-hover:rotate-90 duration-300" />
                                <span>{t('home.addNew')}</span>
                            </Link>

                            {/* İkincil Aksiyon: Arşive Git */}
                            <Link
                                to="/all"
                                className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                                <FaArchive size={12} className="text-slate-400 transition-colors group-hover:text-amber-500 dark:text-zinc-400" />
                                <span>{t('home.viewCollection')}</span>
                            </Link>

                            {/* Hızlı Araç Butonları (Kompakt ve Modern) */}
                            <div className="flex items-center gap-2 sm:ml-auto">
                                <button
                                    type="button"
                                    onClick={onRandom}
                                    className="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-amber-500/30 hover:bg-amber-50/50 hover:text-amber-600 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                                    title={t('home.randomButton')}
                                >
                                    <FaRandom size={14} className="transition-transform group-hover:rotate-180 duration-500" />
                                </button>

                                <Link
                                    to="/planner?todo=true"
                                    className="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/30 hover:bg-emerald-50/50 hover:text-emerald-600 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                                    title={t('home.myTasks')}
                                >
                                    <FaTasks size={14} className="transition-transform group-hover:scale-110 duration-300" />
                                </Link>

                                <Link
                                    to="/feed"
                                    className="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-indigo-500/30 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                                    title="Keşfet & Akış"
                                >
                                    <FaCompass size={14} className="transition-transform group-hover:rotate-45 duration-300" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── SAĞ SÜTUN: Profil Kartı ve Sinematik Hızlı Vitrin ── */}
                    <div className="mt-6 flex flex-col gap-4 lg:mt-0 lg:w-[420px] lg:shrink-0">

                        {/* 1. Üst Kısım: Ultra-Clean Profil Barı */}
                        <div
                            onClick={() => setIsExpanded(true)}
                            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
                        >
                            <div className="flex items-center gap-3.5 overflow-hidden">
                                <div className="relative shrink-0">
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-zinc-700"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                            {displayName}
                                        </span>
                                        <FaCrown className="text-amber-500 shrink-0" size={11} />
                                    </div>
                                    <p className="truncate text-xs font-medium text-slate-500 dark:text-zinc-400">
                                        {t('home.memoryCenter')} • Profilim
                                    </p>
                                </div>
                            </div>

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-all group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-200">
                                <FaArrowRight size={11} />
                            </div>
                        </div>

                        {/* 2. Alt Kısım: Sinematik Son İçerikler (Film Strip Vitrini) */}
                        <div className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                        Son Eklenenler
                                    </span>
                                </div>
                                <Link
                                    to="/all"
                                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                >
                                    Tümünü Gör →
                                </Link>
                            </div>

                            {previewItems && previewItems.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {previewItems.slice(0, 4).map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedItem(item)}
                                            className="group/item relative aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-xl bg-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-800"
                                        >
                                            <ImageWithFallback
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                                            />
                                            {/* Tür Rozeti */}
                                            <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-black/60 backdrop-blur-md">
                                                {getTypeIcon(item.type)}
                                            </div>

                                            {/* Hover Bilgi Katmanı */}
                                            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1.5 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100">
                                                <p className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
                                                    {item.title}
                                                </p>
                                                {item.rating && (
                                                    <span className="mt-0.5 text-[9px] font-bold text-amber-400">
                                                        ★ {item.rating}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                                    <p className="text-xs text-slate-400 dark:text-zinc-500">Henüz içerik eklenmemiş</p>
                                </div>
                            )}
                        </div>

                    </div>

                </div>
            </motion.section>

            {/* Detay Modalı */}
            {selectedItem && (
                <DetailModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {/* Genişletilmiş Profil & Yönetim Modalı */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                            onClick={() => setIsExpanded(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                                className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                        Kullanıcı Profili
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(false)}
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                    >
                                        <FaTimes size={11} />
                                    </button>
                                </div>

                                <div className="mt-6 flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        <img
                                            src={avatarUrl}
                                            alt={displayName}
                                            className="h-24 w-24 rounded-2xl object-cover ring-4 ring-amber-500/20 dark:ring-amber-500/30"
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {displayName}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                                        {t('home.memoryCenter')} Koleksiyoneri
                                    </p>

                                    <div className="mt-6 grid w-full grid-cols-2 gap-2">
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsExpanded(false)}
                                            className="flex cursor-pointer items-center justify-center rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                                        >
                                            Profili Düzenle
                                        </Link>
                                        <Link
                                            to="/stats"
                                            onClick={() => setIsExpanded(false)}
                                            className="flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                        >
                                            İstatistikler
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