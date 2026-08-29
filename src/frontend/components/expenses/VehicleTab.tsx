import { useState, useEffect, useMemo, useRef } from 'react';
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
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../backend/config/firebaseConfig';

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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | number>('');
  const [formData, setFormData] = useState<Partial<VehicleData>>({
    purchaseDate: '2024-01-01',
    purchaseKm: 10000,
    currentKm: 15000,
    nextMaintenanceKm: 25000,
    insuranceDate: '',
    inspectionDate: '',
    mtvYear: new Date().getFullYear(),
    mtvPaid1: false,
    mtvPaid2: false,
    fuelCategory: 'Yakıt',
    licensePlate: '34 DEMO 01',
    brand: 'Premium Car',
    model: 'GT',
    year: 2024,
    engine: '2.0 Turbo',
    transmission: 'Otomatik',
    fuelType: 'Benzin',
    tireSummerBrand: 'Pirelli',
    tireSummerYear: 2024,
    tireSummerPurchaseDate: '2024-03-01',
    tireWinterBrand: 'Michelin',
    tireWinterYear: 2024,
    tireLastChangeDate: '2025-11-01',
    tireLastChangeKm: 14000,
    tireHistory: [
      { type: 'purchase', date: '2024-03-01', km: 10000, brand: 'Pirelli (Yazlık)' }
    ],
    tramerAmount: 0,
    damageHistory: 'Tamamen orijinal, hatasız.',
    imageUrl1: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    imageUrl2: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
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

  // Image upload states for profile photos
  const [imageFiles, setImageFiles] = useState<Record<'image1' | 'image2', File | null>>({ image1: null, image2: null });
  const [imagePreviews, setImagePreviews] = useState<Record<'image1' | 'image2', string | null>>({ image1: null, image2: null });
  const [uploadProgress, setUploadProgress] = useState<Record<'image1' | 'image2', number>>({ image1: 0, image2: 0 });
  const [isUploading, setIsUploading] = useState<Record<'image1' | 'image2', boolean>>({ image1: false, image2: false });
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);

  const uploadImageFile = async (file: File, slot: 'image1' | 'image2') => {
    if (!user) {
      toast.error('Oturum bulunamadı, tekrar giriş yapın');
      return null;
    }

    try {
      setIsUploading(prev => ({ ...prev, [slot]: true }));
      toast.loading('Görsel yükleniyor...');
      const fileName = `${slot}_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const path = `users/${user.uid}/vehicles/${vehicle?.id || 'default'}/${fileName}`;
      const ref = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(ref, file);

      return await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', snapshot => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(prev => ({ ...prev, [slot]: pct }));
        }, err => {
          setIsUploading(prev => ({ ...prev, [slot]: false }));
          console.error('Upload failed', err);
          toast.dismiss();
          toast.error('Yükleme başarısız');
          reject(err);
        }, async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setIsUploading(prev => ({ ...prev, [slot]: false }));
          setUploadProgress(prev => ({ ...prev, [slot]: 100 }));
          toast.dismiss();
          toast.success('Yükleme tamamlandı');
          resolve(url);
        });
      });
    } catch (err: any) {
      setIsUploading(prev => ({ ...prev, [slot]: false }));
      console.error('Upload exception', err);
      toast.dismiss();
      toast.error(err?.message || 'Yükleme başarısız');
      return null;
    }
  };

  const handleFileChange = (e: any, slot: 'image1' | 'image2') => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setImageFiles(prev => ({ ...prev, [slot]: f }));
      setImagePreviews(prev => ({ ...prev, [slot]: URL.createObjectURL(f) }));
      toast.success('Fotoğraf seçildi — kaydetmek için butona basın');
      console.log(`Selected file for ${slot}:`, f.name, f.size);
    }
  };

  const handleUploadAndSave = async (slot: 'image1' | 'image2') => {
    const file = imageFiles[slot];
    if (!file) {
      toast.error('Lütfen önce bir dosya seçin');
      return;
    }

    const url = await uploadImageFile(file, slot);
    if (url) {
      const key = slot === 'image1' ? 'imageUrl1' : 'imageUrl2';
      try {
        toast.loading('Bilgiler kaydediliyor...');
        await saveVehicle({ ...formData, [key]: url });
        setFormData(prev => ({ ...prev, [key]: url }));
        setImageFiles(prev => ({ ...prev, [slot]: null }));
        setImagePreviews(prev => ({ ...prev, [slot]: null }));
        toast.dismiss();
        toast.success('Fotoğraf başarıyla kaydedildi');
      } catch (err: any) {
        toast.dismiss();
        console.error('Save vehicle failed', err);
        toast.error(err?.message || 'Fotoğraf kaydedilemedi');
      }
    }
  };

  // Free option: convert image to a compressed base64 data URL and save in Firestore as text
  const convertImageToDataUrl = (file: File, initialMaxWidth = 800, initialQuality = 0.55, maxBytes = 200 * 1024): Promise<string> => {
    // Converts and compresses an image to a base64 data URL. It will try progressively
    // smaller sizes/qualities until the resulting string is under `maxBytes`.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          try {
            const tryConvert = (width: number, quality: number): string => {
              const ratio = img.width / img.height || 1;
              const w = Math.min(width, img.width);
              const h = Math.round(w / ratio);
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error('Canvas context not available');
              ctx.drawImage(img, 0, 0, w, h);
              return canvas.toDataURL('image/jpeg', quality);
            };

            const approxBytes = (dataUrl: string) => {
              const comma = dataUrl.indexOf(',');
              const b64 = dataUrl.substring(comma + 1);
              // approximate byte size from base64 length
              return Math.ceil((b64.length * 3) / 4);
            };

            // Settings to try: reduce width and quality progressively
            const widths = [initialMaxWidth, Math.floor(initialMaxWidth * 0.75), Math.floor(initialMaxWidth * 0.5), 400, 300];
            const qualities = [initialQuality, 0.5, 0.45, 0.4, 0.35, 0.3];

            for (const w of widths) {
              for (const q of qualities) {
                const dataUrl = tryConvert(w, q);
                const size = approxBytes(dataUrl);
                if (size <= maxBytes) return resolve(dataUrl);
              }
            }

            // Last attempt: very small thumbnail
            try {
              const tiny = tryConvert(240, 0.25);
              if (approxBytes(tiny) <= maxBytes) return resolve(tiny);
            } catch (e) {
              // ignore
            }

            return reject(new Error('Görsel çok büyük; lütfen daha küçük bir fotoğraf seçin veya çözünürlüğünü düşürün'));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err);
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveAsDataUrl = async (slot: 'image1' | 'image2') => {
    const file = imageFiles[slot];
    if (!file) {
      toast.error('Lütfen önce bir dosya seçin');
      return;
    }

    try {
      toast.loading('Görsel işleniyor...');
      const dataUrl = await convertImageToDataUrl(file, 800, 0.55, 150 * 1024);
      const key = slot === 'image1' ? 'imageUrl1' : 'imageUrl2';
      toast.loading('Bilgiler kaydediliyor...');
      await saveVehicle({ ...formData, [key]: dataUrl });
      setFormData(prev => ({ ...prev, [key]: dataUrl }));
      setImageFiles(prev => ({ ...prev, [slot]: null }));
      setImagePreviews(prev => ({ ...prev, [slot]: null }));
      toast.dismiss();
      toast.success('Görsel metin olarak kaydedildi');
    } catch (err: any) {
      toast.dismiss();
      console.error('Save as dataUrl failed', err);
      toast.error(err?.message || 'Veri URL olarak kaydedilemedi');
    }
  };

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

  const startFieldEdit = (key: string, value: any) => {
    setEditingField(key);
    setEditingValue(value ?? '');
    // ensure the view scrolls a bit if needed (optional)
  };

  const cancelFieldEdit = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const saveFieldEdit = async (key: string) => {
    if (!user) {
      toast.error('Oturum bulunamadı, tekrar giriş yapın');
      return;
    }
    let valueToSave: any = editingValue;
    // coerce to number when original is numeric
    const orig = (formData as any)[key];
    if (typeof orig === 'number') {
      valueToSave = Number(editingValue) || 0;
    }

    try {
      await saveVehicle({ ...formData, [key]: valueToSave });
      setFormData(prev => ({ ...prev, [key]: valueToSave }));
      setEditingField(null);
      setEditingValue('');
      toast.success('Kaydedildi');
    } catch (err: any) {
      toast.error(err?.message || 'Kaydetme başarısız');
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

  const fuelSummary = useMemo(() => {
    if (!fuelAnalysis.length) return { totalFuel: 0, totalKm: 0, avgCostPerKm: 0 };
    const totalFuel = fuelAnalysis.reduce((sum, item) => sum + item.fuelTotal, 0);
    const totalKm = fuelAnalysis.reduce((sum, item) => sum + item.drivenKm, 0);
    const avgCostPerKm = totalKm > 0 ? totalFuel / totalKm : 0;
    return { totalFuel, totalKm, avgCostPerKm };
  }, [fuelAnalysis]);

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
      {(() => {
        const isDemoUser = user?.email === 'demo@emulist.com';
        const isEmuPersonalCar = !isDemoUser && (vehicle?.licensePlate === '38ANY590' || vehicle?.licensePlate === '38 ANY 590');
        
        let displayImg1 = isEmuPersonalCar ? img1 : (formData.imageUrl1 || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80');
        let displayImg2 = isEmuPersonalCar ? img2 : (formData.imageUrl2 || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80');

        // Prevent leaking personal images if stored URL matches personal assets
        if (!isEmuPersonalCar) {
          if (displayImg1 === img1 || displayImg1?.includes('IMG_1143')) {
            displayImg1 = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';
          }
          if (displayImg2 === img2 || displayImg2?.includes('IMG_1150')) {
            displayImg2 = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80';
          }
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative h-64 md:h-72 rounded-[2rem] overflow-hidden shadow-lg border border-stone-200/50 dark:border-zinc-800/50 group">
              <img src={displayImg1} alt="Vehicle 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <h2 className="text-white text-xl font-black drop-shadow-md tracking-tight uppercase">{t('expenses.vehicle.title')}</h2>
              </div>
              {isEditing && (
                <>
                  <div className="absolute left-4 bottom-4 flex items-center gap-2">
                    <button onClick={() => fileInputRef1.current?.click()} className="py-2 px-3 bg-white/90 text-stone-900 rounded-lg text-[12px] font-black">Fotoğraf Seç</button>
                  </div>
                  {/* Action panel when a file is selected for image1 */}
                  {(imagePreviews.image1 || imageFiles.image1) && (
                    <div className="absolute right-4 bottom-4 bg-white/95 dark:bg-zinc-900/90 rounded-xl p-2 flex items-center gap-2">
                      <button onClick={() => handleUploadAndSave('image1')} disabled={isUploading.image1} className="py-1 px-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-[12px] font-black">
                        {isUploading.image1 ? `Yükleniyor ${uploadProgress.image1 || 0}%` : 'Yükle'}
                      </button>
                      <button onClick={() => handleSaveAsDataUrl('image1')} disabled={isUploading.image1} className="py-1 px-2 bg-amber-500 text-white rounded-lg text-[12px] font-black">Kaydet (Base64)</button>
                      <button onClick={() => { setImageFiles(prev => ({ ...prev, image1: null })); setImagePreviews(prev => ({ ...prev, image1: null })); toast('Seçim iptal edildi'); }} className="py-1 px-2 bg-stone-200 dark:bg-zinc-700 rounded-lg text-[12px] font-black">İptal</button>
                    </div>
                  )}
                </>
              )}
              <input ref={fileInputRef1} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'image1')} />
            </div>

            <div className="relative h-64 md:h-72 rounded-[2rem] overflow-hidden shadow-lg border border-stone-200/50 dark:border-zinc-800/50 group hidden md:block">
              <img src={displayImg2} alt="Vehicle 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {isEditing && (
                <>
                  <div className="absolute left-4 bottom-4 flex items-center gap-2">
                    <button onClick={() => fileInputRef2.current?.click()} className="py-2 px-3 bg-white/90 text-stone-900 rounded-lg text-[12px] font-black">Fotoğraf Seç</button>
                  </div>
                  {(imagePreviews.image2 || imageFiles.image2) && (
                    <div className="absolute right-4 bottom-4 bg-white/95 dark:bg-zinc-900/90 rounded-xl p-2 flex items-center gap-2">
                      <button onClick={() => handleUploadAndSave('image2')} disabled={isUploading.image2} className="py-1 px-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg text-[12px] font-black">
                        {isUploading.image2 ? `Yükleniyor ${uploadProgress.image2 || 0}%` : 'Yükle'}
                      </button>
                      <button onClick={() => handleSaveAsDataUrl('image2')} disabled={isUploading.image2} className="py-1 px-2 bg-amber-500 text-white rounded-lg text-[12px] font-black">Kaydet (Base64)</button>
                      <button onClick={() => { setImageFiles(prev => ({ ...prev, image2: null })); setImagePreviews(prev => ({ ...prev, image2: null })); toast('Seçim iptal edildi'); }} className="py-1 px-2 bg-stone-200 dark:bg-zinc-700 rounded-lg text-[12px] font-black">İptal</button>
                    </div>
                  )}
                </>
              )}
              <input ref={fileInputRef2} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'image2')} />
            </div>
          </div>
        );
      })()}

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
            onClick={() => {
              if (isEditing) handleSave();
              else {
                setIsEditing(true);
                toast('Düzenleme moduna geçildi');
              }
            }}
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
            {editingField === stat.key ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={String(editingValue)}
                  onChange={e => setEditingValue(e.target.value)}
                  className="text-lg font-black bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg p-1.5 outline-none w-full"
                />
                <button onClick={() => saveFieldEdit(stat.key!)} className="p-2 bg-emerald-600 text-white rounded-lg">Kaydet</button>
                <button onClick={cancelFieldEdit} className="p-2 bg-stone-200 dark:bg-zinc-700 rounded-lg">İptal</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h4 className={`text-xl font-black ${stat.color || 'text-stone-900 dark:text-white'}`}>
                  {(stat.value || 0).toLocaleString()} <span className="text-xs text-stone-400 font-bold ml-1">{stat.sub}</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => startFieldEdit(stat.key!, stat.value)} title="Düzenle" className="p-1 bg-stone-100 dark:bg-zinc-800 rounded-lg">
                    <FaEdit size={12} />
                  </button>
                </div>
              </div>
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
                  {editingField === 'licensePlate' ? (
                    <div className="flex gap-2">
                      <input value={String(editingValue)} onChange={e => setEditingValue(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-black text-stone-700 dark:text-white outline-none" />
                      <button onClick={() => saveFieldEdit('licensePlate')} className="py-2 px-3 bg-emerald-600 text-white rounded-xl">Kaydet</button>
                      <button onClick={cancelFieldEdit} className="py-2 px-3 bg-stone-200 dark:bg-zinc-700 rounded-xl">İptal</button>
                    </div>
                  ) : (
                    <div className="inline-flex bg-white dark:bg-zinc-900 border-2 border-stone-900 dark:border-white rounded-xl px-6 py-2.5 shadow-sm">
                      <span className="text-2xl font-black text-stone-900 dark:text-white tracking-[0.2em]">{formData.licensePlate || '---'}</span>
                      <button onClick={() => startFieldEdit('licensePlate', formData.licensePlate)} className="ml-3 p-1 bg-stone-100 dark:bg-zinc-800 rounded-lg">
                        <FaEdit size={12} />
                      </button>
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

              {/* Photo URLs for editing */}
              {isEditing && (
                <div className="pt-2 border-t border-stone-200/50 dark:border-zinc-800/50 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image 1 */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Ana Araç Fotoğrafı</label>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-16 bg-stone-100 dark:bg-zinc-800 rounded-lg overflow-hidden border">
                          <img src={imagePreviews.image1 || formData.imageUrl1 || img1} alt="Ana" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, 'image1')} className="text-xs" />
                          <div className="flex gap-2">
                            <button onClick={() => handleUploadAndSave('image1')} disabled={isUploading.image1} className="py-2 px-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-[10px] font-black">
                              {isUploading.image1 ? `Yükleniyor ${uploadProgress.image1 || 0}%` : 'Yükle ve Kaydet'}
                            </button>
                            <button onClick={() => handleSaveAsDataUrl('image1')} disabled={isUploading.image1} className="py-2 px-3 bg-amber-500 text-white rounded-xl text-[10px] font-black">
                              Kaydet (Base64)
                            </button>
                            <button onClick={() => setFormData(prev => ({ ...prev, imageUrl1: '' }))} className="py-2 px-3 bg-stone-200 dark:bg-zinc-700 text-stone-700 rounded-xl text-[10px] font-black">
                              Temizle
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image 2 */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">İkincil Araç Fotoğrafı</label>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-16 bg-stone-100 dark:bg-zinc-800 rounded-lg overflow-hidden border">
                          <img src={imagePreviews.image2 || formData.imageUrl2 || img2} alt="İkincil" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, 'image2')} className="text-xs" />
                          <div className="flex gap-2">
                            <button onClick={() => handleUploadAndSave('image2')} disabled={isUploading.image2} className="py-2 px-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-[10px] font-black">
                              {isUploading.image2 ? `Yükleniyor ${uploadProgress.image2 || 0}%` : 'Yükle ve Kaydet'}
                            </button>
                            <button onClick={() => handleSaveAsDataUrl('image2')} disabled={isUploading.image2} className="py-2 px-3 bg-amber-500 text-white rounded-xl text-[10px] font-black">
                              Kaydet (Base64)
                            </button>
                            <button onClick={() => setFormData(prev => ({ ...prev, imageUrl2: '' }))} className="py-2 px-3 bg-stone-200 dark:bg-zinc-700 text-stone-700 rounded-xl text-[10px] font-black">
                              Temizle
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Dates & Documents */}
        <div className="space-y-6 flex flex-col">
          {/* Important Dates */}
          <div className="bg-stone-50/50 dark:bg-zinc-800/30 rounded-[2rem] p-6 border border-stone-100 dark:border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <FaCalendarAlt size={120} />
            </div>
            <h3 className="text-[11px] font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest relative z-10">
              <FaCalendarAlt className="text-stone-400 dark:text-zinc-500" /> Önemli Tarihler & Belgeler
            </h3>
            <div className="space-y-3 relative z-10">
              {[
                { label: t('expenses.vehicle.insurance'), key: 'insuranceDate', icon: '🛡️', type: 'insurance' },
                { label: t('expenses.vehicle.inspection'), key: 'inspectionDate', icon: '📋', type: 'inspection' }
              ].map(item => {
                const value = (formData as any)[item.key];
                const daysLeft = (item.type === 'insurance' || item.type === 'inspection') && value && isValid(parseISO(value)) ? differenceInDays(parseISO(value), new Date()) : null;

                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-stone-50 dark:bg-zinc-800 rounded-xl text-lg">{item.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase">{item.label}</p>
                          {!isEditing && daysLeft !== null && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${daysLeft < 30 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
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
                            className="text-xs font-black bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg p-1.5 mt-1 outline-none dark:text-white"
                          />
                        ) : (
                          <p className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                            {value && isValid(parseISO(value)) ? format(parseISO(value), 'dd MMMM yyyy', { locale: dateLocale }) : '---'}
                          </p>
                        )}
                      </div>
                    </div>
                    {!(formData as any)[item.key] || isEditing ? null : (
                      <button
                        onClick={() => handleAddToCalendar(item.type as any, (formData as any)[item.key])}
                        className="p-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white rounded-xl transition-all"
                        title="Takvime Ekle"
                      >
                        <FaBell size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* MTV */}
              <div className="p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">💰</span>
                  <p className="text-[10px] font-black text-stone-500 dark:text-zinc-400 uppercase tracking-wider">MTV Ödemeleri</p>
                  {isEditing && (
                    <select value={formData.mtvYear || new Date().getFullYear()} onChange={e => setFormData({ ...formData, mtvYear: Number(e.target.value) })}
                      className="ml-auto text-xs font-black bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg p-1.5 outline-none dark:text-white">
                      {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                  {!isEditing && <span className="ml-auto text-xs font-black text-stone-700 dark:text-zinc-200">{formData.mtvYear}</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map(i => {
                    const paid = (formData as any)[`mtvPaid${i}`];
                    return isEditing ? (
                      <label key={i} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border transition-all ${paid ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : 'bg-stone-50 border-stone-200 dark:bg-zinc-800 dark:border-zinc-700'}`}>
                        <input type="checkbox" checked={paid || false} onChange={e => setFormData({ ...formData, [`mtvPaid${i}`]: e.target.checked })} className="accent-emerald-600 w-4 h-4" />
                        <span className="text-[10px] font-black text-stone-700 dark:text-zinc-200">Taksit {i}</span>
                      </label>
                    ) : (
                      <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl text-[10px] font-black uppercase ${paid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                        <span>Taksit {i}</span>
                        <span>{paid ? 'Ödendi ✓' : 'Bekliyor'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 5 — LASTİK DURUMU
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-3xl p-6 border border-stone-200/70 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.025] pointer-events-none"><GiCarWheel size={130} /></div>

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-100 dark:bg-zinc-800 rounded-xl"><GiCarWheel className="text-stone-500 dark:text-zinc-400" size={14} /></div>
            <div>
              <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">{t('expenses.vehicle.tireStatus')}</h3>
              <p className="text-[9px] font-bold text-stone-400 uppercase">Lastik Takip & Analizi</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase ${tireStats.activeSet === 'summer' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400' : 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-400'}`}>
            {tireStats.activeSet === 'summer' ? <><FaSun size={10} /> Yazlık Takılı</> : <><FaSnowflake size={10} /> Kışlık Takılı</>}
          </div>
        </div>

        {/* Usage Progress Bar */}
        <div className="mb-5 p-4 bg-stone-50 dark:bg-zinc-800/40 rounded-2xl border border-stone-100 dark:border-zinc-800 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Aktif Lastik Ömrü</p>
              <p className="text-2xl font-black text-stone-900 dark:text-white leading-none mt-0.5">
                {tireStats.usagePercent}% <span className="text-sm text-stone-400 font-bold">kullanıldı</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Kalan</p>
              <p className={`text-lg font-black ${tireStats.status === 'danger' ? 'text-rose-500' : tireStats.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                ~{tireStats.remainingKm.toLocaleString()} KM
              </p>
            </div>
          </div>
          <div className="h-3 w-full bg-stone-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tireStats.usagePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${tireStats.status === 'danger' ? 'bg-rose-500' : tireStats.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-stone-400">0 KM</span>
            <span className="text-[8px] text-stone-400">50.000 KM</span>
          </div>
        </div>

        {/* Tire Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {[
            { type: 'summer', label: t('expenses.vehicle.summerTire'), brand: formData.tireSummerBrand, date: formData.tireSummerPurchaseDate, year: formData.tireSummerYear, icon: <FaSun className="text-amber-400" size={16} />, iconBg: 'bg-amber-100 dark:bg-amber-950/30' },
            { type: 'winter', label: t('expenses.vehicle.winterTire'), brand: formData.tireWinterBrand, date: formData.tireWinterPurchaseDate, year: formData.tireWinterYear, icon: <FaSnowflake className="text-sky-400" size={16} />, iconBg: 'bg-sky-100 dark:bg-sky-950/30' },
          ].map(tire => {
            const isActive = tireStats.activeSet === tire.type;
            return (
              <div key={tire.type} className={`p-4 rounded-2xl border-2 transition-all ${isActive ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-zinc-800/50 shadow-md' : 'border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/20 opacity-70'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${tire.iconBg}`}>{tire.icon}</div>
                    <p className="text-[10px] font-black text-stone-600 dark:text-zinc-300 uppercase tracking-wider">{tire.label}</p>
                  </div>
                  {isActive && <span className="text-[8px] font-black bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-2 py-0.5 rounded-full uppercase">Aktif</span>}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <input placeholder="Marka / Model" value={tire.brand || ''} onChange={e => setFormData({ ...formData, [tire.type === 'summer' ? 'tireSummerBrand' : 'tireWinterBrand']: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-black dark:text-white outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Üretim Yılı" value={tire.year || ''} onChange={e => setFormData({ ...formData, [tire.type === 'summer' ? 'tireSummerYear' : 'tireWinterYear']: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-black dark:text-white outline-none" />
                      <input type="date" value={tire.date || ''} onChange={e => setFormData({ ...formData, [tire.type === 'summer' ? 'tireSummerPurchaseDate' : 'tireWinterPurchaseDate']: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-black dark:text-white outline-none" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-stone-900 dark:text-white uppercase">{tire.brand || '—'} <span className="text-stone-400 text-xs font-bold">{tire.year}</span></h4>
                    <p className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                      <FaCalendarAlt size={8} /> Alım: {tire.date && isValid(parseISO(tire.date)) ? format(parseISO(tire.date), 'MM/yyyy') : '—'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tire change button */}
        <div className="mt-4 relative z-10">
          <button
            onClick={async () => {
              const newSet = tireStats.activeSet === 'summer' ? 'winter' : 'summer';
              const currentKm = Number(formData.currentKm) || 0;
              const newEntry: any = { date: format(new Date(), 'yyyy-MM-dd'), km: currentKm, type: newSet, note: `${newSet === 'summer' ? 'Yazlık' : 'Kışlık'} lastiklere geçiş.` };
              const updatedData = { ...formData, tireLastChangeDate: newEntry.date, tireLastChangeKm: newEntry.km, tireHistory: [...(formData.tireHistory || []), newEntry] };
              setFormData(updatedData);
              try { await saveVehicle(updatedData); toast.success(`${newSet === 'summer' ? 'Yazlık' : 'Kışlık'} lastiklere geçiş kaydedildi`); }
              catch { toast.error('Kaydedilemedi'); }
            }}
            className="w-full py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 group"
          >
            <GiCarWheel className="group-hover:rotate-180 transition-transform duration-500" />
            Lastik Değişimi Kaydet ({(formData.currentKm || 0).toLocaleString()} KM)
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 6 — BAKIM TAKİBİ
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-3xl p-6 border border-stone-200/70 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-100 dark:bg-zinc-800 rounded-xl"><FaWrench className="text-stone-500 dark:text-zinc-400" size={14} /></div>
            <div>
              <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">{t('expenses.vehicle.smartMaintenance') || 'Akıllı Bakım Takibi'}</h3>
              <p className="text-[9px] font-bold text-stone-400 uppercase">
                {partStatuses.length} parça takipte
                {partStatuses.filter(p => p.status === 'critical').length > 0 && <span className="text-rose-500 ml-1">• {partStatuses.filter(p => p.status === 'critical').length} kritik</span>}
              </p>
            </div>
          </div>
          <button onClick={() => setShowAddPart(!showAddPart)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${showAddPart ? 'bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-200' : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md hover:scale-105'}`}>
            <FaPlus size={9} /> {showAddPart ? 'Kapat' : 'Parça Ekle'}
          </button>
        </div>

        {/* Add Part Form */}
        <AnimatePresence>
          {showAddPart && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-4 bg-stone-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-stone-300 dark:border-zinc-700 space-y-3 overflow-hidden">
              <div>
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-2">Hızlı Seçim</p>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                  {COMMON_PARTS.map(part => (
                    <button key={part.name} onClick={() => setNewPart({ ...newPart, partName: part.name, lifespanKm: part.km, lifespanMonths: part.months })}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border ${newPart.partName === part.name ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent' : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:border-stone-500'}`}>
                      {part.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <input type="text" placeholder="Parça Adı" value={newPart.partName} onChange={e => setNewPart({ ...newPart, partName: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white" />
                </div>
                {[
                  { label: 'Değişim KM', field: 'replacedKm', type: 'number' },
                  { label: 'Değişim Tarihi', field: 'replacedDate', type: 'date' },
                  { label: 'Ömür (KM)', field: 'lifespanKm', type: 'number' },
                  { label: 'Ömür (Ay)', field: 'lifespanMonths', type: 'number' },
                ].map(f => (
                  <div key={f.field}>
                    <p className="text-[8px] font-black text-stone-400 uppercase mb-1">{f.label}</p>
                    <input type={f.type} value={(newPart as any)[f.field]} onChange={e => setNewPart({ ...newPart, [f.field]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold outline-none dark:text-white" />
                  </div>
                ))}
              </div>
              <button onClick={handleAddPart} className="w-full py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                Listeye Ekle
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Part List */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
          {partStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
              <FaTools size={32} className="mb-3 text-stone-300" />
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Henüz parça eklenmedi</p>
            </div>
          ) : (
            partStatuses.map(part => {
              const statusColor = part.status === 'safe' ? 'bg-emerald-500' : part.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500';
              const statusBg = part.status === 'safe' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900' : part.status === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900';
              return (
                <div key={part.id} className={`p-4 rounded-2xl border group transition-all hover:shadow-sm ${statusBg}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${statusColor}`} />
                      <div>
                        <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">{part.partName}</h4>
                        <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">Son: {(part.replacedKm || 0).toLocaleString()} KM • {format(parseISO(part.replacedDate), 'dd.MM.yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setConfirmingMaintenance({ id: part.id!, partName: part.partName, replacedKm: vehicle?.currentKm || 0, replacedDate: format(new Date(), 'yyyy-MM-dd'), lifespanKm: part.lifespanKm, lifespanMonths: part.lifespanMonths })}
                        className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:scale-110 transition-transform" title="Bakım Yapıldı">
                        <FaCheckCircle size={12} />
                      </button>
                      <button onClick={() => part.id && deleteMaintenanceRecord(part.id)}
                        className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-wider">
                      <span className={part.status === 'critical' ? 'text-rose-500' : 'text-stone-400'}>{part.kmRemaining > 0 ? `${part.kmRemaining.toLocaleString()} KM kaldı` : 'KM doldu'}</span>
                      <span className={part.status === 'critical' ? 'text-rose-500' : 'text-stone-400'}>{part.daysRemaining > 0 ? `${part.daysRemaining} gün kaldı` : 'Süre doldu'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200/60 dark:bg-zinc-700/60 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${part.overallProgress}%` }}
                        className={`h-full rounded-full ${statusColor}`} />
                    </div>
                  </div>

                  {part.history && part.history.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-stone-200/50 dark:border-zinc-700/30">
                      <button onClick={() => toggleHistory(part.id!)} className="flex items-center gap-1.5 text-[8px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-700 dark:hover:text-white transition-colors">
                        <FaHistory size={8} />
                        <span>Geçmiş ({part.history.length})</span>
                        <motion.span animate={{ rotate: expandedHistories.has(part.id!) ? 180 : 0 }} className="ml-1">↓</motion.span>
                      </button>
                      <AnimatePresence>
                        {expandedHistories.has(part.id!) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-1">
                            {part.history.map((h: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-[8px] font-bold text-stone-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-stone-100/60 dark:border-zinc-800/40">
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
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 7 — AYLIK KM GİRİŞİ + YAKIT ANALİZİ
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* KM Entry Panel */}
        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl p-6 border border-stone-200/70 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-stone-100 dark:bg-zinc-800 rounded-xl"><FaCalendarAlt className="text-stone-500 dark:text-zinc-400" size={14} /></div>
              <div>
                <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">Aylık KM Girişi</h3>
                <p className="text-[9px] font-bold text-stone-400 uppercase">Sayaç Takip</p>
              </div>
            </div>
            <span className="text-[9px] font-black px-2.5 py-1 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 rounded-xl border border-stone-200/60 dark:border-zinc-700">
              {(vehicle?.currentKm || 0).toLocaleString()} KM
            </span>
          </div>

          <AnimatePresence>
            {editingLogId && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase">
                    {newLog.month ? format(parseISO(`${newLog.month}-01`), 'MMMM yyyy', { locale: dateLocale }) : 'Kayıt'} Düzenleniyor
                  </p>
                </div>
                <button onClick={() => { setEditingLogId(null); setNewLog({ month: format(new Date(), 'yyyy-MM'), km: '' }); }} className="text-[9px] font-black text-amber-700 dark:text-amber-400 hover:underline uppercase">Vazgeç</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3 bg-stone-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-stone-200/60 dark:border-zinc-800">
            <div>
              <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">Dönem (Ay)</label>
              <input type="month" value={newLog.month} onChange={e => setNewLog({ ...newLog, month: e.target.value })} disabled={!!editingLogId}
                className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-stone-900/20 dark:focus:ring-white/20 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all" />
            </div>
            <div>
              <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">Ay Sonu KM Değeri</label>
              <div className="relative">
                <input type="text" inputMode="decimal" placeholder="Örn: 15.500" value={newLog.km}
                  onChange={e => setNewLog({ ...newLog, km: e.target.value.replace(/[^0-9.,]/g, '') })}
                  className="w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl pl-3 pr-12 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-stone-900/20 dark:focus:ring-white/20 dark:text-white transition-all placeholder:text-stone-400" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-stone-400 pointer-events-none">KM</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {editingLogId && (
                <button onClick={() => { setEditingLogId(null); setNewLog({ month: format(new Date(), 'yyyy-MM'), km: '' }); }}
                  className="flex-1 py-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all">İptal</button>
              )}
              <button onClick={() => {
                const clean = parseFloat((newLog.km || '').replace(',', '.'));
                if (!isNaN(clean) && clean > 0) handleAddLog(); else toast.error('Geçerli bir KM değeri girin');
              }} className={`py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm ${editingLogId ? 'flex-[2]' : 'w-full'}`}>
                <FaPlus size={9} /> {editingLogId ? 'Güncelle' : 'KM Kaydı Ekle'}
              </button>
            </div>
          </div>

          {/* Log list */}
          <div className="mt-4 flex-1">
            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-2">Kayıt Geçmişi ({logs.length})</p>
            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="p-4 bg-stone-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800 text-center">
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Henüz kayıt yok</p>
                </div>
              ) : (
                logs.map(log => {
                  const isSelected = editingLogId === log.id;
                  return (
                    <div key={log.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${isSelected ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' : 'bg-stone-50 dark:bg-zinc-800/30 border-stone-200/60 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'}`}>
                      <div>
                        <span className="text-[10px] font-black text-stone-800 dark:text-zinc-200 uppercase">{format(parseISO(`${log.month}-01`), 'MMMM yyyy', { locale: dateLocale })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-stone-900 dark:text-white px-2 py-0.5 bg-stone-100 dark:bg-zinc-700 rounded-lg">{Number(log.km).toLocaleString('tr-TR')} KM</span>
                        <button onClick={() => { setEditingLogId(log.id || null); setNewLog({ month: log.month, km: log.km.toString() }); }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-white bg-stone-100 dark:bg-zinc-800 rounded-lg transition-colors"><FaEdit size={10} /></button>
                        <button onClick={() => log.id && deleteLog(log.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 bg-stone-100 dark:bg-zinc-800 hover:bg-rose-50 rounded-lg transition-colors"><FaTrash size={10} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Fuel Analysis Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 rounded-3xl p-6 border border-stone-200/70 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl"><FaGasPump className="text-emerald-600 dark:text-emerald-400" size={14} /></div>
              <div>
                <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">Yakıt & Tüketim Analizi</h3>
                <p className="text-[9px] font-bold text-stone-400 uppercase">Aylık harcama & KM maliyeti</p>
              </div>
            </div>
            {vehicle?.fuelCategory && (
              <span className="self-start sm:self-auto text-[9px] font-black px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5">
                ⛽ {vehicle.fuelCategory}
              </span>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Toplam Yakıt', value: `${fuelSummary.totalFuel.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`, color: 'text-stone-900 dark:text-white' },
              { label: 'Toplam Yol', value: `${fuelSummary.totalKm.toLocaleString('tr-TR')} KM`, color: 'text-stone-900 dark:text-white' },
              { label: 'Ort. KM Maliyeti', value: `${fuelSummary.avgCostPerKm.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`, color: 'text-emerald-600 dark:text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="p-3 bg-stone-50 dark:bg-zinc-800/40 rounded-2xl border border-stone-100 dark:border-zinc-800">
                <p className="text-[7px] font-black text-stone-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-sm font-black ${s.color} leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3 overflow-y-auto max-h-[320px] pr-1 custom-scrollbar flex-1">
            {fuelAnalysis.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800">
                <p className="text-[9px] font-bold text-stone-400 uppercase">Analiz için yeterli veri yok</p>
              </div>
            ) : fuelAnalysis.map((item, idx) => {
              const isHigh = item.costPerKm > 6;
              const isMed = item.costPerKm > 4 && item.costPerKm <= 6;
              return (
                <div key={idx} className="p-4 bg-stone-50 dark:bg-zinc-800/30 rounded-2xl border border-stone-100 dark:border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-stone-900 dark:text-white uppercase">{format(parseISO(`${item.month}-01`), 'MMMM yyyy', { locale: dateLocale })}</span>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl ${isHigh ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : isMed ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                      {item.costPerKm.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺ / KM
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-white/60 dark:bg-zinc-900/40 p-2 rounded-xl text-center">
                    <div><p className="text-[7px] font-black text-stone-400 uppercase">Katedilen</p><p className="text-xs font-black dark:text-white">{item.drivenKm.toLocaleString('tr-TR')} KM</p></div>
                    <div><p className="text-[7px] font-black text-stone-400 uppercase">Yakıt</p><p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{item.fuelTotal.toLocaleString('tr-TR')} TL</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[8px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest border-b border-stone-100 dark:border-zinc-800">
                  <th className="pb-3 pl-3">Dönem</th>
                  <th className="pb-3 text-right">Katedilen</th>
                  <th className="pb-3 text-right">Yakıt</th>
                  <th className="pb-3 text-right">KM Maliyeti</th>
                  <th className="pb-3 text-right pr-3">Verimlilik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-zinc-800/50">
                {fuelAnalysis.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-[9px] text-stone-400 font-bold uppercase">Analiz için yeterli veri bulunmuyor</td></tr>
                ) : fuelAnalysis.map((item, idx) => {
                  const isHigh = item.costPerKm > 6;
                  const isMed = item.costPerKm > 4 && item.costPerKm <= 6;
                  return (
                    <tr key={idx} className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 pl-3 text-xs font-black text-stone-900 dark:text-white uppercase">{format(parseISO(`${item.month}-01`), 'MMMM yyyy', { locale: dateLocale })}</td>
                      <td className="py-3 text-right text-xs font-bold text-stone-600 dark:text-zinc-300">{item.drivenKm.toLocaleString('tr-TR')} KM</td>
                      <td className="py-3 text-right text-xs font-black text-stone-900 dark:text-white">{item.fuelTotal.toLocaleString('tr-TR')} TL</td>
                      <td className="py-3 text-right text-xs font-black text-emerald-600 dark:text-emerald-400">{item.costPerKm.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                      <td className="py-3 text-right pr-3">
                        <span className={`text-[8px] font-black px-2.5 py-0.5 rounded-lg uppercase ${isHigh ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : isMed ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                          {isHigh ? 'Yüksek' : isMed ? 'Normal' : 'Ekonomik'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Maintenance Confirmation Modal */}
      <AnimatePresence>
        {confirmingMaintenance && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 dark:border-zinc-800">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4"><FaCheckCircle size={32} /></div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase">Bakım Tamamlandı mı?</h3>
                <p className="text-xs font-bold text-stone-400 mt-1">{confirmingMaintenance.partName}</p>
              </div>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[9px] font-black text-stone-400 uppercase ml-2 mb-1 block tracking-widest">Değişim Kilometresi</label>
                  <input type="number" value={confirmingMaintenance.replacedKm} onChange={e => setConfirmingMaintenance({ ...confirmingMaintenance, replacedKm: Number(e.target.value) })}
                    className="w-full bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none dark:text-white" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-stone-400 uppercase ml-2 mb-1 block tracking-widest">Değişim Tarihi</label>
                  <input type="date" value={confirmingMaintenance.replacedDate} onChange={e => setConfirmingMaintenance({ ...confirmingMaintenance, replacedDate: e.target.value })}
                    className="w-full bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmingMaintenance(null)} className="flex-1 py-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all">İptal</button>
                <button onClick={handlePartMaintenanceDone} className="flex-1 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Kaydet</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-8 pt-6 pb-4 border-t border-stone-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-stone-900 shadow">
              <FaCar size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-900 dark:text-white uppercase tracking-widest leading-none">emuList</p>
              <p className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter mt-0.5">Smart Vehicle Management</p>
            </div>
          </div>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">© {new Date().getFullYear()} • Güvenli Sürüşler</p>
          <div className="text-right">
            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Son Güncelleme</p>
            <p className="text-[10px] font-bold text-stone-600 dark:text-zinc-400 mt-1">
              {vehicle?.updatedAt ? format(new Date(vehicle.updatedAt), 'dd.MM.yyyy HH:mm') : format(new Date(), 'dd.MM.yyyy HH:mm')}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center opacity-20 hover:opacity-40 transition-opacity">
          <p className="text-[7px] font-black text-stone-400 uppercase tracking-[0.3em]">Antigravity Engineering • Vehicle Core v2.0</p>
        </div>
      </footer>
    </motion.div>
  );
}
