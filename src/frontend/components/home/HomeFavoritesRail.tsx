import { motion } from 'framer-motion';
import { FaHeart, FaSpinner, FaStar, FaFilm, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        <FaHeart />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('home.favorites')}</h2>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">
                            {favorites.length} {t('home.favoritesCountShort')}
                        </p>
                    </div>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => onPageChange(Math.max(0, page - 1))}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            type="button"
                            disabled={page >= totalPages - 1}
                            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white/60 p-12 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <FaSpinner className="h-8 w-8 animate-spin text-rose-500" />
                    <span className="ml-3 font-medium text-slate-600 dark:text-zinc-300">{t('home.favoritesLoading')}</span>
                </div>
            ) : favorites.length === 0 ? (
                <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-rose-200/80 bg-linear-to-br from-rose-50/90 to-white p-10 text-center dark:border-rose-900/40 dark:from-rose-950/30 dark:to-zinc-950/50">
                    <FaHeart className="mx-auto mb-4 h-14 w-14 text-rose-300 dark:text-rose-800" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.noFavoritesTitle')}</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-zinc-400">{t('home.noFavoritesDesc')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {slice.map((item, idx) => (
                        <motion.button
                            type="button"
                            key={item.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => onSelect(item)}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-md transition hover:-translate-y-1 hover:border-rose-400/50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-zinc-800">
                                {item.image ? (
                                    <img src={item.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                        <FaFilm className="h-12 w-12" />
                                    </div>
                                )}
                                <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                                    {item.type}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => onRemoveFavorite(item, e)}
                                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition hover:scale-110"
                                    title="Unfavorite"
                                >
                                    <FaHeart className="text-sm" />
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="truncate font-bold text-slate-900 transition group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-400">
                                    {item.title}
                                </h3>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                        <FaStar /> {item.rating}
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 font-semibold ${
                                            item.watched
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200'
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
