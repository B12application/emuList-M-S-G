import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlus, FaArchive, FaArrowRight } from 'react-icons/fa';

type TFn = (key: string) => string;

interface HomeClosingCtaProps {
    t: TFn;
}

export default function HomeClosingCta({ t }: HomeClosingCtaProps) {
    return (
        <motion.footer
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            // Kocaman değil (ince), ama sönük de değil! Jilet gibi keskin ve parlayan premium karanlık şerit
            className="relative mt-16 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4 dark:bg-black"
        >
            {/* ── Sönüklüğü Bitiren Üst Lazer Çizgisi ── */}
            <div className="absolute inset-x-0 top-0 h-[2px] w-full bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 opacity-80" />

            {/* Arka plan hafif renk sızıntısı (Göz almaz ama canlılık katar) */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl" />

            {/* Sol Kısım: Net ve Parlak Başlık Yapısı */}
            <div className="flex items-center gap-3 text-left w-full sm:w-auto relative z-10">
                <div className="relative h-8 w-8 rounded-xl bg-white/5 p-1 border border-white/10 flex items-center justify-center">
                    <img src="/logob12.png" alt="Logo" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1 sm:flex-none">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        {t('home.footerTitle') || 'Memory Center'}
                    </h4>
                    <p className="text-[11px] font-semibold text-zinc-400 truncate max-w-sm md:max-w-md mt-0.5">
                        {t('home.footerText')}
                    </p>
                </div>
            </div>

            {/* Sağ Kısım: Yüksek Kontrastlı Canlı Butonlar */}
            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end relative z-10">
                {/* Yıl bilgisi şık ve silik */}
                <span className="text-[10px] font-black tracking-widest text-zinc-600 tabular-nums">
                    © {new Date().getFullYear()}
                </span>

                <div className="flex items-center gap-2.5">
                    {/* Ekle Butonu: Parlayan Beyaz Küp */}
                    <Link
                        to="/create"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:bg-zinc-100 active:scale-95"
                    >
                        <FaPlus className="text-[9px]" />
                        <span>{t('home.footerAdd')}</span>
                    </Link>

                    {/* Koleksiyon Butonu: İnce Çizgili ve Sınırları Belli */}
                    <Link
                        to="/all"
                        className="group inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-bold text-zinc-200 transition-all hover:scale-105 hover:border-zinc-700 hover:bg-zinc-900 active:scale-95"
                    >
                        <FaArchive className="text-[10px] text-zinc-500 group-hover:text-amber-400 transition-colors" />
                        <span>{t('home.footerCollection')}</span>
                        <FaArrowRight className="text-[8px] text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                    </Link>
                </div>
            </div>
        </motion.footer>
    );
}