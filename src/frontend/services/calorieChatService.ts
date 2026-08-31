// src/frontend/services/calorieChatService.ts
// Kalori AI Chat — Servis katmanı
// Fotoğraflar saklanmaz, öğün verileri (ne yendiği) Firestore'da saklanır

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';

// ── Types ──────────────────────────────────────────────

export interface MealItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface MealData {
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  hasImage?: boolean;          // Fotoğraf var mıydı (fotoğraf kendisi saklanmaz)
  mealData?: MealData | null;  // AI'ın tespit ettiği besin verileri
  timestamp: Timestamp | any;
}

export interface ChatSession {
  id?: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  totalCalories: number;       // Bu session'daki toplam kalori
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  estimatedSizeBytes: number;  // Tahmini boyut (byte)
}

import { GoogleGenerativeAI } from '@google/generative-ai';

// ── API Calls ──────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '';

const SYSTEM_PROMPT = `Sen uzman bir diyetisyen ve besin analiz asistanısın. Kullanıcılar sana yemek fotoğrafları gönderecek ve sen bu yemeklerin besin değerlerini analiz edeceksin.

KURALLAR:
1. Her fotoğrafta gördüğün yemeği tanımla
2. Tahmini porsiyon miktarını belirt
3. Besin değerlerini JSON formatında da ver
4. Türk mutfağına hakim ol
5. Samimi ve motive edici bir dil kullan
6. Yanıtlarını Türkçe ver
7. Eğer fotoğraf yoksa ve sadece metin varsa, o yemeğin/besinin bilgilerini ver
8. Kullanıcı genel sağlık/beslenme soruları sorabilir, bunlara da cevap ver

YANIT FORMATI (yemek analizi için):
Yemeği tanımladıktan sonra şu bilgileri ver:

🍽️ **[Yemek Adı]**
📏 Tahmini Porsiyon: [miktar]
🔥 Kalori: [kcal]
🥩 Protein: [g]
🍞 Karbonhidrat: [g]
🧈 Yağ: [g]
🧂 Lif: [g]

Sonra kısa bir sağlık notu ekle.

Ayrıca yanıtının EN SONUNA şu JSON bloğunu ekle (bu frontend tarafından parse edilecek):
\`\`\`json
{"mealData":{"items":[{"name":"Yemek adı","amount":"miktar","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0}],"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0}}
\`\`\`

Eğer yemek fotoğrafı değilse veya genel bir soru ise, JSON bloğu EKLEME.`;

async function directGeminiCall(
  message: string,
  imageBase64?: string,
  mimeType?: string,
  conversationHistory?: { role: string; text: string }[]
): Promise<{ text: string; mealData: MealData | null }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY bulunamadı. Lütfen .env dosyanızı kontrol edin.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const parts: any[] = [];
  if (conversationHistory && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .slice(-6)
      .map((msg: any) => `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.text}`)
      .join('\n');
    parts.push({ text: `ÖNCEKİ KONUŞMA BAĞLAMI:\n${historyText}\n\n` });
  }

  parts.push({ text: SYSTEM_PROMPT + '\n\nKULLANICI MESAJI: ' + (message || 'Bu yemeği analiz et.') });

  if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    });
  }

  const result = await model.generateContent(parts);
  const responseText = result.response.text();

  let mealData: MealData | null = null;
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      mealData = parsed.mealData || parsed;
    } catch {}
  }

  const cleanText = responseText.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();

  return { text: cleanText, mealData };
}

/**
 * Gemini API'ye mesaj gönder (Netlify function veya doğrudan SDK istemcisi üzerinden)
 */
