import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaSun,
  FaMoon,
  FaBed,
  FaUserShield,
  FaSyncAlt,
  FaCalendarDay,
  FaChevronLeft,
  FaChevronRight,
  FaMagic,
  FaClock,
  FaSlidersH,
  FaStar,
  FaCheck
} from 'react-icons/fa';
import { useShift } from '../../context/ShiftContext';
import { useLanguage } from '../../context/LanguageContext';
import { showMarqueeToast } from '../MarqueeToast';
import { useAppSound } from '../../context/SoundContext';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import type { ShiftType } from '../../utils/shiftLogic';

interface ShiftSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export default function ShiftSettingsModal({ isOpen, onClose, initialDate }: ShiftSettingsModalProps) {
  const {
    shiftSettings,
    getShiftInfo,
    setDayOverride,
    setMultipleDayOverrides,
    setWeeklyPattern,
    setCustomCycle,
    realignCycle,
    updateSettings
  } = useShift();
  const { language } = useLanguage();
  const { playSuccess } = useAppSound();

  const dateLocale = language === 'tr' ? tr : enUS;

  // Active tab state: 'weekly' (manual week builder), 'modes' (preset cycle modes), 'override' (single date), 'hours' (custom times)
  const [activeTab, setActiveTab] = useState<'weekly' | 'modes' | 'override' | 'hours'>('weekly');

  // Week navigation date (always start of week Monday)
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(() =>
    startOfWeek(initialDate || new Date(), { weekStartsOn: 1 })
  );

  // Single day override state
  const [overrideDate, setOverrideDate] = useState<Date>(initialDate || new Date());

  // Custom cycle state for N-day cycle builder
  const [cycleInput, setCycleInput] = useState<ShiftType[]>(
    shiftSettings.customCycle && shiftSettings.customCycle.length > 0
      ? shiftSettings.customCycle
      : ['Sabah', 'Sabah', 'Akşam', 'Akşam', 'Tatil', 'Tatil']
  );

  // Custom hours state
  const [sabahStart, setSabahStart] = useState(shiftSettings.customHours?.Sabah?.start || '08:00');
  const [sabahEnd, setSabahEnd] = useState(shiftSettings.customHours?.Sabah?.end || '18:00');
  const [aksamStart, setAksamStart] = useState(shiftSettings.customHours?.Akşam?.start || '16:00');
  const [aksamEnd, setAksamEnd] = useState(shiftSettings.customHours?.Akşam?.end || '00:00');

  if (!isOpen) return null;

