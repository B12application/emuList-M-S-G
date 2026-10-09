import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  FaPlus,
  FaCheck,
  FaTrash,
  FaEdit,
  FaThumbtack,
  FaPalette,
  FaExpand,
  FaCompress,
  FaMagic,
  FaSearch,
  FaCameraRetro,
  FaTimes,
  FaFlask,
  FaHashtag,
  FaClock,
  FaCheckCircle,
  FaRegCircle,
  FaListUl,
  FaColumns,
  FaBorderAll,
  FaCalendarAlt,
  FaLightbulb,
  FaStickyNote,
  FaBell,
  FaComment,
  FaPaperPlane,
  FaEye,
  FaEyeSlash,
  FaArrowsAlt,
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { addMeeting, updateMeeting } from '../../../backend/services/plannerService';
import ConfirmDialog from '../ui/ConfirmDialog';
import { showMarqueeToast } from '../MarqueeToast';
import type {
  PlannerMeeting,
  PlannerChecklistItem,
  PlannerComment,
  PlannerStickyType,
} from '../../../backend/types/planner';

export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange' | 'zinc';

export const STICKY_THEMES: Record<StickyColor, {
  nameTr: string;
  nameEn: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  tapeColor: string;
  textLight: string;
  textDark: string;
  dotColor: string;
  badgeBg: string;
}> = {
  yellow: {
    nameTr: 'Sarı',
    nameEn: 'Yellow',
    bgLight: 'bg-[#fffde7]',
    bgDark: 'dark:bg-[#2a2411]',
    borderLight: 'border-[#fff59d]',
    borderDark: 'dark:border-[#4d4018]',
    tapeColor: 'bg-amber-300/60 dark:bg-amber-400/40',
    textLight: 'text-stone-900',
    textDark: 'dark:text-amber-100',
    dotColor: '#eab308',
    badgeBg: 'bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200',
  },
  green: {
    nameTr: 'Yeşil',
    nameEn: 'Green',
    bgLight: 'bg-[#e8f5e9]',
    bgDark: 'dark:bg-[#122b1c]',
    borderLight: 'border-[#c8e6c9]',
    borderDark: 'dark:border-[#1d482e]',
    tapeColor: 'bg-emerald-300/60 dark:bg-emerald-400/40',
    textLight: 'text-stone-900',
    textDark: 'dark:text-emerald-100',
    dotColor: '#22c55e',
    badgeBg: 'bg-emerald-200/60 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200',
  },
  blue: {
    nameTr: 'Mavi',
    nameEn: 'Blue',
    bgLight: 'bg-[#e1f5fe]',
    bgDark: 'dark:bg-[#112638]',
    borderLight: 'border-[#b3e5fc]',
    borderDark: 'dark:border-[#173d5c]',
    tapeColor: 'bg-sky-300/60 dark:bg-sky-400/40',
    textLight: 'text-stone-900',
    textDark: 'dark:text-sky-100',
    dotColor: '#0ea5e9',
    badgeBg: 'bg-sky-200/60 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200',
  },
  pink: {
    nameTr: 'Pembe',
    nameEn: 'Pink',
    bgLight: 'bg-[#fce4ec]',
    bgDark: 'dark:bg-[#341420]',
    borderLight: 'border-[#f8bbd0]',
    borderDark: 'dark:border-[#571e33]',
    tapeColor: 'bg-rose-300/60 dark:bg-rose-400/40',
    textLight: 'text-stone-900',
    textDark: 'dark:text-rose-100',
    dotColor: '#f43f5e',
    badgeBg: 'bg-rose-200/60 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200',
  },
  purple: {
    nameTr: 'Mor',
    nameEn: 'Purple',
    bgLight: 'bg-[#f3e5f5]',
    bgDark: 'dark:bg-[#281434]',
    borderLight: 'border-[#e1bee7]',
    borderDark: 'dark:border-[#461e5e]',
    tapeColor: 'bg-purple-300/60 dark:bg-purple-400/40',
    textLight: 'text-stone-900',
    textDark: 'dark:text-purple-100',
    dotColor: '#a855f7',
    badgeBg: 'bg-purple-200/60 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200',
  },
  orange: {
    nameTr: 'Turuncu',
    nameEn: 'Orange',
    bgLight: 'bg-[#fff3e0]',
    bgDark: 'dark:bg-[#301c0f]',
    borderLight: 'border-[#ffe0b2]',
    borderDark: 'dark:border-[#522c15]',
    tapeColor: 'bg-orange-300/60 dark:bg-orange-400/40',
    textLight: 'text-stone-900',
    textDark: 'dark:text-orange-100',
    dotColor: '#f97316',
    badgeBg: 'bg-orange-200/60 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200',
  },
  zinc: {
    nameTr: 'Gri / Antrasit',
    nameEn: 'Slate',
    bgLight: 'bg-[#f5f5f4]',
    bgDark: 'dark:bg-[#202023]',
    borderLight: 'border-[#e7e5e4]',
    borderDark: 'dark:border-[#38383f]',
    tapeColor: 'bg-stone-300/60 dark:bg-zinc-600/40',
    textLight: 'text-stone-900',
    textDark: 'dark:text-zinc-100',
    dotColor: '#71717a',
    badgeBg: 'bg-stone-200/60 dark:bg-zinc-700/40 text-stone-900 dark:text-zinc-200',
  },
};

const COLOR_KEYS: StickyColor[] = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange', 'zinc'];

const NOTE_TYPE_CONFIG: Record<PlannerStickyType, { label: string; icon: any; colorClass: string }> = {
  task: { label: 'Görev', icon: FaCheckCircle, colorClass: 'bg-emerald-500 text-white' },
  jira: { label: 'Jira', icon: FaHashtag, colorClass: 'bg-blue-600 text-white' },
  idea: { label: 'Fikir', icon: FaLightbulb, colorClass: 'bg-amber-500 text-stone-950 font-black' },
  memo: { label: 'Not', icon: FaStickyNote, colorClass: 'bg-purple-600 text-white' },
  reminder: { label: 'Hatırlatıcı', icon: FaBell, colorClass: 'bg-rose-500 text-white' },
};

