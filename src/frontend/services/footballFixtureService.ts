// src/frontend/services/footballFixtureService.ts
// B12 Kişisel Yaşam Asistanı - Resmi Fikstür ve Canlı Maç Servisi
import type { PlannerMeeting } from '../../backend/types/planner';

export interface FootballTeam {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  league: 'superlig' | 'championsleague' | 'europe';
  leagueName: string;
  logo: string;
  color: string;
  accentColor: string;
  defaultSelected?: boolean;
}

export const AVAILABLE_FOOTBALL_TEAMS: FootballTeam[] = [
  // ─── TÜRKİYE SÜPER LİG ──────────────────────────────────────────────────────────
  {
    id: 'galatasaray',
    slug: 'galatasaray',
    name: 'Galatasaray',
    shortName: 'GS',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Galatasaray_Sports_Club_Logo.png',
    color: '#A90432',
    accentColor: '#FDB912',
    defaultSelected: true
  },
  {
    id: 'fenerbahce',
    slug: 'fenerbahce',
    name: 'Fenerbahçe',
    shortName: 'FB',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/tr/8/86/Fenerbah%C3%A7e_SK.png',
    color: '#002D72',
    accentColor: '#FFED00'
  },
  {
    id: 'besiktas',
    slug: 'besiktas',
    name: 'Beşiktaş',
    shortName: 'BJK',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Be%C5%9Fikta%C5%9F_JK.png',
    color: '#111111',
    accentColor: '#E11D48'
  },
  {
    id: 'trabzonspor',
    slug: 'trabzonspor',
    name: 'Trabzonspor',
    shortName: 'TS',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/tr/a/ab/Trabzonspor_Amblemi.png',
    color: '#67001F',
    accentColor: '#38BDF8'
  },
  {
    id: 'basaksehir',
    slug: 'istanbul-basaksehir-fk',
    name: 'Başakşehir FK',
    shortName: 'IBFK',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/tr/c/cd/%C4%B0stanbul_Ba%C5%9Fak%C5%9Fehir_FK.png',
    color: '#EA580C',
    accentColor: '#0284C7'
  },
  {
    id: 'samsunspor',
    slug: 'samsunspor',
    name: 'Samsunspor',
    shortName: 'SAM',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/tr/e/eb/Samsunspor_logosu.png',
    color: '#DC2626',
    accentColor: '#FFFFFF'
  },
  {
    id: 'eyupspor',
    slug: 'eyupspor',
    name: 'Eyüpspor',
    shortName: 'EYP',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/tr/c/cf/Ey%C3%BCpspor_Logo.png',
    color: '#9333EA',
    accentColor: '#FACC15'
  },
  {
    id: 'sivasspor',
    slug: 'sivasspor',
    name: 'Sivasspor',
    shortName: 'SIV',
    league: 'superlig',
    leagueName: 'Trendyol Süper Lig',
    logo: 'https://upload.wikimedia.org/wikipedia/tr/5/50/Sivasspor.png',
    color: '#E11D48',
    accentColor: '#FFFFFF'
  },

  // ─── UEFA ŞAMPİYONLAR LİGİ & AVRUPA DEVLERİ ───────────────────────────────────
  {
    id: 'realmadrid',
    slug: 'real-madrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    color: '#111827',
    accentColor: '#FEBE10'
  },
  {
    id: 'mancity',
    slug: 'manchester-city',
    name: 'Manchester City',
    shortName: 'MCI',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    color: '#6CABDD',
    accentColor: '#1C2C5B'
  },
  {
    id: 'arsenal',
    slug: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    color: '#EF0107',
    accentColor: '#063672'
  },
  {
    id: 'barcelona',
    slug: 'fc-barcelona',
    name: 'FC Barcelona',
    shortName: 'FCB',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    color: '#A50044',
    accentColor: '#004D98'
  },
  {
    id: 'bayern',
    slug: 'bayern-munchen',
    name: 'Bayern München',
    shortName: 'BAY',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    color: '#DC052D',
    accentColor: '#0066B2'
  },
  {
    id: 'inter',
    slug: 'inter',
    name: 'Inter Milano',
    shortName: 'INT',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    color: '#010E80',
    accentColor: '#005CA9'
  },
  {
    id: 'liverpool',
    slug: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    color: '#C8102E',
    accentColor: '#00B2A9'
  },
  {
    id: 'psg',
    slug: 'paris-saint-germain',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    color: '#004170',
    accentColor: '#DA291C'
  },
  {
    id: 'bayerleverkusen',
    slug: 'bayer-leverkusen',
    name: 'Bayer Leverkusen',
    shortName: 'B04',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/de/f/f7/Bayer_Leverkusen_Logo.svg',
    color: '#E32221',
    accentColor: '#000000'
  },
  {
    id: 'atleticomadrid',
    slug: 'atletico-madrid',
    name: 'Atlético Madrid',
    shortName: 'ATM',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    color: '#CB3524',
    accentColor: '#272E61'
  },
  {
    id: 'juventus',
    slug: 'juventus',
    name: 'Juventus',
    shortName: 'JUV',
    league: 'championsleague',
    leagueName: 'UEFA Şampiyonlar Ligi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Juventus_FC_2017_logo.svg',
    color: '#000000',
    accentColor: '#FFFFFF'
  }
];

