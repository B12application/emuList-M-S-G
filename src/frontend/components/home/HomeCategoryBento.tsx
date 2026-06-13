import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilm, FaTv, FaGamepad, FaBook, FaArrowRight, FaStar } from 'react-icons/fa';

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
        samples: ['Inception', 'Interstellar', 'The Dark Knight', 'Pulp Fiction', 'Fight Club'],
    },
    {
        to: '/series',
        titleKey: 'nav.series' as const,
        descKey: 'home.seriesDesc' as const,
        icon: FaTv,
        color: 'rose',
        accentBar: 'bg-rose-500',
        iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
        samples: ['Breaking Bad', 'Stranger Things', 'The Crown', 'Dark', 'Chernobyl'],
    },
    {
        to: '/game',
        titleKey: 'nav.games' as const,
        descKey: 'home.gameDesc' as const,
        icon: FaGamepad,
        color: 'amber',
        accentBar: 'bg-amber-500',
        iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        samples: ['The Witcher 3', 'RDR2', 'Elden Ring', 'Zelda BOTW', 'God of War'],
    },
    {
        to: '/book',
        titleKey: 'nav.books' as const,
        descKey: 'home.bookDesc' as const,
        icon: FaBook,
        color: 'violet',
        accentBar: 'bg-violet-500',
        iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
        samples: ['1984', 'Dune', 'The Hobbit', 'Foundation', 'Neuromancer'],
    },
];

// Tek bir kart satırı - kendiliğinden kayan
function ScrollingRow({ items, direction = 'left', speed = 30 }: { items: string[]; direction?: 'left' | 'right'; speed?: number }) {
    return (
        <div className="flex gap-2 overflow-hidden">
            <div
                className={`flex gap-2 shrink-0 animate-scroll ${direction === 'right' ? 'animate-scroll-reverse' : ''}`}
                style={{ animationDuration: `${speed}s` }}
            >
                {[...items, ...items].map((item, i) => (
                    <span
                        key={i}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-white/5 text-[10px] font-medium text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 whitespace-nowrap backdrop-blur-sm"
                    >
                        {item}
                    </span>
                ))}
            </div>
            <div
                className={`flex gap-2 shrink-0 animate-scroll ${direction === 'right' ? 'animate-scroll-reverse' : ''}`}
                style={{ animationDuration: `${speed}s` }}
            >
                {[...items, ...items].map((item, i) => (
                    <span
                        key={`dup-${i}`}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-white/5 text-[10px] font-medium text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 whitespace-nowrap backdrop-blur-sm"
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

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

            {/* Cards */}
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
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                {/* Accent top bar */}
                                <div className={`h-0.5 w-full ${c.accentBar} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                {/* Header */}
                                <div className="flex items-center gap-3 p-4 pb-2">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {t(c.titleKey)}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 line-clamp-1">
                                            {t(c.descKey)}
                                        </p>
                                    </div>
                                </div>

                                {/* Kayan örnekler */}
                                <div className="px-4 pb-3 space-y-1.5">
                                    <ScrollingRow items={c.samples.slice(0, 3)} direction="left" speed={25} />
                                    <ScrollingRow items={c.samples.slice(2, 5)} direction="right" speed={30} />
                                </div>

                                {/* Bottom */}
                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 px-4 py-2.5">
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors">
                                        {t('home.goToList')}
                                    </span>
                                    <FaArrowRight size={10} className="text-slate-300 dark:text-zinc-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* Animasyon stilleri */}
            <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll {
          animation: scroll linear infinite;
        }
        .animate-scroll-reverse {
          animation: scroll-reverse linear infinite;
        }
      `}</style>
        </section>
    );
}