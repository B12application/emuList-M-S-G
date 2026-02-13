// src/frontend/components/SearchBar.tsx
// Global Unified Search — hem kullanıcı hem medya içerik araması
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaTimes, FaFilm, FaTv, FaGamepad, FaBook } from 'react-icons/fa';
import { searchUsersByName, type SearchableUser } from '../../backend/services/userSearchService';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import useMedia from '../hooks/useMedia';
import type { MediaItem } from '../../backend/types/media';

const TYPE_CONFIG: Record<string, { icon: typeof FaFilm; color: string; route: string }> = {
    movie: { icon: FaFilm, color: 'text-blue-500', route: '/movie' },
    series: { icon: FaTv, color: 'text-emerald-500', route: '/series' },
    game: { icon: FaGamepad, color: 'text-amber-500', route: '/game' },
    book: { icon: FaBook, color: 'text-purple-500', route: '/book' },
};

export default function SearchBar() {
    const [searchTerm, setSearchTerm] = useState('');
    const [userResults, setUserResults] = useState<SearchableUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'users'>('content');
    const navigate = useNavigate();
    const { t } = useLanguage();
    const searchRef = useRef<HTMLDivElement>(null);

    // Tüm medya öğelerini çek (client-side filtreleme yapılacak)
    const { items: allItems } = useMedia('all', 'all', true);

    // client-side media search — anlık, debounce yok
    const mediaResults = useMemo<MediaItem[]>(() => {
        if (!searchTerm.trim() || searchTerm.trim().length < 2) return [];
        const q = searchTerm.toLowerCase();
        return allItems
            .filter(item =>
                item.title.toLowerCase().includes(q) ||
                (item.author && item.author.toLowerCase().includes(q)) ||
                (item.genre && item.genre.toLowerCase().includes(q))
            )
            .slice(0, 6);
    }, [searchTerm, allItems]);

    // Kullanıcı araması — debounce ile
    useEffect(() => {
        if (!searchTerm.trim() || searchTerm.trim().length < 2) {
            setUserResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            const users = await searchUsersByName(searchTerm);
            setUserResults(users.slice(0, 5));
            setIsLoading(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Sonuçları göster / gizle
    useEffect(() => {
        if (searchTerm.trim().length >= 2 && (mediaResults.length > 0 || userResults.length > 0)) {
            setShowResults(true);
        } else if (!searchTerm.trim()) {
            setShowResults(false);
        }
    }, [searchTerm, mediaResults.length, userResults.length]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUserClick = (userId: string) => {
        navigate(`/user/${userId}`);
        setSearchTerm('');
        setShowResults(false);
    };

    const handleMediaClick = (item: MediaItem) => {
        const config = TYPE_CONFIG[item.type];
        if (config) {
            navigate(`${config.route}?search=${encodeURIComponent(item.title)}`);
        }
        setSearchTerm('');
        setShowResults(false);
    };

    const handleClear = () => {
        setSearchTerm('');
        setUserResults([]);
        setShowResults(false);
    };

    const totalResults = mediaResults.length + userResults.length;

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.trim().length >= 2 && setShowResults(true)}
                    placeholder={t('globalSearch.placeholder')}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {showResults && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-hidden z-50"
                    >
                        {/* Tab Buttons */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'content'
                                    ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {t('globalSearch.myContent')} ({mediaResults.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === 'users'
                                    ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {t('globalSearch.users')} ({userResults.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="overflow-y-auto max-h-80">
                            {activeTab === 'content' ? (
                                mediaResults.length > 0 ? (
                                    <div className="py-1">
                                        {mediaResults.map((item) => {
                                            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.movie;
                                            const Icon = config.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleMediaClick(item)}
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                                >
                                                    {/* Poster */}
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.title}
                                                            className="w-8 h-12 object-cover rounded-md shadow-sm flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                                                            <Icon className={`${config.color}`} />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                            {item.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className={`flex items-center gap-1 ${config.color}`}>
                                                                <Icon size={10} />{' '}
                                                                {item.type === 'movie' ? 'Film' : item.type === 'series' ? 'Dizi' : item.type === 'game' ? 'Oyun' : 'Kitap'}
                                                            </span>
                                                            {item.rating && <span>⭐ {item.rating}</span>}
                                                            {item.myRating !== undefined && <span className="text-rose-500">🌟 {item.myRating.toFixed(1)}</span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                        {isLoading ? `${t('common.loading')}...` : t('globalSearch.noResults')}
                                    </div>
                                )
                            ) : (
                                /* Users Tab */
                                isLoading ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                        {t('common.loading')}...
                                    </div>
                                ) : userResults.length > 0 ? (
                                    <div className="py-1">
                                        {userResults.map((user) => (
                                            <button
                                                key={user.userId}
                                                onClick={() => handleUserClick(user.userId)}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                            >
                                                <img
                                                    src={user.photoURL || 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png'}
                                                    alt={user.displayName}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                                />
                                                <div className="flex-1 text-left">
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {user.displayName}
                                                    </p>
                                                    {user.email && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {user.email}
                                                        </p>
                                                    )}
                                                </div>
                                                <FaUser className="text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                        {t('globalSearch.noResults')}
                                    </div>
                                )
                            )}
                        </div>

                        {/* Total count footer */}
                        {totalResults > 0 && (
                            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-400 text-center">
                                {totalResults} sonuç bulundu
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
