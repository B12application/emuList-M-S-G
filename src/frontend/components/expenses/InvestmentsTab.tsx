// src/frontend/components/expenses/InvestmentsTab.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaGem,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaTrash,
  FaSync,
  FaEdit,
  FaShoppingCart,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaHistory,
  FaSlidersH,
  FaUndo,
  FaCoins,
  FaTag,
  FaCalculator,
  FaChartLine,
  FaCalendarAlt,
  FaPercentage,
  FaLightbulb,
  FaRocket,
  FaExchangeAlt,
  FaCheckCircle
} from 'react-icons/fa';
import {
  type GoldPrice,
  fetchGoldPrice,
  setManualGoldPrice,
  clearManualGoldPrice,
  getManualGoldPrice
} from '../../services/priceService';
import type { Investment } from '../../hooks/useInvestments';
import toast from 'react-hot-toast';
import CalendarPicker from '../CalendarPicker';

interface InvestmentsTabProps {
  t: (key: string) => string;
  isDark: boolean;
  investments: Investment[];
  isLoading: boolean;
  onAddClick: () => void;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  onUpdateInvestment?: (investment: Partial<Investment> & { id: string }) => Promise<void>;
  onAddInvestment?: (newInv: any) => Promise<void>;
  isBlurred?: boolean;
}

