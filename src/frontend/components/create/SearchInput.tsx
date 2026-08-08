// src/frontend/components/create/SearchInput.tsx
// Unified search component for all media types (Movies, Series, Books, Games)

import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
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
        setIsSearching(true);

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
                    // Kitaplar için yayın tarihi
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
                    // Oyunlar için çıkış tarihi
                    releaseDate: data.released || ''
                };
            }

            onSelect(details);
            setQuery('');
            setResults([]);
            setShowResults(false);
            toast.success(t('create.loaded'));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.error'));
        } finally {
            setIsSearching(false);
        }
    };



    const getPlaceholder = () => {
        switch (type) {
            case 'movie': return t('create.searchPlaceholderMovie');
            case 'series': return t('create.searchPlaceholderSeries');
            case 'book': return t('create.searchPlaceholderBook');
            case 'game': return t('create.searchPlaceholderGame');
            default: return t('create.searchPlaceholder');
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder={getPlaceholder()}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {query && !isSearching && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                        <FaTimes />
                    </button>
                )}
                {isSearching && (
                    <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
                )}
            </div>

            {/* API Selection Toggle - Premium Segmented Control */}
            {(type === 'movie' || type === 'series') && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 px-1">
                    <span className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-zinc-500 font-bold ml-1">
                        {language === 'tr' ? 'Arama Motoru:' : 'Search Engine:'}
                    </span>
                    <div className="flex items-center bg-stone-100/80 dark:bg-zinc-800/80 p-1 rounded-xl shadow-inner border border-stone-200/50 dark:border-zinc-700/50 backdrop-blur-md w-fit">
                        <button
                            type="button"
                            onClick={() => setApiPreference('omdb')}
                            className={`relative px-4 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all duration-300 ease-out flex items-center gap-1.5
                                ${apiPreference === 'omdb' 
                                    ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-stone-200/50 dark:ring-zinc-600 scale-[1.02]' 
                                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-zinc-700/50'}`}
                        >
                            {apiPreference === 'omdb' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>}
                            OMDb <span className="text-[9px] opacity-60 font-medium">(Klasik)</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setApiPreference('tmdb')}
                            className={`relative px-4 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all duration-300 ease-out flex items-center gap-1.5
                                ${apiPreference === 'tmdb' 
                                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-stone-200/50 dark:ring-zinc-600 scale-[1.02]' 
                                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-zinc-700/50'}`}
                        >
                            {apiPreference === 'tmdb' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>}
                            TMDb <span className="text-[9px] opacity-60 font-medium">(Modern)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-stone-50 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={result.id}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-stone-100 dark:hover:bg-zinc-700 transition text-left border-b border-stone-200 dark:border-zinc-700 last:border-b-0"
                        >
                            <ImageWithFallback
                                src={result.image}
                                alt={result.title}
                                className="w-10 h-14 object-cover rounded-lg shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-stone-900 dark:text-white truncate">{result.title}</h4>
                                {result.subtitle && (
                                    <p className="text-sm text-stone-500 dark:text-zinc-400 truncate">{result.subtitle}</p>
                                )}
                                {result.year && (
                                    <p className="text-xs text-stone-400">{result.year}</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
        </div>
    );
}
