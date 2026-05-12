import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlus, FaArchive } from 'react-icons/fa';

type TFn = (key: string) => string;

interface HomeClosingCtaProps {
    t: TFn;
}

export default function HomeClosingCta({ t }: HomeClosingCtaProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative mt-16 overflow-hidden rounded-[2rem] border border-white/30 bg-linear-to-br from-slate-900 via-slate-800 to-zinc-950 p-10 text-center text-white shadow-2xl dark:border-zinc-800 dark:from-zinc-950 dark:via-black dark:to-zinc-900"
        >
            <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-amber-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />

            <div className="relative mx-auto max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-200/90">{t('home.closingRibbon')}</p>
                <h3 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t('home.footerTitle')}</h3>
                <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">{t('home.footerText')}</p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link
                        to="/create"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-zinc-100"
                    >
                        <FaPlus />
                        {t('home.footerAdd')}
                    </Link>
                    <Link
                        to="/all"
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/10"
                    >
                        <FaArchive />
                        {t('home.footerCollection')}
                    </Link>
                </div>
            </div>

            <div className="pointer-events-none absolute bottom-4 right-4 opacity-60">
                <img src="/logob12.png" alt="" className="h-14 w-14 object-contain" />
            </div>
        </motion.section>
    );
}
