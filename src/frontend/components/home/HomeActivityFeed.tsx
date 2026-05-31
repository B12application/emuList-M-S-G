import { motion } from 'framer-motion';
import { FaCalendarCheck, FaFilm, FaSpinner } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';

type TFn = (key: string) => string;

interface HomeActivityFeedProps {
    loading: boolean;
    items: MediaItem[];
    onSelect: (item: MediaItem) => void;
    formatDate: (timestamp: unknown) => string;
    t: TFn;
}

export default function HomeActivityFeed({ loading, items, onSelect, formatDate, t }: HomeActivityFeedProps) {
    return (
        <section>
            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-500 dark:bg-sky-950 dark:text-sky-400">
                    <FaCalendarCheck className="text-sm" />
                </div>
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {t('home.recentActivity')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {t('home.liveRibbon')}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-16">
                        <FaSpinner className="h-5 w-5 animate-spin text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-zinc-400">{t('home.loading')}</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-zinc-800 dark:text-zinc-600">
                            <FaCalendarCheck className="text-xl" />
                        </div>
                        <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">{t('home.noRecent')}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {items.map((item, idx) => (
                            <motion.li
                                key={item.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.3 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-900"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/5">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt=""
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <FaFilm className="text-lg text-slate-300 dark:text-zinc-600" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400 transition-colors">
                                            {item.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 dark:text-zinc-400">
                                            {item.description || t('home.noDescription')}
                                        </p>
                                    </div>

                                    {/* Meta - Right side */}
                                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                            {item.type}
                                        </span>
                                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                </button>
                            </motion.li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}