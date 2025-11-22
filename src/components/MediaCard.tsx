// src/components/MediaCard.tsx
import { useState } from 'react';
import type { MediaItem } from '../types/media';
import { FaEye, FaEyeSlash, FaStar, FaTrash, FaPen, FaSpinner } from 'react-icons/fa';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import EditModal from './EditModal';
import ImageWithFallback from './ui/ImageWithFallback';
import ConfirmDialog from './ui/ConfirmDialog';
import toast from 'react-hot-toast'; 

interface MediaCardProps {
  item: MediaItem;
  refetch: () => void;
}

export default function MediaCard({ item, refetch }: MediaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false); 

  // === YENİ MANTIK: Tür Oyun mu? ===
  const isGame = item.type === 'game';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "mediaItems", item.id));
      toast.success('Kayıt başarıyla silindi');
      refetch();
    } catch (e) {
      console.error("Silme hatası: ", e);
      toast.error('Kayıt silinirken bir hata oluştu');
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await updateDoc(doc(db, "mediaItems", item.id), { watched: !item.watched });
      toast.success(item.watched ? 'İzlenmedi olarak işaretlendi' : 'İzlendi olarak işaretlendi');
      refetch();
    } catch (e) {
      console.error("Güncelleme hatası: ", e);
      toast.error('Durum güncellenirken bir hata oluştu');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <article className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:scale-105 hover:z-10 transition-all duration-300 ease-in-out flex flex-col h-full">
        
        <div className="relative w-full bg-gray-50 dark:bg-gray-800">
          {/* === DÜZELTME BURADA: Türe göre sınıf (class) değiştirme === */}
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className={`w-full transition-transform duration-500 group-hover:scale-105 ${
              isGame 
                ? 'h-56 object-cover' // OYUNSA: Daha kısa (yatay) ve alanı doldur
                : 'h-96 object-contain bg-gray-100 dark:bg-gray-800' // FİLMSE: Uzun (dikey) ve sığdır
            }`}
          />
          
          <div className="absolute left-3 top-3">
            <span 
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md ${item.watched 
                ? "bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200" 
                : "bg-rose-100/90 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200"
              }`}
            >
              {item.watched ? <FaEye /> : <FaEyeSlash />}
              {item.watched ? "Watched" : "Not Watched"}
            </span>
          </div>
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200 shadow-sm backdrop-blur-md">
              <FaStar /> {item.rating}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1">
          <h3 className="text-base font-semibold line-clamp-1 group-hover:text-sky-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 h-14">
            {item.description || "Bu kayıt için açıklama eklenmemiş."}
          </p>
          
          <div className="mt-auto flex items-center justify-between pt-2">
            <button 
              onClick={handleToggle}
              disabled={isToggling}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              {item.watched ? <FaEye /> : <FaEyeSlash />}
              Toggle
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                title="Edit"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:text-sky-300 dark:border-sky-900/60 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition"
              >
                <FaPen />
              </button>
              
              <button 
                onClick={() => setIsConfirmDialogOpen(true)}
                disabled={isDeleting}
                title="Delete"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 text-red-300 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
              >
                {isDeleting ? <FaSpinner className="animate-spin"/> : <FaTrash />}
              </button>
            </div>
          </div>
        </div>
      </article>

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
        title="Kaydı Sil"
        message={`"${item.title}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />
    </>
  );
}