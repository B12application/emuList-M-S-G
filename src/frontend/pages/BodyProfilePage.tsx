// src/frontend/pages/BodyProfilePage.tsx
// Beden Profili & Kalori Açığı — Orijinal 2 Sekmeli (Profile & Deficit) Düzeltilmiş Tasarım
// 15 Bölge İnteraktif SVG + Kişisel Bilgiler + Bölgesel Ölçümler + Kalori Açığı Motoru

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaFire, FaMale, FaFemale, FaRuler, FaWeight,
  FaBullseye, FaRunning, FaSave, FaHeartbeat, FaChartLine,
  FaPercent, FaBalanceScale, FaTape, FaUtensils, FaInfoCircle,
  FaCopy, FaCheck, FaPlus, FaMinus, FaBookOpen, FaTimes,
  FaDumbbell, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaMedal,
  FaPlay, FaEye
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import ExercisePreviewModal from '../components/body/ExercisePreviewModal';
import ExerciseCatalogModal from '../components/body/ExerciseCatalogModal';
import AccessRequestModal from '../components/access/AccessRequestModal';
import {
  getExerciseMedia,
  extractExercisesFromText,
  type ExerciseMedia,
} from '../data/exerciseMediaData';
import PageHeaderBanner from '../components/ui/PageHeaderBanner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { getChatSessions, getDateKey } from '../services/calorieChatService';
import type {
  Gender, ActivityLevel, BodyMeasurements, ValidMeasurementKey,
} from '../services/bodyProfileService';
import {
  ACTIVITY_LABELS, MEASUREMENT_LIST, MEASUREMENT_LABELS, getMeasurementLabels,
  calculateBMR, calculateTDEE, calculateBMI, getBMICategory,
  calculateBodyFat, getBodyFatCategory,
  calculateCalorieDeficit, getIdealWeightRange,
  saveBodyProfile, getBodyProfile,
  emptyMeasurements,
} from '../services/bodyProfileService';
import type {
  RegionalGuide,
  RegionalDiagnosis,
} from '../data/bodyScienceData';
import {
  REGIONAL_GUIDES,
  analyzeBodyProportions,
  diagnoseRegionalComposition,
} from '../data/bodyScienceData';

// Lazy-load 3D Three.js body model to ensure zero main-thread contention and clean lifecycle initialization
const RotatableBody3D = lazy(() =>
  import('../components/RotatableBody3D').then(m => ({ default: m.RotatableBody3D }))
);

// ── Tab definitions (Orijinal 2 Sekmeli Yapı) ───────────
type ActiveTab = 'profile' | 'deficit';

// ── Number Input Component ─────────────────────────────
function NumberInput({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 999,
  step = 1,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-stone-50 dark:bg-zinc-800/60 p-2.5 rounded-2xl border border-stone-200/70 dark:border-zinc-700/60 transition-all focus-within:border-amber-400">
      <label className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between gap-1 mb-1">
        <span className="truncate flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-semibold">{unit}</span>
      </label>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        placeholder="0"
        className="w-full bg-transparent font-black text-sm text-stone-900 dark:text-white focus:outline-none"
      />
    </div>
  );
}

