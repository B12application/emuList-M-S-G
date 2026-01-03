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
import toast from 'react-hot-toast';
import Footer from '../components/Footer';

export default function ListDetailPage() {
    const { id: listId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { lists, loading: listsLoading, deleteList, removeItemFromList } = useCustomLists();
    const { items: allItems, loading: itemsLoading, refetch } = useMedia('all', 'all', true, 'rating');

    const [copied, setCopied] = useState(false);

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
        if (confirm(t('lists.deleteConfirm') || 'Bu listeyi silmek istediğinize emin misiniz?')) {
            deleteList(listId);
            navigate('/lists');
        }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4">
                    {t('lists.notFound') || 'Liste bulunamadı'}
                </h1>
                <Link to="/lists" className="text-violet-500 hover:underline">
                    {t('lists.backToLists') || '← Listelere Dön'}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/lists"
                    className="inline-flex items-center gap-2 text-gray-500 dark:text-stone-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors mb-4"
                >
                    <FaArrowLeft /> {t('lists.backToLists') || 'Listelere Dön'}
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Color indicator */}
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: currentList.color || '#8b5cf6' }}
                        >
                            <FaListUl className="text-2xl text-white" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-stone-100">
                                {currentList.name}
                            </h1>
                            {currentList.description && (
                                <p className="text-gray-500 dark:text-stone-400 mt-1">
                                    {currentList.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Privacy badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${currentList.isPublic
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}>
                            {currentList.isPublic ? <FaGlobe /> : <FaLock />}
                            {currentList.isPublic ? (t('lists.public') || 'Herkese Açık') : (t('lists.private') || 'Özel')}
                        </span>

                        {/* Share button */}
                        {currentList.isPublic && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                            >
                                {copied ? <FaCheck /> : <FaCopy />}
                                {t('lists.shareLink') || 'Paylaş'}
                            </motion.button>
                        )}

                        {/* Delete button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDeleteList}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <FaTrash />
                            {t('actions.delete')}
                        </motion.button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="mt-6 flex items-center gap-6 text-sm text-gray-500 dark:text-stone-400">
                    <span className="font-semibold text-gray-900 dark:text-stone-100">
                        {listItems.length} {t('lists.items') || 'öğe'}
                    </span>
                </div>
            </div>

            {/* Items Grid */}
            {listItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listItems.map((item) => (
                        <div key={item.id} className="relative group">
                            <MediaCard item={item} refetch={refetch} />

                            {/* Remove from list button */}
                            <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-20"
                                title={t('lists.removeFromList') || 'Listeden Çıkar'}
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<FaListUl />}
                    title={t('lists.emptyListTitle') || 'Bu listede henüz içerik yok'}
                    description={t('lists.emptyListDesc') || 'İçerik kartlarındaki "Listeye Ekle" butonunu kullanarak bu listeye içerik ekleyebilirsin.'}
                />
            )}

            <Footer />
        </div>
    );
}
