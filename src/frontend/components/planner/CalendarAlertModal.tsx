import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaPlus, FaCalendarPlus, FaEdit } from 'react-icons/fa';
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
  { value: '#ef4444', labelKey: 'planner.colorRed', bg: 'bg-red-500', ring: 'ring-red-500' },
  { value: '#f97316', labelKey: 'planner.colorOrange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { value: '#3b82f6', labelKey: 'planner.colorBlue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { value: '#8b5cf6', labelKey: 'planner.colorPurple', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { value: '#10b981', labelKey: 'planner.colorGreen', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
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
      return format(dateObj, 'd MMM', { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  const hasAlerts = existingAlerts.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400">
                <FaCalendarPlus className="text-sm" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('planner.customCalendarAlert')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Tab switcher - sadece alert varsa */}
          {hasAlerts && (
            <div className="flex gap-1 px-5 pt-4 shrink-0">
              <button
                onClick={() => { setActiveTab('list'); resetForm(); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'list'
                    ? 'bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                📋 {t('planner.existingAlerts')} ({existingAlerts.length})
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'form'
                    ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <FaPlus className="inline mr-1 text-[10px]" />
                {editingId ? t('planner.edit') : t('planner.addNewAlert')}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {/* LIST TAB */}
            {activeTab === 'list' && hasAlerts && (
              <div className="px-5 py-4 space-y-2">
                {existingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 group hover:border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: alert.color || '#ef4444' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {alert.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {formatDateLabel(alert.startDate)} → {formatDateLabel(alert.endDate)}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEditAlert(alert)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-blue-500 dark:hover:bg-zinc-800 dark:hover:text-blue-400 transition"
                        title={t('planner.edit')}
                      >
                        <FaEdit className="text-[10px]" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id!)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-red-500 dark:hover:bg-zinc-800 dark:hover:text-red-400 transition"
                        title={t('planner.delete')}
                      >
                        <FaTrash className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FORM TAB */}
            {(activeTab === 'form' || !hasAlerts) && (
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {/* Label */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {t('planner.titleDescription')}
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t('planner.alertPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-red-700 dark:focus:ring-red-950 transition"
                    required
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      {t('planner.start')}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-red-700 dark:focus:ring-red-950 transition"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      {t('planner.end')}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-red-700 dark:focus:ring-red-950 transition"
                      required
                    />
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {t('planner.color')}
                  </label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setColor(opt.value)}
                        className={`w-9 h-9 rounded-xl transition-all ${opt.bg} ${
                          color === opt.value
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-110 shadow-lg'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                        style={{ '--tw-ring-color': opt.value } as React.CSSProperties}
                        title={t(opt.labelKey)}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {label && startDate && endDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      {t('planner.preview')}
                    </p>
                    <div className="w-full h-1 rounded-full mb-2" style={{ backgroundColor: color, opacity: 0.5 }} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {formatDateLabel(startDate)} → {formatDateLabel(endDate)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {(hasAlerts || editingId) && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                    >
                      {t('planner.cancel')}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || !label.trim() || !startDate || !endDate}
                    className="flex-[2] py-2.5 text-sm font-bold text-white rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {isSubmitting ? '...' : editingId ? t('planner.update') : t('planner.addAlert')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}