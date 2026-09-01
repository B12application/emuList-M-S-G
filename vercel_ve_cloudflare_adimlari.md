# B12 (emuList) — Vercel & Cloudflare Pages Dağıtım Rehberi

Bu belge, Netlify'ın Türkiye'deki bazı servis sağlayıcıları tarafından engellenmesi (`Connection Reset`) problemine karşın, projenizi kesintisiz ve hızlı bir şekilde canlıya alabileceğiniz **Vercel** ve **Cloudflare Pages** adımlarını ve detaylı karşılaştırmasını içerir.

---

## 🚀 1. Bölüm: Vercel ile Dağıtım (Önerilen & En Kolay)

Projeye özel `vercel.json` dosyası halihazırda oluşturulup GitHub `main` dalına eklenmiştir. Bu sayede yönlendirme (SPA routing) ve önbellek ayarları otomatik çalışır.

### Adım Adım Kurulum:
1. **Giriş Yapın:**
   * [vercel.com](https://vercel.com) adresine gidin.
   * **"Sign Up"** veya **"Log In"** butonuna basıp **"Continue with GitHub"** seçeneğiyle GitHub hesabınızı bağlayın.
2. **Projeyi İçe Aktarın (Import):**
   * Ana ekranda sağ üstteki **"Add New..."** -> **"Project"** butonuna tıklayın.
   * Repolarınız arasından **`emuList-M-S-G`** projesini bulun ve **"Import"** butonuna tıklayın.
3. **Yapılandırma Ayarları:**
   * **Framework Preset:** `Vite` (Otomatik algılanır, değiştirmeyin).
   * **Root Directory:** `./` (Varsayılan olarak kalır).
   * **Build Command:** `npm run build` (Varsayılan).
   * **Output Directory:** `dist` (Varsayılan).
4. **Ortam Değişkenleri (Environment Variables):**
   * Sayfadaki **"Environment Variables"** sekmesini açın.
   * Projenizin `.env` dosyasındaki değişkenleri (Örn: `VITE_API_KEY`, `VITE_AUTH_DOMAIN`, `VITE_ADMIN_UID`, `VITE_GEMINI_API_KEY` vb.) buraya `Key` ve `Value` olarak ekleyin.
5. **Yayına Alın:**
   * Mavi **"Deploy"** butonuna tıklayın.
   * 40–50 saniye içinde siteniz `https://...vercel.app` adresiyle sorunsuz açılacaktır.

---

## ☁️ 2. Bölüm: Cloudflare Pages ile Dağıtım

Cloudflare Pages, sınırsız bant genişliği ve Türkiye'deki doğrudan veri merkezleri (İstanbul / İzmir) sayesinde olağanüstü hızlı bir alternatiftir.

### Adım Adım Kurulum:
1. **Giriş Yapın:**
   * [dash.cloudflare.com](https://dash.cloudflare.com) adresine gidin ve ücretsiz bir hesap açın / giriş yapın.
2. **Pages Bölümüne Gidin:**
   * Sol menüden **"Compute (Workers & Pages)"** sekmesine tıklayın.
   * **"Create application"** butonuna basın ve üstten **"Pages"** sekmesini seçin.
3. **GitHub Reposunu Bağlayın:**
   * **"Connect to Git"** butonuna tıklayın.
   * GitHub hesabınızı yetkilendirip **`emuList-M-S-G`** reposunu seçin ve **"Begin setup"** deyin.
4. **Derleme (Build) Ayarları:**
   * **Project name:** `emulist` (veya istediğiniz bir isim).
   * **Production branch:** `main`.
   * **Framework preset:** `Vite`.
   * **Build command:** `npm run build`.
   * **Build output directory:** `dist`.
5. **Ortam Değişkenleri (Environment Variables):**
   * **"Environment variables (advanced)"** bölümüne tıklayın.
   * `.env` dosyanızdaki değişkenleri buraya ekleyin.
   * *(Önemli)* Node versiyonu için: `NODE_VERSION` = `20` değerini ekleyin.
6. **Yayına Alın:**
   * **"Save and Deploy"** butonuna tıklayın.
   * 1-2 dakika içinde siteniz `https://emulist.pages.dev` adresiyle yayına girecektir.

---

## ⚖️ Karşılaştırma: Hangisi Daha İyi?

| Özellik | Vercel | Cloudflare Pages | Netlify (Mevcut) |
| :--- | :--- | :--- | :--- |
| **Türkiye Erişilebilirliği** |  Sorunsuz (`*.vercel.app`) |  Sorunsuz (`*.pages.dev`) | ❌ Engelli/RST (`*.netlify.app`) |
| **Kurulum Kolaylığı** |  1 Dakika (En Kolay) |  Çok Kolay |  Kolay |
| **Bant Genişliği (Ücretsiz)**| 100 GB / ay |  **Sınırsız (Limitsiz)** | 100 GB / ay |
| **Edge Sunucuları** | Frankfurt vb. Avrupa |  **İstanbul & İzmir Pop** | Avrupa |
| **Vite SPA Uyumluluğu** |  Mükemmel (`vercel.json` hazır) |  Mükemmel (`_redirects` ile) |  İyi |

---

## 🏆 Nihai Karar ve Tavsiye

### 1. Seçim: **VERCEL** (Şu An İçin En İyisi)
* **Neden?:** 
  1. Projeniz için gereken tüm `vercel.json` yapılandırmasını az önce hazırlayıp repoya yükledik.
  2. Arayüzü çok daha sadedir; GitHub ile giriş yapıp repoyu seçip "Deploy" dediğiniz anda sıfır kafa karışıklığıyla çalışır.
  3. Türkiye'deki tüm operatörlerde (Turkcell, Vodafone, Türk Telekom) hem mobilde hem masaüstünde jet hızında ve engelsiz çalışır.

### 2. Seçim: **CLOUDFLARE PAGES** (Uzun Vadeli & Özel Domainli Projeler İçin En İyisi)
* **Neden?:**
  1. Ücretsiz planda dahi **sınırsız bant genişliği** sunar; sitenize milyonlarca istek gelse bile kota dolma derdi olmaz.
  2. Doğrudan Türkiye içinde (İstanbul ve İzmir) sunucuları vardır.
  3. İleride kendinize ait bir `.com` alan adı bağlamak isterseniz Cloudflare dünyanın 1 numaralı altyapısıdır.

> **Özet:** Şu anki acil erişim ihtiyacınız ve en hızlı çözüm için **Vercel'i** tercih etmeniz önerilir.
