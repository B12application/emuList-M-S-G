// src/frontend/pages/CalorieDetailsPage.tsx
// Kaydedilen Öğünler & Detaylı Kalori İstatistikleri Sayfası

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaFire, FaChartPie, FaUtensils, FaCalendarAlt,
  FaSearch, FaRobot, FaChevronRight, FaPlus, FaFilter, FaListAlt,
  FaTrash, FaHeartbeat, FaGripVertical, FaExchangeAlt, FaMoon,
  FaCalendarDay, FaTimes, FaHistory
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import {
  getChatSessions,
  deleteMealItemFromSession,
  deleteDayFromCalorieReport,
  moveMealItemToDate,
  moveAllDayMealsToDate,
  getDateKey,
  formatBytes
} from '../services/calorieChatService';
import { useCalorieAiUsage } from '../services/calorieLimitService';
import type { ChatSession, MealItem } from '../services/calorieChatService';

interface GroupedMealDay {
  dateKey: string; // YYYY-MM-DD
  displayDate: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  items: {
    name: string;
    amount: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    timestamp: any;
    sessionTitle?: string;
    sessionId: string;
    messageIndex: number;
    itemIndex: number;
  }[];
}

export default function CalorieDetailsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hasAccess, loading: accessLoading } = useFeatureAccess();
  const { usage: quotaUsage } = useCalorieAiUsage(user?.uid);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRange, setSelectedRange] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getChatSessions(user.uid, 500)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Aggregate all meal items grouped by day
  const groupedDays = useMemo(() => {
    const map: Record<string, GroupedMealDay> = {};

    for (const session of sessions) {
      if (!session.messages) continue;

      for (let msgIdx = 0; msgIdx < session.messages.length; msgIdx++) {
        const msg = session.messages[msgIdx];
        if (msg.role === 'assistant' && msg.mealData && msg.mealData.items) {
          const dateObj = msg.timestamp?.toDate
            ? msg.timestamp.toDate()
            : msg.timestamp instanceof Date
              ? msg.timestamp
              : new Date(session.createdAt?.toDate ? session.createdAt.toDate() : session.createdAt || Date.now());

          const dateKey = getDateKey(dateObj);
          const displayDate = new Intl.DateTimeFormat('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(dateObj);

          if (!map[dateKey]) {
            map[dateKey] = {
              dateKey,
              displayDate,
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
              items: [],
            };
          }

          map[dateKey].totalCalories += msg.mealData.totalCalories || 0;
          map[dateKey].totalProtein += msg.mealData.totalProtein || 0;
          map[dateKey].totalCarbs += msg.mealData.totalCarbs || 0;
          map[dateKey].totalFat += msg.mealData.totalFat || 0;

          for (let itemIdx = 0; itemIdx < msg.mealData.items.length; itemIdx++) {
            const item = msg.mealData.items[itemIdx];
            map[dateKey].items.push({
              ...item,
              timestamp: dateObj,
              sessionTitle: session.title,
              sessionId: session.id!,
              messageIndex: msgIdx,
              itemIndex: itemIdx,
            });
          }
        }
      }
    }

    const sorted = Object.values(map).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return sorted;
  }, [sessions]);

  // Tek bir besin öğesini rapordan sil
  const handleDeleteItem = async (item: {
    name: string;
    sessionId: string;
    messageIndex: number;
    itemIndex: number;
  }) => {
    if (!window.confirm(`"${item.name}" besinini kalori raporundan silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteMealItemFromSession(item.sessionId, item.messageIndex, item.itemIndex, item.name);

      // Optimistik yerel state güncellemesi
      setSessions(prevSessions => {
        return prevSessions.map(session => {
          if (session.id !== item.sessionId) return session;

          const updatedMessages = [...(session.messages || [])];
          const targetMsg = updatedMessages[item.messageIndex];
          if (!targetMsg || !targetMsg.mealData) return session;

          const updatedItems = [...targetMsg.mealData.items];
          let targetIndex = item.itemIndex;
          if (updatedItems[targetIndex]?.name !== item.name) {
            const foundIdx = updatedItems.findIndex(i => i.name === item.name);
            if (foundIdx !== -1) targetIndex = foundIdx;
          }
          updatedItems.splice(targetIndex, 1);

          if (updatedItems.length === 0) {
            updatedMessages[item.messageIndex] = {
              ...targetMsg,
              mealData: null,
            };
          } else {
            const totalCalories = updatedItems.reduce((s, i) => s + (Number(i.calories) || 0), 0);
            const totalProtein = updatedItems.reduce((s, i) => s + (Number(i.protein) || 0), 0);
            const totalCarbs = updatedItems.reduce((s, i) => s + (Number(i.carbs) || 0), 0);
            const totalFat = updatedItems.reduce((s, i) => s + (Number(i.fat) || 0), 0);

            updatedMessages[item.messageIndex] = {
              ...targetMsg,
              mealData: {
                items: updatedItems,
                totalCalories,
                totalProtein,
                totalCarbs,
                totalFat,
              },
            };
          }

          const sessionTotalCalories = updatedMessages.reduce(
            (sum, msg) => sum + (msg.mealData?.totalCalories || 0),
            0
          );

          return {
            ...session,
            messages: updatedMessages,
            totalCalories: sessionTotalCalories,
          };
        });
      });

      toast.success(`"${item.name}" rapordan silindi.`);
    } catch (err: any) {
      console.error('Besin silinemedi:', err);
      toast.error(err?.message || 'Silme işlemi başarısız oldu.');
    }
  };

  // Bir günün tüm besin kayıtlarını rapordan temizle
  const handleDeleteDay = async (dateKey: string, displayDate: string) => {
    if (!user) return;
    if (!window.confirm(`${displayDate} tarihindeki tüm öğünleri kalori raporundan silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteDayFromCalorieReport(user.uid, dateKey);

      setSessions(prevSessions => {
        return prevSessions.map(session => {
          if (!session.messages) return session;
          let modified = false;
          const updatedMessages = session.messages.map(msg => {
            if (msg.role === 'assistant' && msg.mealData) {
              const dateObj = msg.timestamp?.toDate
                ? msg.timestamp.toDate()
                : msg.timestamp instanceof Date
                  ? msg.timestamp
                  : new Date(session.createdAt?.toDate ? session.createdAt.toDate() : session.createdAt || Date.now());
              const msgDateKey = getDateKey(dateObj);
              if (msgDateKey === dateKey) {
                modified = true;
                return { ...msg, mealData: null };
              }
            }
            return msg;
          });
          if (modified) {
            const total = updatedMessages.reduce((sum, m) => sum + (m.mealData?.totalCalories || 0), 0);
            return { ...session, messages: updatedMessages, totalCalories: total };
          }
          return session;
        });
      });

      toast.success(`${displayDate} kayıtları temizlendi.`);
    } catch (err: any) {
      console.error('Gün silinemedi:', err);
      toast.error('Kayıtlar silinirken hata oluştu.');
    }
  };

  // ── Sürükle-Bırak & Tarih Taşıma Durumları ──────────────────
  const [draggedItem, setDraggedItem] = useState<{
    name: string;
    sessionId: string;
    messageIndex: number;
    itemIndex: number;
    fromDateKey: string;
    timestamp: Date;
  } | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Tarih Değiştirme Modalı Durumu
  const [moveModal, setMoveModal] = useState<{
    isOpen: boolean;
    itemName?: string;
    sessionId?: string;
    messageIndex?: number;
    itemIndex?: number;
    sourceDateKey: string;
    isEntireDay?: boolean;
    targetDateKey: string;
  } | null>(null);

  // Tarih yardımcıları
  const getPreviousDayKey = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    return getDateKey(prev);
  };

  const formatDisplayDate = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    }).format(new Date(y, m - 1, d));
  };

  const formatShortDate = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
    }).format(new Date(y, m - 1, d));
  };

  const isNightOwlEntry = (timestamp: Date): boolean => {
    if (!timestamp) return false;
    const hours = timestamp.getHours ? timestamp.getHours() : new Date(timestamp).getHours();
    return hours >= 0 && hours < 5;
  };

  // Tek bir besin öğesini hedef tarihe taşı
  const handleMoveItemToDate = async (
    item: {
      name: string;
      sessionId: string;
      messageIndex: number;
      itemIndex: number;
      fromDateKey: string;
    },
    targetDateKey: string
  ) => {
    if (!item || !targetDateKey || item.fromDateKey === targetDateKey) return;
    setIsMoving(true);

    try {
      await moveMealItemToDate(
        item.sessionId,
        item.messageIndex,
        item.itemIndex,
        targetDateKey,
        item.name
      );

      if (user) {
        const updated = await getChatSessions(user.uid, 500);
        setSessions(updated);
      }

      const formatted = formatDisplayDate(targetDateKey);
      toast.success(`"${item.name}" ${formatted} gününe aktarıldı! 🚀`);
    } catch (err: any) {
      console.error('Öğün taşınamadı:', err);
      toast.error('Öğün taşınırken bir hata oluştu.');
    } finally {
      setIsMoving(false);
      setDraggedItem(null);
      setDragOverDateKey(null);
      setMoveModal(null);
    }
  };

  // Bir günün tüm öğünlerini hedef tarihe taşı (Örn: 5 Eylül -> 4 Eylül)
  const handleMoveEntireDayToDate = async (sourceDateKey: string, targetDateKey: string) => {
    if (!user || !sourceDateKey || !targetDateKey || sourceDateKey === targetDateKey) return;
    setIsMoving(true);

    try {
      await moveAllDayMealsToDate(user.uid, sourceDateKey, targetDateKey);

      const updated = await getChatSessions(user.uid, 500);
      setSessions(updated);

      const formatted = formatDisplayDate(targetDateKey);
      toast.success(`Tüm öğünler ${formatted} gününe aktarıldı! 🎉`);
    } catch (err: any) {
      console.error('Öğünler aktarılamadı:', err);
      toast.error('Öğünler taşınırken hata oluştu.');
    } finally {
      setIsMoving(false);
      setMoveModal(null);
    }
  };

  // Overall totals
  const overallTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let totalItems = 0;

    for (const day of groupedDays) {
      calories += day.totalCalories;
      protein += day.totalProtein;
      carbs += day.totalCarbs;
      fat += day.totalFat;
      totalItems += day.items.length;
    }

    const todayKey = getDateKey(new Date());
    const todayData = groupedDays.find(d => d.dateKey === todayKey);

    return {
      totalCalories: calories,
      totalProtein: protein,
      totalCarbs: carbs,
      totalFat: fat,
      totalItems,
      todayCalories: todayData?.totalCalories || 0,
      todayProtein: todayData?.totalProtein || 0,
      todayCarbs: todayData?.totalCarbs || 0,
      todayFat: todayData?.totalFat || 0,
    };
  }, [groupedDays]);

  // Filtered days
  const filteredDays = useMemo(() => {
    const todayKey = getDateKey(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoKey = getDateKey(weekAgo);

    return groupedDays.filter(day => {
      // Range filter
      if (selectedRange === 'today' && day.dateKey !== todayKey) return false;
      if (selectedRange === 'week' && day.dateKey < weekAgoKey) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = day.displayDate.toLowerCase().includes(q);
        const matchesItem = day.items.some(i => i.name.toLowerCase().includes(q));
        return matchesDate || matchesItem;
      }

      return true;
    });
  }, [groupedDays, selectedRange, searchQuery]);

  if (accessLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/calorie-chat"
            className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-amber-400/20 transition-colors shadow-sm"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <FaUtensils className="text-amber-500 text-xl" />
              Detaylı Kalori Raporu
            </h1>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              emuAI tarafından analiz edilip kaydedilen tüm öğünleriniz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily AI Quota Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold shadow-sm ${
              quotaUsage.isLimitReached
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : quotaUsage.remainingToday <= 5
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}
            title="Günlük AI analiz kotanız (Gece 00:00'da sıfırlanır)"
          >
            <FaFire className={`text-xs ${quotaUsage.isLimitReached ? 'text-rose-500' : 'text-amber-500 animate-pulse'}`} />
            <span>Kalan AI Limiti:</span>
            <span className="font-black">{quotaUsage.remainingToday} / {quotaUsage.dailyLimit}</span>
          </div>

          <Link
            to="/body-profile"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/30 transition-colors shadow-sm"
          >
            <FaHeartbeat className="text-sm" />
            <span className="hidden sm:inline">Beden Profilim</span>
          </Link>

          <Link
            to="/calorie-chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-md shadow-amber-500/20"
          >
            <FaRobot className="text-sm" />
            <span>Sohbete Git</span>
          </Link>
        </div>
      </div>

      {/* Mobile AI Quota Banner */}
      <div className="sm:hidden mb-4 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FaFire className="text-amber-500" />
          <span className="font-semibold text-stone-700 dark:text-zinc-200">Günlük AI Limiti:</span>
        </div>
        <span className="font-black text-amber-600 dark:text-amber-400">
          {quotaUsage.remainingToday} / {quotaUsage.dailyLimit} Kalan
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 rounded-3xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase mb-1">
            <FaFire className="text-sm" /> Bugün
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {overallTotals.todayCalories} <span className="text-xs font-semibold text-stone-400">kcal</span>
          </div>
          <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-1 font-medium">
            {overallTotals.todayProtein}g P • {overallTotals.todayCarbs}g K • {overallTotals.todayFat}g Y
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-stone-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">
            <FaChartPie className="text-sm text-amber-500" /> Toplam Kalori
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {overallTotals.totalCalories} <span className="text-xs font-semibold text-stone-400">kcal</span>
          </div>
          <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-1 font-medium">
            Tüm kaydedilen öğünler
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-stone-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">
            <FaUtensils className="text-sm text-blue-500" /> Kayıtlı Besin
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {overallTotals.totalItems} <span className="text-xs font-semibold text-stone-400">öğe</span>
          </div>
          <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-1 font-medium">
            {groupedDays.length} farklı günde
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-stone-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">
            <FaCalendarAlt className="text-sm text-emerald-500" /> Günlük Ort.
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {groupedDays.length > 0 ? Math.round(overallTotals.totalCalories / groupedDays.length) : 0} <span className="text-xs font-semibold text-stone-400">kcal</span>
          </div>
          <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-1 font-medium">
            Gün başına düşen
          </div>
        </motion.div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
          <input
            type="text"
            placeholder="Yemek veya tarih ara (örn: Tavuk, Salata)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-amber-400 text-sm font-medium shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-stone-200/50 dark:border-zinc-700/50">
          {(['all', 'today', 'week'] as const).map(range => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRange === range
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {range === 'all' ? 'Tümü' : range === 'today' ? 'Bugün' : 'Son 7 Gün'}
            </button>
          ))}
        </div>
      </div>

      {/* Sürükleme Aktif Bildirim Bannerı */}
      <AnimatePresence>
        {draggedItem && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-amber-400/20 dark:bg-amber-500/20 border-2 border-dashed border-amber-500/50 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-200 mb-4"
          >
            <span className="flex items-center gap-2">
              <span className="animate-bounce">👉</span>
              <span>Sürükleniyor:</span>
              <strong className="text-amber-700 dark:text-amber-300">"{draggedItem.name}"</strong>
              <span className="text-stone-600 dark:text-zinc-400">— Taşımak istediğiniz günün üzerine bırakın</span>
            </span>
            <button
              type="button"
              onClick={() => { setDraggedItem(null); setDragOverDateKey(null); }}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-black text-[10px] hover:bg-amber-300 transition-all cursor-pointer"
            >
              Vazgeç
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sürüklenen Öğeyi Düne Bırakma Hızlı Hedef Alanı */}
      <AnimatePresence>
        {draggedItem && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverDateKey(getPreviousDayKey(draggedItem.fromDateKey));
            }}
            onDragLeave={() => setDragOverDateKey(null)}
            onDrop={(e) => {
              e.preventDefault();
              handleMoveItemToDate(draggedItem, getPreviousDayKey(draggedItem.fromDateKey));
            }}
            className={`p-4 mb-4 rounded-3xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${
              dragOverDateKey === getPreviousDayKey(draggedItem.fromDateKey)
                ? 'border-amber-400 bg-amber-400/25 text-amber-950 dark:text-amber-200 scale-[1.01] shadow-lg ring-4 ring-amber-400/20'
                : 'border-amber-400/60 bg-amber-50/60 dark:bg-zinc-800/60 text-amber-800 dark:text-amber-300 hover:border-amber-400'
            }`}
          >
            <FaMoon className="text-amber-500 text-sm" />
            <span>
              Buraya bırakarak doğrudan <strong>{formatDisplayDate(getPreviousDayKey(draggedItem.fromDateKey))} (Dün)</strong> gününe aktarın
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grouped Day List */}
      <div className="space-y-6">
        {filteredDays.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <FaUtensils className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1">
              Kayıtlı Öğün Bulunamadı
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
              emuAI ile henüz yemek analiz etmemiş olabilirsiniz veya aramanıza uygun öğün bulunamadı.
            </p>
            <Link
              to="/calorie-chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-md"
            >
              <FaRobot />
              emuAI ile Yemek Fotoğrafı Analiz Et
            </Link>
          </div>
        ) : (
          filteredDays.map(day => {
            const isDragTarget = dragOverDateKey === day.dateKey;
            const prevDayKey = getPreviousDayKey(day.dateKey);

            return (
              <motion.div
                key={day.dateKey}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedItem && draggedItem.fromDateKey !== day.dateKey) {
                    setDragOverDateKey(day.dateKey);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverDateKey === day.dateKey) {
                    setDragOverDateKey(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedItem && draggedItem.fromDateKey !== day.dateKey) {
                    handleMoveItemToDate(draggedItem, day.dateKey);
                  }
                }}
                className={`bg-white dark:bg-zinc-900 rounded-3xl border overflow-hidden shadow-sm transition-all duration-200 ${
                  isDragTarget
                    ? 'border-amber-400 ring-4 ring-amber-400/25 bg-amber-50/30 dark:bg-amber-950/20 scale-[1.01]'
                    : 'border-stone-200 dark:border-zinc-800'
                }`}
              >
                {/* Day Header */}
                <div className="px-5 py-4 bg-stone-50/80 dark:bg-zinc-800/50 border-b border-stone-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-stone-900 dark:text-white capitalize flex items-center gap-2">
                      <span>{day.displayDate}</span>
                      {isDragTarget && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 font-black animate-pulse">
                          Buraya Bırakın
                        </span>
                      )}
                    </h3>
                    <div className="text-[11px] text-stone-400 dark:text-zinc-500 font-medium">
                      {day.items.length} kayıtlı besin • Öğünleri sürükleyerek başka güne taşıyabilirsiniz
                    </div>
                  </div>

                  {/* Day Macro Badges & Actions */}
                  <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-400/15 text-amber-700 dark:text-amber-400 font-black border border-amber-400/20">
                      🔥 {day.totalCalories} kcal
                    </span>
                    <span className="hidden sm:inline px-2 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px]">
                      🥩 {day.totalProtein}g
                    </span>
                    <span className="hidden sm:inline px-2 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px]">
                      🍞 {day.totalCarbs}g
                    </span>
                    <span className="hidden sm:inline px-2 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px]">
                      🧈 {day.totalFat}g
                    </span>

                    {/* Tüm Günü Düne Taşı Butonu */}
                    <button
                      type="button"
                      onClick={() => handleMoveEntireDayToDate(day.dateKey, prevDayKey)}
                      title={`Bu gündeki tüm öğünleri ${formatShortDate(prevDayKey)} (Dün) gününe aktar`}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <FaMoon className="text-[10px] text-indigo-500" />
                      <span>Düne Aktar ({formatShortDate(prevDayKey)})</span>
                    </button>

                    {/* Başka Güne Taşı Butonu (Manuel Seçim) */}
                    <button
                      type="button"
                      onClick={() => setMoveModal({
                        isOpen: true,
                        sourceDateKey: day.dateKey,
                        targetDateKey: prevDayKey,
                        isEntireDay: true,
                      })}
                      title="Bu günün tüm kayıtlarını başka bir tarihe aktar"
                      className="p-2 text-stone-400 hover:text-amber-600 dark:text-zinc-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-all cursor-pointer"
                    >
                      <FaExchangeAlt className="text-xs" />
                    </button>

                    {/* Day Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDay(day.dateKey, day.displayDate)}
                      title={`${day.displayDate} gününün tüm kayıtlarını rapordan sil`}
                      className="p-2 text-stone-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Items List (Sürüklenebilir Öğeler) */}
                <div className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                  {day.items.map((item, idx) => {
                    const isNightOwl = isNightOwlEntry(item.timestamp);
                    const itemTimeStr = item.timestamp instanceof Date
                      ? item.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div
                        key={`${item.sessionId}-${item.messageIndex}-${item.itemIndex}-${idx}`}
                        draggable={true}
                        onDragStart={(e) => {
                          setDraggedItem({
                            name: item.name,
                            sessionId: item.sessionId,
                            messageIndex: item.messageIndex,
                            itemIndex: item.itemIndex,
                            fromDateKey: day.dateKey,
                            timestamp: item.timestamp,
                          });
                          e.dataTransfer.setData('text/plain', item.name);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggedItem(null);
                          setDragOverDateKey(null);
                        }}
                        className="px-5 py-3.5 flex items-center justify-between hover:bg-stone-50/60 dark:hover:bg-zinc-800/40 transition-colors group cursor-grab active:cursor-grabbing select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          {/* Sürükleme Tutamacı İkonu */}
                          <div
                            className="text-stone-300 dark:text-zinc-600 hover:text-amber-500 p-1 shrink-0 cursor-grab"
                            title="Bu öğünü başka bir günün üzerine sürükleyin"
                          >
                            <FaGripVertical className="text-xs" />
                          </div>

                          <div className="w-8 h-8 shrink-0 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                            🍽️
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-stone-900 dark:text-white truncate">
                                {item.name}
                              </span>

                              {/* 🌙 Akıllı Gece Girişi Rozeti (00:00 - 05:00 arası yenmişse) */}
                              {isNightOwl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveItemToDate(
                                      {
                                        name: item.name,
                                        sessionId: item.sessionId,
                                        messageIndex: item.messageIndex,
                                        itemIndex: item.itemIndex,
                                        fromDateKey: day.dateKey,
                                      },
                                      prevDayKey
                                    );
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 border border-indigo-200/80 dark:border-indigo-800/60 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                                  title={`Gece ${itemTimeStr}'de girildi. Dünün (${formatShortDate(prevDayKey)}) son öğününe aktarmak için tıklayın.`}
                                >
                                  <FaMoon className="text-[9.5px] text-indigo-500" />
                                  <span>Düne Aktar ({formatShortDate(prevDayKey)})</span>
                                </button>
                              )}
                            </div>

                            <div className="text-[11px] text-stone-400 dark:text-zinc-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                              <span>Porsiyon: {item.amount}</span>
                              {itemTimeStr && (
                                <span className="text-stone-400 dark:text-zinc-500">
                                  • Saat {itemTimeStr}
                                </span>
                              )}
                              {item.sessionTitle && (
                                <span className="hidden md:inline text-stone-300 dark:text-zinc-600">• {item.sessionTitle}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sağ Kısım: Kalori Değerleri & Eylemler */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                              {item.calories} kcal
                            </div>
                            <div className="text-[10px] text-stone-400 dark:text-zinc-500">
                              {item.protein}g P • {item.carbs}g K • {item.fat}g Y
                            </div>
                          </div>

                          {/* Güne Taşı Butonu */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMoveModal({
                                isOpen: true,
                                itemName: item.name,
                                sessionId: item.sessionId,
                                messageIndex: item.messageIndex,
                                itemIndex: item.itemIndex,
                                sourceDateKey: day.dateKey,
                                targetDateKey: prevDayKey,
                                isEntireDay: false,
                              });
                            }}
                            title="Farklı bir güne aktar"
                            className="p-2 text-stone-400 hover:text-amber-600 dark:text-zinc-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-all cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                          >
                            <FaExchangeAlt className="text-xs" />
                          </button>

                          {/* Item Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item);
                            }}
                            title={`"${item.name}" besinini rapordan sil`}
                            className="p-2 text-stone-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Tarih Değiştirme / Güne Taşıma Modalı ── */}
      <AnimatePresence>
        {moveModal && moveModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
                    📅
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 dark:text-white">
                      {moveModal.isEntireDay ? 'Günü Başka Tarihe Taşı' : 'Öğünü Başka Güne Taşı'}
                    </h3>
                    <p className="text-[10px] text-stone-400 dark:text-zinc-500">
                      Öğünün ait olduğu tarihi kolayca değiştirin
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMoveModal(null)}
                  className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 cursor-pointer"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>

              <div className="p-3 mb-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 text-xs">
                <span className="text-stone-400">Seçili Öğün:</span>{' '}
                <strong className="text-stone-900 dark:text-white">
                  {moveModal.isEntireDay ? `${formatDisplayDate(moveModal.sourceDateKey)} (Tüm Gün)` : moveModal.itemName}
                </strong>
              </div>

              {/* Hızlı Seçim Butonları */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Hızlı Seçenekler
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveModal(m => m ? { ...m, targetDateKey: getPreviousDayKey(m.sourceDateKey) } : null)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                      moveModal.targetDateKey === getPreviousDayKey(moveModal.sourceDateKey)
                        ? 'border-amber-400 bg-amber-400/15 text-amber-950 dark:text-amber-300'
                        : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    🌙 Dün ({formatShortDate(getPreviousDayKey(moveModal.sourceDateKey))})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveModal(m => m ? { ...m, targetDateKey: getDateKey(new Date()) } : null)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                      moveModal.targetDateKey === getDateKey(new Date())
                        ? 'border-amber-400 bg-amber-400/15 text-amber-950 dark:text-amber-300'
                        : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    ☀️ Bugün ({formatShortDate(getDateKey(new Date()))})
                  </button>
                </div>
              </div>

              {/* Manuel Tarih Seçici */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Veya Takvimden Seçin
                </label>
                <input
                  type="date"
                  value={moveModal.targetDateKey}
                  onChange={e => setMoveModal(m => m ? { ...m, targetDateKey: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMoveModal(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-bold text-xs hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={isMoving || !moveModal.targetDateKey}
                  onClick={() => {
                    if (!moveModal) return;
                    if (moveModal.isEntireDay) {
                      handleMoveEntireDayToDate(moveModal.sourceDateKey, moveModal.targetDateKey);
                    } else {
                      handleMoveItemToDate(
                        {
                          name: moveModal.itemName!,
                          sessionId: moveModal.sessionId!,
                          messageIndex: moveModal.messageIndex!,
                          itemIndex: moveModal.itemIndex!,
                          fromDateKey: moveModal.sourceDateKey,
                        },
                        moveModal.targetDateKey
                      );
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 text-stone-950 font-black text-xs hover:bg-amber-300 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isMoving ? 'Aktarılıyor...' : 'Güne Aktar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
