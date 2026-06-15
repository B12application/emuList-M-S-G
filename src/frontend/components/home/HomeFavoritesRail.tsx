import { motion } from 'framer-motion';
import { FaHeart, FaSpinner, FaStar, FaFilm, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';

type TFn = (key: string) => string;

interface HomeFavoritesRailProps {
    loading: boolean;
    items: MediaItem[];
    page: number;
    perPage: number;
    onPageChange: (p: number) => void;
    onSelect: (item: MediaItem) => void;
    onRemoveFavorite: (item: MediaItem, e: React.MouseEvent) => void;
    t: TFn;
}

export default function HomeFavoritesRail({
    loading,
    items,
    page,
    perPage,
    onPageChange,
    onSelect,
    onRemoveFavorite,
    t,
}: HomeFavoritesRailProps) {
    const favorites = items.filter((i) => i.isFavorite);
    const totalPages = Math.max(1, Math.ceil(favorites.length / perPage));
    const start = page * perPage;
    const slice = favorites.slice(start, start + perPage);

    return (
        <section>
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-950 dark:text-rose-400">
                        <FaHeart className="text-sm" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            {t('home.favorites')}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {favorites.length} {t('home.favoritesCountShort')}
                        </p>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => onPageChange(Math.max(0, page - 1))}
                            // HATA DÜZELTİLDİ: cursor-pointer ve disabled:cursor-default eklendi
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-default dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            <FaChevronLeft className="text-[10px]" />
                        </button>
                        <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 tabular-nums">
                            {page + 1}/{totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages - 1}
                            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                            // HATA DÜZELTİLDİ: cursor-pointer ve disabled:cursor-default eklendi
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:cursor-default dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            <FaChevronRight className="text-[10px]" />
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
                    <FaSpinner className="h-5 w-5 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500 dark:text-zinc-400">{t('home.favoritesLoading')}</span>
                </div>
            ) : favorites.length === 0 ? (
                /* Empty State */
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950/50">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-400 dark:bg-rose-950 dark:text-rose-600">
                        <FaHeart className="text-2xl" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{t('home.noFavoritesTitle')}</h3>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500 dark:text-zinc-400">{t('home.noFavoritesDesc')}</p>
                </div>
            ) : (
                /* Cards Grid */
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {slice.map((item, idx) => (
                        <motion.button
                            type="button"
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06, duration: 0.3 }}
                            onClick={() => onSelect(item)}
                            // HATA DÜZELTİLDİ: cursor-pointer eklendi
                            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:border-slate-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                        >
                            {/* Image Area */}
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                        <FaFilm className="h-10 w-10" />
                                    </div>
                                )}

                                {/* Type Badge - top left */}
                                <span className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-white backdrop-blur-sm">
                                    {item.type}
                                </span>

                                {/* Remove Favorite - top right */}
                                <button
                                    type="button"
                                    onClick={(e) => onRemoveFavorite(item, e)}
                                    // HATA DÜZELTİLDİ: cursor-pointer eklendi
                                    className="absolute right-2.5 top-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-rose-500 shadow-sm opacity-0 transition-all hover:bg-rose-500 hover:text-white group-hover:opacity-100 dark:bg-zinc-900/90 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white"
                                    title={t('home.removeFavorite')}
                                >
                                    <FaTimes className="text-[10px]" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 flex-col p-3.5">
                                <h3 className="text-sm font-bold text-slate-900 line-clamp-1 dark:text-white">
                                    {item.title}
                                </h3>

                                <div className="mt-auto flex items-center justify-between pt-2">
                                    {/* Rating */}
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                                        <FaStar className="text-[10px]" />
                                        {item.rating || '—'}
                                    </span>

                                    {/* Status */}
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.watched
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}
                                    >
                                        {item.watched
                                            ? item.type === 'book'
                                                ? t('media.read')
                                                : item.type === 'game'
                                                    ? t('media.played')
                                                    : t('media.watched')
                                            : item.type === 'book'
                                                ? t('media.notRead')
                                                : item.type === 'game'
                                                    ? t('media.notPlayed')
                                                    : t('media.notWatched')}
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </section>
    );
}