import { motion } from 'framer-motion';
import { FaChartPie, FaSpinner, FaFilm, FaTv, FaGamepad, FaBook, FaDatabase } from 'react-icons/fa';

type TFn = (key: string) => string;

export interface HomeStatsShape {
    totalCount: number;
    movieCount: number;
    seriesCount: number;
    gameCount: number;
    bookCount: number;
}

interface HomeStatsBentoProps {
    stats: HomeStatsShape;
    loading: boolean;
    t: TFn;
}

export default function HomeStatsBento({ stats, loading, t }: HomeStatsBentoProps) {
    if (loading) {
        return (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.75rem] border border-slate-200/80 bg-white/60 p-10 dark:border-zinc-800 dark:bg-zinc-900/50">
                <FaSpinner className="h-10 w-10 animate-spin text-amber-600" />
                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-zinc-300">{t('home.statsLoading')}</p>
            </div>
        );
    }

    const tiles = [
        {
            key: 'total',
            label: t('home.totalItems'),
            value: stats.totalCount,
            icon: FaDatabase,
            className:
                'sm:col-span-2 sm:row-span-2 bg-linear-to-br from-slate-900 via-slate-800 to-zinc-900 text-white border-white/10 dark:from-zinc-950 dark:via-zinc-900 dark:to-black',
            valueClass: 'text-5xl sm:text-6xl font-black bg-linear-to-r from-white to-zinc-300 bg-clip-text text-transparent',
        },
        {
            key: 'movie',
            label: t('home.movieCount'),
            value: stats.movieCount,
            icon: FaFilm,
            className: 'bg-linear-to-br from-sky-500/15 to-sky-600/5 border-sky-500/20 dark:from-sky-500/20 dark:to-sky-900/10',
            valueClass: 'text-3xl font-black text-sky-700 dark:text-sky-300',
        },
        {
            key: 'series',
            label: t('home.seriesCount'),
            value: stats.seriesCount,
            icon: FaTv,
            className: 'bg-linear-to-br from-rose-500/15 to-rose-600/5 border-rose-500/20 dark:from-rose-500/15 dark:to-rose-900/10',
            valueClass: 'text-3xl font-black text-rose-700 dark:text-rose-300',
        },
        {
            key: 'game',
            label: t('home.gameCount'),
            value: stats.gameCount,
            icon: FaGamepad,
            className: 'bg-linear-to-br from-amber-500/15 to-orange-600/5 border-amber-500/25 dark:from-amber-500/15 dark:to-orange-900/10',
            valueClass: 'text-3xl font-black text-amber-700 dark:text-amber-300',
        },
        {
            key: 'book',
            label: t('home.bookCount'),
            value: stats.bookCount,
            icon: FaBook,
            className: 'bg-linear-to-br from-violet-500/15 to-violet-600/5 border-violet-500/20 dark:from-violet-500/15 dark:to-violet-900/10',
            valueClass: 'text-3xl font-black text-violet-700 dark:text-violet-300',
        },
    ];

    return (
        <section>
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    <FaChartPie />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('home.stats')}</h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">{t('home.trendsHint')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:grid-rows-2">
                {tiles.map((tile, idx) => (
                    <motion.div
                        key={tile.key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${tile.className}`}
                    >
                        <tile.icon
                            className={`mb-4 text-xl ${tile.key === 'total' ? 'text-amber-300' : 'text-slate-600 dark:text-zinc-300'}`}
                        />
                        <p
                            className={`text-xs font-bold uppercase tracking-wider ${
                                tile.key === 'total' ? 'text-zinc-300' : 'text-slate-500 dark:text-zinc-400'
                            }`}
                        >
                            {tile.label}
                        </p>
                        <p className={`mt-1 ${tile.valueClass}`}>{tile.value}</p>
                        {tile.key === 'total' && (
                            <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl" />
                        )}
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
