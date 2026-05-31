import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilm, FaTv, FaGamepad, FaBook, FaArrowRight } from 'react-icons/fa';

type TFn = (key: string) => string;

interface HomeCategoryBentoProps {
    t: TFn;
}

const cards = [
    {
        to: '/movie',
        titleKey: 'nav.movies' as const,
        descKey: 'home.movieDesc' as const,
        icon: FaFilm,
        color: 'sky',
        accentBar: 'bg-sky-500',
        iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    },
    {
        to: '/series',
        titleKey: 'nav.series' as const,
        descKey: 'home.seriesDesc' as const,
        icon: FaTv,
        color: 'rose',
        accentBar: 'bg-rose-500',
        iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
    },
    {
        to: '/game',
        titleKey: 'nav.games' as const,
        descKey: 'home.gameDesc' as const,
        icon: FaGamepad,
        color: 'amber',
        accentBar: 'bg-amber-500',
        iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    },
    {
        to: '/book',
        titleKey: 'nav.books' as const,
        descKey: 'home.bookDesc' as const,
        icon: FaBook,
        color: 'violet',
        accentBar: 'bg-violet-500',
        iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    },
];

export default function HomeCategoryBento({ t }: HomeCategoryBentoProps) {
    return (
        <section>
            {/* Header */}
            <div className="mb-5">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('home.categoryHubTitle')}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
                    {t('home.categoryHubSubtitle')}
                </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cards.map((c, idx) => {
                    const Icon = c.icon;
                    return (
                        <motion.div
                            key={c.to}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={{ delay: idx * 0.07, duration: 0.4, ease: 'easeOut' }}
                        >
                            <Link
                                to={c.to}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                            >
                                {/* Accent top bar */}
                                <div className={`h-1 w-full ${c.accentBar} origin-left transition-transform duration-400 group-hover:scale-x-100 scale-x-0`} />

                                <div className="flex items-start gap-4 p-5">
                                    {/* Icon */}
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
                                        <Icon className="text-lg" />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            {t(c.titleKey)}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 line-clamp-2 dark:text-zinc-400">
                                            {t(c.descKey)}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom action */}
                                <div className="flex items-center gap-1.5 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-600 transition-colors group-hover:text-slate-900 dark:border-zinc-800 dark:text-zinc-400 dark:group-hover:text-white">
                                    {t('home.goToList')}
                                    <FaArrowRight className="text-[10px] transition group-hover:translate-x-1" />
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}