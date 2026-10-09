// src/frontend/services/jiraPhotoScanService.ts
// Jira Fotoğraf Tarama Servisi — AI Robot ile Paylaşımlı API Anahtarı ve Dinamik Gemini Model Motoru

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ScannedJiraTask {
  jiraTaskId: string;
  title: string;
  type: 'bug' | 'feature' | 'research' | 'task';
  status: 'todo' | 'planned' | 'dev' | 'test' | 'done';
  dueDate: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  notes: string;
}

const JIRA_SCAN_PROMPT = `Sen bir Jira görev tarayıcısısın. Sana bir Jira ekran görüntüsü verilecek.

GÖREVİN:
Ekran görüntüsündeki TÜM Jira ticket'larını tespit et ve aşağıdaki JSON formatında döndür.

RENK KODLARI (Jira ticket ikonlarına göre):
- Kırmızı ikon / "Bug" tipi → type: "bug" (fix gerektiren)
- Yeşil ikon / "Story" veya "Feature" tipi → type: "feature"
- Mor ikon / "Task" veya "Research" tipi → type: "research"
- Mavi ikon → type: "feature"
- Diğer → type: "task"

ÖNEMLİ KURALLAR:
1. Ticket ID'yi tam olarak çıkar (örn: SPB-5238, ABC-123)
2. Başlığı eksiksiz çıkar
3. Eğer "Deadline" veya son tarih görüyorsan dueDate olarak ekle (YYYY-MM-DD formatında)
4. Status'u tahmin et: "Backlog", "Yapılacaklar", "Devam Ediyor", "Test" vb.
5. SADECE JSON döndür, başka açıklama ekleme

ÇIKTI FORMATI:
\`\`\`json
{
  "tasks": [
    {
      "jiraTaskId": "SPB-5238",
      "title": "Ticket başlığı",
      "type": "bug",
      "status": "todo",
      "dueDate": null,
      "priority": "medium",
      "notes": ""
    }
  ]
}
\`\`\`

Status değerleri: "todo", "planned", "dev", "test", "done"
Priority değerleri: "urgent", "high", "medium", "low"

Hiçbir ticket atlamadan hepsini listele.`;

/**
 * AI Robot ile ortak kullanılan Gemini API anahtarını döner
 */
export function getActiveGeminiApiKey(): string {
  return (
    localStorage.getItem('user_gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    ''
  ).trim();
}

/**
 * Kullanıcı API anahtarını yerel depolamaya kaydeder (AI Robot ile senkronize)
 */
export function setActiveGeminiApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem('user_gemini_api_key', trimmed);
  } else {
    localStorage.removeItem('user_gemini_api_key');
  }
}

/**
 * Kullanıcının API anahtarıyla kullanılabilen ve generateContent destekleyen modelleri dinamik sorgular
 */
async function getAvailableModels(apiKey: string): Promise<string[]> {
  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models',
    'https://generativelanguage.googleapis.com/v1/models',
  ];

  for (const endpoint of endpoints) {
    try {
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
            console.log('Gemini API geçerli modelleri tespit edildi:', valid);
            return valid;
          }
        }
      }
    } catch (e) {
      console.warn('Model listesi alınırken hata oluştu:', e);
    }
  }

  // Fallback aday modeller
  return [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-flash-latest'
  ];
}

/**
 * Doğrudan istemci tarafı Gemini API çağrısı (AI Robot ile birebir aynı SDK ve model kuyruğu)
 */
