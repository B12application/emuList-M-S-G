import { Link } from 'react-router-dom';
import {
    FaHeart,
    FaFilm,
    FaCalendarAlt,
    FaWallet,
    FaCompass,
    FaChartLine,
    FaBolt,
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import B12Logo from './B12Logo';

export default function Footer() {
    const { t } = useLanguage();

    const coreLinks = [
        {
            label: t('footer.collection') || 'Koleksiyon',
            href: '/movie',
            icon: <FaFilm className="text-amber-500 text-xs" />,
        },
        {
            label: t('footer.agenda') || 'Ajanda & Notlar',
            href: '/planner',
            icon: <FaCalendarAlt className="text-violet-500 text-xs" />,
        },
        {
            label: t('footer.expenses') || 'Harcamalar',
            href: '/expenses',
            icon: <FaWallet className="text-emerald-500 text-xs" />,
        },
        {
            label: t('footer.tools') || 'Akıllı Araçlar',
            href: '/calorie-chat',
            icon: <FaCompass className="text-sky-500 text-xs" />,
        },
        {
            label: t('footer.stats') || 'İstatistikler',
            href: '/stats',
            icon: <FaChartLine className="text-indigo-500 text-xs" />,
        },
    ];

    return (
        <footer className="relative mt-12 mb-3 px-3 sm:px-6 lg:px-8 pb-24 md:pb-4">
            {/* ── Şık, Yüzen Kapsül Footer ── */}
            <div className="w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-zinc-950/85 border border-stone-200/90 dark:border-zinc-800/90 shadow-xl shadow-stone-900/5 dark:shadow-black/20 px-5 sm:px-8 py-4 sm:py-5 relative overflow-hidden transition-all">
                {/* Üst altın lazer ışıma çizgisi */}
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 dark:via-amber-500/40 to-transparent" />

                {/* Üst Kısım: Marka Kimliği (Sol) ve 5 Temel Navigasyon Butonu (Sağ) */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Sol: Logo + B12 + Slogan + Geliştirici EMU */}
                    <Link to="/" className="inline-flex items-center gap-3 group shrink-0">
                        <B12Logo size="sm" variant="brand" className="shrink-0 transition-transform duration-300 group-hover:scale-105" />
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white">
                                    B12
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                    <FaBolt className="text-[9px] text-amber-500" />
                                    <span>{t('footer.subtitle') || 'Dijital Hafıza Vitaminin'}</span>
                                </span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                                {t('footer.personalAgentTitle') || 'Kişisel Yaşam Asistanı'} &bull; <span className="text-stone-700 dark:text-zinc-300 font-semibold">{t('footer.developer') || 'Geliştirici: EMU'}</span>
                            </p>
                        </div>
                    </Link>

                    {/* Sağ: 5 Temel Yaşam Sütunu Butonu */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2">
                        {coreLinks.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs font-bold text-stone-700 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white bg-stone-100/80 dark:bg-zinc-900/80 hover:bg-amber-400/15 dark:hover:bg-amber-400/10 border border-stone-200/70 dark:border-zinc-800 hover:border-amber-400/40 dark:hover:border-amber-500/30 transition-all duration-200 shadow-xs active:scale-95"
                            >
                                <span className="w-5 h-5 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-xs shrink-0">
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Alt Kısım: Telif ve Bilgilendirme */}
                <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-zinc-400">
                    <p className="font-medium text-center sm:text-left">
                        &copy; {new Date().getFullYear()} B12 &bull; {t('footer.personalAgentTitle') || 'Kişisel Yaşam Asistanı'} &bull; {t('footer.rights') || 'Tüm Hakları Saklıdır.'}
                    </p>

                    <div className="flex items-center gap-1 font-medium">
                        <span>{t('footer.prefix') || 'Türkiye\'de'}</span>
                        <FaHeart className="text-rose-500 text-[10px] animate-pulse" />
                        <span>{t('footer.suffix') || 'ile yapıldı'}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
