# B12 Otomatik Proje İçi Yedekleme Deposu (Backup Vault)

Bu dizin, sistem tarafından otomatik çalışan GitHub Actions Cron Job'ları ve yerel scriptler aracılığıyla güncellenir.

> 🔒 **Önemli Yetki Notu:** Otomatik GitHub Actions repo içi yedekleme mekanizması yalnızca platform sahibi / yöneticisi (**EMU**) verilerini repoya işler. Diğer kullanıcılar web arayüzünden ("Ayarlar > Veritabanı Koruma & Kurtarma Kasası") kendi verilerini anlık dosya (JSON/TXT) olarak indirirler.

## 📂 Dizin Yapısı:
- **`backups/media/`**:
  - `media_backup_latest.json` -> Tüm film, dizi, oyun ve kitapların IMDb ID'leri, puanları ve detaylarını içeren güncel JSON yedeği.
  - `media_archive_latest.txt` -> Kategorize edilmiş okunabilir metin listesi.
  - `history/` -> 15 günlük zaman damgalı arşivler (`media_backup_YYYY-MM-DD.json`).
- **`backups/expenses/`**:
  - `expenses_backup_latest.json` -> Tüm gelir, gider ve taksit kayıtlarını içeren güncel JSON yedeği.
  - `expenses_summary_latest.txt` -> Kategori bazlı finansal özet ve döküm.
  - `history/` -> 15 günlük zaman damgalı arşivler (`expenses_backup_YYYY-MM-DD.json`).
  - `monthly/` -> Aylık bazda arşivler.

## ⏰ Otomatik Çalışma Takvimi (GitHub Actions - 15 Günde Bir & Farklı Günler):
- 🎬 **Medya Yedeği (15 Günde Bir):** Her ayın **8'i ve 22'si Gece 00:00 TRT** (21:00 UTC) otomatik çalışır ve repoya commit atar.
- 💳 **Harcama Yedeği (15 Günde Bir):** Her ayın **15'i ve 29'u Gece 00:00 TRT** (21:00 UTC) otomatik çalışır ve repoya commit atar.
- *Her iki job haftalık dönüşümle 7 gün arayla çalışır ve asla aynı güne denk gelmez.*

## 💻 Manuel Çalıştırma Komutları:
```bash
npm run backup:media     # Sadece medya kütüphanesini yedekler
npm run backup:expenses  # Sadece harcamaları yedekler
npm run backup:all       # Tüm sistemi tek seferde yedekler
```
