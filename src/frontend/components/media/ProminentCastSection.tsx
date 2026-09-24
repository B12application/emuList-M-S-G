// src/frontend/components/media/ProminentCastSection.tsx
// Displays prominent cast members for a movie or TV series with click-to-filmography

import { useState, useEffect } from 'react';
import { FaUserTie, FaChevronRight, FaSpinner } from 'react-icons/fa';
import type { CastMember } from '../../../backend/types/media';
import { getTMDBProfileUrl, getMediaCreditsByImdbOrTitle } from '../../../backend/services/tmdbApi';
import { useLanguage } from '../../context/LanguageContext';
import { useAppSound } from '../../context/SoundContext';
import ActorFilmographyModal from './ActorFilmographyModal';

interface ProminentCastSectionProps {
    cast?: CastMember[];
    imdbId?: string;
    title?: string;
    type?: 'movie' | 'series';
    className?: string;
    maxDisplay?: number;
}

export default function ProminentCastSection({
    cast,
    imdbId,
    title,
    type = 'movie',
    className = '',
    maxDisplay = 10
}: ProminentCastSectionProps) {
    const { t, language } = useLanguage();
    const { playPop } = useAppSound();

    const [resolvedCast, setResolvedCast] = useState<CastMember[]>(cast || []);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedActor, setSelectedActor] = useState<CastMember | null>(null);

    // Sync or dynamically fetch cast if not available in stored item
    useEffect(() => {
        if (cast && cast.length > 0) {
            setResolvedCast(cast);
            return;
        }

        // If no cast in document, dynamically fetch via IMDb ID or Title
        if ((imdbId || title) && (type === 'movie' || type === 'series')) {
            let isMounted = true;
            setIsLoading(true);

            getMediaCreditsByImdbOrTitle(imdbId, title, type, language === 'tr' ? 'tr-TR' : 'en-US')
                .then(credits => {
                    if (isMounted && credits.length > 0) {
                        const formatted: CastMember[] = credits.slice(0, 15).map(c => ({
                            id: c.id,
                            name: c.name,
                            character: c.character,
                            profilePath: c.profile_path,
                            order: c.order,
                            popularity: c.popularity
                        }));
                        setResolvedCast(formatted);
                    }
                })
                .catch(err => {
                    console.warn('Oyuncular çekilemedi:', err);
                })
                .finally(() => {
                    if (isMounted) setIsLoading(false);
                });

            return () => {
                isMounted = false;
            };
        }
    }, [cast, imdbId, title, type, language]);

    if (isLoading) {
        return (
            <div className={`mt-4 py-3 flex items-center gap-2 text-xs text-stone-400 dark:text-zinc-500 ${className}`}>
                <FaSpinner className="animate-spin text-amber-500" size={12} />
                <span>{t('media.loadingCast') || 'Oyuncular yükleniyor...'}</span>
            </div>
        );
    }

    if (!resolvedCast || resolvedCast.length === 0) {
        return null;
    }

    const displayedCast = resolvedCast.slice(0, maxDisplay);

    return (
        <div className={`mt-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-black text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    <FaUserTie className="text-amber-500" size={12} />
                    <span>{t('media.prominentCast') || 'Öne Çıkan Oyuncular'}</span>
                </div>
                <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-medium">
                    {t('media.viewOtherMovies') || 'Filmografiyi görmek için dokunun'}
                </span>
            </div>

            {/* Horizontal Scrollable Cast Avatars */}
            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2.5 pt-0.5 px-0.5">
                {displayedCast.map((actor, idx) => {
                    const profileUrl = actor.profilePath ? getTMDBProfileUrl(actor.profilePath, 'w185') : '';

                    return (
                        <button
                            key={actor.id ? `actor-${actor.id}-${idx}` : `actor-name-${actor.name}-${idx}`}
                            type="button"
                            onClick={() => {
                                playPop();
                                setSelectedActor(actor);
                            }}
                            className="group flex flex-col items-center shrink-0 w-20 sm:w-22 text-center transition-all hover:-translate-y-1 active:scale-95 cursor-pointer focus:outline-none"
                            title={`${actor.name}${actor.character ? ` (${actor.character})` : ''}`}
                        >
                            {/* Avatar Portrait */}
                            <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800 border-2 border-stone-200/90 dark:border-zinc-700/80 group-hover:border-amber-500 dark:group-hover:border-amber-500 transition-colors shadow-xs group-hover:shadow-md mb-1.5">
                                {profileUrl ? (
                                    <img
                                        src={profileUrl}
                                        alt={actor.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.style.display = 'none';
                                            if (target.parentElement) {
                                                const fallback = document.createElement('div');
                                                fallback.className = 'w-full h-full flex items-center justify-center text-stone-400 dark:text-zinc-600 bg-amber-500/10';
                                                fallback.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>';
                                                target.parentElement.appendChild(fallback);
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-400 dark:text-zinc-600 bg-stone-100 dark:bg-zinc-800">
                                        <FaUserTie size={20} />
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <span className="text-[11px] font-bold text-stone-800 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 w-full">
                                {actor.name}
                            </span>

                            {/* Character */}
                            {actor.character && (
                                <span className="text-[9px] text-stone-500 dark:text-zinc-400 line-clamp-1 w-full italic">
                                    {actor.character}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Filmography Modal */}
            {selectedActor && (
                <ActorFilmographyModal
                    isOpen={!!selectedActor}
                    onClose={() => setSelectedActor(null)}
                    personId={selectedActor.id}
                    personName={selectedActor.name}
                    profilePath={selectedActor.profilePath}
                    characterRole={selectedActor.character}
                />
            )}
        </div>
    );
}
