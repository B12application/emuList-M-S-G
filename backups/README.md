# emuList Otomatik Proje İçi Yedekleme Deposu (Backup Vault)

Bu dizin, sistem tarafından otomatik çalışan yedekleme Cron Job'ları ve yerel scriptler aracılığıyla güncellenir.

## 📂 Dizin Yapısı:
- **`backups/media/`**:
  - `media_backup_latest.json` -> Tüm film, dizi, oyun ve kitapların IMDb ID'leri, puanları ve detaylarını içeren tam JSON yedeği.
  - `media_archive_latest.txt` -> Kategorize edilmiş okunabilir metin listesi.
  - `history/` -> Günlük zaman damgalı arşivler.
- **`backups/expenses/`**:
  - `expenses_backup_latest.json` -> Tüm gelir, gider ve taksit kayıtlarını içeren tam JSON yedeği.
  - `expenses_summary_latest.txt` -> Kategori bazlı finansal özet ve döküm.
  - `monthly/` -> Her ayın 15'ine ait aylık arşivler.

## ⏰ Otomatik Çalışma Takvimi (GitHub Actions):
- 🎬 **Medya Yedeği:** Her gün **Gece 00:00 (Türkiye Saati)** otomatik çalışır ve repoya commit atar.
- 💳 **Harcama Yedeği:** Her ayın **15'i Gece 00:00 (Türkiye Saati)** otomatik çalışır ve repoya commit atar.

## 💻 Manuel Çalıştırma Komutları:
```bash
npm run backup:media     # Sadece medya kütüphanesini yedekler
npm run backup:expenses  # Sadece harcamaları yedekler
npm run backup:all       # Tüm sistemi tek seferde yedekler
```
