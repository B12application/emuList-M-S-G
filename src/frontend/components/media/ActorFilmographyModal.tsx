// src/frontend/components/media/ActorFilmographyModal.tsx
// Modal displaying an actor's filmography with direct "Add to Library" action

import { useState, useEffect, useMemo } from 'react';
import {
    FaTimes, FaFilm, FaTv, FaStar, FaPlus, FaCheck,
    FaSpinner, FaCalendarAlt, FaUserTie
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useAppSound } from '../../context/SoundContext';
import { useQueryClient } from '@tanstack/react-query';
import {
    getPersonCombinedCredits,
    getTMDBPosterUrl,
    getTMDBProfileUrl,
    normalizeTMDBRating,
    type TMDBPersonCreditItem
} from '../../../backend/services/tmdbApi';
import { useUserLibraryLookup, addMediaFromTMDB } from '../../services/userLibraryService';
import { showMarqueeToast } from '../MarqueeToast';
import ImageWithFallback from '../ui/ImageWithFallback';
import Portal from '../ui/Portal';
import toast from 'react-hot-toast';

interface ActorFilmographyModalProps {
    isOpen: boolean;
    onClose: () => void;
    personId: number;
    personName: string;
    profilePath?: string | null;
    characterRole?: string;
}

type MediaTypeFilter = 'all' | 'movie' | 'tv';
type SortOption = 'popularity' | 'newest' | 'rating';

