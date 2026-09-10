# Project Rules & Learned Knowledge for B12 (by EMU)

This file contains repository-specific guidelines, architecture constraints, and learned lessons from past user interactions. Always consult these rules when developing features or fixing bugs in this repository.

---

## 1. Brand Identity & Attribution (MANDATORY)
- **Platform Name**: The official name of this platform is **B12** (or *"B12 - Dijital Hafıza Vitaminin"*). It must **NEVER** be referred to as "emulist".
- **Creator / Developer**: The creator of this platform is **EMU**.
- Always strictly uphold this branding across all UI titles, descriptions, documentation, code comments, and conversational responses.

## 2. External Data Resilience & Fallbacks
- **ICS Calendar Feeds (Galatasaray Fixture)**:
  - External CORS proxies (e.g., `allorigins.win`, `corsproxy.io`) are inherently unreliable or may block requests in browser environments.
  - ALWAYS maintain a local static fallback (e.g., `/gs_fallback.ics` in the `public/` directory) at the end of the proxy chain in `galatasarayService.ts`.
  - NEVER leave external data fetches without a local fallback that guarantees 100% availability for the user interface.

## 3. API Selection & Search Logic
- **Strict Media API Search**:
  - When the user selects an API (OMDb vs TMDb), respect their choice strictly.
  - DO NOT silently fall back to another API if no results are found. Respect user preference and report "no results" accurately for the active API.

## 4. Responsive Layout & Z-Index Layering
- **Mobile Bottom Navigation (`BottomNavBar`)**:
  - `BottomNavBar` sits fixed at `bottom-0` with `z-[100]` and height ~72px on mobile devices (`md:hidden`).
  - Floating action bars (such as the bottom save bar on `CreatePage`) MUST use `z-[110]` and `bottom-24 md:bottom-6` so they float safely above `BottomNavBar` on mobile without overlapping or getting hidden underneath.
- **Search Dropdowns & Overlays**:
  - Auto-complete search result dropdowns must specify `z-50` or higher and ensure parent containers do not truncate them with `overflow-hidden`.
- **Modals**:
  - Global dialogs and modals must specify `z-[120]` and `fixed inset-0`.

## 5. Modal Design & Mobile Adaptability (MANDATORY STANDARD)
- **Unified Modal Architecture**:
  - All modal dialogs (Add/Edit forms, settings, selection sheets, detail views) MUST follow the standardized modal pattern:
    1. **Container & Backdrop**: Darkened backdrop with blur (`bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm z-[120]`).
    2. **Card Structure**: Rounded corners (`rounded-3xl` or `rounded-2xl`), responsive max-width (`w-full max-w-lg sm:max-w-xl`), subtle border and shadow.
    3. **Header**: Clean title with contextual icon, badge if needed, and prominent top-right `✕` dismiss button.
    4. **Scrollable Body**: Body content MUST be constrained (`max-h-[75vh] sm:max-h-[80vh] overflow-y-auto custom-scrollbar px-6 py-4`) so inputs never get clipped on mobile viewports or virtual keyboards.
    5. **Sticky / Fixed Action Footer**: Action buttons (Cancel, Save/Submit, Delete) MUST sit in a separate, fixed/sticky footer at the bottom of the modal (`px-6 py-3.5 bg-stone-50 dark:bg-zinc-900/80 border-t border-stone-200 dark:border-zinc-800`), NEVER scroll out of view.
  - **Confirmation Dialogs**: Always reuse `ConfirmDialog.tsx` instead of native `window.confirm()` or ad-hoc custom confirm popups.

## 6. Unified Pagination & "Load More" Standard
- **Standard `LoadMoreButton` Component**:
  - NEVER write custom or ad-hoc "Daha Fazla Gör", "Daha Fazla Yükle", or pagination buttons across any list or page.
  - ALWAYS import and use [`LoadMoreButton.tsx`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/components/ui/LoadMoreButton.tsx).
  - Supply `onClick`, `loading`, and optional `remainingCount` props.
  - Mobile containers wrapping lists with `LoadMoreButton` MUST NOT have artificial fixed heights (`max-h-[600px] overflow-y-auto`) that trap scroll or hide the button behind mobile navigation bars.

