// src/frontend/components/notes/ImageLightboxModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDownload, FaSearchPlus, FaSearchMinus, FaUndo, FaCopy, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface ImageLightboxModalProps {
  isOpen: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightboxModal({
  isOpen,
  src,
  alt = 'Ekran Görüntüsü',
  onClose,
}: ImageLightboxModalProps) {
  const [scale, setScale] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${alt.replace(/\s+/g, '_')}_${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ekran görüntüsü indirildi');
  };

  const handleCopyMarkdown = () => {
    const md = `![${alt}](${src})`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success('Markdown etiketi kopyalandı');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md">
        {/* Top Controls Toolbar */}
        <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800 pointer-events-auto shadow-xl">
            <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
              {alt}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 pointer-events-auto shadow-xl">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Yakınlaştır"
            >
              <FaSearchPlus size={14} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Uzaklaştır"
            >
              <FaSearchMinus size={14} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Sıfırla"
            >
              <FaUndo size={14} />
            </button>
            <div className="w-px h-5 bg-zinc-700 mx-1" />
            <button
              onClick={handleCopyMarkdown}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Markdown Kopyala"
            >
              {copied ? <FaCheck className="text-emerald-400" size={14} /> : <FaCopy size={14} />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="İndir"
            >
              <FaDownload size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
              title="Kapat"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div
          className="w-full h-full flex items-center justify-center overflow-auto p-4 cursor-pointer"
          onClick={onClose}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: scale, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            src={src}
            alt={alt}
            style={{ transform: `scale(${scale})` }}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-transform duration-200 cursor-default select-none border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </AnimatePresence>
  );
}