// ── Stat Card Component ────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  sublabel,
  color = 'text-amber-500',
  icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  unit: string;
  sublabel?: string;
  color?: string;
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className={`text-sm ${color}`}>{icon}</span>}
      </div>
      <div className="text-2xl font-black text-stone-900 dark:text-white">
        {value} <span className="text-xs font-normal text-stone-400 dark:text-zinc-500">{unit}</span>
      </div>
      {sublabel && (
        <div className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 mt-1 truncate">
          {sublabel}
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page Component ────────────────────────────────
export default function BodyProfilePage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { hasAccess, loading: accessLoading } = useFeatureAccess();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ValidMeasurementKey | null>(null);
  const [measurementCategory, setMeasurementCategory] = useState<'all' | 'upper' | 'arms' | 'core' | 'legs'>('all');
  const [copied, setCopied] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Profile state
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState(25);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(75);
  const [targetWeightKg, setTargetWeightKg] = useState(70);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [measurements, setMeasurements] = useState<BodyMeasurements>(emptyMeasurements());

  // Today's calorie data from existing sessions
  const [todayCalories, setTodayCalories] = useState(0);

  const DEMO_OVERWEIGHT_PROFILE = useMemo(() => ({
    gender: 'male' as Gender,
    age: 38,
    heightCm: 176,
    weightKg: 104,
    targetWeightKg: 78,
    activityLevel: 'sedentary' as ActivityLevel,
    measurements: {
      neckCm: 43,
      shoulderCm: 116,
      chestCm: 112,
      upperArmLeftCm: 35,
      upperArmRightCm: 35.5,
      forearmLeftCm: 29,
      forearmRightCm: 29,
      upperAbdomenCm: 104,
      waistCm: 108,
      lowerAbdomenCm: 112,
      hipCm: 114,
      thighLeftCm: 64,
      thighRightCm: 64.5,
      calfLeftCm: 42,
      calfRightCm: 42,
    }
  }), []);

  // Load profile from Firebase (or load demo overweight individual for non-AI users)
  useEffect(() => {
    if (!user) return;
    if (!hasAccess('calorieAi')) {
      // Demo overweight sedentary individual
      setGender(DEMO_OVERWEIGHT_PROFILE.gender);
      setAge(DEMO_OVERWEIGHT_PROFILE.age);
      setHeightCm(DEMO_OVERWEIGHT_PROFILE.heightCm);
      setWeightKg(DEMO_OVERWEIGHT_PROFILE.weightKg);
      setTargetWeightKg(DEMO_OVERWEIGHT_PROFILE.targetWeightKg);
      setActivityLevel(DEMO_OVERWEIGHT_PROFILE.activityLevel);
      setMeasurements(DEMO_OVERWEIGHT_PROFILE.measurements);
      setLoading(false);
      return;
    }

    setLoading(true);
    getBodyProfile(user.uid)
      .then(profile => {
        if (profile) {
          setGender(profile.gender);
          setAge(profile.age);
          setHeightCm(profile.heightCm);
          setWeightKg(profile.weightKg);
          setTargetWeightKg(profile.targetWeightKg);
          setActivityLevel(profile.activityLevel);
          setMeasurements(profile.measurements || emptyMeasurements());
        } else {
          // Reset to clean default when user has access
          setGender('male');
          setAge(25);
          setHeightCm(175);
          setWeightKg(75);
          setTargetWeightKg(70);
          setActivityLevel('moderate');
          setMeasurements(emptyMeasurements());
        }
      })
      .catch(err => {
        console.warn('Profile load notice:', err);
      })
      .finally(() => setLoading(false));
  }, [user, hasAccess, DEMO_OVERWEIGHT_PROFILE]);

  // Load today's calorie intake from calorie sessions
  useEffect(() => {
    if (!user) return;
    getChatSessions(user.uid, 500)
      .then(sessions => {
        const todayKey = getDateKey(new Date());
        let totalToday = 0;
        for (const session of sessions) {
          if (!session.messages) continue;
          for (const msg of session.messages) {
            if (msg.role === 'assistant' && msg.mealData) {
              const dateObj = msg.timestamp?.toDate
                ? msg.timestamp.toDate()
                : msg.timestamp instanceof Date
                  ? msg.timestamp
                  : new Date(session.createdAt?.toDate ? session.createdAt.toDate() : session.createdAt || Date.now());
              if (getDateKey(dateObj) === todayKey) {
                totalToday += msg.mealData.totalCalories || 0;
              }
            }
          }
        }
        setTodayCalories(totalToday);
      })
      .catch(console.error);
  }, [user]);

  // State for Sports Science modals
  const [guideModalKey, setGuideModalKey] = useState<ValidMeasurementKey | null>(null);
  const [showWeightInfoModal, setShowWeightInfoModal] = useState<boolean>(false);
  const [selectedExerciseForPreview, setSelectedExerciseForPreview] = useState<ExerciseMedia | null>(null);
  const [showExerciseCatalogModal, setShowExerciseCatalogModal] = useState<boolean>(false);

  // Helper to open preview from exercise name or media object
  const handleOpenExercisePreview = (exerciseNameOrObject: string | ExerciseMedia) => {
    if (typeof exerciseNameOrObject === 'string') {
      const media = getExerciseMedia(exerciseNameOrObject);
      if (media) {
        setSelectedExerciseForPreview(media);
      } else {
        setSelectedExerciseForPreview({
          id: exerciseNameOrObject.toLowerCase().replace(/\s+/g, '-'),
          name: exerciseNameOrObject,
          englishName: exerciseNameOrObject,
          category: 'delts',
          categoryLabel: 'Spor Hareketi',
          gifUrl: '',
          youtubeQuery: `${exerciseNameOrObject} egzersiz doğru form`,
          targetMuscles: ['İlgili Kas Grubu'],
          instructions: [
            'Hareketi kontrollü bir tempo ile (2 saniye indirme, 1 saniye kaldırma) gerçekleştirin.',
            'Omurganızı nötr tutun ve nefesinizi hareketin zorlandığınız aşamasında verin.'
          ],
          commonMistakes: ['Aşırı ağır kilo kullanarak formu bozmak', 'Momentum ile savurmak'],
          proTip: 'Direnci daima hedef kas grubunda hissedin.',
          defaultSetsReps: '3-4 set x 10-12 tekrar',
          keywords: [exerciseNameOrObject.toLowerCase()]
        });
      }
    } else {
      setSelectedExerciseForPreview(exerciseNameOrObject);
    }
  };

  // Calculated values
  const calculations = useMemo(() => {
    const bmr = calculateBMR(gender, weightKg, heightCm, age);
    const tdee = calculateTDEE(bmr, activityLevel);
    const bmi = calculateBMI(weightKg, heightCm);
    const bmiCategory = getBMICategory(bmi);
    const bodyFat = calculateBodyFat(gender, measurements.waistCm, measurements.neckCm, heightCm, measurements.hipCm);
    const bodyFatCategory = bodyFat !== null ? getBodyFatCategory(bodyFat, gender) : null;
    const deficit = calculateCalorieDeficit(tdee, targetWeightKg, weightKg);
    const idealWeight = getIdealWeightRange(heightCm, gender);

    return { bmr, tdee, bmi, bmiCategory, bodyFat, bodyFatCategory, deficit, idealWeight };
  }, [gender, weightKg, heightCm, age, activityLevel, measurements, targetWeightKg]);

  // Body proportions & personal sports science diagnostic
  const proportions = useMemo(() => {
    return analyzeBodyProportions(heightCm, weightKg, gender, measurements, language);
  }, [heightCm, weightKg, gender, measurements, language]);

  // 15 Bölge Detaylı Yağ vs Kas Teşhisi (Akademik Antropometri & Doktora Tezleri)
  const regionalDiagnoses = useMemo(() => {
    return diagnoseRegionalComposition(heightCm, weightKg, gender, measurements);
  }, [heightCm, weightKg, gender, measurements]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!hasAccess('calorieAi')) {
      toast.error('Demo modundasınız. Kişisel profilinizi kaydedebilmek için lütfen AI erişim izni talep edin.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await saveBodyProfile(user.uid, {
        gender,
        age,
        heightCm,
        weightKg,
        targetWeightKg,
        activityLevel,
        measurements,
      });
      toast.success(t('bodyProfile.profileSaved'));
    } catch (err: any) {
      console.error('Beden profili kaydedilemedi:', err);
      toast.error('Profil kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  }, [user, gender, age, heightCm, weightKg, targetWeightKg, activityLevel, measurements, t]);

  // Handle measurement value change
  const updateMeasurement = useCallback((key: ValidMeasurementKey, value: number) => {
    setMeasurements(prev => ({ ...prev, [key]: Math.max(0, value) }));
  }, []);

  // Quick increment/decrement helper
  const adjustMeasurement = useCallback((key: ValidMeasurementKey, delta: number) => {
    setMeasurements(prev => {
      const current = Number(prev[key]) || 0;
      const next = Math.max(0, Math.round((current + delta) * 10) / 10);
      return { ...prev, [key]: next };
    });
  }, []);

  // Copy Markdown tracking table
  const handleCopyTableTemplate = useCallback(() => {
    let md = `| Vücut Bölgesi | Kategori | Ölçüm (cm) | İpucu |\n| :--- | :--- | :---: | :--- |\n`;
    MEASUREMENT_LIST.forEach(item => {
      const val = measurements[item.key];
      const valStr = typeof val === 'number' && val > 0 ? `${val} cm` : '';
      md += `| ${item.emoji} ${item.label} | ${item.categoryLabel} | ${valStr} | ${item.tip} |\n`;
    });
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      toast.success('15 bölgeli takip şablonu panoya kopyalandı!');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      toast.error('Panoya kopyalanamadı.');
    });
  }, [measurements]);

  const measurementLabels = useMemo(() => getMeasurementLabels(language), [language]);

  if (accessLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMeta = selectedKey ? measurementLabels[selectedKey] : null;

  const getActivityLabel = (level: ActivityLevel) => {
    switch (level) {
      case 'sedentary':
        return t('bodyProfile.activitySedentary');
      case 'light':
        return t('bodyProfile.activityLight');
      case 'moderate':
        return t('bodyProfile.activityModerate');
      case 'active':
        return t('bodyProfile.activityVeryActive');
      case 'very_active':
        return t('bodyProfile.activityExtraActive');
      default:
        return ACTIVITY_LABELS[level] || level;
    }
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Header Banner */}
      <PageHeaderBanner
        title={t('bodyProfile.title')}
        subtitle={t('bodyProfile.subtitle')}
        icon={<FaHeartbeat className="text-rose-500 text-xl" />}
        backTo="/calorie-details"
        backLabel={t('calorieDetails.title') || 'Kalori Raporu'}
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-400 text-stone-950 font-black text-xs hover:bg-amber-300 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <FaSave className={`text-sm ${saving ? 'animate-spin' : ''}`} />
            {saving ? t('bodyProfile.saving') : t('bodyProfile.saveProfile')}
          </button>
        }
      />

      {/* ─── DEMO MODE BANNER FOR NON-AI USERS ─── */}
      {!hasAccess('calorieAi') && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-lg">
              👀
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 dark:text-amber-200">
                {t('bodyProfile.demoBannerTitle') || 'Demo Modu — Örnek Birey Profili (Hareketsiz / Kilolu)'}
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 max-w-2xl leading-relaxed">
                {t('bodyProfile.demoBannerDesc') || 'Bu profil hareketsiz ve yüksek kilo/yağ oranına sahip örnek bir bireye aittir. Kendi kişisel beden profilinizi oluşturmak ve AI özelliklerini açmak için erişim talebinde bulunabilirsiniz.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAccessModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer hover:scale-[1.02]"
          >
            ✉️ {t('bodyProfile.requestAccessBtn') || 'Erişim Talebi Gönder'}
          </button>
        </div>
      )}

      {/* 2 Ana Sekme ve Sağ Tarafta BMI / Vücut Göstergesi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-stone-200/50 dark:border-zinc-700/50 w-fit">
          {[
            { key: 'profile' as ActiveTab, label: t('bodyProfile.tabProfile'), icon: <FaMale className="text-xs" /> },
            { key: 'deficit' as ActiveTab, label: t('bodyProfile.tabDeficit'), icon: <FaBullseye className="text-xs" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* BMI & Beden Durumu (Sekmelerin Sağ Tarafına Hizalı) */}
        <div className="flex items-center flex-wrap gap-2.5 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FaBalanceScale className="text-xs" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
                BMI Endeksi
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-stone-900 dark:text-white">{calculations.bmi}</span>
                <span className={`text-[11px] font-black ${calculations.bmiCategory.color}`}>
                  {calculations.bmiCategory.emoji} {calculations.bmiCategory.label}
                </span>
              </div>
            </div>
          </div>

          {calculations.bodyFat !== null && (
            <>
              <div className="h-6 w-px bg-stone-200 dark:bg-zinc-800" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FaPercent className="text-[10px]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider leading-none mb-0.5">
                    Vücut Yağı
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-stone-900 dark:text-white">%{calculations.bodyFat}</span>
                    <span className={`text-[11px] font-bold ${calculations.bodyFatCategory?.color || 'text-stone-500'}`}>
                      {calculations.bodyFatCategory?.label}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {calculations.idealWeight && (
            <button
              type="button"
              onClick={() => setShowWeightInfoModal(true)}
              className="hidden md:flex items-center gap-1.5 pl-2 text-[11px] text-stone-500 dark:text-zinc-400 border-l border-stone-200 dark:border-zinc-800 hover:text-amber-500 transition-colors cursor-pointer group"
              title="Spor Bilimi & Atletik Kilo Analizi için tıklayın"
            >
              <span>Sporcu Hedef:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 group-hover:underline">
                {calculations.idealWeight.athleticMin}-{calculations.idealWeight.athleticMax} kg
              </span>
              <FaInfoCircle className="text-[10px] text-amber-500/70" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── 1. SEKME: BEDEN PROFİLİ ── */}
        {activeTab === 'profile' ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Cinsiyet Seçimi */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGender('male')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:border-stone-300'
                }`}
              >
                <FaMale className="text-lg" />
                {t('bodyProfile.genderMale')}
              </button>
              <button
                onClick={() => setGender('female')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'border-rose-400 bg-rose-400/10 text-rose-700 dark:text-rose-400 shadow-sm'
                    : 'border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:border-stone-300'
                }`}
              >
                <FaFemale className="text-lg" />
                {t('bodyProfile.genderFemale')}
              </button>
            </div>

            {/* İki Sütunlu Ana Alan: Sol Vücut SVG | Sağ Bilgiler ve 15 Ölçüm */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sol: Vücut SVG */}
              <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500 dark:text-zinc-400 tracking-wider">
                    <FaTape className="text-sm text-amber-500" />
                    {t('bodyProfile.bodyPointsTitle') || 'Vücut Noktaları (15 Bölge)'}
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {t('bodyProfile.bodyPointsSubtitle') || 'Tıkla & Ölç'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-4 leading-relaxed">
                  {t('bodyProfile.bodyPointsDescription') || 'Vücut üzerindeki noktalara tıklayarak ilgili mezura ölçüsünü hızlıca girebilirsiniz.'}
                </p>

                <Suspense
                  fallback={
                    <div className="w-full h-[480px] flex flex-col items-center justify-center gap-3 bg-stone-50/50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-stone-200 dark:border-zinc-800">
                      <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-stone-400 dark:text-zinc-500 tracking-wide">
                        3D Beden Simülatörü Yükleniyor...
                      </span>
                    </div>
                  }
                >
                  <RotatableBody3D
                    gender={gender}
                    measurements={measurements}
                    heightCm={heightCm}
                    weightKg={weightKg}
                    selectedKey={selectedKey}
                    onSelectKey={key => setSelectedKey(key)}
                    diagnoses={regionalDiagnoses}
                  />
                </Suspense>

                {/* Tıklanan Noktanın Hızlı Düzenleme Kutusu (3D Model Altı) */}
                <AnimatePresence>
                  {selectedKey && activeMeta && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                          <span>{activeMeta.emoji}</span>
                          <span>{activeMeta.label} Ölçüsü</span>
                        </span>
                        <button
                          onClick={() => setSelectedKey(null)}
                          className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 font-bold cursor-pointer"
                        >
                          ✕ Kapat
                        </button>
                      </div>
                      <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mb-3 leading-relaxed">
                        💡 {activeMeta.tip}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustMeasurement(selectedKey, -1)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                        >
                          <FaMinus className="text-[9px]" />
                        </button>
                        <input
                          type="number"
                          value={measurements[selectedKey] || ''}
                          onChange={e => updateMeasurement(selectedKey, Number(e.target.value))}
                          placeholder="0"
                          min={0}
                          max={250}
                          step={0.5}
                          className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white font-black text-center text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                        <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">cm</span>
                        <button
                          onClick={() => adjustMeasurement(selectedKey, 1)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                        >
                          <FaPlus className="text-[9px]" />
                        </button>
                      </div>

                      {/* Canlı Bölgesel Teşhis Rozeti & Doktora Notu */}
                      {(() => {
                        const diag = regionalDiagnoses[selectedKey];
                        if (!diag || diag.status === 'not_entered') return null;
                        return (
                          <div className={`mt-3 p-3 rounded-2xl border text-xs ${
                            diag.status === 'excess_fat'
                              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                              : diag.status === 'underdeveloped'
                                ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-900/60 text-sky-950 dark:text-sky-200'
                                : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
                          }`}>
                            <div className="flex items-center justify-between font-black mb-1">
                              <span className="flex items-center gap-1.5">
                                <span>{diag.status === 'excess_fat' ? '🔴' : diag.status === 'underdeveloped' ? '🔵' : '🟢'}</span>
                                <span>Teşhis: {diag.statusLabel}</span>
                              </span>
                              <span className="text-[10.5px] opacity-80 font-mono">
                                İdeal: {diag.idealRange.min}-{diag.idealRange.max} cm
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 leading-relaxed mb-1.5">
                              🔬 <strong>{diag.thesisTitle}:</strong> {diag.thesisFinding}
                            </p>
                            <div className="text-[11px] font-black pt-1.5 border-t border-current/20 flex items-center gap-1">
                              <span>🎯 Reçete:</span>
                              <span className="font-bold">{diag.actionProtocol}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Bilimsel Rehber Butonu */}
                      <button
                        type="button"
                        onClick={() => setGuideModalKey(selectedKey)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-950 dark:text-amber-200 font-bold text-xs transition-all border border-amber-400/40 cursor-pointer"
                      >
                        <FaBookOpen className="text-xs text-amber-600 dark:text-amber-400" />
                        <span>{activeMeta.label} Bilimsel Rehberi (Nasıl Büyür? / Nasıl İncelir?)</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sağ: Kişisel Bilgiler & Bölgesel 15 Ölçüm (İç içe kaydırmasız) */}
              <div className="lg:col-span-6 space-y-5">
                {/* 1. Kişisel Bilgiler Kartı */}
                <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase text-stone-500 dark:text-zinc-400 tracking-wider">
                    <FaInfoCircle className="text-sm text-blue-500" />
                    {t('bodyProfile.personalInfo')}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <NumberInput label={t('bodyProfile.age')} value={age} onChange={setAge} unit="yıl" min={10} max={100} icon={<span>🎂</span>} />
                    <NumberInput label={t('bodyProfile.height')} value={heightCm} onChange={setHeightCm} unit="cm" min={100} max={250} icon={<FaRuler className="text-[10px]" />} />
                    <NumberInput label={t('bodyProfile.weight')} value={weightKg} onChange={setWeightKg} unit="kg" min={30} max={300} step={0.1} icon={<FaWeight className="text-[10px]" />} />
                    <NumberInput label={t('bodyProfile.targetWeight')} value={targetWeightKg} onChange={setTargetWeightKg} unit="kg" min={30} max={250} step={0.1} icon={<FaBullseye className="text-[10px]" />} />
                  </div>

                  <div className="mt-3">
                    <label className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <FaRunning className="text-[10px]" />
                      {t('bodyProfile.activityLevel')}
                    </label>
                    <select
                      value={activityLevel}
                      onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(level => (
                        <option key={level} value={level}>
                          {getActivityLabel(level)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Bölgesel Ölçümler (15 Bölge - Açık ve Düzenli Izgara) */}
                <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500 dark:text-zinc-400 tracking-wider">
                      <FaTape className="text-sm text-emerald-500" />
                      {t('bodyProfile.regionalMeasurements')}
                    </div>
                    <button
                      onClick={handleCopyTableTemplate}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-[11px] font-bold text-stone-600 dark:text-zinc-300 transition-colors cursor-pointer"
                      title="Markdown takip şablonunu kopyalar"
                    >
                      {copied ? <FaCheck className="text-emerald-500 text-[10px]" /> : <FaCopy className="text-amber-500 text-[10px]" />}
                      <span>{copied ? 'Kopyalandı' : 'Şablonu Kopyala'}</span>
                    </button>
                  </div>

                  {/* Kategori Filtre Hapları */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                    {[
                      { key: 'all' as const, label: 'Tümü (15)' },
                      { key: 'upper' as const, label: 'Üst Beden (3)' },
                      { key: 'arms' as const, label: 'Kollar (4)' },
                      { key: 'core' as const, label: 'Karın & Bel (4)' },
                      { key: 'legs' as const, label: 'Bacaklar (4)' },
                    ].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setMeasurementCategory(cat.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          measurementCategory === cat.key
                            ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                            : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* 15 Alanın Doğrudan Giriş Kutuları (İç içe kaydırma yok) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MEASUREMENT_LIST
                      .filter(item => measurementCategory === 'all' || item.category === measurementCategory)
                      .map(item => {
                        const isSel = selectedKey === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => setSelectedKey(item.key)}
                            className={`cursor-pointer transition-all ${isSel ? 'ring-2 ring-amber-400 rounded-2xl' : ''}`}
                          >
                            <NumberInput
                              label={`${item.emoji} ${item.label}`}
                              value={measurements[item.key]}
                              onChange={v => updateMeasurement(item.key, v)}
                              unit="cm"
                              min={0}
                              max={250}
                              step={0.5}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>


              </div>
            </div>

            {/* ── BÖLGESEL ORAN ANALİZİ & KİŞİSEL SPOR TAVSİYELERİ ── */}
            <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <FaDumbbell className="text-amber-500" />
                    {t('bodyProfile.ratioAnalysisTitle') || 'Bölgesel Oran Analizi & Kişisel Spor Tavsiyeleri'}
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">
                    {t('bodyProfile.ratioAnalysisSubtitle') || 'Ölçümlerinize ve spor hekimliği standartlarına (V-Taper, WHtR, Simetri) göre kişiselleştirilmiş analiz'}
                  </p>
                </div>

                {/* Hızlı Rehber Hapları & Katalog Butonu */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowExerciseCatalogModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <FaPlay className="text-[9px]" />
                    <span>{t('bodyProfile.exerciseCatalogBtn') || '🎬 Egzersiz Kataloğu & GIF\'ler'}</span>
                  </button>

                  <span className="text-[11px] font-bold text-stone-400 ml-1 mr-0.5">
                    {t('bodyProfile.guidesTitle') || 'Rehberler:'}
                  </span>
                  {(['shoulderCm', 'chestCm', 'waistCm', 'upperArmRightCm', 'lowerAbdomenCm', 'thighRightCm', 'calfRightCm'] as ValidMeasurementKey[]).map(key => (
                    <button
                      key={key}
                      onClick={() => setGuideModalKey(key)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-amber-400 hover:text-stone-950 dark:hover:bg-amber-400 dark:hover:text-stone-950 text-[11px] font-bold text-stone-600 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      {measurementLabels[key]?.emoji} {measurementLabels[key]?.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Oran Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. V-Taper Adonis Oranı */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <FaMedal className="text-amber-500" />
                      {t('bodyProfile.vTaperTitle') || 'V-Taper (Adonis Oranı)'}
                    </span>
                    {proportions.vTaper && (
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        proportions.vTaper.status === 'ideal'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : proportions.vTaper.status === 'good'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {proportions.vTaper.ratio} ({language === 'tr' ? 'Hedef: 1.618' : 'Target: 1.618'})
                      </span>
                    )}
                  </div>
                  {proportions.vTaper ? (
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                        {proportions.vTaper.title}
                      </div>
                      <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                        {proportions.vTaper.advice}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 leading-relaxed">
                      {language === 'tr' ? 'Omuz ve bel ölçünüzü girerek V-Taper Adonis oranınızı hesaplayın.' : 'Enter your shoulder and waist measurements to calculate your V-Taper Adonis ratio.'}
                    </p>
                  )}
                </div>

                {/* 2. Bel / Boy Oranı (WHtR) */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <FaHeartbeat className="text-rose-500" />
                      {t('bodyProfile.whtrTitle') || 'Bel / Boy (WHtR)'}
                    </span>
                    {proportions.waistToHeight && (
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        proportions.waistToHeight.status === 'healthy'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {proportions.waistToHeight.ratio} ({language === 'tr' ? 'İdeal < 0.50' : 'Ideal < 0.50'})
                      </span>
                    )}
                  </div>
                  {proportions.waistToHeight ? (
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                        {proportions.waistToHeight.title}
                      </div>
                      <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                        {proportions.waistToHeight.advice}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 leading-relaxed">
                      {language === 'tr' ? 'Bel ve boy bilginiz girildiğinde iç organ (visseral) yağlanma riskiniz teşhis edilir.' : 'Visceral fat risk is diagnosed when waist and height information is entered.'}
                    </p>
                  )}
                </div>

                {/* 3. Kol ve Bacak Simetrisi */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <FaBalanceScale className="text-blue-500" />
                      {t('bodyProfile.symmetryTitle') || 'Beden Simetrisi'}
                    </span>
                    {proportions.armSymmetry && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                        {proportions.armSymmetry.hasAsymmetry ? (language === 'tr' ? '⚠️ Asimetri' : '⚠️ Asymmetry') : (language === 'tr' ? '✓ Dengeli' : '✓ Balanced')}
                      </span>
                    )}
                  </div>
                  {proportions.armSymmetry ? (
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                        {language === 'tr' ? 'Kol Farkı' : 'Arm Difference'}: {proportions.armSymmetry.diffCm} cm {proportions.legSymmetry ? `| ${language === 'tr' ? 'Bacak Farkı' : 'Leg Difference'}: ${proportions.legSymmetry.diffCm} cm` : ''}
                      </div>
                      <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                        {proportions.armSymmetry.advice}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 leading-relaxed">
                      {language === 'tr' ? 'Sağ ve sol kol ölçülerinizi girerek kas asimetrinizi kontrol edin.' : 'Enter your left and right arm measurements to check for muscle asymmetry.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Kişiselleştirilmiş Düzeltme Önerileri (Büyük/Küçük Bölgeler) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* İnceltilmesi Gerekenler */}
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                  <div className="flex items-center gap-2 text-xs font-black text-rose-700 dark:text-rose-400 uppercase mb-3">
                    <FaArrowDown />
                    {language === 'tr' ? 'İncelmesi & Sıkılaşması Gereken Bölgeler' : 'Areas to Slim & Tighten'}
                  </div>
                  {proportions.priorityActions.reduceAreas.length > 0 ? (
                    <div className="space-y-2.5">
                      {proportions.priorityActions.reduceAreas.map((area, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-rose-200/50 dark:border-zinc-800 text-xs">
                          <div className="font-black text-stone-900 dark:text-white flex items-center justify-between">
                            <span>{area.name}</span>
                            <span className="text-[10px] text-rose-500 font-bold">{language === 'tr' ? 'Hedef: İncelme' : 'Goal: Slimming'}</span>
                          </div>
                          <p className="text-stone-500 dark:text-zinc-400 text-[11px] mt-0.5">{area.reason}</p>
                          <div className="mt-1.5 p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                            {language === 'tr' ? '💡 Reçete:' : '💡 Protocol:'} {area.priorityAction}
                          </div>

                          {/* Dinamik Egzersiz Çipleri */}
                          {(() => {
                            const exercises = extractExercisesFromText(area.priorityAction);
                            if (exercises.length === 0) return null;
                            return (
                              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase text-rose-700/80 dark:text-rose-400">
                                  {language === 'tr' ? '🎬 Hareketi Gör:' : '🎬 View Exercise:'}
                                </span>
                                {exercises.map(ex => (
                                  <button
                                    key={ex.id}
                                    type="button"
                                    onClick={() => setSelectedExerciseForPreview(ex)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-amber-400 hover:text-stone-950 dark:hover:bg-amber-400 dark:hover:text-stone-950 text-[11px] font-bold text-stone-700 dark:text-zinc-200 border border-stone-200/80 dark:border-zinc-700 shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                                  >
                                    <span className="text-amber-500">👁️</span>
                                    <span>{ex.name.split('(')[0].trim()}</span>
                                    <span className="text-[9px] px-1 py-0.2 rounded-xs bg-amber-100 dark:bg-zinc-700 text-amber-800 dark:text-amber-300 font-black">
                                      GIF
                                    </span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      {language === 'tr' ? 'Tebrikler! Bel veya karın bölgenizde aşırı yağlanma tespit edilmedi. Mevcut kilonuzu ve formunuzu koruyun.' : 'Congratulations! No excessive abdominal fat detected. Maintain your healthy body composition.'}
                    </p>
                  )}
                </div>

                {/* Büyütülmesi Gerekenler */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase mb-3">
                    <FaArrowUp />
                    {language === 'tr' ? 'Büyütülmesi & Kas Eklenmesi Gereken Bölgeler' : 'Areas to Grow & Build Muscle'}
                  </div>
                  {proportions.priorityActions.growAreas.length > 0 ? (
                    <div className="space-y-2.5">
                      {proportions.priorityActions.growAreas.map((area, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200/50 dark:border-zinc-800 text-xs">
                          <div className="font-black text-stone-900 dark:text-white flex items-center justify-between">
                            <span>{area.name}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">{language === 'tr' ? 'Hedef: Hipertrofi' : 'Goal: Hypertrophy'}</span>
                          </div>
                          <p className="text-stone-500 dark:text-zinc-400 text-[11px] mt-0.5">{area.reason}</p>
                          <div className="mt-1.5 p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            {language === 'tr' ? '⚡ Reçete:' : '⚡ Protocol:'} {area.priorityAction}
                          </div>

                          {/* Dinamik Egzersiz Çipleri */}
                          {(() => {
                            const exercises = extractExercisesFromText(area.priorityAction);
                            if (exercises.length === 0) return null;
                            return (
                              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase text-emerald-700/80 dark:text-emerald-400">
                                  {language === 'tr' ? '🎬 Hareketi Gör:' : '🎬 View Exercise:'}
                                </span>
                                {exercises.map(ex => (
                                  <button
                                    key={ex.id}
                                    type="button"
                                    onClick={() => setSelectedExerciseForPreview(ex)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-amber-400 hover:text-stone-950 dark:hover:bg-amber-400 dark:hover:text-stone-950 text-[11px] font-bold text-stone-700 dark:text-zinc-200 border border-stone-200/80 dark:border-zinc-700 shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                                  >
                                    <span className="text-amber-500">👁️</span>
                                    <span>{ex.name.split('(')[0].trim()}</span>
                                    <span className="text-[9px] px-1 py-0.2 rounded-xs bg-amber-100 dark:bg-zinc-700 text-amber-800 dark:text-amber-300 font-black">
                                      GIF
                                    </span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      {language === 'tr' ? 'Tüm kas gruplarınız dengeli oranda gelişmiş.' : 'All muscle groups have achieved balanced proportional development.'}
                    </p>
                  )}
                </div>
              </div>

              {/* 15 BÖLGE DETAYLI YAĞ / KAS TEŞHİS RAPORU (DOKTORA VE AKADEMİK TEZLER BAZLI) */}
              <div className="pt-4 border-t border-stone-100 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                      <span className="text-base">🔬</span>
                      15 Bölge Yağlanma &amp; Kas Kütlesi Detaylı Teşhis Raporu
                    </h4>
                    <p className="text-[11px] text-stone-400 dark:text-zinc-500 mt-0.5">
                      Akademik antropometri tezleri (Casey Butt, Heymsfield, McCallum, ACSM) normatif verilerine göre bölgesel durumunuz
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                      🔴 Fazla Yağlanma
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400">
                      🔵 Kas Azlığı
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      🟢 İdeal
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {MEASUREMENT_LIST.map(item => {
                    const diag = regionalDiagnoses[item.key];
                    if (!diag) return null;
                    return (
                      <div
                        key={item.key}
                        onClick={() => {
                          setSelectedKey(item.key);
                          setGuideModalKey(item.key);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                          diag.status === 'excess_fat'
                            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/40 hover:border-rose-400'
                            : diag.status === 'underdeveloped'
                              ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-300 dark:border-sky-900/40 hover:border-sky-400'
                              : diag.status === 'optimal'
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/40 hover:border-emerald-400'
                                : 'bg-stone-50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
                            <span>{item.emoji}</span>
                            <span>{item.label}</span>
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${diag.badgeBg} ${diag.badgeText}`}>
                            {diag.statusLabel}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400 my-1">
                          <span>Mevcut: <strong className="text-stone-900 dark:text-white font-mono">{diag.currentValue > 0 ? `${diag.currentValue} cm` : '—'}</strong></span>
                          <span>İdeal Aralık: <strong className="text-stone-700 dark:text-zinc-300 font-mono">{diag.idealRange.min}-{diag.idealRange.max} cm</strong></span>
                        </div>

                        <p className="text-[10.5px] text-stone-600 dark:text-zinc-400 line-clamp-2 mt-1 italic">
                          📚 {diag.thesisFinding}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── 2. SEKME: KALORİ AÇIĞI & HEDEF ── */
          <motion.div
            key="deficit"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="BMR"
                value={calculations.bmr}
                unit="kcal"
                sublabel="Bazal metabolizma hızı"
                color="text-blue-500"
                icon={<FaHeartbeat />}
              />
              <StatCard
                label="TDEE"
                value={calculations.tdee}
                unit="kcal"
                sublabel="Günlük yakılan enerji"
                color="text-amber-500"
                icon={<FaRunning />}
              />
              <StatCard
                label="Hedef Kalori"
                value={calculations.deficit.dailyCalorieTarget}
                unit="kcal"
                sublabel="Günlük tüketim hedefi"
                color="text-emerald-500"
                icon={<FaBullseye />}
              />
              <StatCard
                label="Günlük Açık"
                value={calculations.deficit.dailyDeficit > 0 ? `-${calculations.deficit.dailyDeficit}` : '0'}
                unit="kcal"
                sublabel={calculations.deficit.isGaining ? 'Kalori Fazlası' : 'Kilo Verme Açığı'}
                color="text-rose-500"
                icon={<FaFire />}
              />
            </div>

            {/* Today vs Target Calorie Progress (Canlı Haberleşme) */}
            <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <FaFire className="text-amber-500" />
                    Bugünkü Beslenme & Kalori Durumu
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">
                    emuAI sohbetinizde bugün kaydedilen yemeklerin toplamı ile günlük hedefiniz
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {todayCalories}
                  </span>
                  <span className="text-xs text-stone-400"> / {calculations.deficit.dailyCalorieTarget} kcal</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    todayCalories > calculations.deficit.dailyCalorieTarget
                      ? 'bg-rose-500'
                      : todayCalories > calculations.deficit.dailyCalorieTarget * 0.8
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((todayCalories / Math.max(1, calculations.deficit.dailyCalorieTarget)) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-zinc-400">
                <span>
                  {todayCalories > calculations.deficit.dailyCalorieTarget ? (
                    <span className="text-rose-500 font-black">
                      ⚠️ Günlük kalori hedefiniz {todayCalories - calculations.deficit.dailyCalorieTarget} kcal aşıldı
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      ✓ Kalan kalori hakkınız: {calculations.deficit.dailyCalorieTarget - todayCalories} kcal
                    </span>
                  )}
                </span>
                <span>
                  Tamamlanma: %{Math.round((todayCalories / Math.max(1, calculations.deficit.dailyCalorieTarget)) * 100)}
                </span>
              </div>
            </div>

            {/* Weekly Forecast & Weight Goal Projection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/15 via-white to-emerald-500/5 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 border border-emerald-500/30 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase mb-2">
                  <FaChartLine className="text-sm" /> Haftalık Tahmini Kilo Kaybı
                </div>
                <div className="text-3xl font-black text-stone-900 dark:text-white">
                  ~{calculations.deficit.weeklyWeightLossKg} <span className="text-sm font-bold text-stone-400">kg / hafta</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Günlük {calculations.deficit.dailyDeficit} kcal kalori açığı ile vücudunuz haftada yaklaşık {calculations.deficit.weeklyWeightLossKg} kg yağ kütlesi kaybeder.
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-500/15 via-white to-orange-500/5 dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-900 border border-amber-500/30 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase mb-2">
                  <FaBullseye className="text-sm" /> Hedefe Kalan Süre
                </div>
                <div className="text-3xl font-black text-stone-900 dark:text-white">
                  {calculations.deficit.weeksToGoal > 0 ? `~${calculations.deficit.weeksToGoal}` : '0'} <span className="text-sm font-bold text-stone-400">hafta</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Mevcut kilonuz ({weightKg} kg) ile hedefiniz ({targetWeightKg} kg) arasındaki {Math.abs(weightKg - targetWeightKg).toFixed(1)} kg fark bu tempoyla kapanır.
                </p>
              </div>
            </div>

            {/* US Navy Vücut Yağ Analizi Kartı */}
            {calculations.bodyFat !== null && (
              <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase text-stone-500 dark:text-zinc-400 tracking-wider">
                  <FaPercent className="text-sm text-amber-500" />
                  US Navy Vücut Yağ Analizi
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-4xl font-black ${calculations.bodyFatCategory?.color}`}>
                      %{calculations.bodyFat}
                    </div>
                    <div className={`text-xs font-bold mt-1 ${calculations.bodyFatCategory?.color}`}>
                      {calculations.bodyFatCategory?.label}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-stone-900 dark:text-white">
                      {Math.round(weightKg * (calculations.bodyFat / 100))} kg
                    </div>
                    <div className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase mt-1">Yağ Kütlesi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-stone-900 dark:text-white">
                      {Math.round(weightKg * (1 - calculations.bodyFat / 100))} kg
                    </div>
                    <div className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase mt-1">Yağsız Kütle</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {Math.round(weightKg * (1 - calculations.bodyFat / 100) * 0.45)} kg
                    </div>
                    <div className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase mt-1">Tahmini Kas</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bilgi & Tavsiyeler */}
            <div className="bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/50 dark:border-zinc-700/50 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase text-stone-500 dark:text-zinc-400 tracking-wider">
                <FaInfoCircle className="text-sm text-blue-500" />
                Metabolizma Bilgi & Rehberi
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                <div>
                  <span className="font-black text-stone-900 dark:text-white">BMR (Bazal Metabolizma):</span>
                  <p className="mt-0.5">Dinlenme halinde organlarınızın çalışması için yakılan kalori. Mifflin-St Jeor formülüyle hesaplanır.</p>
                </div>
                <div>
                  <span className="font-black text-stone-900 dark:text-white">TDEE (Toplam Günlük Enerji):</span>
                  <p className="mt-0.5">BMR değerinizin aktivite çarpanı ile hesaplanan günlük gerçek enerji harcamanız.</p>
                </div>
                <div>
                  <span className="font-black text-stone-900 dark:text-white">Kalori Açığı:</span>
                  <p className="mt-0.5">1 kg yağ dokusu $\approx$ 7700 kcal. Günlük 500-750 kcal açık ile sağlıklı haftalık 0.5-0.7 kg yağ kaybı hedeflenir.</p>
                </div>
                <div>
                  <span className="font-black text-stone-900 dark:text-white">US Navy Vücut Yağ Formülü:</span>
                  <p className="mt-0.5">Boy, boyun, bel (ve kadınlarda kalça) mezura ölçümleri ile yağ yüzdesi tahmin edilir.</p>
                </div>
              </div>
            </div>

            {/* Hızlı Butonlar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/calorie-chat"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 text-stone-950 font-bold text-sm hover:bg-amber-300 transition-all shadow-md shadow-amber-500/20"
              >
                <FaUtensils className="text-sm" />
                {t('calorieDetails.analyzeWithAi') || 'B12 AI ile Yemek Analiz Et'}
              </Link>
              <Link
                to="/calorie-details"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-sm hover:bg-stone-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
              >
                <FaChartLine className="text-sm" />
                Kalori Raporuna Git
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL 1: BÖLGESEL BİLİMSEL GELİŞİM & İNCELTME REHBERİ ── */}
      <AnimatePresence>
        {guideModalKey && REGIONAL_GUIDES[guideModalKey] && (() => {
          const guide = REGIONAL_GUIDES[guideModalKey];
          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* Modal Başlığı */}
                <div className="p-5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-amber-400/10">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{measurementLabels[guideModalKey]?.emoji}</span>
                    <div>
                      <h3 className="text-lg font-black text-stone-900 dark:text-white">
                        {guide.regionName} — {language === 'tr' ? 'Bilimsel Gelişim & İnceltme Rehberi' : 'Scientific Hypertrophy & Leanness Guide'}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                        {language === 'tr' ? 'Hedef Kaslar:' : 'Target Muscles:'} <span className="font-bold text-stone-700 dark:text-zinc-200">{guide.targetMuscles}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGuideModalKey(null)}
                    className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 flex items-center justify-center text-stone-600 dark:text-zinc-300 font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Gövdesi */}
                <div className="p-5 overflow-y-auto space-y-5 text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
                  {/* Anatomi Özeti */}
                  <div className="p-3 bg-stone-50 dark:bg-zinc-800/60 rounded-2xl border border-stone-200/50 dark:border-zinc-700/50">
                    <span className="font-black text-stone-900 dark:text-white uppercase text-[10px] tracking-wider block mb-1">
                      🔬 Fonksiyonel Anatomi
                    </span>
                    <p>{guide.anatomyOverview}</p>
                  </div>

                  {/* 1. NASIL BÜYÜTÜLÜR? (Hipertrofi) */}
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/50 dark:border-emerald-800/40 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-black text-sm uppercase">
                      <FaArrowUp />
                      Nasıl Büyütülür? (Kas Hipertrofisi)
                    </div>
                    <p className="text-stone-700 dark:text-zinc-300">{guide.howToGrow.mechanism}</p>

                    <div>
                      <span className="font-bold text-stone-900 dark:text-white block mb-1.5">
                        ⚡ En Etkili Kanıtlanmış Egzersizler:
                      </span>
                      <div className="space-y-1.5">
                        {guide.howToGrow.primaryExercises.map((ex, i) => (
                          <div key={i} className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200/50 dark:border-zinc-800">
                            <div className="flex items-center justify-between gap-2 font-bold text-stone-900 dark:text-white flex-wrap">
                              <span className="text-xs">{ex.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-md">
                                  {ex.setsReps}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenExercisePreview(ex.name)}
                                  className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-400 text-amber-900 hover:text-stone-950 dark:bg-amber-950/50 dark:hover:bg-amber-400 dark:text-amber-300 dark:hover:text-stone-950 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                  title="Egzersiz GIF ve Form Rehberini Aç"
                                >
                                  <span>🎬</span>
                                  <span>Hareketi Gör (GIF)</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1">💡 {ex.tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-stone-900 dark:text-white block mb-1">🎯 Hipertrofi Tüyoları:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600 dark:text-zinc-300 text-[11px]">
                        {guide.howToGrow.hypertrophyTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-[11px] text-stone-500 dark:text-zinc-400 italic">
                      ⏱️ Dinlenme: {guide.howToGrow.restAndRecovery}
                    </div>
                  </div>

                  {/* 2. NASIL İNCELTİLİR? (Sıkılaşma & Yağ Yakımı) */}
                  <div className="p-4 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-300/50 dark:border-rose-800/40 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-black text-sm uppercase">
                      <FaArrowDown />
                      Nasıl İnceltilir / Küçültülür? (Sıkılaşma)
                    </div>
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-rose-200/50 dark:border-zinc-800">
                      <span className="font-bold text-rose-700 dark:text-rose-400 block mb-0.5">⚠️ Bölgesel Yağ Yakımı Miti:</span>
                      <p className="text-[11px] text-stone-600 dark:text-zinc-400">{guide.howToReduce.spotReductionMyth}</p>
                    </div>

                    <p className="text-stone-700 dark:text-zinc-300">{guide.howToReduce.reductionStrategy}</p>

                    <div>
                      <span className="font-bold text-stone-900 dark:text-white block mb-1.5">
                        ✨ Bölgeyi Toparlayan &amp; Gerginleştiren Egzersizler:
                      </span>
                      <div className="space-y-1.5">
                        {guide.howToReduce.tighteningExercises.map((ex, i) => (
                          <div key={i} className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-rose-200/50 dark:border-zinc-800">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-stone-900 dark:text-white text-xs">{ex.name}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenExercisePreview(ex.name)}
                                className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-500 hover:text-white dark:bg-rose-950/50 dark:hover:bg-rose-500 text-rose-900 dark:text-rose-300 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="Egzersiz GIF ve Form Rehberini Aç"
                              >
                                <span>🎬</span>
                                <span>Hareketi Gör (GIF)</span>
                              </button>
                            </div>
                            <span className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1 block">{ex.focus}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] text-rose-800 dark:text-rose-300 p-2 bg-rose-100/60 dark:bg-rose-900/20 rounded-xl font-bold">
                      🥗 Beslenme &amp; Su: {guide.howToReduce.nutritionAndWaterAdvice}
                    </div>
                  </div>

                  {/* Sık Yapılan Hatalar */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                    <span className="font-black text-amber-900 dark:text-amber-300 uppercase text-[10px] tracking-wider block mb-1">
                      ⚠️ Sık Yapılan Ölümcül Hatalar:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-stone-700 dark:text-zinc-300">
                      {guide.commonMistakes.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Bilimsel Kaynak */}
                  <div className="text-[10px] text-stone-400 dark:text-zinc-500 border-t border-stone-100 dark:border-zinc-800 pt-2">
                    📚 Bilimsel Referans: {guide.scientificReference}
                  </div>
                </div>

                {/* Modal Altı */}
                <div className="p-4 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/40 flex justify-end">
                  <button
                    onClick={() => setGuideModalKey(null)}
                    className="px-6 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 cursor-pointer"
                  >
                    Anladım, Kapat
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ── MODAL 2: SPOR BİLİMİ & ATLETİK İDEAL KİLO ANALİZİ ── */}
      <AnimatePresence>
        {showWeightInfoModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-amber-400/10">
                <div className="flex items-center gap-2.5">
                  <FaBalanceScale className="text-xl text-amber-500" />
                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-white">
                      Spor Bilimi &amp; Atletik İdeal Kilo Analizi
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      Neden Klasik WHO BMI Sınırları (57 kg) Bir Sporcu İçin Mantıksızdır?
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWeightInfoModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 flex items-center justify-center text-stone-600 dark:text-zinc-300 font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl">
                  <span className="font-black text-rose-800 dark:text-rose-400 block mb-1">
                    ⚠️ Klasik WHO BMI Formülünün Yanıltıcılığı:
                  </span>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-400">
                    Dünya Sağlık Örgütü'nün (WHO) 18.5 - 24.9 BMI tablosu 1800'lü yıllardan kalma genel istatistiksel bir modeldir.
                    Kas kütlesini, kemik yoğunluğunu ve sporcu fizyolojisini tamamen yok sayar.
                    Örneğin 175 cm boyundaki bir erkek için alt sınır <strong>56.7 kg (~57 kg)</strong> çıkar.
                    Aktif bir erkek 57 kg olduğunda vücut aşırı kas kaybeder, testosteron seviyesi çöker ve bağışıklık sistemi çöker.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-black text-stone-900 dark:text-white block uppercase text-[11px] tracking-wider">
                    🏆 Modern Spor Hekimliği Standartları (Devine &amp; FFMI):
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-stone-50 dark:bg-zinc-800/70 rounded-xl border border-stone-200 dark:border-zinc-700">
                      <div className="text-[10px] text-stone-400 font-bold uppercase">Devine Formülü (Standart)</div>
                      <div className="text-lg font-black text-stone-900 dark:text-white mt-0.5">
                        ~{calculations.idealWeight.devine} kg
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Klinik tıp referans kilosu</div>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800">
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">Atletik / Fit Hedef</div>
                      <div className="text-lg font-black text-amber-900 dark:text-amber-300 mt-0.5">
                        {calculations.idealWeight.athleticMin} - {calculations.idealWeight.athleticMax} kg
                      </div>
                      <div className="text-[10px] text-amber-700/80 mt-0.5">%12-15 yağ ile atletik form</div>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800 col-span-2">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Kaslı / Estetik Hedef (FFMI 22-24)</div>
                      <div className="text-lg font-black text-emerald-900 dark:text-emerald-300 mt-0.5">
                        {calculations.idealWeight.muscularMin} - {calculations.idealWeight.muscularMax} kg
                      </div>
                      <div className="text-[10px] text-emerald-700/80 mt-0.5">Ağırlık çalışan, kas kütlesi yüksek ve %10-12 yağ oranındaki yarışma/plaj formu</div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-100 dark:bg-zinc-800 rounded-2xl">
                  <span className="font-bold text-stone-900 dark:text-white block mb-1">
                    🎯 175 cm ve 81 kg İçin Doğru Strateji Nedir?
                  </span>
                  <p className="text-[11px] text-stone-600 dark:text-zinc-300">
                    Mevcut 81 kg kilonuzda amacınız kesinlikle 57 kg olmak değildir!
                    Amacınız; mevcut kas kütlenizi koruyarak sadece yağ yakmak ve <strong>74 – 77 kg</strong> bandında %12-14 yağ oranına inip zırh gibi hatlara sahip olmaktır.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/40 flex justify-end">
                <button
                  onClick={() => setShowWeightInfoModal(false)}
                  className="px-6 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 cursor-pointer"
                >
                  Tamam, Anladım
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: SPOR HAREKETLERİ GIF & VİDEO ÖNİZLEME MODALI ── */}
      <ExercisePreviewModal
        isOpen={Boolean(selectedExerciseForPreview)}
        exercise={selectedExerciseForPreview}
        onClose={() => setSelectedExerciseForPreview(null)}
      />

      {/* ── MODAL 4: TÜM EGZERSİZLER KATALOĞU & HAREKET ARAMA ── */}
      <ExerciseCatalogModal
        isOpen={showExerciseCatalogModal}
        onClose={() => setShowExerciseCatalogModal(false)}
        onSelectExercise={ex => {
          setShowExerciseCatalogModal(false);
          setSelectedExerciseForPreview(ex);
        }}
      />

      {/* ── MODAL 5: ERİŞİM & İLETİŞİM TALEBİ MODALI ── */}
      <AccessRequestModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        featureKey="calorieAi"
        featureTitle={language === 'tr' ? 'B12 AI Beden Profili & Kalori Koçu' : 'B12 AI Body Profile & Nutrition Coach'}
        featureDescription={language === 'tr' ? 'Kişiselleştirilmiş Beden Profili, 15 Bölge antropometri analizi ve AI destekli spor-beslenme koçluğu.' : 'Personalized Body Profile, 15-region anthropometric analysis, and AI sports/nutrition coaching.'}
      />
    </div>
  );
}
