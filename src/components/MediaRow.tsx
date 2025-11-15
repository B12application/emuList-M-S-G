// src/components/MediaRow.tsx
import { useState } from 'react';
import type{ MediaItem } from '../types/media';
import { FaEye, FaEyeSlash, FaStar, FaTrash } from 'react-icons/fa';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface MediaRowProps {
  item: MediaItem;
  refetch: () => void;
}

export default function MediaRow({ item, refetch }: MediaRowProps) {
  const [isDeleting, setIsDeleting] = useState(false); 
  const [isToggling, setIsToggling] = useState(false);

  // Silme ve Toggle fonksiyonları MediaCard ile aynı
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
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Resim */}
      <img 
        src={item.image || "https://via.placeholder.com/100x150?text=No+Image"} 
        alt={item.title} 
        className="h-20 w-16 object-cover rounded-md flex-shrink-0" 
      />
      {/* Başlık ve Puan */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold line-clamp-1 truncate">{item.title}</h3>
        <div className="flex items-center gap-1 text-sm text-amber-500 mt-1">
          <FaStar /> {item.rating}
        </div>
      </div>
      
      {/* Durum (İkon) */}
      <span 
        title={item.watched ? "Watched" : "Not Watched"}
        className={`inline-flex items-center justify-center p-2 rounded-full text-xs font-medium ${item.watched 
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" 
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
        }`}
      >
        {item.watched ? <FaEye /> : <FaEyeSlash />}
      </span>

      {/* Butonlar */}
      <div className="flex gap-2">
        <button 
          onClick={handleToggle}
          disabled={isToggling}
          title="Toggle Watched"
          className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          {item.watched ? <FaEye /> : <FaEyeSlash />}
        </button>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete"
          className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-sky-200 text-sky-600 dark:border-sky-900/60 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition disabled:opacity-50"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
}