import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdf from 'pdf-parse';
import busboy from 'busboy';
import { UsageService } from './utils/usageService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handler: Handler = async (event, context): Promise<any> => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Check usage limit first
  try {
    if (await UsageService.isLimitReached()) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Günlük analiz limitine ulaştınız (20/20).',
          message: 'Lütfen yarın tekrar deneyin.'
        }),
      };
    }
  } catch (usageError) {
    console.error('Usage check failed:', usageError);
  }

  return new Promise((resolve) => {
    const bb = busboy({ headers: event.headers });
    let fileProcessed = false;
    let fileBuffer: Buffer | null = null;
    let fileName = '';

    bb.on('file', (name, file, info) => {
      fileProcessed = true;
      const { filename, mimeType } = info;
      if (mimeType !== 'application/pdf') {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: 'Sadece PDF dosyaları desteklenmektedir.' }),
        });
      }
      fileName = filename;
      const chunks: any[] = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('finish', async () => {
      if (!fileBuffer) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: 'Dosya yüklenemedi.' }),
        });
        return;
      }

      try {
        // Extract text from PDF
        const pdfParser = (pdf as any).default || pdf;
        const data = await pdfParser(fileBuffer);
        const pdfText = data.text;

        if (!pdfText || pdfText.trim().length === 0) {
          resolve({
            statusCode: 400,
            body: JSON.stringify({ error: 'PDF içeriği okunamadı veya dosya boş.' }),
          });
          return;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `Sen uzman bir finansal veri analiz asistanısın. Aşağıdaki banka hesap özeti metninden SADECE harcamaları ve giden transferleri ayıklamanı istiyorum.
        
Metin:
${pdfText}

Kurallar:
1. Sadece giden (borç/harcama) işlemlerini al.
2. İade edilmiş işlemleri (ve iade satırlarını) listeden çıkar.
3. Tutarları pozitif sayı olarak yaz.
4. Tarihleri 'YYYY-MM-DD' formatında yaz.
5. SADECE JSON formatında bir array döndür.

JSON Yapısı:
[
  {
    "title": "İşlem Adı",
    "amount": 100.00,
    "date": "2024-01-01",
    "category": "Kategori",
    "description": "Açıklama"
  }
]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);

        // Increment usage
        await UsageService.incrementUsage();

        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify(parsedData),
        });

      } catch (error: any) {
        console.error('Analysis error:', error);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Analiz sırasında bir hata oluştu.', message: error.message }),
        });
      }
    });

    bb.on('finish', () => {
      if (!fileProcessed) {
        resolve({
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Herhangi bir dosya yüklenmedi.' }),
        });
      }
    });

    bb.on('error', (err: any) => {
      console.error('Busboy error:', err);
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Dosya işlenirken hata oluştu.', message: err.message }),
      });
    });

    try {
      if (event.isBase64Encoded) {
        bb.end(Buffer.from(event.body || '', 'base64'));
      } else {
        bb.end(event.body || '');
      }
    } catch (e: any) {
      console.error('Buffer processing error:', e);
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'İstek işlenemedi.', message: e.message }),
      });
    }
  });
};
