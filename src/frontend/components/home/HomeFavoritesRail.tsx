import { motion } from 'framer-motion';
import { FaStar, FaSpinner, FaChevronLeft, FaChevronRight, FaTimes, FaAward, FaFilm } from 'react-icons/fa';
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
        <section className="mt-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400">
                        <FaAward className="text-sm" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            {t('home.favorites') || 'Koleksiyon Vitrini'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {favorites.length} seçkin başyapıt
                        </p>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => onPageChange(Math.max(0, page - 1))}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200/90 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                            <FaChevronLeft className="text-[10px]" />
                        </button>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tabular-nums px-1">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages - 1}
                            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200/90 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                            <FaChevronRight className="text-[10px]" />
                        </button>
                    </div>
                )}
            </div>

            {/* İçerik */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 py-12 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <FaSpinner className="h-5 w-5 animate-spin text-amber-500" />
                    <span className="text-sm text-slate-500 dark:text-zinc-400">Yükleniyor...</span>
                </div>
            ) : favorites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                    <FaAward className="mx-auto text-2xl text-slate-300 dark:text-zinc-600 mb-2" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Henüz vitrin içeriği yok</h3>
                    <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Kütüphanenden beğendiğin filmleri yıldızlayarak buraya ekleyebilirsin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {slice.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:bg-zinc-900 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg dark:border-zinc-800/80"
                        >
                            <div
                                onClick={() => onSelect(item)}
                                className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden bg-slate-100 dark:bg-zinc-800"
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                        <FaFilm className="text-3xl" />
                                    </div>
                                )}

                                {/* Üst Rozetler */}
                                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-xs">
                                    <FaStar className="text-[9px]" />
                                    <span>{item.rating || '—'}</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => onRemoveFavorite(item, e)}
                                    className="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white/70 opacity-0 transition hover:bg-rose-600 hover:text-white group-hover:opacity-100"
                                    title="Vitrinden Kaldır"
                                >
                                    <FaTimes className="text-[10px]" />
                                </button>

                                {/* Alt Degrade ve Tür */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 pt-6">
                                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                                        {item.type}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3">
                                <h4
                                    onClick={() => onSelect(item)}
                                    className="cursor-pointer text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400 transition-colors"
                                >
                                    {item.title}
                                </h4>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
    );
}