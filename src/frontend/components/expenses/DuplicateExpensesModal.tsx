// src/frontend/components/expenses/DuplicateExpensesModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaCheck, FaLayerGroup, FaExclamationTriangle } from 'react-icons/fa';
import type { Expense } from '../../hooks/useExpenses';

export interface DuplicateGroup {
  key: string;
  title: string;
  amount: number;
  date: string;
  direction?: 'gelen' | 'giden';
  items: Expense[];
}

interface DuplicateExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onDeleteSelected: (ids: string[]) => Promise<void>;
  isDark?: boolean;
}

export const DuplicateExpensesModal: React.FC<DuplicateExpensesModalProps> = ({
  isOpen,
  onClose,
  expenses,
  onDeleteSelected,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Aynı gün, aynı tutar ve aynı isimdeki harcamaları grupla
  const duplicateGroups: DuplicateGroup[] = useMemo(() => {
    const map = new Map<string, Expense[]>();

    for (const exp of expenses) {
      if (exp.isDeleted) continue;
      const key = `${exp.date}_${Number(exp.amount).toFixed(2)}_${exp.title.trim().toLowerCase()}_${exp.direction || 'giden'}`;
      const existing = map.get(key) || [];
      existing.push(exp);
      map.set(key, existing);
    }

    const groups: DuplicateGroup[] = [];
    for (const [key, items] of map.entries()) {
      if (items.length > 1) {
        // En eski oluşturulandan en yeniye doğru sırala
        const sorted = [...items].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        groups.push({
          key,
          title: sorted[0].title,
          amount: sorted[0].amount,
          date: sorted[0].date,
          direction: sorted[0].direction,
          items: sorted,
        });
      }
    }

    // Grupları tarihe göre azalan (en yeni tarih en başta) sırala
    return groups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses]);

  // Modal her açıldığında akıllı varsayılan seçim:
  // Her gruptaki ilk (en eski) kaydı KORU, sonraki mükerrer kopyaları seçili yap
  useEffect(() => {
    if (isOpen) {
      const defaultSelected = new Set<string>();
      duplicateGroups.forEach(group => {
        // group.items[0] korunur, [1..N] silinmek üzere işaretlenir
        for (let i = 1; i < group.items.length; i++) {
          defaultSelected.add(group.items[i].id);
        }
      });
      setSelectedIds(defaultSelected);
    }
  }, [isOpen, duplicateGroups]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectRecommended = () => {
    const recommended = new Set<string>();
    duplicateGroups.forEach(group => {
      for (let i = 1; i < group.items.length; i++) {
        recommended.add(group.items[i].id);
      }
    });
    setSelectedIds(recommended);
  };

  const handleSelectAll = () => {
    const all = new Set<string>();
    duplicateGroups.forEach(group => {
      group.items.forEach(item => all.add(item.id));
    });
    setSelectedIds(all);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Seçilen ${count} adet mükerrer harcama silinecektir. Bu işlemi onaylıyor musunuz?`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await onDeleteSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    } catch (err) {
      console.error('Mükerrer harcama silme hatası:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const totalDuplicateCopies = duplicateGroups.reduce(
    (sum, g) => sum + (g.items.length - 1),
    0
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative flex flex-col w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200/60 dark:border-zinc-800/60 max-h-[88vh] my-auto"
        >
          {/* Modal Header */}
          <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-stone-100 dark:border-zinc-800/60 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FaLayerGroup size={18} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  Mükerrer Harcamaları İncele & Yönet
                </h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                  Aynı gün, aynı tutar ve aynı isimdeki kayıtlar gruplandı.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
            >
              <FaTimes />
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex-shrink-0 px-5 sm:px-6 py-3 bg-stone-50 dark:bg-zinc-800/40 border-b border-stone-100 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700 dark:text-zinc-300">
                {duplicateGroups.length} Grup
              </span>
              <span className="text-stone-300 dark:text-zinc-600">•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {totalDuplicateCopies} Fazla Kopya
              </span>
              <span className="text-stone-300 dark:text-zinc-600">•</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {selectedIds.size} Silinmek Üzere Seçili
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectRecommended}
                className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-semibold transition-all"
                title="Her gruptan ilk asıl kaydı korur, diğer kopyaları seçer"
              >
                Önerilen Seçim
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded-xl bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-600 text-stone-700 dark:text-zinc-200 font-semibold transition-all"
              >
                Tümünü Seç
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 rounded-xl bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-600 text-stone-700 dark:text-zinc-200 font-semibold transition-all"
              >
                Temizle
              </button>
            </div>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {duplicateGroups.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                  <FaCheck size={24} />
                </div>
                <h3 className="text-base font-bold text-stone-800 dark:text-white">
                  Mükerrer Harcama Bulunamadı
                </h3>
                <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1">
                  Tüm kayıtlarınız benzersiz görünüyor.
                </p>
              </div>
            ) : (
              duplicateGroups.map((group, groupIdx) => {
                const groupSelectedCount = group.items.filter(i => selectedIds.has(i.id)).length;
                const allSelected = groupSelectedCount === group.items.length;

                return (
                  <div
                    key={group.key || groupIdx}
                    className="p-4 rounded-2xl sm:rounded-3xl bg-stone-50/70 dark:bg-zinc-800/30 border border-stone-200/70 dark:border-zinc-800/80 space-y-3 transition-all"
                  >
                    {/* Grup Başlığı */}
                    <div className="flex items-center justify-between border-b border-stone-200/50 dark:border-zinc-800/50 pb-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase">
                            Grup {groupIdx + 1}
                          </span>
                          <h4 className="text-sm font-black text-stone-900 dark:text-white truncate">
                            {group.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400 dark:text-zinc-500">
                          <span>📅 {group.date}</span>
                          <span>•</span>
                          <span className="font-bold text-stone-800 dark:text-zinc-200">
                            ₺{Number(group.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                          <span>•</span>
                          <span>{group.items.length} adet kayıt</span>
                        </div>
                      </div>

                      {allSelected && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-xl flex items-center gap-1 shrink-0">
                          <FaExclamationTriangle size={10} />
                          Tümü Siliniyor
                        </span>
                      )}
                    </div>

                    {/* Gruptaki Kayıtlar */}
                    <div className="space-y-2">
                      {group.items.map((item, itemIdx) => {
                        const isSelected = selectedIds.has(item.id);
                        const isPrimaryOriginal = itemIdx === 0;

                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelect(item.id)}
                            className={`flex items-center justify-between p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/60 shadow-sm'
                                : isPrimaryOriginal
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-900/30'
                                : 'bg-white dark:bg-zinc-800/50 border-stone-200/60 dark:border-zinc-700/50 hover:bg-stone-100/50 dark:hover:bg-zinc-700/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Checkbox */}
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                                  isSelected
                                    ? 'bg-rose-500 text-white shadow-sm'
                                    : 'border-2 border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                                }`}
                              >
                                {isSelected && <FaCheck size={10} />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                                    {item.title}
                                  </p>
                                  {isPrimaryOriginal ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
                                      Asıl Kayıt
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                                      Kopya #{itemIdx}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-400 dark:text-zinc-500">
                                  <span>Kategori: {item.category || 'Genel'}</span>
                                  {item.createdAt && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        Eklenme: {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-3">
                              <span className="text-xs font-black text-stone-900 dark:text-white">
                                ₺{Number(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                              <p className={`text-[10px] font-bold ${
                                isSelected
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-stone-400 dark:text-zinc-500'
                              }`}>
                                {isSelected ? 'Silinecek' : 'Korunacak'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-stone-100 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-stone-500 dark:text-zinc-400 text-center sm:text-left">
              {selectedIds.size > 0 ? (
                <span>
                  Toplam <strong className="text-rose-600 dark:text-rose-400">{selectedIds.size}</strong> adet mükerrer harcama silinecek.
                </span>
              ) : (
                <span>Silinmek üzere kayıt seçilmedi.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Kapat
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={selectedIds.size === 0 || isDeleting}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <FaTrash size={12} />
                <span>
                  {isDeleting ? 'Siliniyor...' : `Seçilenleri Sil (${selectedIds.size})`}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DuplicateExpensesModal;
