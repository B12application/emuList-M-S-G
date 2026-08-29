// scripts/backup-expenses.ts
// Otomatik Harcama (Gider, Gelir, Taksitler) Yedekleme Job Scripti
// Harcama verilerini Firestore'dan çeker ve projedeki /backups/expenses/ klasörüne JSON ve TXT olarak kaydeder.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from .env
dotenv.config({ path: path.join(projectRoot, '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_API_KEY,
    authDomain: process.env.VITE_AUTH_DOMAIN,
    projectId: process.env.VITE_PROJECT_ID,
    storageBucket: process.env.VITE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_APP_ID,
};

const targetUserId = process.env.VITE_ADMIN_UID || '';
const authEmail = process.env.BACKUP_AUTH_EMAIL || process.env.BACKUP_EMAIL || process.env.FIREBASE_AUTH_EMAIL || process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
const authPassword = process.env.BACKUP_AUTH_PASSWORD || process.env.BACKUP_PASSWORD || process.env.FIREBASE_AUTH_PASSWORD || process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;

async function runExpensesBackup() {
    console.log('🚀 [Expenses Backup Job] Harcama yedekleme başlatılıyor...');
    console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('Firebase yapılandırması .env dosyasında bulunamadı!');
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Oturum Açma (Firestore Güvenlik Kuralları auth kontrolü için)
    if (authEmail && authPassword) {
        try {
            console.log(`🔐 [Auth] '${authEmail}' ile Firebase oturumu açılıyor...`);
            await signInWithEmailAndPassword(auth, authEmail, authPassword);
            console.log('✅ [Auth] Başarıyla oturum açıldı.');
        } catch (authErr: any) {
            console.warn('⚠️ [Auth Giriş Uyarısı]:', authErr.message);
        }
    } else {
        console.log('ℹ️  [Auth] .env dosyasında BACKUP_AUTH_EMAIL / BACKUP_AUTH_PASSWORD bulunamadı.');
        console.log('💡 İpucu: Terminalden ve arka plandan otomatik yetkili yedek almak için .env içine ekleyin:');
        console.log('   BACKUP_AUTH_EMAIL="hesabiniz@gmail.com"');
        console.log('   BACKUP_AUTH_PASSWORD="sifreniz"\n');
    }

    // Ensure output directories exist
    const backupDir = path.join(projectRoot, 'backups', 'expenses');
    const monthlyDir = path.join(backupDir, 'monthly');
    fs.mkdirSync(backupDir, { recursive: true });
    fs.mkdirSync(monthlyDir, { recursive: true });

    // Fetch expensedata collection
    let q;
    if (targetUserId) {
        q = query(collection(db, 'expensedata'), where('userId', '==', targetUserId));
    } else {
        q = collection(db, 'expensedata');
    }

    let snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as any[];

    // Fallback: Check if 'expenses' collection has items
    if (items.length === 0) {
        let q2 = targetUserId ? query(collection(db, 'expenses'), where('userId', '==', targetUserId)) : collection(db, 'expenses');
        let snap2 = await getDocs(q2);
        if (snap2.docs.length > 0) {
            items = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        }
    }

    console.log(`💳 Toplam ${items.length} adet harcama kaydı bulundu.`);

    // Active (non-deleted) expenses
    const activeExpenses = items.filter(e => !e.isDeleted);
    const deletedExpenses = items.filter(e => e.isDeleted);

    const dateIso = new Date().toISOString();
    const dateStr = dateIso.slice(0, 10);
    const yearMonth = dateIso.slice(0, 7); // e.g. 2026-08

    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    let totalExpenseAmount = 0;
    let totalIncomeAmount = 0;

    activeExpenses.forEach(item => {
        const amt = Number(item.amount) || 0;
        const cat = item.category2 || item.category || 'Diğer';
        const direction = item.direction || 'giden';

        if (direction === 'gelen') {
            totalIncomeAmount += amt;
        } else {
            totalExpenseAmount += amt;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
        }
    });

    const payload = {
        version: '2.0',
        exportedAt: dateIso,
        targetUserId: targetUserId || 'all',
        totalCount: items.length,
        activeCount: activeExpenses.length,
        deletedCount: deletedExpenses.length,
        summary: {
            totalExpenseAmount,
            totalIncomeAmount,
            netBalance: totalIncomeAmount - totalExpenseAmount,
            categoryTotals
        },
        items: items
    };

    // 1. Write Latest JSON
    const latestJsonPath = path.join(backupDir, 'expenses_backup_latest.json');
    fs.writeFileSync(latestJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    // 2. Write Monthly JSON (Her ayın 15'i veya çalıştığı tarih)
    const monthlyJsonPath = path.join(monthlyDir, `expenses_backup_${yearMonth}.json`);
    fs.writeFileSync(monthlyJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    // 3. Generate Human-Readable Text Summary
    let txt = `=======================================================\n`;
    txt += `              EMULIST HARCAMA VE BUTCE RAPORU\n`;
    txt += `           Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
    txt += `           Toplam Kayit: ${activeExpenses.length} Aktif Harcama\n`;
    txt += `=======================================================\n\n`;

    txt += `📊 FINANSAL OZET:\n`;
    txt += `-------------------------------------------------------\n`;
    txt += `Toplam Gider : ${totalExpenseAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL\n`;
    txt += `Toplam Gelir : ${totalIncomeAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL\n`;
    txt += `Net Durum    : ${(totalIncomeAmount - totalExpenseAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL\n\n`;

    txt += `📂 KATEGORILERE GORE HARCAMA DAGILIMI:\n`;
    txt += `-------------------------------------------------------\n`;
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    sortedCats.forEach(([cat, amount], idx) => {
        const percent = totalExpenseAmount > 0 ? ((amount / totalExpenseAmount) * 100).toFixed(1) : '0';
        txt += `${idx + 1}. ${cat.padEnd(25, ' ')}: ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (%${percent})\n`;
    });
    txt += `\n`;

    txt += `📝 SON HARCAMALAR LISTESI:\n`;
    txt += `-------------------------------------------------------\n`;
    const sortedExpenses = [...activeExpenses].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    sortedExpenses.slice(0, 100).forEach((e, idx) => {
        const d = e.date ? e.date.slice(0, 10) : '-';
        const sign = e.direction === 'gelen' ? '+' : '-';
        txt += `${idx + 1}. [${d}] ${(e.title || 'Harcama').padEnd(30, ' ')} ${sign}${Number(e.amount || 0).toLocaleString('tr-TR')} TL (${e.category2 || e.category || '-'}) ${e.installmentCount ? `[Taksit: ${e.installmentCurrent || 1}/${e.installmentCount}]` : ''}\n`;
    });

    txt += `\n=======================================================\n`;
    txt += `Otomatik Harcama Yedekleme Tamamlandi (Job: Monthly Expenses Guard)\n`;

    const latestTxtPath = path.join(backupDir, 'expenses_summary_latest.txt');
    fs.writeFileSync(latestTxtPath, txt, 'utf-8');

    console.log(`✅ [Expenses Backup Job] Başarıyla kaydedildi:`);
    console.log(`   📄 JSON: ${latestJsonPath}`);
    console.log(`   📝 TXT : ${latestTxtPath}`);
    process.exit(0);
}

runExpensesBackup().catch(err => {
    console.error('❌ [Expenses Backup Job Hata]:', err);
    process.exit(1);
});
