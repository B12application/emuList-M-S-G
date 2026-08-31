// src/frontend/pages/CalorieDetailsPage.tsx
// Kaydedilen Öğünler & Detaylı Kalori İstatistikleri Sayfası

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaFire, FaChartPie, FaUtensils, FaCalendarAlt,
  FaSearch, FaRobot, FaChevronRight, FaPlus, FaFilter, FaListAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { getChatSessions, formatBytes } from '../services/calorieChatService';
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

      for (const msg of session.messages) {
        if (msg.role === 'assistant' && msg.mealData && msg.mealData.items) {
          const dateObj = msg.timestamp?.toDate
            ? msg.timestamp.toDate()
            : msg.timestamp instanceof Date
              ? msg.timestamp
              : new Date(session.createdAt?.toDate ? session.createdAt.toDate() : session.createdAt || Date.now());

          const dateKey = dateObj.toISOString().slice(0, 10);
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

          for (const item of msg.mealData.items) {
            map[dateKey].items.push({
              ...item,
              timestamp: dateObj,
              sessionTitle: session.title,
            });
          }
        }
      }
    }

    const sorted = Object.values(map).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return sorted;
  }, [sessions]);

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

    const todayKey = new Date().toISOString().slice(0, 10);
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
    const todayKey = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoKey = weekAgo.toISOString().slice(0, 10);

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
          filteredDays.map(day => (
            <motion.div
              key={day.dateKey}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm"
            >
              {/* Day Header */}
              <div className="px-5 py-4 bg-stone-50/80 dark:bg-zinc-800/50 border-b border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white capitalize">
                    {day.displayDate}
                  </h3>
                  <div className="text-[11px] text-stone-400 dark:text-zinc-500 font-medium">
                    {day.items.length} kayıtlı besin
                  </div>
                </div>

                {/* Day Macro Badges */}
                <div className="flex items-center gap-2 text-xs font-bold">
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
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                {day.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                        🍽️
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-stone-400 dark:text-zinc-500 font-medium">
                          Porsiyon: {item.amount}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                        {item.calories} kcal
                      </div>
                      <div className="text-[10px] text-stone-400 dark:text-zinc-500">
                        {item.protein}g P • {item.carbs}g K • {item.fat}g Y
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
