import { motion } from 'framer-motion';
import { FaClock, FaFilm, FaSpinner, FaStar } from 'react-icons/fa';
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
    return (
        <section className="mt-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 dark:bg-sky-500/15 dark:text-sky-400">
                        <FaClock className="text-xs" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            {t('home.recentActivity') || 'Son Eklenenler'}
                        </h2>
                    </div>
                </div>
            </div>

            {/* İçerik */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 py-12 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <FaSpinner className="h-5 w-5 animate-spin text-sky-500" />
                    <span className="text-sm text-slate-500 dark:text-zinc-400">Yükleniyor...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                    <FaClock className="mx-auto text-2xl text-slate-300 dark:text-zinc-600 mb-2" />
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Henüz yeni eklenen bir içerik bulunmuyor.</p>
                </div>
            ) : (
                /* Adaptif Grid: Kaç öğe varsa ona göre tam genişliği dengeli kullanır, boşluk bırakmaz */
                <div className={`grid gap-3 ${
                    items.length === 1
                        ? 'grid-cols-1 sm:grid-cols-2 max-w-lg'
                        : items.length === 2
                        ? 'grid-cols-2 sm:grid-cols-2'
                        : items.length === 3
                        ? 'grid-cols-3'
                        : items.length === 4
                        ? 'grid-cols-2 sm:grid-cols-4'
                        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                }`}>
                    {items.map((item, idx) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, duration: 0.3 }}
                            onClick={() => onSelect(item)}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:bg-zinc-900 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-zinc-800/80 dark:hover:border-zinc-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        >
                            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                        <FaFilm className="text-2xl" />
                                    </div>
                                )}

                                {/* Tip Rozeti */}
                                <div className="absolute top-2 left-2">
                                    <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                                        {item.type}
                                    </span>
                                </div>

                                {/* Rating */}
                                {item.rating && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 backdrop-blur-xs">
                                        <FaStar className="text-[8px]" />
                                        <span>{item.rating}</span>
                                    </div>
                                )}

                                {/* Alt Degrade */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 pt-6">
                                    <p className="text-[10px] font-medium text-white/80">
                                        {formatDate(item.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="p-2.5">
                                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
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