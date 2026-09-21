// src/frontend/pages/ListsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaPlus, FaListUl, FaLock, FaGlobe, FaTrash, FaTimes,
    FaCheck, FaSpinner, FaArrowRight
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeaderBanner from '../components/ui/PageHeaderBanner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import useCustomLists from '../hooks/useCustomLists';
import { useLanguage } from '../context/LanguageContext';

const LIST_COLORS = [
    '#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4',
    '#10b981', '#f59e0b', '#f97316', '#ef4444',
    '#6366f1', '#14b8a6', '#84cc16', '#a855f7'
];

export default function ListsPage() {
    const { t } = useLanguage();
    const { lists, loading, createList, deleteList, isCreating } = useCustomLists();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [newListColor, setNewListColor] = useState(LIST_COLORS[0]);
    const [newListPublic, setNewListPublic] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

    const handleStarterSelect = (name: string, color: string) => {
        setNewListName(name);
        setNewListColor(color);
        setShowCreateModal(true);
    };

    return (
        <div className="min-h-screen pb-16">
            {/* Header Banner */}
            <PageHeaderBanner
                title={t('lists.title') || 'Özel Listelerim'}
                subtitle={t('lists.subtitle') || 'Film, dizi, oyun ve kitaplarınızı tematik listelerde gruplayın ve paylaşın'}
                icon={<FaListUl className="text-violet-500 text-xl" />}
                backTo="/profile"
                backLabel={t('common.backToProfile')}
                action={
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all cursor-pointer text-xs sm:text-sm"
                    >
                        <FaPlus className="text-xs" />
                        <span>{t('lists.createNew') || 'Yeni Liste'}</span>
                    </motion.button>
                }
            />

            {/* Fluid Container (Rule #16) */}
            <div className="w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-24">
                        <div className="text-center">
                            <FaSpinner className="animate-spin text-4xl text-violet-500 mx-auto mb-4" />
                            <p className="text-stone-500 dark:text-zinc-400 font-medium">
                                {t('lists.loading') || 'Listeler yükleniyor...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty State (Stunning Hero Layout) */}
                {!loading && lists.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-14 text-center border border-stone-200/80 dark:border-zinc-800/80 shadow-2xl max-w-2xl mx-auto my-6"
                    >
                        {/* Background Glow halo */}
                        <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-500/15 dark:bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/15 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                        {/* Floating Icon with Ring */}
                        <div className="relative inline-flex mb-6">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-violet-500/30">
                                <FaListUl />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-sm shadow-md font-black">
                                <FaPlus />
                            </div>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mb-3 tracking-tight">
                            {t('lists.noLists') || 'Henüz Özel Listeniz Yok'}
                        </h2>
                        <p className="text-sm sm:text-base text-stone-600 dark:text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed">
                            {t('lists.noListsDesc') || 'Film maratonları, favori oyunlar veya 2026 okuma hedefleri gibi tematik koleksiyonlar hazırlayın.'}
                        </p>

                        {/* Starter Idea Pills */}
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-3 flex items-center justify-center gap-1.5">
                                <span>💡</span>
                                <span>{t('lists.starterIdeas') || 'İlham Verici Liste Fikirleri'}</span>
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                                {[
                                    { label: t('lists.starterIdea1') || '🎬 Hafta Sonu Film Maratonu', color: '#8b5cf6' },
                                    { label: t('lists.starterIdea2') || '🎮 Bitirilecek Başyapıtlar', color: '#ec4899' },
                                    { label: t('lists.starterIdea3') || '📚 2026 Okuma Hedefim', color: '#10b981' },
                                    { label: t('lists.starterIdea4') || '🍿 Nostaljik Dizi Sezonları', color: '#f59e0b' },
                                ].map((idea) => (
                                    <button
                                        key={idea.label}
                                        onClick={() => handleStarterSelect(idea.label, idea.color)}
                                        className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-stone-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/40 text-stone-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 border border-stone-200/60 dark:border-zinc-700/60 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                    >
                                        {idea.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Primary CTA */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all cursor-pointer text-sm sm:text-base"
                        >
                            <FaPlus />
                            <span>{t('lists.createFirst') || 'İlk Listeni Oluştur'}</span>
                        </motion.button>
                    </motion.div>
                )}

                {/* Lists Grid */}
                {!loading && lists.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                        {lists.map((list, index) => (
                            <motion.div
                                key={list.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="group relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-2xl border border-stone-200/80 dark:border-zinc-800/80 transition-all flex flex-col justify-between overflow-hidden"
                            >
                                {/* Color Accent Top Bar */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-2"
                                    style={{ backgroundColor: list.color || '#8b5cf6' }}
                                />

                                <div>
                                    {/* Top Row: Privacy + Item Count */}
                                    <div className="flex items-center justify-between mb-3 pt-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: list.color || '#8b5cf6' }}
                                            />
                                            <span className="text-[11px] sm:text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                                                {list.itemIds?.length || 0} {t('lists.items') || 'öğe'}
                                            </span>
                                        </div>
                                        <div>
                                            {list.isPublic ? (
                                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full font-bold">
                                                    <FaGlobe size={10} />
                                                    <span>{t('lists.public') || 'Herkese Açık'}</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full font-bold">
                                                    <FaLock size={10} />
                                                    <span>{t('lists.private') || 'Özel'}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* List Info */}
                                    <Link to={`/lists/${list.id}`} className="block mb-4">
                                        <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white mb-1.5 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                                            {list.name}
                                        </h3>
                                        {list.description ? (
                                            <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                                {list.description}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-stone-400 dark:text-zinc-500 italic">
                                                {t('lists.noDescription') || 'Açıklama belirtilmemiş'}
                                            </p>
                                        )}
                                    </Link>
                                </div>

                                {/* Bottom Actions */}
                                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-stone-100 dark:border-zinc-800/80">
                                    <Link
                                        to={`/lists/${list.id}`}
                                        className="text-xs sm:text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1.5 group/link"
                                    >
                                        <span>{t('lists.viewList') || 'Listeyi Gör'}</span>
                                        <FaArrowRight className="text-[10px] group-hover/link:translate-x-1 transition-transform" />
                                    </Link>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setConfirmDeleteId(list.id);
                                        }}
                                        className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
                                        title={t('actions.delete') || 'Sil'}
                                    >
                                        <FaTrash size={13} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog (Rule #5 Standard) */}
            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    if (confirmDeleteId) {
                        deleteList(confirmDeleteId);
                        setConfirmDeleteId(null);
                    }
                }}
                title={t('lists.deleteTitle') || 'Listeyi Sil'}
                message={t('lists.deleteConfirm') || 'Bu listeyi silmek istediğinize emin misiniz? İçindeki medya kayıtları silinmez.'}
                confirmText={t('actions.delete') || 'Sil'}
                cancelText={t('lists.cancel') || 'Vazgeç'}
                variant="danger"
            />

            {/* Create Modal (Rule #5 Standard) */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg sm:max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-zinc-800 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center text-lg">
                                        <FaListUl />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                                            {t('lists.createNew') || 'Yeni Liste Oluştur'}
                                        </h2>
                                        <p className="text-xs text-stone-500 dark:text-zinc-400">
                                            {t('lists.subtitle') || 'Özel listelerinizi oluşturun ve yönetin'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Scrollable Modal Body (Rule #5) */}
                            <div className="max-h-[70vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar p-6 space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 mb-1.5">
                                        {t('lists.name') || 'Liste Adı'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder={t('lists.namePlaceholder') || 'Örn: Marvel Evreni, 2026 Hedefleri...'}
                                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/70 text-stone-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-stone-400 text-sm font-medium"
                                        autoFocus
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 mb-1.5">
                                        {t('lists.description') || 'Açıklama'}
                                    </label>
                                    <textarea
                                        value={newListDesc}
                                        onChange={(e) => setNewListDesc(e.target.value)}
                                        placeholder={t('lists.descPlaceholder') || 'Bu liste hakkında kısa bir bilgi veya amaç...'}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/70 text-stone-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-stone-400 text-sm"
                                    />
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 mb-2.5">
                                        {t('lists.color') || 'Liste Rengi'}
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {LIST_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewListColor(color)}
                                                className={`w-9 h-9 rounded-xl transition-all relative cursor-pointer ${
                                                    newListColor === color
                                                        ? 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-zinc-900 scale-110 shadow-lg'
                                                        : 'hover:scale-105 hover:shadow-md'
                                                }`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {newListColor === color && (
                                                    <FaCheck className="absolute inset-0 m-auto text-white text-xs" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Privacy Toggle */}
                                <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/70 dark:border-zinc-700/60">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${
                                            newListPublic
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-stone-200 dark:bg-zinc-700 text-stone-500'
                                        }`}>
                                            {newListPublic ? <FaGlobe size={14} /> : <FaLock size={14} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">
                                                {newListPublic ? t('lists.public') || 'Herkese Açık' : t('lists.private') || 'Özel Liste'}
                                            </div>
                                            <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                                                {newListPublic
                                                    ? t('lists.publicDesc') || 'Diğer kullanıcılar bu listeyi görebilir'
                                                    : t('lists.privateDesc') || 'Sadece sen görebilirsin'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewListPublic(!newListPublic)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                                            newListPublic ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-zinc-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                                                newListPublic ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Sticky Action Footer (Rule #5 Standard) */}
                            <div className="sticky bottom-0 px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-zinc-400 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    {t('lists.cancel') || 'Vazgeç'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={!newListName.trim() || isCreating}
                                    className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                                >
                                    {isCreating ? (
                                        <>
                                            <FaSpinner className="animate-spin text-xs" />
                                            <span>{t('lists.creating') || 'Kaydediliyor...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck className="text-xs" />
                                            <span>{t('lists.create') || 'Listeyi Kaydet'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}