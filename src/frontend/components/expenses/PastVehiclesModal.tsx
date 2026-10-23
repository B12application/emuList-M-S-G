import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import type { VehicleData } from '../../hooks/useVehicle';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  FaTimes,
  FaCar,
  FaCalendarAlt,
  FaTachometerAlt,
  FaMoneyBillWave,
  FaHistory,
  FaUndo,
  FaTrash,
  FaFileAlt
} from 'react-icons/fa';
import { format, differenceInMonths, differenceInDays, parseISO, isValid } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface PastVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastVehicles: VehicleData[];
  onReactivate: (vehicleId: string) => Promise<void>;
  onDelete: (vehicleId: string) => Promise<void>;
}

export default function PastVehiclesModal({
  isOpen,
  onClose,
  pastVehicles,
  onReactivate,
  onDelete
}: PastVehiclesModalProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {}
  });

  if (!isOpen) return null;

  const handleReactivateClick = (vehicle: VehicleData) => {
    setConfirmDialog({
      isOpen: true,
      title: language === 'tr' ? 'Aracı Tekrar Aktif Yap' : 'Reactivate Vehicle',
      message: language === 'tr'
        ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate || '---'}) aracını tekrar aktif araç profili yapmak istediğinize emin misiniz? Mevcut aktif araç arşive alınacaktır.`
        : `Are you sure you want to reactivate ${vehicle.brand} ${vehicle.model}? The current active vehicle will be archived.`,
      variant: 'info',
      onConfirm: async () => {
        try {
          if (!vehicle.id) return;
          await onReactivate(vehicle.id);
          toast.success(t('expenses.vehicle.reactivateSuccess') || 'Araç başarıyla aktif profile getirildi.');
          onClose();
        } catch (err: any) {
          toast.error(err?.message || (t('common.error') || 'Hata oluştu'));
        }
      }
    });
  };

  const handleDeleteClick = (vehicle: VehicleData) => {
    setConfirmDialog({
      isOpen: true,
      title: language === 'tr' ? 'Geçmiş Aracı Sil' : 'Delete Past Vehicle',
      message: language === 'tr'
        ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate || '---'}) geçmiş kaydını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
        : `Are you sure you want to permanently delete ${vehicle.brand} ${vehicle.model}? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (!vehicle.id) return;
          await onDelete(vehicle.id);
          toast.success(t('expenses.vehicle.deletePastSuccess') || 'Geçmiş araç kaydı silindi.');
        } catch (err: any) {
          toast.error(err?.message || (t('common.error') || 'Hata oluştu'));
        }
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-stone-50/70 dark:bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FaHistory size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    {t('expenses.vehicle.soldVehiclesHistory') || 'Geçmiş / Satılan Araçlarım'}
                  </h2>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                    {pastVehicles.length}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-400">
                  Daha önce sahip olduğunuz ve satışını gerçekleştirdiğiniz tüm araçlar
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
            {pastVehicles.length === 0 ? (
              <div className="p-12 text-center bg-stone-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-stone-200 dark:border-zinc-800 space-y-3">
                <FaCar size={40} className="mx-auto text-stone-300 dark:text-zinc-600" />
                <p className="text-xs font-black uppercase tracking-wider text-stone-400">
                  {t('expenses.vehicle.noPastVehicles') || 'Henüz satılmış veya geçmiş araç kaydı bulunmuyor.'}
                </p>
              </div>
            ) : (
              pastVehicles.map((car, idx) => {
                const purchasePrice = Number(car.purchasePrice) || 0;
                const salePrice = Number(car.soldPrice) || 0;
                const diff = salePrice > 0 && purchasePrice > 0 ? salePrice - purchasePrice : null;

                let ownershipText = '';
                if (car.purchaseDate && isValid(parseISO(car.purchaseDate)) && car.soldDate && isValid(parseISO(car.soldDate))) {
                  const pDate = parseISO(car.purchaseDate);
                  const sDate = parseISO(car.soldDate);
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

                return (
                  <div
                    key={car.id || idx}
                    className="p-5 rounded-2xl bg-stone-50/70 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800 space-y-4 hover:border-amber-400/40 transition-all"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {car.imageUrl1 ? (
                          <img
                            src={car.imageUrl1}
                            alt={car.brand || 'Vehicle'}
                            className="w-14 h-14 rounded-2xl object-cover border border-stone-200 dark:border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-stone-200 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
                            <FaCar size={24} />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black tracking-widest px-2.5 py-0.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-stone-900 uppercase">
                              {car.licensePlate || '---'}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                              {t('expenses.vehicle.soldBadge') || 'Satıldı'}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-stone-900 dark:text-white mt-1">
                            {car.brand} {car.model} {car.year ? `(${car.year})` : ''}
                          </h3>
                        </div>
                      </div>

                      {/* Sale Price Banner */}
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
                          Satış Tutarı
                        </span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {salePrice > 0 ? `${salePrice.toLocaleString()} ₺` : 'Belirtilmedi'}
                        </span>
                        {diff !== null && (
                          <span
                            className={`block text-[10px] font-black ${
                              diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {diff >= 0 ? '+' : ''}
                            {diff.toLocaleString()} ₺ fark
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/50 dark:border-zinc-800/60">
                      <div>
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1">
                          <FaCalendarAlt size={9} /> Satış Tarihi
                        </span>
                        <p className="text-xs font-black text-stone-800 dark:text-zinc-200 mt-0.5">
                          {car.soldDate && isValid(parseISO(car.soldDate))
                            ? format(parseISO(car.soldDate), 'dd MMMM yyyy', { locale: dateLocale })
                            : '---'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1">
                          <FaTachometerAlt size={9} /> Satış KM
                        </span>
                        <p className="text-xs font-black text-stone-800 dark:text-zinc-200 mt-0.5">
                          {car.soldKm ? `${car.soldKm.toLocaleString()} KM` : car.currentKm ? `${car.currentKm.toLocaleString()} KM` : '---'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1">
                          <FaMoneyBillWave size={9} /> Alış Fiyatı
                        </span>
                        <p className="text-xs font-black text-stone-800 dark:text-zinc-200 mt-0.5">
                          {car.purchasePrice ? `${car.purchasePrice.toLocaleString()} ₺` : '---'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1">
                          <FaHistory size={9} /> Sahiplik Süresi
                        </span>
                        <p className="text-xs font-black text-stone-800 dark:text-zinc-200 mt-0.5">
                          {ownershipText || '---'}
                        </p>
                      </div>
                    </div>

                    {/* Note if any */}
                    {car.soldNote && (
                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/50 border border-stone-200/60 dark:border-zinc-800/80 flex items-start gap-2 text-xs">
                        <FaFileAlt size={12} className="text-stone-400 mt-0.5 shrink-0" />
                        <span className="text-stone-600 dark:text-zinc-400 font-bold italic line-clamp-2">
                          {car.soldNote}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(car)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider transition-colors"
                      >
                        <FaTrash size={10} />
                        {t('expenses.vehicle.deletePastVehicle') || 'Sil'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReactivateClick(car)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-black uppercase tracking-wider shadow-sm transition-all"
                      >
                        <FaUndo size={10} />
                        {t('expenses.vehicle.reactivateVehicle') || 'Bu Aracı Aktif Yap'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-stone-50 dark:bg-zinc-900/90 border-t border-stone-200 dark:border-zinc-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider transition-colors"
            >
              {t('common.close') || 'Kapat'}
            </button>
          </div>
        </motion.div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={t('common.confirm') || 'Onayla'}
        cancelText={t('common.cancel') || 'İptal'}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
