// src/frontend/components/body/ExerciseCatalogModal.tsx
// B12 Spor Bilimi — Tüm Egzersizler Kataloğu & Hareket Arama Modalı
// Kural 5 ve Kural 16 standartlarına tam uyumlu, geniş ve akışkan liste

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDumbbell,
  FaTimes,
  FaSearch,
  FaPlay,
  FaFilter,
  FaEye
} from 'react-icons/fa';
import {
  EXERCISE_MEDIA_DATABASE,
  type ExerciseMedia,
  type ExerciseCategory
} from '../../data/exerciseMediaData';

interface ExerciseCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseMedia) => void;
}

const CATEGORY_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Tüm Egzersizler' },
  { key: 'delts', label: 'Omuz' },
  { key: 'pectorals', label: 'Göğüs' },
  { key: 'lats', label: 'Sırt & Kanat' },
  { key: 'biceps', label: 'Pazu (Biceps)' },
  { key: 'triceps', label: 'Arka Kol (Triceps)' },
  { key: 'abs', label: 'Karın & Bel' },
  { key: 'quads', label: 'Bacak & Uyluk' },
  { key: 'hamstrings', label: 'Arka Bacak' },
  { key: 'calves', label: 'Baldır (Kalf)' },
  { key: 'glutes', label: 'Kalça' },
  { key: 'traps', label: 'Trapez & Boyun' },
  { key: 'forearms', label: 'Ön Kol' }
];

export default function ExerciseCatalogModal({
  isOpen,
  onClose,
  onSelectExercise
}: ExerciseCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredExercises = useMemo(() => {
    return EXERCISE_MEDIA_DATABASE.filter(ex => {
      const matchesCategory =
        selectedCategory === 'all' || ex.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.englishName.toLowerCase().includes(q) ||
        ex.targetMuscles.some(m => m.toLowerCase().includes(q)) ||
        ex.keywords.some(k => k.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* ── MODAL BAŞLIĞI ── */}
          <div className="px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50/80 dark:bg-zinc-900/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-lg shadow-sm">
                <FaDumbbell />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                  Egzersiz Kataloğu &amp; GIF Animasyon Kütüphanesi
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Spor hekimliği ve hipertrofi standartlarına göre kanıtlanmış egzersiz formları
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

          {/* ── ARAMA & KATEGORİ FİLTRELERİ ── */}
          <div className="px-5 sm:px-6 py-3 border-b border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5 shrink-0">
            {/* Arama Girişi */}
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Egzersiz adı, kas grubu veya hareket ara (örn: Lateral Raise, Squat, Mide Vakumu)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800 border-none text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-amber-400 outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 text-xs"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Kategori Hapları */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
              <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1 shrink-0 mr-1">
                <FaFilter className="text-[10px]" />
                Bölge:
              </span>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── EGZERSİZ KARTLARI LİSTESİ (SCROLLABLE GRID) ── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6">
            {filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredExercises.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => onSelectExercise(ex)}
                    className="group rounded-2xl border border-stone-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-amber-400/80 dark:hover:border-amber-400/60 p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.01]"
                  >
                    <div>
                      {/* Önizleme Görseli / GIF Alanı */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-stone-950 mb-2.5 flex items-center justify-center border border-stone-100 dark:border-zinc-800">
                        <img
                          src={ex.gifUrl}
                          alt={ex.name}
                          loading="lazy"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-black text-amber-300">
                          {ex.categoryLabel}
                        </div>
                        <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md">
                            <FaEye />
                            İzle
                          </span>
                        </div>
                      </div>

                      {/* Egzersiz Başlığı & İngilizce İsim */}
                      <h4 className="font-bold text-xs text-stone-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                        {ex.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500 line-clamp-1">
                        {ex.englishName}
                      </p>

                      {/* Hedef Kaslar */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ex.targetMuscles.slice(0, 2).map((m, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Alt Bilgi & Önizle Butonu */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-stone-500 dark:text-zinc-400 text-[10.5px]">
                        {ex.defaultSetsReps}
                      </span>
                      <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                        <FaPlay className="text-[9px]" />
                        Önizle
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <FaDumbbell className="text-3xl text-stone-300 dark:text-zinc-700 mx-auto" />
                <p className="text-xs text-stone-500 dark:text-zinc-400 font-bold">
                  Aramanızla eşleşen egzersiz bulunamadı.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-xs font-bold text-stone-700 dark:text-zinc-300"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>

          {/* ── SABİT ALT BİLGİ ── */}
          <div className="px-5 sm:px-6 py-3 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400 shrink-0">
            <span>
              Toplam <strong>{filteredExercises.length}</strong> egzersiz listeleniyor
            </span>
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
