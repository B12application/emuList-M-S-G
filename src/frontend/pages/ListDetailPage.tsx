// src/frontend/pages/ListDetailPage.tsx
import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaGlobe, FaTrash, FaSpinner, FaListUl, FaCopy, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import useCustomLists from '../hooks/useCustomLists';
import useMedia from '../hooks/useMedia';
import { useLanguage } from '../context/LanguageContext';
import MediaCard from '../components/MediaCard';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function ListDetailPage() {
    const { id: listId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { lists, loading: listsLoading, deleteList, removeItemFromList } = useCustomLists();
    const { items: allItems, loading: itemsLoading, refetch } = useMedia('all', 'all', true);

    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Find the current list
    const currentList = useMemo(() => {
        return lists.find(l => l.id === listId);
    }, [lists, listId]);

    // Get items that belong to this list
    const listItems = useMemo(() => {
        if (!currentList || !allItems) return [];
        return allItems.filter(item => currentList.itemIds.includes(item.id));
    }, [currentList, allItems]);

    const handleDeleteList = () => {
        if (!listId) return;
        deleteList(listId);
        navigate('/lists');
    };

    const handleRemoveItem = (itemId: string) => {
        if (!listId) return;
        removeItemFromList({ listId, itemId });
    };

    const handleCopyLink = () => {
        if (!currentList?.isPublic) {
            toast.error(t('lists.notPublic') || 'Liste herkese açık değil');
            return;
        }
        const url = `${window.location.origin}/lists/${listId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(t('lists.linkCopied') || 'Link kopyalandı!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (listsLoading || itemsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-violet-500" />
            </div>
        );
    }

    if (!currentList) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
                    {t('lists.notFound') || 'Liste Bulunamadı'}
                </h1>
                <Link to="/lists" className="text-violet-500 hover:underline font-bold">
                    {t('lists.backToLists') || '← Tüm Listelere Dön'}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16 w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/lists"
                    className="inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors mb-4 font-bold text-sm"
                >
                    <FaArrowLeft className="text-xs" /> {t('lists.backToLists') || 'Tüm Listelere Dön'}
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800/80 shadow-md">
                    <div className="flex items-center gap-4">
                        {/* Color indicator */}
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white text-2xl shrink-0"
                            style={{ backgroundColor: currentList.color || '#8b5cf6' }}
                        >
                            <FaListUl />
                        </div>

                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white truncate">
                                {currentList.name}
                            </h1>
                            {currentList.description ? (
                                <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm leading-relaxed">
                                    {currentList.description}
                                </p>
                            ) : (
                                <p className="text-stone-400 dark:text-zinc-500 mt-1 text-xs italic">
                                    {t('lists.noDescription') || 'Açıklama belirtilmemiş'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Privacy badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${currentList.isPublic
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}>
                            {currentList.isPublic ? (
                                <>
                                    <FaGlobe size={11} /> {t('lists.public') || 'Herkese Açık'}
                                </>
                            ) : (
                                <>
                                    <FaLock size={11} /> {t('lists.private') || 'Özel Liste'}
                                </>
                            )}
                        </span>

                        {/* Copy link button (if public) */}
                        {currentList.isPublic && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors cursor-pointer"
                            >
                                {copied ? <FaCheck /> : <FaCopy />}
                                {t('lists.shareLink') || 'Bağlantıyı Paylaş'}
                            </motion.button>
                        )}

                        {/* Delete button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDeleteConfirm(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-bold cursor-pointer"
                        >
                            <FaTrash size={11} />
                            <span>{t('actions.delete') || 'Sil'}</span>
                        </motion.button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="mt-4 px-2 flex items-center gap-6 text-sm text-stone-500 dark:text-stone-400">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                        {listItems.length} {t('lists.items') || 'öğe'}
                    </span>
                </div>
            </div>

            {/* Items Grid */}
            {listItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {listItems.map((item) => (
                        <div key={item.id} className="relative group">
                            <MediaCard item={item} refetch={refetch} />

                            {/* Remove from list button */}
                            <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-20 cursor-pointer"
                                title={t('lists.removeItem') || 'Listeden Çıkar'}
                            >
                                <FaTrash size={11} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<FaListUl />}
                    title={t('lists.emptyListItems') || 'Bu listede henüz içerik yok'}
                    description={t('lists.emptyListItemsDesc') || 'İçerik kartlarındaki butonları kullanarak bu listeye içerik ekleyebilirsiniz.'}
                />
            )}

            {/* Delete Confirmation Dialog (Rule #5 Standard) */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteList}
                title={t('lists.deleteTitle') || 'Listeyi Sil'}
                message={t('lists.deleteConfirm') || 'Bu listeyi silmek istediğinize emin misiniz? İçindeki medya kayıtları silinmez.'}
                confirmText={t('actions.delete') || 'Sil'}
                cancelText={t('lists.cancel') || 'Vazgeç'}
                variant="danger"
            />
        </div>
    );
}
