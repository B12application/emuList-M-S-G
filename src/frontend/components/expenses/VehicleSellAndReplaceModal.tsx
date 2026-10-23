import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import type { VehicleData, SellAndReplacePayload } from '../../hooks/useVehicle';
import {
  FaTimes,
  FaCar,
  FaCalendarAlt,
  FaTachometerAlt,
  FaMoneyBillWave,
  FaFileAlt,
  FaExchangeAlt,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaShieldAlt,
  FaWrench,
  FaGasPump,
  FaCog
} from 'react-icons/fa';
import { GiCarWheel, GiCrackedGlass } from 'react-icons/gi';
import { format, differenceInMonths, differenceInDays, parseISO, isValid } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface VehicleSellAndReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicle: VehicleData | null;
  onSellAndReplace: (payload: SellAndReplacePayload) => Promise<void>;
}

export default function VehicleSellAndReplaceModal({
  isOpen,
  onClose,
  activeVehicle,
  onSellAndReplace
}: VehicleSellAndReplaceModalProps) {
  const { t, language } = useLanguage();
  useAuth();
  const dateLocale = language === 'tr' ? tr : enUS;

  // Step state: 1 = Sold info, 2 = New vehicle info
  const [step, setStep] = useState<1 | 2>(activeVehicle ? 1 : 2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sold vehicle form data
  const [soldData, setSoldData] = useState({
    soldDate: format(new Date(), 'yyyy-MM-dd'),
    soldKm: activeVehicle?.currentKm || 0,
    soldPrice: '',
    soldNote: ''
  });

  // New vehicle form data
  const [newVehicleData, setNewVehicleData] = useState<Partial<VehicleData>>({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    bodyType: 'sedan',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    purchaseKm: 0,
    currentKm: 0,
    purchasePrice: 0,
    fuelType: 'Benzin',
    transmission: 'Otomatik',
    engine: '',
    inspectionDate: '',
    insuranceDate: '',
    cascoDate: '',
    mtvYear: new Date().getFullYear(),
    mtvPaid1: false,
    mtvPaid2: false,
    fuelCategory: activeVehicle?.fuelCategory || 'Yakıt',
    tramerAmount: 0,
    damageHistory: '',
    tireSummerBrand: 'Michelin',
    tireSummerYear: new Date().getFullYear(),
    tireWinterBrand: '',
    tireSummerPurchaseDate: format(new Date(), 'yyyy-MM-dd'),
    tireHistory: [
      {
        type: 'purchase',
        date: format(new Date(), 'yyyy-MM-dd'),
        km: 0,
        brand: 'İlk Lastikler'
      }
    ],
    imageUrl1: '',
    imageUrl2: ''
  });

  // Calculate stats for sold vehicle (if active vehicle exists)
  const soldCalculation = useMemo(() => {
    if (!activeVehicle) return null;

    const purchasePrice = Number(activeVehicle.purchasePrice) || 0;
    const salePrice = Number(soldData.soldPrice) || 0;
    const priceDiff = salePrice > 0 && purchasePrice > 0 ? salePrice - purchasePrice : null;

    let ownershipText = '';
    if (activeVehicle.purchaseDate && isValid(parseISO(activeVehicle.purchaseDate))) {
      const pDate = parseISO(activeVehicle.purchaseDate);
      const sDate = soldData.soldDate && isValid(parseISO(soldData.soldDate)) ? parseISO(soldData.soldDate) : new Date();
      const totalMonths = Math.max(0, differenceInMonths(sDate, pDate));
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;

      if (years > 0) {
        ownershipText = `${years} ${language === 'tr' ? 'Yıl' : 'Years'} ${months > 0 ? `${months} ${language === 'tr' ? 'Ay' : 'Months'}` : ''}`;
      } else {
        const days = Math.max(0, differenceInDays(sDate, pDate));
        ownershipText = totalMonths > 0 ? `${totalMonths} ${language === 'tr' ? 'Ay' : 'Months'}` : `${days} ${language === 'tr' ? 'Gün' : 'Days'}`;
      }
    }

    const kmDriven = Math.max(0, (Number(soldData.soldKm) || 0) - (activeVehicle.purchaseKm || 0));

    return {
      priceDiff,
      ownershipText,
      kmDriven
    };
  }, [activeVehicle, soldData, language]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 1 && activeVehicle) {
      if (!soldData.soldDate) {
        toast.error('Lütfen satış tarihini girin');
        return;
      }
      setStep(2);
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newVehicleData.brand?.trim() || !newVehicleData.model?.trim()) {
      toast.error(language === 'tr' ? 'Lütfen en azından yeni aracın Marka ve Modelini giriniz.' : 'Please enter at least Brand and Model for the new vehicle.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: SellAndReplacePayload = {
        soldVehicleId: activeVehicle?.id,
        soldData: {
          soldDate: soldData.soldDate,
          soldKm: Number(soldData.soldKm) || 0,
          soldPrice: Number(soldData.soldPrice) || 0,
          soldNote: soldData.soldNote.trim()
        },
        newVehicleData: {
          ...newVehicleData,
          brand: newVehicleData.brand?.trim(),
          model: newVehicleData.model?.trim(),
          licensePlate: newVehicleData.licensePlate?.trim().toUpperCase(),
          year: Number(newVehicleData.year) || new Date().getFullYear(),
          purchaseKm: Number(newVehicleData.purchaseKm) || 0,
          currentKm: Number(newVehicleData.currentKm) || Number(newVehicleData.purchaseKm) || 0,
          purchasePrice: Number(newVehicleData.purchasePrice) || 0,
          nextMaintenanceKm: (Number(newVehicleData.currentKm) || 0) + 10000,
          tramerAmount: Number(newVehicleData.tramerAmount) || 0
        }
      };

      await onSellAndReplace(payload);
      toast.success(t('expenses.vehicle.saleSuccess') || 'Eski aracınız arşive kaydedildi ve yeni aracınız başarıyla tanımlandı!');
      onClose();
    } catch (err: any) {
      console.error('Sell and replace failed', err);
      toast.error(err?.message || (t('common.error') || 'Hata oluştu'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-stone-50/70 dark:bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FaExchangeAlt size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">
                {t('expenses.vehicle.sellVehicleTitle') || 'Araç Satış & Yeni Araç Kaydı'}
              </h2>
              <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-400 line-clamp-1">
                {t('expenses.vehicle.sellAndReplaceDesc') || 'Mevcut aracınızı satıp yeni bir araç aldığınızda satış bilgilerini ve yeni aracın tüm detaylarını kaydedin.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-stone-500 dark:text-zinc-400 transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="px-6 pt-3 pb-2 bg-stone-50/40 dark:bg-zinc-900/40 border-b border-stone-100 dark:border-zinc-800/80 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => activeVehicle && setStep(1)}
            disabled={!activeVehicle}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              step === 1
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900'
            } ${!activeVehicle ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">1</span>
            {t('expenses.vehicle.step1SoldInfo') || '1. Satılan Araç Bilgileri'}
          </button>

          <FaArrowRight size={10} className="text-stone-300 dark:text-zinc-600" />

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              step === 2
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">2</span>
            {t('expenses.vehicle.step2NewVehicleInfo') || '2. Yeni Alınan Araç'}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
          {step === 1 ? (
            /* ═══ STEP 1: SATILAN ARAÇ BİLGİLERİ ═══ */
            <div className="space-y-6 animate-fadeIn">
              {activeVehicle ? (
                <>
                  {/* Active Vehicle Info Badge */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <FaCar size={22} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-300">
                          {t('expenses.vehicle.soldVehicleCard') || 'Satışı Yapılan Araç'}
                        </span>
                        <h3 className="text-base font-black text-stone-900 dark:text-white mt-1">
                          {activeVehicle.brand || 'Araç'} {activeVehicle.model} ({activeVehicle.year})
                        </h3>
                        <p className="text-xs font-bold text-stone-400 dark:text-zinc-400">
                          Plaka: <span className="font-black text-stone-800 dark:text-zinc-200">{activeVehicle.licensePlate || '---'}</span>
                          {activeVehicle.purchaseKm ? ` • Alış: ${activeVehicle.purchaseKm.toLocaleString()} KM` : ''}
                        </p>
                      </div>
                    </div>
                    {activeVehicle.purchasePrice ? (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Alış Fiyatı</span>
                        <span className="text-sm font-black text-stone-800 dark:text-zinc-100">
                          {activeVehicle.purchasePrice.toLocaleString()} ₺
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Sold Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1.5">
                        <FaCalendarAlt size={11} className="text-amber-500" />
                        {t('expenses.vehicle.soldDate') || 'Satış Tarihi'} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={soldData.soldDate}
                        onChange={e => setSoldData({ ...soldData, soldDate: e.target.value })}
                        className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-black dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1.5">
                        <FaTachometerAlt size={11} className="text-amber-500" />
                        {t('expenses.vehicle.soldKm') || 'Satış Kilometresi'} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 85000"
                        value={soldData.soldKm || ''}
                        onChange={e => setSoldData({ ...soldData, soldKm: Number(e.target.value) })}
                        className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-black dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1.5">
                        <FaMoneyBillWave size={11} className="text-emerald-500" />
                        {t('expenses.vehicle.soldPrice') || 'Satış Fiyatı (₺)'}
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 950000"
                        value={soldData.soldPrice}
                        onChange={e => setSoldData({ ...soldData, soldPrice: e.target.value })}
                        className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-black dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1.5">
                        <FaFileAlt size={11} className="text-stone-400" />
                        {t('expenses.vehicle.soldNote') || 'Satış Notu & Alıcı Bilgisi'}
                      </label>
                      <input
                        type="text"
                        placeholder={t('expenses.vehicle.soldNotePlaceholder') || 'Örn: Galeriye takasta verildi / Yeni sahibine devredildi'}
                        value={soldData.soldNote}
                        onChange={e => setSoldData({ ...soldData, soldNote: e.target.value })}
                        className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-stone-400/30"
                      />
                    </div>
                  </div>

                  {/* Calculations & Summary Banner */}
                  {soldCalculation && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50">
                      <div>
                        <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                          {t('expenses.vehicle.ownershipDuration') || 'Sahiplik Süresi'}
                        </span>
                        <span className="text-xs font-black text-stone-900 dark:text-white">
                          {soldCalculation.ownershipText || '---'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                          Sizinle Yapılan Yol
                        </span>
                        <span className="text-xs font-black text-stone-900 dark:text-white">
                          {soldCalculation.kmDriven.toLocaleString()} KM
                        </span>
                      </div>

                      {soldCalculation.priceDiff !== null && (
                        <div>
                          <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                            Fiyat Değişimi
                          </span>
                          <span
                            className={`text-xs font-black ${
                              soldCalculation.priceDiff >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {soldCalculation.priceDiff >= 0 ? '+' : ''}
                            {soldCalculation.priceDiff.toLocaleString()} ₺
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1.5 transition-colors"
                    >
                      {t('expenses.vehicle.skipToNewVehicle') || 'Doğrudan Yeni Araca Geç →'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-stone-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-zinc-700">
                  <FaCar size={36} className="mx-auto mb-3 text-stone-400" />
                  <p className="text-xs font-black text-stone-700 dark:text-zinc-300">
                    {t('expenses.vehicle.noActiveVehicleToSell') || 'Kayıtlı aktif araç bulunmuyor, doğrudan yeni araç tanımlayabilirsiniz.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-4 px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    {t('expenses.vehicle.skipToNewVehicle') || 'Doğrudan Yeni Araca Geç →'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ═══ STEP 2: YENİ SATIN ALINAN ARAÇ BİLGİLERİ ═══ */
            <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
              {/* Bölüm 1: Araç Kimlik & Marka Model */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 dark:border-zinc-800 pb-1.5">
                  <FaCar className="text-emerald-500" />
                  Kimlik & Model Bilgileri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Plaka <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 34 B12 01"
                      value={newVehicleData.licensePlate || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, licensePlate: e.target.value.toUpperCase() })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Marka <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Volkswagen, Tesla, Toyota"
                      value={newVehicleData.brand || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, brand: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Model <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Golf, Model Y, Corolla"
                      value={newVehicleData.model || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, model: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Model Yılı
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 2024"
                      value={newVehicleData.year || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, year: Number(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Kasa Tipi
                    </label>
                    <select
                      value={newVehicleData.bodyType || 'sedan'}
                      onChange={e => setNewVehicleData({ ...newVehicleData, bodyType: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    >
                      <option value="sedan">Sedan</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="suv">SUV / Crossover</option>
                      <option value="stationWagon">Station Wagon</option>
                      <option value="coupe">Coupe / Cabrio</option>
                      <option value="commercial">Ticari / Van</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Renk
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Beyaz, Füme, Siyah"
                      value={newVehicleData.color || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, color: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bölüm 2: Satın Alım & Kilometre Bilgileri */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 dark:border-zinc-800 pb-1.5">
                  <FaTachometerAlt className="text-sky-500" />
                  Alış & Kilometre Detayları
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Satın Alım Tarihi
                    </label>
                    <input
                      type="date"
                      value={newVehicleData.purchaseDate || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, purchaseDate: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Satın Alım KM
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 24000"
                      value={newVehicleData.purchaseKm || ''}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setNewVehicleData(prev => ({
                          ...prev,
                          purchaseKm: val,
                          currentKm: (prev.currentKm || 0) < val ? val : prev.currentKm
                        }));
                      }}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Güncel Sayaç KM
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 24000"
                      value={newVehicleData.currentKm || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, currentKm: Number(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Satın Alım Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 1450000"
                      value={newVehicleData.purchasePrice || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, purchasePrice: Number(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bölüm 3: Motor & Teknik Özellikler */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 dark:border-zinc-800 pb-1.5">
                  <FaCog className="text-amber-500" />
                  Motor & Teknik Özellikler
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Yakıt Türü
                    </label>
                    <select
                      value={newVehicleData.fuelType || 'Benzin'}
                      onChange={e => setNewVehicleData({ ...newVehicleData, fuelType: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    >
                      <option value="Benzin">Benzin</option>
                      <option value="Dizel">Dizel</option>
                      <option value="Hibrit">Hibrit</option>
                      <option value="Elektrik">Elektrik</option>
                      <option value="LPG">LPG / Benzin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Şanzıman
                    </label>
                    <select
                      value={newVehicleData.transmission || 'Otomatik'}
                      onChange={e => setNewVehicleData({ ...newVehicleData, transmission: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    >
                      <option value="Otomatik">Otomatik</option>
                      <option value="Manuel">Manuel</option>
                      <option value="Yarı Otomatik">Yarı Otomatik</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Motor / Güç
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 1.5 eTSI 150bg / Elektrik 299 HP"
                      value={newVehicleData.engine || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, engine: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bölüm 4: Önemli Tarihler (Muayene, Sigorta, Kasko) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 dark:border-zinc-800 pb-1.5">
                  <FaShieldAlt className="text-indigo-500" />
                  Yasal & Sigorta Tarihleri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Araç Muayene Bitiş
                    </label>
                    <input
                      type="date"
                      value={newVehicleData.inspectionDate || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, inspectionDate: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Trafik Sigortası Bitiş
                    </label>
                    <input
                      type="date"
                      value={newVehicleData.insuranceDate || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, insuranceDate: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Kasko Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={newVehicleData.cascoDate || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, cascoDate: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bölüm 5: Tramer & Hasar Notu */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 dark:border-zinc-800 pb-1.5">
                  <GiCrackedGlass className="text-rose-500" />
                  Ekspertiz, Tramer & Hasar Bilgisi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Tramer Hasar Tutarı (₺)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newVehicleData.tramerAmount || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, tramerAmount: Number(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Ekspertiz & Hasar Notu
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Hatasız, boyasız veya sağ ön kapı lokal boyalı"
                      value={newVehicleData.damageHistory || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, damageHistory: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bölüm 6: Lastik Bilgileri */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 dark:border-zinc-800 pb-1.5">
                  <GiCarWheel className="text-stone-500" />
                  İlk Lastik Durumu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Üzerindeki Lastik Markası
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Continental, Michelin, Pirelli"
                      value={newVehicleData.tireSummerBrand || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, tireSummerBrand: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                      Lastik Üretim Yılı (DOT)
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 2024"
                      value={newVehicleData.tireSummerYear || ''}
                      onChange={e => setNewVehicleData({ ...newVehicleData, tireSummerYear: Number(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fotoğraf URL (Opsiyonel) */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block">
                  Araç Fotoğraf Bağlantısı (URL - İsteğe Bağlı)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newVehicleData.imageUrl1 || ''}
                  onChange={e => setNewVehicleData({ ...newVehicleData, imageUrl1: e.target.value })}
                  className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white outline-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            {step === 2 && activeVehicle ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider transition-colors"
              >
                <FaArrowLeft size={10} /> {language === 'tr' ? 'Satılan Araç' : 'Previous Step'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider transition-colors"
              >
                {t('common.cancel') || 'İptal'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02]"
              >
                {language === 'tr' ? 'Yeni Aracı Tanımla' : 'Configure New Car'} <FaArrowRight size={11} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all ${
                  isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaCheck size={12} />
                )}
                {t('expenses.vehicle.confirmSellAndReplace') || 'Satışı Kaydet ve Yeni Aracı Başlat'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
