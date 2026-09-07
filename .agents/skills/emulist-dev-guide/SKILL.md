---
name: emulist-dev-guide
description: Repository-specific guidelines, architecture constraints, and learned lessons for B12 (by EMU)
---

# B12 Geliştirme Kılavuzu ve Mimari Standartlar (Yapımcı: EMU)

Bu kılavuz; **B12** platformundaki tüm mimari standartları, bileşen kurallarını ve geliştirme prensiplerini içerir. Projede kod yazarken veya yeni bir özellik eklerken bu kurallara eksiksiz uyulmalıdır.

---

## 1. Marka Kimliği ve İsimlendirme (MANDATORY)
- **Platformun Resmi Adı**: Platformun adı kesinlikle **B12**'dir (veya *"B12 - Dijital Hafıza Vitaminin"*). Asla "emulist" olarak anılmamalı, başlıklandırılmamalı ve yazılmamalıdır.
- **Yapımcı / Geliştirici**: Platformun yapımcısı **EMU**'dur.
- Tüm arayüz metinlerinde, başlıklarda, dokümantasyonlarda ve kullanıcı diyaloglarında bu kimliğe koşulsuz uyulmalıdır.

## 2. Dış Veri Güvenilirliği & Yerel Yedekler (External Data Resilience)
- **Galatasaray Maç Fikstürü (ICS Feeds)**:
  - Harici CORS proxy servisleri (`allorigins.win`, `corsproxy.io` vb.) tarayıcı ortamlarında güvenilmezdir veya zaman zaman engellenebilir.
  - Proxy zincirinin sonunda mutlaka `public/gs_fallback.ics` dosyasına yerel statik fallback bulunmalıdır (`galatasarayService.ts`).
  - Arayüzün her koşulda %100 çalışmasını garanti eden yerel bir fallback olmadan harici veri çekimi bırakılmamalıdır.

## 3. API Seçimi ve Arama Mantığı (Media API Strictness)
- **OMDb vs TMDb Seçimi**:
  - Kullanıcı hangi API'yi seçtiyse o tercihe kesinlikle sadık kalınmalıdır.
  - Bir API'de sonuç bulunamadığında arka planda sessizce diğerine geçilmemelidir. Kullanıcı tercihine saygı duyulmalı ve doğru API'nin sonucu bildirilmelidir.

## 4. Responsive Yerleşim & Z-Index Katmanlama Standartları
- **Mobil Alt Bar (`BottomNavBar`)**:
  - Mobilde `bottom-0`'da sabit, `z-[100]` ve ~72px yüksekliğindedir (`md:hidden`).
  - Yüzen eylem çubukları (örneğin sayfa altındaki kaydet çubuğu) `z-[110]` ve `bottom-24 md:bottom-6` kullanmalıdır; böylece `BottomNavBar`'ın üstünde güvenle yüzer.
- **Arama Açılır Menüleri (Dropdowns)**:
  - Otomatik tamamlama menüleri en az `z-50` olmalı ve ebeveyn kapsayıcılarda `overflow-hidden` ile kesilmemelidir.
- **Genel Modallar**:
  - `z-[120]` katmanında ve `fixed inset-0` olarak konumlandırılmalıdır.

## 5. Bütünleşik Modal ve Pop-up Mimarisi (MANDATORY STANDARD)
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

## 6. Standart "Daha Fazla Yükle" Bileşeni (`LoadMoreButton`)
- Listeleme veya sayfalama gereken hiçbir sayfada rastgele/ad-hoc "Daha Fazla Gör", "Daha Fazla Yükle" butonu yazılmamalıdır.
- Her zaman [`LoadMoreButton.tsx`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/components/ui/LoadMoreButton.tsx) bileşeni kullanılmalıdır (`onClick`, `loading`, isteğe bağlı `remainingCount`).
- `LoadMoreButton` içeren mobil listelerde iç içe kaydırma tuzağı oluşturan `max-h-[600px] overflow-y-auto` gibi yapay kısıtlar kullanılmamalıdır.

