import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testKey(key: string, name: string) {
    console.log(`Testing ${name} (${key.substring(0, 10)}...)...`);
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent('Hi');
        const response = await result.response;
        console.log(`${name} Works! Response: ${response.text()}`);
        return true;
    } catch (error: any) {
        console.log(`${name} Failed: ${error.message}`);
        return false;
    }
}

async function run() {
    const keyFromEnv = process.env.GEMINI_API_KEY || '';
    await testKey(keyFromEnv, 'Key from .env');
}

run();
