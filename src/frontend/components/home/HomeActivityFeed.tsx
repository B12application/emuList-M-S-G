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
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                    <FaCalendarCheck />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('home.recentActivity')}</h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">{t('home.liveRibbon')}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <FaSpinner className="h-8 w-8 animate-spin text-sky-500" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500 dark:text-zinc-400">{t('home.noRecent')}</div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {items.map((item, idx) => (
                            <motion.li
                                key={item.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/80"
                                >
                                    <div className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-200 ring-1 ring-black/5 dark:bg-zinc-800">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="h-full w-full object-cover transition group-hover:scale-110" />
                                        ) : (
                                            <span className="m-auto text-slate-400">
                                                <FaFilm />
                                            </span>
                                        )}
                                        <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-sky-600 px-1 text-[9px] font-black text-white shadow">
                                            {idx + 1}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                                            {item.title}
                                        </p>
                                        <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{item.description || t('home.noDescription')}</p>
                                    </div>
                                    <div className="hidden shrink-0 text-right sm:block">
                                        <span className="inline-block rounded-lg bg-sky-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                                            {item.type}
                                        </span>
                                        <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-zinc-500">{formatDate(item.createdAt)}</p>
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
