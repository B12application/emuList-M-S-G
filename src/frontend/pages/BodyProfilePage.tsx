// src/frontend/pages/BodyProfilePage.tsx
// Beden Profili & Kalori Açığı — Orijinal 2 Sekmeli (Profile & Deficit) Düzeltilmiş Tasarım
// 15 Bölge İnteraktif SVG + Kişisel Bilgiler + Bölgesel Ölçümler + Kalori Açığı Motoru

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaFire, FaMale, FaFemale, FaRuler, FaWeight,
  FaBullseye, FaRunning, FaSave, FaHeartbeat, FaChartLine,
  FaPercent, FaBalanceScale, FaTape, FaUtensils, FaInfoCircle,
  FaCopy, FaCheck, FaPlus, FaMinus, FaBookOpen, FaTimes,
  FaDumbbell, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaMedal
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { getChatSessions, getDateKey } from '../services/calorieChatService';
import {
  type Gender, type ActivityLevel, type BodyMeasurements,
  type ValidMeasurementKey,
  ACTIVITY_LABELS, MEASUREMENT_LIST, MEASUREMENT_LABELS,
  calculateBMR, calculateTDEE, calculateBMI, getBMICategory,
  calculateBodyFat, getBodyFatCategory,
  calculateCalorieDeficit, getIdealWeightRange,
  saveBodyProfile, getBodyProfile,
  emptyMeasurements,
} from '../services/bodyProfileService';
import {
  REGIONAL_GUIDES,
  analyzeBodyProportions,
  type RegionalGuide,
} from '../data/bodyScienceData';

// ── Tab definitions (Orijinal 2 Sekmeli Yapı) ───────────
type ActiveTab = 'profile' | 'deficit';

