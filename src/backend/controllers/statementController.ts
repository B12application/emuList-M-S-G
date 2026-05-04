import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { UsageService } from '../services/usageService.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeStatement = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Dosya yüklenemedi.' });
      return;
    }

    // Check usage limit
    if (await UsageService.isLimitReached()) {
      res.status(429).json({
        error: 'Günlük analiz limitine ulaştınız (20/20).',
        message: 'Lütfen yarın tekrar deneyin.'
      });
      return;
    }

    console.log("Starting native Gemini PDF analysis...");

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const prompt = `Sen uzman bir finansal veri analiz asistanısın. Bu banka hesap özeti dosyasından SADECE harcamaları ve giden transferleri ayıklamanı istiyorum.
        
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
    "date": "2024-01-01"
  }
]`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      },
      prompt
    ]);

    const text = result.response.text();
    
    // Clean up markdown code blocks if present
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    
    // Increment usage count on success
    await UsageService.incrementUsage();
    
    res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analiz sırasında bir hata oluştu.', message: error.message });
  }
};

export const getUsage = async (_req: Request, res: Response) => {
  try {
    const usage = await UsageService.getUsage();
    res.status(200).json(usage);
  } catch (error: any) {
    console.error('Usage fetch error:', error);
    res.status(500).json({ error: 'Kullanım bilgisi alınamadı.', message: error.message });
  }
};
