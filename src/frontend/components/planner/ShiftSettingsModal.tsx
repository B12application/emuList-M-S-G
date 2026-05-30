import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSun, FaMoon, FaBed, FaUserShield, FaSyncAlt, FaCalendarDay } from 'react-icons/fa';
import { useShift } from '../../context/ShiftContext';
import { useLanguage } from '../../context/LanguageContext';
import { showMarqueeToast } from '../MarqueeToast';
import { useAppSound } from '../../context/SoundContext';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import type { ShiftType } from '../../utils/shiftLogic';

interface ShiftSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export default function ShiftSettingsModal({ isOpen, onClose, initialDate }: ShiftSettingsModalProps) {
  const { shiftSettings, setDayOverride, realignCycle, updateSettings } = useShift();
  const { language } = useLanguage();
  const { playSuccess } = useAppSound();

  const dateLocale = language === 'tr' ? tr : enUS;
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());

  if (!isOpen) return null;

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const activeOverride = shiftSettings.overrides?.[dateStr];

  const handlePlanModeChange = async (mode: '3-person' | '2-person') => {
    try {
      await updateSettings({ planMode: mode });
      playSuccess();
      showMarqueeToast({
        message: language === 'tr'
          ? `Vardiya düzeni ${mode === '3-person' ? '3 Kişilik' : '2 Kişilik'} olarak güncellendi`
          : `Shift plan changed to ${mode === '3-person' ? '3-Person' : '2-Person'}`,
        type: 'success'
      });
    } catch (e) {
      showMarqueeToast({
        message: language === 'tr' ? 'Hata oluştu' : 'Error occurred',
        type: 'error'
      });
    }
  };

  const handleRealign = async (type: 'Sabah' | 'Akşam' | 'Tatil' | 'Sabahçı' | 'Akşamcı') => {
    try {
      await realignCycle(selectedDate, type);
      playSuccess();
      showMarqueeToast({
        message: language === 'tr'
          ? `Döngü hizalandı: ${format(selectedDate, 'd MMMM yyyy', { locale: dateLocale })}`
          : `Cycle aligned: ${format(selectedDate, 'MMMM d, yyyy', { locale: dateLocale })}`,
        type: 'success'
      });
    } catch (e) {
      showMarqueeToast({
        message: language === 'tr' ? 'Hata oluştu' : 'Error occurred',
        type: 'error'
      });
    }
  };

  const handleOverride = async (type: ShiftType | 'default') => {
    try {
      await setDayOverride(selectedDate, type);
      playSuccess();
      showMarqueeToast({
        message: language === 'tr'
          ? `${format(selectedDate, 'd MMMM', { locale: dateLocale })} için vardiya güncellendi`
          : `Shift updated for ${format(selectedDate, 'MMMM d', { locale: dateLocale })}`,
        type: 'success'
      });
    } catch (e) {
      showMarqueeToast({
        message: language === 'tr' ? 'Hata oluştu' : 'Error occurred',
        type: 'error'
      });
    }
  };

  // Translations
  const t = {
    title: language === 'tr' ? 'Vardiya Ayarları' : 'Shift Settings',
    selectMode: language === 'tr' ? 'Vardiya Düzeni Seçin' : 'Select Shift Arrangement',
    mode3Person: language === 'tr' ? '3 Kişilik Vardiya (4-2)' : '3-Person Shift (4-2)',
    mode3PersonDesc: language === 'tr' ? '4 gün çalış, 2 gün tatil döngüsü. 06:30-16:30 ve 16:00-02:00.' : '4 days work, 2 days off cycle. 06:30-16:30 & 16:00-02:00.',
    mode2Person: language === 'tr' ? '2 Kişilik Vardiya (Haftalık)' : '2-Person Shift (Weekly)',
    mode2PersonDesc: language === 'tr' ? 'Haftalık dönüşüm. Hafta içi 5 gün, hafta sonu 1 nöbet, 1 tatil.' : 'Weekly rotation. 5 weekdays, weekend 1 on-call, 1 off.',
    alignCycle: language === 'tr' ? 'Döngü Hizalama / Değiştirme' : 'Realign Cycle / Rotation',
    alignDesc: language === 'tr' ? 'Seçilen güne/haftaya göre döngüyü sıfırlayıp hizalayın:' : 'Reset and align the rotation from the selected date:',
    datePickerLabel: language === 'tr' ? 'Hizalama veya Özel Gün Tarihi' : 'Date for Alignment or Override',
    startMorning: language === 'tr' ? 'Sabah Başlat (1. Gün)' : 'Start Morning (Day 1)',
    startEvening: language === 'tr' ? 'Akşam Başlat (1. Gün)' : 'Start Evening (Day 1)',
    startHoliday: language === 'tr' ? 'Tatil Başlat (1. Gün)' : 'Start Holiday (Day 1)',
    startMorningWeek: language === 'tr' ? 'Sabahçı Hafta Başlat' : 'Start Morning Week',
    startEveningWeek: language === 'tr' ? 'Akşamcı Hafta Başlat' : 'Start Evening Week',
    dayOverrideTitle: language === 'tr' ? 'Güne Özel Vardiya Değişikliği' : 'Single Day Shift Override',
    dayOverrideDesc: language === 'tr' ? 'Seçtiğiniz tarihin vardiyasını döngüden bağımsız olarak değiştirin:' : 'Change the shift for the selected date independent of the cycle:',
    selectedDay: language === 'tr' ? 'Seçili Gün:' : 'Selected Day:',
    optionSabah: language === 'tr' ? 'Sabah' : 'Morning',
    optionAksam: language === 'tr' ? 'Akşam' : 'Evening',
    optionNobet: language === 'tr' ? 'Nöbet' : 'On-call',
    optionTatil: language === 'tr' ? 'Tatil' : 'Off / Holiday',
    optionDefault: language === 'tr' ? 'Varsayılan (Döngüsel)' : 'Default (Cyclic)',
    close: language === 'tr' ? 'Kapat' : 'Close'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="w-full max-w-md bg-white/90 dark:bg-zinc-900/90 rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 dark:border-zinc-800/80 backdrop-filter"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-stone-200/50 dark:border-zinc-800/50 bg-stone-50/50 dark:bg-zinc-950/20">
            <h3 className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-stone-900 to-stone-700 dark:from-zinc-100 dark:to-zinc-300 text-transparent bg-clip-text">
              <FaSyncAlt className="text-indigo-500 animate-spin-slow" />
              <span>{t.title}</span>
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-all">
              <FaTimes />
            </button>
          </div>

          <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* 1. Shift Mode Selector */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">{t.selectMode}</h4>
              <div className="grid grid-cols-1 gap-3">
                {/* 3-person mode button */}
                <button
                  type="button"
                  onClick={() => handlePlanModeChange('3-person')}
                  className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${shiftSettings.planMode === '3-person'
                      ? 'bg-gradient-to-br from-indigo-50/80 to-indigo-100/30 border-indigo-500 dark:from-indigo-950/30 dark:to-indigo-900/10 dark:border-indigo-500 shadow-md shadow-indigo-500/5'
                      : 'bg-stone-50/50 hover:bg-stone-100/50 border-stone-200 dark:bg-zinc-950/20 dark:hover:bg-zinc-850 dark:border-zinc-800'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-zinc-100 text-sm">
                    <FaSyncAlt className={shiftSettings.planMode === '3-person' ? 'text-indigo-500' : 'text-stone-400'} size={14} />
                    <span>{t.mode3Person}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1">{t.mode3PersonDesc}</p>
                </button>

                {/* 2-person mode button */}
                <button
                  type="button"
                  onClick={() => handlePlanModeChange('2-person')}
                  className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${shiftSettings.planMode === '2-person'
                      ? 'bg-gradient-to-br from-indigo-50/80 to-indigo-100/30 border-indigo-500 dark:from-indigo-950/30 dark:to-indigo-900/10 dark:border-indigo-500 shadow-md shadow-indigo-500/5'
                      : 'bg-stone-50/50 hover:bg-stone-100/50 border-stone-200 dark:bg-zinc-950/20 dark:hover:bg-zinc-850 dark:border-zinc-800'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-zinc-100 text-sm">
                    <FaUserShield className={shiftSettings.planMode === '2-person' ? 'text-indigo-500' : 'text-stone-400'} size={14} />
                    <span>{t.mode2Person}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1">{t.mode2PersonDesc}</p>
                </button>
              </div>
            </div>

            {/* Datepicker shared for align & override */}
            <div className="p-4 bg-stone-50/50 dark:bg-zinc-950/20 border border-stone-200/50 dark:border-zinc-800/50 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <FaCalendarDay className="text-indigo-500" />
                <span>{t.datePickerLabel}</span>
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value));
                  }
                }}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-semibold shadow-sm"
              />
              <p className="text-[10px] text-stone-400 dark:text-zinc-500 font-medium italic">
                {t.selectedDay} {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: dateLocale })}
              </p>
            </div>

            {/* 2. Realign cycle options */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">{t.alignCycle}</h4>
              <p className="text-[11px] text-stone-400 dark:text-zinc-500">{t.alignDesc}</p>

              <div className="flex flex-col gap-2">
                {shiftSettings.planMode === '3-person' ? (
                  <>
                    {/* 3-Person align buttons */}
                    <button
                      onClick={() => handleRealign('Sabah')}
                      className="w-full py-2.5 px-4 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/30 dark:hover:bg-amber-900/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaSun size={12} />
                      <span>{t.startMorning}</span>
                    </button>
                    <button
                      onClick={() => handleRealign('Akşam')}
                      className="w-full py-2.5 px-4 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaMoon size={12} />
                      <span>{t.startEvening}</span>
                    </button>
                    <button
                      onClick={() => handleRealign('Tatil')}
                      className="w-full py-2.5 px-4 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-stone-200/60 dark:border-zinc-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaBed size={12} />
                      <span>{t.startHoliday}</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* 2-Person align buttons */}
                    <button
                      onClick={() => handleRealign('Sabahçı')}
                      className="w-full py-2.5 px-4 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/30 dark:hover:bg-amber-900/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaSun size={12} />
                      <span>{t.startMorningWeek}</span>
                    </button>
                    <button
                      onClick={() => handleRealign('Akşamcı')}
                      className="w-full py-2.5 px-4 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaMoon size={12} />
                      <span>{t.startEveningWeek}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3. Single Day Override */}
            <div className="space-y-3 pt-3 border-t border-stone-200/50 dark:border-zinc-800/50">
              <h4 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">{t.dayOverrideTitle}</h4>
              <p className="text-[11px] text-stone-400 dark:text-zinc-500">{t.dayOverrideDesc}</p>

              <div className="grid grid-cols-2 gap-2">
                {/* Sabah override */}
                <button
                  type="button"
                  onClick={() => handleOverride('Sabah')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center border ${activeOverride === 'Sabah'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-amber-700 dark:text-amber-400 border-stone-200 dark:border-zinc-800'
                    }`}
                >
                  <FaSun size={11} />
                  <span>{t.optionSabah}</span>
                </button>

                {/* Akşam override */}
                <button
                  type="button"
                  onClick={() => handleOverride('Akşam')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center border ${activeOverride === 'Akşam'
                      ? 'bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-indigo-700 dark:text-indigo-400 border-stone-200 dark:border-zinc-800'
                    }`}
                >
                  <FaMoon size={11} />
                  <span>{t.optionAksam}</span>
                </button>

                {/* Nöbet override */}
                <button
                  type="button"
                  onClick={() => handleOverride('Nöbet')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center border ${activeOverride === 'Nöbet'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                      : 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-rose-700 dark:text-rose-400 border-stone-200 dark:border-zinc-800'
                    }`}
                >
                  <FaUserShield size={11} />
                  <span>{t.optionNobet}</span>
                </button>

                {/* Tatil override */}
                <button
                  type="button"
                  onClick={() => handleOverride('Tatil')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center border ${activeOverride === 'Tatil'
                      ? 'bg-stone-500 text-white border-stone-600 shadow-md shadow-stone-500/20'
                      : 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-400 border-stone-200 dark:border-zinc-800'
                    }`}
                >
                  <FaBed size={11} />
                  <span>{t.optionTatil}</span>
                </button>

                {/* Default (clear override) */}
                <button
                  type="button"
                  onClick={() => handleOverride('default')}
                  className={`col-span-2 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center border ${!activeOverride
                      ? 'bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 border-stone-300 dark:border-zinc-700'
                      : 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 border-stone-200 dark:border-zinc-800'
                    }`}
                >
                  <FaSyncAlt size={10} />
                  <span>{t.optionDefault}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-950/20 border-t border-stone-200/50 dark:border-zinc-800/50 flex justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 shadow-md transition-all active:scale-95"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