export default function ActorFilmographyModal({
    isOpen,
    onClose,
    personId,
    personName,
    profilePath,
    characterRole
}: ActorFilmographyModalProps) {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { playSuccess, playPop } = useAppSound();
    const queryClient = useQueryClient();

    const [credits, setCredits] = useState<TMDBPersonCreditItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mediaFilter, setMediaFilter] = useState<MediaTypeFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('popularity');
    const [addingMap, setAddingMap] = useState<Record<number, boolean>>({});

    const { isItemInLibrary, refetch: refetchLibrary } = useUserLibraryLookup();

    // Fetch actor credits on modal open
    useEffect(() => {
        if (!isOpen || !personId) return;

        let isMounted = true;
        setIsLoading(true);

        const fetchCredits = async () => {
            try {
                // If personId is positive (real TMDb ID)
                if (personId > 0) {
                    const data = await getPersonCombinedCredits(personId, language === 'tr' ? 'tr-TR' : 'en-US');
                    if (isMounted) {
                        setCredits(data);
                    }
                } else {
                    setCredits([]);
                }
            } catch (err) {
                console.error('Filmografi yüklenemedi:', err);
                if (isMounted) setCredits([]);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchCredits();

        return () => {
            isMounted = false;
        };
    }, [isOpen, personId, language]);

    // Filter and Sort credits
    const filteredCredits = useMemo(() => {
        let list = credits.filter(c => {
            if (mediaFilter === 'movie') return c.media_type === 'movie';
            if (mediaFilter === 'tv') return c.media_type === 'tv';
            return true;
        });

        // Deduplicate items with identical id and media_type
        const seen = new Set<string>();
        list = list.filter(item => {
            const key = `${item.media_type}-${item.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sort items
        return list.sort((a, b) => {
            if (sortBy === 'popularity') {
                return (b.popularity || 0) - (a.popularity || 0);
            }
            if (sortBy === 'newest') {
                const dateA = a.release_date || a.first_air_date || '0000';
                const dateB = b.release_date || b.first_air_date || '0000';
                return dateB.localeCompare(dateA);
            }
            if (sortBy === 'rating') {
                return (b.vote_average || 0) - (a.vote_average || 0);
            }
            return 0;
        });
    }, [credits, mediaFilter, sortBy]);

    // Handle Quick Add to Library
    const handleQuickAdd = async (item: TMDBPersonCreditItem) => {
        if (!user) {
            toast.error(t('auth.loginRequired') || 'Lütfen giriş yapın.');
            return;
        }

        const itemTitle = item.title || item.name || 'İçerik';
        setAddingMap(prev => ({ ...prev, [item.id]: true }));

        try {
            await addMediaFromTMDB(user.uid, user.displayName || 'User', user.photoURL || '', item);
            
            // Invalidate queries so lists and duplicate checkers update immediately
            queryClient.invalidateQueries({ queryKey: ['userAllLibraryItems', user.uid] });
            queryClient.invalidateQueries({ queryKey: ['media', user.uid] });
            queryClient.invalidateQueries({ queryKey: ['mediaStats', user.uid] });
            refetchLibrary();

            playSuccess();
            showMarqueeToast({
                message: `${itemTitle} • ${t('media.addedToLibrary') || 'Kütüphaneye eklendi! 🎉'}`,
                type: 'watched',
                mediaType: item.media_type === 'tv' ? 'series' : 'movie'
            });
        } catch (error) {
            console.error('Kütüphaneye eklenirken hata oluştu:', error);
            toast.error(t('create.errorAdding') || 'Eklenirken bir hata oluştu');
        } finally {
            setAddingMap(prev => ({ ...prev, [item.id]: false }));
        }
    };

    if (!isOpen) return null;

    const movieCount = credits.filter(c => c.media_type === 'movie').length;
    const tvCount = credits.filter(c => c.media_type === 'tv').length;

    return (
        <Portal>
            <div className="fixed inset-0 bg-stone-900/75 dark:bg-black/85 backdrop-blur-md z-[10050] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
                <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* ═══ MODAL HEADER ═══ */}
                <div className="px-5 sm:px-7 py-4 border-b border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-4 bg-stone-50/80 dark:bg-zinc-900/80 shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                        {profilePath ? (
                            <img
                                src={getTMDBProfileUrl(profilePath, 'w185')}
                                alt={personName}
                                className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl object-cover border-2 border-amber-500/30 shadow-md shrink-0"
                            />
                        ) : (
                            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                <FaUserTie size={22} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white truncate">
                                {personName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                                    {t('media.actorFilmography') || 'Filmografisi'}
                                </span>
                                {characterRole && (
                                    <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 truncate max-w-[200px]">
                                        {characterRole}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            playPop();
                            onClose();
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                        title={t('actions.cancel') || 'Kapat'}
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* ═══ FILTER & SORT BAR ═══ */}
                <div className="px-5 sm:px-7 py-3 border-b border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/40 dark:bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    {/* Media Type Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/60 dark:bg-zinc-800/60 text-xs font-bold">
                        <button
                            onClick={() => setMediaFilter('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                mediaFilter === 'all'
                                    ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs'
                                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                            {t('media.filterAll') || 'Tümü'} ({credits.length})
                        </button>
                        <button
                            onClick={() => setMediaFilter('movie')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                mediaFilter === 'movie'
                                    ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs'
                                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                            <FaFilm size={11} />
                            <span>{t('media.filterMovies') || 'Filmler'} ({movieCount})</span>
                        </button>
                        <button
                            onClick={() => setMediaFilter('tv')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                mediaFilter === 'tv'
                                    ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs'
                                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                            <FaTv size={11} />
                            <span>{t('media.filterSeries') || 'Diziler'} ({tvCount})</span>
                        </button>
                    </div>

                    {/* Sorting */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                            <option value="popularity">{t('media.sortByPopularity') || 'En Popüler'}</option>
                            <option value="newest">{t('media.sortByYear') || 'En Yeni'}</option>
                            <option value="rating">{t('media.sortByRating') || 'En Yüksek Puan'}</option>
                        </select>
                    </div>
                </div>

                {/* ═══ SCROLLABLE CONTENT BODY ═══ */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3 text-stone-400 dark:text-zinc-500">
                            <FaSpinner className="animate-spin text-amber-500" size={32} />
                            <p className="text-sm font-semibold">{t('media.loadingCast') || 'Filmografi yükleniyor...'}</p>
                        </div>
                    ) : filteredCredits.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-2 text-stone-400 dark:text-zinc-500">
                            <FaFilm size={36} className="opacity-40" />
                            <p className="text-sm font-semibold">{t('media.noWorksFound') || 'Kayıtlı yapım bulunamadı.'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                            {filteredCredits.map((item) => {
                                const title = item.title || item.name || 'Untitled';
                                const originalTitle = item.original_title || item.original_name;
                                const year = (item.release_date || item.first_air_date || '').split('-')[0];
                                const inLibrary = isItemInLibrary(title, originalTitle);
                                const isAdding = !!addingMap[item.id];

                                return (
                                    <div
                                        key={`${item.media_type}-${item.id}`}
                                        className="bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 p-2.5 flex flex-col justify-between group hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all shadow-xs hover:shadow-md"
                                    >
                                        {/* Poster and Badges */}
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-stone-200 dark:bg-zinc-900 mb-2">
                                            {item.poster_path ? (
                                                <ImageWithFallback
                                                    src={getTMDBPosterUrl(item.poster_path, 'w342')}
                                                    alt={title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-stone-400 dark:text-zinc-600 bg-stone-100 dark:bg-zinc-900">
                                                    {item.media_type === 'tv' ? <FaTv size={28} /> : <FaFilm size={28} />}
                                                    <span className="text-[10px] text-center font-bold mt-2 line-clamp-2">{title}</span>
                                                </div>
                                            )}

                                            {/* Rating Badge */}
                                            {item.vote_average > 0 && (
                                                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-black flex items-center gap-1 shadow-sm">
                                                    <FaStar size={8} />
                                                    <span>{normalizeTMDBRating(item.vote_average)}</span>
                                                </div>
                                            )}

                                            {/* Type Badge */}
                                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                {item.media_type === 'tv' ? <FaTv size={9} /> : <FaFilm size={9} />}
                                                <span>{item.media_type === 'tv' ? t('media.series') || 'Dizi' : t('media.movie') || 'Film'}</span>
                                            </div>

                                            {/* Year Badge */}
                                            {year && (
                                                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-stone-300 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                                    <FaCalendarAlt size={8} />
                                                    <span>{year}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 flex flex-col mb-2.5">
                                            <h3
                                                className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                                                title={title}
                                            >
                                                {title}
                                            </h3>
                                            {item.character && (
                                                <p
                                                    className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-1 italic mt-0.5"
                                                    title={item.character}
                                                >
                                                    {item.character}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action: Already in library vs Add */}
                                        {inLibrary ? (
                                            <div className="w-full py-2 px-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 select-none">
                                                <FaCheck size={10} />
                                                <span className="truncate">{t('media.inLibrary') || 'Kütüphanende'}</span>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleQuickAdd(item)}
                                                disabled={isAdding}
                                                className="w-full py-2 px-2.5 rounded-xl bg-stone-900 hover:bg-amber-500 text-white dark:bg-zinc-800 dark:hover:bg-amber-500 text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                            >
                                                {isAdding ? (
                                                    <FaSpinner className="animate-spin" size={11} />
                                                ) : (
                                                    <FaPlus size={10} className="text-amber-400" />
                                                )}
                                                <span className="truncate">{t('media.addToLibrary') || 'Kütüphaneye Ekle'}</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ═══ STICKY FOOTER ═══ */}
                <div className="px-5 sm:px-7 py-3.5 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
                    <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                        {filteredCredits.length} {t('media.otherWorks') || 'yapım listeleniyor'}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            playPop();
                            onClose();
                        }}
                        className="px-5 py-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                        {t('actions.cancel') || 'Kapat'}
                    </button>
                </div>
            </div>
        </div>
    </Portal>
);
}
