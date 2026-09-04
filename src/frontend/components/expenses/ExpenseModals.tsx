import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaCheck, FaExclamationTriangle, FaTrash, FaTags } from 'react-icons/fa';
import CalendarPicker from '../CalendarPicker';
import CustomSelect from '../CustomSelect';
import type { Expense } from '../../hooks/useExpenses';
import { isPdfPreviouslySaved } from '../../services/pdfImportHistoryService';

interface ExpenseModalsProps {
  t: (key: string) => string;
  isDark: boolean;
  dateLocale: any;
  // Add Expense Modal
  isAddModalOpen: boolean;
  setIsAddModalOpen: (val: boolean) => void;
  isEditing: boolean;
  newExpense: Partial<Expense>;
  setNewExpense: React.Dispatch<React.SetStateAction<Partial<Expense>>>;
  handleAddExpense: () => void;
  categories: string[];
  // Bulk Category Modal
  isBulkCategoryModalOpen: boolean;
  setIsBulkCategoryModalOpen: (val: boolean) => void;
  bulkCategory: string;
  setBulkCategory: (val: string) => void;
  applyBulkCategory: () => void;
  selectedIds: Set<string>;
  // Import Preview Modal
  isImportPreviewOpen: boolean;
  setIsImportPreviewOpen: (val: boolean) => void;
  importPreview: any[];
  confirmImport: () => void;
  handleDeletePreviewItem: (idx: number) => void;
  importedFileNames?: string[];
  expenses?: Expense[];
  userId?: string;
  setImportPreview?: React.Dispatch<React.SetStateAction<any[]>>;
  // JSON Import Modal
  isJsonImportModalOpen: boolean;
  setIsJsonImportModalOpen: (val: boolean) => void;
  jsonInput: string;
  setJsonInput: (val: string) => void;
  handleJsonParse: () => void;
  // Investment Modal
  isInvestmentModalOpen: boolean;
  setIsInvestmentModalOpen: (val: boolean) => void;
  newInvestment: any;
  setNewInvestment: React.Dispatch<React.SetStateAction<any>>;
  handleAddInvestment: () => void;
  isInvestmentEditing?: boolean;
  // Delete Confirmation Modal
  isDeleteConfirmModalOpen: boolean;
  setIsDeleteConfirmModalOpen: (val: boolean) => void;
  confirmDeleteAction: () => void;
  deleteItemTitle: string;
  // Add Category Modal
  isAddCategoryModalOpen?: boolean;
  setIsAddCategoryModalOpen?: (val: boolean) => void;
  newCategoryName?: string;
  setNewCategoryName?: (val: string) => void;
  handleAddCategorySubmit?: () => void;
}

