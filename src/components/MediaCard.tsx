// src/components/MediaCard.tsx
import { useState } from 'react';
import type{ MediaItem } from '../types/media';
import { FaEye, FaEyeSlash, FaStar, FaTrash, FaPen, FaSpinner } from 'react-icons/fa';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import EditModal from './EditModal'; 

interface MediaCardProps {
  item: MediaItem;
  refetch: () => void;
}

export default function MediaCard({ item, refetch }: MediaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 

  const handleDelete = async () => {
    if (!window.confirm("Bu kaydı silmek istediğine emin misin?")) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "mediaItems", item.id));
      refetch();
    } catch (e) { console.error("Silme hatası: ", e); setIsDeleting(false); }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await updateDoc(doc(db, "mediaItems", item.id), { watched: !item.watched });
      refetch();
    } catch (e) { console.error("Güncelleme hatası: ", e);
    } finally { setIsToggling(false); }
  };

  return (
    <>
      <article className="group rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition">
        <div className="relative">
          <img 
            src={item.image || "https://via.placeholder.com/600x800?text=No+Image"} 
            alt={item.title} 
            className="h-64 w-full object-cover" 
          />
          <div className="absolute left-3 top-3">
            <span 
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${item.watched 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" 
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
              }`}
            >
              {item.watched ? <FaEye /> : <FaEyeSlash />}
              {item.watched ? "Watched" : "Not Watched"}
            </span>
          </div>
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
              <FaStar /> {item.rating}
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <h3 className="text-base font-semibold line-clamp-1">{item.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 h-14">
            {item.description || "Bu kayıt için açıklama eklenmemiş."}
          </p>
          <div className="mt-2 flex items-center justify-between">
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
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 text-red-300 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
              >
                {/* 2. 'FaSpinner' artık burada hata vermeyecek */}
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
    </>
  );
}