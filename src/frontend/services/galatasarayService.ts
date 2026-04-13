import type { PlannerMeeting } from '../../backend/types/planner';
import { format, isAfter, subHours } from 'date-fns';

// Kullanıcının sağladığı Google Takvim ICS bağlantısı
const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/frrhag59gbjmt7q7ug0rl7m7kc%40group.calendar.google.com/public/basic.ics';

// İstemci (tarayıcı) tarafında CORS hatası almamak için ücretsiz bir köprü (proxy) servisi kullanıyoruz.
const PROXY_URL = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(CALENDAR_URL)}`;

export const getUpcomingGSMatches = async (): Promise<PlannerMeeting[]> => {
  try {
    const response = await fetch(PROXY_URL);
    if (!response.ok) throw new Error("ICS fetch failed");
    
    const icsData = await response.text();

    const events = icsData.split('BEGIN:VEVENT');
    // İlk parça yapısal header bilgileridir, siliyoruz
    events.shift();

    const matches: PlannerMeeting[] = [];
    const now = subHours(new Date(), 2); // Devam eden maçları da kapsamak için şu anki saatten 2 saat öncekileri baz alıyoruz.

    events.forEach(event => {
      // Özet (SUMMARY) ve Başlangıç Zamanı (DTSTART) verilerini yakala
      const summaryMatch = event.match(/SUMMARY:([^\r\n]*)/);
      const startMatch = event.match(/DTSTART(?:;[^:]+)?:(\d{8}T\d{6}Z?)/);
      
      if (summaryMatch && startMatch) {
        let title = summaryMatch[1].trim();
        const dateStr = startMatch[1]; // Örn: 20260515T190000Z
        
        // Gereksiz karakterleri temizle (bazen summary önüne boşluk vs gelebiliyor)
        title = title.replace(/\\,/g, ',').replace(/\\;/g, ';');
        
        // Lig vb. parantezlerini sil (Örn: Galatasaray - Giresunspor [TC] -> Galatasaray - Giresunspor)
        title = title.replace(/\s*\[.*?\]\s*/g, '');
        // Skor varsa sil (Örn: (1-5) veya (0-1))
        title = title.replace(/\s*\(\d+-\d+\)\s*/g, '');
        title = title.trim();


        // YYYYMMDDTHHMMSSZ -> JS Date Çevrimi
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1; // JS'de aylar 0'dan başlar
        const day = parseInt(dateStr.substring(6, 8));
        const hours = parseInt(dateStr.substring(9, 11));
        const minutes = parseInt(dateStr.substring(11, 13));
        
        let matchDate: Date;
        // Eğer UTC olduğunu belirten Z harfi varsa zaman dilimini ayarlayalım:
        if (dateStr.endsWith('Z')) {
           matchDate = new Date(Date.UTC(year, month, day, hours, minutes));
        } else {
           // Local Time
           matchDate = new Date(year, month, day, hours, minutes);
        }

        // Sadece günümüzden sonra oynanacak / oynanmakta olan maçları al:
        if (isAfter(matchDate, now)) {
          matches.push({
            id: `gs-match-${matchDate.getTime()}`,
            userId: 'gs-system',
            title: title,
            date: format(matchDate, 'yyyy-MM-dd'),
            startTime: format(matchDate, 'HH:mm'),
            itemType: 'match',
            description: 'Google Takvim Senkronizasyonu',
            externalLink: 'https://calendar.google.com/calendar/u/0/embed?src=frrhag59gbjmt7q7ug0rl7m7kc@group.calendar.google.com',
          });
        }
      }
    });

    // Maçları tarihe göre en yakından uzağa doğru sıralayalım
    matches.sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

    // Fikstür kalabalıklığı olmaması için sadece en yakın 10 maçı döndürelim
    return matches.slice(0, 10);

  } catch (error) {
    console.error("Error parsing Google Calendar GS matches", error);
    return [];
  }
};
