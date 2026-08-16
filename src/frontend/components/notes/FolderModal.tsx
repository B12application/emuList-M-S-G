// src/frontend/components/notes/FolderModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFolder, FaTimes, FaCheck, FaChevronDown, FaSearch, FaLayerGroup, FaFolderOpen } from 'react-icons/fa';
import type { NoteFolder } from '../../types/notes';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit?: NoteFolder | null;
  folders: NoteFolder[];
  onSave: (name: string, color: string, parentId: string | null) => Promise<any>;
}

const FOLDER_COLORS = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#f97316', // Orange
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

export default function FolderModal({
  isOpen,
  onClose,
  folderToEdit,
  folders,
  onSave,
}: FolderModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');
  const comboboxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name || '');
      setColor(folderToEdit.color || FOLDER_COLORS[0]);
      setParentId(folderToEdit.parentId ?? null);
    } else {
      setName('');
      setColor(FOLDER_COLORS[0]);
      setParentId(null);
    }
    setIsComboboxOpen(false);
    setComboboxSearch('');
  }, [folderToEdit, isOpen]);

  // Click outside to close combobox
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsComboboxOpen(false);
      }
    };
    if (isComboboxOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isComboboxOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave(name.trim(), color, parentId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const eligibleParents = folders.filter(
    (f) => !folderToEdit || f.id !== folderToEdit.id
  );

  const filteredEligibleParents = eligibleParents.filter((f) =>
    f.name.toLowerCase().includes(comboboxSearch.toLowerCase())
  );

  const selectedParentFolder = parentId ? folders.find((f) => f.id === parentId) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-zinc-800 z-10"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: color }}
              >
                <FaFolder />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                  {folderToEdit ? 'Klasörü Düzenle' : 'Yeni Klasör Oluştur'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Notlarınızı organize etmek için klasör ve konum seçin
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5">
                Klasör Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="örn. İş Notları, Fikirler, Kitap Özetleri..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-400 outline-none text-sm placeholder:text-stone-400 dark:placeholder:text-zinc-500 transition-all"
                autoFocus
                required
              />
            </div>

            {/* Custom Designed Combobox for Target Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5">
                Nereye Eklenecek? (Konum / Üst Klasör)
              </label>
              <div className="relative" ref={comboboxRef}>
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-white hover:border-amber-400 focus:ring-2 focus:ring-amber-400 outline-none text-sm flex items-center justify-between gap-2 text-left transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedParentFolder ? (
                      <>
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: selectedParentFolder.color || '#f59e0b' }}
                        />
                        <FaFolderOpen className="text-amber-500 shrink-0 text-sm" />
                        <span className="font-semibold text-stone-800 dark:text-zinc-100 truncate">
                          {selectedParentFolder.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <FaLayerGroup className="text-xs" />
                        </div>
                        <span className="font-semibold text-stone-800 dark:text-zinc-100 truncate">
                          Ana Dizin (Kök Seviye)
                        </span>
                      </>
                    )}
                  </div>
                  <FaChevronDown
                    className={`text-xs text-stone-400 transition-transform duration-200 shrink-0 ${
                      isComboboxOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Combobox Dropdown */}
                <AnimatePresence>
                  {isComboboxOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 4, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full z-50 bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-700/90 rounded-2xl shadow-2xl overflow-hidden p-2 space-y-1"
                    >
                      {/* Search Filter inside combobox if multiple folders */}
                      {eligibleParents.length > 4 && (
                        <div className="relative mb-2 px-1">
                          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                          <input
                            type="text"
                            value={comboboxSearch}
                            onChange={(e) => setComboboxSearch(e.target.value)}
                            placeholder="Klasörlerde ara..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-xs text-stone-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-400"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}

                      <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
                        {/* Option 1: Root Folder */}
                        <button
                          type="button"
                          onClick={() => {
                            setParentId(null);
                            setIsComboboxOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            parentId === null
                              ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                              : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FaLayerGroup className="text-sm opacity-80" />
                            <span>Ana Dizin (Kök Seviye)</span>
                          </div>
                          {parentId === null && <FaCheck className="text-xs" />}
                        </button>

                        {/* Options: Eligible Parents */}
                        {filteredEligibleParents.map((f) => {
                          const isSelected = parentId === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setParentId(f.id);
                                setIsComboboxOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                  style={{ backgroundColor: f.color || '#f59e0b' }}
                                />
                                <FaFolder className="text-xs opacity-75 shrink-0" />
                                <span className="truncate">{f.name}</span>
                              </div>
                              {isSelected && <FaCheck className="text-xs shrink-0" />}
                            </button>
                          );
                        })}

                        {filteredEligibleParents.length === 0 && comboboxSearch && (
                          <div className="p-3 text-center text-xs text-stone-400 dark:text-zinc-500">
                            Klasör bulunamadı
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-2">
                Klasör Rengi
              </label>
              <div className="flex flex-wrap gap-2.5">
                {FOLDER_COLORS.map((c) => {
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-xl transition-all flex items-center justify-center shadow-sm ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-white scale-110'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {isSelected && <FaCheck className="text-white text-xs" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 text-sm font-semibold transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold rounded-2xl shadow-md shadow-amber-500/20 text-sm transition-all flex items-center gap-2"
              >
                {loading ? 'Kaydediliyor...' : folderToEdit ? 'Güncelle' : 'Klasör Oluştur'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
