import { FaGithub, FaTwitter, FaInstagram, FaLinkedin, FaHeart } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="mt-20 relative">
            {/* Decorative Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

            <div className="bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl py-8 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Logo / Brand */}
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <span className="text-xl font-black bg-gradient-to-r from-stone-700 to-amber-700 dark:from-stone-200 dark:to-amber-500 bg-clip-text text-transparent tracking-tight">
                            B12 Mustafa Ulusoy
                        </span>
                        <p className="text-[10px] text-gray-500 dark:text-stone-500 font-medium tracking-widest uppercase">
                            {t('footer.subtitle')}
                        </p>
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
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-gray-200 dark:border-white/5 hover:scale-110 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 hover:border-amber-500 transition-all duration-300 shadow-sm"
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>

                    {/* Copyright & Info */}
                    <div className="text-center md:text-right space-y-1">
                        <p className="text-xs text-gray-500 dark:text-stone-500">
                            &copy; {new Date().getFullYear()} {t('footer.rights')}
                        </p>
                        <div className="flex items-center justify-center md:justify-end gap-1.5 text-[10px] text-gray-400 dark:text-stone-600">
                            {t('footer.prefix')} <FaHeart className="text-rose-500 animate-pulse" /> {t('footer.suffix')}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
