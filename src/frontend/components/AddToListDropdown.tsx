// src/frontend/components/AddToListDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { FaListUl, FaPlus, FaCheck, FaSpinner, FaTimes } from 'react-icons/fa';
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

    // Close dropdown when clicking/tapping outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
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
        <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                    isOpen 
                        ? 'bg-violet-600 text-white shadow-lg ring-2 ring-violet-400' 
                        : 'bg-violet-500/90 hover:bg-violet-600 text-white shadow-sm hover:scale-105 active:scale-95'
                }`}
                title={t('lists.addToList') || 'Listeye Ekle'}
            >
                <FaListUl size={12} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 bottom-full mb-2 w-56 sm:w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden z-[150]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-2.5 bg-stone-50 dark:bg-zinc-950/60 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                <FaListUl className="text-violet-500" size={11} />
                                {t('lists.selectList') || 'Listeye Ekle'}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 p-1"
                            >
                                <FaTimes size={10} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-4 text-center">
                                <FaSpinner className="animate-spin text-violet-500 mx-auto" />
                            </div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto p-1.5 custom-scrollbar space-y-1">
                                {lists.map((list) => {
                                    const inList = isInList(list.id);
                                    return (
                                        <button
                                            type="button"
                                            key={list.id}
                                            onClick={(e) => handleToggleList(e, list.id)}
                                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-left text-xs font-medium ${inList
                                                    ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-semibold'
                                                    : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300'
                                                }`}
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: list.color || '#8b5cf6' }}
                                            />
                                            <span className="flex-1 truncate">{list.name}</span>
                                            {inList ? (
                                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 flex-shrink-0">
                                                    <FaCheck size={8} />
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-400 flex-shrink-0">
                                                    <FaPlus size={7} />
                                                </span>
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
