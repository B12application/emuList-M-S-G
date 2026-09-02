import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronUp } from 'react-icons/fa';

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);
    const isVisibleRef = useRef(false);
    const circleRef = useRef<SVGCircleElement>(null);
    const rafIdRef = useRef<number | null>(null);

    // SVG çember parametreleri
    const radius = 18;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        const updateScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            
            const shouldBeVisible = scrollTop > 250;
            if (shouldBeVisible !== isVisibleRef.current) {
                isVisibleRef.current = shouldBeVisible;
                setIsVisible(shouldBeVisible);
            }

            if (circleRef.current && scrollHeight > 0) {
                const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
                const strokeDashoffset = circumference - (progress / 100) * circumference;
                circleRef.current.style.strokeDashoffset = `${strokeDashoffset}`;
            }
        };

        const handleScroll = () => {
            if (rafIdRef.current) return;
            rafIdRef.current = requestAnimationFrame(() => {
                updateScroll();
                rafIdRef.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        updateScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [circumference]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.6, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6, y: 15 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="fixed bottom-40 right-4 md:bottom-22 md:right-6 z-[115]"
                >
                    <button
                        type="button"
                        onClick={scrollToTop}
                        aria-label="Sayfanın Başına Dön"
                        title="Yukarı Çık"
                        className="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 text-slate-700 shadow-xl transition-all duration-300 hover:scale-110 hover:border-amber-500/40 hover:text-amber-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:border-amber-400/40 dark:hover:text-amber-400"
                    >
                        {/* Dairesel Scroll İlerleme Göstergesi */}
                        <svg className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none p-1" viewBox="0 0 44 44">
                            <circle
                                cx="22"
                                cy="22"
                                r={radius}
                                className="stroke-slate-200/40 dark:stroke-zinc-800/40"
                                strokeWidth="2.5"
                                fill="none"
                            />
                            <circle
                                ref={circleRef}
                                cx="22"
                                cy="22"
                                r={radius}
                                className="stroke-amber-500 transition-[stroke-dashoffset] duration-150 ease-out"
                                strokeWidth="2.5"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference}
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>

                        {/* Yukarı İkonu */}
                        <FaChevronUp className="relative z-10 text-xs transition-transform duration-300 group-hover:-translate-y-0.5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
