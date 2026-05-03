import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import useVehicle from '../../hooks/useVehicle';
import type { VehicleData } from '../../hooks/useVehicle';
import useExpenses from '../../hooks/useExpenses';
import { addCalendarAlert } from '../../../backend/services/plannerService';
import { FaCar, FaTools, FaCalendarAlt, FaPlus, FaTrash, FaSave, FaBell, FaGasPump, FaCheckCircle, FaWrench, FaEdit, FaIdCard, FaCircle } from 'react-icons/fa';
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
  { name: 'Ön Fren Balatası', km: 40000, months: 36 },
  { name: 'Arka Fren Balatası', km: 50000, months: 48 },
  { name: 'Ön Fren Diski', km: 60000, months: 48 },
  { name: 'Arka Fren Diski', km: 60000, months: 48 },
  { name: 'Triger Kayışı', km: 60000, months: 48 },
  { name: 'V Kayışı', km: 60000, months: 48 },
  { name: 'Buji', km: 40000, months: 48 },
  { name: 'Antifriz', km: 60000, months: 36 },
  { name: 'Şanzıman Yağı', km: 60000, months: 48 },
  { name: 'Fren Hidroliği', km: 40000, months: 24 }
];

const CAR_PARTS_CONFIG = [
  { id: 'hood', labelKey: 'hood', x: 120, y: 50, width: 60, height: 40 },
  { id: 'roof', labelKey: 'roof', x: 120, y: 120, width: 60, height: 60 },
  { id: 'trunk', labelKey: 'trunk', x: 120, y: 210, width: 60, height: 30 },
  { id: 'frontLeftFender', labelKey: 'frontLeftFender', x: 70, y: 50, width: 30, height: 40 },
  { id: 'frontRightFender', labelKey: 'frontRightFender', x: 200, y: 50, width: 30, height: 40 },
  { id: 'rearLeftFender', labelKey: 'rearLeftFender', x: 70, y: 200, width: 30, height: 40 },
  { id: 'rearRightFender', labelKey: 'rearRightFender', x: 200, y: 200, width: 30, height: 40 },
  { id: 'frontLeftDoor', labelKey: 'frontLeftDoor', x: 70, y: 100, width: 30, height: 45 },
  { id: 'frontRightDoor', labelKey: 'frontRightDoor', x: 200, y: 100, width: 30, height: 45 },
  { id: 'rearLeftDoor', labelKey: 'rearLeftDoor', x: 70, y: 150, width: 30, height: 45 },
  { id: 'rearRightDoor', labelKey: 'rearRightDoor', x: 200, y: 150, width: 30, height: 45 },
  { id: 'frontBumper', labelKey: 'frontBumper', x: 100, y: 20, width: 100, height: 20 },
  { id: 'rearBumper', labelKey: 'rearBumper', x: 100, y: 250, width: 100, height: 20 },
];

