import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import useVehicle from '../../hooks/useVehicle';
import type { VehicleData } from '../../hooks/useVehicle';
import useExpenses from '../../hooks/useExpenses';
import { addCalendarAlert } from '../../../backend/services/plannerService';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { FaCar, FaTools, FaCalendarAlt, FaPlus, FaTrash, FaSave, FaBell } from 'react-icons/fa';

// Import local images directly
import img1 from '../../assets/IMG_1143.jpg';
import img2 from '../../assets/IMG_1150.jpg';

export default function VehicleTab() {
  const { t, language } = useLanguage();
  useTheme();
  const { user } = useAuth();
  const { vehicle, logs, saveVehicle, addLog, deleteLog, isLoading } = useVehicle();
  useExpenses();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VehicleData>>({
    purchaseDate: '2025-06-22',
    purchaseKm: 198523,
    currentKm: 208280,
    lastMaintenanceDate: '2025-08-14',
    lastMaintenanceKm: 200000,
    maintenanceDetails: 'Yağ değişimi, yağ filtresi, hava filtresi, şanzıman yağı, diferansiyel yağı',
    nextMaintenanceKm: 210000,
    insuranceDate: '2026-06-18',
    inspectionDate: '2027-12-23',
    mtvDate: '',
    mtvYear: 2026,
    mtvPaid1: false,
    mtvPaid2: false
  });

  const [newLog, setNewLog] = useState({ month: format(new Date(), 'yyyy-MM'), km: '' });

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    }
  }, [vehicle]);

  const dateLocale = language === 'tr' ? tr : enUS;

  const handleSave = async () => {
    try {
      await saveVehicle(formData);
      setIsEditing(false);
      toast.success(t('common.success') || 'Kaydedildi');
    } catch (err) {
      toast.error(t('common.error') || 'Hata oluştu');
    }
  };

  const handleAddLog = async () => {
    if (!newLog.km || isNaN(Number(newLog.km))) return;
    try {
      await addLog({
        month: newLog.month,
        km: Number(newLog.km)
      });
      setNewLog({ month: format(new Date(), 'yyyy-MM'), km: '' });
      toast.success('KM eklendi');
    } catch (err) {
      toast.error('Hata oluştu');
    }
  };

  const handleAddToCalendar = async (type: 'insurance' | 'inspection' | 'mtv', dateStr: string | undefined) => {
    if (!dateStr || !user) {
      toast.error('Geçerli bir tarih yok');
      return;
    }

    let title = '';
    if (type === 'insurance') title = 'Araç Sigortası Yenileme';
    if (type === 'inspection') title = 'Araç Muayenesi';
    if (type === 'mtv') title = 'Motorlu Taşıtlar Vergisi (MTV)';

    try {
      await addCalendarAlert({
        userId: user.uid,
        label: title,
        startDate: dateStr,
        endDate: dateStr,
        color: '#f59e0b'
      });
      toast.success('Takvime hatırlatıcı eklendi');
    } catch (err) {
      toast.error('Hatırlatıcı eklenemedi');
    }
  };

  const totalKmDriven = vehicle ? vehicle.currentKm - vehicle.purchaseKm : (formData.currentKm! - formData.purchaseKm!);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-stone-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-lg border border-stone-200/50 dark:border-zinc-800/50 group">
          <img src={img1} alt="Araç Görseli 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <h2 className="text-white text-2xl font-black drop-shadow-md">Aracım</h2>
          </div>
        </div>
        <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-lg border border-stone-200/50 dark:border-zinc-800/50 group">
          <img src={img2} alt="Araç Görseli 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
        <h3 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <FaCar className="text-stone-400 dark:text-zinc-500" /> Profil & Bilgiler
        </h3>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-sm transition-all ${isEditing
            ? 'bg-rose-500 hover:bg-rose-600 text-white'
            : 'bg-stone-900 dark:bg-white text-white dark:text-zinc-950 hover:scale-[1.02]'
            }`}
        >
          {isEditing ? <><FaSave /> Kaydet</> : 'Düzenle'}
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 flex flex-col justify-center">
          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Güncel KM</p>
          {isEditing ? (
            <input
              type="number"
              value={formData.currentKm}
              onChange={e => setFormData({ ...formData, currentKm: Number(e.target.value) })}
              className="text-xl font-black bg-stone-50 dark:bg-zinc-800 border-none rounded-xl p-2 outline-none w-full"
            />
          ) : (
            <h4 className="text-2xl font-black text-stone-900 dark:text-white">
              {formData.currentKm?.toLocaleString()} <span className="text-sm text-stone-400 font-bold">KM</span>
            </h4>
          )}
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 flex flex-col justify-center">
          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Toplam Yapılan KM</p>
          <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalKmDriven.toLocaleString()} <span className="text-sm font-bold opacity-50">KM</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-stone-100 dark:text-zinc-800 text-6xl opacity-50">
            <FaTools />
          </div>
          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Sonraki Bakım</p>
          {isEditing ? (
            <input
              type="number"
              value={formData.nextMaintenanceKm}
              onChange={e => setFormData({ ...formData, nextMaintenanceKm: Number(e.target.value) })}
              className="text-xl font-black bg-stone-50 dark:bg-zinc-800 border-none rounded-xl p-2 outline-none w-full z-10"
            />
          ) : (
            <div className="z-10">
              <h4 className="text-2xl font-black text-amber-500">
                {formData.nextMaintenanceKm?.toLocaleString()} <span className="text-sm font-bold opacity-50">KM</span>
              </h4>
              <p className="text-xs font-bold text-stone-500 mt-1">
                Kalan: {(formData.nextMaintenanceKm! - formData.currentKm!).toLocaleString()} KM
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Important Dates */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
            <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" /> Önemli Tarihler
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Sigorta Yenileme', key: 'insuranceDate', icon: '🛡️', type: 'insurance' },
              { label: 'Araç Muayenesi', key: 'inspectionDate', icon: '📋', type: 'inspection' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800/50 rounded-2xl border border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{item.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">{item.label}</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={(formData as any)[item.key] || ''}
                        onChange={e => setFormData({ ...formData, [item.key]: e.target.value })}
                        className="text-sm font-black bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg p-1.5 mt-1 outline-none"
                      />
                    ) : (
                      <p className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                        {(formData as any)[item.key] ? format(parseISO((formData as any)[item.key]), 'dd MMMM yyyy', { locale: dateLocale }) : 'Belirtilmedi'}
                      </p>
                    )}
                  </div>
                </div>
                {!(formData as any)[item.key] || isEditing ? null : (
                  <button
                    onClick={() => handleAddToCalendar(item.type as any, (formData as any)[item.key])}
                    className="p-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white rounded-xl transition-all"
                    title="Takvime Hatırlatıcı Ekle"
                  >
                    <FaBell />
                  </button>
                )}
              </div>
            ))}

            {/* MTV Ödemesi Custom UI */}
            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800/50 rounded-2xl border border-stone-100 dark:border-zinc-800">
              <div className="flex items-start gap-3 w-full">
                <div className="text-xl mt-1">💰</div>
                <div className="flex-1 w-full">
                  <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">MTV Ödemesi</p>
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <select
                        value={formData.mtvYear || 2026}
                        onChange={e => setFormData({ ...formData, mtvYear: Number(e.target.value) })}
                        className="text-sm font-black bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg p-1.5 outline-none w-32"
                      >
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-bold mt-1 text-stone-700 dark:text-zinc-300">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.mtvPaid1 || false}
                            onChange={e => setFormData({ ...formData, mtvPaid1: e.target.checked })}
                            className="accent-stone-900 dark:accent-white w-4 h-4"
                          />
                          1. Taksit (Ocak)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.mtvPaid2 || false}
                            onChange={e => setFormData({ ...formData, mtvPaid2: e.target.checked })}
                            className="accent-stone-900 dark:accent-white w-4 h-4"
                          />
                          2. Taksit (Temmuz)
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm font-black text-stone-900 dark:text-white">
                        Yıl: {formData.mtvYear || 2026}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${formData.mtvPaid1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          1. Taksit: {formData.mtvPaid1 ? 'Ödendi' : 'Ödenmedi'}
                        </span>
                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${formData.mtvPaid2 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          2. Taksit: {formData.mtvPaid2 ? 'Ödendi' : 'Ödenmedi'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Log */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
            <FaTools className="text-stone-400 dark:text-zinc-500" /> Bakım Geçmişi
          </h3>
          <div className="p-4 bg-stone-50 dark:bg-zinc-800/50 rounded-2xl border border-stone-100 dark:border-zinc-800">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Son Bakım</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.lastMaintenanceDate || ''}
                    onChange={e => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                    className="text-sm font-black bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg p-1 mt-1 outline-none mb-2"
                  />
                ) : (
                  <p className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                    {formData.lastMaintenanceDate ? format(parseISO(formData.lastMaintenanceDate), 'dd MMMM yyyy', { locale: dateLocale }) : '-'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Bakım KM</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.lastMaintenanceKm || ''}
                    onChange={e => setFormData({ ...formData, lastMaintenanceKm: Number(e.target.value) })}
                    className="text-sm font-black bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg p-1 mt-1 outline-none w-24 text-right"
                  />
                ) : (
                  <p className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                    {formData.lastMaintenanceKm?.toLocaleString()} KM
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200/50 dark:border-zinc-700/50">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Yapılan İşlemler</p>
              {isEditing ? (
                <textarea
                  value={formData.maintenanceDetails || ''}
                  onChange={e => setFormData({ ...formData, maintenanceDetails: e.target.value })}
                  rows={3}
                  className="w-full text-xs font-semibold bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl p-2 outline-none resize-none"
                />
              ) : (
                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {formData.maintenanceDetails}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Logs */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-200/50 dark:border-zinc-800/50">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
            <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" /> Aylık KM Girişi
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="month"
              value={newLog.month}
              onChange={e => setNewLog({ ...newLog, month: e.target.value })}
              className="flex-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-900 w-full"
            />
            <input
              type="number"
              placeholder="Ay Sonu KM"
              value={newLog.km}
              onChange={e => setNewLog({ ...newLog, km: e.target.value })}
              className="flex-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-900 w-full"
            />
            <button
              onClick={handleAddLog}
              className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center min-w-[80px]"
            >
              <FaPlus /> Ekle
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-center text-xs text-stone-500 font-medium py-4">Henüz kayıt eklenmemiş.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex justify-between items-center p-4 bg-stone-50 dark:bg-zinc-800/30 rounded-xl border border-stone-100 dark:border-zinc-800">
                  <span className="text-sm font-bold text-stone-700 dark:text-zinc-300">
                    {format(parseISO(`${log.month}-01`), 'MMMM yyyy', { locale: dateLocale })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-stone-900 dark:text-white">{log.km.toLocaleString()} KM</span>
                    <button onClick={() => log.id && deleteLog(log.id)} className="text-stone-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
}
