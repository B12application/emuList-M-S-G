import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import useVehicle from '../../hooks/useVehicle';
import type { VehicleData } from '../../hooks/useVehicle';
import useExpenses from '../../hooks/useExpenses';
import { addCalendarAlert } from '../../../backend/services/plannerService';
import { FaCar, FaTools, FaCalendarAlt, FaPlus, FaTrash, FaSave, FaBell, FaGasPump, FaCheckCircle, FaWrench, FaEdit, FaIdCard, FaCircle, FaSnowflake, FaSun, FaHistory } from 'react-icons/fa';
import { GiCarWheel, GiCrackedGlass } from 'react-icons/gi';
import { format, differenceInDays, addMonths, parseISO, isValid } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Import local images directly
import img1 from '../../assets/IMG_1143.jpg';
import img2 from '../../assets/IMG_1150.jpg';

const COMMON_PARTS = [
  { name: 'Motor Yağı ve Filtresi', km: 10000, months: 12 },
  { name: 'Hava Filtresi', km: 10000, months: 12 },
  { name: 'Polen Filtresi', km: 10000, months: 12 },
  { name: 'Yakıt Filtresi', km: 30000, months: 24 },
  { name: 'Triger Kayışı Seti', km: 60000, months: 48 },
  { name: 'Devirdaim Pompası', km: 60000, months: 48 },
  { name: 'V Kayışı', km: 60000, months: 48 },
  { name: 'Buji Seti', km: 40000, months: 48 },
  { name: 'Antifriz', km: 60000, months: 36 },
  { name: 'Şanzıman Yağı', km: 60000, months: 48 },
  { name: 'Fren Hidroliği', km: 40000, months: 24 },
  { name: 'Ön Fren Balatası', km: 40000, months: 36 },
  { name: 'Arka Fren Balatası', km: 50000, months: 48 },
  { name: 'Ön Fren Diski', km: 60000, months: 48 },
  { name: 'Arka Fren Diski', km: 60000, months: 48 },
  { name: 'Baskı Balata Seti', km: 80000, months: 60 },
  { name: 'Amortisörler', km: 80000, months: 60 },
  { name: 'Rot Ayarı', km: 20000, months: 12 },
  { name: 'Akü', km: 0, months: 48 }
];