interface JiraBoardViewProps {
  meetings: PlannerMeeting[];
  selectedDate?: Date;
  onStatusChange: (id: string, status: PlannerMeeting['status']) => void;
  onDelete: (item: PlannerMeeting) => void;
  onEdit: (item: PlannerMeeting) => void;
  onAdd: () => void;
  onPhotoScan: () => void;
  onUpdate?: (id: string, updates: Partial<PlannerMeeting>) => Promise<void> | void;
  onRefresh?: () => void;
  onAddLocal?: (item: PlannerMeeting) => void;
}

export default function JiraBoardView({
  meetings,
  selectedDate,
  onStatusChange,
  onDelete,
  onEdit,
  onAdd,
  onPhotoScan,
  onUpdate,
  onRefresh,
  onAddLocal,
}: JiraBoardViewProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;

  const canvasRef = useRef<HTMLDivElement>(null);

  // Görünüm Modu: Serbest Tuval (Canvas), Izgara (Masonry), Kolonlar (Kanban)
  const [viewMode, setViewMode] = useState<'canvas' | 'grid' | 'columns'>('canvas');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<PlannerStickyType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<StickyColor | 'all'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Kullanıcı İsteği: Tamamlanmış görevler panodan kalksın (Varsayılan: Gizli)
  const [hideCompleted, setHideCompleted] = useState<boolean>(true);

  // Silme Onay Modalı
  const [itemToDelete, setItemToDelete] = useState<PlannerMeeting | null>(null);

  // Hızlı Not Oluşturucu (Composer)
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Koordinat önbelleği
  const storageKey = useMemo(() => `b12_sticky_coords_${user?.uid || 'guest'}`, [user?.uid]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Toplam Tamamlanan Sayısı (Arşiv sayacı)
  const completedCount = useMemo(() => {
    return meetings.filter(item => {
      if (item.itemType !== 'jira' && item.itemType !== 'sticky') return false;
      return item.status === 'done' || item.isCompleted === true;
    }).length;
  }, [meetings]);

  // Filtrelenmiş Liste (Tekilleştirilmiş)
  const displayItems = useMemo(() => {
    const filtered = meetings.filter(item => {
      // Panoda SADECE Jira görevleri ve Yapışkan Notlar (sticky) gösterilir
      // 'meeting' ve 'todo' (diğer sayfalardaki genel görevler) burada çıkmamalı
      if (item.itemType !== 'jira' && item.itemType !== 'sticky') return false;

      // Tamamlanmış görevleri gizle
      if (hideCompleted && (item.status === 'done' || item.isCompleted === true)) {
        return false;
      }

      // Tür filtresi
      if (selectedTypeFilter !== 'all') {
        const itemType = item.stickyType || (item.itemType === 'jira' ? 'jira' : 'task');
        if (itemType !== selectedTypeFilter) return false;
      }

      // Renk filtresi
      if (selectedColorFilter !== 'all') {
        const itemColor = (item.stickyColor as StickyColor) || 'yellow';
        if (itemColor !== selectedColorFilter) return false;
      }

      // Arama filtresi
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        const matchJira = item.jiraTaskId?.toLowerCase().includes(q);
        const matchComments = item.comments?.some(c => c.text.toLowerCase().includes(q));
        return matchTitle || matchNotes || matchJira || matchComments;
      }

      return true;
    });

    // ID'ye göre tekilleştir (Mükerrer çoğalma / türüme olmasın)
    const seen = new Set<string>();
    return filtered.filter(item => {
      if (!item.id) return true;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [meetings, hideCompleted, selectedTypeFilter, selectedColorFilter, searchTerm]);

  // Tuval Yüksekliği: Kartlar aşağı taşmasın diye tuval yüksekliğini kartların en altına göre hesaplar
  const canvasMinHeight = useMemo(() => {
    let maxY = 450;
    displayItems.forEach((item, index) => {
      const pos = positions[item.id!] || {
        x: 30 + (index % 4) * 330,
        y: 30 + Math.floor(index / 4) * 360,
      };
      if (pos.y + 420 > maxY) {
        maxY = pos.y + 420;
      }
    });
    return Math.max(maxY + 60, typeof window !== 'undefined' ? window.innerHeight - 240 : 750);
  }, [displayItems, positions]);

  // Pozisyonsuz veya eski bozuk pozisyonlu öğelere temiz koordinat atama
  useEffect(() => {
    let hasChanges = false;
    const nextPositions = { ...positions };
    const canvasWidth = canvasRef.current?.clientWidth || 1100;
    const columns = Math.max(1, Math.floor((canvasWidth - 60) / 340));

    displayItems.forEach((item, index) => {
      if (!item.id) return;
      const existing = nextPositions[item.id];
      // Eğer eski bozuk pozisyon varsa (y > 2000 veya negatif) ya da pozisyon yoksa temiz ızgara pozisyonuna çek
      if (!existing || existing.y > 2000 || existing.y < 0 || existing.x < 0) {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const startX = 30 + col * 330;
        const startY = 30 + row * 360;
        nextPositions[item.id] = { x: startX, y: startY };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setPositions(nextPositions);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextPositions));
      } catch { /* ignore */ }
    }
  }, [displayItems, storageKey, positions]);

  // Pozisyon Güncelleme
  const handlePositionChange = useCallback(
    (id: string, newPos: { x: number; y: number }) => {
      setPositions(prev => {
        const updated = { ...prev, [id]: newPos };
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch { /* ignore */ }
        return updated;
      });

      if (onUpdate) {
        onUpdate(id, { canvasX: newPos.x, canvasY: newPos.y });
      } else {
        updateMeeting(id, { canvasX: newPos.x, canvasY: newPos.y }).catch(console.error);
      }
    },
    [storageKey, onUpdate]
  );

  // Renk Değiştirme
  const handleColorChange = useCallback(
    async (id: string, color: StickyColor) => {
      if (onUpdate) {
        await onUpdate(id, { stickyColor: color });
      } else {
        await updateMeeting(id, { stickyColor: color });
      }
      if (onRefresh) onRefresh();
    },
    [onUpdate, onRefresh]
  );

  // Sabitleme (Pin) Değiştirme
  const handleTogglePin = useCallback(
    async (id: string, currentPin?: boolean) => {
      const nextPin = !currentPin;
      if (onUpdate) {
        await onUpdate(id, { isPinned: nextPin });
      } else {
        await updateMeeting(id, { isPinned: nextPin });
      }
      if (onRefresh) onRefresh();
    },
    [onUpdate, onRefresh]
  );

  // Checklist Toggle
  const handleToggleChecklist = useCallback(
    async (itemId: string, checkId: string) => {
      const target = meetings.find(m => m.id === itemId);
      if (!target) return;
      const currentList = target.checklist || [];
      const updatedList = currentList.map(c =>
        c.id === checkId ? { ...c, done: !c.done } : c
      );

      if (onUpdate) {
        await onUpdate(itemId, { checklist: updatedList });
      } else {
        await updateMeeting(itemId, { checklist: updatedList });
      }
      if (onRefresh) onRefresh();
    },
    [meetings, onUpdate, onRefresh]
  );

  // Checklist Madde Ekleme
  const handleAddChecklistItem = useCallback(
    async (itemId: string, text: string) => {
      if (!text.trim()) return;
      const target = meetings.find(m => m.id === itemId);
      if (!target) return;
      const currentList = target.checklist || [];
      const newItem: PlannerChecklistItem = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: text.trim(),
        done: false,
      };
      const updatedList = [...currentList, newItem];

      if (onUpdate) {
        await onUpdate(itemId, { checklist: updatedList });
      } else {
        await updateMeeting(itemId, { checklist: updatedList });
      }
      if (onRefresh) onRefresh();
    },
    [meetings, onUpdate, onRefresh]
  );

  // Checklist Madde Silme
  const handleDeleteChecklistItem = useCallback(
    async (itemId: string, checkId: string) => {
      const target = meetings.find(m => m.id === itemId);
      if (!target) return;
      const currentList = target.checklist || [];
      const updatedList = currentList.filter(c => c.id !== checkId);

      if (onUpdate) {
        await onUpdate(itemId, { checklist: updatedList });
      } else {
        await updateMeeting(itemId, { checklist: updatedList });
      }
      if (onRefresh) onRefresh();
    },
    [meetings, onUpdate, onRefresh]
  );

  // YORUM EKLEME (Task Altına Yorum Yapma Özelliği)
  const handleAddComment = useCallback(
    async (itemId: string, text: string) => {
      if (!text.trim()) return;
      const target = meetings.find(m => m.id === itemId);
      if (!target) return;

      const newComment: PlannerComment = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        authorName: user?.displayName || user?.email?.split('@')[0] || 'Kullanıcı',
        authorPhoto: user?.photoURL || undefined,
      };

      const updatedComments = [...(target.comments || []), newComment];
      if (onUpdate) {
        await onUpdate(itemId, { comments: updatedComments });
      } else {
        await updateMeeting(itemId, { comments: updatedComments });
      }
      if (onRefresh) onRefresh();
      showMarqueeToast({ message: 'Yorum eklendi', type: 'info' });
    },
    [meetings, user, onUpdate, onRefresh]
  );

  // YORUM SİLME
  const handleDeleteComment = useCallback(
    async (itemId: string, commentId: string) => {
      const target = meetings.find(m => m.id === itemId);
      if (!target) return;

      const updatedComments = (target.comments || []).filter(c => c.id !== commentId);
      if (onUpdate) {
        await onUpdate(itemId, { comments: updatedComments });
      } else {
        await updateMeeting(itemId, { comments: updatedComments });
      }
      if (onRefresh) onRefresh();
    },
    [meetings, onUpdate, onRefresh]
  );

  // Durum Değiştirme (Tamamlandı olduğunda panodan gitmesi destekli)
  const handleCycleStatus = useCallback(
    (id: string, currentStatus?: PlannerMeeting['status']) => {
      const statusOrder: PlannerMeeting['status'][] = ['todo', 'planned', 'dev', 'test', 'done'];
      const currentIdx = statusOrder.indexOf(currentStatus || 'todo');
      const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];
      onStatusChange(id, nextStatus);

      if (nextStatus === 'done' && hideCompleted) {
        showMarqueeToast({
          message: t('planner.completedArchived') || 'Görev tamamlandı ve panodan kaldırıldı',
          type: 'success',
        });
      }
    },
    [onStatusChange, hideCompleted, t]
  );

  // Otomatik Düzenle & Hizala
  const handleAutoArrange = () => {
    const canvasWidth = canvasRef.current?.clientWidth || 1100;
    const cardWidth = 320;
    const cardHeight = 350;
    const gap = 20;
    const columns = Math.max(1, Math.floor((canvasWidth - 40) / (cardWidth + gap)));

    const nextPositions: Record<string, { x: number; y: number }> = {};
    displayItems.forEach((item, index) => {
      if (!item.id) return;
      const col = index % columns;
      const row = Math.floor(index / columns);
      const targetX = 30 + col * (cardWidth + gap);
      const targetY = 30 + row * (cardHeight + gap);
      nextPositions[item.id] = { x: targetX, y: targetY };
      if (onUpdate) {
        onUpdate(item.id, { canvasX: targetX, canvasY: targetY });
      }
    });

    setPositions(nextPositions);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextPositions));
    } catch { /* ignore */ }
    showMarqueeToast({ message: t('planner.autoArrange') || 'Notlar hizalandı', type: 'success' });
  };

  // Tuvali Sıfırla
  const handleResetCanvas = () => {
    localStorage.removeItem(storageKey);
    const resetPositions: Record<string, { x: number; y: number }> = {};
    displayItems.forEach((item, index) => {
      if (!item.id) return;
      const col = index % 4;
      const row = Math.floor(index / 4);
      resetPositions[item.id] = { x: 30 + col * 330, y: 30 + row * 360 };
    });
    setPositions(resetPositions);
    showMarqueeToast({ message: t('planner.resetCanvas') || 'Tuval sıfırlandı', type: 'info' });
  };

  // Google Keep / Miro Tarzı Hızlı Not/Görev/Fikir Ekleme
  const handleAddQuickNote = async (data: any) => {
    if (!user) return false;

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const spawnX = 50 + Math.floor(Math.random() * 100);
      const spawnY = 50 + Math.floor(Math.random() * 100);

      const isJira = data.stickyType === 'jira';

      const noteData: any = {
        userId: user.uid,
        title: data.title.trim() || 'Yeni Not',
        notes: data.notes.trim(),
        date: todayStr,
        startTime: '09:00',
        itemType: isJira ? 'jira' : 'sticky',
        stickyType: data.stickyType,
        status: 'todo',
        priority: data.priority,
        stickyColor: data.color,
        canvasX: spawnX,
        canvasY: spawnY,
        checklist: data.checklist,
        comments: [],
        createdAt: new Date(),
      };

      if (isJira) {
        if (data.jiraId.trim()) noteData.jiraTaskId = data.jiraId.trim().toUpperCase();
        noteData.jiraTaskType = 'task';
      }

      const docId = await addMeeting(noteData as PlannerMeeting, false);
      if (docId) {
        setPositions(prev => ({
          ...prev,
          [docId]: { x: spawnX, y: spawnY },
        }));

        if (onAddLocal) {
          onAddLocal({ ...noteData, id: docId } as PlannerMeeting);
        } else if (onRefresh) {
          onRefresh();
        }
      }

      showMarqueeToast({ message: t('planner.newSticky') || 'Yapışkan not panoya eklendi!', type: 'success' });
      return true;
    } catch (err) {
      console.error('Quick note error:', err);
      showMarqueeToast({ message: 'Not eklenirken hata oluştu', type: 'error' });
      return false;
    }
  };

  // Dışarıdan veya başlıktaki butondan not oluşturma tetiklendiğinde
  useEffect(() => {
    const handleOpenComposer = () => setIsComposerOpen(true);
    window.addEventListener('open-sticky-composer', handleOpenComposer);
    return () => window.removeEventListener('open-sticky-composer', handleOpenComposer);
  }, []);

  // Çift tıklayarak not oluşturma
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== canvasRef.current) return;
    setIsComposerOpen(true);
  };

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-[120] bg-stone-100 dark:bg-zinc-950 p-4 sm:p-6 overflow-y-auto' : ''}`}>
      {/* ÜST ARAÇ ÇUBUĞU (Toolbar) */}
      <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-sm mb-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Sol: Başlık, Görev/Not Sayacı & Arşiv Rozeti */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <FaThumbtack className="text-xl rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-lg text-stone-900 dark:text-zinc-100">
                  {t('planner.stickyBoard') || 'Yapışkan Not Panosu'}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {displayItems.length} Aktif
                </span>
                {completedCount > 0 && (
                  <button
                    onClick={() => setHideCompleted(!hideCompleted)}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 ${
                      hideCompleted
                        ? 'bg-stone-100 dark:bg-zinc-800 text-stone-500 border-stone-200 dark:border-zinc-700 hover:text-stone-800 dark:hover:text-zinc-200'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    }`}
                    title={hideCompleted ? 'Tamamlananları panoda göster' : 'Tamamlananları panodan gizle'}
                  >
                    {hideCompleted ? <FaEyeSlash size={10} /> : <FaEye size={10} />}
                    <span>{completedCount} Biten ({hideCompleted ? 'Gizli' : 'Gösteriliyor'})</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Sürüklenebilir görevler, fikirler, notlar, alt checklistler ve yorumlar
              </p>
            </div>
          </div>

          {/* Orta / Sağ: Arama, Tür Filtreleri, Alan Boyutu & Aksiyonlar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Arama Inputu */}
            <div className="relative min-w-[150px] sm:min-w-[180px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Başlık veya yorumlarda ara..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <FaTimes size={10} />
                </button>
              )}
            </div>

            {/* Not Türü Filtresi (Tümü, Görev, Jira, Fikir, Not) */}
            <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-2 py-1 rounded-lg transition ${selectedTypeFilter === 'all' ? 'bg-white dark:bg-zinc-700 shadow-xs text-stone-900 dark:text-white' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                Tümü
              </button>
              <button
                onClick={() => setSelectedTypeFilter('task')}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${selectedTypeFilter === 'task' ? 'bg-white dark:bg-zinc-700 shadow-xs text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                <FaCheckCircle size={10} />
                <span>Görev</span>
              </button>
              <button
                onClick={() => setSelectedTypeFilter('jira')}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${selectedTypeFilter === 'jira' ? 'bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-400' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                <FaHashtag size={10} />
                <span>Jira</span>
              </button>
              <button
                onClick={() => setSelectedTypeFilter('idea')}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${selectedTypeFilter === 'idea' ? 'bg-white dark:bg-zinc-700 shadow-xs text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                <FaLightbulb size={10} />
                <span>Fikir</span>
              </button>
              <button
                onClick={() => setSelectedTypeFilter('memo')}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${selectedTypeFilter === 'memo' ? 'bg-white dark:bg-zinc-700 shadow-xs text-purple-600 dark:text-purple-400' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                <FaStickyNote size={10} />
                <span>Not</span>
              </button>
            </div>

            {/* Tamamlananları Gizle / Göster Butonu */}
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                hideCompleted
                  ? 'bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
              }`}
              title={hideCompleted ? 'Tamamlanan görevler gizlendi. Görmek için tıkla.' : 'Tamamlananlar gösteriliyor. Gizlemek için tıkla.'}
            >
              {hideCompleted ? <FaEyeSlash size={11} /> : <FaEye size={11} />}
              <span className="hidden sm:inline">{hideCompleted ? 'Bitenler Gizli' : 'Bitenler Açık'}</span>
            </button>

            {/* Hangi Gündeyiz Bilgi Rozeti (Kullanıcı Talebi: Sadece hangi gündeyiz gözüksün) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-black shadow-xs">
              <FaCalendarAlt className="text-amber-500 text-xs" />
              <span>
                {format(selectedDate || new Date(), 'd MMMM yyyy, EEEE', { locale: dateLocale })}
              </span>
            </div>

            {/* Görünüm Modu Switcher */}
            <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs">
              <button
                onClick={() => setViewMode('canvas')}
                title="Serbest Tuval (İstediğin Yere Koy)"
                className={`p-1.5 rounded-lg transition ${viewMode === 'canvas' ? 'bg-amber-400 text-stone-950 shadow-xs font-bold' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                <FaThumbtack size={12} className="rotate-45" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Hizalı Izgara (Google Keep)"
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-amber-400 text-stone-950 shadow-xs font-bold' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                <FaBorderAll size={12} />
              </button>
              <button
                onClick={() => setViewMode('columns')}
                title="Kolonlar (Kanban)"
                className={`p-1.5 rounded-lg transition ${viewMode === 'columns' ? 'bg-amber-400 text-stone-950 shadow-xs font-bold' : 'text-stone-500 dark:text-zinc-400'}`}
              >
                <FaColumns size={12} />
              </button>
            </div>

            {/* Hizala & Sıfırla (Canvas Modu) */}
            {viewMode === 'canvas' && (
              <>
                <button
                  onClick={handleAutoArrange}
                  title="Notları Düzenle & Hizala"
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <FaMagic className="text-amber-500 text-[11px]" />
                  <span className="hidden md:inline">Hizala</span>
                </button>

                <button
                  onClick={handleResetCanvas}
                  title="Tuvali Sıfırla"
                  className="px-2 py-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition text-xs font-bold"
                >
                  <FaTimes size={11} />
                </button>
              </>
            )}

            {/* Tam Ekran Butonu */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Tuval'}
              className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 rounded-xl transition text-xs active:scale-95"
            >
              {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
            </button>

            {/* Fotoğraftan Oku */}
            <button
              onClick={onPhotoScan}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              title="Kamera veya fotoğraftan oku"
            >
              <FaCameraRetro className="text-amber-500" />
              <span className="hidden sm:inline">Fotoğraftan Oku</span>
            </button>

            {/* Yeni Not / Görev Ekle Butonu */}
            <button
              onClick={() => setIsComposerOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer"
            >
              <FaPlus size={10} />
              <span>{t('planner.newSticky') || 'Yeni Not'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* GOOGLE KEEP TARZI GENİŞLETİLEBİLİR NOT OLUŞTURUCU */}
      <AnimatePresence>
        {isComposerOpen && (
          <StickyComposerCard 
            onClose={() => setIsComposerOpen(false)} 
            onAdd={handleAddQuickNote} 
          />
        )}
      </AnimatePresence>

      {/* ANA TUVAL ALANI (Doğal, Ferah ve İç İçe Scroll Olmayan Açık Tuval) */}
      {viewMode === 'canvas' && (
        <div
          ref={canvasRef}
          onDoubleClick={handleCanvasDoubleClick}
          className="w-full relative rounded-3xl border border-stone-200/80 dark:border-zinc-800/80 p-6 select-none bg-stone-50/70 dark:bg-zinc-950/80 shadow-sm transition-all"
          style={{
            minHeight: `${canvasMinHeight}px`,
            backgroundImage: 'radial-gradient(circle, rgba(160, 160, 160, 0.28) 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Boş Durum İpucu */}
          {displayItems.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
                <FaThumbtack size={28} className="rotate-45" />
              </div>
              <h3 className="font-black text-base text-stone-800 dark:text-zinc-200 mb-1">
                Panoda gösterilecek not bulunamadı
              </h3>
              <p className="text-xs text-stone-400 dark:text-zinc-500 max-w-sm">
                {completedCount > 0 && hideCompleted
                  ? `${completedCount} görev tamamlandığı için gizlendi. Görmek için yukarıdaki "Bitenler Gizli" düğmesine tıklayın.`
                  : 'Yeni bir not, fikir veya görev eklemek için yukarıdaki "+ Yeni Not" butonuna tıklayın.'}
              </p>
            </div>
          ) : (
            <div className="sticky bottom-4 left-4 z-40 pointer-events-none inline-flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-200/60 dark:border-zinc-800/60 shadow-sm">
              <span>💡 Notları tutup ekranda istediğin yere taşıyabilir, altındaki 💬 butonuyla yorum yazabilirsin</span>
            </div>
          )}

          {/* Sürüklenebilir Yapışkan Notlar */}
          {displayItems.map((item, index) => {
            const pos = positions[item.id!] || {
              x: 30 + (index % 4) * 330,
              y: 30 + Math.floor(index / 4) * 360,
            };

            return (
              <DraggableStickyCard
                key={item.id}
                item={item}
                position={pos}
                onPositionChange={handlePositionChange}
                onColorChange={handleColorChange}
                onTogglePin={handleTogglePin}
                onToggleChecklist={handleToggleChecklist}
                onAddChecklistItem={handleAddChecklistItem}
                onDeleteChecklistItem={handleDeleteChecklistItem}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onCycleStatus={handleCycleStatus}
                onEdit={onEdit}
                onDelete={() => setItemToDelete(item)}
                canvasRef={canvasRef}
                isFreeform={true}
              />
            );
          })}
        </div>
      )}

      {/* IZGARA MODU (Google Keep Masonry Grid) */}
      {viewMode === 'grid' && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
          {displayItems.map(item => (
            <DraggableStickyCard
              key={item.id}
              item={item}
              position={{ x: 0, y: 0 }}
              onPositionChange={() => {}}
              onColorChange={handleColorChange}
              onTogglePin={handleTogglePin}
              onToggleChecklist={handleToggleChecklist}
              onAddChecklistItem={handleAddChecklistItem}
              onDeleteChecklistItem={handleDeleteChecklistItem}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onCycleStatus={handleCycleStatus}
              onEdit={onEdit}
              onDelete={() => setItemToDelete(item)}
              canvasRef={canvasRef}
              isFreeform={false}
            />
          ))}
        </div>
      )}

      {/* KOLONLAR MODU (Kanban Board) */}
      {viewMode === 'columns' && (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory custom-scrollbar min-h-[600px]">
          {(['todo', 'planned', 'dev', 'test', 'done'] as const).map(colStatus => {
            const colItems = displayItems.filter(i => (i.status || 'todo') === colStatus);
            const colTitles: Record<string, string> = {
              todo: 'Yapılacak (To Do)',
              planned: 'Planlandı',
              dev: 'Geliştirme',
              test: 'Testte',
              done: 'Tamamlandı',
            };
            return (
              <div
                key={colStatus}
                className="flex flex-col min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] shrink-0 snap-center bg-stone-50/50 dark:bg-zinc-900/30 rounded-3xl border border-stone-200 dark:border-zinc-800 p-3"
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200 dark:border-zinc-800">
                  <h3 className="font-black text-xs text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
                    {colTitles[colStatus]}
                  </h3>
                  <span className="bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                    {colItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {colItems.map(item => (
                    <DraggableStickyCard
                      key={item.id}
                      item={item}
                      position={{ x: 0, y: 0 }}
                      onPositionChange={() => {}}
                      onColorChange={handleColorChange}
                      onTogglePin={handleTogglePin}
                      onToggleChecklist={handleToggleChecklist}
                      onAddChecklistItem={handleAddChecklistItem}
                      onDeleteChecklistItem={handleDeleteChecklistItem}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                      onCycleStatus={handleCycleStatus}
                      onEdit={onEdit}
                      onDelete={() => setItemToDelete(item)}
                      canvasRef={canvasRef}
                      isFreeform={false}
                    />
                  ))}
                  {colItems.length === 0 && (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl text-xs text-stone-400">
                      Boş
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            onDelete(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="Yapışkan Notu Sil"
        message={`"${itemToDelete?.title}" başlıklı notu silmek istediğinize emin misiniz?`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
}

// ==========================================
// YAPIŞKAN NOT OLUŞTURUCU KARTI (MIRO TARZI)
// ==========================================
function StickyComposerCard({ onClose, onAdd }: { onClose: () => void, onAdd: (data: any) => Promise<boolean> }) {
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newColor, setNewColor] = useState<StickyColor>('yellow');
  const [newPriority, setNewPriority] = useState<PlannerMeeting['priority']>('medium');
  const [newStickyType, setNewStickyType] = useState<PlannerStickyType>('memo');
  const [newJiraId, setNewJiraId] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChecklistItems, setNewChecklistItems] = useState<PlannerChecklistItem[]>([]);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const theme = STICKY_THEMES[newColor];
  
  const handleAddComposerChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setNewChecklistItems(prev => [...prev, { id: `chk_${Date.now()}`, text: newChecklistText.trim(), done: false }]);
    setNewChecklistText('');
  };

  const handleSave = async () => {
    if (!newTitle.trim() && !newNotes.trim() && newChecklistItems.length === 0) return;
    setIsSubmittingNew(true);
    const success = await onAdd({
      title: newTitle,
      notes: newNotes,
      color: newColor,
      priority: newPriority,
      stickyType: newStickyType,
      jiraId: newJiraId,
      checklist: newChecklistItems
    });
    setIsSubmittingNew(false);
    if (success) {
      setNewTitle('');
      setNewNotes('');
      setNewChecklistItems([]);
      onClose(); // Kapatma eklendi
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8, rotate: 2 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-[340px] flex flex-col justify-between rounded-2xl border p-5 shadow-2xl ${theme.bgLight} ${theme.bgDark} ${theme.borderLight} ${theme.borderDark}`}
      >
        {/* Bant */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className={`h-4 w-24 rounded-sm shadow-sm ${theme.tapeColor} border border-black/5 dark:border-white/10`} />
        </div>
        
        <div className="flex items-center justify-between mb-3 mt-1">
          {/* Tür Seçici */}
          <div className="flex items-center gap-1">
            {(['task', 'jira', 'idea', 'memo', 'reminder'] as const).map(typeKey => {
              const cfg = NOTE_TYPE_CONFIG[typeKey];
              const Icon = cfg.icon;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setNewStickyType(typeKey)}
                  className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                    newStickyType === typeKey ? 'bg-black/10 dark:bg-white/20 shadow-xs' : 'opacity-50 hover:opacity-100'
                  }`}
                  title={cfg.label}
                >
                  <Icon size={12} />
                </button>
              );
            })}
          </div>
          <button type="button" onClick={onClose} className="p-1 opacity-50 hover:opacity-100 transition"><FaTimes size={12} /></button>
        </div>

        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder={newStickyType === 'jira' ? 'Jira Görev Adı...' : 'Not başlığı...'}
          className={`w-full text-lg font-black bg-transparent border-none focus:outline-none mb-3 ${theme.textLight} ${theme.textDark} placeholder-black/40 dark:placeholder-white/40`}
          autoFocus
        />

        <textarea
          rows={3}
          value={newNotes}
          onChange={e => setNewNotes(e.target.value)}
          placeholder="İçerik yazın..."
          className={`w-full text-sm font-medium bg-transparent border-none focus:outline-none resize-none mb-3 ${theme.textLight} ${theme.textDark} placeholder-black/40 dark:placeholder-white/40 custom-scrollbar`}
        />

        {/* Checklist */}
        {newChecklistItems.length > 0 && (
          <div className="space-y-1 mb-3 max-h-32 overflow-y-auto custom-scrollbar pr-1">
            {newChecklistItems.map((chk, idx) => (
              <div key={idx} className="flex justify-between text-xs bg-black/5 dark:bg-white/10 p-1.5 rounded">
                <span className={theme.textLight + ' ' + theme.textDark}>{chk.text}</span>
                <button type="button" onClick={() => setNewChecklistItems(prev => prev.filter((_, i) => i !== idx))}><FaTimes size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newChecklistText}
            onChange={e => setNewChecklistText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddComposerChecklistItem(); }}
            placeholder="Alt madde ekle..."
            className="flex-1 text-xs bg-white/40 dark:bg-black/20 px-2 py-1.5 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div className="flex flex-col gap-3 pt-3 border-t border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {COLOR_KEYS.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewColor(col)}
                  className={`w-4 h-4 rounded-full transition-transform ${newColor === col ? 'ring-2 ring-stone-900 dark:ring-white scale-125' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
                  style={{ backgroundColor: STICKY_THEMES[col].dotColor }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {newStickyType === 'jira' && (
              <input
                type="text"
                value={newJiraId}
                onChange={e => setNewJiraId(e.target.value)}
                placeholder="SPB-101"
                className="w-20 uppercase px-2 py-1.5 text-xs rounded-lg bg-white/50 dark:bg-black/30 border-none font-mono font-bold"
              />
            )}
            {!newStickyType || newStickyType !== 'jira' ? (
               <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="px-2 py-1.5 text-[10px] uppercase font-black tracking-wider rounded-lg bg-white/50 dark:bg-black/30 border-none text-stone-700 dark:text-zinc-300"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmittingNew || (!newTitle.trim() && !newNotes.trim() && newChecklistItems.length === 0)}
              className="ml-auto px-4 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-black flex items-center gap-1.5 hover:scale-105 transition active:scale-95 disabled:opacity-50"
            >
              <FaCheck size={10} />
              <span>{isSubmittingNew ? '...' : 'Panoya Ekle'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// TEKİL YAPIŞKAN NOT KARTI + YORUM SİSTEMİ
// ==========================================
interface DraggableStickyCardProps {
  item: PlannerMeeting;
  position: { x: number; y: number };
  onPositionChange: (id: string, newPos: { x: number; y: number }) => void;
  onColorChange: (id: string, color: StickyColor) => void;
  onTogglePin: (id: string, currentPin?: boolean) => void;
  onToggleChecklist: (itemId: string, checkId: string) => void;
  onAddChecklistItem: (itemId: string, text: string) => void;
  onDeleteChecklistItem: (itemId: string, checkId: string) => void;
  onAddComment: (itemId: string, text: string) => void;
  onDeleteComment: (itemId: string, commentId: string) => void;
  onCycleStatus: (id: string, currentStatus?: PlannerMeeting['status']) => void;
  onEdit: (item: PlannerMeeting) => void;
  onDelete: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isFreeform: boolean;
}

function DraggableStickyCard({
  item,
  position,
  onPositionChange,
  onColorChange,
  onTogglePin,
  onToggleChecklist,
  onAddChecklistItem,
  onDeleteChecklistItem,
  onAddComment,
  onDeleteComment,
  onCycleStatus,
  onEdit,
  onDelete,
  canvasRef,
  isFreeform,
}: DraggableStickyCardProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'tr' ? tr : enUS;

  const color = (item.stickyColor as StickyColor) || 'yellow';
  const theme = STICKY_THEMES[color] || STICKY_THEMES.yellow;
  const stickyType = item.stickyType || (item.itemType === 'jira' ? 'jira' : 'task');
  const typeCfg = NOTE_TYPE_CONFIG[stickyType] || NOTE_TYPE_CONFIG.task;
  const TypeIcon = typeCfg.icon;

  // Organik hafif açı
  const rotation = useMemo(() => {
    if (item.rotation !== undefined) return item.rotation;
    const str = item.id || 'abc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return ((hash % 7) - 3) * 0.35;
  }, [item.id, item.rotation]);

  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);

  useEffect(() => {
    if (isFreeform) {
      animate(x, position.x, { duration: 0.35, ease: 'easeOut' });
      animate(y, position.y, { duration: 0.35, ease: 'easeOut' });
    }
  }, [position.x, position.y, isFreeform, x, y]);

  // UI Durumları
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [inlineChecklistInput, setInlineChecklistInput] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);

  // Yorum Bölümü Açık/Kapalı ve Input State
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const comments = item.comments || [];

  const handleDragEnd = () => {
    if (!isFreeform) return;
    const finalX = Math.max(10, Math.round(x.get()));
    const finalY = Math.max(10, Math.round(y.get()));
    onPositionChange(item.id!, { x: finalX, y: finalY });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'done':
        return { label: 'Bitti', bg: 'bg-emerald-500 text-white', icon: <FaCheckCircle size={10} /> };
      case 'dev':
        return { label: 'Geliştirme', bg: 'bg-amber-500 text-white', icon: <FaClock size={10} /> };
      case 'test':
        return { label: 'Test', bg: 'bg-purple-500 text-white', icon: <FaFlask size={10} /> };
      case 'planned':
        return { label: 'Planlandı', bg: 'bg-blue-500 text-white', icon: <FaCalendarAlt size={10} /> };
      default:
        return { label: 'Yapılacak', bg: 'bg-stone-500 text-white', icon: <FaRegCircle size={10} /> };
    }
  };

  const statusInfo = getStatusBadge(item.status);

  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(item.id!, commentInput.trim());
    setCommentInput('');
  };

  return (
    <motion.div
      drag={isFreeform && !item.isPinned}
      dragMomentum={false}
      dragConstraints={canvasRef}
      onDragEnd={handleDragEnd}
      style={
        isFreeform
          ? {
              x,
              y,
              position: 'absolute',
              top: 0,
              left: 0,
              width: 310,
              zIndex: item.isPinned ? 50 : 10,
              rotate: rotation,
            }
          : { width: '100%', rotate: rotation }
      }
      whileDrag={{
        scale: 1.05,
        rotate: 0,
        zIndex: 100,
        cursor: 'grabbing',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
      }}
      className={`group rounded-2xl border p-4 shadow-sm transition-shadow flex flex-col justify-between ${
        isFreeform ? (item.isPinned ? 'cursor-default' : 'cursor-grab') : ''
      } ${theme.bgLight} ${theme.bgDark} ${theme.borderLight} ${theme.borderDark} hover:shadow-xl`}
    >
      {/* ÜST POST-IT BANDI */}
      <div className="relative -mt-6 mb-2 flex items-center justify-center">
        <div
          className={`h-3 w-20 rounded-sm shadow-xs ${theme.tapeColor} border border-black/5 dark:border-white/10`}
          title="Yapışkan Not Bandı"
        />
      </div>

      {/* ÜST BİLGİ & ARAÇLAR */}
      <div>
        <div className="flex items-start justify-between gap-1 mb-2">
          {/* Sol: Not Türü Rozeti & Durum Butonu */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Tür Rozeti */}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs tracking-wide ${typeCfg.colorClass}`}>
              <TypeIcon size={9} />
              <span>{item.jiraTaskId || typeCfg.label}</span>
            </span>

            {/* Durum Rozeti (Tıklayarak durumu değiştir) */}
            <button
              type="button"
              onClick={() => onCycleStatus(item.id!, item.status)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs active:scale-95 ${statusInfo.bg}`}
              title="Durumu değiştirmek için tıkla"
            >
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </button>
          </div>

          {/* Sağ: İğnele, Renk Paleti, Düzenle, Sil */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onTogglePin(item.id!, item.isPinned)}
              className={`p-1.5 rounded-lg transition ${
                item.isPinned
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100'
              }`}
              title={item.isPinned ? 'Sabitlemeyi Kaldır' : 'Panoya İğnele (Kıpırdamaz)'}
            >
              <FaThumbtack size={11} className={item.isPinned ? '' : 'rotate-45'} />
            </button>

            {/* Renk Değiştirme */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPalette(!showColorPalette)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition rounded-lg"
                title="Rengi Değiştir"
              >
                <FaPalette size={11} />
              </button>

              <AnimatePresence>
                {showColorPalette && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    className="absolute right-0 top-7 z-[110] bg-white dark:bg-zinc-800 p-2 rounded-2xl shadow-xl border border-stone-200 dark:border-zinc-700 flex gap-1.5"
                  >
                    {COLOR_KEYS.map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          onColorChange(item.id!, col);
                          setShowColorPalette(false);
                        }}
                        className={`w-4 h-4 rounded-full transition-transform ${color === col ? 'ring-2 ring-stone-900 dark:ring-white scale-125' : 'hover:scale-125'}`}
                        style={{ backgroundColor: STICKY_THEMES[col].dotColor }}
                        title={STICKY_THEMES[col].nameTr}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 opacity-0 group-hover:opacity-100 transition rounded-lg"
              title="Düzenle"
            >
              <FaEdit size={11} />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition rounded-lg"
              title="Sil"
            >
              <FaTrash size={11} />
            </button>
          </div>
        </div>

        {/* NOT BAŞLIĞI */}
        <h4 className={`text-sm sm:text-base font-black leading-snug line-clamp-2 mb-1.5 ${theme.textLight} ${theme.textDark} ${item.status === 'done' ? 'line-through opacity-70' : ''}`}>
          {item.title}
        </h4>

        {/* NOT METNİ */}
        {item.notes && (
          <p className="text-xs text-stone-700 dark:text-zinc-300 line-clamp-4 mb-2 font-medium leading-relaxed whitespace-pre-wrap">
            {item.notes}
          </p>
        )}

        {/* CHECKLIST (Madde Listesi) */}
        {item.checklist && item.checklist.length > 0 && (
          <div className="space-y-1 my-2 bg-black/5 dark:bg-black/20 p-2 rounded-xl border border-black/5 dark:border-white/5">
            {item.checklist.map(chk => (
              <div
                key={chk.id}
                className="flex items-center justify-between gap-2 group/chk text-xs py-0.5"
              >
                <button
                  type="button"
                  onClick={() => onToggleChecklist(item.id!, chk.id)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0"
                >
                  {chk.done ? (
                    <FaCheckCircle className="text-emerald-500 shrink-0" size={12} />
                  ) : (
                    <FaRegCircle className="text-stone-400 dark:text-zinc-500 shrink-0" size={12} />
                  )}
                  <span
                    className={`truncate font-medium ${
                      chk.done
                        ? 'line-through text-stone-400 dark:text-zinc-500'
                        : 'text-stone-800 dark:text-zinc-200'
                    }`}
                  >
                    {chk.text}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteChecklistItem(item.id!, chk.id)}
                  className="opacity-0 group-hover/chk:opacity-100 text-stone-400 hover:text-rose-500 p-0.5 transition"
                >
                  <FaTimes size={9} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Madde Ekleme Inputu */}
        {showAddChecklist ? (
          <div
            className="flex items-center gap-1 mt-1 mb-2"
            onPointerDown={e => e.stopPropagation()}
          >
            <input
              type="text"
              value={inlineChecklistInput}
              onChange={e => setInlineChecklistInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (inlineChecklistInput.trim()) {
                    onAddChecklistItem(item.id!, inlineChecklistInput.trim());
                    setInlineChecklistInput('');
                  }
                }
              }}
              placeholder="Madde yazıp Enter'a bas..."
              className="flex-1 text-xs bg-white/70 dark:bg-black/30 px-2 py-1 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                if (inlineChecklistInput.trim()) {
                  onAddChecklistItem(item.id!, inlineChecklistInput.trim());
                  setInlineChecklistInput('');
                }
                setShowAddChecklist(false);
              }}
              className="p-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold"
            >
              <FaCheck size={10} />
            </button>
            <button
              type="button"
              onClick={() => setShowAddChecklist(false)}
              className="p-1 text-xs text-stone-400"
            >
              <FaTimes size={10} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddChecklist(true)}
            className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 flex items-center gap-1 my-1 transition"
          >
            <FaPlus size={8} />
            <span>Madde ekle</span>
          </button>
        )}
      </div>

      {/* YORUMLAR BÖLÜMÜ (Kullanıcı Talebi: Taskların Altına Yorum Yapma) */}
      <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between">
          {/* Yorumları Göster / Gizle Butonu */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-xs font-bold transition rounded-lg px-1.5 py-0.5 ${
              comments.length > 0 || showComments
                ? 'text-amber-800 dark:text-amber-300 bg-amber-400/20'
                : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
            }`}
          >
            <FaComment size={10} />
            <span>{comments.length > 0 ? `${comments.length} Yorum` : 'Yorum Yaz'}</span>
          </button>

          {/* Sağ: Öncelik ve Tarih */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold">
            {item.dueDate ? (
              <span className="text-stone-500 dark:text-zinc-400 flex items-center gap-1">
                <FaCalendarAlt size={9} />
                {format(new Date(item.dueDate.includes('T') ? item.dueDate : `${item.dueDate}T12:00:00`), 'd MMM', { locale: dateLocale })}
              </span>
            ) : null}

            {item.priority && (
              <span
                className={`px-1.5 py-0.5 rounded-md uppercase tracking-wider text-[9px] font-black ${
                  item.priority === 'urgent'
                    ? 'bg-rose-500 text-white'
                    : item.priority === 'high'
                    ? 'bg-orange-500 text-white'
                    : item.priority === 'medium'
                    ? 'bg-amber-400 text-stone-900'
                    : 'bg-blue-400 text-white'
                }`}
              >
                {item.priority === 'urgent' ? 'Acil' : item.priority === 'high' ? 'Yüksek' : item.priority === 'medium' ? 'Orta' : 'Düşük'}
              </span>
            )}
          </div>
        </div>

        {/* Genişletilmiş Yorum Alanı */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2 overflow-hidden"
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Önceki Yorumlar Listesi */}
              {comments.length > 0 && (
                <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {comments.map(comm => (
                    <div
                      key={comm.id}
                      className="bg-white/80 dark:bg-black/40 p-2 rounded-xl border border-black/5 dark:border-white/10 text-xs flex flex-col gap-0.5 group/com"
                    >
                      <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-500 font-bold">
                        <span>{comm.authorName || 'Kullanıcı'}</span>
                        <div className="flex items-center gap-1">
                          <span>
                            {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true, locale: dateLocale })}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteComment(item.id!, comm.id)}
                            className="opacity-0 group-hover/com:opacity-100 hover:text-rose-500 p-0.5 transition"
                            title="Yorumu sil"
                          >
                            <FaTrash size={8} />
                          </button>
                        </div>
                      </div>
                      <p className="text-stone-800 dark:text-zinc-200 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                        {comm.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Yeni Yorum Yazma Formu */}
              <form onSubmit={handleSendComment} className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="Yorum ekle..."
                  className="flex-1 text-xs bg-white/90 dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold transition shadow-xs"
                  title="Yorum Gönder"
                >
                  <FaPaperPlane size={10} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