const InvestmentsTab: React.FC<InvestmentsTabProps> = ({
  t,
  isDark,
  investments,
  isLoading,
  onAddClick,
  onEdit,
  onDelete,
  onUpdateInvestment,
  onAddInvestment,
  isBlurred = false
}) => {
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'sold'>('active');

  // Manual Price Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualBuyInput, setManualBuyInput] = useState('');
  const [manualSellInput, setManualSellInput] = useState('');

  // Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingInvestment, setSellingInvestment] = useState<Investment | null>(null);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [sellDate, setSellDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sellNotes, setSellNotes] = useState<string>('');
  const [isSubmittingSell, setIsSubmittingSell] = useState<boolean>(false);

  // Projection Simulator Modal State (2026-2027 Estimated Earnings)
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState(false);
  const [projMonthlySavings, setProjMonthlySavings] = useState<number>(20000); // Default ₺20,000 / month
  const [projIncludeExisting, setProjIncludeExisting] = useState<boolean>(true); // Include active portfolio
  const [projMonths, setProjMonths] = useState<number>(5); // Default 5 months (Aug 2026 to Jan 2027 - Year End)
  const [projAnnualReturn, setProjAnnualReturn] = useState<number>(50); // Default 50% estimated annual gold appreciation
  const [projAnnualInflation, setProjAnnualInflation] = useState<number>(35); // Default 35% estimated annual inflation
  const [projTargetPriceInput, setProjTargetPriceInput] = useState<string>(''); // Custom gold price override

  const loadPrice = async (isManualAction = false) => {
    setLoadingPrice(true);
    const price = await fetchGoldPrice();
    if (price) {
      setGoldPrice(price);
      if (isManualAction) {
        toast.success('Altın fiyatı güncellendi');
      }
    } else {
      toast.error('Altın fiyatı alınamadı');
    }
    setLoadingPrice(false);
  };

  useEffect(() => {
    loadPrice();
    const interval = setInterval(() => loadPrice(false), 60000 * 5); // every 5 mins
    return () => clearInterval(interval);
  }, []);

  // Filter Active vs Sold Investments
  const activeInvestments = investments.filter(inv => inv.status !== 'sold');
  const soldInvestments = investments.filter(inv => inv.status === 'sold');

  // Active Portfolio Stats
  const totalActiveGrams = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalActiveCost = activeInvestments.reduce((sum, inv) => sum + (inv.amount * inv.buyPrice), 0);
  const currentActiveValue = goldPrice ? totalActiveGrams * goldPrice.sell : 0;
  const unrealizedProfitLoss = goldPrice ? currentActiveValue - totalActiveCost : 0;
  const unrealizedPercentage = totalActiveCost > 0 ? (unrealizedProfitLoss / totalActiveCost) * 100 : 0;

  // Realized Sales Stats
  const totalRealizedProfitLoss = soldInvestments.reduce((sum, inv) => sum + (inv.realizedProfitLoss || 0), 0);
  const totalSalesRevenue = soldInvestments.reduce((sum, inv) => {
    const amount = inv.soldAmount || inv.amount;
    const price = inv.soldPrice || 0;
    return sum + (amount * price);
  }, 0);
  const totalSoldCost = soldInvestments.reduce((sum, inv) => {
    const amount = inv.soldAmount || inv.amount;
    return sum + (amount * inv.buyPrice);
  }, 0);
  const realizedPercentage = totalSoldCost > 0 ? (totalRealizedProfitLoss / totalSoldCost) * 100 : 0;

  // Handlers for Manual Price
  const handleOpenManualModal = () => {
    setManualBuyInput(goldPrice ? goldPrice.buy.toString() : '');
    setManualSellInput(goldPrice ? goldPrice.sell.toString() : '');
    setIsManualModalOpen(true);
  };

  const handleSaveManualPrice = () => {
    const buy = parseFloat(manualBuyInput);
    const sell = parseFloat(manualSellInput);
    if (!buy || !sell || buy <= 0 || sell <= 0) {
      toast.error('Geçerli fiyatlar giriniz');
      return;
    }
    const manualPrice = setManualGoldPrice(buy, sell);
    setGoldPrice(manualPrice);
    setIsManualModalOpen(false);
    toast.success('Manuel altın fiyatı kaydedildi');
  };

  const handleResetManualPrice = () => {
    clearManualGoldPrice();
    setIsManualModalOpen(false);
    loadPrice(true);
  };

  // Handlers for Selling
  const handleOpenSellModal = (inv: Investment) => {
    setSellingInvestment(inv);
    setSellAmount(inv.amount);
    const defaultSellPrice = goldPrice?.sell || goldPrice?.buy || inv.buyPrice;
    setSellPrice(defaultSellPrice);
    setSellDate(new Date().toISOString().split('T')[0]);
    setSellNotes('');
    setIsSellModalOpen(true);
  };

  const handleConfirmSell = async () => {
    if (!sellingInvestment || !onUpdateInvestment) return;
    if (sellAmount <= 0 || sellAmount > sellingInvestment.amount) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }
    if (sellPrice <= 0) {
      toast.error('Geçerli bir satış fiyatı giriniz');
      return;
    }

    setIsSubmittingSell(true);
    try {
      const costForSoldPortion = sellAmount * sellingInvestment.buyPrice;
      const revenueFromSale = sellAmount * sellPrice;
      const profitLoss = revenueFromSale - costForSoldPortion;

      if (sellAmount === sellingInvestment.amount) {
        // Full sale
        await onUpdateInvestment({
          id: sellingInvestment.id,
          status: 'sold',
          soldAmount: sellAmount,
          soldPrice: sellPrice,
          soldDate: sellDate,
          realizedProfitLoss: profitLoss,
          notes: sellNotes
        });
      } else {
        // Partial sale
        const remainingAmount = Number((sellingInvestment.amount - sellAmount).toFixed(4));
        await onUpdateInvestment({
          id: sellingInvestment.id,
          amount: remainingAmount
        });

        if (onAddInvestment) {
          await onAddInvestment({
            type: sellingInvestment.type || 'gold',
            title: `${sellingInvestment.title} (Satılan Parça)`,
            amount: sellAmount,
            buyPrice: sellingInvestment.buyPrice,
            date: sellingInvestment.date,
            status: 'sold',
            soldAmount: sellAmount,
            soldPrice: sellPrice,
            soldDate: sellDate,
            realizedProfitLoss: profitLoss,
            notes: sellNotes
          });
        }
      }

      if (profitLoss < 0) {
        toast.error(`Satış kaydedildi: ₺${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })} Zarar edildi`, {
          icon: '📉'
        });
      } else {
        toast.success(`Satış kaydedildi: ₺${profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })} Kâr elde edildi`, {
          icon: '📈'
        });
      }

      setIsSellModalOpen(false);
      setSellingInvestment(null);
    } catch (err) {
      console.error('Error recording sale:', err);
      toast.error('Satış işlemi kaydedilirken hata oluştu');
    } finally {
      setIsSubmittingSell(false);
    }
  };

  const handleRestoreSale = async (inv: Investment) => {
    if (!onUpdateInvestment) return;
    try {
      await onUpdateInvestment({
        id: inv.id,
        status: 'active',
        soldAmount: undefined,
        soldPrice: undefined,
        soldDate: undefined,
        realizedProfitLoss: undefined,
        notes: undefined
      });
      toast.success('Yatırım tekrar aktif portföye taşındı');
    } catch (err) {
      toast.error('İşlem başarısız oldu');
    }
  };

  // Profit/Loss calculations for sell modal
  const sellModalCost = sellingInvestment ? sellAmount * sellingInvestment.buyPrice : 0;
  const sellModalRevenue = sellAmount * sellPrice;
  const sellModalProfitLoss = sellModalRevenue - sellModalCost;
  const sellModalProfitPercent = sellModalCost > 0 ? (sellModalProfitLoss / sellModalCost) * 100 : 0;

  // Projection Calculator Function
  const getProjectionData = () => {
    const currentPrice = goldPrice?.sell || 6495;
    const initialGrams = projIncludeExisting ? totalActiveGrams : 0;
    const initialCost = projIncludeExisting ? totalActiveCost : 0;

    // Monthly compounding growth rate: (1 + annualReturn)^(1/12) - 1
    const monthlyReturnRate = Math.pow(1 + projAnnualReturn / 100, 1 / 12) - 1;
    const monthlyInflationRate = Math.pow(1 + projAnnualInflation / 100, 1 / 12) - 1;

    // Optional override if user specified target price
    let effectiveMonthlyReturn = monthlyReturnRate;
    const customTargetPrice = parseFloat(projTargetPriceInput);
    if (customTargetPrice && customTargetPrice > 0 && projMonths > 0) {
      effectiveMonthlyReturn = Math.pow(customTargetPrice / currentPrice, 1 / projMonths) - 1;
    }

    const timeline = [];
    let accumGrams = initialGrams;
    let accumCost = initialCost;
    let runningPrice = currentPrice;

    const monthLabels = [
      'Ağustos 2026', 'Eylül 2026', 'Ekim 2026', 'Kasım 2026', 'Aralık 2026',
      'Ocak 2027 (Yıl Sonu)', 'Şubat 2027', 'Mart 2027', 'Nisan 2027', 'Mayıs 2027',
      'Haziran 2027', 'Temmuz 2027', 'Ağustos 2027', 'Eylül 2027', 'Ekim 2027',
      'Kasım 2027', 'Aralık 2027', 'Ocak 2028', 'Şubat 2028', 'Mart 2028',
      'Nisan 2028', 'Mayıs 2028', 'Haziran 2028', 'Temmuz 2028', 'Ağustos 2028'
    ];

    for (let m = 1; m <= projMonths; m++) {
      runningPrice = runningPrice * (1 + effectiveMonthlyReturn);
      const gramsBoughtThisMonth = projMonthlySavings > 0 ? projMonthlySavings / runningPrice : 0;
      accumGrams += gramsBoughtThisMonth;
      accumCost += projMonthlySavings;

      const portfolioVal = accumGrams * runningPrice;
      const nominalProfit = portfolioVal - accumCost;

      const inflationFactor = Math.pow(1 + monthlyInflationRate, m);
      const realPortfolioValue = portfolioVal / inflationFactor;
      const realProfit = realPortfolioValue - accumCost;

      timeline.push({
        monthIndex: m,
        monthName: monthLabels[m - 1] || `${m}. Ay`,
        goldPrice: runningPrice,
        gramsBought: gramsBoughtThisMonth,
        totalGrams: accumGrams,
        totalCost: accumCost,
        portfolioValue: portfolioVal,
        nominalProfit,
        realProfit
      });
    }

    const endPrice = runningPrice;
    const finalTotalGrams = accumGrams;
    const finalTotalCost = accumCost;
    const finalPortfolioValue = accumGrams * endPrice;
    const finalNominalProfit = finalPortfolioValue - finalTotalCost;
    const totalInflationFactor = Math.pow(1 + monthlyInflationRate, projMonths);
    const finalRealValue = finalPortfolioValue / totalInflationFactor;
    const finalRealProfit = finalRealValue - finalTotalCost;

    return {
      timeline,
      endPrice,
      finalTotalGrams,
      finalTotalCost,
      finalPortfolioValue,
      finalNominalProfit,
      finalRealProfit,
      nominalReturnPercent: finalTotalCost > 0 ? (finalNominalProfit / finalTotalCost) * 100 : 0
    };
  };

  const projData = getProjectionData();

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner: Live Price Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-stone-900 dark:bg-white p-8 rounded-[2.5rem] text-white dark:text-stone-900 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-stone-900/5 flex items-center justify-center">
                  <FaGem className="text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block">
                    Canlı Gram Altın (TRY)
                  </span>
                  {goldPrice?.isManual && (
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-amber-400 text-stone-900 rounded-md uppercase tracking-wider mt-0.5">
                      Manuel Fiyat Uygulandı
                    </span>
                  )}
                  {goldPrice?.isCached && !goldPrice?.isManual && (
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-stone-700 dark:bg-stone-200 text-stone-200 dark:text-stone-800 rounded-md uppercase tracking-wider mt-0.5">
                      Son Kaydedilen Fiyat
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsProjectionModalOpen(true)}
                  title="Tahmini Kazanç Simülatörü"
                  className="p-2 rounded-xl bg-amber-400 text-stone-900 hover:bg-amber-300 transition-all flex items-center gap-1.5 text-xs font-black px-3.5 shadow-lg"
                >
                  <FaCalculator size={13} />
                  <span>Tahmini Kazanç (2026-2027)</span>
                </button>
                <button
                  onClick={handleOpenManualModal}
                  title="Fiyatı Manuel Düzenle"
                  className="p-2 rounded-xl bg-white/10 dark:bg-stone-900/10 hover:bg-white/20 transition-all flex items-center gap-1.5 text-xs font-bold px-3"
                >
                  <FaSlidersH size={12} />
                  <span className="hidden sm:inline">Fiyat Ayarla</span>
                </button>
                <button
                  onClick={() => loadPrice(true)}
                  disabled={loadingPrice}
                  title="Canlı Fiyatı Yenile"
                  className={`p-2.5 rounded-xl bg-white/10 dark:bg-stone-900/10 hover:bg-white/20 transition-all ${
                    loadingPrice ? 'animate-spin' : ''
                  }`}
                >
                  <FaSync size={12} />
                </button>
              </div>
            </div>

            <div className="flex items-end gap-4 mt-2">
              <h2 className={`text-4xl font-black ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
                ₺{goldPrice ? goldPrice.sell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
              </h2>
              {goldPrice && (
                <div className="flex flex-col mb-1">
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    goldPrice.change.startsWith('%-') ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {goldPrice.change.startsWith('%-') ? <FaArrowDown /> : <FaArrowUp />}
                    {goldPrice.change}
                  </span>
                  <span className="text-[10px] opacity-60">Alış: ₺{goldPrice.buy.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">
                Son Güncelleme: {goldPrice?.updateDate || '---'}
              </p>
              {goldPrice?.isManual && (
                <button
                  onClick={handleResetManualPrice}
                  className="text-[10px] font-bold text-amber-400 underline hover:opacity-80 transition-opacity"
                >
                  Otomatik Fiyata Sıfırla
                </button>
              )}
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        </div>

        {/* Portfolio Gram Summary */}
        <div className="bg-white dark:bg-zinc-800/50 p-8 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 flex flex-col justify-center shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
            Aktif Varlık Miktarı
          </span>
          <h3 className="text-3xl font-black text-stone-900 dark:text-white">
            {totalActiveGrams.toFixed(2)} g
          </h3>
          <p className={`text-xs font-bold text-stone-400 mt-1 ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
            ₺{currentActiveValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Güncel Piyasa)
          </p>

          <button
            onClick={() => setIsProjectionModalOpen(true)}
            className="mt-4 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 hover:underline"
          >
            <FaRocket /> Ocak 2027 Tahmini Kazanç Projeksiyonu →
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Cost */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 p-6 rounded-3xl border border-stone-100 dark:border-zinc-800">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Aktif Portföy Maliyeti</p>
          <p className={`text-sm font-black text-stone-900 dark:text-white ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
            ₺{totalActiveCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Unrealized P/L */}
        <div className={`p-6 rounded-3xl border ${
          unrealizedProfitLoss >= 0
            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
            : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
        }`}>
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Açık Pozisyon Kâr/Zarar</p>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-black ${
              unrealizedProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            } ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
              ₺{Math.abs(unrealizedProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
              unrealizedProfitLoss >= 0
                ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300'
            }`}>
              {unrealizedProfitLoss >= 0 ? '+' : ''}{unrealizedPercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Realized Sales P/L */}
        <div className={`p-6 rounded-3xl border ${
          totalRealizedProfitLoss >= 0
            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
            : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
        }`}>
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Gerçekleşen Net Kâr/Zarar</p>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-black ${
              totalRealizedProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            } ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
              {totalRealizedProfitLoss < 0 ? '-' : '+'}₺{Math.abs(totalRealizedProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {totalSoldCost > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                totalRealizedProfitLoss >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-red-300'
              }`}>
                {totalRealizedProfitLoss >= 0 ? '+' : ''}{realizedPercentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Add New Investment Action Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={onAddClick}
            className="w-full h-full min-h-[70px] bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-stone-900/10 dark:shadow-white/10 p-4"
          >
            <FaPlus /> Yeni Yatırım Ekle
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation (Aktif Portföy vs Satış Geçmişi) */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'active'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md'
                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <FaGem size={12} />
            <span>Aktif Portföy</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-stone-700 dark:bg-stone-200 text-stone-200 dark:text-stone-800">
              {activeInvestments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('sold')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'sold'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md'
                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <FaShoppingCart size={12} />
            <span>Satış Geçmişi</span>
            {soldInvestments.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-400 text-stone-900 font-bold">
                {soldInvestments.length}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'sold' && (
          <div className="text-xs font-bold text-stone-500 dark:text-zinc-400">
            Toplam Satış Geliri: <span className="font-black text-stone-900 dark:text-white">₺{totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* Main List Container */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Yatırımlar yükleniyor...</p>
          </div>
        ) : activeSubTab === 'active' ? (
          /* ACTIVE INVESTMENTS LIST */
          <div className="divide-y divide-stone-50 dark:divide-zinc-800/50">
            {activeInvestments.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-stone-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaGem className="text-stone-300" size={24} />
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Henüz aktif yatırım kaydı bulunmuyor</p>
              </div>
            ) : (
              activeInvestments.map((inv) => {
                const currentVal = goldPrice ? inv.amount * goldPrice.sell : 0;
                const costVal = inv.amount * inv.buyPrice;
                const profit = goldPrice ? currentVal - costVal : 0;
                const pPercent = costVal > 0 ? (profit / costVal) * 100 : 0;

                return (
                  <div key={inv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center border border-amber-100 dark:border-amber-900/20 shrink-0">
                        <FaGem className="text-amber-500" size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-stone-900 dark:text-white">{inv.title}</h4>
                        <p className="text-[10px] font-bold text-stone-400 uppercase mt-0.5">
                          {inv.amount}g • <span className={isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}>₺{inv.buyPrice.toLocaleString()}</span>/g • {inv.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-zinc-800">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-tight mb-0.5">Maliyet</p>
                        <p className={`text-xs font-black text-stone-600 dark:text-zinc-400 ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
                          ₺{costVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-tight mb-0.5">Güncel Değer</p>
                        <p className={`text-sm font-black text-stone-900 dark:text-white ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
                          ₺{currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-black ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'} ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
                            {profit >= 0 ? '+' : ''}₺{Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[8px] font-black px-1 rounded ${profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-600' : 'bg-red-100 dark:bg-red-400/20 text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{pPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenSellModal(inv)}
                          title="Satış Yap"
                          className="p-2.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl transition-all flex items-center gap-1"
                        >
                          <FaShoppingCart size={13} />
                          <span className="text-[10px] uppercase font-black tracking-wider">Sat</span>
                        </button>
                        <button
                          onClick={() => onEdit(inv)}
                          title="Düzenle"
                          className="p-2.5 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(inv.id)}
                          title="Sil"
                          className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
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
        ) : (
          /* SOLD INVESTMENTS HISTORY LIST */
          <div className="divide-y divide-stone-50 dark:divide-zinc-800/50">
            {soldInvestments.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-stone-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaShoppingCart className="text-stone-300" size={24} />
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Henüz gerçekleşmiş satış kaydı yok</p>
              </div>
            ) : (
              soldInvestments.map((inv) => {
                const soldGrams = inv.soldAmount || inv.amount;
                const costVal = soldGrams * inv.buyPrice;
                const sellVal = soldGrams * (inv.soldPrice || 0);
                const pl = inv.realizedProfitLoss ?? (sellVal - costVal);
                const isLoss = pl < 0;
                const plPercent = costVal > 0 ? (pl / costVal) * 100 : 0;

                return (
                  <div key={inv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                        isLoss
                          ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-500'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-500'
                      }`}>
                        {isLoss ? <FaArrowDown size={18} /> : <FaArrowUp size={18} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-stone-900 dark:text-white">{inv.title}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isLoss
                              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {isLoss ? 'Zararına Satıldı' : 'Kârlı Satış'}
                          </span>
                        </div>

                        <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">
                          {soldGrams}g Satıldı • Alış: ₺{inv.buyPrice.toLocaleString()}/g • Satış: ₺{(inv.soldPrice || 0).toLocaleString()}/g
                        </p>
                        <p className="text-[9px] font-medium text-stone-400 mt-0.5">
                          Satış Tarihi: {inv.soldDate || inv.date} {inv.notes ? `• ${inv.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-zinc-800">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-tight mb-0.5">Satış Tutarı</p>
                        <p className={`text-xs font-black text-stone-900 dark:text-white ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
                          ₺{sellVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-tight mb-0.5">Gerçekleşen Sonuç</p>
                        <p className={`text-sm font-black ${isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} ${isBlurred ? 'blur-md select-none transition-all hover:blur-none' : ''}`}>
                          {isLoss ? '-' : '+'}₺{Math.abs(pl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`text-[8px] font-black px-1 py-0.5 rounded ${
                          isLoss ? 'bg-rose-100 dark:bg-rose-400/20 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-400/20 text-emerald-600'
                        }`}>
                          {isLoss ? '' : '+'}{plPercent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRestoreSale(inv)}
                          title="Portföye Geri Al"
                          className="p-2.5 text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                        >
                          <FaUndo size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(inv.id)}
                          title="Sil"
                          className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
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
        )}
      </div>

      {/* MODAL 1: PROJECTION SIMULATOR MODAL (2026 - 2027) */}
      <AnimatePresence>
        {isProjectionModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProjectionModalOpen(false)}
              className="fixed inset-0 bg-stone-900/75 dark:bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50 max-h-[90vh] flex flex-col my-auto"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-stone-100 dark:border-zinc-800/60 flex items-center justify-between bg-stone-900 dark:bg-white text-white dark:text-stone-900 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-900 flex items-center justify-center shadow-lg font-bold text-xl">
                    🔮
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">Altın Birikim & Kazanç Simülatörü</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-0.5">
                      Ağustos 2026 → Ocak 2027 (Yıl Sonu) Gelecek Projeksiyonu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProjectionModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 dark:bg-stone-900/10 hover:bg-white/20 transition-all"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                {/* Inputs Section */}
                <div className="bg-stone-50 dark:bg-zinc-800/40 p-6 rounded-3xl border border-stone-200/60 dark:border-zinc-700/50 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                      <FaSlidersH className="text-amber-500" /> Birikim & Piyasa Parametreleri
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-lg">
                      Mevcut Fiyat: ₺{(goldPrice?.sell || 6495).toLocaleString()}/g
                    </span>
                  </div>

                  {/* Monthly Savings & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                        Aylık Düzenle Birikim (TL)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={projMonthlySavings || ''}
                        onChange={(e) => setProjMonthlySavings(parseFloat(e.target.value) || 0)}
                        placeholder="20000"
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-700/80 rounded-2xl p-3.5 text-sm font-black text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      {/* Presets */}
                      <div className="flex gap-1.5 mt-2">
                        {[5000, 10000, 20000, 50000].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setProjMonthlySavings(amt)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                              projMonthlySavings === amt
                                ? 'bg-amber-500 text-stone-900'
                                : 'bg-stone-200/60 dark:bg-zinc-700/60 text-stone-600 dark:text-zinc-300 hover:bg-stone-300'
                            }`}
                          >
                            ₺{amt >= 1000 ? `${amt / 1000}k` : amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                        Hedef Birikim Dönemi
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { months: 3, label: '3 Ay (Kasım 2026)' },
                          { months: 5, label: 'Ocak 2027 (Yıl Sonu)' },
                          { months: 6, label: '6 Ay (Şubat 2027)' },
                          { months: 12, label: '1 Yıl (Ağustos 2027)' }
                        ].map((item) => (
                          <button
                            key={item.months}
                            onClick={() => setProjMonths(item.months)}
                            className={`py-2 px-2 text-[10px] font-black uppercase rounded-xl border transition-all text-center ${
                              projMonths === item.months
                                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 shadow-md'
                                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Return Rate & Inflation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200/40 dark:border-zinc-700/40">
                    <div>
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest">
                          Tahmini Yıllık Altın Artış Oranı (%)
                        </label>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">%{projAnnualReturn}/yıl</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="120"
                        step="5"
                        value={projAnnualReturn}
                        onChange={(e) => {
                          setProjAnnualReturn(parseFloat(e.target.value));
                          setProjTargetPriceInput('');
                        }}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <p className="text-[9px] font-medium text-stone-400 mt-1">Türkiye ortalama altın/USD artış trendi baz alınmıştır.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                        Özel Hedef Gram Fiyatı (Opsiyonel - TL)
                      </label>
                      <input
                        type="number"
                        step="50"
                        value={projTargetPriceInput}
                        onChange={(e) => setProjTargetPriceInput(e.target.value)}
                        placeholder={`Örn: ${Math.round(projData.endPrice)}`}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-700/80 rounded-2xl p-3 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-300"
                      />
                    </div>
                  </div>

                  {/* Toggle Active Portfolio Include */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/40 dark:border-zinc-700/40">
                    <div>
                      <p className="text-xs font-black text-stone-900 dark:text-white">Mevcut Aktif Portföyü Dahil Et ({totalActiveGrams.toFixed(2)} g)</p>
                      <p className="text-[10px] font-medium text-stone-400">Şu ana kadar aldığınız altınlar ve güncel tutarlar hesaplamaya eklenir.</p>
                    </div>
                    <button
                      onClick={() => setProjIncludeExisting(!projIncludeExisting)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        projIncludeExisting
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-stone-200 dark:bg-zinc-700 text-stone-500'
                      }`}
                    >
                      {projIncludeExisting ? 'Dahil Edildi' : 'Hariç Tut'}
                    </button>
                  </div>
                </div>

                {/* Dashboard Results Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-stone-50 dark:bg-zinc-800/40 p-5 rounded-3xl border border-stone-200/50 dark:border-zinc-800/50">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Toplam Yatırılan Anapara</p>
                    <p className="text-base font-black text-stone-900 dark:text-white">
                      ₺{projData.finalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[9px] font-bold text-stone-400 mt-0.5">({projData.finalTotalGrams.toFixed(2)} Gram Altın)</p>
                  </div>

                  <div className="bg-amber-50/80 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-200/60 dark:border-amber-900/30">
                    <p className="text-[9px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-1">Tahmini Portföy Değeri</p>
                    <p className="text-base font-black text-amber-900 dark:text-amber-200">
                      ₺{projData.finalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      Hedef Gram: ₺{projData.endPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/g
                    </p>
                  </div>

                  <div className="bg-emerald-50/80 dark:bg-emerald-900/10 p-5 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/30">
                    <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest mb-1">Nominal Net Kâr</p>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      +₺{projData.finalNominalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <span className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 mt-0.5">
                      +{projData.nominalReturnPercent.toFixed(1)}% Kazanç
                    </span>
                  </div>

                  <div className="bg-sky-50/80 dark:bg-sky-900/10 p-5 rounded-3xl border border-sky-200/60 dark:border-sky-900/30">
                    <p className="text-[9px] font-black text-sky-800 dark:text-sky-300 uppercase tracking-widest mb-1">Reel Net Kazanç</p>
                    <p className="text-base font-black text-sky-600 dark:text-sky-400">
                      +₺{projData.finalRealProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[9px] font-bold text-sky-600 dark:text-sky-400 mt-0.5">Enflasyondan Arındırılmış Alım Gücü</p>
                  </div>
                </div>

                {/* Detailed Monthly Projection Table */}
                <div className="bg-stone-50/80 dark:bg-zinc-800/30 rounded-3xl border border-stone-200/60 dark:border-zinc-800/60 overflow-hidden">
                  <div className="p-5 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
                      <FaCalendarAlt className="text-amber-500" /> Ay Ay Birikim & Değer Büyüme Tablosu
                    </h3>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">
                      {projMonths} Ay Süresince
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100/80 dark:bg-zinc-800/80 text-[9px] font-black uppercase text-stone-400 tracking-wider">
                        <tr>
                          <th className="p-3.5 pl-6">Dönem / Ay</th>
                          <th className="p-3.5">Tahmini Gram (₺)</th>
                          <th className="p-3.5">Alınan Gram</th>
                          <th className="p-3.5">Toplam Gram</th>
                          <th className="p-3.5">Toplam Yatırılan</th>
                          <th className="p-3.5 pr-6 text-right">Tahmini Portföy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200/40 dark:divide-zinc-800/40 font-medium text-stone-900 dark:text-white">
                        {projData.timeline.map((row, idx) => (
                          <tr key={idx} className={idx === projData.timeline.length - 1 ? 'bg-amber-500/10 font-bold' : ''}>
                            <td className="p-3.5 pl-6 font-bold flex items-center gap-2">
                              <span>{row.monthName}</span>
                              {idx === projData.timeline.length - 1 && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-400 text-stone-900 rounded">Hedef Sonuç</span>
                              )}
                            </td>
                            <td className="p-3.5 font-bold">₺{row.goldPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                            <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">+{row.gramsBought.toFixed(2)} g</td>
                            <td className="p-3.5 font-bold">{row.totalGrams.toFixed(2)} g</td>
                            <td className="p-3.5">₺{row.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                            <td className="p-3.5 pr-6 text-right font-black text-amber-600 dark:text-amber-400">
                              ₺{row.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 bg-stone-50 dark:bg-zinc-900 border-t border-stone-200/60 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <p className="text-[10px] font-bold text-stone-400">
                  💡 Bu simülatör piyasa beklentileri ve enflasyon projeksiyonlarına dayalı tahmini hesaplama sunar.
                </p>
                <button
                  onClick={() => setIsProjectionModalOpen(false)}
                  className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-md"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SELL INVESTMENT MODAL */}
      <AnimatePresence>
        {isSellModalOpen && sellingInvestment && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSellModalOpen(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <FaShoppingCart size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-900 dark:text-white">Yatırım Satış İşlemi</h2>
                    <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                      {sellingInvestment.title} ({sellingInvestment.amount}g Mevcut)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSellModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                      Satılacak Miktar (Gram)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      max={sellingInvestment.amount}
                      min={0.0001}
                      value={sellAmount || ''}
                      onChange={(e) => setSellAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                      Satış Fiyatı (1g - TL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellPrice || ''}
                      onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                      Satış Tarihi
                    </label>
                    <CalendarPicker
                      selectedDate={sellDate}
                      onChange={(date) => setSellDate(date)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                      Not (Örn: Zararına satıldı)
                    </label>
                    <input
                      type="text"
                      value={sellNotes}
                      onChange={(e) => setSellNotes(e.target.value)}
                      placeholder="Not ekleyin..."
                      className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-3.5 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Dynamic Profit / Loss Calculation Preview */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  sellModalProfitLoss < 0
                    ? 'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-75">
                      Satış Sonucu Hesaplama
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                      sellModalProfitLoss < 0
                        ? 'bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100'
                        : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                    }`}>
                      {sellModalProfitLoss < 0 ? '🔴 ZARARINA SATIŞ' : '🟢 KÂRLI SATIŞ'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-stone-900/10 dark:border-white/10 mb-3">
                    <div>
                      <p className="text-[9px] font-bold opacity-60 uppercase">Maliyet</p>
                      <p className="text-xs font-black">₺{sellModalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold opacity-60 uppercase">Satış Geliri</p>
                      <p className="text-xs font-black">₺{sellModalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold opacity-60 uppercase">Kâr / Zarar</p>
                      <p className="text-xs font-black">
                        {sellModalProfitLoss < 0 ? '-' : '+'}₺{Math.abs(sellModalProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-center">
                    {sellModalProfitLoss < 0
                      ? `Bu işlem sonucunda ₺${Math.abs(sellModalProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })} (${Math.abs(sellModalProfitPercent).toFixed(2)}%) ZARAR edeceksiniz.`
                      : `Bu işlem sonucunda ₺${sellModalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })} (+${sellModalProfitPercent.toFixed(2)}%) KÂR elde edeceksiniz.`}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsSellModalOpen(false)}
                    className="flex-1 py-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleConfirmSell}
                    disabled={isSubmittingSell || sellAmount <= 0 || sellPrice <= 0}
                    className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingSell ? <FaSync className="animate-spin" /> : <FaCheck />}
                    Satışı Onayla
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: MANUAL GOLD PRICE MODAL */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualModalOpen(false)}
              className="fixed inset-0 bg-stone-900/70 dark:bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200/50 dark:border-zinc-800/50 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shadow-md">
                    <FaSlidersH size={14} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-900 dark:text-white">Gram Altın Fiyatı Ayarla</h2>
                    <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                      Manuel Fiyat Girişi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                    Alış Fiyatı (1 Gram TL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualBuyInput}
                    onChange={(e) => setManualBuyInput(e.target.value)}
                    placeholder="Örn: 6490"
                    className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-4 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                    Satış Fiyatı (1 Gram TL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualSellInput}
                    onChange={(e) => setManualSellInput(e.target.value)}
                    placeholder="Örn: 6495"
                    className="w-full bg-stone-50 dark:bg-zinc-800/80 border border-stone-200/50 dark:border-zinc-700/50 rounded-2xl p-4 text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleResetManualPrice}
                    className="py-3.5 px-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Otomatik Fiyata Dön
                  </button>
                  <button
                    onClick={handleSaveManualPrice}
                    className="flex-1 py-3.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestmentsTab;
