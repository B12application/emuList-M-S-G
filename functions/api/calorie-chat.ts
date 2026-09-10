// functions/api/calorie-chat.ts
// Cloudflare Pages Function: Gemini AI Calorie & Nutrition Assistant Proxy
// 100% Server-side: Keeps GEMINI_API_KEY secure without exposing it to the client bundle.

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

// In-memory rate limiting for Cloudflare Worker instance
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, maxRequests = 20, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  record.count++;
  return record.count > maxRequests;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;

  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Retry-After": "60",
        },
      }
    );
  }

  // Get server-side API key from Cloudflare Pages Environment Variables
  const apiKey = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Sunucuda GEMINI_API_KEY ortam değişkeni tanımlanmamış." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { message, imageBase64, mimeType, conversationHistory } = body;

    if (!message && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Mesaj veya fotoğraf gerekli." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Build content parts for Gemini REST API
    const parts: any[] = [];

    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory
        .slice(-6)
        .map((msg: any) => `${msg.role === "user" ? "Kullanıcı" : "Asistan"}: ${msg.text}`)
        .join("\n");
      parts.push({ text: `ÖNCEKİ KONUŞMA BAĞLAMI:\n${historyText}\n\n` });
    }

    parts.push({ text: SYSTEM_PROMPT + "\n\nKULLANICI MESAJI: " + (message || "Bu yemeği analiz et.") });

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    const payload = JSON.stringify({
      contents: [{ parts }],
    });

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let responseText = "";
    let lastError = "";

    for (const model of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: payload,
          }
        );

        if (geminiRes.ok) {
          const resData: any = await geminiRes.json();
          responseText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (responseText) break;
        } else {
          const errText = await geminiRes.text();
          lastError = `${geminiRes.status}: ${errText}`;
          console.warn(`Gemini model ${model} failed with ${lastError}, trying next...`);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    if (!responseText) {
      throw new Error(`Gemini çağrısı başarısız: ${lastError}`);
    }

    let mealData = null;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        mealData = parsed.mealData || parsed;
      } catch {}
    }

    const cleanText = responseText.replace(/```json\s*[\s\S]*?\s*```/g, "").trim();

    return new Response(
      JSON.stringify({
        text: cleanText,
        mealData,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Sunucu içi analiz hatası oluştu." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
