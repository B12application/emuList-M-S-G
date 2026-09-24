// src/components/DetailContent.tsx
import { useState, useEffect } from 'react';
import type { MediaItem } from '../../backend/types/media';
import {
    FaStar, FaHeart, FaRegHeart, FaSpinner,
    FaCalendarAlt, FaClock, FaLanguage, FaTimes, FaCheck, FaTv, FaFilm,
    FaCheckDouble, FaPen, FaStickyNote, FaGamepad, FaBook
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useAppSound } from '../context/SoundContext';
import { db } from '../../backend/config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { createActivity } from '../../backend/services/activityService';
import { getSeriesProgress } from '../../backend/services/episodeTrackingService';
import { showMarqueeToast } from './MarqueeToast';
import EditModal from './EditModal';
import ProminentCastSection from './media/ProminentCastSection';

interface DetailContentProps {
    item: MediaItem;
    refetch: () => void;
    readOnly?: boolean;
}

export default function DetailContent({ item, refetch, readOnly = false }: DetailContentProps) {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { playPop, playSuccess } = useAppSound();

    // Çeviri state'leri
    const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isOverLimit, setIsOverLimit] = useState(false);

    // Kütüphanede olma durumu
    const isInLibrary = !readOnly && !!item.id && !item.id.startsWith('tmdb-temp-');

    // Favori state
    const [localIsFavorite, setLocalIsFavorite] = useState(item.isFavorite || false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    // İzleme state
    const [localWatched, setLocalWatched] = useState(item.watched || false);
    const [isTogglingWatched, setIsTogglingWatched] = useState(false);

    // Düzenleme modalı state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        setLocalWatched(item.watched || false);
        setLocalIsFavorite(item.isFavorite || false);
    }, [item.id, item.watched, item.isFavorite]);

    const isGame = item.type === 'game';
    const progress = item.type === 'series' ? getSeriesProgress(item) : { percentage: 0, totalWatched: 0, totalEpisodes: 0 };
    const seriesIsCompleted = item.type === 'series' &&
        (localWatched ||
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
        if (readOnly || !isInLibrary) return;
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

    // İzleme Durumu Toggle (Sadece kütüphanedeyse)
    const handleToggleWatched = async () => {
        if (!isInLibrary || isTogglingWatched) return;
        const newValue = !localWatched;
        setLocalWatched(newValue);
        setIsTogglingWatched(true);
        try {
            await updateDoc(doc(db, "mediaItems", item.id), { watched: newValue });
            if (newValue && user) {
                try {
                    await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', 'media_watched', item);
                } catch (activityError) { }
            }
            const statusMessage = newValue
                ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
                : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'));

            showMarqueeToast({
                message: `${item.title} • ${statusMessage}`,
                type: newValue ? 'watched' : 'not-watched',
                mediaType: item.type as any,
            });
            if (newValue) playSuccess();
            else playPop();
            refetch();
        } catch (e) {
            console.error('İzlenme durumu güncelleme hatası:', e);
            showMarqueeToast({ message: t('toast.updateError') || 'Güncelleme hatası', type: 'error' });
            setLocalWatched(!newValue);
        } finally {
            setIsTogglingWatched(false);
        }
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden">
            {/* ═══ ÜST: FOTOĞRAF + BAŞLIK YANYANA ═══ */}
            <div className="flex flex-col md:flex-row">
                {/* SOL: FOTOĞRAF */}
                <div className="relative w-full md:w-2/5 lg:w-1/3 shrink-0 h-52 md:h-auto md:min-h-[420px] bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                    {item.image ? (
                        <>
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover md:absolute md:inset-0"
                                onError={(e) => {
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
                            {/* Gradient Overlay for Mobile */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent md:hidden pointer-events-none" />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-zinc-800 dark:to-zinc-900">
                            {item.type === 'series' ? (
                                <FaTv size={48} className="text-slate-400 dark:text-zinc-600" />
                            ) : item.type === 'game' ? (
                                <FaGamepad size={48} className="text-slate-400 dark:text-zinc-600" />
                            ) : item.type === 'book' ? (
                                <FaBook size={48} className="text-slate-400 dark:text-zinc-600" />
                            ) : (
                                <FaFilm size={48} className="text-slate-400 dark:text-zinc-600" />
                            )}
                        </div>
                    )}
                </div>

                {/* SAĞ: BAŞLIK + META + AÇIKLAMA */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 -mt-10 md:mt-0 relative z-10">
                    {/* Başlık + Favori */}
                    <div className="flex items-start justify-between gap-4 mb-3 mt-2 md:mt-0">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white md:text-slate-900 dark:text-white leading-tight drop-shadow-md md:drop-shadow-none">
                                {item.title}
                            </h2>
                            {item.type === 'book' && item.author && (
                                <p className="text-sm md:text-base font-semibold text-slate-200 md:text-slate-500 dark:text-zinc-400 italic mt-1 drop-shadow-sm md:drop-shadow-none">
                                    {item.author}
                                </p>
                            )}
                        </div>
                        {isInLibrary && (
                            <button
                                onClick={handleFavoriteToggle}
                                disabled={isTogglingFavorite}
                                className={`shrink-0 flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-2xl shadow-lg border transition-all hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer ${
                                    localIsFavorite
                                        ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20'
                                        : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700 hover:text-rose-500'
                                }`}
                                title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
                            >
                                {localIsFavorite ? <FaHeart size={16} className="animate-pulse" /> : <FaRegHeart size={16} />}
                            </button>
                        )}
                    </div>

                    {/* Meta Bilgiler */}
                    <div className="flex flex-wrap items-center gap-2 mb-3.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-black border border-amber-500/20">
                            <FaStar size={10} /> {item.rating}
                        </span>
                        {item.myRating !== undefined && item.myRating > 0 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-500/20">
                                ⭐ {item.myRating.toFixed(1)}
                            </span>
                        )}
                        {item.releaseDate && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl">
                                <FaCalendarAlt size={10} /> {item.releaseDate}
                            </span>
                        )}
                        {item.runtime && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl">
                                <FaClock size={10} /> {item.runtime}
                            </span>
                        )}
                    </div>

                    {/* Durum Rozeti */}
                    <div className="mb-4">
                        {item.type === 'series' && item.totalSeasons ? (
                            <span
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                                    seriesIsCompleted
                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800/60'
                                        : seriesIsInProgress
                                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/60'
                                          : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300/60 dark:border-rose-800/60'
                                }`}
                            >
                                {seriesIsCompleted ? <FaCheck size={10} /> : seriesIsInProgress ? <FaTv size={10} /> : <FaTimes size={10} />}
                                <span>{seriesIsCompleted ? t('media.watched') : seriesIsInProgress ? t('media.inProgress') : t('media.notWatched')}</span>
                                <span className="ml-1 opacity-75">({item.watchedSeasons?.length || 0}/{item.totalSeasons} S)</span>
                            </span>
                        ) : isInLibrary ? (
                            <button
                                type="button"
                                onClick={handleToggleWatched}
                                disabled={isTogglingWatched}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
                                    localWatched
                                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                                        : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-200'
                                }`}
                                title={localWatched ? t('actions.markUnwatched') : t('actions.markWatched')}
                            >
                                {localWatched ? <FaCheck size={10} /> : <FaTimes size={10} />}
                                <span>
                                    {localWatched
                                        ? isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched')
                                        : isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched')}
                                </span>
                                <span className="text-[10px] font-normal opacity-75 ml-1">({t('actions.toggleStatus') || 'Değiştir'})</span>
                            </button>
                        ) : (
                            <span
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                                    item.watched
                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300/60 dark:border-emerald-800/60'
                                        : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300/60 dark:border-rose-800/60'
                                }`}
                            >
                                {item.watched ? <FaCheck size={10} /> : <FaTimes size={10} />}
                                <span>
                                    {item.watched
                                        ? isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched')
                                        : isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched')}
                                </span>
                            </span>
                        )}
                    </div>

                    {/* Türler / Taglar */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.genre && item.genre.split(', ').slice(0, 4).map((g, idx) => (
                            <span key={`g-${idx}`} className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                                {g.trim()}
                            </span>
                        ))}
                        {item.tags && item.tags.slice(0, 4).map((tag, idx) => (
                            <span key={`t-${idx}`} className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-500/10 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* ═══ AÇIKLAMA ═══ */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                {t('common.description') || 'Açıklama'}
                            </h3>
                            {item.description && item.description.length > 500 && !isOverLimit && !translatedDesc && (
                                <span className="text-[10px] text-amber-500 flex items-center gap-1 font-semibold">
                                    ⚠️ {item.description.length} karakter
                                </span>
                            )}
                        </div>

                        {item.description && (
                            <div className="flex justify-end mb-2.5">
                                <button
                                    onClick={handleTranslate}
                                    disabled={isTranslating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors disabled:opacity-50 border border-sky-200 dark:border-sky-800 cursor-pointer"
                                >
                                    {isTranslating ? <FaSpinner className="animate-spin" size={11} /> : <FaLanguage size={13} />}
                                    <span>{isTranslating ? 'Çevriliyor...' : translatedDesc ? 'Orijinali Göster' : 'Türkçeye Çevir'}</span>
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-48 md:max-h-64">
                            <p className="text-sm md:text-base text-slate-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                                {translatedDesc || item.description || t("card.noDescription")}
                            </p>
                            {isOverLimit && (
                                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                        ⚠️ Metin 500 karakterden uzun olduğu için yalnızca ilk 500 karakter çevrildi. Kalan kısım orijinal dilinde gösterilmektedir.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Kişisel Not (varsa) */}
                        {item.myNote && (
                            <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black mb-1">
                                    <FaStickyNote size={11} />
                                    <span>{t('personal.myNote') || 'Kişisel Notum'}</span>
                                </div>
                                <p className="text-stone-800 dark:text-zinc-200 italic leading-relaxed whitespace-pre-line font-medium">
                                    {item.myNote}
                                </p>
                            </div>
                        )}

                        {/* Öne Çıkan Oyuncular (Film ve Diziler) */}
                        {(item.type === 'movie' || item.type === 'series') && (
                            <ProminentCastSection
                                cast={item.cast}
                                imdbId={item.imdbId}
                                title={item.title}
                                type={item.type}
                            />
                        )}

                        {/* Eklenme Tarihi */}
                        {item.addedAt && (
                            <p className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 font-medium">
                                <FaCalendarAlt size={9} />
                                Eklenme: {formatDate(item.addedAt)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ AKSİYON ÇUBUĞU ═══ */}
            {isInLibrary ? (
                /* Kütüphanede olan içerik için: İzleme Butonları + Düzenle + IMDb */
                <div className="px-4 sm:px-6 md:px-8 py-4 border-t border-slate-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-900/50 flex flex-wrap items-center gap-2.5">
                    {/* İzleme Durumu Toggle Butonu */}
                    <button
                        type="button"
                        onClick={handleToggleWatched}
                        disabled={isTogglingWatched}
                        className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                            localWatched
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:shadow-emerald-500/25'
                                : 'bg-stone-900 hover:bg-emerald-600 text-white dark:bg-zinc-800 dark:hover:bg-emerald-600 shadow-black/20'
                        }`}
                    >
                        {localWatched ? (
                            <>
                                <FaCheckDouble size={14} />
                                <span>{isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched')}</span>
                            </>
                        ) : (
                            <>
                                <FaCheck size={13} />
                                <span>{isGame ? t('actions.markPlayed') : item.type === 'book' ? t('actions.markRead') : t('actions.markWatched')}</span>
                            </>
                        )}
                    </button>

                    {/* Düzenle Butonu */}
                    <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white hover:bg-stone-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 border border-stone-200 dark:border-zinc-700 font-bold text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
                        title={t('actions.edit')}
                    >
                        <FaPen size={12} className="text-amber-500" />
                        <span>{t('actions.edit')}</span>
                    </button>

                    {/* IMDb Butonu (varsa) */}
                    {item.imdbId && (
                        <a
                            href={`https://www.imdb.com/title/${item.imdbId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#f5c518] hover:bg-[#e2b616] text-black font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0"
                            title="IMDb"
                        >
                            <FaFilm size={13} />
                            <span className="hidden sm:inline">IMDb</span>
                        </a>
                    )}
                </div>
            ) : (
                /* Kütüphanede DEĞİLSE: Sadece IMDb Görüntüle aktif */
                item.imdbId && (
                    <div className="px-6 md:px-8 py-4 border-t border-slate-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-900/50">
                        <a
                            href={`https://www.imdb.com/title/${item.imdbId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#f5c518] hover:bg-[#e2b616] text-black font-black text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer"
                        >
                            <FaFilm size={16} /> IMDb'de Görüntüle
                        </a>
                    </div>
                )
            )}

            {/* Düzenleme Modalı */}
            {isInLibrary && (
                <EditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    item={item}
                    refetch={refetch}
                />
            )}
        </div>
    );
}