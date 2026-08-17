import type { PlannerMeeting } from '../../backend/types/planner';
import { format, isAfter, subHours } from 'date-fns';

// Kullanıcının sağladığı Google Takvim ICS bağlantısı
const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/frrhag59gbjmt7q7ug0rl7m7kc%40group.calendar.google.com/public/basic.ics';

const PROXY_URLS = [
  `https://api.allorigins.win/get?url=${encodeURIComponent(CALENDAR_URL)}`,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(CALENDAR_URL)}`,
  `https://corsproxy.io/?${encodeURIComponent(CALENDAR_URL)}`,
  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(CALENDAR_URL)}`,
  `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(CALENDAR_URL)}`,
  CALENDAR_URL, // Doğrudan deneme
  '/gs_fallback.ics' // Yerel yedek ICS dosyası (Harici proxy'ler başarısız olursa her zaman çalışır)
];

// Helper to fetch with a timeout using AbortController
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchIcsData(): Promise<string | null> {
  for (const proxyUrl of PROXY_URLS) {
    try {
      const response = await fetchWithTimeout(proxyUrl, { cache: 'no-store' }, 2500);
      if (!response.ok) continue;
      
      let text = '';
      const contentType = response.headers.get('content-type');
      
      if (proxyUrl.includes('/get?url=') && contentType && contentType.includes('application/json')) {
        const json = await response.json();
        if (json && json.contents) {
          text = json.contents;
        }
      } else {
        text = await response.text();
      }

      // İçerik geçerli ICS metni mi?
      if (text && (text.includes('BEGIN:VCALENDAR') || text.includes('BEGIN:VEVENT'))) {
        return text;
      }
    } catch {
      // Bir sonraki proxy'yi dene
    }
  }
  return null;
}

export const getUpcomingGSMatches = async (forceRefresh = false): Promise<PlannerMeeting[]> => {
  const CACHE_KEY = 'gs_matches_cache';
  const CACHE_TIME_KEY = 'gs_matches_cache_time';
  const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  // 1. Try reading from cache unless forceRefresh is triggered
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL) {
          return JSON.parse(cached);
        }
      }
    } catch (e) {
      console.warn("Error reading GS matches cache:", e);
    }
  }

  try {
    const icsData = await fetchIcsData();
    if (!icsData) {
      console.warn("Galatasaray ICS fetch returned no valid data from any proxy.");
      // Fallback to cache even if stale on error
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
      return [];
    }

    // ICS dosyasında uzun satırlar alt satıra girintili devam eder (line folding). Önce bunları birleştirelim.
    const unfoldedIcs = icsData.replace(/\r?\n[ \t]/g, '');

    const events = unfoldedIcs.split('BEGIN:VEVENT');
    // İlk parça yapısal header bilgileridir, siliyoruz
    events.shift();

    const matches: PlannerMeeting[] = [];
    const now = subHours(new Date(), 2); // Devam eden maçları da kapsamak için şu anki saatten 2 saat öncekileri baz alıyoruz.

    events.forEach(event => {
      // Özet (SUMMARY) ve Başlangıç Zamanı (DTSTART) verilerini yakala
      const summaryMatch = event.match(/SUMMARY:([^\r\n]*)/);
      const startMatch = event.match(/DTSTART(?:;[^:]+)?:(\d{8}T\d{6}Z?|\d{8})/);
      
      if (summaryMatch && startMatch) {
        const rawSummary = summaryMatch[1].trim();
        const dateStr = startMatch[1]; // Örn: 20260515T190000Z veya 20260515
        
        // Turnuva / Lig Tipini Tespit Et
        let matchType = 'Trendyol Süper Lig ⚽';
        let category = 'Süper Lig';

        if (rawSummary.includes('[CL]') || rawSummary.toLowerCase().includes('champions league')) {
          matchType = 'UEFA Şampiyonlar Ligi 🏆';
          category = 'Şampiyonlar Ligi';
        } else if (rawSummary.includes('[UEL]') || rawSummary.toLowerCase().includes('europa league')) {
          matchType = 'UEFA Avrupa Ligi 🏆';
          category = 'Avrupa Ligi';
        } else if (rawSummary.includes('[UECL]') || rawSummary.toLowerCase().includes('conference league')) {
          matchType = 'UEFA Konferans Ligi 🏆';
          category = 'Konferans Ligi';
        } else if (rawSummary.includes('[TC]')) {
          matchType = 'Ziraat Türkiye Kupası 🏆';
          category = 'Türkiye Kupası';
        } else if (rawSummary.includes('[SK]')) {
          matchType = 'Turkcell Süper Kupa 🏆';
          category = 'Süper Kupa';
        } else if (
          rawSummary.includes('Stade Rennais') ||
          rawSummary.includes('Venezia') ||
          rawSummary.includes('Villarreal') ||
          rawSummary.includes('LASK') ||
          rawSummary.includes('Parma') ||
          rawSummary.includes('Düsseldorf') ||
          rawSummary.toLowerCase().includes('friendly') ||
          rawSummary.toLowerCase().includes('hazırlık')
        ) {
          matchType = 'Hazırlık Maçı 🤝';
          category = 'Hazırlık Maçı';
        }

        // Başlık Temizliği
        let title = rawSummary;
        title = title.replace(/\\,/g, ',').replace(/\\;/g, ';');
        // Lig vb. parantezlerini sil (Örn: Galatasaray - Giresunspor [TC] -> Galatasaray - Giresunspor)
        title = title.replace(/\s*\[.*?\]\s*/g, '');
        // Skor varsa sil (Örn: (1-5) veya (0-1))
        title = title.replace(/\s*\(\d+-\d+\)\s*/g, '');
        title = title.trim();

        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1; // JS'de aylar 0'dan başlar
        const day = parseInt(dateStr.substring(6, 8));
        
        let hours = 19; // Tam gün etkinlikler için varsayılan saat
        let minutes = 0;
        
        if (dateStr.includes('T')) {
          hours = parseInt(dateStr.substring(9, 11));
          minutes = parseInt(dateStr.substring(11, 13));
        }

        let matchDate: Date;
        if (dateStr.endsWith('Z')) {
          matchDate = new Date(Date.UTC(year, month, day, hours, minutes));
        } else {
          matchDate = new Date(year, month, day, hours, minutes);
        }

        // Maçı listeye ekle (Sezon takvimindeki tüm maçlar takvimde görüntülenebilsin)
        matches.push({
          id: `gs-match-${matchDate.getTime()}-${matches.length}`,
          userId: 'gs-system',
          title: title,
          date: format(matchDate, 'yyyy-MM-dd'),
          startTime: format(matchDate, 'HH:mm'),
          itemType: 'match',
          category: category,
          description: matchType,
          externalLink: 'https://calendar.google.com/calendar/u/0/embed?src=frrhag59gbjmt7q7ug0rl7m7kc@group.calendar.google.com',
        });
      }
    });

    // Maçları tarihe göre en yakından uzağa doğru sıralayalım
    matches.sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

    // 2. Cache the successfully parsed results
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(matches));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Failed to write GS matches to cache:", e);
    }

    return matches;

  } catch (error) {
    console.error("Error parsing Google Calendar GS matches", error);
    // Fallback to cache on general failure
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  }
};
