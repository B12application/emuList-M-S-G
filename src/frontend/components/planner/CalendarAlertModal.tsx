import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
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
  const [showForm, setShowForm] = useState(existingAlerts.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

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
        await updateCalendarAlert(editingId, {
          startDate,
          endDate,
          label: label.trim(),
          color
        });
        showMarqueeToast({ message: t('planner.alertUpdated'), type: 'success' });
      } else {
        await addCalendarAlert({
          userId: user.uid,
          startDate,
          endDate,
          label: label.trim(),
          color
        });
        showMarqueeToast({ message: t('planner.alertAdded'), type: 'success' });
      }
      playSuccess();
      setStartDate('');
      setEndDate('');
      setLabel('');
      setColor('#ef4444');
      setEditingId(null);
      setShowForm(false);
      onAdded();
      onClose();
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
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setLabel('');
    setStartDate('');
    setEndDate('');
    setColor('#ef4444');
    if (existingAlerts.length > 0) {
      setShowForm(false);
    }
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              <span>{t('planner.customCalendarAlert')}</span>
            </h3>
            <button onClick={onClose} className="p-2 text-stone-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors">
              <FaTimes />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {/* Existing Alerts */}
            {existingAlerts.length > 0 && (
              <div className="p-4 border-b border-stone-100 dark:border-zinc-800/50 space-y-2">
                <p className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t('planner.existingAlerts')}
                </p>
                {existingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-800/50 rounded-xl group"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: alert.color || '#ef4444' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-stone-800 dark:text-zinc-200 truncate">
                        {alert.label}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-zinc-400">
                        {formatDateLabel(alert.startDate)} → {formatDateLabel(alert.endDate)}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEditAlert(alert)}
                        className="p-1.5 text-stone-400 hover:text-blue-500 dark:hover:text-blue-400"
                        title={t('planner.edit')}
                      >
                        {t('planner.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id!)}
                        className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400"
                        title={t('planner.delete')}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Toggle between list and form */}
            {existingAlerts.length > 0 && !showForm && (
              <div className="p-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  {t('planner.addNewAlert')}
                </button>
              </div>
            )}

            {/* Add Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Label */}
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                    {t('planner.titleDescription')}
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t('planner.alertPlaceholder')}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
                </div>

                {/* Dates */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                      {t('planner.start')}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                      {t('planner.end')}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    {t('planner.color')}
                  </label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setColor(opt.value)}
                        className={`w-8 h-8 rounded-full transition-all ${opt.bg} ${
                          color === opt.value
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110 shadow-lg'
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
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl"
                  >
                    <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">{t('planner.preview')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: color, opacity: 0.6 }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-stone-600 dark:text-zinc-300 font-semibold">{label}</span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                        {formatDateLabel(startDate)} → {formatDateLabel(endDate)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Submit */}
                <div className="pt-2 flex gap-3">
                  {existingAlerts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 text-stone-600 dark:text-zinc-300 font-bold py-3 px-4 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      {t('planner.cancel')}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || !label.trim() || !startDate || !endDate}
                    className="flex-[2] text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:active:scale-100 active:scale-95 bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  >
                    {isSubmitting ? t('planner.processing') : editingId ? t('planner.update') : t('planner.addAlert')}
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