function CarBodyVisual({ status, onPartClick, isEditing }: { status: Record<string, string>, onPartClick: (id: string) => void, isEditing: boolean }) {
  useLanguage();

  const getPartColor = (partId: string) => {
    const s = status[partId] || 'original';
    if (s === 'changed') return 'fill-rose-500 stroke-rose-700';
    if (s === 'painted') return 'fill-amber-400 stroke-amber-600';
    return 'fill-emerald-500/20 stroke-emerald-500/50 dark:fill-emerald-500/10 dark:stroke-emerald-500/30';
  };

  return (
    <div className="relative w-full max-w-[300px] mx-auto aspect-[3/4] bg-stone-100/50 dark:bg-zinc-900/50 rounded-3xl p-4 border border-stone-200 dark:border-zinc-800">
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-xl">
        {/* Car Outline Base */}
        <rect x="80" y="40" width="140" height="210" rx="40" className="fill-stone-200 dark:fill-zinc-800 stroke-stone-300 dark:stroke-zinc-700 stroke-2" />

        {/* Interactive Parts */}
        {CAR_PARTS_CONFIG.map(part => (
          <g
            key={part.id}
            onClick={() => isEditing && onPartClick(part.id)}
            className={`${isEditing ? 'cursor-pointer hover:brightness-110 transition-all' : ''}`}
          >
            <rect
              x={part.x} y={part.y} width={part.width} height={part.height} rx="4"
              className={`${getPartColor(part.id)} stroke-2 transition-colors duration-300`}
            />
            {status[part.id] && status[part.id] !== 'original' && (
              <text
                x={part.x + part.width / 2}
                y={part.y + part.height / 2}
                textAnchor="middle"
                alignmentBaseline="middle"
                className="fill-white font-black text-[8px] pointer-events-none uppercase"
              >
                {status[part.id] === 'changed' ? 'D' : 'B'}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[7px] font-black uppercase text-stone-400">Orijinal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[7px] font-black uppercase text-stone-400">Boyalı</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[7px] font-black uppercase text-stone-400">Değişen</span>
        </div>
      </div>
    </div>
  );
}

export default function VehicleTab() {
  const { t, language } = useLanguage();
  useTheme();
  const { user } = useAuth();
  const { vehicle, logs, maintenanceRecords, saveVehicle, addLog, deleteLog, addMaintenanceRecord, deleteMaintenanceRecord, isLoading, isSaving } = useVehicle();
  const { expenses, categories } = useExpenses();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VehicleData>>({
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    purchaseKm: 0,
    currentKm: 0,
    nextMaintenanceKm: 0,
    insuranceDate: '',
    inspectionDate: '',
    mtvYear: new Date().getFullYear(),
    mtvPaid1: false,
    mtvPaid2: false,
    fuelCategory: 'Yakıt',
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    engine: '',
    transmission: '',
    fuelType: '',
    tireSummerBrand: '',
    tireSummerYear: 2025,
    tireWinterBrand: '',
    tireWinterYear: 2025,
    tramerAmount: 0,
    damageHistory: '',
    carBodyStatus: {}
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

  const handlePartClick = (partId: string) => {
    setFormData(prev => {
      const current = prev.carBodyStatus?.[partId] || 'original';
      let next: 'original' | 'painted' | 'changed' = 'original';
      if (current === 'original') next = 'painted';
      else if (current === 'painted') next = 'changed';
      else next = 'original';

      return {
        ...prev,
        carBodyStatus: {
          ...(prev.carBodyStatus || {}),
          [partId]: next
        }
      };
    });
  };

  const handleAddLog = async () => {
    const parsedKm = parseKmInput(newLog.km);
    if (!parsedKm) return;
    try {
      await addLog({
        month: newLog.month,
        km: parsedKm
      });
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
    return maintenanceRecords.map(record => {
      const kmLimit = record.replacedKm + record.lifespanKm;
      const dateLimit = addMonths(parseISO(record.replacedDate), record.lifespanMonths);

      const kmRemaining = kmLimit - (vehicle.currentKm || 0);
      const daysRemaining = differenceInDays(dateLimit, new Date());

      const kmProgress = Math.max(0, Math.min(100, (kmRemaining / record.lifespanKm) * 100));
      const timeProgress = Math.max(0, Math.min(100, (daysRemaining / (record.lifespanMonths * 30)) * 100));

      const overallProgress = Math.min(kmProgress, timeProgress);

      let status: 'safe' | 'warning' | 'critical' = 'safe';
      if (overallProgress <= 10) status = 'critical';
      else if (overallProgress <= 25) status = 'warning';

      return {
        ...record,
        kmRemaining,
        daysRemaining,
        kmProgress,
        timeProgress,
        overallProgress,
        status
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

  const handleAddPart = async () => {
    if (!newPart.partName) {
      toast.error('Lütfen parça adı giriniz');
      return;
    }
    try {
      await addMaintenanceRecord(newPart);
      setShowAddPart(false);
      setNewPart({
        partName: '',
        lifespanKm: 10000,
        lifespanMonths: 12,
        replacedKm: vehicle?.currentKm || 0,
        replacedDate: format(new Date(), 'yyyy-MM-dd')
      });
      toast.success('Parça başarıyla eklendi');
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const handlePartMaintenanceDone = async (record: any) => {
    try {
      // Persist only canonical maintenance fields to Firestore.
      await addMaintenanceRecord({
        partName: record.partName,
        lifespanKm: Number(record.lifespanKm) || 0,
        lifespanMonths: Number(record.lifespanMonths) || 0,
        replacedKm: vehicle?.currentKm || record.replacedKm,
        replacedDate: format(new Date(), 'yyyy-MM-dd')
      });
      toast.success(`${record.partName} bakımı kaydedildi`);
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

      {/* New Sections: Identity, Tires, and Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800">
            <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <FaIdCard className="text-stone-400 dark:text-zinc-500" /> {t('expenses.vehicle.identity')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-stone-400 uppercase">Plaka</label>
                {isEditing ? (
                  <input
                    value={formData.licensePlate}
                    onChange={e => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white"
                  />
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border-2 border-stone-900 dark:border-white rounded-lg px-4 py-2 flex items-center justify-center">
                    <span className="text-xl font-black text-stone-900 dark:text-white tracking-widest">{formData.licensePlate || '---'}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-black text-stone-400 uppercase">{t('expenses.vehicle.brandModel')}</label>
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder="Marka"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white"
                    />
                    <input
                      placeholder="Model"
                      value={formData.model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Yıl"
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="px-1">
                    <h4 className="text-lg font-black text-stone-900 dark:text-white uppercase">
                      {formData.brand} {formData.model} <span className="text-stone-400 font-bold ml-1">{formData.year}</span>
                    </h4>
                  </div>
                )}
              </div>
              <div className="space-y-1 md:col-span-3">
                <label className="text-[9px] font-black text-stone-400 uppercase">{t('expenses.vehicle.engineTransmission')}</label>
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder="Motor (örn: 1.4 DOHC)"
                      value={formData.engine}
                      onChange={e => setFormData({ ...formData, engine: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white"
                    />
                    <input
                      placeholder="Şanzıman (örn: Manuel)"
                      value={formData.transmission}
                      onChange={e => setFormData({ ...formData, transmission: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white"
                    />
                    <input
                      placeholder="Yakıt (örn: Benzin/LPG)"
                      value={formData.fuelType}
                      onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="flex gap-4 px-1">
                    <span className="text-xs font-black text-stone-500 uppercase flex items-center gap-1">
                      <FaTools size={10} className="text-stone-400" /> {formData.engine || '---'}
                    </span>
                    <span className="text-xs font-black text-stone-500 uppercase flex items-center gap-1">
                      <FaCircle size={6} className="text-stone-300" /> {formData.transmission || '---'}
                    </span>
                    <span className="text-xs font-black text-stone-500 uppercase flex items-center gap-1">
                      <FaGasPump size={10} className="text-stone-400" /> {formData.fuelType || '---'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tires Section */}
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800">
            <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <GiCarWheel className="text-stone-400 dark:text-zinc-500" /> {t('expenses.vehicle.tireStatus')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-3 flex items-center gap-1">
                  <FaCheckCircle size={10} /> {t('expenses.vehicle.summerTire')}
                </p>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      placeholder="Marka"
                      value={formData.tireSummerBrand}
                      onChange={e => setFormData({ ...formData, tireSummerBrand: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 font-bold text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Yıl"
                      value={formData.tireSummerYear}
                      onChange={e => setFormData({ ...formData, tireSummerYear: Number(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 font-bold text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-black text-stone-800 dark:text-white uppercase">{formData.tireSummerBrand || 'Kumho'}</h4>
                      <p className="text-[10px] font-bold text-stone-400">Üretim: {formData.tireSummerYear || 2025}</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Aktif</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                <p className="text-[9px] font-black text-stone-400 uppercase mb-3 flex items-center gap-1">
                  <FaCheckCircle size={10} /> {t('expenses.vehicle.winterTire')}
                </p>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      placeholder="Marka"
                      value={formData.tireWinterBrand}
                      onChange={e => setFormData({ ...formData, tireWinterBrand: e.target.value })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 font-bold text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Yıl"
                      value={formData.tireWinterYear}
                      onChange={e => setFormData({ ...formData, tireWinterYear: Number(e.target.value) })}
                      className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 font-bold text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex justify-between items-end opacity-60">
                    <div>
                      <h4 className="text-sm font-black text-stone-800 dark:text-white uppercase">{formData.tireWinterBrand || 'Saetta'}</h4>
                      <p className="text-[10px] font-bold text-stone-400">Üretim: {formData.tireWinterYear || 2025}</p>
                    </div>
                    <span className="bg-stone-200 dark:bg-zinc-800 text-stone-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Depoda</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Damage & Tramer Section */}
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800">
            <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <GiCrackedGlass className="text-stone-400 dark:text-zinc-500" /> {t('expenses.vehicle.damageHistory')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                  <p className="text-[9px] font-black text-rose-500 uppercase mb-1">{t('expenses.vehicle.tramerAmount')}</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.tramerAmount}
                      onChange={e => setFormData({ ...formData, tramerAmount: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1 font-black text-rose-600"
                    />
                  ) : (
                    <h4 className="text-lg font-black text-rose-600">
                      {formData.tramerAmount?.toLocaleString()} <span className="text-[10px]">TL</span>
                    </h4>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase">Notlar</label>
                  {isEditing ? (
                    <textarea
                      value={formData.damageHistory}
                      onChange={e => setFormData({ ...formData, damageHistory: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 font-bold text-[11px] h-20 outline-none"
                      placeholder="Hasar detaylarını buraya yazabilirsiniz..."
                    />
                  ) : (
                    <p className="text-[11px] font-bold text-stone-600 dark:text-zinc-400 leading-relaxed italic">
                      {formData.damageHistory || 'Kayıtlı hasar notu bulunmuyor.'}
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-[9px] font-black text-stone-400 uppercase mb-4 text-center">{t('expenses.vehicle.bodyStatus')}</p>
                <CarBodyVisual
                  status={formData.carBodyStatus || {}}
                  onPartClick={handlePartClick}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Column: Dates and Maintenance */}
        <div className="space-y-6">
          {/* Important Dates */}
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 h-full">
            <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" /> Önemli Tarihler & Belgeler
            </h3>
            <div className="space-y-3 flex-1">
              {[
                { label: 'Satın Alım Tarihi', key: 'purchaseDate', icon: '📅', type: 'date' },
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
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 flex flex-col">
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
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_PARTS.slice(0, 6).map(part => (
                        <button
                          key={part.name}
                          onClick={() => setNewPart({
                            ...newPart,
                            partName: part.name,
                            lifespanKm: part.km,
                            lifespanMonths: part.months
                          })}
                          className="px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg text-[8px] font-bold text-stone-600 dark:text-zinc-400 hover:border-stone-900 dark:hover:border-white transition-all"
                        >
                          {part.name}
                        </button>
                      ))}
                      <select
                        onChange={(e) => {
                          const part = COMMON_PARTS.find(p => p.name === e.target.value);
                          if (part) {
                            setNewPart({
                              ...newPart,
                              partName: part.name,
                              lifespanKm: part.km,
                              lifespanMonths: part.months
                            });
                          }
                        }}
                        className="px-2 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg text-[8px] font-bold text-stone-600 dark:text-zinc-400 outline-none cursor-pointer"
                      >
                        <option value="">Diğerleri...</option>
                        {COMMON_PARTS.slice(6).map(part => (
                          <option key={part.name} value={part.name}>{part.name}</option>
                        ))}
                      </select>
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
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-[10px] font-bold outline-none dark:text-white"
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

            <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {partStatuses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
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
                          onClick={() => handlePartMaintenanceDone(part)}
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

                    <div className="space-y-2">
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly KM Input */}
        <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" /> Aylık KM Girişi
          </h3>
          <div className="space-y-3 mb-6">
            <input
              type="month"
              value={newLog.month}
              onChange={e => setNewLog({ ...newLog, month: e.target.value })}
              disabled={!!editingLogId}
              className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-black focus:outline-none dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ay Sonu KM"
              value={newLog.km}
              onChange={e => {
                // Sadece sayı, nokta ve virgül girişine izin ver, anlık olarak state'e yaz
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                setNewLog({ ...newLog, km: val });
              }}
              className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs font-black focus:outline-none dark:text-white"
            />
            <button
              onClick={() => {
                // Hesaplamaya göndermeden önce virgülü noktaya çevirip sayıya dönüştür
                const cleanKm = typeof newLog.km === 'string'
                  ? parseFloat(newLog.km.replace(',', '.'))
                  : newLog.km;

                if (!isNaN(cleanKm as number)) {
                  handleAddLog();
                }
              }}
              className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
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
                Duzenlemeyi Iptal Et
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {logs.map(log => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-stone-50 dark:bg-zinc-800/20 rounded-xl border border-stone-100 dark:border-zinc-800">
                <span className="text-[9px] font-black text-stone-400 uppercase">{format(parseISO(`${log.month}-01`), 'MMM yyyy', { locale: dateLocale })}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-stone-900 dark:text-white">{Number(log.km).toLocaleString('tr-TR')} KM</span>
                  <button
                    onClick={() => {
                      setEditingLogId(log.id || null);
                      // Duzenleme modunda virgullu gosterim icin noktayi virgul yap
                      setNewLog({ month: log.month, km: log.km.toString().replace('.', ',') });
                    }}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
                    title="Duzenle"
                  >
                    <FaEdit size={10} />
                  </button>
                  <button onClick={() => log.id && deleteLog(log.id)} className="text-stone-400 hover:text-rose-500 transition-colors"><FaTrash size={10} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consumption Analysis Table */}
        <div className="lg:col-span-2 bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 overflow-hidden flex flex-col">
          <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <FaGasPump className="text-stone-400 dark:text-zinc-500" /> Yakıt Tüketim Analizi
          </h3>
          <div className="overflow-x-auto flex-1">
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
    </motion.div>
  );
}
