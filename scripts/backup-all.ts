// scripts/backup-all.ts
// Hem Medya hem Harcama yedeklerini tek seferde çalıştırıp /backups/ dizinine kaydeden komut

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=======================================================');
console.log('🛡️  [EMULIST TAM YEDEKLEME MERKEZI]');
console.log('=======================================================');

console.log('\n🎬 1/2: Medya Kütüphanesi Yedekleniyor...');
const mediaRun = spawnSync('npx', ['tsx', path.join(__dirname, 'backup-media.ts')], { stdio: 'inherit', shell: true });

console.log('\n💳 2/2: Harcama Verileri Yedekleniyor...');
const expRun = spawnSync('npx', ['tsx', path.join(__dirname, 'backup-expenses.ts')], { stdio: 'inherit', shell: true });

console.log('\n=======================================================');
if (mediaRun.status === 0 && expRun.status === 0) {
    console.log('🎉 TÜM YEDEKLEME İŞLEMLERİ BAŞARIYLA TAMAMLANDI!');
    console.log('📁 Dosyalar /backups/media/ ve /backups/expenses/ içinde güncellendi.');
} else {
    console.log('⚠️ Bazı yedekleme işlemleri uyarı veya hata ile sonuçlandı.');
}
console.log('=======================================================\n');
