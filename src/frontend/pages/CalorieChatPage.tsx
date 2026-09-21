// src/frontend/pages/CalorieChatPage.tsx
// AI Kalori Asistanı — Mobil odaklı tam ekran chat sayfası

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaPlus, FaTrash, FaHistory, FaTimes,
  FaChevronRight, FaExclamationTriangle, FaDatabase, FaFire, FaChartPie,
  FaCamera, FaBullseye, FaRobot, FaEnvelope, FaCheckCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PageHeaderBanner from '../components/ui/PageHeaderBanner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import CalorieChatMessage, { TypingIndicator } from '../components/calorie-chat/CalorieChatMessage';
import CalorieChatInput from '../components/calorie-chat/CalorieChatInput';
import {
  sendCalorieMessage,
  createChatSession,
  addMessageToSession,
  getChatSessions,
  getChatSession,
  deleteChatSession,
  calculateTotalStorageSize,
  formatBytes,
} from '../services/calorieChatService';
import {
  useCalorieAiUsage,
  incrementCalorieAiUsage,
} from '../services/calorieLimitService';
import type { ChatMessage, ChatSession } from '../services/calorieChatService';
import { Timestamp } from 'firebase/firestore';

export default function CalorieChatPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { hasAccess, loading: accessLoading } = useFeatureAccess();
  const { usage: quotaUsage, refreshUsage } = useCalorieAiUsage(user?.uid);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Sidebar state (chat history)
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Storage info
  const [storageInfo, setStorageInfo] = useState<{
    totalBytes: number;
    sessionCount: number;
    totalMessages: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, scrollToBottom]);

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;
    setSessionsLoading(true);
    try {
      const data = await getChatSessions(user.uid);
      setSessions(data);
    } catch (error) {
      console.error('Sessions load failed:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  // Load storage info
  const loadStorageInfo = useCallback(async () => {
    if (!user) return;
    try {
      const info = await calculateTotalStorageSize(user.uid);
      setStorageInfo(info);
    } catch (error) {
      console.error('Storage info load failed:', error);
    }
  }, [user]);

  useEffect(() => {
    if (showHistory) {
      loadSessions();
      loadStorageInfo();
    }
  }, [showHistory, loadSessions, loadStorageInfo]);

  // Auto-restore last session on mount / page refresh
  useEffect(() => {
    if (!user) return;

    const autoRestoreSession = async () => {
      setIsLoading(true);
      try {
        const lastSessionId = localStorage.getItem(`last_calorie_session_${user.uid}`);
        if (lastSessionId) {
          const session = await getChatSession(lastSessionId);
          if (session && session.messages?.length > 0) {
            setMessages(session.messages);
            setCurrentSessionId(session.id!);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: If no saved ID or doc deleted, load user's most recent session from Firestore
        const recentSessions = await getChatSessions(user.uid, 1);
        if (recentSessions.length > 0) {
          const latest = recentSessions[0];
          setMessages(latest.messages || []);
          setCurrentSessionId(latest.id!);
          localStorage.setItem(`last_calorie_session_${user.uid}`, latest.id!);
        }
      } catch (error) {
        console.error('Auto restore session failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    autoRestoreSession();
  }, [user]);

  // Send message
  const handleSend = useCallback(async (text: string, imageBase64?: string, mimeType?: string) => {
    if (!user) return;

    if (quotaUsage.isLimitReached) {
      toast.error(`Günlük yapay zeka analiz limitinize (${quotaUsage.dailyLimit}/${quotaUsage.dailyLimit}) ulaştınız. Limitiniz gece 00:00'da sıfırlanacaktır.`);
      return;
    }

    // Create user message
    const userMessage: ChatMessage = {
      role: 'user',
      text,
      hasImage: !!imageBase64,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    try {
      // Create session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createChatSession(user.uid, text.slice(0, 50));
        setCurrentSessionId(sessionId);
        localStorage.setItem(`last_calorie_session_${user.uid}`, sessionId);
      }

      // Save user message to Firestore
      await addMessageToSession(sessionId, {
        ...userMessage,
        timestamp: Timestamp.now(),
      });

      // Get conversation history for context
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text,
      }));

      // Send to Gemini API
      const response = await sendCalorieMessage(text, imageBase64, mimeType, history);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: response.text,
        mealData: response.mealData,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to Firestore
      await addMessageToSession(sessionId, {
        ...assistantMessage,
        timestamp: Timestamp.now(),
      });

      // Increment daily AI quota counter
      await incrementCalorieAiUsage(user.uid);
      refreshUsage();
    } catch (error: any) {
      console.error('Send message error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        text: `❌ ${error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error(error.message || 'Mesaj gönderilemedi');
    } finally {
      setIsSending(false);
    }
  }, [user, currentSessionId, messages, quotaUsage.isLimitReached, quotaUsage.dailyLimit, refreshUsage]);

  // Load a previous session
  const handleLoadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const session = await getChatSession(sessionId);
      if (session) {
        setMessages(session.messages || []);
        setCurrentSessionId(sessionId);
        if (user) {
          localStorage.setItem(`last_calorie_session_${user.uid}`, sessionId);
        }
        setShowHistory(false);
      }
    } catch (error) {
      toast.error('Sohbet yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete a session
  const handleDeleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: t('calorieChat.deleteSessionTitle') || 'Sohbeti Sil',
      message: t('calorieChat.deleteSessionConfirm') || 'Bu sohbeti silmek istediğinize emin misiniz?',
      confirmLabel: t('common.delete') || 'Sil',
      onConfirm: async () => {
        try {
          await deleteChatSession(sessionId);
          setSessions(prev => prev.filter(s => s.id !== sessionId));
          if (currentSessionId === sessionId) {
            setMessages([]);
            setCurrentSessionId(null);
            if (user) {
              localStorage.removeItem(`last_calorie_session_${user.uid}`);
            }
          }
          toast.success(t('calorieChat.sessionDeleted') || 'Sohbet silindi');
          loadStorageInfo();
        } catch (error) {
          toast.error(t('common.genericError') || 'Silinemedi');
        }
      },
    });
  }, [currentSessionId, loadStorageInfo, user, t]);

  // New chat
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    if (user) {
      localStorage.removeItem(`last_calorie_session_${user.uid}`);
    }
    setShowHistory(false);
  }, [user]);

  const formatSessionDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Calculate total macros for active chat session
  const totalMacros = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const msg of messages) {
      if (msg.mealData) {
        calories += msg.mealData.totalCalories || 0;
        protein += msg.mealData.totalProtein || 0;
        carbs += msg.mealData.totalCarbs || 0;
        fat += msg.mealData.totalFat || 0;
      }
    }

    return { calories, protein, carbs, fat };
  }, [messages]);

  // Access check
  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess('calorieAi')) {
    return (
      <div className="w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <PageHeaderBanner
          title={language === 'tr' ? 'B12 AI Beslenme & Kalori Asistanı' : 'B12 AI Nutrition & Calorie Assistant'}
          subtitle={
            language === 'tr'
              ? 'Fotoğraftan tabak ve porsiyon analizi, anlık makro & kalori hesabı ve kişisel yaşam koçluğu'
              : 'Meal photo recognition, automated macros & calories, and personal nutrition coaching'
          }
          icon={<FaRobot className="text-amber-500 text-xl" />}
          badge="AI Life Agent"
          backTo="/"
          backLabel={t('common.backToProfile')}
        />

        <div className="space-y-8">
          {/* Hero Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl mb-4">
                  <FaCamera />
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-white mb-2">
                  {language === 'tr' ? 'Fotoğrafla Anında Besin Analizi' : 'Instant Photo Nutrition Analysis'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                  {language === 'tr'
                    ? 'Yediğiniz yemeğin fotoğrafını çekin veya galeriden yükleyin. B12 AI tabağı segmentlere ayırır, gramajı ve kalori/makro değerlerini saniyeler içinde hesaplar.'
                    : 'Take a photo of your meal or upload from gallery. B12 AI segments the plate, calculating portions, calories, and macros in seconds.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <FaCheckCircle className="text-xs" />
                <span>{language === 'tr' ? 'Gemini AI Görüntü İşleme' : 'Gemini AI Vision Engine'}</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl mb-4">
                  <FaBullseye />
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-white mb-2">
                  {language === 'tr' ? 'Beden Profili & Kalori Açığı' : 'Body Profile & Deficit Engine'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                  {language === 'tr'
                    ? 'Beden ölçüleriniz, yağ oranınız ve aktivite seviyenizle entegre çalışır. Kilo verme veya kas geliştirme hedefinize göre günlük kalori açığınızı otomatik dengeler.'
                    : 'Integrates with your body measurements, body fat, and activity level. Balances your daily deficit target for fat loss or hypertrophy.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <FaCheckCircle className="text-xs" />
                <span>{language === 'tr' ? '15 Bölgesel Mezura Entegrasyonu' : '15-Region Anthropometric Integration'}</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4">
                  <FaChartPie />
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-white mb-2">
                  {language === 'tr' ? 'Otomatik Arşiv & Makro Raporu' : 'Automated Nutrition Journal'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                  {language === 'tr'
                    ? 'Konuşarak veya fotoğrafla eklediğiniz her öğün anında günlük beslenme günlüğünüze kaydedilir. Günlük protein, karb ve yağ kotalarınızı canlı takip edersiniz.'
                    : 'Every meal you log via text or photo automatically saves to your daily journal with live tracking of daily protein, carb, and fat goals.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <FaCheckCircle className="text-xs" />
                <span>{language === 'tr' ? 'Kalori Raporuyla %100 Senkron' : '100% Synced with Calorie Report'}</span>
              </div>
            </motion.div>
          </div>

          {/* Interactive Chat Mockup / Demo Simulation */}
          <div className="bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-zinc-300">
                  {language === 'tr' ? 'Canlı AI Sohbet Simülasyonu (Örnek)' : 'Live AI Conversation Simulation (Sample)'}
                </span>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-800 dark:text-amber-300 font-black">
                B12 Vision AI v2.5
              </span>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-stone-200/80 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 p-3.5 rounded-2xl rounded-tr-xs text-xs max-w-md shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-stone-600 dark:text-zinc-300 font-bold pb-1 border-b border-stone-300/60 dark:border-zinc-700/60">
                    <span>📸 [Fotoğraf: Izgara Tavuklu Salata &amp; Ayran]</span>
                  </div>
                  <p>Bu öğünümün kalori ve protein değerini hesaplayıp günlüğüme ekler misin?</p>
                </div>
              </div>

              {/* AI Assistant response */}
              <div className="flex justify-start items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  🤖
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 p-4 rounded-2xl rounded-tl-xs text-xs shadow-md space-y-3 max-w-lg">
                  <p className="font-semibold text-stone-800 dark:text-zinc-200">
                    Harika bir öğün seçimi! Tabağınızdaki porsiyonları ve besin değerlerini analiz ettim:
                  </p>

                  <div className="space-y-1.5 p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>🍗 Izgara Tavuk Göğsü (180g)</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black">297 kcal • 55g P</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>🥗 Zeytinyağlı Akdeniz Yeşilliği</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black">85 kcal • 1g P</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>🥛 Tam Yağlı Ayran (200ml)</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black">76 kcal • 4g P</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-950 dark:text-amber-200 font-black">
                    <span>🔥 Toplam: 458 kcal</span>
                    <span>🥩 60g Protein</span>
                    <span>🍞 11g Karb</span>
                    <span>🧈 18g Yağ</span>
                  </div>

                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <FaCheckCircle />
                    <span>Öğün başarıyla bugünkü Kalori Raporunuza kaydedildi!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Access Request CTA Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 backdrop-blur-md shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 text-xs font-black">
                ✨ Özel AI Özelliği
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                Bu Özelliği Hesabınızda Aktif Edin
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                B12 AI Beslenme &amp; Kalori Asistanı özel izinle açılan kişiselleştirilmiş bir yapay zeka modülüdür. Hesabınıza tanımlanması için EMU ile iletişime geçebilirsiniz.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={`mailto:mustafaulusoy0707@gmail.com?subject=B12%20AI%20Kalori%20Asistani%20Erisim%20Talebi&body=Merhaba%20EMU%2C%0A%0AB12%20AI%20Beslenme%20%26%20Kalori%20Asistan%C4%B1%20mod%C3%BCl%C3%BCn%C3%BC%20hesab%C4%B1mda%20aktif%20etmek%20istiyorum.%0A%0AKullan%C4%B1c%C4%B1%20E-posta%3A%20${encodeURIComponent(user?.email || '')}%0AKullan%C4%B1c%C4%B1%20ID%3A%20${encodeURIComponent(user?.uid || '')}%0A%0ATe%C5%9Fekk%C3%BCrler!`}
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <FaEnvelope className="text-sm" />
                <span>Erişim Talebi Gönder (E-posta)</span>
              </a>
              <Link
                to="/calorie-details"
                className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-800 dark:text-zinc-200 font-bold text-xs rounded-2xl border border-stone-200 dark:border-zinc-800 transition-all text-center"
              >
                Örnek Raporu Gör
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-2 sm:px-4 flex flex-col h-[calc(100dvh-185px)] md:h-[calc(100vh-140px)] relative">
      <div className="flex flex-col flex-1 relative rounded-3xl overflow-hidden border border-stone-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-stone-200/80 dark:border-zinc-800/80 z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors md:hidden"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span>{t('calorieChat.navTitle') || 'B12 AI'}</span>
            </h1>
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {t('calorieChat.subtitle') || 'Fotoğraf ile Besin & Kalori Analizi'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily Quota Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              quotaUsage.isLimitReached
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : quotaUsage.remainingToday <= 5
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}
            title={t('calorieChat.quotaTooltip') || "Günlük AI analiz kotası (Gece 00:00'da yenilenir)"}
          >
            <FaFire className={`text-xs ${quotaUsage.isLimitReached ? 'text-rose-500' : 'text-amber-500 animate-pulse'}`} />
            <span className="hidden sm:inline">{t('calorieChat.remainingLimit') || 'Kalan Limit:'}</span>
            <span className="font-black">{quotaUsage.remainingToday} / {quotaUsage.dailyLimit}</span>
          </div>

          <Link
            to="/calorie-details"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 hover:bg-amber-400/30 transition-colors"
            title={t('calorieChat.detailedReport') || 'Detaylı Rapor'}
          >
            <FaChartPie className="text-sm" />
          </Link>
          <button
            onClick={handleNewChat}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
            title={t('calorieChat.newChat') || 'Yeni Sohbet'}
          >
            <FaPlus className="text-sm" />
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
            title={t('calorieChat.chatHistory') || 'Sohbet Geçmişi'}
          >
            <FaHistory className="text-sm" />
          </button>
        </div>
      </div>

      {/* Active Session Macro Summary Bar */}
      {messages.length > 0 && totalMacros.calories > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-400/10 dark:via-orange-400/10 dark:to-red-400/10 border-b border-amber-500/20 dark:border-amber-400/20 px-4 py-2 flex items-center justify-between z-10 backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
            <FaFire className="text-amber-500 text-xs" />
            <span>{t('calorieChat.sessionTotal') || 'Sohbet / Öğün Toplamı:'}</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="text-amber-600 dark:text-amber-400 font-black">
              🔥 {totalMacros.calories} <span className="text-[10px] font-normal">kcal</span>
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              🥩 {totalMacros.protein}g
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              🍞 {totalMacros.carbs}g
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              🧈 {totalMacros.fat}g
            </span>
          </div>
        </motion.div>
      )}

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar"
      >
        {/* Welcome message when empty */}
        {messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-4 py-12"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/25">
              <FaFire className="text-3xl text-white" />
            </div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white mb-2">
              {t('calorieChat.welcomeTitle') || 'Merhaba! 👋'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
              {t('calorieChat.welcomeDesc') || 'Yemek fotoğrafı çek veya yükle, anında kalori ve besin değerlerini öğren. Beslenme hakkında sorular da sorabilirsin!'}
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
              {[
                { emoji: '📸', text: t('calorieChat.tipPhoto') || 'Yemek fotoğrafı çek' },
                { emoji: '🥗', text: t('calorieChat.tipSalad') || '"Sezar salata kaç kalori?"' },
                { emoji: '📊', text: t('calorieChat.tipMacro') || 'Makro değerlerini öğren' },
                { emoji: '💡', text: t('calorieChat.tipAdvice') || 'Beslenme tavsiyesi al' },
              ].map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/50 rounded-2xl px-3 py-3 text-center"
                >
                  <div className="text-2xl mb-1">{tip.emoji}</div>
                  <div className="text-[11px] font-semibold text-stone-600 dark:text-zinc-400">{tip.text}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <CalorieChatMessage
            key={idx}
            message={msg}
            isLast={idx === messages.length - 1}
          />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isSending && <TypingIndicator />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 relative z-20">
        <CalorieChatInput
          onSend={handleSend}
          disabled={isSending}
          placeholder={t('calorieChat.inputPlaceholder') || 'Yemek fotoğrafı ekle veya mesaj yaz...'}
          remainingQuota={quotaUsage.remainingToday}
          dailyLimit={quotaUsage.dailyLimit}
          isLimitReached={quotaUsage.isLimitReached}
        />
      </div>

      {/* History Sidebar (Mobile: Full screen overlay) */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex justify-end"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[85vw] max-w-[380px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* History Header */}
              <div className="px-5 py-4 border-b border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
                <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <FaHistory className="text-amber-500 text-sm" />
                  {t('calorieChat.historyTitle') || 'Sohbet Geçmişi'}
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>

              {/* Daily AI Quota Card */}
              <div className="px-5 py-3.5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-b border-stone-200/50 dark:border-zinc-800/50">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-stone-700 dark:text-zinc-200 flex items-center gap-1.5">
                    <FaFire className="text-amber-500 text-xs" />
                    {t('calorieChat.dailyQuota') || 'Günlük AI Kotası'}
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    {quotaUsage.remainingToday} / {quotaUsage.dailyLimit} {language === 'en' ? 'Remaining' : 'Kalan'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className={`h-full rounded-full ${
                      quotaUsage.percentageUsed >= 90
                        ? 'bg-rose-500'
                        : quotaUsage.percentageUsed >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, quotaUsage.percentageUsed)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-500">
                  <span>%{quotaUsage.percentageUsed} {language === 'en' ? 'used' : 'kullanıldı'} ({quotaUsage.usedToday} {language === 'en' ? 'requests' : 'istek'})</span>
                  <span>{t('calorieChat.resetsAtMidnight') || "Gece 00:00'da sıfırlanır"}</span>
                </div>
              </div>

              {/* Storage Info */}
              {storageInfo && (
                <div className="px-5 py-3 bg-stone-50 dark:bg-zinc-950/50 border-b border-stone-200/50 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
                    <FaDatabase className="text-[10px] text-amber-500" />
                    <span className="font-bold">{formatBytes(storageInfo.totalBytes)}</span>
                    <span>•</span>
                    <span>{storageInfo.sessionCount} {t('calorieChat.sessions') || 'sohbet'}</span>
                    <span>•</span>
                    <span>{storageInfo.totalMessages} {t('calorieChat.messagesCount') || 'mesaj'}</span>
                  </div>
                </div>
              )}

              {/* New Chat Button */}
              <div className="px-4 pt-3 shrink-0">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-400 text-stone-950 font-bold text-sm hover:bg-amber-300 transition-colors shadow-md shadow-amber-500/20"
                >
                  <FaPlus className="text-xs" />
                  {t('calorieChat.newChat') || 'Yeni Sohbet'}
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 dark:text-zinc-600 text-sm">
                    {t('calorieChat.noHistory') || 'Henüz sohbet yok'}
                  </div>
                ) : (
                  sessions.map((session) => (
                    <motion.button
                      key={session.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLoadSession(session.id!)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        currentSessionId === session.id
                          ? 'bg-amber-400/15 border-amber-400/30 dark:bg-amber-400/10 dark:border-amber-400/20'
                          : 'bg-white dark:bg-zinc-800/60 border-stone-200/80 dark:border-zinc-700/50 hover:bg-stone-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-stone-900 dark:text-white truncate">
                          {session.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
                            {formatSessionDate(session.updatedAt || session.createdAt)}
                          </span>
                          {session.totalCalories > 0 && (
                            <>
                              <span className="text-stone-300 dark:text-zinc-700">•</span>
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                🔥 {session.totalCalories} kcal
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(session.id!, e)}
                          title={t('calorieChat.deleteSessionTitle') || 'Sohbeti sil'}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                        <FaChevronRight className="text-stone-300 dark:text-zinc-600 text-[10px]" />
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmLabel}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog(c => ({ ...c, isOpen: false }));
        }}
        onClose={() => setConfirmDialog(c => ({ ...c, isOpen: false }))}
      />
    </div>
  );
}
