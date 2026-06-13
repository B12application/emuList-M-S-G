import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarCheck, FaFilm, FaSpinner, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 280;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-500">
                        <FaCalendarCheck size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {t('home.recentActivity')}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                            {t('home.liveRibbon')}
                        </p>
                    </div>
                </div>

                {/* Scroll Buttons */}
                {items.length > 3 && (
                    <div className="hidden sm:flex items-center gap-1">
                        <button
                            onClick={() => scroll('left')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <FaChevronLeft size={10} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <FaChevronRight size={10} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 py-16">
                    <FaSpinner className="animate-spin text-slate-300 dark:text-zinc-600" size={20} />
                    <span className="text-sm text-slate-400 dark:text-zinc-500">{t('home.loading')}</span>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 py-12 text-center">
                    <FaCalendarCheck size={32} className="mx-auto text-slate-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-slate-400 dark:text-zinc-500">{t('home.noRecent')}</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Sol gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent pointer-events-none sm:hidden" />
                    {/* Sağ gradient */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none sm:hidden" />

                    {/* Yatay scroll */}
                    <div
                        ref={scrollRef}
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory"
                    >
                        {items.map((item, idx) => (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05, duration: 0.3 }}
                                onClick={() => onSelect(item)}
                                className="group relative flex-shrink-0 w-[180px] sm:w-[200px] snap-start"
                            >
                                {/* Kart */}
                                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                    {/* Fotoğraf */}
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FaFilm size={40} className="text-slate-300 dark:text-zinc-600" />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                    {/* Tip badge - sol üst */}
                                    <div className="absolute top-2.5 left-2.5">
                                        <span className="px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold uppercase">
                                            {item.type}
                                        </span>
                                    </div>

                                    {/* Rating - sağ üst */}
                                    <div className="absolute top-2.5 right-2.5">
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-500 text-white text-[9px] font-bold">
                                            <FaStar size={7} /> {item.rating}
                                        </span>
                                    </div>

                                    {/* Alt bilgi */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                                            {item.title}
                                        </h3>
                                        <p className="text-[9px] text-white/60 mt-1">
                                            {formatDate(item.createdAt)}
                                        </p>
                                    </div>

                                    {/* Hover detay katmanı */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                                            Detaylar
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </section>
    );
}