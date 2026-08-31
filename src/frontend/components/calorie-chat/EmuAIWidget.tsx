// src/frontend/components/calorie-chat/EmuAIWidget.tsx
// Floating Chatbot Widget — Açılır-kapanır destek widget'ı
// Floating button (varsayılan closed), tıklayınca popup chat açılır, X ile kapanır.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRobot, FaTimes, FaExpandAlt, FaPlus, FaHistory,
  FaPaperPlane, FaCamera, FaImage, FaSpinner, FaFire
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
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
import { Timestamp } from 'firebase/firestore';

export default function EmuAIWidget() {
  const { user } = useAuth();
  const { hasAccess } = useFeatureAccess();
  const { usage: quotaUsage, refreshUsage } = useCalorieAiUsage(user?.uid);
  const [isOpen, setIsOpen] = useState(false); // Varsayılan durum: closed

  // Chat state inside widget
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isSending, isOpen, scrollToBottom]);

  // Load last session when widget opens
  useEffect(() => {
    if (!isOpen || !user || messages.length > 0) return;

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
  }, [isOpen, user, messages.length]);

  const handleSend = useCallback(async (text: string, imageBase64?: string, mimeType?: string) => {
    if (!user) return;

    if (quotaUsage.isLimitReached) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Günlük analiz limitinize (${quotaUsage.dailyLimit}/${quotaUsage.dailyLimit}) ulaştınız. Limitiniz her gece 00:00'da sıfırlanacaktır.`,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      text,
      hasImage: !!imageBase64,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    try {
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createChatSession(user.uid, text.slice(0, 50));
        setCurrentSessionId(sessionId);
        localStorage.setItem(`last_calorie_session_${user.uid}`, sessionId);
      }

      await addMessageToSession(sessionId, {
        ...userMessage,
        timestamp: Timestamp.now(),
      });

      const history = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));
      const response = await sendCalorieMessage(text, imageBase64, mimeType, history);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: response.text,
        mealData: response.mealData,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      await addMessageToSession(sessionId, {
        ...assistantMessage,
        timestamp: Timestamp.now(),
      });

      // Increment daily usage
      await incrementCalorieAiUsage(user.uid);
      refreshUsage();
    } catch (error: any) {
      console.error('Widget send error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `❌ ${error.message || 'Bir hata oluştu.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [user, currentSessionId, messages, quotaUsage.isLimitReached, quotaUsage.dailyLimit, refreshUsage]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    if (user) {
      localStorage.removeItem(`last_calorie_session_${user.uid}`);
    }
  }, [user]);

  // Access check
  if (!user || !hasAccess('calorieAi')) return null;

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
              title="emuAI Asistanı (Sürükleyebilirsiniz)"
            >
              <div className="text-xl group-hover:rotate-12 transition-transform">
                🤖
              </div>

              {/* Online Pulse Badge */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white dark:border-zinc-900"></span>
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
                    emuAI
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded uppercase">
                      Destek
                    </span>
                  </h3>
                  <p className="text-[10px] text-stone-400">Kalori & Besin Asistanı</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Quota badge */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    quotaUsage.isLimitReached
                      ? 'bg-rose-500/20 text-rose-300'
                      : quotaUsage.remainingToday <= 5
                        ? 'bg-amber-500/30 text-amber-200'
                        : 'bg-amber-400/20 text-amber-300'
                  }`}
                  title="Günlük Kalan Hak (Gece 00:00 sıfırlanır)"
                >
                  <FaFire className="text-[9px]" />
                  <span>{quotaUsage.remainingToday}/{quotaUsage.dailyLimit}</span>
                </div>

                <button
                  onClick={handleNewChat}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 flex items-center justify-center transition-colors"
                  title="Yeni Sohbet"
                >
                  <FaPlus className="text-[10px]" />
                </button>
                <Link
                  to="/calorie-chat"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 flex items-center justify-center transition-colors"
                  title="Tam Ekran Aç"
                >
                  <FaExpandAlt className="text-[10px]" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center transition-colors"
                  title="Kapat"
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

              {messages.length === 0 && !isLoading && (
                <div className="text-center py-8 px-4">
                  <div className="w-14 h-14 bg-amber-400/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FaRobot className="text-2xl" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
                    Merhaba! 👋
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Yemek fotoğrafı atın veya kaç kalori olduğunu sorun!
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <CalorieChatMessage
                  key={idx}
                  message={msg}
                  isLast={idx === messages.length - 1}
                />
              ))}

              <AnimatePresence>
                {isSending && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Widget Input */}
            <div className="shrink-0">
              <CalorieChatInput
                onSend={handleSend}
                disabled={isSending}
                placeholder="Fotoğraf ekle veya yaz..."
                remainingQuota={quotaUsage.remainingToday}
                dailyLimit={quotaUsage.dailyLimit}
                isLimitReached={quotaUsage.isLimitReached}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
