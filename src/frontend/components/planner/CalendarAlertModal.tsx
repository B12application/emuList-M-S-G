import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaPlus, FaCalendarPlus, FaEdit, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { addCalendarAlert, deleteCalendarAlert, updateCalendarAlert } from '../../../backend/services/plannerService';
import { showMarqueeToast } from '../MarqueeToast';
import { useAppSound } from '../../context/SoundContext';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import type { CalendarAlert } from '../../../backend/types/planner';

interface CalendarAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  existingAlerts: CalendarAlert[];
}

const COLOR_OPTIONS = [
  { value: '#ef4444', labelKey: 'planner.colorRed', bg: 'bg-red-500' },
  { value: '#f97316', labelKey: 'planner.colorOrange', bg: 'bg-orange-500' },
  { value: '#3b82f6', labelKey: 'planner.colorBlue', bg: 'bg-blue-500' },
  { value: '#8b5cf6', labelKey: 'planner.colorPurple', bg: 'bg-violet-500' },
  { value: '#10b981', labelKey: 'planner.colorGreen', bg: 'bg-emerald-500' },
];

export default function CalendarAlertModal({ isOpen, onClose, onAdded, existingAlerts }: CalendarAlertModalProps) {
  const { user } = useAuth();
  const { playSuccess } = useAppSound();
  const { language, t } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('form');

  if (!isOpen) return null;

  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setLabel('');
    setColor('#ef4444');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate || !label.trim()) return;

    if (endDate < startDate) {
      showMarqueeToast({ message: t('planner.endDateBeforeStart'), type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCalendarAlert(editingId, { startDate, endDate, label: label.trim(), color });
        showMarqueeToast({ message: t('planner.alertUpdated'), type: 'success' });
      } else {
        await addCalendarAlert({ userId: user.uid, startDate, endDate, label: label.trim(), color });
        showMarqueeToast({ message: t('planner.alertAdded'), type: 'success' });
      }
      playSuccess();
      resetForm();
      setActiveTab('list');
      onAdded();
    } catch (err) {
      console.error(err);
      showMarqueeToast({ message: t('planner.operationFailed'), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAlert = (alert: CalendarAlert) => {
    setEditingId(alert.id || null);
    setLabel(alert.label);
    setStartDate(alert.startDate);
    setEndDate(alert.endDate);
    setColor(alert.color || '#ef4444');
    setActiveTab('form');
  };

  const handleCancelEdit = () => {
    resetForm();
    setActiveTab('list');
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteCalendarAlert(alertId);
      showMarqueeToast({ message: t('planner.alertDeleted'), type: 'deleted' });
      onAdded();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
      return format(dateObj, 'd MMM yyyy', { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  const hasAlerts = existingAlerts.length > 0;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg sm:max-w-xl bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <FaCalendarPlus className="text-base" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  {t('planner.customCalendarAlert')}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  {t('planner.alertTitlePurpose') || 'Takvim uyarısı ve önemli dönem planlama'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Tab switcher */}
          {hasAlerts && (
            <div className="flex gap-2 px-6 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTab('list'); resetForm(); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                📋 {t('planner.existingAlerts')} ({existingAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 shadow-xs border border-red-200/50 dark:border-red-900/40'
                    : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <FaPlus className="inline mr-1 text-[10px]" />
                {editingId ? t('planner.edit') : t('planner.addNewAlert')}
              </button>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="max-h-[70vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar px-6 py-4 space-y-4 flex-1">
            {/* LIST TAB */}
            {activeTab === 'list' && hasAlerts && (
              <div className="space-y-2.5">
                {existingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50 group hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700 transition"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: alert.color || '#ef4444' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-stone-900 dark:text-zinc-100 truncate">
                        {alert.label}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5 font-medium">
                        {formatDateLabel(alert.startDate)} → {formatDateLabel(alert.endDate)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditAlert(alert)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-white hover:text-blue-500 dark:hover:bg-zinc-800 dark:hover:text-blue-400 transition cursor-pointer"
                        title={t('planner.edit')}
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert.id!)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-white hover:text-red-500 dark:hover:bg-zinc-800 dark:hover:text-red-400 transition cursor-pointer"
                        title={t('planner.delete')}
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FORM TAB */}
            {(activeTab === 'form' || !hasAlerts) && (
              <form id="calendar-alert-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Bilgilendirme / Amaç Kutusu */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-stone-800 dark:text-zinc-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FaInfoCircle className="text-xs" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-amber-700 dark:text-amber-300">
                      {language === 'tr' ? 'Özel Takvim Uyarısı Nedir?' : 'What is a Custom Calendar Alert?'}
                    </p>
                    <p className="text-stone-600 dark:text-zinc-400 leading-relaxed">
                      {t('planner.customCalendarAlertDesc')}
                    </p>
                  </div>
                </div>

                {/* Uyarı Başlığı / Amacı */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                    {t('planner.alertTitlePurpose')}
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t('planner.alertPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder-stone-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 transition"
                    required
                  />
                </div>

                {/* Tarih Aralığı */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                      {t('planner.start')}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                      {t('planner.end')}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition"
                      required
                    />
                  </div>
                </div>

                {/* Renk Seçimi */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                    {t('planner.color')}
                  </label>
                  <div className="flex gap-2.5">
                    {COLOR_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setColor(opt.value)}
                        className={`w-9 h-9 rounded-xl transition-all cursor-pointer ${opt.bg} ${
                          color === opt.value
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-110 shadow-lg'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                        title={t(opt.labelKey)}
                      />
                    ))}
                  </div>
                </div>

                {/* Gerçek Takvim Önizlemesi */}
                <div className="p-3.5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/50 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                    {t('planner.calendarAlertPreviewNote')}
                  </p>
                  <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xs relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400 text-stone-950">
                        15
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-bold">
                        {startDate && endDate ? `${formatDateLabel(startDate)} → ${formatDateLabel(endDate)}` : (language === 'tr' ? 'Tarih Aralığı' : 'Date Range')}
                      </span>
                    </div>
                    {/* The Alert Badge as it looks in calendar cells */}
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-black border transition-all truncate shadow-2xs"
                      style={{
                        backgroundColor: `${color}18`,
                        borderColor: `${color}45`,
                        color: color,
                      }}
                    >
                      <FaMapMarkerAlt className="shrink-0 text-[10px]" />
                      <span className="truncate">
                        {label.trim() || (language === 'tr' ? 'Uyarı Başlığı Buraya Gelecek' : 'Alert Title Here')}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Sticky / Fixed Footer */}
          <div className="px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200 dark:border-zinc-800 shrink-0 flex gap-2.5">
            {activeTab === 'form' && (hasAlerts || editingId) && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 py-2.5 text-xs font-bold text-stone-600 dark:text-zinc-300 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                {t('planner.cancel')}
              </button>
            )}
            {activeTab === 'form' ? (
              <button
                type="submit"
                form="calendar-alert-form"
                disabled={isSubmitting || !label.trim() || !startDate || !endDate}
                className="flex-[2] py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm active:scale-98 cursor-pointer"
              >
                {isSubmitting ? '...' : editingId ? t('planner.update') : t('planner.addAlert')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs font-bold text-stone-700 dark:text-zinc-200 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                {t('planner.close')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}