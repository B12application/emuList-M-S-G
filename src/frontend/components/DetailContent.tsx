// src/components/DetailContent.tsx
import { useState } from 'react';
import type { MediaItem } from '../../backend/types/media';
import {
    FaStar, FaHeart, FaRegHeart, FaSpinner,
    FaCalendarAlt, FaClock, FaLanguage, FaTimes, FaCheck, FaTv, FaFilm
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useAppSound } from '../context/SoundContext';
import { db } from '../../backend/config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { createActivity } from '../../backend/services/activityService';
import { getSeriesProgress } from '../../backend/services/episodeTrackingService';
import { showMarqueeToast } from './MarqueeToast';
import ImageWithFallback from './ui/ImageWithFallback';

interface DetailContentProps {
    item: MediaItem;
    refetch: () => void;
    readOnly?: boolean;
}

export default function DetailContent({ item, refetch, readOnly = false }: DetailContentProps) {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { playPop } = useAppSound();

    // Çeviri state'leri
    const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isOverLimit, setIsOverLimit] = useState(false);

    // Favori state
    const [localIsFavorite, setLocalIsFavorite] = useState(item.isFavorite || false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    const isGame = item.type === 'game';
    const progress = item.type === 'series' ? getSeriesProgress(item) : { percentage: 0, totalWatched: 0, totalEpisodes: 0 };
    const seriesIsCompleted = item.type === 'series' &&
        (item.watched ||
            (item.watchedSeasons && item.totalSeasons && item.watchedSeasons.length === item.totalSeasons) ||
            progress.percentage === 100);
    const seriesHasWatchedEpisodes = item.type === 'series' &&
        item.watchedEpisodes &&
        Object.values(item.watchedEpisodes).some(eps => eps.length > 0);
    const seriesIsInProgress = item.type === 'series' && !seriesIsCompleted &&
        ((item.watchedSeasons && item.watchedSeasons.length > 0) || seriesHasWatchedEpisodes || progress.totalWatched > 0);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    };

    // ═══ ÇEVİRİ: İLK 500 KARAKTER ═══
    const handleTranslate = async () => {
        if (!item.description) return;
        if (translatedDesc) {
            setTranslatedDesc(null);
            setIsOverLimit(false);
            return;
        }
        setIsTranslating(true);
        setIsOverLimit(false);
        try {
            const descText = item.description;
            const CHAR_LIMIT = 500;
            if (descText.length <= CHAR_LIMIT) {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(descText)}&langpair=en|tr`);
                const data = await res.json();
                if (data?.responseData?.translatedText) {
                    setTranslatedDesc(data.responseData.translatedText);
                }
            } else {
                const firstPart = descText.substring(0, CHAR_LIMIT);
                const lastPart = descText.substring(CHAR_LIMIT);
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(firstPart)}&langpair=en|tr`);
                const data = await res.json();
                if (data?.responseData?.translatedText) {
                    setTranslatedDesc(data.responseData.translatedText + '\n\n' + '--- Kalan kısım orijinal dilde ---\n\n' + lastPart);
                    setIsOverLimit(true);
                }
            }
        } catch (error) {
            console.error("Çeviri başarısız oldu:", error);
        } finally {
            setIsTranslating(false);
        }
    };

    // Favori toggle
    const handleFavoriteToggle = async () => {
        if (readOnly) return;
        const newValue = !localIsFavorite;
        setLocalIsFavorite(newValue);
        setIsTogglingFavorite(true);
        try {
            await updateDoc(doc(db, "mediaItems", item.id), { isFavorite: newValue });
            if (user) {
                try {
                    await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', newValue ? 'favorite_added' : 'favorite_removed', item);
                } catch (activityError) { }
            }
            showMarqueeToast({ message: newValue ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'), type: 'favorite', mediaType: item.type as any });
            if (newValue) playPop();
            refetch();
        } catch (e) {
            showMarqueeToast({ message: t('toast.favoriteError'), type: 'error' });
            setLocalIsFavorite(!newValue);
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-2xl overflow-hidden">

            {/* ═══ ÜST: FOTOĞRAF + BAŞLIK YANYANA ═══ */}
            <div className="flex flex-col md:flex-row">

                {/* SOL: FOTOĞRAF - TAM KAPLAMA */}
                <div className="relative w-full md:w-2/5 lg:w-1/3 shrink-0 min-h-[300px] md:min-h-[400px] bg-slate-100 dark:bg-zinc-900">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover absolute inset-0"
                            onError={(e) => {
                                // Fallback: resim yüklenemezse
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                    target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                    const fallback = document.createElement('div');
                                    fallback.className = 'text-slate-400 dark:text-zinc-600';
                                    fallback.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="48" width="48" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                    target.parentElement.appendChild(fallback);
                                }
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-zinc-800 dark:to-zinc-900">
                            <FaFilm size={48} className="text-slate-400 dark:text-zinc-600" />
                        </div>
                    )}
                </div>

                {/* SAĞ: BAŞLIK + META + AÇIKLAMA */}
                <div className="flex-1 flex flex-col p-6 md:p-8">

                    {/* Başlık + Favori */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight">
                                {item.title}
                            </h2>
                            {item.type === 'book' && item.author && (
                                <p className="text-base md:text-lg font-medium text-slate-500 dark:text-zinc-400 italic mt-1">
                                    {item.author}
                                </p>
                            )}
                        </div>
                        {!readOnly && (
                            <button
                                onClick={handleFavoriteToggle}
                                disabled={isTogglingFavorite}
                                className={`shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg border transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${localIsFavorite
                                        ? 'bg-rose-500 text-white border-rose-400'
                                        : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 hover:text-rose-500'
                                    }`}
                            >
                                {localIsFavorite ? <FaHeart size={18} className="animate-pulse" /> : <FaRegHeart size={18} />}
                            </button>
                        )}
                    </div>

                    {/* Meta Bilgiler */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                            <FaStar size={10} /> {item.rating}
                        </span>
                        {item.myRating !== undefined && item.myRating > 0 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                ⭐ {item.myRating.toFixed(1)}
                            </span>
                        )}
                        {item.releaseDate && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                                <FaCalendarAlt size={10} /> {item.releaseDate}
                            </span>
                        )}
                        {item.runtime && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                                <FaClock size={10} /> {item.runtime}
                            </span>
                        )}
                    </div>

                    {/* Durum */}
                    <div className="mb-4">
                        {item.type === 'series' && item.totalSeasons ? (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${seriesIsCompleted
                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                    : seriesIsInProgress
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                        : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                }`}>
                                {seriesIsCompleted ? <FaCheck size={10} /> : seriesIsInProgress ? <FaTv size={10} /> : <FaTimes size={10} />}
                                {seriesIsCompleted ? t('media.watched') : seriesIsInProgress ? t('media.inProgress') : t('media.notWatched')}
                                <span className="ml-1 opacity-75">({item.watchedSeasons?.length || 0}/{item.totalSeasons} S)</span>
                            </span>
                        ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${item.watched
                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                    : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                }`}>
                                {item.watched ? <FaCheck size={10} /> : <FaTimes size={10} />}
                                {item.watched ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched')) : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))}
                            </span>
                        )}
                    </div>

                    {/* Türler / Taglar */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.genre && item.genre.split(', ').slice(0, 4).map((g, idx) => (
                            <span key={`g-${idx}`} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                                {g.trim()}
                            </span>
                        ))}
                        {item.tags && item.tags.slice(0, 4).map((tag, idx) => (
                            <span key={`t-${idx}`} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* ═══ AÇIKLAMA - EN ÖNEMLİ KISIM ═══ */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                {t('common.description') || 'Açıklama'}
                            </h3>
                            {item.description && item.description.length > 500 && !isOverLimit && !translatedDesc && (
                                <span className="text-[10px] text-amber-500 flex items-center gap-1">
                                    ⚠️ {item.description.length} karakter
                                </span>
                            )}
                        </div>

                        {item.description && (
                            <div className="flex justify-end mb-3">
                                <button
                                    onClick={handleTranslate}
                                    disabled={isTranslating}
                                    className="flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors disabled:opacity-50"
                                >
                                    {isTranslating ? <FaSpinner className="animate-spin" size={12} /> : <FaLanguage size={14} />}
                                    {isTranslating ? 'Çevriliyor...' : translatedDesc ? 'Orijinali Göster' : 'Türkçeye Çevir'}
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-48 md:max-h-64">
                            <p className="text-sm md:text-base text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                                {translatedDesc || item.description || t("card.noDescription")}
                            </p>
                            {isOverLimit && (
                                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                        ⚠️ Metin 500 karakterden uzun olduğu için yalnızca ilk 500 karakter çevrildi. Kalan kısım orijinal dilinde gösterilmektedir.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Eklenme Tarihi */}
                        {item.addedAt && (
                            <p className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                <FaCalendarAlt size={9} />
                                Eklenme: {formatDate(item.addedAt)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ IMDb BUTONU ═══ */}
            {item.imdbId && (
                <div className="px-6 md:px-8 pb-6 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <a
                        href={`https://www.imdb.com/title/${item.imdbId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#f5c518] hover:bg-[#e2b616] text-black font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FaFilm size={16} /> IMDb'de Görüntüle
                    </a>
                </div>
            )}
        </div>
    );
}