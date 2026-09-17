// src/frontend/components/body/ExercisePreviewModal.tsx
// B12 Spor Bilimi — Egzersiz GIF & Video Önizleme Modalı
// Kural 5 (Unified Modal Architecture) ve Kural 16 (Ekran Ölçeklenebilirliği) Standartlarına Tam Uyumlu

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDumbbell,
  FaTimes,
  FaYoutube,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaPlay,
  FaImage,
  FaSpinner
} from 'react-icons/fa';
import type { ExerciseMedia } from '../../data/exerciseMediaData';
import { useLanguage } from '../../context/LanguageContext';

interface ExercisePreviewModalProps {
  exercise: ExerciseMedia | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExercisePreviewModal({
  exercise,
  isOpen,
  onClose,
}: ExercisePreviewModalProps) {
  const { t } = useLanguage();
  const [activeMediaTab, setActiveMediaTab] = useState<'gif' | 'video'>('gif');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !exercise) return null;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.youtubeQuery || `${exercise.englishName} form`
  )}`;

  const embedUrl = exercise.youtubeVideoId
    ? `https://www.youtube-nocookie.com/embed/${exercise.youtubeVideoId}?autoplay=1&rel=0`
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* ── MODAL BAŞLIĞI (HEADER) ── */}
          <div className="px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50/80 dark:bg-zinc-900/80 shrink-0">
            <div className="flex items-center gap-3 pr-2 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center shrink-0 text-lg">
                <FaDumbbell />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white truncate">
                    {exercise.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
                    {exercise.categoryLabel}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-zinc-400 truncate mt-0.5">
                  {exercise.englishName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 flex items-center justify-center text-stone-600 dark:text-zinc-300 font-bold transition-colors cursor-pointer shrink-0"
              aria-label="Kapat"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* ── MODAL GÖVDESİ (SCROLLABLE BODY) ── */}
          <div className="max-h-[75vh] sm:max-h-[80vh] overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-4">
            {/* Medya Sekmesi (GIF / Video Değiştirici) */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('gif')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeMediaTab === 'gif'
                      ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <FaImage className="text-amber-500" />
                  <span>Animasyonlu GIF</span>
                </button>
                {embedUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('video')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeMediaTab === 'video'
                        ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs'
                        : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <FaPlay className="text-rose-500 text-[10px]" />
                    <span>Video Oynatıcı</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30">
                {exercise.defaultSetsReps}
              </span>
            </div>

            {/* Medya Görüntüleyici Konteyneri */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-stone-950 border border-stone-200 dark:border-zinc-800 flex items-center justify-center shadow-inner">
              {activeMediaTab === 'gif' ? (
                <>
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400">
                      <FaSpinner className="animate-spin text-2xl text-amber-400" />
                      <span className="text-xs font-medium">Animasyon yükleniyor...</span>
                    </div>
                  )}

                  {imageError ? (
                    <div className="p-6 text-center space-y-2">
                      <FaExclamationTriangle className="text-amber-500 text-3xl mx-auto mb-1" />
                      <p className="text-xs text-stone-300">
                        Animasyon GIF şu an yüklenemedi. YouTube üzerinden videolu anlatımı izleyebilirsiniz.
                      </p>
                      <a
                        href={youtubeSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                      >
                        <FaYoutube />
                        <span>YouTube'da Aç</span>
                      </a>
                    </div>
                  ) : (
                    <img
                      src={exercise.gifUrl}
                      alt={exercise.name}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      className={`w-full h-full object-contain transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}
                </>
              ) : embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={exercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : null}
            </div>

            {/* Hedef Kaslar Rozetleri */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase text-stone-500 dark:text-zinc-400 tracking-wider">
                🎯 Odak Kas Grubu &amp; Lifler:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {exercise.targetMuscles.map((muscle, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-bold"
                  >
                    {muscle}
                  </span>
                ))}
                {exercise.secondaryMuscles?.map((muscle, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 text-xs font-medium"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>

            {/* Adım Adım Doğru Form Talimatları */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 space-y-2.5">
              <span className="text-xs font-black uppercase text-stone-900 dark:text-white flex items-center gap-1.5">
                <FaCheckCircle className="text-emerald-500" />
                Adım Adım Doğru Uygulama Formu
              </span>
              <div className="space-y-2 text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
                {exercise.instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kaçınılması Gereken Form Hataları */}
            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 space-y-2">
                <span className="text-xs font-black uppercase text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                  <FaExclamationTriangle />
                  Ölümcül Form Hataları (Kaçının!)
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-stone-700 dark:text-zinc-300">
                  {exercise.commonMistakes.map((mistake, idx) => (
                    <li key={idx}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Uzman Antrenör / Spor Hekimliği Tüyosu (Pro Tip) */}
            {exercise.proTip && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <FaLightbulb className="text-amber-500 text-base shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block mb-0.5">💡 Uzman Tüyosu:</span>
                  <p className="leading-relaxed">{exercise.proTip}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── SABİT ALT AKSİYON ÇUBUĞU (STICKY FOOTER) ── */}
          <div className="px-5 sm:px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <FaYoutube className="text-sm" />
              <span>YouTube'da Detaylı İzle</span>
              <FaExternalLinkAlt className="text-[10px]" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