const STORAGE_KEY_SELECTED_TEAMS = 'b12_selected_football_teams_v6';
const FIXTURES_CACHE_KEY = 'b12_football_fixtures_cache_v21';
const FIXTURES_CACHE_TIME = 'b12_football_fixtures_time_v21';
const CACHE_TTL = 30 * 60 * 1000; // 30 dakika

export const getSelectedTeamIds = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SELECTED_TEAMS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to read selected teams:", e);
  }
  return ['galatasaray'];
};

export const saveSelectedTeamIds = (teamIds: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED_TEAMS, JSON.stringify(teamIds));
    localStorage.removeItem(FIXTURES_CACHE_KEY); // Cache'i anında geçersiz kıl
  } catch (e) {
    console.error("Failed to save selected teams:", e);
  }
};

/**
 * public/data/fixtures.json dosyasından resmi fikstür veri bankasını okur.
 */
async function loadLocalFixturesDatabase(): Promise<Record<string, PlannerMeeting[]>> {
  try {
    const res = await fetch('/data/fixtures.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.fixtures) {
        return data.fixtures;
      }
    }
  } catch (e) {
    console.warn("[Fixtures] Failed to load local fixtures database:", e);
  }
  return {};
}

/**
 * Seçili takımların tüm resmi lig, kupa ve Avrupa maçlarını getirir.
 * 1. Adım: LocalStorage önbelleği (anında açılış)
 * 2. Adım: /data/fixtures.json yerel veri tabanı (19 takımın 2026/2027 resmi fikstürü)
 * 3. Adım: Netlify / Proxy canlı fonksiyonu (saat güncellemeleri)
 */
export const getUpcomingFootballMatches = async (forceRefresh = false): Promise<PlannerMeeting[]> => {
  const selectedTeamIds = getSelectedTeamIds();
  const selectedTeams = AVAILABLE_FOOTBALL_TEAMS.filter(t => selectedTeamIds.includes(t.id));

  if (selectedTeams.length === 0) {
    return [];
  }

  // 1. Önbellek kontrolü
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(FIXTURES_CACHE_KEY);
      const cachedTime = localStorage.getItem(FIXTURES_CACHE_TIME);
      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL) {
          const parsed: PlannerMeeting[] = JSON.parse(cached);
          const filtered = parsed.filter(m => 
            selectedTeamIds.some(tId => (m as any).teamId === tId || m.id?.includes(tId) || m.description?.toLowerCase().includes(tId))
          );
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {
      console.warn("[Fixtures] Cache read warning:", e);
    }
  }

  const matchMap = new Map<string, PlannerMeeting>();

  // 2. Yerel Kapsamlı Veri Tabanını Yükle (/data/fixtures.json)
  const localDb = await loadLocalFixturesDatabase();
  for (const teamId of selectedTeamIds) {
    const teamMatches = localDb[teamId];
    if (Array.isArray(teamMatches)) {
      teamMatches.forEach(m => {
        const key = `${teamId}-${m.date}`;
        matchMap.set(key, m);
      });
    }
  }

  // 3. Canlı Netlify / Proxy Servisinden Saat Güncellemelerini Al (Non-blocking, 3.5s timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`/.netlify/functions/fetch-fixtures?teams=${selectedTeamIds.join(',')}`, {
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.scrapedMatches)) {
        data.scrapedMatches.forEach((sm: any) => {
          const key = `${sm.teamId}-${sm.date}`;
          if (matchMap.has(key)) {
            const existing = matchMap.get(key)!;
            // Saat kesinleştiyse güncelle (örn: TBD -> 21:00)
            if (sm.time && sm.time !== 'TBD') {
              existing.startTime = sm.time;
            }
          } else {
            // Yeni eklenmiş maç varsa listeye ekle
            const team = AVAILABLE_FOOTBALL_TEAMS.find(t => t.id === sm.teamId);
            if (team) {
              matchMap.set(key, {
                id: `match-${sm.teamId}-${sm.date}`,
                teamId: sm.teamId,
                userId: 'football-system',
                title: sm.title || sm.opponent,
                date: sm.date,
                startTime: sm.time || 'TBD',
                itemType: 'match',
                category: sm.category || 'Süper Lig',
                description: `${team.name} • ${sm.comp || team.leagueName}`,
                teamBadge: team.logo,
                teamColor: team.color,
              } as PlannerMeeting);
            }
          }
        });
      }
    }
  } catch {
    // Non-blocking, yerel veriler 100% korur
  }

  const allMatches: PlannerMeeting[] = Array.from(matchMap.values());

  // 4. Kronolojik Sıralama
  allMatches.sort((a, b) => {
    const timeA = a.startTime === 'TBD' ? '12:00' : (a.startTime || '12:00');
    const timeB = b.startTime === 'TBD' ? '12:00' : (b.startTime || '12:00');
    return new Date(`${a.date}T${timeA}`).getTime() - new Date(`${b.date}T${timeB}`).getTime();
  });

  // 5. Önbelleğe Kaydet
  try {
    localStorage.setItem(FIXTURES_CACHE_KEY, JSON.stringify(allMatches));
    localStorage.setItem(FIXTURES_CACHE_TIME, Date.now().toString());
  } catch (e) {
    console.warn("[Fixtures] Cache write warning:", e);
  }

  return allMatches;
};

// Geriye dönük uyumluluk takma adı
export const getUpcomingGSMatches = getUpcomingFootballMatches;