## 7. Feature Access & Admin Panel Integration
- **Strict Registration of New Pages & Modules**:
  - When creating ANY new page, feature, or tool in the system:
    1. Register the new `FeatureKey` in [`featureAccessService.ts`](file:///c:/GithubProjects/emuList-M-S-G/src/frontend/services/featureAccessService.ts).
    2. Define its default access state in `DEFAULT_ACCESS` and label/icon in `FEATURE_LABELS`.
    3. Add routing and navigation guards in `App.tsx` and ensure it appears in `MobileMenu.tsx`, `Sidebar.tsx`, and Admin Panel (`AdminPage.tsx`).
    4. Use `useFeatureAccess` hook to gate access so admins can toggle it per user.

## 8. Mobile Bottom Navigation Standards (`BottomNavBar`)
- `BottomNavBar` must always have an odd-numbered (5 items) symmetrical structure:
  1. **Ana Sayfa** (`/`)
  2. **Koleksiyon** (`/movie`)
  3. **+ Ekle** (`/create`) — Centered, matching height and vertical alignment with other icons (`w-11 h-8 rounded-xl`). Never use disproportionate/protruding offsets that break the bar's balance.
  4. **Harcamalar** (`/expenses`)
  5. **Menü** (`#`)
- PWA safe area insets (`paddingBottom: max(env(safe-area-inset-bottom), 8px)`) must be preserved.

## 9. Calendar & Planner Logic
- **Match Display**:
  - Do not aggressively purge past matches with strict `isAfter(now)` filters in calendar views. Allow users to view all matches for the currently displayed month.

## 10. Mandatory Localization (TR / EN)
- **Zero Hardcoded Strings**:
  - Whenever adding or modifying pages, components, modals, form labels, toasts, or error messages, NEVER hardcode static strings in only Turkish or only English.
  - ALWAYS register new translation keys in BOTH `src/frontend/translations/tr.ts` and `src/frontend/translations/en.ts`.
  - Use `const { t } = useLanguage();` and `t('...')` in components so switching between TR and EN immediately translates every visual element without untranslated gaps.

## 11. Git Permission Protocol (MANDATORY)
- **Strict Prohibition on Automatic Commits and Pushes**:
  - NEVER execute `git commit` or `git push` autonomously without explicit instruction or approval from the user.
  - All file edits must remain staged or in the working directory for user review. Only run git commits or pushes when the user explicitly requests it (e.g., "commit at", "pushla").

## 12. Development Verification Protocol
- Before finalizing ANY task:
  1. Verify changes against these core rules.
  2. Run `npm run build` (`tsc -b && vite build`) to guarantee zero TypeScript or build regression.

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

## 17. Canlı Barındırma ve Dağıtım Altyapısı: Cloudflare Pages (MANDATORY STANDARD)
- **Birincil Platform**: B12 platformunun resmi canlı barındırma platformu **Cloudflare Pages**'dir. (Netlify veya Vercel birincil platform değildir).
- **Sunucusuz / Edge Mimarisi**:
  - Tüm backend API ve edge fonksiyonları Cloudflare Pages Functions mimarisine (`functions/` dizini) göre yazılmalıdır.
  - Global middleware `functions/_middleware.ts` üzerinden yürütülür.
  - API uç noktaları `functions/api/...` altında konumlandırılır.
- **CDN Başlıkları ve Yönlendirmeler**:
  - Cloudflare Pages standartları olan [`public/_headers`](file:///c:/GithubProjects/emuList-M-S-G/public/_headers) ve [`public/_redirects`](file:///c:/GithubProjects/emuList-M-S-G/public/_redirects) dosyaları yetkili yapılandırma kaynaklarıdır.

## 18. Sıfır Sızıntı API & Gizli Anahtar Güvenlik Standardı (Zero-Exposure Policy)
- **İstemci Bundle'ına Gizli Anahtar Gömme Yasağı**:
  - Özel veya kotalı API anahtarları (Gemini API, CollectAPI vb.) ASLA `VITE_` öneki ile frontend koduna gömülmemelidir. Vite, `VITE_` değişkenlerini derleme sırasında `dist/` JS dosyalarına açık metin olarak gömer.
  - Sadece genel istemci kimlikleri (örneğin domain kısıtlamalı Firebase Client API Key) frontend'de bulunabilir.
- **Güvenli Backend Proxy Zorunluluğu**:
  - Gemini AI, hesap özeti analizi veya harici özel servis çağrıları doğrudan tarayıcıdan değil, Cloudflare Pages Functions (`functions/api/calorie-chat.ts`, `functions/api/gold-price.ts` vb.) üzerinden sunucu ortam değişkenleri (`context.env.GEMINI_API_KEY`) ile yürütülmelidir.
- **Git Gizlilik Kuralı**:
  - `.env`, `.env.*`, `*.key`, `*.pem`, `service-account*.json` vb. dosyalar asla Git'e eklenemez veya commit edilemez.


