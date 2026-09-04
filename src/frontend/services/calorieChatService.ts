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

/**
 * Kullanıcının API anahtarıyla kullanılabilen ve generateContent destekleyen modelleri tespit eder
 */
async function getAvailableModels(apiKey: string): Promise<string[]> {
  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models',
    'https://generativelanguage.googleapis.com/v1/models',
  ];

  for (const endpoint of endpoints) {
    try {
      // 1. x-goog-api-key ile
      let res = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`);
      if (!res.ok) {
        res = await fetch(endpoint, {
          headers: { 'x-goog-api-key': apiKey },
        });
      }
      if (!res.ok) {
        res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models)) {
          const valid = data.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace(/^models\//, ''));
          if (valid.length > 0) {
            console.log('Gemini API geçerli modelleri bulundu:', valid);
            return valid;
          }
        }
      }
    } catch (e) {
      console.warn('Model listesi alınırken hata oluştu:', e);
    }
  }

  // Fallback aday modeller (en güncel Flash modelleri öncelikli)
  return [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
}

/**
 * Gemini API ile doğrudan iletişim kur (Client-side)
 */
async function directGeminiCall(
  message: string,
  imageBase64?: string,
  mimeType?: string,
  conversationHistory?: any[]
): Promise<{ text: string; mealData: MealData | null }> {
  const apiKey = (
    localStorage.getItem('user_gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    ''
  ).trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY bulunamadı. Lütfen https://aistudio.google.com/apikey adresinden yeni bir API anahtarı ekleyin.');
  }

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

  // Gemini API çağrısı yapıcı (önce SDK, ardından REST fallback)
  async function callModel(modelName: string, apiVersion: 'v1beta' | 'v1' = 'v1beta'): Promise<string> {
    // 1. Standart SDK ile dene
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (sdkError: any) {
      const errMsg = sdkError?.message || '';
      console.warn(`SDK çağrısı başarısız (${modelName}, ${apiVersion}):`, errMsg);

      // 404 (model bulunamadı) ise direkt fırlat, döngü bir sonraki adayı denesin
      if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('not supported')) {
        throw sdkError;
      }

      // 2. Doğrudan REST çağrısı ile dene
      try {
        const restBody = JSON.stringify({
          contents: [{ parts }]
        });

        // Deneme A: query param ile
        let restRes = await fetch(
          `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: restBody,
          }
        );

        // Deneme B: x-goog-api-key header ile
        if (!restRes.ok) {
          restRes = await fetch(
            `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: restBody,
            }
          );
        }

        // Deneme C: Bearer token ile
        if (!restRes.ok && restRes.status === 401) {
          restRes = await fetch(
            `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: restBody,
            }
          );
        }

        if (restRes.ok) {
          const data = await restRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } else {
          const errData = await restRes.json().catch(() => ({}));
          const reason = errData?.error?.details?.[0]?.reason || '';
          if (reason === 'API_KEY_SERVICE_BLOCKED') {
            throw new Error(
              'API_KEY_SERVICE_BLOCKED: Bu API anahtarının ait olduğu Google Cloud projesinde "Generative Language API" etkinleştirilmemiş veya kısıtlanmış. Çözüm: https://aistudio.google.com/apikey adresinde "Create API key in new project" (Yeni projede oluştur) seçeneğini seçerek yeni bir anahtar oluşturun.'
            );
          }
          if (restRes.status === 404) {
            throw new Error(`models/${modelName} is not found for API version ${apiVersion}`);
          }
        }
      } catch (restErr: any) {
        if (restErr?.message?.includes('API_KEY_SERVICE_BLOCKED') || restErr?.message?.includes('not found')) {
          throw restErr;
        }
      }

      // Kimlik doğrulama hatası varsa kullanıcıya net rehberlik sun
      if (errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || errMsg.includes('401')) {
        throw new Error(
          'Google API Kimlik Doğrulama Hatası (401 / ACCESS_TOKEN_TYPE_UNSUPPORTED). ' +
          'Lütfen https://aistudio.google.com/apikey adresine gidin, "Create API key" butonuna tıklayıp mutlaka "Create API key in new project" (Yeni projede oluştur) seçeneğini seçin.'
        );
      }

      throw sdkError;
    }
  }

  // 1. Dinamik olarak kullanılabilir modelleri al ve önceliklendir (En üst düzey modeller önde)
  const availableModels = await getAvailableModels(apiKey);
  const prioritized = [
    // 1. En üst düzey 3.x serisi (Gemini 3.7 Flash vb.)
    ...availableModels.filter(m => m.includes('3.') && m.includes('flash')),
    ...availableModels.filter(m => m.includes('3.')),
    // 2. En yüksek akıl yürütme (Pro) modeli
    ...availableModels.filter(m => m.includes('2.5') && m.includes('pro')),
    // 3. Yeni nesil Flash modelleri
    ...availableModels.filter(m => m.includes('2.5') && m.includes('flash')),
    ...availableModels.filter(m => m.includes('2.0') && m.includes('flash')),
    ...availableModels.filter(m => m.includes('flash') && !m.includes('lite')),
    ...availableModels.filter(m => m.includes('flash')),
    ...availableModels,
    'gemini-3.7-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite'
  ];
  const modelQueue = Array.from(new Set(prioritized));

  let responseText = '';
  let lastError: any = null;

  for (const candidate of modelQueue) {
    for (const ver of ['v1beta', 'v1'] as const) {
      try {
        responseText = await callModel(candidate, ver);
        if (responseText) {
          console.log(`Gemini başarıyla çalıştı: model=${candidate}, apiVersion=${ver}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';

        // Yetki engeli varsa model değiştirmek işe yaramaz, direkt fırlat
        if (msg.includes('API_KEY_SERVICE_BLOCKED') || msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
          throw err;
        }

        // 404 ise sıradaki versiyon veya modele geç
        console.warn(`Model ${candidate} (${ver}) denemesi başarısız, sıradaki deneniyor...`);
      }
    }
    if (responseText) break;
  }

  if (!responseText) {
    throw lastError || new Error('Gemini API ile yanıt alınamadı. Lütfen daha sonra tekrar deneyin.');
  }

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
  if (!sessionId) return;
  try {
    await deleteDoc(doc(db, COLLECTION, sessionId));
  } catch (err) {
    console.error('deleteChatSession error:', err);
    throw err;
  }
}

/**
 * Yerel tarihe göre YYYY-MM-DD formatında anahtar üretir
 */
export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Bir chat session'ındaki belirli bir besin öğesini siler ve toplamları günceller
 */
export async function deleteMealItemFromSession(
  sessionId: string,
  messageIndex: number,
  itemIndex: number,
  itemName?: string
): Promise<void> {
  if (!sessionId) throw new Error('Geçersiz oturum ID');
  const sessionRef = doc(db, COLLECTION, sessionId);
  const docSnap = await getDoc(sessionRef);
  if (!docSnap.exists()) {
    throw new Error('Sohbet oturumu bulunamadı');
  }

  const data = docSnap.data() as ChatSession;
  const messages = [...(data.messages || [])];

  if (!messages[messageIndex] || !messages[messageIndex].mealData) {
    throw new Error('Öğün kaydı bulunamadı');
  }

  const mealData = { ...messages[messageIndex].mealData! };
  const items = [...(mealData.items || [])];

  let targetIndex = itemIndex;
  // İsim verilmişse ve mevcut indeksteki isim uyuşmuyorsa, doğru indeksi isimle bul
  if (itemName && items[targetIndex]?.name !== itemName) {
    const foundIdx = items.findIndex(i => i.name === itemName);
    if (foundIdx !== -1) {
      targetIndex = foundIdx;
    }
  }

  if (targetIndex < 0 || targetIndex >= items.length) {
    throw new Error('Geçersiz öğe indeksi');
  }

  // Öğeyi listeden çıkar
  items.splice(targetIndex, 1);

  if (items.length === 0) {
    // Bu mesajda başka yemek kalmadıysa mealData'yı temizle
    messages[messageIndex] = {
      ...messages[messageIndex],
      mealData: null,
    };
  } else {
    // Kalan öğelere göre toplamları yeniden hesapla
    const totalCalories = items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    const totalProtein = items.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
    const totalCarbs = items.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
    const totalFat = items.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

    messages[messageIndex] = {
      ...messages[messageIndex],
      mealData: {
        items,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      },
    };
  }

  // Session genel kalorisini yeniden hesapla
  const sessionTotalCalories = messages.reduce(
    (sum, msg) => sum + (msg.mealData?.totalCalories || 0),
    0
  );

  const estimatedSizeBytes = estimateSessionSize(messages);

  await updateDoc(sessionRef, {
    messages,
    totalCalories: sessionTotalCalories,
    estimatedSizeBytes,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Bir chat session'ından tek bir mesajı siler
 */
export async function deleteMessageFromSession(
  sessionId: string,
  messageIndex: number
): Promise<void> {
  if (!sessionId) throw new Error('Geçersiz oturum ID');
  const sessionRef = doc(db, COLLECTION, sessionId);
  const docSnap = await getDoc(sessionRef);
  if (!docSnap.exists()) {
    throw new Error('Sohbet oturumu bulunamadı');
  }

  const data = docSnap.data() as ChatSession;
  const messages = [...(data.messages || [])];

  if (messageIndex < 0 || messageIndex >= messages.length) {
    throw new Error('Geçersiz mesaj indeksi');
  }

  messages.splice(messageIndex, 1);

  const sessionTotalCalories = messages.reduce(
    (sum, msg) => sum + (msg.mealData?.totalCalories || 0),
    0
  );

  const estimatedSizeBytes = estimateSessionSize(messages);

  await updateDoc(sessionRef, {
    messages,
    totalCalories: sessionTotalCalories,
    estimatedSizeBytes,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Belirli bir güne ait tüm besin verilerini kalori raporundan siler
 */
export async function deleteDayFromCalorieReport(
  userId: string,
  dateKey: string
): Promise<void> {
  if (!userId || !dateKey) return;
  const sessions = await getChatSessions(userId, 500);

  for (const session of sessions) {
    if (!session.id || !session.messages) continue;

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
          return {
            ...msg,
            mealData: null,
          };
        }
      }
      return msg;
    });

    if (modified) {
      const sessionTotalCalories = updatedMessages.reduce(
        (sum, m) => sum + (m.mealData?.totalCalories || 0),
        0
      );
      const estimatedSizeBytes = estimateSessionSize(updatedMessages);
      await updateDoc(doc(db, COLLECTION, session.id), {
        messages: updatedMessages,
        totalCalories: sessionTotalCalories,
        estimatedSizeBytes,
        updatedAt: serverTimestamp(),
      });
    }
  }
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
