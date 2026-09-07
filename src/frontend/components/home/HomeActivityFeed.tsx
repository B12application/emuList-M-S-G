import { motion } from 'framer-motion';
import { FaClock, FaFilm, FaSpinner, FaStar, FaCheckCircle, FaArchive } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';

type TFn = (key: string) => string;

interface HomeActivityFeedProps {
    loading: boolean;
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
    formatDate: (timestamp: unknown) => string;
    t: TFn;
}

export default function HomeActivityFeed({
    loading,
    items,
    onSelect,
    formatDate,
    t,
}: HomeActivityFeedProps) {
    const getLocalizedType = (type: string) => {
        if (type === 'movie') return t('media.movie') || 'Film';
        if (type === 'series') return t('media.series') || 'Dizi';
        if (type === 'game') return t('media.game') || 'Oyun';
        if (type === 'book') return t('media.book') || 'Kitap';
        return type;
    };

    return (
        <section className="mt-10 rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-xs backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 sm:p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 shadow-inner dark:bg-sky-500/15 dark:text-sky-400">
                        <FaClock className="text-base" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                                {t('home.recentActivity') || 'Kütüphane Günlüğü'}
                            </h2>
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-sky-700 dark:text-sky-400">
                                <FaArchive className="text-[9px]" />
                                <span>{t('home.archiveItem') || 'Arşiviniz'}</span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {t('home.recentActivitySubtitle') || 'Kişisel arşivinize en son eklediğiniz kayıtlar — Doğrudan kütüphanenizden derlenmiştir'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FaSpinner className="h-6 w-6 animate-spin text-sky-500" />
                    <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                        {t('home.statsLoading') || 'Yükleniyor...'}
                    </span>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-zinc-800">
                    <FaClock className="mx-auto mb-2 text-2xl text-slate-300 dark:text-zinc-600" />
                    <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                        {t('home.noRecent') || 'Henüz yeni eklenen bir içerik bulunmuyor.'}
                    </p>
                </div>
            ) : (
                <div
                    className={`grid gap-3.5 ${
                        items.length === 1
                            ? 'grid-cols-1 sm:grid-cols-2 max-w-lg'
                            : items.length === 2
                            ? 'grid-cols-2 sm:grid-cols-2'
                            : items.length === 3
                            ? 'grid-cols-3'
                            : items.length === 4
                            ? 'grid-cols-2 sm:grid-cols-4'
                            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                    }`}
                >
                    {items.map((item, idx) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03, duration: 0.25 }}
                            onClick={() => onSelect(item)}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/50 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        >
                            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                        <FaFilm className="text-2xl" />
                                    </div>
                                )}

                                {/* Type Tag - Top Left */}
                                <div className="absolute top-2 left-2">
                                    <span className="rounded-lg bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs border border-white/10 shadow-xs">
                                        {getLocalizedType(item.type)}
                                    </span>
                                </div>

                                {/* Rating - Top Right */}
                                {item.rating && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 backdrop-blur-xs border border-white/10 shadow-xs">
                                        <FaStar className="text-[8px]" />
                                        <span>{item.rating}</span>
                                    </div>
                                )}

                                {/* In Library Badge Overlay */}
                                <div className="absolute left-2 bottom-8 z-10">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-black text-emerald-300 backdrop-blur-xs shadow-xs">
                                        <FaCheckCircle className="text-[8px] text-emerald-400" />
                                        <span>{t('home.archiveItem') || 'Arşivinizde'}</span>
                                    </span>
                                </div>

                                {/* Bottom Date Overlay */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2 pt-6">
                                    <p className="text-[10px] font-semibold text-white/90">
                                        {formatDate(item.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="p-2.5">
                                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400 transition-colors" title={item.title}>
                                    {item.title}
                                </h4>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </section>
    );
}