export default function VehicleTab() {
  const { t, language } = useLanguage();
  useTheme();
  const { user } = useAuth();
  const { vehicle, logs, maintenanceRecords, saveVehicle, addLog, deleteLog, addMaintenanceRecord, deleteMaintenanceRecord, isLoading, isSaving } = useVehicle();
  const { expenses, categories } = useExpenses();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VehicleData>>({
    purchaseDate: '2024-05-15', // Default purchase date example
    purchaseKm: 140000,
    currentKm: 155000,
    nextMaintenanceKm: 160000,
    insuranceDate: '',
    inspectionDate: '',
    mtvYear: new Date().getFullYear(),
    mtvPaid1: false,
    mtvPaid2: false,
    fuelCategory: 'Yakıt',
    licensePlate: '38ANY590',
    brand: 'Hyundai',
    model: 'Getz',
    year: 2007,
    engine: '1.4 DOHC',
    transmission: 'Manuel',
    fuelType: 'Benzin/LPG',
    tireSummerBrand: 'Kumho',
    tireSummerYear: 2025,
    tireSummerPurchaseDate: '2025-07-01',
    tireWinterBrand: 'Saetta',
    tireWinterYear: 2025,
    tireLastChangeDate: '2026-05-05',
    tireLastChangeKm: 154500,
    tireHistory: [
      { type: 'purchase', date: '2025-07-01', km: 148000, brand: 'Kumho (Yazlık)' },
      { type: 'winter', date: '2025-12-25', km: 151000 },
      { type: 'summer', date: '2026-05-05', km: 154500 }
    ],
    tramerAmount: 1100,
    damageHistory: 'Sağ ön çamurluk değişen, sağ ön kapı boyalı.',
    carBodyStatus: {
      frontRightFender: 'changed',
      frontRightDoor: 'painted'
    }
  });

  const [newLog, setNewLog] = useState({ month: format(new Date(), 'yyyy-MM'), km: '' });
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPart, setNewPart] = useState({
    partName: '',
    lifespanKm: 10000,
    lifespanMonths: 12,
    replacedKm: vehicle?.currentKm || 0,
    replacedDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [confirmingMaintenance, setConfirmingMaintenance] = useState<{
    id: string;
    partName: string;
    replacedKm: number;
    replacedDate: string;
    lifespanKm: number;
    lifespanMonths: number;
  } | null>(null);

  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());

  const toggleHistory = (id: string) => {
    setExpandedHistories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (vehicle) {
      setFormData(prev => ({ ...prev, ...vehicle }));
      setNewPart(prev => ({ ...prev, replacedKm: vehicle.currentKm || 0 }));
    }
  }, [vehicle]);

  const dateLocale = language === 'tr' ? tr : enUS;

  const parseKmInput = (value: string): number => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    return digitsOnly ? Number(digitsOnly) : 0;
  };


  const handleSave = async () => {
    if (!user) {
      toast.error('Oturum bulunamadı, tekrar giriş yapın');
      return;
    }
    try {
      await saveVehicle(formData);
      setIsEditing(false);
      toast.success(t('common.success') || 'Kaydedildi');
    } catch (err: any) {
      toast.error(err?.message || t('common.error') || 'Hata oluştu');
    }
  };


  const handleAddLog = async () => {
    const parsedKm = parseKmInput(newLog.km);
    if (!parsedKm) return;
    try {
      // Calculate KM difference to increment active tire
      const diff = Math.max(0, parsedKm - (vehicle?.currentKm || 0));
      const activeSet = tireStats.activeSet;

      const tireUpdates = activeSet === 'summer'
        ? { tireSummerTotalKm: (formData.tireSummerTotalKm || 6000) + diff }
        : { tireWinterTotalKm: (formData.tireWinterTotalKm || 2800) + diff };

      await addLog({
        month: newLog.month,
        km: parsedKm
      });

      // Update vehicle with tire mileage increment
      await saveVehicle({ ...formData, ...tireUpdates, currentKm: parsedKm });

      setNewLog({ month: format(new Date(), 'yyyy-MM'), km: '' });
      setEditingLogId(null);
      toast.success(t('expenses.vehicle.add') + ' ' + t('common.success'));
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    }
  };

  const handleAddToCalendar = async (type: 'insurance' | 'inspection' | 'mtv', dateStr: string | undefined) => {
    if (!dateStr || !user) {
      toast.error('Geçerli bir tarih yok');
      return;
    }

    let title = '';
    if (type === 'insurance') title = t('expenses.vehicle.insurance');
    if (type === 'inspection') title = t('expenses.vehicle.inspection');
    if (type === 'mtv') title = t('expenses.vehicle.mtv');

    try {
      await addCalendarAlert({
        userId: user.uid,
        label: title,
        startDate: dateStr,
        endDate: dateStr,
        color: '#f59e0b'
      });
      toast.success(t('planner.alertAdded'));
    } catch (err) {
      toast.error(t('planner.operationFailed'));
    }
  };

  const totalKmDriven = useMemo(() => {
    if (!vehicle) return 0;
    return Math.max(0, (vehicle.currentKm || 0) - (vehicle.purchaseKm || 0));
  }, [vehicle]);

  const partStatuses = useMemo(() => {
    if (!vehicle) return [];

    // Group records by part name
    const groups: Record<string, any[]> = {};
    maintenanceRecords.forEach(record => {
      if (!groups[record.partName]) groups[record.partName] = [];
      groups[record.partName].push(record);
    });

    return Object.entries(groups).map(([, records]) => {
      // Sort records by date (newest first)
      const sorted = [...records].sort((a, b) => b.replacedDate.localeCompare(a.replacedDate) || b.createdAt - a.createdAt);
      const active = sorted[0];
      const history = sorted.slice(1);

      const kmLimit = active.replacedKm + active.lifespanKm;
      const dateLimit = addMonths(parseISO(active.replacedDate), active.lifespanMonths);

      const kmRemaining = kmLimit - (vehicle.currentKm || 0);
      const daysRemaining = differenceInDays(dateLimit, new Date());

      const kmProgress = Math.max(0, Math.min(100, (kmRemaining / active.lifespanKm) * 100));
      const timeProgress = Math.max(0, Math.min(100, (daysRemaining / (active.lifespanMonths * 30)) * 100));

      const overallProgress = Math.min(kmProgress, timeProgress);

      let status: 'safe' | 'warning' | 'critical' = 'safe';
      if (overallProgress <= 10) status = 'critical';
      else if (overallProgress <= 25) status = 'warning';

      return {
        ...active,
        kmRemaining,
        daysRemaining,
        kmProgress,
        timeProgress,
        overallProgress,
        status,
        history
      };
    });
  }, [maintenanceRecords, vehicle]);

  const fuelAnalysis = useMemo(() => {
    if (!logs.length || !expenses.length || !vehicle?.fuelCategory) return [];

    const sortedLogs = [...logs].sort((a, b) => b.month.localeCompare(a.month));

    return sortedLogs.map((log, index) => {
      const previousLog = sortedLogs[index + 1];
      const baselineKm = previousLog ? previousLog.km : (vehicle.purchaseKm || 0);
      const drivenKm = Math.max(0, log.km - baselineKm);

      const monthExpenses = expenses.filter(e =>
        e.category === vehicle.fuelCategory &&
        e.date.startsWith(log.month)
      );

      const fuelTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const costPerKm = drivenKm > 0 ? fuelTotal / drivenKm : 0;

      return {
        month: log.month,
        drivenKm,
        fuelTotal,
        costPerKm
      };
    }).filter(a => a.drivenKm > 0 || a.fuelTotal > 0);
  }, [logs, expenses, vehicle]);

  const tireStats = useMemo(() => {
    const history = formData.tireHistory || [];
    const lastEntry = history.length > 0 ? history[history.length - 1] : null;
    const activeSet = lastEntry?.type === 'winter' ? 'winter' : 'summer';

    // Cumulative mileage tracking
    const totalSummerKm = formData.tireSummerTotalKm || 6000;
    const totalWinterKm = formData.tireWinterTotalKm || 2800;

    const activeTotalKm = activeSet === 'summer' ? totalSummerKm : totalWinterKm;

    // Tire Life Standards: 50,000 km or 5.5 years
    const avgLifeKm = 50000;
    const avgLifeMonths = 66;

    const kmUsage = (activeTotalKm / avgLifeKm) * 100;

    let ageUsage = 0;
    const purchaseDate = activeSet === 'summer' ? formData.tireSummerPurchaseDate : formData.tireWinterPurchaseDate;
    if (purchaseDate) {
      const ageInDays = differenceInDays(new Date(), parseISO(purchaseDate));
      ageUsage = (ageInDays / (avgLifeMonths * 30.44)) * 100;
    }

    const usagePercent = Math.min(100, Math.round(Math.max(kmUsage, ageUsage)));
    const remainingKm = Math.max(0, avgLifeKm - activeTotalKm);

    return {
      activeSet,
      activeTotalKm,
      usagePercent,
      remainingKm,
      status: usagePercent > 85 ? 'danger' : usagePercent > 65 ? 'warning' : 'safe'
    };
  }, [formData]);

  const handleAddPart = async () => {
    if (!newPart.partName) {
      toast.error('Lütfen parça adı giriniz');
      return;
    }
    try {
      await addMaintenanceRecord({
        ...newPart,
        lifespanKm: Number(newPart.lifespanKm),
        lifespanMonths: Number(newPart.lifespanMonths),
        replacedKm: Number(newPart.replacedKm)
      });
      setShowAddPart(false);
      setNewPart({
        partName: '',
        lifespanKm: 10000,
        lifespanMonths: 12,
        replacedKm: vehicle?.currentKm || 0,
        replacedDate: format(new Date(), 'yyyy-MM-dd')
      });
      toast.success('Parça başarıyla eklendi');
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    }
  };

  const handlePartMaintenanceDone = async () => {
    if (!confirmingMaintenance) return;
    try {
      await addMaintenanceRecord({
        partName: confirmingMaintenance.partName,
        lifespanKm: Number(confirmingMaintenance.lifespanKm) || 0,
        lifespanMonths: Number(confirmingMaintenance.lifespanMonths) || 0,
        replacedKm: Number(confirmingMaintenance.replacedKm),
        replacedDate: confirmingMaintenance.replacedDate
      });
      setConfirmingMaintenance(null);
      toast.success(`${confirmingMaintenance.partName} bakımı kaydedildi`);
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    }
  };

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
      className="space-y-6 pb-20"
    >
      {/* Header Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative h-64 md:h-72 rounded-[2rem] overflow-hidden shadow-lg border border-stone-200/50 dark:border-zinc-800/50 group">
          <img src={img1} alt="Vehicle 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <h2 className="text-white text-xl font-black drop-shadow-md tracking-tight uppercase">{t('expenses.vehicle.title')}</h2>
          </div>
        </div>
        <div className="relative h-64 md:h-72 rounded-[2rem] overflow-hidden shadow-lg border border-stone-200/50 dark:border-zinc-800/50 group hidden md:block">
          <img src={img2} alt="Vehicle 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      </div>

      {/* Profile Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <h3 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
          <div className="p-2 bg-stone-100 dark:bg-zinc-800 rounded-lg">
            <FaCar className="text-stone-500 dark:text-zinc-400" size={14} />
          </div>
          Araç Profili & Bilgiler
        </h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isEditing && (
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-stone-100 dark:bg-zinc-800 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700">
              <FaGasPump size={10} className="text-stone-400" />
              <select
                value={formData.fuelCategory || ''}
                onChange={e => setFormData({ ...formData, fuelCategory: e.target.value })}
                className="text-[10px] font-black bg-transparent border-none outline-none text-stone-700 dark:text-white min-w-[80px]"
              >
                <option value="">{t('expenses.selectCategory')}</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm ${isEditing
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-stone-900 dark:bg-white text-white dark:text-zinc-950 hover:scale-[1.02]'
              } ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isEditing ? <><FaSave /> {t('expenses.vehicle.save')}</> : <>{t('expenses.vehicle.edit')}</>}
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('expenses.vehicle.currentKm'), value: formData.currentKm, sub: 'KM', isEdit: true, key: 'currentKm' },
          { label: 'Satın Alım KM', value: formData.purchaseKm, sub: 'KM', isEdit: true, key: 'purchaseKm' },
          { label: 'Yapılan Toplam Yol', value: totalKmDriven, sub: 'KM', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Sonraki Periyodik Bakım', value: formData.nextMaintenanceKm, sub: 'KM', isEdit: true, key: 'nextMaintenanceKm', color: 'text-amber-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-stone-50/50 dark:bg-zinc-800/30 p-5 rounded-3xl border border-stone-100 dark:border-zinc-800 flex flex-col justify-center relative overflow-hidden">
            <p className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
            {isEditing && stat.isEdit ? (
              <input
                type="number"
                value={stat.value || 0}
                onChange={e => setFormData({ ...formData, [stat.key!]: Number(e.target.value) })}
                className="text-lg font-black bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg p-1.5 outline-none w-full"
              />
            ) : (
              <h4 className={`text-xl font-black ${stat.color || 'text-stone-900 dark:text-white'}`}>
                {(stat.value || 0).toLocaleString()} <span className="text-xs text-stone-400 font-bold ml-1">{stat.sub}</span>
              </h4>
            )}
            {!isEditing && stat.key === 'nextMaintenanceKm' && (
              <p className="text-[9px] font-bold text-stone-500 mt-1 uppercase tracking-tighter">
                Kalan: <span className="text-amber-600">{Math.max(0, (formData.nextMaintenanceKm || 0) - (formData.currentKm || 0)).toLocaleString()} KM</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Identity, Tires, Damage */}
        <div className="space-y-6 flex flex-col">
          {/* Identity Section */}
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <FaCar size={120} />
            </div>
            <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest relative z-10">
              <FaIdCard className="text-stone-400 dark:text-zinc-500" /> {t('expenses.vehicle.identity')}
            </h3>

            <div className="space-y-6 relative z-10">
              {/* Top Row: Plate and Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Plaka</label>
                  {isEditing ? (
                    <input
                      value={formData.licensePlate}
                      onChange={e => setFormData({ ...formData, licensePlate: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
                    />
                  ) : (
                    <div className="inline-flex bg-white dark:bg-zinc-900 border-2 border-stone-900 dark:border-white rounded-xl px-6 py-2.5 shadow-sm">
                      <span className="text-2xl font-black text-stone-900 dark:text-white tracking-[0.2em]">{formData.licensePlate || '---'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">{t('expenses.vehicle.brandModel')}</label>
                  {isEditing ? (
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Marka" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black" />
                      <input placeholder="Model" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black" />
                      <input type="number" placeholder="Yıl" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black" />
                    </div>
                  ) : (
                    <div className="pt-1">
                      <h4 className="text-xl font-black text-stone-900 dark:text-white uppercase leading-none">
                        {formData.brand} {formData.model}
                        <span className="text-stone-400 dark:text-zinc-500 font-bold ml-2 text-sm">{formData.year}</span>
                      </h4>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Row: Specs */}
              <div className="p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Motor', value: formData.engine, icon: <FaTools size={12} />, key: 'engine' },
                    { label: 'Şanzıman', value: formData.transmission, icon: <FaCircle size={8} />, key: 'transmission' },
                    { label: 'Yakıt', value: formData.fuelType, icon: <FaGasPump size={12} />, key: 'fuelType' }
                  ].map((spec, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-[8px] font-black text-stone-400 uppercase">{spec.label}</p>
                      {isEditing ? (
                        <input
                          value={spec.value || ''}
                          onChange={e => setFormData({ ...formData, [spec.key]: e.target.value })}
                          className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] font-black"
                        />
                      ) : (
                        <p className="text-[11px] font-black text-stone-600 dark:text-zinc-300 flex items-center gap-1.5 uppercase">
                          <span className="text-stone-300">{spec.icon}</span> {spec.value || '---'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Purchase Date, Tramer & Damage (Simplified) */}
              <div className="pt-2 border-t border-stone-200/50 dark:border-zinc-800/50 space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Satın Alım Tarihi</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.purchaseDate || ''}
                        onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-[10px] font-black"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-stone-400" size={10} />
                        <p className="text-[11px] font-black text-stone-800 dark:text-white">
                          {formData.purchaseDate && isValid(parseISO(formData.purchaseDate))
                            ? format(parseISO(formData.purchaseDate), 'dd MMMM yyyy', { locale: dateLocale })
                            : '---'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Tramer Kaydı</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.tramerAmount || ''}
                        onChange={e => setFormData({ ...formData, tramerAmount: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-[10px] font-black"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <GiCrackedGlass className="text-rose-400" size={10} />
                        <p className="text-[11px] font-black text-stone-800 dark:text-white">
                          {(formData.tramerAmount || 0).toLocaleString()} TL
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Hasar Notu</label>
                    {isEditing ? (
                      <input
                        value={formData.damageHistory || ''}
                        onChange={e => setFormData({ ...formData, damageHistory: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-[10px] font-black"
                      />
                    ) : (
                      <p className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 line-clamp-1 italic">
                        {formData.damageHistory || 'Kayıt yok.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <GiCarWheel size={120} />
            </div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-[11px] font-black text-stone-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                <GiCarWheel className="text-stone-400 dark:text-zinc-500" /> {t('expenses.vehicle.tireStatus')}
              </h3>
              {!isEditing && (
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-stone-100 dark:border-zinc-800 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-black text-stone-600 dark:text-zinc-400 uppercase">
                    {tireStats.activeSet === 'summer' ? 'Yazlık Takılı' : 'Kışlık Takılı'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4 relative z-10">
              {/* Progress Bar Area */}
              {!isEditing && (
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-stone-100 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase leading-none mb-1">Lastik Kullanım Ömrü</p>
                      <h4 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                        {tireStats.usagePercent}% <span className="text-stone-400 text-xs font-bold">Kullanıldı</span>
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-stone-400 uppercase leading-none mb-1">Kalan Ömür</p>
                      <p className={`text-sm font-black uppercase ${tireStats.status === 'warning' ? 'text-amber-500' : tireStats.status === 'danger' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ~{tireStats.remainingKm.toLocaleString()} KM
                      </p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full transition-all duration-1000 ${tireStats.status === 'danger' ? 'bg-rose-500' : tireStats.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      style={{ width: `${tireStats.usagePercent}%` }}
                    />
                    <div className="flex-1 h-full bg-stone-50 dark:bg-zinc-800/50" />
                  </div>
                </div>
              )}

              {/* Tires Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    type: 'summer',
                    label: t('expenses.vehicle.summerTire'),
                    brand: formData.tireSummerBrand,
                    date: formData.tireSummerPurchaseDate,
                    year: formData.tireSummerYear,
                    icon: <FaSun className="text-amber-500" />
                  },
                  {
                    type: 'winter',
                    label: t('expenses.vehicle.winterTire'),
                    brand: formData.tireWinterBrand,
                    date: formData.tireWinterPurchaseDate,
                    year: formData.tireWinterYear,
                    icon: <FaSnowflake className="text-sky-500" />
                  }
                ].map(tire => (
                  <div key={tire.type} className={`p-4 rounded-2xl border transition-all ${tireStats.activeSet === tire.type
                    ? 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 shadow-md ring-1 ring-stone-900/5'
                    : 'bg-stone-50/50 dark:bg-zinc-800/20 border-stone-100 dark:border-zinc-800 opacity-60'
                    }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-stone-100 dark:border-zinc-800">
                          {tire.icon}
                        </div>
                        <p className="text-[10px] font-black text-stone-500 dark:text-zinc-400 uppercase">{tire.label}</p>
                      </div>
                      {tireStats.activeSet === tire.type && (
                        <span className="text-[8px] font-black bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-2 py-0.5 rounded-full uppercase tracking-tighter">Aktif</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          placeholder="Marka/Model"
                          value={tire.brand || ''}
                          onChange={e => setFormData({ ...formData, [tire.type === 'summer' ? 'tireSummerBrand' : 'tireWinterBrand']: e.target.value })}
                          className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-black"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Üretim Yılı"
                            value={tire.year || ''}
                            onChange={e => setFormData({ ...formData, [tire.type === 'summer' ? 'tireSummerYear' : 'tireWinterYear']: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-black"
                          />
                          <input
                            type="date"
                            value={tire.date || ''}
                            onChange={e => setFormData({ ...formData, [tire.type === 'summer' ? 'tireSummerPurchaseDate' : 'tireWinterPurchaseDate']: e.target.value })}
                            className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-black"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-stone-900 dark:text-white uppercase leading-none">
                          {tire.brand || '---'}
                          <span className="text-[10px] text-stone-400 ml-2">{tire.year || ''}</span>
                        </h4>
                        <p className="text-[9px] font-bold text-stone-400 uppercase flex items-center gap-1">
                          <FaCalendarAlt size={8} /> Alım: {tire.date ? format(parseISO(tire.date), 'MM/yyyy') : '---'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Action: Change Tire */}
              {!isEditing && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const newSet = tireStats.activeSet === 'summer' ? 'winter' : 'summer';
                      const currentKm = Number(formData.currentKm) || 0;

                      const newEntry: any = {
                        date: format(new Date(), 'yyyy-MM-dd'),
                        km: currentKm,
                        type: newSet as 'summer' | 'winter',
                        note: `${newSet === 'summer' ? 'Yazlık' : 'Kışlık'} lastiklere geçiş yapıldı.`
                      };

                      setFormData({
                        ...formData,
                        tireLastChangeDate: newEntry.date,
                        tireLastChangeKm: newEntry.km,
                        tireHistory: [...(formData.tireHistory || []), newEntry]
                      });
                    }}
                    className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 group"
                  >
                    <GiCarWheel className="group-hover:rotate-180 transition-transform duration-500" />
                    Lastik Değişimi Kaydet ({(formData.currentKm || 0).toLocaleString()} KM)
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Dates, Maintenance, KM Input */}
        <div className="space-y-6 flex flex-col">
          {/* Important Dates */}
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800">
            <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" /> Önemli Tarihler & Belgeler
            </h3>
            <div className="space-y-3">
              {[
                { label: t('expenses.vehicle.insurance'), key: 'insuranceDate', icon: '🛡️', type: 'insurance' },
                { label: t('expenses.vehicle.inspection'), key: 'inspectionDate', icon: '📋', type: 'inspection' }
              ].map(item => {
                const value = (formData as any)[item.key];
                const daysLeft = (item.type === 'insurance' || item.type === 'inspection') && value && isValid(parseISO(value)) ? differenceInDays(parseISO(value), new Date()) : null;

                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-800/30 rounded-2xl border border-stone-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-xl shadow-sm text-lg">{item.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase">{item.label}</p>
                          {!isEditing && daysLeft !== null && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${daysLeft < 30 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                              }`}>
                              {daysLeft > 0 ? `${daysLeft} Gün Kaldı` : 'Süresi Doldu'}
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <input
                            type="date"
                            value={value || ''}
                            onChange={e => setFormData({ ...formData, [item.key]: e.target.value })}
                            className="text-xs font-black bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg p-1.5 mt-1 outline-none"
                          />
                        ) : (
                          <p className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                            {value && isValid(parseISO(value)) ? format(parseISO(value), 'dd MMMM yyyy', { locale: dateLocale }) : '-'}
                          </p>
                        )}
                      </div>
                    </div>
                    {!(formData as any)[item.key] || isEditing ? null : (
                      <button
                        onClick={() => handleAddToCalendar(item.type as any, (formData as any)[item.key])}
                        className="p-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white rounded-xl transition-all"
                      >
                        <FaBell size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* MTV Status */}
              <div className="p-4 bg-stone-50 dark:bg-zinc-800/30 rounded-2xl border border-stone-100 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-xl shadow-sm text-lg">💰</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase">MTV Ödemeleri</p>
                    {isEditing ? (
                      <div className="flex flex-col gap-3 mt-2">
                        <select
                          value={formData.mtvYear || new Date().getFullYear()}
                          onChange={e => setFormData({ ...formData, mtvYear: Number(e.target.value) })}
                          className="text-xs font-black bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg p-2 outline-none w-28"
                        >
                          {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[1, 2].map(i => (
                            <label key={i} className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-zinc-900 rounded-lg border border-stone-200 dark:border-zinc-700">
                              <input
                                type="checkbox"
                                checked={(formData as any)[`mtvPaid${i}`] || false}
                                onChange={e => setFormData({ ...formData, [`mtvPaid${i}`]: e.target.checked })}
                                className="accent-stone-900 dark:accent-white w-4 h-4 rounded-md"
                              />
                              <span className="text-[10px] font-bold text-stone-600 dark:text-zinc-400">Taksit {i} Ödendi</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <p className="text-sm font-black text-stone-900 dark:text-white">{formData.mtvYear}</p>
                        <div className="flex gap-1.5">
                          {[1, 2].map(i => (
                            <span key={i} className={`text-[8px] px-2 py-1 rounded-md font-black uppercase tracking-tighter ${(formData as any)[`mtvPaid${i}`]
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                              Taksit {i}: {(formData as any)[`mtvPaid${i}`] ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Maintenance Health Tracking */}
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-black text-stone-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                <FaWrench className="text-stone-400 dark:text-zinc-500" /> {t('expenses.vehicle.smartMaintenance') || 'Akıllı Bakım Takibi'}
              </h3>
              <button
                onClick={() => setShowAddPart(!showAddPart)}
                className="p-2 bg-stone-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:scale-105 transition-all shadow-sm"
              >
                <FaPlus size={10} />
              </button>
            </div>

            <AnimatePresence>
              {showAddPart && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-stone-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-stone-300 dark:border-zinc-700 space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="text-[9px] font-black text-stone-400 ml-1 uppercase tracking-widest mb-1 block">Hızlı Seçim</label>
                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1 custom-scrollbar">
                      {COMMON_PARTS.map(part => (
                        <button
                          key={part.name}
                          onClick={() => setNewPart({
                            ...newPart,
                            partName: part.name,
                            lifespanKm: part.km,
                            lifespanMonths: part.months
                          })}
                          className="px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg text-[8px] font-bold text-stone-600 dark:text-zinc-400 hover:border-stone-900 dark:hover:border-white hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all"
                        >
                          {part.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Parça Adı"
                        value={newPart.partName}
                        onChange={e => setNewPart({ ...newPart, partName: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-stone-400 uppercase ml-1">Değişim KM</label>
                      <input
                        type="number"
                        value={newPart.replacedKm}
                        onChange={e => setNewPart({ ...newPart, replacedKm: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-stone-400 uppercase ml-1">Değişim Tarihi</label>
                      <input
                        type="date"
                        value={newPart.replacedDate}
                        onChange={e => setNewPart({ ...newPart, replacedDate: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-stone-400 uppercase ml-1">Ömür (KM)</label>
                      <input
                        type="number"
                        value={newPart.lifespanKm}
                        onChange={e => setNewPart({ ...newPart, lifespanKm: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-stone-400 uppercase ml-1">Ömür (Ay)</label>
                      <input
                        type="number"
                        value={newPart.lifespanMonths}
                        onChange={e => setNewPart({ ...newPart, lifespanMonths: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddPart}
                    className="w-full py-2 bg-stone-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Listeye Ekle
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {partStatuses.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center opacity-40 py-10">
                  <FaTools size={32} className="mb-3 text-stone-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Henüz parça eklenmedi</p>
                </div>
              ) : (
                partStatuses.map((part) => (
                  <div key={part.id} className="p-4 bg-stone-50 dark:bg-zinc-800/30 rounded-2xl border border-stone-100 dark:border-zinc-800 group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">{part.partName}</h4>
                        <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">Son Değişim: {(part.replacedKm || 0).toLocaleString()} KM / {format(parseISO(part.replacedDate), 'dd.MM.yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfirmingMaintenance({
                            id: part.id!,
                            partName: part.partName,
                            replacedKm: vehicle?.currentKm || 0,
                            replacedDate: format(new Date(), 'yyyy-MM-dd'),
                            lifespanKm: part.lifespanKm,
                            lifespanMonths: part.lifespanMonths
                          })}
                          className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:scale-110 transition-transform"
                          title="Bakım Yapıldı"
                        >
                          <FaCheckCircle size={12} />
                        </button>
                        <button
                          onClick={() => part.id && deleteMaintenanceRecord(part.id)}
                          className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter">
                          <span className={part.status === 'critical' ? 'text-rose-500' : 'text-stone-400'}>
                            {part.kmRemaining > 0 ? `${part.kmRemaining.toLocaleString()} KM Kaldı` : 'KM Doldu'}
                          </span>
                          <span className={part.status === 'critical' ? 'text-rose-500' : 'text-stone-400'}>
                            {part.daysRemaining > 0 ? `${part.daysRemaining} Gün Kaldı` : 'Süre Doldu'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${part.overallProgress}%` }}
                            className={`h-full rounded-full ${part.status === 'safe' ? 'bg-emerald-500' :
                              part.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                          />
                        </div>
                      </div>

                      {/* History List */}
                      {part.history && part.history.length > 0 && (
                        <div className="pt-2 border-t border-stone-200 dark:border-zinc-700">
                          <button
                            onClick={() => toggleHistory(part.id!)}
                            className="w-full flex items-center justify-between text-[7px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-900 dark:hover:text-white transition-colors group/hist"
                          >
                            <span className="flex items-center gap-1">
                              <FaHistory size={6} /> Geçmiş Kayıtlar ({part.history.length})
                            </span>
                            <motion.span
                              animate={{ rotate: expandedHistories.has(part.id!) ? 180 : 0 }}
                              className="text-[10px]"
                            >
                              ↓
                            </motion.span>
                          </button>

                          <AnimatePresence>
                            {expandedHistories.has(part.id!) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-1.5 mt-2"
                              >
                                {part.history.map((h: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-[8px] font-bold text-stone-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/30 px-2 py-1 rounded-md border border-stone-100/50 dark:border-zinc-800/50">
                                    <span>{format(parseISO(h.replacedDate), 'dd.MM.yyyy')}</span>
                                    <span>{h.replacedKm.toLocaleString()} KM</span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Layout: KM Input (1/3) and Fuel Analysis (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly KM Input */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 h-full flex flex-col">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" /> Aylık KM Girişi
          </h3>
          <div className="space-y-4 flex-1">
            <div className="space-y-3">
              <input
                type="month"
                value={newLog.month}
                onChange={e => setNewLog({ ...newLog, month: e.target.value })}
                disabled={!!editingLogId}
                className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-black focus:outline-none dark:text-white disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              />
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ay Sonu KM"
                  value={newLog.km}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setNewLog({ ...newLog, km: val });
                  }}
                  className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-black focus:outline-none dark:text-white shadow-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-400">KM</span>
              </div>
              <button
                onClick={() => {
                  const cleanKm = typeof newLog.km === 'string'
                    ? parseFloat(newLog.km.replace(',', '.'))
                    : newLog.km;

                  if (!isNaN(cleanKm as number)) {
                    handleAddLog();
                  }
                }}
                className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <FaPlus /> {editingLogId ? 'Guncelle' : 'Ekle'}
              </button>
              {editingLogId && (
                <button
                  onClick={() => {
                    setEditingLogId(null);
                    setNewLog({ month: format(new Date(), 'yyyy-MM'), km: '' });
                  }}
                  className="w-full py-2 bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  Iptal
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-stone-200/50 dark:border-zinc-700/50 space-y-2 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
              {logs.map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900/50 rounded-xl border border-stone-100 dark:border-zinc-800 group">
                  <span className="text-[9px] font-black text-stone-400 uppercase">{format(parseISO(`${log.month}-01`), 'MMM yyyy', { locale: dateLocale })}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-stone-900 dark:text-white">{Number(log.km).toLocaleString('tr-TR')}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingLogId(log.id || null);
                          setNewLog({ month: log.month, km: log.km.toString().replace('.', ',') });
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        <FaEdit size={10} />
                      </button>
                      <button onClick={() => log.id && deleteLog(log.id)} className="p-1 text-stone-400 hover:text-rose-500 transition-colors"><FaTrash size={10} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fuel Consumption Analysis (Takes 2/3 space on large screens) */}
        <div className="lg:col-span-2 bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 overflow-hidden flex flex-col">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <FaGasPump className="text-stone-400 dark:text-zinc-500" /> Yakıt Tüketim Analizi
          </h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em] border-b border-stone-100 dark:border-zinc-800">
                  <th className="pb-3 pl-2">Dönem</th>
                  <th className="pb-3 text-right">Yol (KM)</th>
                  <th className="pb-3 text-right">Yakıt Toplam</th>
                  <th className="pb-3 text-right pr-2">KM Maliyeti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/50">
                {fuelAnalysis.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[10px] text-stone-400 font-black uppercase opacity-50">Analiz için yeterli veri yok</td>
                  </tr>
                ) : (
                  fuelAnalysis.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-stone-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 pl-2">
                        <p className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">{format(parseISO(`${item.month}-01`), 'MMMM yyyy', { locale: dateLocale })}</p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">{Number(item.drivenKm).toLocaleString('tr-TR')} KM</p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{Number(item.fuelTotal).toLocaleString('tr-TR')} TL</p>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black ${item.costPerKm > 5 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                          {Number(item.costPerKm).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Maintenance Confirmation Modal */}
      <AnimatePresence>
        {confirmingMaintenance && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 dark:border-zinc-800"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle size={32} />
                </div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Bakım Tamamlandı mı?</h3>
                <p className="text-xs font-bold text-stone-400 uppercase mt-1">{confirmingMaintenance.partName}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[9px] font-black text-stone-400 uppercase ml-2 mb-1 block tracking-widest">Değişim Kilometresi</label>
                  <input
                    type="number"
                    value={confirmingMaintenance.replacedKm}
                    onChange={e => setConfirmingMaintenance({ ...confirmingMaintenance, replacedKm: Number(e.target.value) })}
                    className="w-full bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none dark:text-white focus:border-stone-900 dark:focus:border-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-stone-400 uppercase ml-2 mb-1 block tracking-widest">Değişim Tarihi</label>
                  <input
                    type="date"
                    value={confirmingMaintenance.replacedDate}
                    onChange={e => setConfirmingMaintenance({ ...confirmingMaintenance, replacedDate: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none dark:text-white focus:border-stone-900 dark:focus:border-white transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingMaintenance(null)}
                  className="flex-1 py-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handlePartMaintenanceDone}
                  className="flex-1 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-stone-900/10 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Kaydet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Section */}
      <footer className="mt-12 pt-8 pb-4 border-t border-stone-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-stone-900 shadow-lg shadow-stone-900/10 dark:shadow-none">
              <FaCar size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-900 dark:text-white uppercase tracking-widest leading-none">emuList</p>
              <p className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter mt-0.5">Smart Vehicle Management</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
              © {new Date().getFullYear()} • Güvenli Sürüşler Dileriz
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Son Güncelleme</p>
              <p className="text-[10px] font-bold text-stone-600 dark:text-zinc-400 mt-1">
                {vehicle?.updatedAt ? format(new Date(vehicle.updatedAt), 'dd.MM.yyyy HH:mm') : format(new Date(), 'dd.MM.yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center opacity-20 hover:opacity-40 transition-opacity">
          <p className="text-[7px] font-black text-stone-400 uppercase tracking-[0.3em]">Antigravity Engineering • Vehicle Core v2.0</p>
        </div>
      </footer>
    </motion.div>
  );
}