export async function sendCalorieMessage(
  message: string,
  imageBase64?: string,
  mimeType?: string,
  conversationHistory?: { role: string; text: string }[]
): Promise<{ text: string; mealData: MealData | null }> {
  // 1. Önce Netlify Serverless endpoint'ini dene (Canlı sunucuda ise)
  try {
    const url = `${API_BASE}/api/calorie-chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        imageBase64,
        mimeType,
        conversationHistory,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Serverless API sunucusuna erişilemedi, doğrudan Gemini SDK kullanılıyor...', error);
  }

  // 2. Lokal ortama özel doğrudan istemci tarafı Gemini SDK çağrısı (npm run dev için)
  return directGeminiCall(message, imageBase64, mimeType, conversationHistory);
}

// ── Firestore CRUD ─────────────────────────────────────

const COLLECTION = 'calorie_chats';

/**
 * Bir mesajın tahmini boyutunu hesapla (byte cinsinden)
 */
function estimateMessageSize(msg: ChatMessage): number {
  let size = (msg.text || '').length * 2; // UTF-16
  if (msg.mealData) {
    size += JSON.stringify(msg.mealData).length * 2;
  }
  size += 100; // metadata overhead
  return size;
}

/**
 * Bir session'ın tahmini boyutunu hesapla
 */
function estimateSessionSize(messages: ChatMessage[]): number {
  let total = 200; // base document overhead
  for (const msg of messages) {
    total += estimateMessageSize(msg);
  }
  return total;
}

/**
 * Yeni chat session oluştur
 */
export async function createChatSession(userId: string, title?: string): Promise<string> {
  const session: Omit<ChatSession, 'id'> = {
    userId,
    title: title || `Öğün Kaydı — ${new Date().toLocaleDateString('tr-TR')}`,
    messages: [],
    totalCalories: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    estimatedSizeBytes: 200,
  };

  const docRef = await addDoc(collection(db, COLLECTION), session);
  return docRef.id;
}

/**
 * Chat session'a mesaj ekle
 */
export async function addMessageToSession(
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  const docRef = doc(db, COLLECTION, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error('Chat session bulunamadı');

  const data = docSnap.data() as ChatSession;
  const messages = [...(data.messages || []), message];
  const totalCalories = messages.reduce((sum, msg) => {
    return sum + (msg.mealData?.totalCalories || 0);
  }, 0);

  const estimatedSizeBytes = estimateSessionSize(messages);

  await updateDoc(docRef, {
    messages,
    totalCalories,
    updatedAt: serverTimestamp(),
    estimatedSizeBytes,
  });
}

/**
 * Kullanıcının tüm chat session'larını getir
 */
export async function getChatSessions(
  userId: string,
  maxResults = 50
): Promise<ChatSession[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  } as ChatSession));

  // In-memory sort by updatedAt / createdAt descending to avoid composite index requirement
  sessions.sort((a, b) => {
    const getMillis = (ts: any) => {
      if (!ts) return 0;
      if (ts.toMillis) return ts.toMillis();
      if (ts.toDate) return ts.toDate().getTime();
      return new Date(ts).getTime();
    };
    const timeA = getMillis(a.updatedAt || a.createdAt);
    const timeB = getMillis(b.updatedAt || b.createdAt);
    return timeB - timeA;
  });

  return sessions.slice(0, maxResults);
}

/**
 * Tek bir chat session'ı getir
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const docSnap = await getDoc(doc(db, COLLECTION, sessionId));
  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as ChatSession;
}

/**
 * Chat session sil
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, sessionId));
}

/**
 * Kullanıcının tüm chat verilerinin toplam boyutunu hesapla
 */
export async function calculateTotalStorageSize(userId: string): Promise<{
  totalBytes: number;
  sessionCount: number;
  totalMessages: number;
}> {
  const sessions = await getChatSessions(userId, 500);

  let totalBytes = 0;
  let totalMessages = 0;

  for (const session of sessions) {
    totalBytes += session.estimatedSizeBytes || 0;
    totalMessages += (session.messages || []).length;
  }

  return {
    totalBytes,
    sessionCount: sessions.length,
    totalMessages,
  };
}

/**
 * Boyutu insan-okunabilir formata çevir
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
