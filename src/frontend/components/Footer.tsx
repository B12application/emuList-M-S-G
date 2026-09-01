import { FaGithub, FaTwitter, FaInstagram, FaLinkedin, FaHeart } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import B12Logo from './B12Logo';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="mt-20 relative">
            {/* Decorative Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

            <div className="bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl py-8 px-4 sm:px-6 lg:px-10 2xl:px-16">
                <div className="w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Logo / Brand */}
                    <div className="flex items-center gap-3.5">
                        <B12Logo size="sm" className="shrink-0" />
                        <div className="flex flex-col items-center md:items-start gap-0.5">
                            <span className="text-lg font-black bg-gradient-to-r from-stone-800 to-amber-600 dark:from-stone-100 dark:to-amber-400 bg-clip-text text-transparent tracking-tight">
                                B12 Mustafa Ulusoy
                            </span>
                            <p className="text-[10px] text-stone-500 dark:text-stone-500 font-medium tracking-widest uppercase">
                                {t('footer.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                        {[
                            { icon: <FaGithub />, href: "#" },
                            { icon: <FaLinkedin />, href: "#" },
                            { icon: <FaTwitter />, href: "#" },
                            { icon: <FaInstagram />, href: "#" }
                        ].map((social, idx) => (
                            <a
                                key={idx}
                                href={social.href}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-white/5 hover:scale-110 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 hover:border-amber-500 transition-all duration-300 shadow-sm"
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>

                    {/* Copyright & Info */}
                    <div className="text-center md:text-right space-y-1">
                        <p className="text-xs text-stone-500 dark:text-stone-500">
                            &copy; {new Date().getFullYear()} {t('footer.rights')}
                        </p>
                        <div className="flex items-center justify-center md:justify-end gap-1.5 text-[10px] text-stone-400 dark:text-stone-600">
                            {t('footer.prefix')} <FaHeart className="text-rose-500 animate-pulse" /> {t('footer.suffix')}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
