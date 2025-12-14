// src/frontend/components/SearchBar.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaTimes } from 'react-icons/fa';
import { searchUsersByName, type SearchableUser } from '../../backend/services/userSearchService';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchableUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();
    const searchRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            const users = await searchUsersByName(searchTerm);
            setResults(users);
            setShowResults(true);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

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

    const handleClear = () => {
        setSearchTerm('');
        setResults([]);
        setShowResults(false);
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm && setShowResults(true)}
                    placeholder={t('search.placeholder')}
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
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50"
                    >
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                {t('common.loading')}...
                            </div>
                        ) : results.length > 0 ? (
                            <div className="py-2">
                                {results.map((user) => (
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
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                {t('search.noResults')}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
