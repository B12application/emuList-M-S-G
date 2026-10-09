import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes, FaCamera, FaUpload, FaCheckCircle, FaExclamationTriangle,
  FaBug, FaFeather, FaSearch, FaTasks, FaPlus, FaCheck, FaSpinner,
  FaImage, FaRedo, FaKey
} from 'react-icons/fa';
import { SiJira } from 'react-icons/si';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { addMeeting } from '../../../backend/services/plannerService';
import { showMarqueeToast } from '../MarqueeToast';
import type { PlannerMeeting } from '../../../backend/types/planner';
import { format } from 'date-fns';
import { scanJiraTicketsFromPhoto, getActiveGeminiApiKey, setActiveGeminiApiKey } from '../../services/jiraPhotoScanService';

interface ScannedTask {
  jiraTaskId: string;
  title: string;
  type: 'bug' | 'feature' | 'research' | 'task';
  status: PlannerMeeting['status'];
  dueDate: string | null;
  priority: PlannerMeeting['priority'];
  notes: string;
  _selected: boolean;
  _alreadyExists: boolean;
}

interface JiraPhotoScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  existingMeetings: PlannerMeeting[];
}

const TASK_TYPE_CONFIG = {
  bug: {
    label: 'Bug / Fix',
    color: 'bg-rose-500',
    textColor: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-900/40',
    icon: FaBug,
  },
  feature: {
    label: 'Feature',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-900/40',
    icon: FaFeather,
  },
  research: {
    label: 'Araştırma',
    color: 'bg-violet-500',
    textColor: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-900/40',
    icon: FaSearch,
  },
  task: {
    label: 'Task',
    color: 'bg-sky-500',
    textColor: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20',
    borderColor: 'border-sky-200 dark:border-sky-900/40',
    icon: FaTasks,
  },
};

