import { GoogleGenerativeAI } from '@google/generative-ai';
import busboy from 'busboy';
import { UsageService } from './utils/usageService';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: 'Method Not Allowed'
        };
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
    }
    catch (usageError) {
        console.error('Usage check failed:', usageError);
    }
    return new Promise((resolve) => {
        const bb = busboy({ headers: event.headers });
        let fileProcessed = false;
        let fileBuffer = null;
        bb.on('file', (name, file, info) => {
            fileProcessed = true;
            const { mimeType } = info;
            if (mimeType !== 'application/pdf') {
                resolve({
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ error: 'Sadece PDF dosyaları desteklenmektedir.' }),
                });
                return;
            }
            const chunks = [];
            file.on('data', (data) => chunks.push(data));
            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
            });
        });
        bb.on('finish', async () => {
            if (!fileProcessed || !fileBuffer) {
                resolve({
                    statusCode: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ error: 'Herhangi bir dosya yüklenmedi veya dosya okunamadı.' }),
                });
                return;
            }
            try {
                console.log('Starting native Gemini PDF analysis...');
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
                            data: fileBuffer.toString('base64'),
                            mimeType: 'application/pdf'
                        }
                    },
                    prompt
                ]);
                const responseText = result.response.text();
                console.log('Gemini response received');
                const cleanJson = responseText.replace(/```json|```/g, '').trim();
                const parsedData = JSON.parse(cleanJson);
                await UsageService.incrementUsage();
                resolve({
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify(parsedData),
                });
            }
            catch (error) {
                console.error('Analysis error:', error);
                resolve({
                    statusCode: 500,
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({ error: 'Analiz sırasında bir hata oluştu.', message: error.message }),
                });
            }
        });
        bb.on('error', (err) => {
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
            }
            else {
                bb.end(event.body || '');
            }
        }
        catch (e) {
            console.error('Buffer processing error:', e);
            resolve({
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'İstek işlenemedi.', message: e.message }),
            });
        }
    });
};
