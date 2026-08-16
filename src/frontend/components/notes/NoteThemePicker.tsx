// src/frontend/components/notes/NoteThemePicker.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFont, FaPalette, FaTextHeight, FaAlignLeft, FaCheck } from 'react-icons/fa';
import type { NoteFontFamily, NoteFontSize, NoteLineHeight, NoteTheme } from '../../types/notes';

interface NoteThemePickerProps {
  isOpen: boolean;
  onClose: () => void;
  fontFamily: NoteFontFamily;
  fontSize: NoteFontSize;
  lineHeight: NoteLineHeight;
  theme: NoteTheme;
  onChangeFontFamily: (font: NoteFontFamily) => void;
  onChangeFontSize: (size: NoteFontSize) => void;
  onChangeLineHeight: (lh: NoteLineHeight) => void;
  onChangeTheme: (theme: NoteTheme) => void;
}

export const THEME_OPTIONS: Array<{
  id: NoteTheme;
  name: string;
  color: string;
  bgPreview: string;
}> = [
  { id: 'default', name: 'Standart Obsidian', color: '#f59e0b', bgPreview: 'bg-zinc-900 border-zinc-700' },
  { id: 'amber', name: 'B12 Altın Amber', color: '#f59e0b', bgPreview: 'bg-amber-500/20 border-amber-500/40' },
  { id: 'emerald', name: 'Zümrüt Ormanı', color: '#10b981', bgPreview: 'bg-emerald-500/20 border-emerald-500/40' },
  { id: 'cyan', name: 'Siber Neon', color: '#06b6d4', bgPreview: 'bg-cyan-500/20 border-cyan-500/40' },
  { id: 'purple', name: 'Mor Nebula', color: '#a855f7', bgPreview: 'bg-purple-500/20 border-purple-500/40' },
  { id: 'rose', name: 'Pembe Lotus', color: '#f43f5e', bgPreview: 'bg-rose-500/20 border-rose-500/40' },
  { id: 'sepia', name: 'Nostalji Sepya', color: '#d97706', bgPreview: 'bg-[#fbf0d9] dark:bg-[#2c2419] border-[#c4a480]' },
  { id: 'slate', name: 'Minimal Çelik', color: '#64748b', bgPreview: 'bg-slate-500/20 border-slate-500/40' },
];

export const FONT_OPTIONS: Array<{
  id: NoteFontFamily;
  name: string;
  preview: string;
  fontClass: string;
}> = [
  { id: 'sans', name: 'Inter (Modern Sans)', preview: 'Modern ve net okuma', fontClass: 'font-sans' },
  { id: 'serif', name: 'Merriweather (Zarif Serif)', preview: 'Kitap & makale stili', fontClass: 'font-serif' },
  { id: 'mono', name: 'Obsidian Mono (Kodcu)', preview: 'Hassas karakter aralığı', fontClass: 'font-mono' },
  { id: 'handwriting', name: 'Not Defteri (El Yazısı)', preview: 'Doğal günlük hissiyatı', fontClass: 'italic font-sans' },
];

export const FONT_SIZE_OPTIONS: Array<{ id: NoteFontSize; name: string; label: string }> = [
  { id: 'sm', name: 'Küçük', label: '14px' },
  { id: 'base', name: 'Normal', label: '16px' },
  { id: 'lg', name: 'Büyük', label: '18px' },
  { id: 'xl', name: 'Ekstra Büyük', label: '20px' },
];

export const LINE_HEIGHT_OPTIONS: Array<{ id: NoteLineHeight; name: string; label: string }> = [
  { id: 'compact', name: 'Sıkı', label: '1.4x' },
  { id: 'normal', name: 'Standart', label: '1.7x' },
  { id: 'relaxed', name: 'Geniş', label: '2.0x' },
];

export default function NoteThemePicker({
  isOpen,
  onClose,
  fontFamily,
  fontSize,
  lineHeight,
  theme,
  onChangeFontFamily,
  onChangeFontSize,
  onChangeLineHeight,
  onChangeTheme,
}: NoteThemePickerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-zinc-800 z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <FaPalette />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                  Yazı Stili ve Tema
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Obsidian not deneyiminizi kişiselleştirin
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-5 space-y-6 custom-scrollbar pr-1">
            {/* 1. Theme Color Presets */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-3">
                <FaPalette className="text-amber-500" />
                <span>Not Teması & Vurgu</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {THEME_OPTIONS.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onChangeTheme(t.id)}
                      className={`relative p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/30 scale-[1.02] shadow-md bg-stone-50 dark:bg-zinc-800'
                          : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-4 h-4 rounded-full shadow-inner"
                          style={{ backgroundColor: t.color }}
                        />
                        {isSelected && <FaCheck className="text-amber-500 text-xs" />}
                      </div>
                      <p className="text-xs font-bold text-stone-800 dark:text-zinc-200 truncate">
                        {t.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Font Family */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-3">
                <FaFont className="text-amber-500" />
                <span>Yazı Tipi (Font)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onChangeFontFamily(f.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/30 bg-stone-50 dark:bg-zinc-800 shadow-md'
                          : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold text-stone-900 dark:text-white ${f.fontClass}`}>
                          {f.name}
                        </span>
                        {isSelected && <FaCheck className="text-amber-500 text-xs shrink-0" />}
                      </div>
                      <p className={`text-xs text-stone-500 dark:text-zinc-400 mt-1 ${f.fontClass}`}>
                        {f.preview}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Font Size & Line Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Font Size */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-3">
                  <FaTextHeight className="text-amber-500" />
                  <span>Yazı Boyutu</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_SIZE_OPTIONS.map((s) => {
                    const isSelected = fontSize === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => onChangeFontSize(s.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold'
                            : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-semibold">{s.name}</div>
                        <div className="text-[10px] opacity-70">{s.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Line Spacing */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-3">
                  <FaAlignLeft className="text-amber-500" />
                  <span>Satır Aralığı</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LINE_HEIGHT_OPTIONS.map((l) => {
                    const isSelected = lineHeight === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => onChangeLineHeight(l.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold'
                            : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-semibold">{l.name}</div>
                        <div className="text-[10px] opacity-70">{l.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-100 dark:border-zinc-800 shrink-0 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-2xl shadow-md shadow-amber-500/20 transition-all text-sm"
            >
              Tamam
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
