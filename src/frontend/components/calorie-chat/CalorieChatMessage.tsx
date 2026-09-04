// src/frontend/components/calorie-chat/CalorieChatMessage.tsx
// Tek bir chat mesajı bileşeni — kullanıcı ve AI baloncukları

import { motion } from 'framer-motion';
import { FaRobot, FaUser, FaCamera } from 'react-icons/fa';
import type { ChatMessage, MealData } from '../../services/calorieChatService';

interface Props {
  message: ChatMessage;
  isLast?: boolean;
}

function MealDataCard({ mealData }: { mealData: MealData }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-zinc-700/50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-emerald-500/15 border-b border-emerald-500/20">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          🍽️ Öğün Özeti
        </h4>
      </div>

      {/* Items */}
      <div className="px-4 py-2 space-y-1.5">
        {mealData.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-stone-700 dark:text-zinc-300 font-medium truncate flex-1">
              {item.name} <span className="text-stone-400 dark:text-zinc-500">({item.amount})</span>
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 ml-2 shrink-0">
              {item.calories} kcal
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-4 py-3 bg-stone-100/80 dark:bg-zinc-800/60 border-t border-stone-200/50 dark:border-zinc-700/50">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">{mealData.totalCalories}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-500">kcal</div>
          </div>
          <div>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400">{mealData.totalProtein}g</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-500">Protein</div>
          </div>
          <div>
            <div className="text-lg font-black text-orange-600 dark:text-orange-400">{mealData.totalCarbs}g</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-500">Karb.</div>
          </div>
          <div>
            <div className="text-lg font-black text-rose-600 dark:text-rose-400">{mealData.totalFat}g</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-500">Yağ</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatMessageText(text: string) {
  // Bold text: **text**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Auto-link URLs
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-amber-600 dark:text-amber-400 font-bold hover:opacity-80 break-all">$1</a>'
  );
  // Emoji bullets and line breaks
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

export default function CalorieChatMessage({ message, isLast }: Props) {
  const isUser = message.role === 'user';
  const isApiKeyIssue = !isUser && (
    message.text.includes('API Anahtarı') ||
    message.text.includes('GEMINI_API_KEY') ||
    message.text.includes('API_KEY_SERVICE_BLOCKED') ||
    message.text.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')
  );

  const handlePromptApiKey = () => {
    const inputKey = window.prompt(
      "Google AI Studio API Anahtarınızı girin:\n(https://aistudio.google.com/apikey adresinden aldığınız anahtarı buraya yapıştırın)"
    );
    if (!inputKey) return;
    const trimmed = inputKey.trim();
    if (trimmed.length >= 20) {
      localStorage.setItem('user_gemini_api_key', trimmed);
      window.alert('✅ Gemini API Anahtarınız başarıyla kaydedildi! Şimdi mesajınızı tekrar gönderebilirsiniz.');
      window.location.reload();
    } else {
      window.alert('❌ Geçersiz anahtar uzunluğu! Lütfen Google AI Studio\'dan aldığınız anahtarı eksiksiz yapıştırın.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isLast ? 'mb-2' : ''}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
        isUser
          ? 'bg-amber-400 text-stone-950'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
      }`}>
        {isUser ? <FaUser className="text-xs" /> : <FaRobot className="text-xs" />}
      </div>

      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Photo indicator */}
        {isUser && message.hasImage && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 dark:text-zinc-500 mb-1 px-1">
            <FaCamera className="text-[9px]" />
            <span>Fotoğraf eklendi</span>
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-amber-400 text-stone-950 rounded-tr-md font-medium'
              : 'bg-white dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 rounded-tl-md border border-stone-200/80 dark:border-zinc-700/60 shadow-sm'
          }`}
          dangerouslySetInnerHTML={{
            __html: isUser ? message.text : formatMessageText(message.text)
          }}
        />

        {/* Action button if API key issue */}
        {isApiKeyIssue && (
          <button
            type="button"
            onClick={handlePromptApiKey}
            className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>🔑</span>
            <span>API Anahtarını Şimdi Gir / Değiştir</span>
          </button>
        )}

        {/* Meal Data Card */}
        {!isUser && message.mealData && (
          <MealDataCard mealData={message.mealData} />
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-stone-400 dark:text-zinc-600 mt-1 px-1 font-medium">
          {message.timestamp?.toDate
            ? message.timestamp.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            : message.timestamp instanceof Date
              ? message.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : ''}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Typing indicator — AI yanıt beklenirken gösterilir
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-2.5"
    >
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
        <FaRobot className="text-xs" />
      </div>
      <div className="bg-white dark:bg-zinc-800 border border-stone-200/80 dark:border-zinc-700/60 rounded-2xl rounded-tl-md px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
            className="w-2 h-2 bg-emerald-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
            className="w-2 h-2 bg-emerald-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
            className="w-2 h-2 bg-emerald-300 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
