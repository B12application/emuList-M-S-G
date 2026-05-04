import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaCheck, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import CalendarPicker from '../CalendarPicker';
import CustomSelect from '../CustomSelect';
import type { Expense } from '../../hooks/useExpenses';

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
  isJsonImportModalOpen,
  setIsJsonImportModalOpen,
  jsonInput,
  setJsonInput,
  handleJsonParse,
  isInvestmentModalOpen,
  setIsInvestmentModalOpen,
  newInvestment,
  setNewInvestment,
  handleAddInvestment,
  isInvestmentEditing
}) => {
  return (
    <>
      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white">
                      {isEditing ? t('expenses.editTitle') : t('expenses.addTitle')}
                    </h2>
                    <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Harcama Bilgileri</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Harcama Başlığı</label>
                    <input
                      type="text"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      placeholder="Örn: Market Alışverişi"
                      className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-4 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Tutar</label>
                      <input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-4 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all placeholder:text-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Tarih</label>
                      <CalendarPicker
                        selectedDate={newExpense.date || ''}
                        onChange={(date) => setNewExpense({ ...newExpense, date })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Kategori</label>
                      <CustomSelect
                        value={newExpense.category || ''}
                        onChange={(val) => setNewExpense({ ...newExpense, category: val })}
                        options={categories}
                        placeholder="Seçiniz..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Taksit Sayısı</label>
                      <input
                        type="number"
                        min="1"
                        value={newExpense.installmentCount || 1}
                        onChange={(e) => setNewExpense({ ...newExpense, installmentCount: parseInt(e.target.value) || 1 })}
                        className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-4 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddExpense}
                    disabled={!newExpense.title || !newExpense.amount}
                    className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-stone-900/10 dark:shadow-white/10 flex items-center justify-center gap-3 mt-4"
                  >
                    {isEditing ? <FaCheck /> : <FaPlus />}
                    {isEditing ? t('common.save') : t('common.add')}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkCategoryModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl p-8 border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-stone-900 dark:text-white">Kategori Değiştir</h2>
                  <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                    {selectedIds.size} {t('expenses.transactionCount')}
                  </p>
                </div>
                <button
                  onClick={() => setIsBulkCategoryModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
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
                  <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Yeni Kategori</label>
                  <CustomSelect
                    value={bulkCategory}
                    onChange={setBulkCategory}
                    options={categories}
                    placeholder="Kategori seçin..."
                  />
                </div>

                <button
                  onClick={applyBulkCategory}
                  className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-stone-900/10 dark:shadow-white/10"
                >
                  Değişiklikleri Uygula
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JSON Import Modal */}
      <AnimatePresence>
        {isJsonImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsJsonImportModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-stone-900 dark:text-white">{t('expenses.importStatement')}</h2>
                    <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                      JSON Script Yapıştırın
                    </p>
                  </div>
                  <button
                    onClick={() => setIsJsonImportModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-6">
                  <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium leading-relaxed">
                    {t('expenses.pasteStatement')}
                  </p>
                  
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"title": "Örn Harcama", "amount": 100, "date": "2024-01-01"}]'
                    className="w-full h-64 bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-6 text-xs font-mono text-stone-900 dark:text-zinc-300 focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all custom-scrollbar resize-none"
                  />

                  <button
                    onClick={handleJsonParse}
                    disabled={!jsonInput.trim()}
                    className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl"
                  >
                    {t('expenses.parseAndImport')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Preview Modal */}
      <AnimatePresence>
        {isImportPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportPreviewOpen(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-stone-900 dark:text-white">İçe Aktarma Önizleme</h2>
                    <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                      {importPreview.length} Harcama Bulundu
                    </p>
                  </div>
                  <button
                    onClick={() => setIsImportPreviewOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-8">
                  {importPreview.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-stone-50/50 dark:bg-zinc-800/30 rounded-2xl border border-stone-100 dark:border-zinc-800/50 group">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-stone-400">{item.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-stone-900 dark:text-white">₺{item.amount.toLocaleString()}</span>
                        <button
                          onClick={() => handleDeletePreviewItem(idx)}
                          className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
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
                    className="flex-1 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-stone-900/10 dark:shadow-white/10 hover:scale-[1.02] transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvestmentModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
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
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Yatırım Başlığı</label>
                    <input
                      type="text"
                      value={newInvestment.title}
                      onChange={(e) => setNewInvestment({ ...newInvestment, title: e.target.value })}
                      placeholder="Örn: Şubat Birikimi"
                      className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-4 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Alış Fiyatı (1g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newInvestment.buyPrice || ''}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          setNewInvestment({ ...newInvestment, buyPrice: price });
                        }}
                        placeholder="0.00"
                        className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-4 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Toplam Tutar (TL)</label>
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
                        className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-4 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Miktar (Gram)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newInvestment.amount || ''}
                      onChange={(e) => setNewInvestment({ ...newInvestment, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0000"
                      className="w-full bg-stone-50 dark:bg-zinc-800 border-none rounded-[1.5rem] p-4 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-4">Tarih</label>
                    <CalendarPicker
                      selectedDate={newInvestment.date || ''}
                      onChange={(date) => setNewInvestment({ ...newInvestment, date })}
                    />
                  </div>

                  <button
                    onClick={handleAddInvestment}
                    disabled={!newInvestment.title || !newInvestment.amount || !newInvestment.buyPrice}
                    className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl"
                  >
                    {isInvestmentEditing ? 'Güncelle' : 'Yatırımı Kaydet'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExpenseModals;
