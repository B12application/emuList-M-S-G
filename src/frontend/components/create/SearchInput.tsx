// src/frontend/components/create/SearchInput.tsx
// Unified search component for all media types (Movies, Series, Books, Games)

import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { searchMovies, getMovieById, normalizeRating } from '../../../backend/services/omdbApi';
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
}

interface SearchInputProps {
    type: MediaType;
    onSelect: (details: MediaDetails) => void;
}

export default function SearchInput({ type, onSelect }: SearchInputProps) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    const omdbResults = await searchMovies(query, type === 'movie' ? 'movie' : 'series');
                    searchResults = omdbResults.map(r => ({
                        id: r.imdbID,
                        title: r.Title,
                        image: r.Poster !== 'N/A' ? r.Poster : '',
                        year: r.Year
                    }));
                } else if (type === 'book') {
                    const bookResults = await searchBooks(query);
                    searchResults = bookResults.map(r => ({
                        id: r.id,
                        title: r.volumeInfo.title,
                        image: r.volumeInfo.imageLinks?.thumbnail || '',
                        subtitle: formatAuthors(r.volumeInfo.authors),
                        year: r.volumeInfo.publishedDate?.split('-')[0]
                    }));
                } else if (type === 'game') {
                    const gameResults = await searchGames(query);
                    searchResults = gameResults.map(r => ({
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
    }, [query, type, t]);

    const handleSelect = async (result: SearchResult) => {
        setIsSearching(true);

        try {
            let details: MediaDetails;

            if (type === 'movie' || type === 'series') {
                const data = await getMovieById(result.id);
                details = {
                    title: data.Title,
                    image: data.Poster !== 'N/A' ? data.Poster : '',
                    description: data.Plot || '',
                    rating: data.imdbRating && data.imdbRating !== 'N/A' ? normalizeRating(data.imdbRating) : '0',
                    genres: data.Genre && data.Genre !== 'N/A' ? data.Genre.split(', ').map((g: string) => g.trim()) : [],
                    // Diziler için toplam sezon sayısını ekle
                    totalSeasons: type === 'series' && data.totalSeasons ? parseInt(data.totalSeasons, 10) : undefined,
                    // Çıkış tarihi
                    releaseDate: data.Released && data.Released !== 'N/A' ? data.Released : undefined
                };
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
                    releaseDate: data.volumeInfo.publishedDate || undefined
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
                    releaseDate: data.released || undefined
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
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder={getPlaceholder()}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {query && !isSearching && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes />
                    </button>
                )}
                {isSearching && (
                    <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
                )}
            </div>

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={result.id}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                            <ImageWithFallback
                                src={result.image}
                                alt={result.title}
                                className="w-10 h-14 object-cover rounded-lg shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">{result.title}</h4>
                                {result.subtitle && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
                                )}
                                {result.year && (
                                    <p className="text-xs text-gray-400">{result.year}</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
        </div>
    );
}
