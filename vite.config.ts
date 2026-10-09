import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function b12DevApiPlugin(): Plugin {
  return {
    name: 'b12-dev-api-middleware',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. Redis cache mock in local dev to silence 404s
        if (req.url.startsWith('/api/redis-cache')) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            configured: false,
            connected: false,
            dbSize: 0,
            hit: false,
            data: null
          }));
          return;
        }

        // 2. Jira photo scan dev endpoint
        if (req.url.startsWith('/api/jira-photo-scan') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { imageBase64, mimeType } = body;
              if (!imageBase64) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Fotoğraf gerekli.' }));
                return;
              }

              const env = loadEnv('development', process.cwd(), '');
              const userApiKey = (req.headers['x-gemini-api-key'] as string) || '';
              const apiKey = (userApiKey || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '').trim();

              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY ortam değişkeni bulunamadı. Lütfen AI Robot veya ayarlar üzerinden anahtarınızı girin.' }));
                return;
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

              const parts = [
                { text: JIRA_SCAN_PROMPT },
                {
                  inlineData: {
                    data: imageBase64,
                    mimeType: mimeType || 'image/jpeg',
                  },
                },
              ];

              const payload = JSON.stringify({
                contents: [{ parts }],
              });

              const candidateModels = [
                'gemini-2.5-flash',
                'gemini-2.0-flash',
                'gemini-2.5-flash-lite',
                'gemini-1.5-flash-latest',
                'gemini-1.5-flash-002',
                'gemini-1.5-flash',
                'gemini-flash-latest',
              ];

              let responseText = '';
              let lastError = '';

              for (const model of candidateModels) {
                for (const apiVer of ['v1beta', 'v1'] as const) {
                  try {
                    const geminiRes = await fetch(
                      `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: payload,
                      }
                    );

                    if (geminiRes.ok) {
                      const resData: any = await geminiRes.json();
                      responseText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

              let tasks: any[] = [];
              const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                tasks = JSON.parse(jsonMatch[1]).tasks || [];
              } else {
                tasks = JSON.parse(responseText).tasks || [];
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ tasks }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'İşlem başarısız oldu.' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    b12DevApiPlugin(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      'framer-motion',
      'react-icons/fa',
      'react-hot-toast',
      '@tanstack/react-query',
    ],
  },
  server: {
    proxy: {
      '/api/gold-price': {
        target: 'https://finans.truncgil.com',
        changeOrigin: true,
        rewrite: () => '/today.json'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-charts': ['recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit'],
          'vendor-docs': ['jspdf', 'papaparse', 'html2canvas']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})