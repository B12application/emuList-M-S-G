# B12 - Dijital Hafıza Vitaminin 🧠

> **Kişisel Yaşam Asistanı (Personal Life Agent) & Dijital Hafıza Deposu**  
> Geliştirici: **EMU (Mustafa Ulusoy)**  
> Canlı Dağıtım: **Cloudflare Pages**

---

## 📌 B12 Nedir?

**B12**, dağılan kişisel dijital dünyayı (izlenen filmlerden günlük harcamalara, toplantı notlarından kalori takibine kadar) tek bir çatı altında toplayan **bütünsel bir kişisel yaşam asistanıdır**. 

Sadece pasif bir kayıt defteri değil; akıllı önbellek mimarisi, yapay zeka entegrasyonu ve modern edge mimarisiyle günlük rutininizi organize eden yaşayan bir platformdur.

---

## 🏛️ 4 Temel Yaşam Sütunu

B12 mimarisi 4 ana operasyonel eksen üzerine kurulmuştur:

```
                              ┌────────────────────────────────────────┐
                              │      B12 - Kişisel Yaşam Asistanı     │
                              └───────────────────┬────────────────────┘
                                                  │
         ┌───────────────────┬────────────────────┴───────────────────┬───────────────────┐
         ▼                   ▼                                        ▼                   ▼
  🎬 Medya & Arşiv    📅 Ajanda & Yaşam                        💳 Finans & Takip    🧠 Akıllı Araçlar & AI
  • Film / Dizi / Oyun • Todo & Kanban                         • Gelir / Gider      • AI Beden & Kalori
  • Kitap & Özel Liste • Zengin Not Defteri (Tiptap)           • Bütçe Analitiği    • Seyahat Planlayıcı
  • OMDb / TMDb API    • Takvim & Spor Fikstürü                • Döviz & Altın      • Jira Fotoğraf Tarama
```

### 1. 🎬 Medya & Arşiv
- **Film, Dizi, Oyun ve Kitap Takibi:** Tüketilen içerikleri durumlarına göre (İzleniyor, İzlendi, Bırakıldı vb.) kategorize etme.
- **Harici API Entegrasyonları:** OMDb ve TMDb üzerinden anlık afiş, puan, cast ve künye çekimi.
- **Özel Listeler:** Tematik koleksiyonlar ve özel filtreleme seçenekleri.

### 2. 📅 Ajanda & Yaşam
- **Görev & Kanban Yönetimi:** Sürükle-bırak destekli yapılacaklar listesi.
- **Zengin Not Defteri:** Tiptap altyapısıyla zengin metin düzenleme, etiketleme ve hızlı arama.
- **Fotoğraftan Görev Tarama:** Fotoğraf/ekran görüntüsünden otomatik Jira veya görev kartı çıkarma.
- **Takvim & Maç Fikstürü:** Günlük etkinlikler ve spor fikstürlerinin kesintisiz takibi.

### 3. 💳 Finans & Takip
- **Gelir / Gider Yönetimi:** Günlük harcamaların kategorik takibi.
- **Bütçe Analizi:** Harcama alışkanlıklarını gösteren grafikler ve özetler.
- **Piyasa Verileri:** Anlık döviz ve altın kuru takibi.

### 4. 🧠 Akıllı Araçlar & AI
- **AI Destekli Beden & Kalori Takibi:** Google Gemini AI ile tüketilen besinlerin kalori/makro analizi ve 3D Beden Profili.
- **Seyahat Planlayıcı:** İnteraktif haritalar (Leaflet) ve rota planlama.
- **Akıllı Asistan:** Sistem içinde kişiselleştirilmiş AI rehberliği.

---

## ⚡ Teknik Mimari

B12, hız, gizlilik ve sürdürülebilirlik odaklı modern bir mimariyle inşa edilmiştir:

```
[ Tarayıcı (React 19 + Vite) ]
          │
          ▼
[ Katman 1: Tarayıcı RAM Önbelleği (0 ms) ]
          │ (Cache Miss)
          ▼
[ Katman 2: Upstash Serverless Edge Redis (5-15 ms) ] ── (Cloudflare Pages Functions)
          │ (Cache Miss)
          ▼
[ Katman 3: Firebase Firestore (50-100 ms) ]
          │ (Veri Yoksa)
          ▼
[ Katman 4: Dış API'ler / Gemini AI (200-800 ms) ] ── Otomatik RAM + Redis + Firestore Yazımı
```

### 🛠️ Teknoloji Yığını
- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Framer Motion, `@dnd-kit`, Tiptap, Three.js (`@types/three`), Leaflet.
- **Edge & Serverless API:** Cloudflare Pages Functions (`functions/api/`).
- **Veritabanı & Kimlik Doğrulama:** Firebase Firestore, Firebase Authentication.
- **Akıllı Önbellek & Kota Yönetimi:** Upstash Serverless Edge Redis.
- **Yapay Zeka:** Google Gemini API (`@google/generative-ai`).
- **Sıfır Sızıntı Güvenlik Standardı:** Gizli API anahtarları asla istemci bundle'ına gömülmez; Cloudflare Pages Functions üzerinden sunucu tarafında işlenir.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v18+)
- npm veya pnpm

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/emulusoy/emuList-M-S-G.git
cd emuList-M-S-G
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenleri
Kök dizinde `.env` dosyanızı oluşturup gerekli Firebase ve Cloudflare konfigürasyonlarını tanımlayın:
```env
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.

### 5. Canlı Sürüm Derlemesi (Build)
```bash
npm run build
```
Tip kontrolleri (`tsc -b`) tamamlanır ve optimize edilmiş statik dosyalar `dist/` klasörüne aktarılır.

---

## 📦 Yardımcı Komutlar
- `npm run backup:all` — Medya ve harcama veritabanı yedeklerini alır.
- `npm run sync:fixtures` — Spor maç fikstürlerini günceller.
- `npm run lint` — Kod standartlarını denetler.

---

## 👤 Geliştirici & Lisans
Geliştirici: **EMU (Mustafa Ulusoy)**  
Tüm hakları saklıdır.
