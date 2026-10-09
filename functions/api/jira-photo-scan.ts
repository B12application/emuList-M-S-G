// functions/api/jira-photo-scan.ts
// Cloudflare Pages Function: Gemini Vision ile Jira ekran görüntüsündeki task'ları parse eder.
// GEMINI_API_KEY sunucu ortam değişkeninden alınır — client bundle'a asla sızdırılmaz.

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

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, maxRequests = 10, windowMs = 60 * 1000): boolean {
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
      JSON.stringify({ error: "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  const userApiKey = request.headers.get("x-gemini-api-key") || "";
  const apiKey = (userApiKey || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY bulunamadı. Lütfen AI Robot veya ayarlar üzerinden API anahtarınızı girin." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Fotoğraf gerekli." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const parts: any[] = [
      { text: JIRA_SCAN_PROMPT },
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      },
    ];

    const payload = JSON.stringify({
      contents: [{ parts }],
    });

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash",
      "gemini-flash-latest",
    ];

    let responseText = "";
    let lastError = "";

    for (const model of candidateModels) {
      for (const apiVer of ["v1beta", "v1"] as const) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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
          }
        } catch (err: any) {
          lastError = err?.message || String(err);
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw new Error(`Gemini çağrısı başarısız: ${lastError}`);
    }

    // JSON bloğunu parse et
    let tasks: any[] = [];
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        tasks = parsed.tasks || [];
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        throw new Error("Gemini yanıtı geçerli JSON içermiyor.");
      }
    } else {
      // Direkt JSON dene
      try {
        const parsed = JSON.parse(responseText);
        tasks = parsed.tasks || [];
      } catch {
        throw new Error("Gemini yanıtında JSON bloğu bulunamadı.");
      }
    }

    return new Response(
      JSON.stringify({ tasks }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Fotoğraf analiz hatası oluştu." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
