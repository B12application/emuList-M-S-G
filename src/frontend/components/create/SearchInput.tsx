// src/frontend/components/create/SearchInput.tsx
// Unified search component for all media types (Movies, Series, Books, Games)

import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaSpinner, FaTimes, FaFilm, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { searchMovies, getMovieById, normalizeRating } from '../../../backend/services/omdbApi';
import { searchTMDB, getTMDBDetails, getTMDBPosterUrl, normalizeTMDBRating } from '../../../backend/services/tmdbApi';
import { searchBooks, getBookById, normalizeBookRating, getBookCoverUrl, formatAuthors } from '../../../backend/services/googleBooksApi';
import { searchGames, getGameById, normalizeGameRating } from '../../../backend/services/rawgApi';
import ImageWithFallback from '../ui/ImageWithFallback';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

type MediaType = 'movie' | 'series' | 'game' | 'book';

interface SearchResult {
    id: string;
    title: string;
    image: string;
    year?: string;
    subtitle?: string;
    source?: 'tmdb' | 'omdb';
}

interface MediaDetails {
    title: string;
    image: string;
    description: string;
    rating: string;
    author?: string;
    genres: string[];
    totalSeasons?: number; // Diziler için toplam sezon sayısı
    releaseDate?: string; // Çıkış tarihi
    runtime?: string; // Süre (Film: "120 min")
    imdbId?: string; // IMDb ID
}

interface SearchInputProps {
    type: MediaType;
    onSelect: (details: MediaDetails) => void;
}

