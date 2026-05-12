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
        gradient: 'from-sky-500 to-blue-700',
        glow: 'from-sky-400/30',
    },
    {
        to: '/series',
        titleKey: 'nav.series' as const,
        descKey: 'home.seriesDesc' as const,
        icon: FaTv,
        gradient: 'from-rose-500 to-red-700',
        glow: 'from-rose-400/30',
    },
    {
        to: '/game',
        titleKey: 'nav.games' as const,
        descKey: 'home.gameDesc' as const,
        icon: FaGamepad,
        gradient: 'from-amber-500 to-orange-700',
        glow: 'from-amber-400/30',
    },
    {
        to: '/book',
        titleKey: 'nav.books' as const,
        descKey: 'home.bookDesc' as const,
        icon: FaBook,
        gradient: 'from-violet-500 to-fuchsia-700',
        glow: 'from-violet-400/30',
    },
];

export default function HomeCategoryBento({ t }: HomeCategoryBentoProps) {
    return (
        <section>
            <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('home.categoryHubTitle')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">{t('home.categoryHubSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {cards.map((c, idx) => {
                    const Icon = c.icon;
                    return (
                    <motion.div
                        key={c.to}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: idx * 0.07, duration: 0.45, ease: 'easeOut' }}
                    >
                        <Link
                            to={c.to}
                            className="group relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/60"
                        >
                            <div className={`pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-linear-to-br ${c.glow} to-transparent opacity-0 blur-2xl transition duration-500 group-hover:opacity-100`} />
                            <div
                                className={`pointer-events-none absolute inset-0 bg-linear-to-br ${c.gradient} opacity-0 transition duration-500 group-hover:opacity-90`}
                            />
                            <div className="relative z-10">
                                <div
                                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${c.gradient} text-white shadow-lg ring-4 ring-white/30 dark:ring-zinc-900/50`}
                                >
                                    <Icon size={26} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 transition group-hover:text-white dark:text-white">{t(c.titleKey)}</h3>
                                <p className="mt-2 max-w-sm text-sm text-slate-600 transition group-hover:text-white/90 dark:text-zinc-300 dark:group-hover:text-white/85">
                                    {t(c.descKey)}
                                </p>
                            </div>
                            <div className="relative z-10 mt-8 flex items-center gap-2 text-sm font-bold text-slate-900 transition group-hover:text-white dark:text-white">
                                {t('home.goToList')}
                                <FaArrowRight className="transition group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
