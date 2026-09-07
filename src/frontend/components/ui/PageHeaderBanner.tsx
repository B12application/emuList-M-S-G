import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

interface PageHeaderBannerProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    badge?: string;
    backTo?: string;
    backLabel?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * Standardized Page Information Header / Banner ("Üst Footer / Sayfa Başlığı")
 * Consistent with Ayarlar & İstatistikler page header design.
 */
export default function PageHeaderBanner({
    title,
    subtitle,
    icon,
    badge,
    backTo,
    backLabel,
    action,
    className = '',
}: PageHeaderBannerProps) {
    return (
        <div
            className={`bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 mb-8 rounded-2xl sm:rounded-3xl shadow-xs ${className}`}
        >
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Icon, Title, Subtitle */}
                    <div className="flex items-start gap-4">
                        {icon && (
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner text-xl mt-0.5">
                                {icon}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                                    {title}
                                </h1>
                                {badge && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300">
                                        {badge}
                                    </span>
                                )}
                            </div>
                            {subtitle && (
                                <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed font-medium">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions or Back Link */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        {action}
                        {backTo && (
                            <Link
                                to={backTo}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-xl transition-all text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
                            >
                                <FaArrowLeft className="text-xs" />
                                <span>{backLabel || 'Geri'}</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
