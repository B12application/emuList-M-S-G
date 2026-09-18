import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export interface PageSEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
}

const DEFAULT_BASE_TITLE = 'B12 - Dijital Hafıza Vitaminin & Kişisel Yaşam Asistanı | Mustafa Ulusoy';
const DEFAULT_BASE_TITLE_EN = 'B12 - Digital Memory Vitamin & Personal Life Agent | Mustafa Ulusoy';

const DEFAULT_DESCRIPTION_TR = 'Mustafa Ulusoy tarafından geliştirilen B12; film, dizi, oyun, kitap arşivi, bütçe yönetimi, ajanda, notlar ve seyahat planlayıcı özelliklerini tek çatı altında toplayan Kişisel Yaşam Asistanı ve Dijital Hafıza Vitaminidir.';
const DEFAULT_DESCRIPTION_EN = 'B12 by Mustafa Ulusoy: An all-in-one Personal Life Agent and Digital Memory Vitamin featuring movie & series tracker, finance & budget manager, smart calendar, and encrypted notes.';

// Helper to set or create a meta tag
function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attributeName, attributeValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Custom hook to dynamically manage document title, meta descriptions, and Open Graph tags for optimal SEO ranking.
 */
export function usePageSEO(options: PageSEOOptions = {}) {
  const { language } = useLanguage();
  const { title, description, keywords, canonicalPath } = options;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const isTr = language === 'tr';
    const fallbackTitle = isTr ? DEFAULT_BASE_TITLE : DEFAULT_BASE_TITLE_EN;
    const finalTitle = title ? `${title} | B12 - Mustafa Ulusoy` : fallbackTitle;
    const finalDescription = description || (isTr ? DEFAULT_DESCRIPTION_TR : DEFAULT_DESCRIPTION_EN);

    // Update document title
    document.title = finalTitle;

    // Update Meta Description
    setMetaTag('name', 'description', finalDescription);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('name', 'twitter:description', finalDescription);

    // Update Open Graph & Twitter Titles
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('name', 'twitter:title', finalTitle);

    // Update Keywords if provided
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // Update Canonical URL
    if (canonicalPath) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      const baseUrl = 'https://b12application.pages.dev';
      const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
      canonicalLink.setAttribute('href', `${baseUrl}${cleanPath}`);
    }
  }, [title, description, keywords, canonicalPath, language]);
}

/**
 * Route-level automatic SEO title mapper for seamless indexing across all B12 views.
 */
export function useAutoRouteSEO() {
  const location = useLocation();
  const { language } = useLanguage();
  const isTr = language === 'tr';

  useEffect(() => {
    const pathname = location.pathname;

    // Map common routes to contextual, keyword-rich titles
    const routeTitles: Record<string, { tr: string; en: string }> = {
      '/': { tr: 'Ana Sayfa', en: 'Dashboard' },
      '/movie': { tr: 'Film Koleksiyonu', en: 'Movie Collection' },
      '/series': { tr: 'Dizi Koleksiyonu', en: 'Series Tracker' },
      '/game': { tr: 'Oyun Koleksiyonu', en: 'Game Library' },
      '/book': { tr: 'Kitap Arşivi', en: 'Book Archive' },
      '/all': { tr: 'Tüm Arşiv & Medya', en: 'All Media Vault' },
      '/create': { tr: 'Yeni İçerik Ekle', en: 'Add Content' },
      '/expenses': { tr: 'Harcama & Bütçe Yönetimi', en: 'Expenses & Budget' },
      '/planner': { tr: 'Ajanda & Zaman Planı', en: 'Planner & Calendar' },
      '/notes': { tr: 'Şifreli Not Defteri', en: 'Secure Notes' },
      '/travel-planner': { tr: 'Seyahat Planlayıcı', en: 'Travel Planner' },
      '/map': { tr: 'Dünya & Şehir Haritası', en: 'Travel Map' },
      '/stats': { tr: 'Yaşam İstatistikleri', en: 'Life Stats' },
      '/wrapped': { tr: 'Yıl Sonu Özeti', en: 'Year Wrapped' },
      '/lists': { tr: 'Özel Listeler', en: 'Custom Lists' },
      '/feed': { tr: 'Aktivite Akışı', en: 'Activity Feed' },
      '/settings': { tr: 'Ayarlar & Tercihler', en: 'Settings' },
      '/profile': { tr: 'Profilim', en: 'My Profile' },
      '/calorie-chat': { tr: 'AI Kalori & Beden Asistanı', en: 'AI Calorie Assistant' },
      '/calorie-details': { tr: 'Kalori & Makro Raporu', en: 'Calorie Report' },
      '/body-profile': { tr: 'Beden & Vücut Profili', en: 'Body Profile' },
      '/login': { tr: 'Giriş Yap & Asistana Bağlan', en: 'Sign In' },
      '/signup': { tr: 'Kayıt Ol', en: 'Sign Up' }
    };

    const matched = routeTitles[pathname];
    if (matched) {
      const pageName = isTr ? matched.tr : matched.en;
      document.title = `${pageName} | B12 - Mustafa Ulusoy`;
    } else {
      document.title = isTr ? DEFAULT_BASE_TITLE : DEFAULT_BASE_TITLE_EN;
    }
  }, [location.pathname, language, isTr]);
}
