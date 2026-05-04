import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';
import { UsageService } from '../services/usageService.js';

dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Lütfen bir PDF dosyası yükleyin.' });
      return;
    }

    // Check usage limit
    if (UsageService.isLimitReached()) {
      res.status(429).json({ 
        error: 'Günlük analiz limitine ulaştınız (20/20).', 
        message: 'Lütfen yarın tekrar deneyin veya farklı bir API anahtarı kullanın.' 
      });
      return;
    }

    if (req.file.mimetype !== 'application/pdf') {
      res.status(400).json({ error: 'Sadece PDF dosyaları desteklenmektedir.' });
      return;
    }

    console.log("Starting PDF analysis...");
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest'
    });

    console.log("Model initialized. Starting PDF text extraction...");

    // Extract text from PDF using modern pdf-parse v2 API
    let pdfText = '';
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      const data = await parser.getText();
      pdfText = data.text;
      await parser.destroy();
      console.log("PDF text extracted successfully. Length:", pdfText.length);
    } catch (parseError) {
      console.error("PDF parsing failed:", parseError);
      res.status(500).json({ error: 'PDF dosyası okunurken bir hata oluştu.' });
      return;
    }

    if (!pdfText || pdfText.trim().length === 0) {
      console.error("PDF text is empty.");
      res.status(400).json({ error: 'PDF içeriği okunamadı veya dosya boş.' });
      return;
    }

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

    console.log("Sending request to Gemini API...");
    const result = await model.generateContent(prompt);
    console.log("Gemini response received.");
    const response = await result.response;
    const text = response.text();

    try {
      // Clean up markdown code blocks if present
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      // Increment usage count on success
      UsageService.incrementUsage();
      
      res.status(200).json(parsedData);
    } catch (parseError) {
      console.error('Gemini response parse error:', parseError);
      res.status(500).json({ error: 'AI cevabı işlenirken bir hata oluştu.', details: text });
    }

  } catch (error: any) {
    console.error('Statement analysis error details:', error);
    res.status(500).json({
      error: 'Analiz sırasında bir hata oluştu.',
      message: error.message,
      details: error.stack
    });
  }
};

export const getUsage = (_req: Request, res: Response): void => {
  res.json(UsageService.getUsage());
};