const ExpenseModals: React.FC<ExpenseModalsProps> = ({
  t,
  isAddModalOpen,
  setIsAddModalOpen,
  isEditing,
  newExpense,
  setNewExpense,
  handleAddExpense,
  categories,
  isBulkCategoryModalOpen,
  setIsBulkCategoryModalOpen,
  bulkCategory,
  setBulkCategory,
  applyBulkCategory,
  selectedIds,
  isImportPreviewOpen,
  setIsImportPreviewOpen,
  importPreview,
  confirmImport,
  handleDeletePreviewItem,
  importedFileNames = [],
  expenses = [],
  userId,
  setImportPreview,
  isInvestmentModalOpen,
  setIsInvestmentModalOpen,
  newInvestment,
  setNewInvestment,
  handleAddInvestment,
  isInvestmentEditing,
  isDeleteConfirmModalOpen,
  setIsDeleteConfirmModalOpen,
  confirmDeleteAction,
  deleteItemTitle,
  isAddCategoryModalOpen,
  setIsAddCategoryModalOpen,
  newCategoryName,
  setNewCategoryName,
  handleAddCategorySubmit
}) => {
  // Check if any imported file was previously saved (only saved via "Hepsini Kaydet")
  const previouslySavedFiles = React.useMemo(() => {
    if (!importedFileNames || importedFileNames.length === 0) return [];
    return importedFileNames.filter(name => isPdfPreviouslySaved(userId, name).isSaved);
  }, [importedFileNames, userId]);

  // Identify duplicate items with existing expenses
  const duplicateIndices = React.useMemo(() => {
    if (!expenses || !importPreview || expenses.length === 0) return new Set<number>();
    const set = new Set<number>();
    importPreview.forEach((item, idx) => {
      const isDup = expenses.some(exp =>
        exp.date === item.date &&
        Math.abs(Number(exp.amount) - Number(item.amount)) < 0.01 &&
        exp.title.trim().toLowerCase() === String(item.title).trim().toLowerCase()
      );
      if (isDup) set.add(idx);
    });
    return set;
  }, [expenses, importPreview]);

  const handleFilterDuplicates = () => {
    if (setImportPreview && duplicateIndices.size > 0) {
      setImportPreview(prev => prev.filter((_, idx) => !duplicateIndices.has(idx)));
    }
  };
  return (
    <>
      {/* Add/Edit Expense Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative flex flex-col w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200/60 dark:border-zinc-800/60 max-h-[82vh] sm:max-h-[88vh] my-auto"
            >
              {/* Header - Sabit */}
              <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-stone-100 dark:border-zinc-800/60 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                    {isEditing ? t('expenses.editTitle') : t('expenses.addTitle')}
                  </h2>
                  <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                    Harcama Bilgileri
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Body - Kaydırılabilir */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                    Harcama Başlığı
                  </label>
                  <input
                    type="text"
                    value={newExpense.title || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                    placeholder="Örn: Market Alışverişi"
                    className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      Tutar (₺)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newExpense.amount || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      Tarih
                    </label>
                    <CalendarPicker
                      selectedDate={newExpense.date || ''}
                      onChange={(date) => setNewExpense({ ...newExpense, date })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      İşlem Yönü
                    </label>
                    <div className="flex bg-stone-100 dark:bg-zinc-800 p-1 rounded-2xl border border-stone-200/50 dark:border-zinc-700/50">
                      <button
                        type="button"
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                          newExpense.direction !== 'gelen'
                            ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-sm'
                            : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
                        }`}
                        onClick={() => setNewExpense({ ...newExpense, direction: 'giden' })}
                      >
                        Giden
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                          newExpense.direction === 'gelen'
                            ? 'bg-white dark:bg-zinc-900 text-emerald-500 shadow-sm'
                            : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
                        }`}
                        onClick={() => setNewExpense({ ...newExpense, direction: 'gelen' })}
                      >
                        Gelen
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      Kategori
                    </label>
                    <CustomSelect
                      value={newExpense.category || ''}
                      onChange={(val) => setNewExpense({ ...newExpense, category: val })}
                      options={categories}
                      placeholder="Seçiniz..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      Kaynak (Örn: Banka / Kart)
                    </label>
                    <input
                      type="text"
                      value={newExpense.source || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, source: e.target.value })}
                      placeholder="Örn: Vadesiz Hesap"
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      İşlem Tipi
                    </label>
                    <input
                      type="text"
                      value={newExpense.type || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                      placeholder="Örn: Havale, Kredi Kartı"
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      Taksit Sayısı
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newExpense.installmentCount || 1}
                      onChange={(e) => setNewExpense({ ...newExpense, installmentCount: parseInt(e.target.value) || 1 })}
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">
                      Açıklama (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={newExpense.description || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="Detaylar..."
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </div>

              {/* Footer - Sabit */}
              <div className="flex-shrink-0 p-4 sm:p-6 bg-stone-50/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-stone-100 dark:border-zinc-800/60">
                <button
                  onClick={handleAddExpense}
                  disabled={!newExpense.title || !newExpense.amount}
                  className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl flex items-center justify-center gap-2"
                >
                  {isEditing ? <FaCheck /> : <FaPlus />}
                  {isEditing ? t('common.save') : t('common.add')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Category Modal */}
      <AnimatePresence>
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddCategoryModalOpen?.(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-8 border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shadow-md">
                    <FaTags size={14} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-900 dark:text-white">Yeni Kategori</h2>
                    <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                      Harcama Kategorisi Oluştur
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddCategoryModalOpen?.(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-2">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={newCategoryName || ''}
                    onChange={(e) => setNewCategoryName?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategorySubmit?.();
                    }}
                    placeholder="Örn: Ev & Yaşam, Sağlık..."
                    autoFocus
                    className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-4 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsAddCategoryModalOpen?.(false)}
                    className="flex-1 py-3.5 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAddCategorySubmit}
                    disabled={!newCategoryName?.trim()}
                    className="flex-1 py-3.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
                  >
                    Oluştur
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Category Modal */}
      <AnimatePresence>
        {isBulkCategoryModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkCategoryModalOpen(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-8 border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-stone-900 dark:text-white">Kategori Değiştir</h2>
                  <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                    {selectedIds.size} {t('expenses.transactionCount')}
                  </p>
                </div>
                <button
                  onClick={() => setIsBulkCategoryModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-4 items-start border border-amber-100 dark:border-amber-900/30">
                  <FaExclamationTriangle className="text-amber-500 mt-1 shrink-0" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 leading-relaxed">
                    Seçili tüm harcamalar yeni belirlediğiniz kategoriye taşınacaktır.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-2">Yeni Kategori</label>
                  <CustomSelect
                    value={bulkCategory}
                    onChange={setBulkCategory}
                    options={categories}
                    placeholder="Kategori seçin..."
                  />
                </div>

                <button
                  onClick={applyBulkCategory}
                  className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl"
                >
                  Değişiklikleri Uygula
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Preview Modal */}
      <AnimatePresence>
        {isImportPreviewOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportPreviewOpen(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-stone-900 dark:text-white">İçe Aktarma Önizleme</h2>
                    <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                      {importPreview.length} Harcama Bulundu
                    </p>
                  </div>
                  <button
                    onClick={() => setIsImportPreviewOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Previously Saved PDF Warning Banner */}
                {previouslySavedFiles.length > 0 && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
                    <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-500 text-base" />
                    <div>
                      <p className="font-black text-sm">Dikkat: Bu PDF daha önce kaydedilmiş!</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/80">
                        <span className="font-bold underline">{previouslySavedFiles.join(', ')}</span> isimli dosya daha önce "Hepsini Kaydet" ile sisteme kaydedilmiş. Tekrar kaydetmeniz mükerrer kayıtlara yol açabilir.
                      </p>
                    </div>
                  </div>
                )}

                {/* Duplicate Entries Detected Banner */}
                {duplicateIndices.size > 0 && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="shrink-0 text-rose-500" />
                      <span>
                        Mevcut harcamalarınızda zaten bulunan <strong>{duplicateIndices.size}</strong> adet mükerrer kayıt tespit edildi.
                      </span>
                    </div>
                    {setImportPreview && (
                      <button
                        type="button"
                        onClick={handleFilterDuplicates}
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] tracking-wide transition-all shadow-sm active:scale-95"
                      >
                        Mükerrerleri Ayıkla
                      </button>
                    )}
                  </div>
                )}

                <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6">
                  {importPreview.map((item, idx) => {
                    const isDuplicate = duplicateIndices.has(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${
                          isDuplicate
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40'
                            : 'bg-stone-50/50 dark:bg-zinc-800/30 border-stone-100 dark:border-zinc-800/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{item.title}</p>
                            {isDuplicate && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                                Zaten Ekli
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-stone-400">{item.date}</p>
                            {item.category && (
                              <span className="text-[10px] text-stone-400">• {item.category}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-stone-900 dark:text-white">₺{item.amount.toLocaleString()}</span>
                          <button
                            onClick={() => handleDeletePreviewItem(idx)}
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Listeden Kaldır"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsImportPreviewOpen(false)}
                    className="flex-1 py-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    onClick={confirmImport}
                    className="flex-1 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Hepsini Kaydet
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Investment Modal */}
      <AnimatePresence>
        {isInvestmentModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvestmentModalOpen(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-stone-900 dark:text-white">
                      {isInvestmentEditing ? 'Yatırımı Düzenle' : 'Yeni Yatırım Ekle'}
                    </h2>
                    <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                      Altın Varlığı
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInvestmentModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">Yatırım Başlığı</label>
                    <input
                      type="text"
                      value={newInvestment.title}
                      onChange={(e) => setNewInvestment({ ...newInvestment, title: e.target.value })}
                      placeholder="Örn: Şubat Birikimi"
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">Alış Fiyatı (1g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newInvestment.buyPrice || ''}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          setNewInvestment({ ...newInvestment, buyPrice: price });
                        }}
                        placeholder="0.00"
                        className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">Toplam Tutar (TL)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newInvestment.buyPrice > 0 && newInvestment.amount > 0 ? (newInvestment.buyPrice * newInvestment.amount).toFixed(2) : ''}
                        onChange={(e) => {
                          const total = parseFloat(e.target.value) || 0;
                          if (newInvestment.buyPrice > 0) {
                            const calculatedAmount = total / newInvestment.buyPrice;
                            setNewInvestment({ ...newInvestment, amount: Number(calculatedAmount.toFixed(4)) });
                          }
                        }}
                        placeholder="0.00"
                        className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">Miktar (Gram)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newInvestment.amount || ''}
                      onChange={(e) => setNewInvestment({ ...newInvestment, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0000"
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-2">Tarih</label>
                    <CalendarPicker
                      selectedDate={newInvestment.date || ''}
                      onChange={(date) => setNewInvestment({ ...newInvestment, date })}
                    />
                  </div>

                  <button
                    onClick={handleAddInvestment}
                    disabled={!newInvestment.title || !newInvestment.amount || !newInvestment.buyPrice}
                    className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-xl mt-2"
                  >
                    {isInvestmentEditing ? 'Güncelle' : 'Yatırımı Kaydet'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmModalOpen(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-8 border border-stone-200/50 dark:border-zinc-800/50 text-center"
            >
              <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FaExclamationTriangle className="text-rose-500 text-xl" />
              </div>

              <h3 className="text-lg font-black text-stone-900 dark:text-white mb-1.5 uppercase tracking-tight">Kalıcı Olarak Silinsin mi?</h3>
              <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mb-6 leading-relaxed">
                <span className="font-black text-stone-900 dark:text-white">"{deleteItemTitle}"</span> kalıcı olarak silinecek. Bu işlem geri alınamaz.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteConfirmModalOpen(false)}
                  className="flex-1 py-3.5 bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    confirmDeleteAction();
                    setIsDeleteConfirmModalOpen(false);
                  }}
                  className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExpenseModals;
