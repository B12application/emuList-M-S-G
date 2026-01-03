// src/frontend/components/AddToListDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { FaListUl, FaPlus, FaCheck, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import useCustomLists from '../hooks/useCustomLists';
import { useLanguage } from '../context/LanguageContext';

interface AddToListDropdownProps {
    itemId: string;
    className?: string;
}

export default function AddToListDropdown({ itemId, className = '' }: AddToListDropdownProps) {
    const { t } = useLanguage();
    const { lists, loading, addItemToList, removeItemFromList } = useCustomLists();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check if item is in a list
    const isInList = (listId: string) => {
        const list = lists.find(l => l.id === listId);
        return list?.itemIds.includes(itemId) || false;
    };

    const handleToggleList = (e: React.MouseEvent, listId: string) => {
        e.stopPropagation();
        if (isInList(listId)) {
            removeItemFromList({ listId, itemId });
        } else {
            addItemToList({ listId, itemId });
        }
    };

    if (lists.length === 0) return null;

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/90 text-white shadow-lg backdrop-blur-md hover:bg-violet-600 transition-all hover:scale-110"
                title={t('lists.addToList') || 'Listeye Ekle'}
            >
                <FaListUl size={12} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2">
                                {t('lists.selectList') || 'Liste Seç'}
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-4 text-center">
                                <FaSpinner className="animate-spin text-violet-500 mx-auto" />
                            </div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto p-1">
                                {lists.map((list) => {
                                    const inList = isInList(list.id);
                                    return (
                                        <button
                                            key={list.id}
                                            onClick={(e) => handleToggleList(e, list.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${inList
                                                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                                style={{ backgroundColor: list.color || '#8b5cf6' }}
                                            />
                                            <span className="flex-1 text-sm font-medium truncate">{list.name}</span>
                                            {inList ? (
                                                <FaCheck className="text-violet-500 flex-shrink-0" size={12} />
                                            ) : (
                                                <FaPlus className="text-gray-400 flex-shrink-0" size={12} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