async function directClientJiraScan(imageBase64: string, mimeType?: string): Promise<ScannedJiraTask[]> {
  const apiKey = getActiveGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API anahtarı bulunamadı. Lütfen AI Robot veya Ayarlar sayfasından Google AI Studio API anahtarınızı girin.'
    );
  }

  const parts: any[] = [
    { text: JIRA_SCAN_PROMPT },
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    },
  ];

  // Gemini API çağrı fonksiyonu (önce resmi SDK, ardından REST fallback)
  async function callModel(modelName: string, apiVersion: 'v1beta' | 'v1' = 'v1beta'): Promise<string> {
    // 1. Resmi SDK dene
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (sdkError: any) {
      const errMsg = sdkError?.message || '';

      // 404 (model bulunamadı) ise bir sonraki modele geç
      if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('not supported')) {
        throw sdkError;
      }

      // 2. REST çağrısı ile dene
      try {
        const restBody = JSON.stringify({ contents: [{ parts }] });

        let restRes = await fetch(
          `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: restBody,
          }
        );

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

        if (restRes.ok) {
          const data = await restRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } else {
          const errData = await restRes.json().catch(() => ({}));
          const reason = errData?.error?.details?.[0]?.reason || '';
          if (reason === 'API_KEY_SERVICE_BLOCKED') {
            throw new Error(
              'API_KEY_SERVICE_BLOCKED: Bu API anahtarının ait olduğu Google Cloud projesinde "Generative Language API" kısıtlanmış. https://aistudio.google.com/apikey adresinden yeni bir proje seçerek anahtar oluşturun.'
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

      if (errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || errMsg.includes('401')) {
        throw new Error(
          'Google API Kimlik Doğrulama Hatası (401). Lütfen https://aistudio.google.com/apikey adresinden aldığınız geçerli anahtarı girin.'
        );
      }

      throw sdkError;
    }
  }

  // Dinamik model listesini al ve önceliklendir
  const availableModels = await getAvailableModels(apiKey);
  const prioritized = [
    ...availableModels.filter(m => m.includes('2.5') && m.includes('flash')),
    ...availableModels.filter(m => m.includes('2.0') && m.includes('flash')),
    ...availableModels.filter(m => m.includes('flash') && !m.includes('lite')),
    ...availableModels.filter(m => m.includes('flash')),
    ...availableModels,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-flash-latest',
  ];
  const modelQueue = Array.from(new Set(prioritized));

  let responseText = '';
  let lastError: any = null;

  for (const candidate of modelQueue) {
    for (const ver of ['v1beta', 'v1'] as const) {
      try {
        responseText = await callModel(candidate, ver);
        if (responseText) {
          console.log(`Gemini görsel tarama başarılı: model=${candidate}, apiVersion=${ver}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        if (msg.includes('API_KEY_SERVICE_BLOCKED') || msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
          throw err;
        }
      }
    }
    if (responseText) break;
  }

  if (!responseText) {
    throw lastError || new Error('Gemini API ile görsel analizi yapılamadı. Lütfen API anahtarınızı kontrol edin.');
  }

  // JSON bloğunu parse et
  let tasks: ScannedJiraTask[] = [];
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      tasks = parsed.tasks || [];
    } catch (parseErr) {
      console.error('JSON parse hatası:', parseErr);
      throw new Error('Gemini yanıtı geçerli JSON formatında değil.');
    }
  } else {
    try {
      const parsed = JSON.parse(responseText);
      tasks = parsed.tasks || [];
    } catch {
      throw new Error('Gemini yanıtında JSON bloğu bulunamadı.');
    }
  }

  return tasks;
}

/**
 * Jira ekran görüntüsünden ticket'ları analiz eder.
 * AI Robot'ta kullanılan API anahtarını hem sunucuya (x-gemini-api-key) iletir,
 * hem de yerel veya 404 durumunda aynı anahtarla doğrudan SDK motorunu çalıştırır.
 */
export async function scanJiraTicketsFromPhoto(
  imageBase64: string,
  mimeType?: string
): Promise<ScannedJiraTask[]> {
  const activeKey = getActiveGeminiApiKey();

  try {
    const response = await fetch('/api/jira-photo-scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeKey ? { 'x-gemini-api-key': activeKey } : {}),
      },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.tasks || [];
    }

    // 404 (örn. Vite dev sunucusu) veya diğer sunucu erişim sorunları
    if (response.status === 404) {
      console.warn('/api/jira-photo-scan 404 verdi. Doğrudan istemci Gemini SDK motoruna geçiliyor...');
      return await directClientJiraScan(imageBase64, mimeType);
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error || `Sunucu hatası: ${response.status}`;

    // Eğer sunucu API anahtarı hatası verirse, istemci doğrudan kendi anahtarını denesin
    if (errMsg.includes('GEMINI_API_KEY') || response.status === 500) {
      console.warn('Sunucu anahtar hatası, istemci Gemini SDK motoruna geçiliyor...', errMsg);
      return await directClientJiraScan(imageBase64, mimeType);
    }

    throw new Error(errMsg);
  } catch (err: any) {
    // Ağ hatası veya endpoint erişim hatasında doğrudan Gemini fallback
    if (
      err?.message?.includes('404') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('GEMINI_API_KEY')
    ) {
      console.warn('Sunucuya erişilemedi, doğrudan istemci Gemini fallback kullanılıyor...', err);
      return await directClientJiraScan(imageBase64, mimeType);
    }
    throw err;
  }
}