## 7. Özellik Erişim & Admin Panel Yönetimi (Feature Access Governance)
- Sisteme YENİ BİR SAYFA, ARAÇ veya MODÜL eklendiğinde zorunlu olarak:
  1. [`featureAccessService.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/services/featureAccessService.ts) içerisine yeni `FeatureKey` eklenmelidir.
  2. `DEFAULT_ACCESS` haritasında varsayılan durumu ve `FEATURE_LABELS` haritasında Türkçe/İngilizce adı ile emojisi tanımlanmalıdır.
  3. `App.tsx` yönlendirmesine yetki kontrolü (`useFeatureAccess`) eklenmeli; `MobileMenu.tsx`, `Sidebar.tsx` ve `AdminPage.tsx` içerisinde görünür kılınmalıdır.

## 8. Mobil Alt Navigasyon Standartları (`BottomNavBar`)
- `BottomNavBar` her zaman tek sayılı (5 öğeli) tam simetrik yapıda olmalıdır:
  1. **Ana Sayfa** (`/`)
  2. **Koleksiyon** (`/movie`)
  3. **+ Ekle** (`/create`) — Tam ortada, diğer butonlarla eşit yükseklikte ve hizada (`w-11 h-8 rounded-xl`). Barın dışına taşan dengesiz çıkıntılar yapılmamalıdır.
  4. **Harcamalar** (`/expenses`)
  5. **Menü** (`#`)
- PWA güvenli alan desteği (`paddingBottom: max(env(safe-area-inset-bottom), 8px)`) her zaman korunmalıdır.

## 9. Dizi Takip Mantığı (TV Series Tracking)
- Tüm dizi ve bölüm durum güncellemeleri için `episodeTrackingService.ts` kullanılmalıdır.
- İzlenen, devam eden ve izlenmeyen durumlar arayüzde doğru renk ve rozetlerle ayrıştırılmalıdır.

## 10. Zorunlu İki Dilli (TR / EN) Yerelleştirme (Mandatory Localization)
- **Sıfır Sabit Metin (No Hardcoded Strings)**:
  - Yeni bir sayfa, modal, buton, form etiketi veya bildirim eklendiğinde ASLA sadece Türkçe veya sadece İngilizce metin gömülmemelidir.
  - Her zaman hem `src/frontend/translations/tr.ts` hem de `en.ts` dosyalarına karşılık gelen anahtarlar eklenmeli ve bileşenlerde `const { t } = useLanguage();` kullanılarak `t('...')` ile çağrılmalıdır.
  - Dil değiştirici (TR/EN) tıklandığında ekrandaki hiçbir bileşen dilsiz veya çevrilmemiş kalmamalıdır.

## 11. Git Yetkilendirme Protokolü (MANDATORY)
- **İzinsiz Commit ve Push Yasağı**:
  - Kullanıcı sohbet içerisinde AÇIKÇA *"commit at"*, *"commit yap"*, *"pushla"* veya *"git'e gönder"* demediği sürece ASLA `git commit` veya `git push` komutları çalıştırılmamalıdır.
  - Tüm dosya değişiklikleri çalışma alanında (working tree) bırakılmalı, kullanıcı inceleyip onay verdikten sonra yalnızca kullanıcının talimatıyla commit'lenmelidir.

## 12. Geliştirme ve Derleme Doğrulama Protokolü
- Herhangi bir geliştirme tamamlanmadan önce:
  1. Yukarıdaki tüm mimari, dil, marka ve izin kuralları kontrol edilmelidir.
  2. Terminalde `npm run build` (`tsc -b && vite build`) komutu çalıştırılarak 0 TypeScript/derleme hatası teyit edilmelidir.

## 13. Navbar Açılır Menü Mimarisi ve Tasarım Bütünlüğü (MANDATORY STANDARD)
- **Tek Tip Dropdown Mimarisi**:
  - `Header.tsx` içindeki tüm açılır menüler (`listsDropdown`, `agendaDropdown`, `toolsDropdown`, `addDropdown` vb.) istisnasız **aynı tasarım dilini** taşımalıdır:
    1. **Konteyner Boyutu & Efekt**: Eşit genişlik (`w-64`), yuvarlatılmış köşeler (`rounded-2xl`), cam efekti (`backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 border border-stone-200/80 dark:border-zinc-800/80 shadow-2xl`).
    2. **İkon Kutusu Standardı**: Asla çıplak/renksiz ikon ile kutulu ikon bir arada kullanılmaz. Her menü öğesi özel renkli arka plana sahip bir ikon kutusuna (`w-8 h-8 rounded-xl flex items-center justify-center shrink-0`) sahip olmalıdır.
    3. **İki Satırlı Hiyerarşi**: Her menü elemanı kalın bir başlık (`text-xs font-bold`) ve altında hafif bir açıklama metni (`text-[10px] text-stone-400 dark:text-zinc-400`) içermelidir.

## 14. B12 Platform Kimliği: Kişisel Yaşam Asistanı (Personal Life Agent)
- **Genişletilmiş Platform Kapsamı**:
  - B12 platformu yalnızca dizi, film veya oyun kaydedilen bir arşiv sitesi değildir.
  - B12; **Kişisel Yaşam Asistanı (Personal Life Agent) & Dijital Hafıza Vitaminin**'dir.
  - Sitedeki footer, karşılama metinleri ve tanıtım bölümlerinde 4 temel yaşam sütunu eşit güçte temsil edilmelidir:
    1. **Medya & Arşiv**: Filmler, Diziler, Oyunlar, Kitaplar, Özel Listeler
    2. **Ajanda & Yaşam**: Takvim & Ajanda, Zengin Notlar, Spor / Maç Fikstürü
    3. **Finans & Takip**: Harcamalar ve Bütçe Yönetimi
    4. **Akıllı Araçlar**: Seyahat Planlayıcı, AI Destekli Beden & Kalori Takibi

## 15. Standart Sayfa Bilgilendirme Bannerı (PageHeaderBanner)
- Ayarlar ve İstatistikler sayfalarında uygulanan sayfa bilgilendirme başlığı mimarisi standarttır (`PageHeaderBanner`).
- İlgili sayfalarda sayfa ikonu, kalın `h1` başlığı, açıklama metni ve hızlı geri/aksiyon butonu içeren bu düzen korunmalı ve tüm ana sayfalara uygulanmalıdır.

## 16. Tam Ekran Akışkanlığı & Ekran Ölçeklenebilirliği (MANDATORY STANDARD)
- **Sıkıştırılmış Dar Tasarımlara Kesin Yasak**:
  - B12 platformu sağdan ve soldan yapay dar sınırlayıcılarla (`max-w-3xl`, `max-w-4xl`, `max-w-md` vb.) sıkıştırılmış, klostrofobik bir site **DEĞİLDİR**.
  - Tüm sayfalar, araçlar (özellikle Kalori Raporu, AI Sohbet Asistanı, Beden Profili vb.) ve listeler, her inç masaüstü/geniş monitörden en küçük cep telefonu ekranına kadar tam uyumlu, ferah ve akışkan (`w-full max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8`) genişlik ölçekleme mimarisine sahip olmalıdır.
  - Sayfa ana gövdelerinde monitör genişliğini boşa harcayan yapay dar container sınırları asla kullanılmamalıdır.