export default function JiraPhotoScanModal({ isOpen, onClose, onAdded, existingMeetings }: JiraPhotoScanModalProps) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [step, setStep] = useState<'upload' | 'scanning' | 'preview' | 'importing'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [scannedTasks, setScannedTasks] = useState<ScannedTask[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const [apiKey, setApiKey] = useState<string>(() => getActiveGeminiApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const handleOpenKeyModal = () => {
    setKeyInput(apiKey);
    setIsKeyModalOpen(true);
  };

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    setActiveGeminiApiKey(trimmed);
    setApiKey(trimmed);
    setIsKeyModalOpen(false);
    showMarqueeToast({
      message: language === 'tr'
        ? 'Gemini API anahtarı güncellendi! (AI Robot ile senkronize edildi) ✅'
        : 'Gemini API key updated! (Synced with AI Robot) ✅',
      type: 'success'
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingJiraIds = new Set(
    existingMeetings
      .filter(m => m.itemType === 'jira' && m.jiraTaskId)
      .map(m => m.jiraTaskId!)
  );

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Lütfen geçerli bir fotoğraf dosyası seçin.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setScanError('Fotoğraf boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }
    setScanError(null);
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScan = async () => {
    if (!imageBase64) return;
    setStep('scanning');
    setScanError(null);
    try {
      const rawTasks = await scanJiraTicketsFromPhoto(imageBase64, imageMimeType);
      const enriched: ScannedTask[] = rawTasks.map(task => ({
        jiraTaskId: task.jiraTaskId || '',
        title: task.title || 'Başlıksız Task',
        type: task.type || 'task',
        status: (task.status as PlannerMeeting['status']) || 'todo',
        dueDate: task.dueDate || null,
        priority: (task.priority as PlannerMeeting['priority']) || 'medium',
        notes: task.notes || '',
        _selected: !existingJiraIds.has(task.jiraTaskId),
        _alreadyExists: existingJiraIds.has(task.jiraTaskId),
      }));
      setScannedTasks(enriched);
      setStep('preview');
    } catch (err: any) {
      setScanError(err?.message || 'Fotoğraf analizi başarısız oldu.');
      setStep('upload');
    }
  };

  const toggleTaskSelection = (index: number) => {
    setScannedTasks(prev => prev.map((t, i) =>
      i === index && !t._alreadyExists ? { ...t, _selected: !t._selected } : t
    ));
  };

  const toggleAll = () => {
    const eligibleTasks = scannedTasks.filter(t => !t._alreadyExists);
    const allSelected = eligibleTasks.every(t => t._selected);
    setScannedTasks(prev => prev.map(t =>
      t._alreadyExists ? t : { ...t, _selected: !allSelected }
    ));
  };

  const handleImport = async () => {
    if (!user) return;
    const toImport = scannedTasks.filter(t => t._selected && !t._alreadyExists);
    if (toImport.length === 0) {
      showMarqueeToast({ message: 'İçe aktarılacak task seçilmedi.', type: 'error' });
      return;
    }
    setStep('importing');
    setImportProgress(0);
    const today = format(new Date(), 'yyyy-MM-dd');
    let imported = 0;
    for (const task of toImport) {
      try {
        const meetingData: Omit<PlannerMeeting, 'id'> = {
          userId: user.uid,
          title: `[${task.jiraTaskId}] ${task.title}`,
          date: today,
          startTime: '',
          endTime: '',
          notes: task.notes || '',
          dueDate: task.dueDate || '',
          itemType: 'jira',
          isCompleted: false,
          status: task.status,
          priority: task.priority,
          jiraTaskId: task.jiraTaskId,
          jiraTaskType: task.type,
          isRecurring: false,
        };
        await addMeeting(meetingData, false);
        imported++;
        setImportProgress(Math.round((imported / toImport.length) * 100));
      } catch (err) {
        console.error(`Task import error (${task.jiraTaskId}):`, err);
      }
    }
    showMarqueeToast({
      message: language === 'tr'
        ? `${imported} Jira task başarıyla aktarıldı! 🎉`
        : `${imported} Jira tasks imported successfully! 🎉`,
      type: 'success'
    });
    onAdded();
    onClose();
    resetState();
  };

  const resetState = () => {
    setStep('upload');
    setImagePreview(null);
    setImageBase64(null);
    setScannedTasks([]);
    setScanError(null);
    setImportProgress(0);
  };

  const selectedCount = scannedTasks.filter(t => t._selected && !t._alreadyExists).length;
  const alreadyExistsCount = scannedTasks.filter(t => t._alreadyExists).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-zinc-800 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <SiJira className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {language === 'tr' ? 'Fotoğraftan Jira Task Ekle' : 'Import Jira Tasks from Photo'}
                </h3>
                <p className="text-[10px] text-blue-100 font-medium">
                  {language === 'tr' ? 'AI ile ekran görüntüsünü tara' : 'Scan screenshot with AI'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); resetState(); }}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* AI Robot Shared API Key Bar */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-stone-50 dark:bg-zinc-800/60 border-b border-stone-200 dark:border-zinc-800 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 dark:text-zinc-400 font-medium">
                {language === 'tr' ? '🤖 AI Motoru (AI Robot ile Ortak):' : '🤖 AI Engine (Shared with AI Robot):'}
              </span>
              {apiKey ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[11px]">
                  <FaCheckCircle size={10} /> {language === 'tr' ? 'Anahtar Bağlı' : 'Key Connected'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[11px]">
                  <FaExclamationTriangle size={10} /> {language === 'tr' ? 'Anahtar Tanımsız' : 'No Key'}
                </span>
              )}
            </div>
            <button
              onClick={handleOpenKeyModal}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer"
            >
              <FaKey size={10} />
              <span>{apiKey ? (language === 'tr' ? 'Değiştir' : 'Change') : (language === 'tr' ? 'Anahtar Ekle' : 'Add Key')}</span>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-5 pt-4 shrink-0">
            <div className="flex items-center gap-1">
              {[
                { key: 'upload', label: language === 'tr' ? 'Fotoğraf' : 'Photo' },
                { key: 'scanning', label: language === 'tr' ? 'Tarama' : 'Scan' },
                { key: 'preview', label: language === 'tr' ? 'Önizleme' : 'Preview' },
              ].map((s, i) => {
                const isActive = step === s.key || (step === 'importing' && s.key === 'preview');
                const isDone = (step === 'scanning' && i === 0) || (step === 'preview' && i <= 1) || (step === 'importing' && i <= 2);
                return (
                  <div key={s.key} className="flex items-center gap-1 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors shrink-0 ${
                      isDone ? 'bg-blue-600 text-white' : isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600'
                    }`}>
                      {isDone ? <FaCheck size={9} /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold ${isActive || isDone ? 'text-blue-600 dark:text-blue-400' : 'text-stone-400 dark:text-zinc-600'}`}>
                      {s.label}
                    </span>
                    {i < 2 && <div className="flex-1 h-px bg-stone-200 dark:bg-zinc-700 mx-1" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">

            {/* STEP: UPLOAD */}
            {step === 'upload' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-stone-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 bg-stone-50 dark:bg-zinc-800/50'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Jira screenshot" className="w-full max-h-64 object-contain" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <div className="bg-white/90 dark:bg-zinc-800/90 text-stone-700 dark:text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold">
                          {language === 'tr' ? 'Değiştir' : 'Change'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 flex flex-col items-center gap-3 px-6">
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                        <FaCamera className="text-2xl text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-stone-700 dark:text-zinc-200 text-sm">
                          {language === 'tr' ? 'Jira ekran görüntüsü yükle' : 'Upload Jira screenshot'}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">
                          {language === 'tr' ? 'Sürükle & Bırak veya tıkla' : 'Drag & Drop or click to upload'}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-zinc-600 mt-1">PNG, JPG, WEBP • Maks 10MB</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-900/40">
                        <FaUpload size={11} />
                        {language === 'tr' ? 'Dosya Seç' : 'Select File'}
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>

                {/* Color Legend */}
                <div className="p-3.5 bg-stone-50 dark:bg-zinc-800/50 rounded-2xl border border-stone-200 dark:border-zinc-700/50 space-y-2">
                  <p className="text-[10px] font-black text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                    {language === 'tr' ? 'Renk Kodlama Sistemi' : 'Color Coding System'}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(TASK_TYPE_CONFIG).map(([type, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <div className={`w-5 h-5 ${cfg.color} rounded-md flex items-center justify-center shrink-0`}>
                            <Icon className="text-white" size={9} />
                          </div>
                          <span className="text-[10px] font-bold text-stone-600 dark:text-zinc-400">{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {scanError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                      <FaExclamationTriangle className="shrink-0 mt-0.5" />
                      <span className="flex-1 leading-relaxed">{scanError}</span>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleOpenKeyModal}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <FaKey size={10} />
                        <span>{language === 'tr' ? 'AI Robot API Anahtarını Güncelle' : 'Update AI Robot API Key'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP: SCANNING */}
            {step === 'scanning' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 flex flex-col items-center gap-5"
              >
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                  <div className="absolute inset-3 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <SiJira className="text-blue-600 dark:text-blue-400 text-xl" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-black text-stone-800 dark:text-zinc-100 text-base">
                    {language === 'tr' ? 'AI Fotoğrafı Analiz Ediyor...' : 'AI is Analyzing Photo...'}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500">
                    {language === 'tr' ? "Jira task'ları tespit ediliyor" : 'Detecting Jira tasks'}
                  </p>
                </div>
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="w-40 h-24 object-cover rounded-xl opacity-60 shadow-lg" />
                )}
              </motion.div>
            )}

            {/* STEP: PREVIEW */}
            {step === 'preview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Summary Bar */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <FaImage className="text-white text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-blue-700 dark:text-blue-300">
                      {scannedTasks.length} {language === 'tr' ? 'task tespit edildi' : 'tasks detected'}
                    </p>
                    {alreadyExistsCount > 0 && (
                      <p className="text-[10px] text-blue-500 dark:text-blue-400">
                        {alreadyExistsCount} {language === 'tr' ? 'zaten mevcut (atlanacak)' : 'already exist (will skip)'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={toggleAll}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-800 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
                  >
                    {scannedTasks.filter(t => !t._alreadyExists).every(t => t._selected)
                      ? (language === 'tr' ? 'Tümünü Kaldır' : 'Deselect All')
                      : (language === 'tr' ? 'Tümünü Seç' : 'Select All')}
                  </button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {scannedTasks.map((task, idx) => {
                    const cfg = TASK_TYPE_CONFIG[task.type] || TASK_TYPE_CONFIG.task;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => toggleTaskSelection(idx)}
                        className={`relative flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all select-none ${
                          task._alreadyExists
                            ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-zinc-800/30 border-stone-200 dark:border-zinc-700'
                            : task._selected
                            ? `${cfg.bgColor} ${cfg.borderColor}`
                            : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          task._alreadyExists
                            ? 'bg-stone-200 dark:bg-zinc-700'
                            : task._selected
                            ? 'bg-blue-600'
                            : 'border-2 border-stone-300 dark:border-zinc-600'
                        }`}>
                          {task._alreadyExists
                            ? <FaCheckCircle className="text-stone-400 dark:text-zinc-500 text-xs" />
                            : task._selected
                            ? <FaCheck className="text-white" size={9} />
                            : null}
                        </div>

                        {/* Type Badge */}
                        <div className={`w-7 h-7 ${cfg.color} rounded-xl flex items-center justify-center shrink-0`}>
                          <Icon className="text-white" size={12} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-stone-500 dark:text-zinc-400 font-mono bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                              {task.jiraTaskId}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${cfg.textColor} ${cfg.bgColor}`}>
                              {cfg.label}
                            </span>
                            {task._alreadyExists && (
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                                {language === 'tr' ? 'Mevcut' : 'Exists'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-stone-800 dark:text-zinc-100 mt-1 leading-tight">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {task.dueDate && (
                              <span className="text-[10px] text-stone-500 dark:text-zinc-500">
                                📅 {task.dueDate}
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400 dark:text-zinc-600 capitalize">
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {scannedTasks.length === 0 && (
                  <div className="py-12 text-center text-stone-400 dark:text-zinc-500 text-sm">
                    <FaExclamationTriangle className="mx-auto mb-2 text-2xl text-amber-400" />
                    <p className="font-bold">{language === 'tr' ? 'Hiç task tespit edilemedi.' : 'No tasks detected.'}</p>
                    <p className="text-xs mt-1">{language === 'tr' ? 'Farklı bir fotoğraf deneyebilirsiniz.' : 'Try a different photo.'}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP: IMPORTING */}
            {step === 'importing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 flex flex-col items-center gap-5"
              >
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-900/40" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin" />
                  <div className="absolute inset-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <FaPlus className="text-emerald-600 dark:text-emerald-400 text-xl" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-black text-stone-800 dark:text-zinc-100 text-base">
                    {language === 'tr' ? "Task'lar İçe Aktarılıyor..." : 'Importing Tasks...'}
                  </p>
                  <div className="w-48 h-2 bg-stone-200 dark:bg-zinc-700 rounded-full overflow-hidden mx-auto">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 dark:text-zinc-500">{importProgress}%</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/80 shrink-0 flex gap-3">
            {step === 'upload' && (
              <>
                <button
                  onClick={() => { onClose(); resetState(); }}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm font-bold text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'tr' ? 'İptal' : 'Cancel'}
                </button>
                <button
                  onClick={handleScan}
                  disabled={!imageBase64}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <FaSearch size={13} />
                  {language === 'tr' ? 'Tara ve Analiz Et' : 'Scan & Analyze'}
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={resetState}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm font-bold text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FaRedo size={11} />
                  {language === 'tr' ? 'Yeniden Tara' : 'Re-scan'}
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <FaPlus size={13} />
                  {selectedCount > 0
                    ? (language === 'tr' ? `${selectedCount} Task Ekle` : `Add ${selectedCount} Tasks`)
                    : (language === 'tr' ? 'Task Seçin' : 'Select Tasks')}
                </button>
              </>
            )}

            {(step === 'scanning' || step === 'importing') && (
              <div className="flex-1 flex items-center justify-center gap-2 text-stone-400 dark:text-zinc-500 text-sm">
                <FaSpinner className="animate-spin" />
                {language === 'tr' ? 'Lütfen bekleyin...' : 'Please wait...'}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* API Key Modal Overlay */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <FaKey className="text-blue-500" />
                {language === 'tr' ? 'Google Gemini API Anahtarı' : 'Google Gemini API Key'}
              </h4>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <FaTimes size={13} />
              </button>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
              {language === 'tr'
                ? 'Bu anahtar hem AI Robot hem de Jira Fotoğraf Tarama için ortak kullanılır. Tarayıcınızda (localStorage) güvenle saklanır.'
                : 'This key is shared across both AI Robot and Jira Photo Scanner. Securely stored in your browser (localStorage).'}
            </p>
            <div className="space-y-1.5">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-stone-900 dark:text-white font-mono"
              />
              <div className="flex justify-between items-center text-[11px] pt-1">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-medium"
                >
                  {language === 'tr' ? 'Google AI Studio\'dan anahtar al ↗' : 'Get key from Google AI Studio ↗'}
                </a>
                {keyInput && (
                  <button
                    onClick={() => setKeyInput('')}
                    className="text-stone-400 hover:text-rose-500 text-[10px]"
                  >
                    {language === 'tr' ? 'Temizle' : 'Clear'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {language === 'tr' ? 'Vazgeç' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {language === 'tr' ? 'Kaydet' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
