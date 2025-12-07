// src/components/AdminRecommendationsPanel.tsx
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { FaSearch, FaPlus, FaTrash, FaTimes, FaStar, FaLock, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { Recommendation, RecommendationCategory, RecommendationInput } from '../types/recommendation';
import {
    fetchRecommendations,
    addRecommendation,
    deleteRecommendation,
    groupRecommendationsByCategory
} from '../services/recommendationService';
import toast from 'react-hot-toast';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || 'ZKU7SObBkeNzMicltUKJjo6ybHH2';
const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;

interface AdminRecommendationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

interface SearchResult {
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
    imdbRating?: string;
}

export default function AdminRecommendationsPanel({ isOpen, onClose, onUpdate }: AdminRecommendationsPanelProps) {
    const { t } = useLanguage();
    const { user } = useAuth();

    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory>('most-watched-2025');

    // Check if user is admin
    const isAdmin = user?.uid === ADMIN_UID;

    // Fetch existing recommendations
    useEffect(() => {
        if (isAdmin && isOpen) {
            loadRecommendations();
        }
    }, [isAdmin, isOpen]);

    const loadRecommendations = async () => {
        setLoading(true);
        const recs = await fetchRecommendations();
        setRecommendations(recs);
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await fetch(
                `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();

            if (data.Response === 'True') {
                // Fetch detailed info for each result to get rating
                const detailedResults = await Promise.all(
                    data.Search.slice(0, 6).map(async (item: SearchResult) => {
                        const detailResponse = await fetch(
                            `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${item.imdbID}`
                        );
                        const detailData = await detailResponse.json();
                        return {
                            ...item,
                            imdbRating: detailData.imdbRating || 'N/A'
                        };
                    })
                );
                setSearchResults(detailedResults);
            } else {
                setSearchResults([]);
                toast.error(t('create.noResults'));
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error(t('home.adminRecError'));
        }
        setSearching(false);
    };

    const handleAddRecommendation = async (result: SearchResult) => {
        const recData: RecommendationInput = {
            title: result.Title,
            rating: result.imdbRating || 'N/A',
            image: result.Poster !== 'N/A' ? result.Poster : '',
            type: result.Type === 'series' ? 'series' : 'movie',
            category: selectedCategory,
            description: `${result.Year}`
        };

        const id = await addRecommendation(recData);
        if (id) {
            toast.success(t('home.adminRecAdded'));
            loadRecommendations();
            onUpdate();
            setSearchQuery('');
            setSearchResults([]);
        } else {
            toast.error(t('home.adminRecError'));
        }
    };

    const handleDelete = async (id: string) => {
        const success = await deleteRecommendation(id);
        if (success) {
            toast.success(t('home.adminRecDeleted'));
            loadRecommendations();
            onUpdate();
        } else {
            toast.error(t('home.adminRecError'));
        }
    };

    const groupedRecs = groupRecommendationsByCategory(recommendations);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

                    {!isAdmin ? (
                        // Permission Denied
                        <div className="p-12 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                                <FaLock className="h-10 w-10 text-red-500" />
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Yetkiniz Yok
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
                                Sadece yönetici bu panele erişebilir.
                            </p>

                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                            >
                                {t('actions.cancel')}
                            </button>
                        </div>
                    ) : (
                        // Admin Panel
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {t('home.adminManage')}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    <FaTimes className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Search & Add Section */}
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FaPlus /> {t('home.adminAddRec')}
                                    </h3>

                                    {/* Category Selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('home.adminCategory')}
                                        </label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value as RecommendationCategory)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                        >
                                            <option value="most-watched-2025">{t('home.adminCategoryMostWatched')}</option>
                                            <option value="best-movies">{t('home.adminCategoryBestMovies')}</option>
                                            <option value="award-winning">{t('home.adminCategoryAwardWinning')}</option>
                                            <option value="top-series">{t('home.adminCategoryTopSeries')}</option>
                                            <option value="top-books">{t('home.adminCategoryTopBooks')}</option>
                                        </select>
                                    </div>

                                    {/* Search */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder={t('home.adminSearchMovie')}
                                                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                            />
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            disabled={searching}
                                            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {searching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                                            {t('actions.search')}
                                        </button>
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {searchResults.map((result) => (
                                                <div
                                                    key={result.imdbID}
                                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                                >
                                                    <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                                                        {result.Poster !== 'N/A' && (
                                                            <img src={result.Poster} alt={result.Title} className="w-full h-full object-cover" />
                                                        )}
                                                        <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold">
                                                            <FaStar size={10} /> {result.imdbRating}
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate mb-1">
                                                            {result.Title}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{result.Year}</p>
                                                        <button
                                                            onClick={() => handleAddRecommendation(result)}
                                                            className="w-full px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                                                        >
                                                            {t('home.adminAddToRecs')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Existing Recommendations */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Mevcut Öneriler
                                    </h3>

                                    {loading ? (
                                        <div className="flex justify-center py-8">
                                            <FaSpinner className="animate-spin h-8 w-8 text-red-500" />
                                        </div>
                                    ) : (
                                        Object.entries(groupedRecs).map(([category, recs]) => (
                                            recs.length > 0 && (
                                                <div key={category} className="space-y-2">
                                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                                                        {category.replace(/-/g, ' ')} ({recs.length})
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                        {recs.map((rec) => (
                                                            <div
                                                                key={rec.id}
                                                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative group"
                                                            >
                                                                <div className="relative h-32 bg-gray-200 dark:bg-gray-700">
                                                                    {rec.image && (
                                                                        <img src={rec.image} alt={rec.title} className="w-full h-full object-cover" />
                                                                    )}
                                                                </div>
                                                                <div className="p-2">
                                                                    <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                                        {rec.title}
                                                                    </h5>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDelete(rec.id)}
                                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                                                                >
                                                                    <FaTrash size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