  const currentMon = startOfWeek(weekAnchorDate, { weekStartsOn: 1 });
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(currentMon, i));

  // --- Handlers ---
  const handleSetDayShiftForWeek = async (date: Date, type: ShiftType) => {
    try {
      await setDayOverride(date, type);
      playSuccess();
    } catch {
      showMarqueeToast({ message: language === 'tr' ? 'Hata oluştu' : 'Error occurred', type: 'error' });
    }
  };

  const handleApplyWeekPreset = async (presetType: 'all-sabah' | 'all-aksam' | 'weekday-sabah' | 'clear') => {
    try {
      const overridesMap: Record<string, ShiftType | 'default'> = {};
      weekDays.forEach((d, idx) => {
        const dStr = format(d, 'yyyy-MM-dd');
        if (presetType === 'all-sabah') {
          overridesMap[dStr] = 'Sabah';
        } else if (presetType === 'all-aksam') {
          overridesMap[dStr] = 'Akşam';
        } else if (presetType === 'weekday-sabah') {
          overridesMap[dStr] = idx < 5 ? 'Sabah' : 'Tatil';
        } else if (presetType === 'clear') {
          overridesMap[dStr] = 'default';
        }
      });
      await setMultipleDayOverrides(overridesMap);
      playSuccess();
      showMarqueeToast({
        message: language === 'tr' ? 'Haftalık vardiya planı güncellendi' : 'Weekly shift plan updated',
        type: 'success'
      });
    } catch {
      showMarqueeToast({ message: language === 'tr' ? 'Hata oluştu' : 'Error occurred', type: 'error' });
    }
  };

  const handleSaveWeekAsTemplate = async () => {
    try {
      const pattern: [ShiftType, ShiftType, ShiftType, ShiftType, ShiftType, ShiftType, ShiftType] = [
        getShiftInfo(weekDays[0]).type,
        getShiftInfo(weekDays[1]).type,
        getShiftInfo(weekDays[2]).type,
        getShiftInfo(weekDays[3]).type,
        getShiftInfo(weekDays[4]).type,
        getShiftInfo(weekDays[5]).type,
        getShiftInfo(weekDays[6]).type
      ];
      await setWeeklyPattern(pattern);
      playSuccess();
      showMarqueeToast({
        message: language === 'tr' ? 'Bu hafta genel çalışma şablonu yapıldı!' : 'Set as default weekly template!',
        type: 'success'
      });
    } catch {
      showMarqueeToast({ message: language === 'tr' ? 'Hata oluştu' : 'Error occurred', type: 'error' });
    }
  };

  const handlePlanModeChange = async (mode: '3-person' | '2-person' | 'custom-weekly' | 'custom-cycle') => {
    try {
      await updateSettings({ planMode: mode });
      playSuccess();
      showMarqueeToast({
        message: language === 'tr' ? 'Çalışma planı modu güncellendi' : 'Work plan mode updated',
        type: 'success'
      });
    } catch {
      showMarqueeToast({ message: language === 'tr' ? 'Hata oluştu' : 'Error occurred', type: 'error' });
    }
  };

  const handleRealign = async (type: 'Sabah' | 'Akşam' | 'Tatil' | 'Sabahçı' | 'Akşamcı') => {
    try {
      await realignCycle(overrideDate, type);
      playSuccess();
      showMarqueeToast({
        message: language === 'tr' ? 'Döngü başarıyla hizalandı' : 'Cycle aligned successfully',
        type: 'success'
      });
    } catch {
      showMarqueeToast({ message: language === 'tr' ? 'Hata oluştu' : 'Error occurred', type: 'error' });
    }
  };

  const handleSaveHours = async () => {
    try {
      await updateSettings({
        customHours: {
          Sabah: { start: sabahStart, end: sabahEnd },
          Akşam: { start: aksamStart, end: aksamEnd },
          Nöbet: { start: '14:00', end: '02:00' }
        }
      });
      playSuccess();
      showMarqueeToast({
        message: language === 'tr' ? 'Vardiya saatleri kaydedildi' : 'Shift hours saved',
        type: 'success'
      });
    } catch {
      showMarqueeToast({ message: language === 'tr' ? 'Hata oluştu' : 'Error occurred', type: 'error' });
    }
  };

  const getShiftBadgeStyle = (type: ShiftType) => {
    switch (type) {
      case 'Sabah':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700/50';
      case 'Akşam':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/50';
      case 'Nöbet':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700/50';
      case 'Tatil':
      default:
        return 'bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-400 border-stone-300 dark:border-zinc-700';
    }
  };

  const renderShiftIcon = (type: ShiftType) => {
    switch (type) {
      case 'Sabah': return <FaSun className="text-amber-500" />;
      case 'Akşam': return <FaMoon className="text-indigo-500" />;
      case 'Nöbet': return <FaUserShield className="text-rose-500" />;
      case 'Tatil': default: return <FaBed className="text-stone-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full max-w-2xl bg-white/95 dark:bg-zinc-900/95 rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 dark:border-zinc-800/80 flex flex-col max-h-[90vh] sm:max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/70 dark:bg-zinc-950/40">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-800 dark:from-zinc-100 dark:via-indigo-200 dark:to-zinc-300 text-transparent bg-clip-text">
                <FaMagic className="text-indigo-500" />
                <span>{language === 'tr' ? 'Çalışma Planı Oluşturucu' : 'Work Schedule Builder'}</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 font-medium">
                {language === 'tr' ? 'Vardiya saatlerini ve haftalık planını özgürce ayarla' : 'Customize shift hours and weekly schedules freely'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-zinc-800 text-stone-500 hover:text-rose-500 dark:text-zinc-400 transition-all"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-stone-200 dark:border-zinc-800 bg-stone-100/50 dark:bg-zinc-950/20 p-1 sm:p-1.5 overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'weekly'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-stone-200 dark:border-zinc-700'
                : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50'
                }`}
            >
              <FaCalendarDay size={13} />
              <span>{language === 'tr' ? 'Haftalık Plan (Elle)' : 'Weekly Builder'}</span>
            </button>

            <button
              onClick={() => setActiveTab('modes')}
              className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'modes'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-stone-200 dark:border-zinc-700'
                : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50'
                }`}
            >
              <FaSlidersH size={13} />
              <span>{language === 'tr' ? 'Plan Modu' : 'Plan Modes'}</span>
            </button>

            <button
              onClick={() => setActiveTab('override')}
              className={`flex-1 min-w-[100px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'override'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-stone-200 dark:border-zinc-700'
                : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50'
                }`}
            >
              <FaSyncAlt size={12} />
              <span>{language === 'tr' ? 'Güne Özel' : 'Single Day'}</span>
            </button>

            <button
              onClick={() => setActiveTab('hours')}
              className={`flex-1 min-w-[100px] py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'hours'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-stone-200 dark:border-zinc-700'
                : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50'
                }`}
            >
              <FaClock size={12} />
              <span>{language === 'tr' ? 'Saatler' : 'Hours'}</span>
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* TAB 1: WEEKLY MANUAL BUILDER */}
            {activeTab === 'weekly' && (
              <div className="space-y-5">
                {/* Week Navigation Header */}
                <div className="flex items-center justify-between bg-stone-50 dark:bg-zinc-950/40 p-3 rounded-2xl border border-stone-200/70 dark:border-zinc-800">
                  <button
                    onClick={() => setWeekAnchorDate(prev => subWeeks(prev, 1))}
                    className="p-2 text-stone-600 hover:bg-stone-200 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    title="Önceki Hafta"
                  >
                    <FaChevronLeft size={14} />
                  </button>

                  <div className="text-center">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {language === 'tr' ? 'Seçili Hafta' : 'Selected Week'}
                    </p>
                    <h4 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-zinc-100">
                      {format(weekDays[0], 'd MMMM', { locale: dateLocale })} - {format(weekDays[6], 'd MMMM yyyy', { locale: dateLocale })}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setWeekAnchorDate(new Date())}
                      className="px-2.5 py-1 text-[11px] font-bold text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-stone-300 dark:border-zinc-700"
                    >
                      {language === 'tr' ? 'Bu Hafta' : 'This Week'}
                    </button>
                    <button
                      onClick={() => setWeekAnchorDate(prev => addWeeks(prev, 1))}
                      className="p-2 text-stone-600 hover:bg-stone-200 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                      title="Sonraki Hafta"
                    >
                      <FaChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Quick Presets Toolbar */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                    {language === 'tr' ? 'Hızlı Haftalık Hazır Şablonlar' : 'Quick Week Presets'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleApplyWeekPreset('weekday-sabah')}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900/50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FaSun size={11} />
                      <span>{language === 'tr' ? 'Hafta İçi Sabah' : 'Weekdays Morning'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyWeekPreset('all-sabah')}
                      className="p-2 rounded-xl bg-amber-100/50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900/30 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FaSun size={11} />
                      <span>{language === 'tr' ? 'Tüm Hafta Sabah' : 'All Morning'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyWeekPreset('all-aksam')}
                      className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FaMoon size={11} />
                      <span>{language === 'tr' ? 'Tüm Hafta Akşam' : 'All Evening'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyWeekPreset('clear')}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-bold border border-stone-300 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FaSyncAlt size={10} />
                      <span>{language === 'tr' ? 'Sıfırla (Döngüye Dön)' : 'Clear Week'}</span>
                    </button>
                  </div>
                </div>

                {/* 7-Day Interactive Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                      {language === 'tr' ? 'Haftanın Günlerini Elle Ayarla' : 'Adjust Days Manually'}
                    </span>
                    <button
                      onClick={handleSaveWeekAsTemplate}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <FaStar className="text-amber-500" size={11} />
                      <span>{language === 'tr' ? 'Bu Haftayı Genel Şablon Yap' : 'Save as Default Template'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
                    {weekDays.map(date => {
                      const shiftInfo = getShiftInfo(date);
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      const dayName = format(date, 'EEEE', { locale: dateLocale });
                      const dayNum = format(date, 'd MMM', { locale: dateLocale });

                      return (
                        <div
                          key={date.toISOString()}
                          className={`p-3 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between ${isToday
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-zinc-950/40 border-stone-200 dark:border-zinc-800/80'
                            }`}
                        >
                          {/* Day header */}
                          <div className="text-center pb-1 border-b border-stone-100 dark:border-zinc-800">
                            <span className="text-[10px] font-bold uppercase text-stone-500 dark:text-zinc-400 block">
                              {dayName.substring(0, 3)}
                            </span>
                            <span className={`text-xs font-extrabold block ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-900 dark:text-zinc-200'}`}>
                              {dayNum}
                            </span>
                          </div>

                          {/* Current Shift Badge */}
                          <div className="my-2 flex flex-col items-center justify-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${getShiftBadgeStyle(shiftInfo.type)}`}>
                              {renderShiftIcon(shiftInfo.type)}
                              <span>{shiftInfo.type}</span>
                            </span>
                            {shiftInfo.startTime && (
                              <span className="text-[9px] text-stone-400 dark:text-zinc-500 font-medium">
                                {shiftInfo.startTime}-{shiftInfo.endTime}
                              </span>
                            )}
                          </div>

                          {/* Shift Quick Toggles */}
                          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-stone-100 dark:border-zinc-800">
                            {(['Sabah', 'Akşam', 'Nöbet', 'Tatil'] as ShiftType[]).map(st => (
                              <button
                                key={st}
                                onClick={() => handleSetDayShiftForWeek(date, st)}
                                className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all text-center ${shiftInfo.type === st
                                  ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                                  : 'bg-stone-100 dark:bg-zinc-800/60 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300'
                                  }`}
                              >
                                {st === 'Sabah' ? 'Sab' : st === 'Akşam' ? 'Akş' : st === 'Nöbet' ? 'Nöb' : 'Tat'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PLAN MODES */}
            {activeTab === 'modes' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                  {language === 'tr' ? 'Çalışma Düzeni & Otomatik Şablonlar' : 'Work Arrangement & Auto Patterns'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode 1: Custom Weekly Template */}
                  <button
                    onClick={() => handlePlanModeChange('custom-weekly')}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${shiftSettings.planMode === 'custom-weekly'
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500 shadow-md'
                      : 'bg-stone-50 dark:bg-zinc-950/20 border-stone-200 dark:border-zinc-800 hover:bg-stone-100'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-stone-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                        <FaStar className="text-amber-500" />
                        <span>{language === 'tr' ? 'Özel Haftalık Şablon' : 'Custom Weekly Template'}</span>
                      </span>
                      {shiftSettings.planMode === 'custom-weekly' && <FaCheck className="text-indigo-500" />}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5">
                      {language === 'tr'
                        ? 'Her hafta aynı kalan Pazartesi-Pazar 7 günlük vardiya düzeniniz.'
                        : 'Repeating Monday to Sunday 7-day schedule.'}
                    </p>
                  </button>

                  {/* Mode 2: 3-Person Shift */}
                  <button
                    onClick={() => handlePlanModeChange('3-person')}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${shiftSettings.planMode === '3-person'
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500 shadow-md'
                      : 'bg-stone-50 dark:bg-zinc-950/20 border-stone-200 dark:border-zinc-800 hover:bg-stone-100'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-stone-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                        <FaSyncAlt className="text-indigo-500" />
                        <span>{language === 'tr' ? '3 Kişilik Vardiya (4-2)' : '3-Person Shift (4-2)'}</span>
                      </span>
                      {shiftSettings.planMode === '3-person' && <FaCheck className="text-indigo-500" />}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5">
                      {language === 'tr'
                        ? '4 Gün Sabah, 2 Gün Tatil, 4 Gün Akşam, 2 Gün Tatil döngüsü.'
                        : '4 Days Morning, 2 Off, 4 Days Evening, 2 Off cycle.'}
                    </p>
                  </button>

                  {/* Mode 3: 2-Person Shift */}
                  <button
                    onClick={() => handlePlanModeChange('2-person')}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${shiftSettings.planMode === '2-person'
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500 shadow-md'
                      : 'bg-stone-50 dark:bg-zinc-950/20 border-stone-200 dark:border-zinc-800 hover:bg-stone-100'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-stone-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                        <FaUserShield className="text-indigo-500" />
                        <span>{language === 'tr' ? '2 Kişilik Vardiya (Haftalık)' : '2-Person Shift (Weekly)'}</span>
                      </span>
                      {shiftSettings.planMode === '2-person' && <FaCheck className="text-indigo-500" />}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5">
                      {language === 'tr'
                        ? 'Haftalık dönüşüm. Hafta içi 5 gün, hafta sonu 1 nöbet, 1 tatil.'
                        : 'Weekly rotation. 5 weekdays work, weekend 1 on-call, 1 off.'}
                    </p>
                  </button>

                  {/* Mode 4: Custom Cycle */}
                  <button
                    onClick={() => handlePlanModeChange('custom-cycle')}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${shiftSettings.planMode === 'custom-cycle'
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500 shadow-md'
                      : 'bg-stone-50 dark:bg-zinc-950/20 border-stone-200 dark:border-zinc-800 hover:bg-stone-100'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-stone-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                        <FaSlidersH className="text-indigo-500" />
                        <span>{language === 'tr' ? 'Özel Gün Döngüsü (N-Gün)' : 'Custom Cycle (N-Day)'}</span>
                      </span>
                      {shiftSettings.planMode === 'custom-cycle' && <FaCheck className="text-indigo-500" />}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5">
                      {language === 'tr'
                        ? 'Örn: 2 Sabah, 2 Akşam, 2 Tatil veya istediğin uzunlukta özel döngü.'
                        : 'Custom N-day repeating pattern (e.g. 2 Morning, 2 Evening, 2 Off).'}
                    </p>
                  </button>
                </div>

                {/* Custom Cycle Configurator if custom-cycle is chosen */}
                {shiftSettings.planMode === 'custom-cycle' && (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 space-y-3">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                      {language === 'tr' ? 'Döngü Dizilimi Oluştur:' : 'Build Custom Cycle Sequence:'}
                    </span>
                    <div className="flex flex-wrap gap-2 items-center">
                      {cycleInput.map((st, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-zinc-700">
                          <span className="text-xs font-bold">{idx + 1}. {st}</span>
                          <button
                            onClick={() => {
                              const next = cycleInput.filter((_, i) => i !== idx);
                              setCycleInput(next);
                            }}
                            className="text-stone-400 hover:text-rose-500 text-xs ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-1">
                        {(['Sabah', 'Akşam', 'Nöbet', 'Tatil'] as ShiftType[]).map(st => (
                          <button
                            key={st}
                            onClick={() => setCycleInput([...cycleInput, st])}
                            className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors"
                          >
                            + {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setCustomCycle(cycleInput)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      {language === 'tr' ? 'Döngüyü Kaydet ve Uygula' : 'Save & Apply Cycle'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SINGLE DAY OVERRIDE */}
            {activeTab === 'override' && (
              <div className="space-y-5">
                <div className="p-4 bg-stone-50 dark:bg-zinc-950/20 border border-stone-200 dark:border-zinc-800 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FaCalendarDay className="text-indigo-500" />
                    <span>{language === 'tr' ? 'Değiştirilecek Tarih' : 'Date to Override'}</span>
                  </label>
                  <input
                    type="date"
                    value={format(overrideDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      if (e.target.value) setOverrideDate(new Date(e.target.value));
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold shadow-sm"
                  />
                  <p className="text-xs text-stone-500 dark:text-zinc-400 italic">
                    {format(overrideDate, 'd MMMM yyyy, EEEE', { locale: dateLocale })}
                  </p>
                </div>

                {/* Day Override Action Buttons */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {language === 'tr' ? 'Güne Özel Vardiya Seç' : 'Choose Shift for Selected Day'}
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleSetDayShiftForWeek(overrideDate, 'Sabah')}
                      className="py-3 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold rounded-2xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <FaSun size={14} />
                      <span>{language === 'tr' ? 'Sabah Vardiyası' : 'Morning Shift'}</span>
                    </button>

                    <button
                      onClick={() => handleSetDayShiftForWeek(overrideDate, 'Akşam')}
                      className="py-3 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 font-bold rounded-2xl border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <FaMoon size={14} />
                      <span>{language === 'tr' ? 'Akşam Vardiyası' : 'Evening Shift'}</span>
                    </button>

                    <button
                      onClick={() => handleSetDayShiftForWeek(overrideDate, 'Nöbet')}
                      className="py-3 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 font-bold rounded-2xl border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <FaUserShield size={14} />
                      <span>{language === 'tr' ? 'Nöbet' : 'On-call'}</span>
                    </button>

                    <button
                      onClick={() => handleSetDayShiftForWeek(overrideDate, 'Tatil')}
                      className="py-3 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 font-bold rounded-2xl border border-stone-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <FaBed size={14} />
                      <span>{language === 'tr' ? 'Tatil / İzin' : 'Off / Holiday'}</span>
                    </button>

                    <button
                      onClick={() => setDayOverride(overrideDate, 'default')}
                      className="col-span-2 py-2.5 px-4 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 font-bold rounded-2xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <FaSyncAlt size={12} />
                      <span>{language === 'tr' ? 'Varsayılan Döngüye Sıfırla' : 'Reset to Default Cycle'}</span>
                    </button>
                  </div>
                </div>

                {/* Re-align cycle section */}
                <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {language === 'tr' ? 'Döngü Başlangıcını Bu Tarihe Hizala' : 'Re-align Cycle from This Date'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRealign('Sabah')}
                      className="p-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/30 rounded-xl border border-amber-200/60"
                    >
                      {language === 'tr' ? 'Sabah Başlat' : 'Start Morning'}
                    </button>
                    <button
                      onClick={() => handleRealign('Akşam')}
                      className="p-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60"
                    >
                      {language === 'tr' ? 'Akşam Başlat' : 'Start Evening'}
                    </button>
                    <button
                      onClick={() => handleRealign('Tatil')}
                      className="p-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 dark:text-zinc-300 dark:bg-zinc-800 rounded-xl border border-stone-200"
                    >
                      {language === 'tr' ? 'Tatil Başlat' : 'Start Holiday'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SHIFT HOURS */}
            {activeTab === 'hours' && (
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                  {language === 'tr' ? 'Vardiya Başlangıç ve Bitiş Saatleri' : 'Shift Start & End Hours'}
                </h4>

                <div className="space-y-4">
                  {/* Sabah hours */}
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-xs uppercase">
                      <FaSun className="text-amber-500" />
                      <span>{language === 'tr' ? 'Sabah Vardiyası Saatleri' : 'Morning Shift Hours'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 block mb-1">
                          {language === 'tr' ? 'Başlangıç' : 'Start'}
                        </label>
                        <input
                          type="time"
                          value={sabahStart}
                          onChange={(e) => setSabahStart(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 block mb-1">
                          {language === 'tr' ? 'Bitiş' : 'End'}
                        </label>
                        <input
                          type="time"
                          value={sabahEnd}
                          onChange={(e) => setSabahEnd(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Akşam hours */}
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 text-xs uppercase">
                      <FaMoon className="text-indigo-500" />
                      <span>{language === 'tr' ? 'Akşam Vardiyası Saatleri' : 'Evening Shift Hours'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 block mb-1">
                          {language === 'tr' ? 'Başlangıç' : 'Start'}
                        </label>
                        <input
                          type="time"
                          value={aksamStart}
                          onChange={(e) => setAksamStart(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 block mb-1">
                          {language === 'tr' ? 'Bitiş' : 'End'}
                        </label>
                        <input
                          type="time"
                          value={aksamEnd}
                          onChange={(e) => setAksamEnd(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveHours}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 font-bold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <FaClock size={13} />
                    <span>{language === 'tr' ? 'Saat Ayarlarını Kaydet' : 'Save Shift Hours'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-950/40 border-t border-stone-200/60 dark:border-zinc-800/60 flex justify-between items-center">
            <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium">
              {language === 'tr' ? 'Değişiklikler anında takvime yansır' : 'Changes apply immediately'}
            </span>
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 shadow-md transition-all active:scale-95"
            >
              {language === 'tr' ? 'Tamam' : 'Done'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

