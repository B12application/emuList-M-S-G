import { motion } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaLightbulb, FaSpinner } from 'react-icons/fa';
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
    return (
        <section className="mt-14">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                        <FaLightbulb className="text-lg" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{t('home.collectionRecommendations')}</h2>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">{t('home.recommendations')}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    title={expanded ? t('home.collapseRecs') : t('home.expandRecs')}
                >
                    {expanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
            </div>

            {expanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="mt-8">
                    {loading ? (
                        <div className="flex items-center justify-center rounded-[1.75rem] border border-slate-200/80 bg-white/70 p-12 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <FaSpinner className="h-9 w-9 animate-spin text-sky-500" />
                            <span className="ml-3 font-medium text-slate-600 dark:text-zinc-300">{t('home.recommendationsLoading')}</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <RecommendationCard item={movie} typeLabel="Film" refetch={refetch} />
                            <RecommendationCard item={series} typeLabel="Dizi" refetch={refetch} />
                            <RecommendationCard item={game} typeLabel="Oyun" refetch={refetch} />
                            <RecommendationCard item={book} typeLabel="Kitap" refetch={refetch} />
                        </div>
                    )}
                </motion.div>
            )}
        </section>
    );
}
