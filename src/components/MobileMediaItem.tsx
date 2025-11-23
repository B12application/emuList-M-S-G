// src/components/MobileMediaItem.tsx
import { useState } from 'react';
import type { MediaItem } from '../types/media';
import { FaTrash, FaPen, FaSpinner } from 'react-icons/fa';
import { db } from '../firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';
import ImageWithFallback from './ui/ImageWithFallback';
import EditModal from './EditModal';
import ConfirmDialog from './ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface MobileMediaItemProps {
  item: MediaItem;
  refetch: () => void;
  onClick: () => void; // Karta tıklanınca çalışacak fonksiyon
}

export default function MobileMediaItem({ item, refetch, onClick }: MobileMediaItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "mediaItems", item.id));
      toast.success('Kayıt silindi');
      refetch();
    } catch (e) {
      console.error(e);
      toast.error('Hata oluştu');
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Kartın Kendisi (Tıklanabilir) */}
      <div 
        onClick={onClick}
        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform cursor-pointer"
      >
        {/* Sol: Fotoğraf */}
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="h-20 w-14 object-cover rounded-lg flex-shrink-0"
        />

        {/* Orta: Başlık ve Yazılar */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate text-base">
            {item.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
            {item.description || "Açıklama yok."}
          </p>
          <div className="mt-1 text-xs font-medium text-sky-600 dark:text-sky-400">
            {item.rating} Puan
          </div>
        </div>

        {/* Sağ: Edit/Delete Butonları (Tıklamayı durdurur - stopPropagation) */}
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-lg text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400"
          >
            <FaPen size={14} />
          </button>
          <button 
            onClick={() => setIsConfirmDialogOpen(true)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50"
          >
            {isDeleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
          </button>
        </div>
      </div>

      {/* Modallar */}
      <EditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={item}
        refetch={refetch}
      />
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        title="Sil"
        message="Silmek istiyor musunuz?"
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />
    </>
  );
}