// ── SVG Human Body Component (15 Bölgeli İnteraktif Model) ───────
function HumanBodySVG({
  gender,
  measurements,
  selectedKey,
  onMeasurementClick,
}: {
  gender: Gender;
  measurements: BodyMeasurements;
  selectedKey: ValidMeasurementKey | null;
  onMeasurementClick: (key: ValidMeasurementKey) => void;
}) {
  const labelPositions: Record<ValidMeasurementKey, {
    x: number;
    y: number;
    anchor: 'left' | 'right';
    lineToX: number;
    lineToY: number;
  }> = {
    // Sol Sütun (7 bölge)
    shoulderCm: { x: 6, y: 65, anchor: 'left', lineToX: 180, lineToY: 108 },
    upperArmRightCm: { x: 6, y: 120, anchor: 'left', lineToX: 165, lineToY: 155 },
    forearmRightCm: { x: 6, y: 175, anchor: 'left', lineToX: 156, lineToY: 210 },
    upperAbdomenCm: { x: 6, y: 230, anchor: 'left', lineToX: 212, lineToY: 180 },
    lowerAbdomenCm: { x: 6, y: 285, anchor: 'left', lineToX: 212, lineToY: 230 },
    thighRightCm: { x: 6, y: 345, anchor: 'left', lineToX: 202, lineToY: 320 },
    calfRightCm: { x: 6, y: 410, anchor: 'left', lineToX: 204, lineToY: 400 },

    // Sağ Sütun (8 bölge)
    neckCm: { x: 332, y: 50, anchor: 'right', lineToX: 220, lineToY: 96 },
    chestCm: { x: 332, y: 105, anchor: 'right', lineToX: 228, lineToY: 145 },
    waistCm: { x: 332, y: 160, anchor: 'right', lineToX: 226, lineToY: 205 },
    hipCm: { x: 332, y: 215, anchor: 'right', lineToX: 232, lineToY: 255 },
    upperArmLeftCm: { x: 332, y: 270, anchor: 'right', lineToX: 275, lineToY: 155 },
    forearmLeftCm: { x: 332, y: 325, anchor: 'right', lineToX: 284, lineToY: 210 },
    thighLeftCm: { x: 332, y: 380, anchor: 'right', lineToX: 238, lineToY: 320 },
    calfLeftCm: { x: 332, y: 435, anchor: 'right', lineToX: 236, lineToY: 400 },
  };

  return (
    <svg viewBox="0 0 440 500" className="w-full max-w-[420px] mx-auto select-none" aria-label="İnsan vücudu ölçüm noktaları">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Silhouette centered by transform */}
      <g transform="translate(20, 10)">
        {gender === 'male' ? (
          <g className="text-amber-500">
            {/* Head */}
            <ellipse cx="200" cy="48" rx="26" ry="30" fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="2" opacity="0.9" />
            {/* Neck */}
            <rect x="188" y="76" width="24" height="20" rx="6" fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
            {/* Torso */}
            <path
              d="M148,96 Q140,96 138,110 L132,170 Q130,195 140,210 L148,230 Q155,248 172,250 L228,250 Q245,248 252,230 L260,210 Q270,195 268,170 L262,110 Q260,96 252,96 Z"
              fill="url(#glowGrad)" stroke="currentColor" strokeWidth="2" opacity="0.85"
            />
            {/* Left arm */}
            <path
              d="M148,100 Q130,105 125,130 L118,180 Q115,200 120,210 L128,240 Q132,250 136,248 L142,240 Q148,220 146,200 L150,160 Q152,130 148,100 Z"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="1.5" opacity="0.75"
            />
            {/* Right arm */}
            <path
              d="M252,100 Q270,105 275,130 L282,180 Q285,200 280,210 L272,240 Q268,250 264,248 L258,240 Q252,220 254,200 L250,160 Q248,130 252,100 Z"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="1.5" opacity="0.75"
            />
            {/* Left leg */}
            <path
              d="M172,248 L165,310 Q162,340 164,370 L166,420 Q167,440 175,445 L185,445 Q190,440 188,420 L186,370 Q188,340 190,310 L195,260"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="2" opacity="0.8"
            />
            {/* Right leg */}
            <path
              d="M228,248 L235,310 Q238,340 236,370 L234,420 Q233,440 225,445 L215,445 Q210,440 212,420 L214,370 Q212,340 210,310 L205,260"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="2" opacity="0.8"
            />
            {/* Center line */}
            <line x1="200" y1="96" x2="200" y2="248" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
          </g>
        ) : (
          <g className="text-rose-400">
            {/* Head */}
            <ellipse cx="200" cy="46" rx="24" ry="28" fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="2" opacity="0.9" />
            {/* Hair hint */}
            <path d="M176,38 Q172,20 185,12 Q200,6 215,12 Q228,20 224,38" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            {/* Neck */}
            <rect x="190" y="72" width="20" height="22" rx="6" fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
            {/* Torso */}
            <path
              d="M155,94 Q148,94 146,108 L142,155 Q140,170 145,185 L140,210 Q138,228 155,240 L168,250 Q180,258 200,258 Q220,258 232,250 L245,240 Q262,228 260,210 L255,185 Q260,170 258,155 L254,108 Q252,94 245,94 Z"
              fill="url(#glowGrad)" stroke="currentColor" strokeWidth="2" opacity="0.85"
            />
            {/* Left arm */}
            <path
              d="M155,98 Q138,103 134,125 L128,175 Q126,195 130,208 L136,235 Q140,245 144,243 L148,235 Q152,218 150,198 L154,158 Q156,128 155,98 Z"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="1.5" opacity="0.75"
            />
            {/* Right arm */}
            <path
              d="M245,98 Q262,103 266,125 L272,175 Q274,195 270,208 L264,235 Q260,245 256,243 L252,235 Q248,218 250,198 L246,158 Q244,128 245,98 Z"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="1.5" opacity="0.75"
            />
            {/* Left leg */}
            <path
              d="M172,256 L166,315 Q163,345 165,375 L167,425 Q168,443 176,448 L186,448 Q191,443 189,425 L187,375 Q189,345 191,315 L196,265"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="2" opacity="0.8"
            />
            {/* Right leg */}
            <path
              d="M228,256 L234,315 Q237,345 235,375 L233,425 Q232,443 224,448 L214,448 Q209,443 211,425 L213,375 Q211,345 209,315 L204,265"
              fill="url(#bodyGrad)" stroke="currentColor" strokeWidth="2" opacity="0.8"
            />
            {/* Center line */}
            <line x1="200" y1="94" x2="200" y2="256" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
          </g>
        )}
      </g>

      {/* Measurement labels with connection lines (15 Nokta) */}
      {(Object.keys(labelPositions) as ValidMeasurementKey[]).map((key) => {
        const pos = labelPositions[key];
        const meta = MEASUREMENT_LABELS[key];
        const value = measurements[key];
        const hasValue = typeof value === 'number' && value > 0;
        const isSelected = selectedKey === key;
        const dotColor = isSelected ? '#ef4444' : hasValue ? '#f59e0b' : '#9ca3af';

        return (
          <g key={key} className="cursor-pointer group" onClick={() => onMeasurementClick(key)}>
            {/* Connection line */}
            <line
              x1={pos.anchor === 'left' ? pos.x + 100 : pos.x}
              y1={pos.y + 12}
              x2={pos.lineToX}
              y2={pos.lineToY}
              stroke={dotColor}
              strokeWidth={isSelected ? 1.8 : 1}
              strokeDasharray={isSelected ? 'none' : '3 2'}
              opacity={isSelected ? 1 : 0.65}
            />
            {/* Dot on body */}
            <circle cx={pos.lineToX} cy={pos.lineToY} r={isSelected ? 6 : 4} fill={dotColor} opacity={0.95}>
              <animate attributeName="r" values={isSelected ? '5.5;7;5.5' : '4;5.5;4'} dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Label background */}
            <rect
              x={pos.x}
              y={pos.y}
              width={100}
              height={24}
              rx="7"
              fill={
                isSelected
                  ? 'rgba(239,68,68,0.18)'
                  : hasValue
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(156,163,175,0.1)'
              }
              stroke={
                isSelected
                  ? '#ef4444'
                  : hasValue
                    ? 'rgba(245,158,11,0.5)'
                    : 'rgba(156,163,175,0.25)'
              }
              strokeWidth={isSelected ? 1.5 : 1}
              className="transition-all group-hover:scale-105"
            />
            {/* Label text */}
            <text
              x={pos.x + 6}
              y={pos.y + 16}
              className="text-[8.5px] font-bold fill-current select-none"
              style={{
                fill: isSelected ? '#ef4444' : hasValue ? '#d97706' : '#9ca3af',
              }}
            >
              {meta.label}: {hasValue ? `${value} cm` : '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

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
  const { hasAccess, loading: accessLoading } = useFeatureAccess();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ValidMeasurementKey | null>(null);
  const [measurementCategory, setMeasurementCategory] = useState<'all' | 'upper' | 'arms' | 'core' | 'legs'>('all');
  const [copied, setCopied] = useState(false);

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

  // Load profile from Firebase
  useEffect(() => {
    if (!user) return;
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
        }
      })
      .catch(err => {
        console.warn('Profile load notice:', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

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
    return analyzeBodyProportions(heightCm, weightKg, gender, measurements);
  }, [heightCm, weightKg, gender, measurements]);

  // Save handler
  const handleSave = useCallback(async () => {
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
      toast.success('Beden profiliniz kaydedildi!');
    } catch (err: any) {
      console.error('Profile save error:', err);
      toast.error('Kaydetme sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  }, [user, gender, age, heightCm, weightKg, targetWeightKg, activityLevel, measurements]);

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

  if (accessLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMeta = selectedKey ? MEASUREMENT_LABELS[selectedKey] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/calorie-details"
            className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-amber-400/20 transition-colors shadow-sm shrink-0"
            title="Kalori Raporuna Dön"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <FaHeartbeat className="text-rose-500 text-xl" />
              Beden Profili
            </h1>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              15 bölge mezura ölçümü, metabolizma analizi ve kalori açığı motoru
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-400 text-stone-950 font-black text-xs hover:bg-amber-300 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <FaSave className={`text-sm ${saving ? 'animate-spin' : ''}`} />
          {saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
        </button>
      </div>

      {/* 2 Ana Sekme ve Sağ Tarafta BMI / Vücut Göstergesi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-stone-200/50 dark:border-zinc-700/50 w-fit">
          {[
            { key: 'profile' as ActiveTab, label: 'Beden Profili', icon: <FaMale className="text-xs" /> },
            { key: 'deficit' as ActiveTab, label: 'Kalori Açığı & Hedef', icon: <FaBullseye className="text-xs" /> },
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
                Erkek Modeli
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
                Kadın Modeli
              </button>
            </div>

            {/* İki Sütunlu Ana Alan: Sol Vücut SVG | Sağ Bilgiler ve 15 Ölçüm */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sol: Vücut SVG */}
              <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500 dark:text-zinc-400 tracking-wider">
                    <FaTape className="text-sm text-amber-500" />
                    Vücut Noktaları (15 Bölge)
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Tıkla & Ölç
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-4 leading-relaxed">
                  Vücut üzerindeki noktalara tıklayarak ilgili mezura ölçüsünü hızlıca girebilirsiniz.
                </p>

                <HumanBodySVG
                  gender={gender}
                  measurements={measurements}
                  selectedKey={selectedKey}
                  onMeasurementClick={key => setSelectedKey(key)}
                />

                {/* Tıklanan Noktanın Hızlı Düzenleme Kutusu (SVG Altı) */}
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
                    Kişisel Beden Bilgileri
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <NumberInput label="Yaş" value={age} onChange={setAge} unit="yıl" min={10} max={100} icon={<span>🎂</span>} />
                    <NumberInput label="Boy" value={heightCm} onChange={setHeightCm} unit="cm" min={100} max={250} icon={<FaRuler className="text-[10px]" />} />
                    <NumberInput label="Kilo" value={weightKg} onChange={setWeightKg} unit="kg" min={30} max={300} step={0.1} icon={<FaWeight className="text-[10px]" />} />
                    <NumberInput label="Hedef" value={targetWeightKg} onChange={setTargetWeightKg} unit="kg" min={30} max={250} step={0.1} icon={<FaBullseye className="text-[10px]" />} />
                  </div>

                  <div className="mt-3">
                    <label className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <FaRunning className="text-[10px]" />
                      Günlük Aktivite Seviyesi
                    </label>
                    <select
                      value={activityLevel}
                      onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(level => (
                        <option key={level} value={level}>
                          {ACTIVITY_LABELS[level]}
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
                      Mezura Ölçümleri (15 Bölge)
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
                    Bölgesel Oran Analizi & Kişisel Spor Tavsiyeleri
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">
                    Ölçümlerinize ve spor hekimliği standartlarına (V-Taper, WHtR, Simetri) göre kişiselleştirilmiş analiz
                  </p>
                </div>

                {/* Hızlı Rehber Hapları */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-stone-400 mr-1">Rehberler:</span>
                  {(['shoulderCm', 'chestCm', 'waistCm', 'upperArmRightCm', 'lowerAbdomenCm', 'thighRightCm', 'calfRightCm'] as ValidMeasurementKey[]).map(key => (
                    <button
                      key={key}
                      onClick={() => setGuideModalKey(key)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-amber-400 hover:text-stone-950 dark:hover:bg-amber-400 dark:hover:text-stone-950 text-[11px] font-bold text-stone-600 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                      {MEASUREMENT_LABELS[key]?.emoji} {MEASUREMENT_LABELS[key]?.label}
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
                      V-Taper (Adonis Oranı)
                    </span>
                    {proportions.vTaper && (
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        proportions.vTaper.status === 'ideal'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : proportions.vTaper.status === 'good'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {proportions.vTaper.ratio} (Hedef: 1.618)
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
                      Omuz ve bel ölçünüzü girerek V-Taper Adonis oranınızı hesaplayın.
                    </p>
                  )}
                </div>

                {/* 2. Bel / Boy Oranı (WHtR) */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <FaHeartbeat className="text-rose-500" />
                      Bel / Boy (WHtR)
                    </span>
                    {proportions.waistToHeight && (
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        proportions.waistToHeight.status === 'healthy'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {proportions.waistToHeight.ratio} (İdeal &lt; 0.50)
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
                      Bel ve boy bilginiz girildiğinde iç organ (visseral) yağlanma riskiniz teşhis edilir.
                    </p>
                  )}
                </div>

                {/* 3. Kol ve Bacak Simetrisi */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <FaBalanceScale className="text-blue-500" />
                      Beden Simetrisi
                    </span>
                    {proportions.armSymmetry && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                        {proportions.armSymmetry.hasAsymmetry ? '⚠️ Asimetri' : '✓ Dengeli'}
                      </span>
                    )}
                  </div>
                  {proportions.armSymmetry ? (
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                        Kol Farkı: {proportions.armSymmetry.diffCm} cm {proportions.legSymmetry ? `| Bacak Farkı: ${proportions.legSymmetry.diffCm} cm` : ''}
                      </div>
                      <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                        {proportions.armSymmetry.advice}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Sağ ve sol kol ölçülerinizi girerek kas asimetrinizi kontrol edin.
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
                    İncelmesi &amp; Sıkılaşması Gereken Bölgeler
                  </div>
                  {proportions.priorityActions.reduceAreas.length > 0 ? (
                    <div className="space-y-2.5">
                      {proportions.priorityActions.reduceAreas.map((area, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-rose-200/50 dark:border-zinc-800 text-xs">
                          <div className="font-black text-stone-900 dark:text-white flex items-center justify-between">
                            <span>{area.name}</span>
                            <span className="text-[10px] text-rose-500 font-bold">Hedef: İncelme</span>
                          </div>
                          <p className="text-stone-500 dark:text-zinc-400 text-[11px] mt-0.5">{area.reason}</p>
                          <div className="mt-1.5 p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                            💡 Reçete: {area.priorityAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      Tebrikler! Bel veya karın bölgenizde aşırı yağlanma tespit edilmedi. Mevcut kilonuzu ve formunuzu koruyun.
                    </p>
                  )}
                </div>

                {/* Büyütülmesi Gerekenler */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase mb-3">
                    <FaArrowUp />
                    Büyütülmesi &amp; Kas Eklenmesi Gereken Bölgeler
                  </div>
                  {proportions.priorityActions.growAreas.length > 0 ? (
                    <div className="space-y-2.5">
                      {proportions.priorityActions.growAreas.map((area, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200/50 dark:border-zinc-800 text-xs">
                          <div className="font-black text-stone-900 dark:text-white flex items-center justify-between">
                            <span>{area.name}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">Hedef: Hipertrofi</span>
                          </div>
                          <p className="text-stone-500 dark:text-zinc-400 text-[11px] mt-0.5">{area.reason}</p>
                          <div className="mt-1.5 p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            ⚡ Reçete: {area.priorityAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                      Ölçümleriniz dengeli dağılmış durumda. Tüm vücut hipertrofi programı ile genel kas kütlenizi artırmaya devam edin.
                    </p>
                  )}
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
                emuAI ile Yemek Analiz Et
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* Modal Başlığı */}
                <div className="p-5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-amber-400/10">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{MEASUREMENT_LABELS[guideModalKey]?.emoji}</span>
                    <div>
                      <h3 className="text-lg font-black text-stone-900 dark:text-white">
                        {guide.regionName} — Bilimsel Gelişim &amp; İnceltme Rehberi
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">
                        Hedef Kaslar: <span className="font-bold text-stone-700 dark:text-zinc-200">{guide.targetMuscles}</span>
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
                            <div className="flex items-center justify-between font-bold text-stone-900 dark:text-white">
                              <span>{ex.name}</span>
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-md">
                                {ex.setsReps}
                              </span>
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
                            <span className="font-bold text-stone-900 dark:text-white block">{ex.name}</span>
                            <span className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 block">{ex.focus}</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
    </div>
  );
}
