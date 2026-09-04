import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

export const handler: Handler = async (event): Promise<any> => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'GEMINI_API_KEY ortam değişkeni ayarlanmamış.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { message, imageBase64, mimeType, conversationHistory } = body;

    if (!message && !imageBase64) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Mesaj veya fotoğraf gerekli.' }),
      };
    }

    // Build content parts
    const parts: any[] = [];

    // Add conversation history context if exists
    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory
        .slice(-6) // Son 6 mesajı bağlam olarak gönder
        .map((msg: any) => `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.text}`)
        .join('\n');
      parts.push({ text: `ÖNCEKİ KONUŞMA BAĞLAMI:\n${historyText}\n\n` });
    }

    // Add system prompt
    parts.push({ text: SYSTEM_PROMPT + '\n\nKULLANICI MESAJI: ' + (message || 'Bu yemeği analiz et.') });

    // Add image if provided
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    let responseText = '';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(parts);
      responseText = result.response.text();
    } catch (modelErr: any) {
      console.warn('gemini-2.0-flash failed, falling back to gemini-1.5-flash...', modelErr?.message);
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await fallbackModel.generateContent(parts);
      responseText = result.response.text();
    }

    // Try to extract meal data JSON from response
    let mealData = null;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        mealData = parsed.mealData || parsed;
      } catch {
        // JSON parse failed, that's ok
      }
    }

    // Clean response text (remove JSON block for display)
    const cleanText = responseText.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        text: cleanText,
        mealData,
      }),
    };
  } catch (error: any) {
    console.error('Calorie chat error:', error);

    // Gemini API rate limit or quota error
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return {
        statusCode: 429,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'API limit aşıldı. Lütfen biraz bekleyip tekrar deneyin.',
          message: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Analiz sırasında bir hata oluştu.',
        message: error.message,
      }),
    };
  }
};
