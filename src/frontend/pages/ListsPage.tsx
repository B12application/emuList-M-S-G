// src/frontend/pages/ListsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaListUl, FaLock, FaGlobe, FaTrash, FaTimes, FaCheck, FaSpinner, FaArrowRight, FaEllipsisV, FaEdit, FaShare } from 'react-icons/fa';
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
            description: newListDesc.trim(),
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
        <div className="min-h-screen pb-12">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                                <FaListUl className="text-violet-500" />
                                {t('lists.title') || 'Listelerim'}
                            </h1>
                            <p className="text-stone-500 dark:text-zinc-400 mt-2">
                                Özel listelerinizi oluşturun ve yönetin
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                to="/profile"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
                            >
                                <FaArrowRight className="rotate-180" />
                                Profile Dön
                            </Link>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                            >
                                <FaPlus />
                                <span className="hidden sm:inline">{t('lists.createNew') || 'Yeni Liste'}</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <FaSpinner className="animate-spin text-4xl text-violet-500 mx-auto mb-4" />
                            <p className="text-stone-500 dark:text-zinc-400">Listeler yükleniyor...</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && lists.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center">
                            <FaListUl className="text-4xl text-violet-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
                            {t('lists.emptyTitle') || 'Henüz liste yok'}
                        </h2>
                        <p className="text-stone-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                            {t('lists.emptyDesc') || 'Özel listeler oluşturarak içeriklerinizi organize edin. "Marvel Filmleri", "2024 İzlenecekler" gibi...'}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25"
                        >
                            <FaPlus /> {t('lists.createFirst') || 'İlk Listeni Oluştur'}
                        </motion.button>
                    </div>
                )}

                {/* Lists Grid */}
                {!loading && lists.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {lists.map((list, index) => (
                            <motion.div
                                key={list.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-stone-200 dark:border-zinc-800 hover:shadow-xl transition-all"
                            >
                                {/* Color Accent Bar */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                                    style={{ backgroundColor: list.color || '#8b5cf6' }}
                                />

                                {/* Top Row: Privacy + Item Count */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: list.color || '#8b5cf6' }}
                                        />
                                        <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                                            {list.itemIds.length} {t('lists.items') || 'öğe'}
                                        </span>
                                    </div>
                                    <div>
                                        {list.isPublic ? (
                                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full font-medium">
                                                <FaGlobe size={10} />
                                                <span className="hidden sm:inline">{t('lists.public') || 'Herkese Açık'}</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 px-2 py-1 rounded-full font-medium">
                                                <FaLock size={10} />
                                                <span className="hidden sm:inline">{t('lists.private') || 'Özel'}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* List Info */}
                                <Link to={`/lists/${list.id}`} className="block mb-4">
                                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                                        {list.name}
                                    </h3>
                                    {list.description ? (
                                        <p className="text-sm text-stone-500 dark:text-zinc-400 line-clamp-2">
                                            {list.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-stone-400 dark:text-zinc-500 italic">
                                            Açıklama yok
                                        </p>
                                    )}
                                </Link>

                                {/* Bottom Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-zinc-800">
                                    <Link
                                        to={`/lists/${list.id}`}
                                        className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 group/link"
                                    >
                                        Listeyi Gör
                                        <FaArrowRight className="text-xs group-hover/link:translate-x-1 transition-transform" />
                                    </Link>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (confirm(t('lists.deleteConfirm') || 'Bu listeyi silmek istediğinize emin misiniz?')) {
                                                deleteList(list.id);
                                            }
                                        }}
                                        className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
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
                                className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-2xl border border-stone-200 dark:border-zinc-800"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                                            {t('lists.createNew') || 'Yeni Liste'}
                                        </h2>
                                        <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                                            Liste detaylarını doldurun
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                            {t('lists.name') || 'Liste Adı'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            placeholder="Marvel Filmleri, 2024 İzlenecekler..."
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-stone-400"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                            {t('lists.description') || 'Açıklama'}
                                        </label>
                                        <textarea
                                            value={newListDesc}
                                            onChange={(e) => setNewListDesc(e.target.value)}
                                            placeholder="Bu liste hakkında kısa bir açıklama..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-stone-400"
                                        />
                                    </div>

                                    {/* Color Picker */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-3">
                                            {t('lists.color') || 'Liste Rengi'}
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {LIST_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setNewListColor(color)}
                                                    className={`w-10 h-10 rounded-xl transition-all relative ${newListColor === color
                                                            ? 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-zinc-900 scale-110 shadow-lg'
                                                            : 'hover:scale-105 hover:shadow-md'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {newListColor === color && (
                                                        <FaCheck className="absolute inset-0 m-auto text-white text-sm" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Privacy Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800 rounded-xl border border-stone-100 dark:border-zinc-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${newListPublic ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' : 'bg-stone-200 dark:bg-zinc-700 text-stone-500'}`}>
                                                {newListPublic ? <FaGlobe /> : <FaLock />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-stone-900 dark:text-white text-sm">
                                                    {newListPublic ? 'Herkese Açık' : 'Özel Liste'}
                                                </div>
                                                <div className="text-xs text-stone-500 dark:text-zinc-400">
                                                    {newListPublic
                                                        ? 'Diğer kullanıcılar bu listeyi görebilir'
                                                        : 'Sadece sen görebilirsin'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setNewListPublic(!newListPublic)}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${newListPublic ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-zinc-600'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${newListPublic ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleCreate}
                                        disabled={!newListName.trim() || isCreating}
                                        className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Oluşturuluyor...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheck />
                                                {t('lists.create') || 'Liste Oluştur'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Footer />
        </div>
    );
}