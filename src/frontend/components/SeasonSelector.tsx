// src/frontend/components/SeasonSelector.tsx
// Dizi sezonlarını seçmek için interaktif komponent – teal accent

import { useState, useEffect } from 'react';
import { FaCheck, FaTv, FaCheckDouble, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

interface SeasonSelectorProps {
    totalSeasons: number;
    watchedSeasons: number[];
    onChange: (seasons: number[]) => void;
    disabled?: boolean;
    compact?: boolean;
}

export default function SeasonSelector({
    totalSeasons,
    watchedSeasons,
    onChange,
    disabled = false,
    compact = false
}: SeasonSelectorProps) {
    const { t } = useLanguage();
    const [selected, setSelected] = useState<number[]>(watchedSeasons);

    useEffect(() => {
        setSelected(watchedSeasons);
    }, [watchedSeasons]);

    const toggleSeason = (season: number) => {
        if (disabled) return;

        const newSelected = selected.includes(season)
            ? selected.filter(s => s !== season)
            : [...selected, season].sort((a, b) => a - b);

        setSelected(newSelected);
        onChange(newSelected);
    };

    const selectAll = () => {
        if (disabled) return;
        const allSeasons = Array.from({ length: totalSeasons }, (_, i) => i + 1);
        setSelected(allSeasons);
        onChange(allSeasons);
    };

    const clearAll = () => {
        if (disabled) return;
        setSelected([]);
        onChange([]);
    };

    const isCompleted = selected.length === totalSeasons;
    const progress = `${selected.length}/${totalSeasons}`;

    // Kompakt mod - sadece progress göster
    if (compact) {
        return (
            <div className="flex items-center gap-1.5">
                <FaTv className="text-teal-500" size={12} />
                <span className={`text-xs font-medium ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {isCompleted ? (
                        <span className="flex items-center gap-1">
                            <FaCheck size={10} />
                            {totalSeasons} {t('seasons.seasons')}
                        </span>
                    ) : (
                        `S${selected.length}/${totalSeasons}`
                    )}
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FaTv className="text-teal-500" />
                    {t('seasons.title')}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${isCompleted
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                    {isCompleted ? t('seasons.completed') : progress}
                </span>
            </div>

            {/* Season Buttons */}
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(season => {
                    const isWatched = selected.includes(season);
                    return (
                        <button
                            key={season}
                            type="button"
                            onClick={() => toggleSeason(season)}
                            disabled={disabled}
                            className={`
                relative w-10 h-10 rounded-xl font-medium text-sm transition-all duration-200
                ${isWatched
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
              `}
                            title={`${t('seasons.season')} ${season}`}
                        >
                            {season}
                            {isWatched && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <FaCheck size={8} className="text-white" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Action Buttons */}
            {!disabled && (
                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={selectAll}
                        disabled={isCompleted}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg
              bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300
              hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaCheckDouble size={12} />
                        {t('seasons.selectAll')}
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={selected.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg
              bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaTimes size={12} />
                        {t('seasons.clearAll')}
                    </button>
                </div>
            )}
        </div>
    );
}
