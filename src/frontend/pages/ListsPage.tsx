// src/frontend/pages/ListsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaListUl, FaLock, FaGlobe, FaTrash, FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import useCustomLists from '../hooks/useCustomLists';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';

const LIST_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
];

export default function ListsPage() {
    const { t } = useLanguage();
    const { lists, loading, createList, deleteList, isCreating } = useCustomLists();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [newListColor, setNewListColor] = useState(LIST_COLORS[0]);
    const [newListPublic, setNewListPublic] = useState(false);

    const handleCreate = () => {
        if (!newListName.trim()) return;

        createList({
            name: newListName.trim(),
            description: newListDesc.trim() || undefined,
            color: newListColor,
            isPublic: newListPublic,
            itemIds: []
        });

        setShowCreateModal(false);
        setNewListName('');
        setNewListDesc('');
        setNewListColor(LIST_COLORS[0]);
        setNewListPublic(false);
    };

    return (
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-stone-100 flex items-center gap-3">
                    <FaListUl className="text-violet-500" /> {t('lists.title') || 'Listelerim'}
                </h1>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                >
                    <FaPlus /> {t('lists.createNew') || 'Yeni Liste'}
                </motion.button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <FaSpinner className="animate-spin text-4xl text-violet-500" />
                </div>
            )}

            {/* Empty State */}
            {!loading && lists.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-24 h-24 mx-auto mb-6 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center">
                        <FaListUl className="text-4xl text-violet-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">
                        {t('lists.emptyTitle') || 'Henüz liste yok'}
                    </h2>
                    <p className="text-gray-500 dark:text-stone-400 mb-6 max-w-md mx-auto">
                        {t('lists.emptyDesc') || 'Özel listeler oluşturarak içeriklerini organize et. "Marvel Filmleri", "2024 İzlenecekler" gibi...'}
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors"
                    >
                        <FaPlus /> {t('lists.createFirst') || 'İlk Listeni Oluştur'}
                    </button>
                </div>
            )}

            {/* Lists Grid */}
            {!loading && lists.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {lists.map((list) => (
                        <motion.div
                            key={list.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-white dark:bg-stone-900/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-white/5 hover:shadow-xl transition-all"
                        >
                            {/* Color Accent */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                                style={{ backgroundColor: list.color || '#8b5cf6' }}
                            />

                            {/* Privacy Badge */}
                            <div className="absolute top-4 right-4">
                                {list.isPublic ? (
                                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                                        <FaGlobe size={10} /> {t('lists.public') || 'Herkese Açık'}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-stone-400 bg-gray-100 dark:bg-stone-800 px-2 py-1 rounded-full">
                                        <FaLock size={10} /> {t('lists.private') || 'Özel'}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <Link to={`/lists/${list.id}`} className="block">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-stone-100 mb-2 pr-20 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                    {list.name}
                                </h3>
                                {list.description && (
                                    <p className="text-sm text-gray-500 dark:text-stone-400 line-clamp-2 mb-4">
                                        {list.description}
                                    </p>
                                )}
                                <div className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                    {list.itemIds.length} {t('lists.items') || 'öğe'}
                                </div>
                            </Link>

                            {/* Actions */}
                            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (confirm(t('lists.deleteConfirm') || 'Bu listeyi silmek istediğinize emin misiniz?')) {
                                            deleteList(list.id);
                                        }
                                    }}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title={t('actions.delete')}
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100">
                                    {t('lists.createNew') || 'Yeni Liste'}
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                                        {t('lists.name') || 'Liste Adı'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="Marvel Filmleri, 2024 İzlenecekler..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                                        {t('lists.description') || 'Açıklama'}
                                    </label>
                                    <textarea
                                        value={newListDesc}
                                        onChange={(e) => setNewListDesc(e.target.value)}
                                        placeholder="Bu liste hakkında kısa bir açıklama..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                                        {t('lists.color') || 'Renk'}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {LIST_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setNewListColor(color)}
                                                className={`w-8 h-8 rounded-lg transition-all ${newListColor === color
                                                    ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-stone-500 scale-110'
                                                    : 'hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Privacy */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-stone-800/50 rounded-xl">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-stone-100">
                                            {t('lists.makePublic') || 'Herkese Açık Yap'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-stone-400">
                                            {t('lists.publicDesc') || 'Diğer kullanıcılar bu listeyi görebilir'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setNewListPublic(!newListPublic)}
                                        className={`w-12 h-7 rounded-full transition-colors ${newListPublic ? 'bg-violet-500' : 'bg-gray-300 dark:bg-stone-600'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${newListPublic ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleCreate}
                                    disabled={!newListName.trim() || isCreating}
                                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <FaSpinner className="animate-spin" />
                                    ) : (
                                        <>
                                            <FaCheck /> {t('lists.create') || 'Liste Oluştur'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}
