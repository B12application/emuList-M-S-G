# B12 (by EMU) – 4 Katmanlı Akıllı Önbellek & Serverless Edge Redis Mimarisi

Bu belge, B12 platformunda verilerin tüm kullanıcılar ve cihazlar arasında **ışık hızında (5-15ms)** gelmesini sağlayan, API kotalarını (OMDb 1.000 istek sınırı vb.) koruyan 4 katmanlı hibrit önbellek mimarisini belgeler.

---

## 1. Mimari Şema: Verilerin Işık Hızında Gelmesi İçin

```
[Kullanıcı Bir İçeriğe Tıklar / Arar]
 (Örn: Oyuncu Filmografisi, Dizi/Film Detayı, Gezilecek İlçe)
                         │
                         ▼
        ┌───────────────────────────────────┐
        │  1. Katman: Tarayıcı RAM (0 ms)    │ ──(Bulunursa)──► Anında Açılır (Sıfır Ağ İsteği)
        └───────────────────────────────────┘
                         │ (Yoksa)
                         ▼
        ┌───────────────────────────────────┐
        │  2. Katman: Upstash Edge Redis    │ ──(Bulunursa)──► 5-15 ms İçinde
        │     (Tüm Cihazlar & Kullanıcılar) │                  Tüm Kullanıcılara Açılır
        └───────────────────────────────────┘
                         │ (Yoksa)
                         ▼
        ┌───────────────────────────────────┐
        │  3. Katman: Firestore DB          │ ──(Bulunursa)──► Veritabanından Gelir
        └───────────────────────────────────┘
                         │ (Yoksa)
                         ▼
        ┌───────────────────────────────────┐
        │  4. Katman: Dış API (OMDb / TMDb) │ ──► Çekilir & Tüm Katmanlara
        └───────────────────────────────────┘     (RAM + Redis + DB) Otomatik Yazılır
```

---

## 2. Mimarinin Bileşenleri ve Çalışma Mantığı

### Katman 1: Tarayıcı Belleği (In-Memory Map) — 0 ms
* Kullanıcı bir oturumda aynı sayfada veya modalda gezinirken veriler JavaScript belleğinde tutulur.
* Aynı içeriğe tekrar tıklandığında dışarıya hiçbir ağ isteği gitmez, anında ekrana gelir.

### Katman 2: Serverless Edge Redis (Upstash) — 5-15 ms
* **Konum:** Cloudflare Pages Functions (`functions/api/redis-cache.ts`).
* **Kapsam:** Tüm cihazlar (telefon, tablet, bilgisayar) ve tüm kullanıcılar için **ortak ve tek merkezdir**.
* **Ortak Paylaşım:** Bir kullanıcı bir oyuncunun filmografisini (*Cillian Murphy*) veya bir ilçenin (*Kadıköy*) gezilecek yerlerini çektiğinde, veri 14-30 gün TTL ile Upstash Redis'e yazılır.
* Başka bir kullanıcı veya siz farklı bir cihazdan girdiğinizde veri doğrudan Redis'ten 10 milisaniyede döner; **dış API'ye 0 istek gider**.
* **Ortak 1.000 Kota Sayacı:** OMDb için günlük istekler Redis'te atomik sayaç ile (`INCR b12:quota:omdb:YYYY-MM-DD`) tutulur; tüm kullanıcıların toplam tüketimi tek merkezden sayılır ve sınır aşımı engellenir.

### Katman 3: Firestore Veritabanı — 50-100 ms
* Kalıcı veritabanı yedeğidir.
* Redis anahtarlarının süresi dolsa dahi veriler Firestore üzerinden korunur.

### Katman 4: Dış API Çağrısı (OMDb, TMDb, OpenTripMap) — 200-800 ms
* Yalnızca ilk üç katmanda veri yoksa dış API'ye gidilir.
* Alınan taze veri hemen **RAM + Redis + Firestore** katmanlarına aynı anda yazılarak gelecekteki tüm istekler için ışık hızına dönüştürülür.

---

## 3. İlgili Dosyalar ve Servisler

1. **Edge API Endpoint:** [`functions/api/redis-cache.ts`](file:///c:/GithubProjects/emuList-M-S-G/functions/api/redis-cache.ts)
2. **Evrensel Redis Servisi:** [`src/backend/services/redisService.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/backend/services/redisService.ts)
3. **Kota & Önbellek Yöneticisi:** [`src/backend/services/apiQuotaService.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/backend/services/apiQuotaService.ts)
4. **TMDb Servis Entegrasyonu:** [`src/backend/services/tmdbApi.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/backend/services/tmdbApi.ts)
5. **Gezilecek Yerler Entegrasyonu:** [`src/frontend/services/travelService.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/services/travelService.ts)
6. **Ayarlar Paneli:** [`src/frontend/components/settings/ApiQuotaSettingsSection.tsx`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/components/settings/ApiQuotaSettingsSection.tsx)

---

## 4. Gelecekteki Yeni Özelliklerde Kullanım Kuralı (MANDATORY)

B12 platformunda geliştirilecek **herhangi bir yeni özellikte** (örn. yeni bir harici API, spor istatistikleri, hava durumu, borsa verisi, kitap/oyun detayları vb.):
* Verilerin hızlı gelmesi ve kota tüketiminin önlenmesi için **mutlaka bu 4 katmanlı mimari kullanılmalıdır**.
* Yeni istekler doğrudan `getOrFetchWithRedisCache(cacheKey, fetcher, ttlMs)` veya `getRedisCache` / `setRedisCache` ile sarmalanmalıdır.
