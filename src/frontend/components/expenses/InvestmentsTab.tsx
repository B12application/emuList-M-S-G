// src/frontend/components/expenses/InvestmentsTab.tsx
import React, { useState, useEffect } from 'react';
import { FaGem, FaPlus, FaArrowUp, FaArrowDown, FaTrash, FaSync, FaEdit } from 'react-icons/fa';
import { type GoldPrice, fetchGoldPrice } from '../../services/priceService';
import type { Investment } from '../../hooks/useInvestments';
import toast from 'react-hot-toast';

interface InvestmentsTabProps {
  t: (key: string) => string;
  isDark: boolean;
  investments: Investment[];
  isLoading: boolean;
  onAddClick: () => void;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

const InvestmentsTab: React.FC<InvestmentsTabProps> = ({
  t,
  isDark,
  investments,
  isLoading,
  onAddClick,
  onEdit,
  onDelete
}) => {
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const loadPrice = async () => {
    setLoadingPrice(true);
    const price = await fetchGoldPrice();
    if (price) {
      setGoldPrice(price);
    } else {
      toast.error('Altın fiyatı alınamadı.');
    }
    setLoadingPrice(false);
  };

  useEffect(() => {
    loadPrice();
    const interval = setInterval(loadPrice, 60000 * 5); // every 5 mins
    return () => clearInterval(interval);
  }, []);

  const totalGrams = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCost = investments.reduce((sum, inv) => sum + (inv.amount * inv.buyPrice), 0);
  const currentTotalValue = goldPrice ? totalGrams * goldPrice.sell : 0;
  const totalProfitLoss = goldPrice ? currentTotalValue - totalCost : 0;
  const profitPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Live Price Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-stone-900 dark:bg-white p-8 rounded-[2.5rem] text-white dark:text-stone-900 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-stone-900/5 flex items-center justify-center">
                  <FaGem className="text-amber-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Canlı Gram Altın (TRY)</span>
              </div>
              <button
                onClick={loadPrice}
                className={`p-2 rounded-lg hover:bg-white/10 transition-all ${loadingPrice ? 'animate-spin' : ''}`}
              >
                <FaSync size={12} />
              </button>
            </div>

            <div className="flex items-end gap-4">
              <h2 className="text-4xl font-black">
                ₺{goldPrice ? goldPrice.sell.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
              </h2>
              {goldPrice && (
                <span className={`text-xs font-bold mb-2 flex items-center gap-1 ${goldPrice.change.startsWith('%-') ? 'text-red-400' : 'text-emerald-400'}`}>
                  {goldPrice.change.startsWith('%-') ? <FaArrowDown /> : <FaArrowUp />}
                  {goldPrice.change}
                </span>
              )}
            </div>
            <p className="text-[9px] font-bold mt-4 opacity-40 uppercase tracking-widest">Son Güncelleme: {goldPrice?.updateDate || '---'}</p>
          </div>

          {/* Abstract Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        </div>

        <div className="bg-white dark:bg-zinc-800/50 p-8 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 flex flex-col justify-center">
          <span className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Toplam Varlık</span>
          <h3 className="text-2xl font-black text-stone-900 dark:text-white">{totalGrams.toFixed(2)} g</h3>
          <p className="text-xs font-bold text-stone-400 mt-1">₺{currentTotalValue.toLocaleString()} (Güncel)</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 p-6 rounded-3xl border border-stone-100 dark:border-zinc-800">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Maliyet</p>
          <p className="text-sm font-black text-stone-900 dark:text-white">₺{totalCost.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-3xl border ${totalProfitLoss >= 0 ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Kar/Zarar</p>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-black ${totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              ₺{Math.abs(totalProfitLoss).toLocaleString()}
            </p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${totalProfitLoss >= 0 ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-end">
          <button
            onClick={onAddClick}
            className="px-8 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-stone-900/10 dark:shadow-white/10"
          >
            <FaPlus /> Yeni Yatırım Ekle
          </button>
        </div>
      </div>

      {/* Investment List */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-stone-50 dark:border-zinc-800/50">
          <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-widest">Yatırım Geçmişi</h3>
        </div>
        <div className="divide-y divide-stone-50 dark:divide-zinc-800/50">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Yatırımlar yükleniyor...</p>
            </div>
          ) : investments.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-stone-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaGem className="text-stone-300" size={24} />
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Henüz yatırım kaydı bulunmuyor</p>
            </div>
          ) : (
            investments.map((inv) => {
              const currentVal = goldPrice ? inv.amount * goldPrice.sell : 0;
              const costVal = inv.amount * inv.buyPrice;
              const profit = goldPrice ? currentVal - costVal : 0;
              const pPercent = costVal > 0 ? (profit / costVal) * 100 : 0;

              return (
                <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-stone-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center border border-amber-100 dark:border-amber-900/20">
                      <FaGem className="text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-900 dark:text-white">{inv.title}</h4>
                      <p className="text-[10px] font-bold text-stone-400 uppercase mt-0.5">
                        {inv.amount}g • ₺{inv.buyPrice.toLocaleString()} (Alış) • {inv.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-tight mb-1">Maliyet</p>
                      <p className="text-sm font-black text-stone-600 dark:text-zinc-400">₺{costVal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-tight mb-1">Güncel Değer</p>
                      <p className="text-sm font-black text-stone-900 dark:text-white">₺{currentVal.toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-2 mt-0.5">
                        <span className={`text-[9px] font-black ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {profit >= 0 ? '+' : ''}₺{Math.abs(profit).toLocaleString()}
                        </span>
                        <span className={`text-[8px] font-black px-1 rounded ${profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-600' : 'bg-red-100 dark:bg-red-400/20 text-red-600'}`}>
                          {profit >= 0 ? '+' : ''}{pPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => onEdit(inv)}
                        className="p-3 text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(inv.id)}
                        className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentsTab;
