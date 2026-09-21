// src/frontend/components/calorie-chat/EmuAIWidget.tsx
// Floating Chatbot Widget — Açılır-kapanır destek widget'ı
// Floating button (varsayılan closed), tıklayınca popup chat açılır, X ile kapanır.

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRobot, FaTimes, FaExpandAlt, FaPlus,
  FaSpinner, FaFire
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import CalorieChatMessage, { TypingIndicator } from './CalorieChatMessage';
import CalorieChatInput from './CalorieChatInput';
import {
  sendCalorieMessage,
  createChatSession,
  addMessageToSession,
  getChatSessions,
  getChatSession,
} from '../../services/calorieChatService';
import {
  useCalorieAiUsage,
  incrementCalorieAiUsage,
} from '../../services/calorieLimitService';
import type { ChatMessage } from '../../services/calorieChatService';
import AccessRequestModal from '../access/AccessRequestModal';

export default function EmuAIWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { hasAccess } = useFeatureAccess();
  const isAiDisabled = !hasAccess('calorieAi');
  const { usage: quotaUsage, refreshUsage } = useCalorieAiUsage(user?.uid);
  const [isOpen, setIsOpen] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Chat state inside widget
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demo messages for accounts without AI access
  const demoMessages: ChatMessage[] = useMemo(() => [
    {
      role: 'user',
      text: language === 'tr' ? '📸 Izgara Somon ve Kinoa Salatası' : '📸 Grilled Salmon & Quinoa Salad',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      role: 'assistant',
      text: language === 'tr'
        ? `Harika bir öğün! 🥗\n\n🍽️ **Izgara Somon & Kinoa Kasesi**\n- **Kalori:** 420 kcal\n- **Protein:** 36g (Hipertrofi ve kas onarımı için mükemmel)\n- **Karbonhidrat:** 24g (Kinoa ve yeşilliklerden lifli kaynak)\n- **Sağlıklı Yağ:** 18g (Somondan zengin Omega-3)\n\n💡 Günlük protein hedefinize 36g katkı sağladınız!`
        : `Excellent choice! 🥗\n\n🍽️ **Grilled Salmon & Quinoa Bowl**\n- **Calories:** 420 kcal\n- **Protein:** 36g (Optimal for muscle synthesis)\n- **Carbs:** 24g (High fiber from quinoa & greens)\n- **Healthy Fats:** 18g (Rich Omega-3 from salmon)\n\n💡 Added 36g high quality protein to your daily target!`,
      timestamp: new Date(Date.now() - 1000 * 60 * 4),
      mealData: {
        items: [
          { name: language === 'tr' ? 'Izgara Somon' : 'Grilled Salmon', amount: '180g', calories: 280, protein: 30, carbs: 0, fat: 14 },
          { name: language === 'tr' ? 'Kinoa Salatası' : 'Quinoa Salad', amount: language === 'tr' ? '1 Kase' : '1 Bowl', calories: 140, protein: 6, carbs: 24, fat: 4 }
        ],
        totalCalories: 420,
        totalProtein: 36,
        totalCarbs: 24,
        totalFat: 18
      }
    },
    {
      role: 'user',
      text: language === 'tr' ? 'Bugün 2000 kaloriyi geçmemem gerekiyor, akşam ne yiyebilirim?' : 'My goal is 2000 kcal today, what should I eat for dinner?',
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
    },
    {
      role: 'assistant',
      text: language === 'tr'
        ? `Bugün öğle ve ara öğünlerde 1450 kalori aldınız. Akşam için **550 kalori** bütçeniz ve **35g protein** açığınız var.\n\n🎯 **Önerilen Akşam Menüsü:**\n- 200g Fırında Tavuk Göğsü veya Yağsız Hindi Eti (~220 kcal, 44g protein)\n- Büyük Mevsim Salata (1 tatlı kaşığı zeytinyağı ile ~120 kcal)\n- 1 kase Yoğurt veya Ayran (~100 kcal)\n\nToplam: ~440 kcal ve 52g protein. Hem tok tutar hem de hedefinizi kusursuz tamamlar!`
        : `You have consumed 1450 kcal across earlier meals. You have **550 kcal** remaining with a **35g protein** gap.\n\n🎯 **Recommended Dinner:**\n- 200g Baked Chicken Breast or Lean Turkey (~220 kcal, 44g protein)\n- Large Fresh Salad (with 1 tsp olive oil ~120 kcal)\n- 1 cup Greek Yogurt or Ayran (~100 kcal)\n\nTotal: ~440 kcal and 52g protein. Perfect satiety while nailing your targets!`,
      timestamp: new Date(Date.now() - 1000 * 60 * 1),
    }
  ], [language]);

  const activeMessages = !isAiDisabled ? messages : demoMessages;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [activeMessages, isSending, isOpen, scrollToBottom]);

  // Load last session when widget opens (only if AI is enabled)
  useEffect(() => {
    if (!isOpen || !user || isAiDisabled || messages.length > 0) return;

    const loadLastSession = async () => {
      setIsLoading(true);
      try {
        const lastId = localStorage.getItem(`last_calorie_session_${user.uid}`);
        if (lastId) {
          const session = await getChatSession(lastId);
          if (session && session.messages?.length > 0) {
            setMessages(session.messages);
            setCurrentSessionId(session.id!);
            setIsLoading(false);
            return;
          }
        }
        const recent = await getChatSessions(user.uid, 1);
        if (recent.length > 0) {
          setMessages(recent[0].messages || []);
          setCurrentSessionId(recent[0].id!);
        }
      } catch (err) {
        console.error('Widget session load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLastSession();
  }, [isOpen, user, isAiDisabled, messages.length]);

  const handleSend = useCallback(async (text: string, imageBase64?: string, mimeType?: string) => {
    if (!user || isAiDisabled) return;

    if (quotaUsage.isLimitReached) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: language === 'tr'
            ? `⚠️ Günlük analiz limitinize (${quotaUsage.dailyLimit}/${quotaUsage.dailyLimit}) ulaştınız. Limitiniz her gece 00:00'da sıfırlanacaktır.`
            : `⚠️ You have reached your daily quota limit (${quotaUsage.dailyLimit}/${quotaUsage.dailyLimit}). Resets at midnight 00:00.`,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = {
      role: 'user',
      text,
      hasImage: !!imageBase64,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        activeSessionId = await createChatSession(
          user.uid,
          text.slice(0, 30) || (language === 'tr' ? 'Yemek Analizi' : 'Meal Analysis')
        );
        setCurrentSessionId(activeSessionId);
        localStorage.setItem(`last_calorie_session_${user.uid}`, activeSessionId);
      }

      await addMessageToSession(activeSessionId, userMsg);

      const history = messages.map(m => ({
        role: m.role,
        text: m.text,
      }));

      const response = await sendCalorieMessage(text, imageBase64, mimeType, history);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: response.text,
        mealData: response.mealData,
        timestamp: new Date(),
      };

      await addMessageToSession(activeSessionId, assistantMsg);
      setMessages(prev => [...prev, assistantMsg]);
      await incrementCalorieAiUsage(user.uid);
      refreshUsage();
    } catch (error: any) {
      console.error('Widget message send error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `❌ ${error.message || (language === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.')}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [user, isAiDisabled, currentSessionId, messages, quotaUsage.isLimitReached, quotaUsage.dailyLimit, refreshUsage, language]);

  const handleNewChat = useCallback(() => {
    if (isAiDisabled) return;
    setMessages([]);
    setCurrentSessionId(null);
    if (user) {
      localStorage.removeItem(`last_calorie_session_${user.uid}`);
    }
  }, [user, isAiDisabled]);

  // If user is not logged in at all, don't show floating widget
  if (!user) return null;

  const displayMessages = isAiDisabled ? demoMessages : messages;

  return (
    <>
      {/* Floating Button (Closed state - Draggable & Compact) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[120]"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 text-stone-950 flex items-center justify-center shadow-xl shadow-amber-500/40 border-2 border-amber-300 hover:shadow-amber-500/60 transition-all cursor-grab active:cursor-grabbing group"
              title={isAiDisabled ? (language === 'tr' ? 'B12 AI (Demo Modu)' : 'B12 AI (Demo Mode)') : 'B12 AI Asistanı'}
            >
              <div className="text-xl group-hover:rotate-12 transition-transform">
                🤖
              </div>

              {/* Online Pulse Badge */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAiDisabled ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 border border-white dark:border-zinc-900 ${isAiDisabled ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Modal (Open state) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[130] w-[calc(100vw-32px)] sm:w-[400px] h-[520px] max-h-[75vh] bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Widget Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-stone-900 via-zinc-900 to-black text-white flex items-center justify-between shrink-0 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-sm font-black shadow-md">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    B12 AI
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      isAiDisabled ? 'bg-amber-400/30 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                    }`}>
                      {isAiDisabled ? 'DEMO' : (language === 'tr' ? 'Aktif' : 'Active')}
                    </span>
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {isAiDisabled
                      ? (language === 'tr' ? 'Besin & Kalori Asistanı (Önizleme)' : 'Nutrition & Life Agent (Preview)')
                      : (language === 'tr' ? 'Kalori & Besin Asistanı' : 'Nutrition & Life Agent')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!isAiDisabled && (
                  <>
                    {/* Quota badge */}
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        quotaUsage.isLimitReached
                          ? 'bg-rose-500/20 text-rose-300'
                          : quotaUsage.remainingToday <= 5
                            ? 'bg-amber-500/30 text-amber-200'
                            : 'bg-amber-400/20 text-amber-300'
                      }`}
                      title={language === 'tr' ? 'Günlük Kalan Hak (Gece 00:00 sıfırlanır)' : 'Daily quota resets at 00:00'}
                    >
                      <FaFire className="text-[9px]" />
                      <span>{quotaUsage.remainingToday}/{quotaUsage.dailyLimit}</span>
                    </div>

                    <button
                      onClick={handleNewChat}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                      title={language === 'tr' ? 'Yeni Sohbet' : 'New Chat'}
                    >
                      <FaPlus className="text-[10px]" />
                    </button>
                  </>
                )}

                <Link
                  to="/calorie-chat"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 flex items-center justify-center transition-colors"
                  title={language === 'tr' ? 'Tam Ekran Aç' : 'Full Screen'}
                >
                  <FaExpandAlt className="text-[10px]" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title={language === 'tr' ? 'Kapat' : 'Close'}
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            </div>

            {/* Widget Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-stone-50/50 dark:bg-zinc-950/50">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-amber-400 text-xl" />
                </div>
              )}

              {displayMessages.length === 0 && !isLoading && (
                <div className="text-center py-8 px-4">
                  <div className="w-14 h-14 bg-amber-400/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FaRobot className="text-2xl" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
                    {language === 'tr' ? 'Merhaba! 👋' : 'Hello! 👋'}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    {language === 'tr' ? 'Yemek fotoğrafı atın veya kaç kalori olduğunu sorun!' : 'Send a meal photo or ask how many calories it has!'}
                  </p>
                </div>
              )}

              {displayMessages.map((msg, idx) => (
                <CalorieChatMessage
                  key={idx}
                  message={msg}
                  isLast={idx === displayMessages.length - 1}
                />
              ))}

              <AnimatePresence>
                {isSending && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Widget Bottom: Input or Demo Access Request Card */}
            {isAiDisabled ? (
              <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/30 border-t border-amber-500/20 text-center space-y-2 shrink-0">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-950 dark:text-amber-200">
                  <span>✨</span>
                  <span>{language === 'tr' ? 'B12 AI — Örnek Konuşma Modu' : 'B12 AI — Demo Preview Mode'}</span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-tight max-w-xs mx-auto">
                  {language === 'tr'
                    ? 'Fotoğraflardan öğün ve makro analizi yapabilmek için AI özelliğini hesabınızda aktifleştirin.'
                    : 'Activate AI on your account to analyze food photos and track macros in real-time.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAccessModal(true)}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <span>✉️</span>
                  <span>{language === 'tr' ? 'EMU\'dan Erişim İzni İste' : 'Request Access from EMU'}</span>
                </button>
              </div>
            ) : (
              <div className="shrink-0">
                <CalorieChatInput
                  onSend={handleSend}
                  disabled={isSending}
                  placeholder={language === 'tr' ? 'Fotoğraf ekle veya yaz...' : 'Add photo or type message...'}
                  remainingQuota={quotaUsage.remainingToday}
                  dailyLimit={quotaUsage.dailyLimit}
                  isLimitReached={quotaUsage.isLimitReached}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AccessRequestModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        featureKey="calorieAi"
        featureTitle={language === 'tr' ? 'B12 AI Kalori Koçu & Besin Asistanı' : 'B12 AI Calorie Coach & Nutrition Agent'}
        featureDescription={language === 'tr' ? 'Fotoğraflı öğün analizi, kalori ve makro hesaplaması, ve anlık beslenme tavsiyeleri.' : 'Photo meal analysis, calorie & macro tracking, and real-time nutrition advice.'}
      />
    </>
  );
}