export default function SearchInput({ type, onSelect }: SearchInputProps) {
    const { t, language } = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiPreference, setApiPreference] = useState<'omdb' | 'tmdb'>('omdb');

    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (!query.trim()) {
            setResults([]);
            return;
        }

        timeoutRef.current = window.setTimeout(async () => {
            setIsSearching(true);
            setError(null);

            try {
                let searchResults: SearchResult[] = [];

                if (type === 'movie' || type === 'series') {
                    if (apiPreference === 'omdb') {
                        const omdbResults = await searchMovies(query, type === 'movie' ? 'movie' : 'series');
                        searchResults = (omdbResults || []).map(r => ({
                            id: r.imdbID,
                            title: r.Title,
                            image: r.Poster !== 'N/A' ? r.Poster : '',
                            year: r.Year,
                            source: 'omdb'
                        }));
                    } else {
                        const tmdbResults = await searchTMDB(query, type === 'movie' ? 'movie' : 'series');
                        searchResults = (tmdbResults || []).map(r => ({
                            id: String(r.id),
                            title: type === 'movie' ? (r.title || r.original_title || '') : (r.name || r.original_name || ''),
                            image: getTMDBPosterUrl(r.poster_path),
                            year: (r.release_date || r.first_air_date || '').split('-')[0],
                            source: 'tmdb'
                        }));
                    }
                } else if (type === 'book') {
                    const bookResults = await searchBooks(query);
                    searchResults = (bookResults || []).map(r => ({
                        id: r.id,
                        title: r.volumeInfo.title,
                        image: r.volumeInfo.imageLinks?.thumbnail || '',
                        subtitle: formatAuthors(r.volumeInfo.authors),
                        year: r.volumeInfo.publishedDate?.split('-')[0]
                    }));
                } else if (type === 'game') {
                    const gameResults = await searchGames(query);
                    searchResults = (gameResults || []).map(r => ({
                        id: String(r.id),
                        title: r.name,
                        image: r.background_image || '',
                        year: r.released?.split('-')[0]
                    }));
                }

                setResults(searchResults);
                setShowResults(searchResults.length > 0);
            } catch (err) {
                setError(err instanceof Error ? err.message : t('common.error'));
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [query, type, apiPreference, t]);

    const handleSelect = async (result: SearchResult) => {
        // Blur active input element immediately to close virtual keyboard on mobile devices
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setIsSearching(true);
        setShowResults(false);

        try {
            let details: MediaDetails;

            if (type === 'movie' || type === 'series') {
                if (result.source === 'tmdb') {
                    const data = await getTMDBDetails(result.id, type === 'movie' ? 'movie' : 'series');
                    const itemTitle = type === 'movie' ? (data.title || data.name || '') : (data.name || data.title || '');
                    const releaseDateStr = data.release_date || data.first_air_date || '';
                    const runtimeStr = data.runtime ? `${data.runtime} min` : (data.episode_run_time && data.episode_run_time[0] ? `${data.episode_run_time[0]} min` : '');

                    details = {
                        title: itemTitle,
                        image: getTMDBPosterUrl(data.poster_path),
                        description: data.overview || '',
                        rating: normalizeTMDBRating(data.vote_average),
                        genres: data.genres ? data.genres.map(g => g.name) : [],
                        totalSeasons: type === 'series' && data.number_of_seasons ? data.number_of_seasons : undefined,
                        releaseDate: releaseDateStr,
                        runtime: runtimeStr,
                        imdbId: data.external_ids?.imdb_id || undefined
                    };
                } else {
                    const data = await getMovieById(result.id);
                    details = {
                        title: data.Title,
                        image: data.Poster !== 'N/A' ? data.Poster : '',
                        description: data.Plot || '',
                        rating: data.imdbRating && data.imdbRating !== 'N/A' ? normalizeRating(data.imdbRating) : '0',
                        genres: data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ').map((g: string) => g.trim()) : [],
                        totalSeasons: type === 'series' && data.totalSeasons ? parseInt(data.totalSeasons, 10) : undefined,
                        releaseDate: data.Released && data.Released !== 'N/A' ? data.Released : '',
                        runtime: data.Runtime && data.Runtime !== 'N/A' ? data.Runtime : '',
                        imdbId: data.imdbID
                    };
                }
            } else if (type === 'book') {
                const data = await getBookById(result.id);
                details = {
                    title: data.volumeInfo.title,
                    image: getBookCoverUrl(data.volumeInfo.imageLinks),
                    description: data.volumeInfo.description || '',
                    rating: data.volumeInfo.averageRating ? normalizeBookRating(data.volumeInfo.averageRating) : '0',
                    author: formatAuthors(data.volumeInfo.authors),
                    genres: data.volumeInfo.categories || [],
                    releaseDate: data.volumeInfo.publishedDate || ''
                };
            } else {
                const data = await getGameById(Number(result.id));
                details = {
                    title: data.name,
                    image: data.background_image || '',
                    description: data.description_raw || data.description || '',
                    rating: data.rating ? normalizeGameRating(data.rating) : '0',
                    genres: data.genres ? data.genres.map((g: any) => g.name) : [],
                    releaseDate: data.released || ''
                };
            }

            onSelect(details);
            setQuery('');
            setResults([]);
            setShowResults(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.error'));
        } finally {
            setIsSearching(false);
        }
    };

    const getPlaceholder = () => {
        switch (type) {
            case 'movie': return t('create.searchPlaceholderMovie') || 'Film ara (örn. Inception)...';
            case 'series': return t('create.searchPlaceholderSeries') || 'Dizi ara (örn. Breaking Bad)...';
            case 'book': return t('create.searchPlaceholderBook') || 'Kitap veya yazar ara...';
            case 'game': return t('create.searchPlaceholderGame') || 'Oyun ara (örn. Witcher 3)...';
            default: return t('create.searchPlaceholder') || 'Aramak için yazın...';
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Input Box */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                    <FaSearch className="text-sm" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder={getPlaceholder()}
                    className="w-full h-12 pl-11 pr-11 rounded-2xl border border-stone-200 dark:border-zinc-700/90 bg-stone-50/80 dark:bg-zinc-950/70 text-stone-900 dark:text-white placeholder:text-stone-400 text-sm font-medium focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 dark:focus:border-amber-400 transition-all shadow-inner"
                />
                {query && !isSearching && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-stone-200/60 dark:bg-zinc-700/60 text-stone-500 hover:text-stone-800 dark:hover:text-white transition-colors"
                        aria-label="Aramayı Temizle"
                    >
                        <FaTimes className="text-[10px]" />
                    </button>
                )}
                {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <FaSpinner className="animate-spin text-amber-500 text-sm" />
                    </div>
                )}
            </div>

            {/* API Engine Selection Toggle - For Movies and Series */}
            {(type === 'movie' || type === 'series') && (
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 px-1">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-zinc-500 font-extrabold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                        {language === 'tr' ? 'Arama Kaynağı' : 'Search Source'}
                    </span>
                    <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-1 rounded-xl shadow-inner border border-stone-200/60 dark:border-zinc-700/60">
                        <button
                            type="button"
                            onClick={() => setApiPreference('omdb')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                apiPreference === 'omdb'
                                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                            OMDb <span className="text-[9px] opacity-75 font-normal">(IMDb)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setApiPreference('tmdb')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                apiPreference === 'tmdb'
                                    ? 'bg-sky-500 text-white shadow-sm'
                                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                            TMDb <span className="text-[9px] opacity-75 font-normal">(Modern)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Results Dropdown Floating Layer */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-stone-200/90 dark:border-zinc-700/90 rounded-2xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-zinc-500 flex items-center justify-between border-b border-stone-100 dark:border-zinc-800">
                        <span>Arama Sonuçları ({results.length})</span>
                        <span className="text-amber-500 font-bold">Önizlemek için tıkla</span>
                    </div>

                    {results.map((result) => (
                        <button
                            key={result.id}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-500/10 dark:hover:bg-amber-500/15 border border-transparent hover:border-amber-400/30 transition-all text-left group cursor-pointer"
                        >
                            <div className="w-11 h-15 rounded-lg overflow-hidden shrink-0 shadow-sm border border-stone-200/50 dark:border-zinc-700/50 bg-stone-100 dark:bg-zinc-800">
                                <ImageWithFallback
                                    src={result.image}
                                    alt={result.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                    {result.title}
                                </h4>
                                {result.subtitle && (
                                    <p className="text-xs text-stone-500 dark:text-zinc-400 truncate flex items-center gap-1">
                                        <FaUser className="text-[10px] opacity-60" /> {result.subtitle}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 pt-0.5">
                                    {result.year && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
                                            <FaCalendarAlt className="text-[8px]" /> {result.year}
                                        </span>
                                    )}
                                    {result.source && (
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                            result.source === 'tmdb' 
                                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' 
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        }`}>
                                            {result.source}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <p className="mt-2 text-xs font-semibold text-rose-500 dark:text-rose-400 px-1">
                    {error}
                </p>
            )}
        </div>
    );
}

