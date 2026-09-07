---
name: emulist-dev-guide
description: Repository-specific guidelines, architecture constraints, and learned lessons for emuList-M-S-G
---

# emuList-M-S-G Geliştirme Kılavuzu ve Mimari Standartlar

Bu kılavuz; emuList-M-S-G projesindeki tüm mimari standartları, bileşen kurallarını ve geliştirme prensiplerini içerir. Projede kod yazarken veya yeni bir özellik eklerken bu kurallara eksiksiz uyulmalıdır.

---

## 1. Dış Veri Güvenilirliği & Yerel Yedekler (External Data Resilience)
- **Galatasaray Maç Fikstürü (ICS Feeds)**:
  - Harici CORS proxy servisleri (`allorigins.win`, `corsproxy.io` vb.) tarayıcı ortamlarında güvenilmezdir veya zaman zaman engellenebilir.
  - Proxy zincirinin sonunda mutlaka `public/gs_fallback.ics` dosyasına yerel statik fallback bulunmalıdır (`galatasarayService.ts`).
  - Arayüzün her koşulda %100 çalışmasını garanti eden yerel bir fallback olmadan harici veri çekimi bırakılmamalıdır.

## 2. API Seçimi ve Arama Mantığı (Media API Strictness)
- **OMDb vs TMDb Seçimi**:
  - Kullanıcı hangi API'yi seçtiyse o tercihe kesinlikle sadık kalınmalıdır.
  - Bir API'de sonuç bulunamadığında arka planda sessizce diğerine geçilmemelidir. Kullanıcı tercihine saygı duyulmalı ve doğru API'nin sonucu bildirilmelidir.

## 3. Responsive Yerleşim & Z-Index Katmanlama Standartları
- **Mobil Alt Bar (`BottomNavBar`)**:
  - Mobilde `bottom-0`'da sabit, `z-[100]` ve ~72px yüksekliğindedir (`md:hidden`).
  - Yüzen eylem çubukları (örneğin sayfa altındaki kaydet çubuğu) `z-[110]` ve `bottom-24 md:bottom-6` kullanmalıdır; böylece `BottomNavBar`'ın üstünde güvenle yüzer.
- **Arama Açılır Menüleri (Dropdowns)**:
  - Otomatik tamamlama menüleri en az `z-50` olmalı ve ebeveyn kapsayıcılarda `overflow-hidden` ile kesilmemelidir.
- **Genel Modallar**:
  - `z-[120]` katmanında ve `fixed inset-0` olarak konumlandırılmalıdır.

## 4. Bütünleşik Modal ve Pop-up Mimarisi (MANDATORY STANDARD)
Sitedeki tüm modal ve diyaloglar 4 standart tipe göre yapılandırılmalıdır:
1. **Ekleme / Düzenleme Form Modalı (Add/Edit Modal)**:
   - **Arka Plan:** `bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm z-[120]`.
   - **Kart Yapısı:** Yuvarlatılmış köşeler (`rounded-3xl` veya `rounded-2xl`), genişlik (`w-full max-w-lg sm:max-w-xl`), hafif gölge ve kenarlık.
   - **Başlık (Header):** İkon + Başlık + Sağ üstte belirgin `✕` kapatma butonu.
   - **Gövde (Body):** Mobilde ve sanal klavyede taşmayı önlemek için mutlaka sınırlı ve kaydırılabilir olmalıdır (`max-h-[75vh] sm:max-h-[80vh] overflow-y-auto custom-scrollbar px-6 py-4`).
   - **Sabit Alt Çubuk (Sticky Footer):** Vazgeç ve Kaydet butonları gövdeden ayrı, modalın altında sabit durmalıdır (`sticky bottom-0 px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200 dark:border-zinc-800`), asla ekrandan kayıp gitmemelidir.
2. **Onay Pencereleri (Confirmation Dialogs)**:
   - Yerel `window.confirm()` veya rastgele popup'lar ASLA kullanılmamalıdır; her zaman `ConfirmDialog.tsx` bileşeni kullanılmalıdır.
3. **Detay / İnceleme Modalı**:
   - `max-h-[90vh] flex flex-col` ve `overflow-y-auto` gövdeye sahip olmalı; mobil kahraman görselleri `h-48 md:h-auto` tutularak dikey alan korunmalıdır.
4. **Filtre / Hızlı Seçim Çekmecesi**:
   - Ekranı kaplamayan, kompakt ve hızlı kapatılabilir olmalıdır.

## 5. Standart "Daha Fazla Yükle" Bileşeni (`LoadMoreButton`)
- Listeleme veya sayfalama gereken hiçbir sayfada rastgele/ad-hoc "Daha Fazla Gör", "Daha Fazla Yükle" butonu yazılmamalıdır.
- Her zaman [`LoadMoreButton.tsx`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/components/ui/LoadMoreButton.tsx) bileşeni kullanılmalıdır (`onClick`, `loading`, isteğe bağlı `remainingCount`).
- `LoadMoreButton` içeren mobil listelerde iç içe kaydırma tuzağı oluşturan `max-h-[600px] overflow-y-auto` gibi yapay kısıtlar kullanılmamalıdır.

## 6. Özellik Erişim & Admin Panel Yönetimi (Feature Access Governance)
- Sisteme YENİ BİR SAYFA, ARAÇ veya MODÜL eklendiğinde zorunlu olarak:
  1. [`featureAccessService.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/services/featureAccessService.ts) içerisine yeni `FeatureKey` eklenmelidir.
  2. `DEFAULT_ACCESS` haritasında varsayılan durumu ve `FEATURE_LABELS` haritasında Türkçe/İngilizce adı ile emojisi tanımlanmalıdır.
  3. `App.tsx` yönlendirmesine yetki kontrolü (`useFeatureAccess`) eklenmeli; `MobileMenu.tsx`, `Sidebar.tsx` ve `AdminPage.tsx` içerisinde görünür kılınmalıdır.

## 7. Mobil Alt Navigasyon Standartları (`BottomNavBar`)
- `BottomNavBar` her zaman tek sayılı (5 öğeli) tam simetrik yapıda olmalıdır:
  1. **Ana Sayfa** (`/`)
  2. **Koleksiyon** (`/movie`)
  3. **+ Ekle** (`/create`) — Tam ortada, diğer butonlarla eşit yükseklikte ve hizada (`w-11 h-8 rounded-xl`). Barın dışına taşan dengesiz çıkıntılar yapılmamalıdır.
  4. **Harcamalar** (`/expenses`)
  5. **Menü** (`#`)
- PWA güvenli alan desteği (`paddingBottom: max(env(safe-area-inset-bottom), 8px)`) her zaman korunmalıdır.

## 8. Dizi Takip Mantığı (TV Series Tracking)
- Tüm dizi ve bölüm durum güncellemeleri için `episodeTrackingService.ts` kullanılmalıdır.
- İzlenen, devam eden ve izlenmeyen durumlar arayüzde doğru renk ve rozetlerle ayrıştırılmalıdır.

## 9. Geliştirme ve Derleme Doğrulama Protokolü
- Herhangi bir geliştirme tamamlanmadan önce:
  1. Yukarıdaki 8 mimari kural kontrol edilmelidir.
  2. Terminalde `npm run build` (`tsc -b && vite build`) komutu çalıştırılarak 0 TypeScript/derleme hatası teyit edilmelidir.
