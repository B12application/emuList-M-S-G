import { motion } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaLightbulb, FaSpinner, FaArrowRight } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import RecommendationCard from '../RecommendationCard';

type TFn = (key: string) => string;

interface HomeCollectionPicksProps {
    expanded: boolean;
    onToggle: () => void;
    loading: boolean;
    movie: MediaItem | undefined;
    series: MediaItem | undefined;
    game: MediaItem | undefined;
    book: MediaItem | undefined;
    refetch: () => void;
    t: TFn;
}

const picks = [
    { key: 'movie', icon: '🎬', label: 'Film', color: 'sky' },
    { key: 'series', icon: '📺', label: 'Dizi', color: 'rose' },
    { key: 'game', icon: '🎮', label: 'Oyun', color: 'amber' },
    { key: 'book', icon: '📚', label: 'Kitap', color: 'violet' },
] as const;

export default function HomeCollectionPicks({
    expanded,
    onToggle,
    loading,
    movie,
    series,
    game,
    book,
    refetch,
    t,
}: HomeCollectionPicksProps) {
    const items = { movie, series, game, book };
    const hasAnyItem = Object.values(items).some(Boolean);

    return (
        <section className="mt-14">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-950 dark:text-amber-400">
                        <FaLightbulb className="text-sm" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {t('home.collectionRecommendations')}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {t('home.recommendations')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    {expanded ? t('home.collapseRecs') : t('home.expandRecs')}
                    {expanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                </button>
            </div>

            {/* Content */}
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
                            <FaSpinner className="h-5 w-5 animate-spin text-slate-400" />
                            <span className="text-sm text-slate-500">{t('home.recommendationsLoading')}</span>
                        </div>
                    ) : !hasAnyItem ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800">
                                <FaLightbulb className="text-xl text-slate-300 dark:text-zinc-600" />
                            </div>
                            <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
                                {t('home.noRecommendations') || 'Henüz öneri yok'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {picks.map((pick) => {
                                const item = items[pick.key];
                                return item ? (
                                    <RecommendationCard
                                        key={pick.key}
                                        item={item}
                                        typeLabel={pick.label}
                                        refetch={refetch}
                                    />
                                ) : (
                                    <div
                                        key={pick.key}
                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950"
                                    >
                                        <span className="text-2xl opacity-40">{pick.icon}</span>
                                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                                            {pick.label} {t('home.noRecommendation') || 'öneri yok'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}
        </section>
    );
}