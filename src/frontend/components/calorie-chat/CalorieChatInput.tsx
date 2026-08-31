// src/frontend/components/calorie-chat/CalorieChatInput.tsx
// Chat giriş bileşeni — metin + kamera/galeri fotoğraf ekleme + kalan limit uyarısı

import { useState, useRef, useCallback } from 'react';
import { FaCamera, FaImage, FaPaperPlane, FaTimes, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import TextareaAutosize from 'react-textarea-autosize';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onSend: (text: string, imageBase64?: string, mimeType?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  remainingQuota?: number;
  dailyLimit?: number;
  isLimitReached?: boolean;
}

export default function CalorieChatInput({
  onSend,
  disabled,
  placeholder,
  remainingQuota,
  dailyLimit,
  isLimitReached = false,
}: Props) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      // Extract base64 part (remove data:image/...;base64, prefix)
      const base64 = result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
  }, []);

  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText && !imageBase64) return;
    if (disabled || isLimitReached) return;

    onSend(trimmedText || 'Bu yemeği analiz et.', imageBase64 || undefined, imageMimeType || undefined);
    setText('');
    setImagePreview(null);
    setImageBase64(null);
    textareaRef.current?.focus();
  }, [text, imageBase64, imageMimeType, disabled, isLimitReached, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter gönder, Shift+Enter yeni satır
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isActuallyDisabled = disabled || isLimitReached;

  return (
    <div className="border-t border-stone-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
      {/* Limit Reached Warning Bar */}
      {isLimitReached && (
        <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FaExclamationCircle className="text-sm shrink-0" />
            <span>Günlük analiz limitinize ulaştınız ({dailyLimit || 50}/{dailyLimit || 50}).</span>
          </div>
          <span className="text-[10px] opacity-80 shrink-0">Gece 00:00'da yenilenir</span>
        </div>
      )}

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3 overflow-hidden"
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Önizleme"
                className="h-20 w-20 object-cover rounded-xl border-2 border-amber-400 shadow-md"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
              >
                <FaTimes className="text-[10px]" />
              </button>
              <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold text-center rounded-md py-0.5 uppercase tracking-wider">
                Fotoğraf
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-end gap-2 px-3 py-3">
        {/* Camera Button (mobile - opens camera directly) */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isActuallyDisabled}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-amber-400/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-40"
          title="Kamera"
        >
          <FaCamera className="text-sm" />
        </button>

        {/* Gallery Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isActuallyDisabled}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-amber-400/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-40"
          title="Galeri"
        >
          <FaImage className="text-sm" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <TextareaAutosize
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLimitReached
                ? 'Günlük limit doldu (Gece 00:00 sıfırlanır)'
                : placeholder || 'Yemek fotoğrafı ekle veya mesaj yaz...'
            }
            disabled={isActuallyDisabled}
            maxRows={4}
            className="w-full resize-none bg-stone-100 dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700/60 rounded-2xl px-4 py-2.5 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all disabled:opacity-40"
          />
        </div>

        {/* Send Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={isActuallyDisabled || (!text.trim() && !imageBase64)}
          className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-md ${
            isActuallyDisabled
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-500 dark:text-zinc-500'
              : text.trim() || imageBase64
                ? 'bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-amber-500/25'
                : 'bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600'
          }`}
        >
          {disabled ? (
            <FaSpinner className="text-sm animate-spin" />
          ) : (
            <FaPaperPlane className="text-xs" />
          )}
        </motion.button>
      </div>

      {/* Subtle remaining quota caption if not limit reached */}
      {!isLimitReached && typeof remainingQuota === 'number' && typeof dailyLimit === 'number' && (
        <div className="px-4 pb-2 pt-0 flex items-center justify-between text-[11px] text-stone-400 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Kalan analiz hakkı: <strong className="text-stone-700 dark:text-zinc-300">{remainingQuota} / {dailyLimit}</strong>
          </span>
          <span className="text-[10px]">Her gece 00:00'da yenilenir</span>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
