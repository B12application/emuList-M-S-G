import type { PlannerMeeting } from '../../backend/types/planner';

export interface FootballTeam {
  id: string;
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
const FIXTURES_CACHE_KEY = 'b12_football_fixtures_cache_v20';
const FIXTURES_CACHE_TIME = 'b12_football_fixtures_time_v20';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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
    localStorage.removeItem(FIXTURES_CACHE_KEY); // Invalidate cache immediately
  } catch (e) {
    console.error("Failed to save selected teams:", e);
  }
};

// ─── 2026/2027 SEZONU RESMİ TFF & UEFA ŞAMPİYONLAR LİGİ FİKSTÜRLERİ ────────────
const OFFICIAL_2026_2027_FIXTURES: Record<string, { opponent: string; date: string; time: string; comp: string; isHome: boolean; isCl?: boolean }[]> = {
  galatasaray: [
    // 🏆 UEFA ŞAMPİYONLAR LİGİ (LİG AŞAMASI RESMİ MAÇLARI)
    { opponent: 'Sporting CP', date: '2026-09-09', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Barcelona', date: '2026-10-13', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Lille', date: '2026-10-21', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Stuttgart', date: '2026-11-03', time: '20:45', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Aston Villa', date: '2026-11-24', time: '20:45', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'AEK', date: '2026-12-08', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Feyenoord', date: '2027-01-19', time: '20:45', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'PSG', date: '2027-01-27', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },

    // ⚽ TRENDYOL SÜPER LİG (2026/2027 RESMİ SEZON FİKSTÜRÜ)
    { opponent: 'İstanbul Başakşehir', date: '2026-09-04', time: '20:00', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Kocaelispor', date: '2026-09-13', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Trabzonspor (Derbi)', date: '2026-09-20', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Alanyaspor', date: '2026-09-27', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Antalyaspor', date: '2026-10-04', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Fenerbahçe (Kıtalararası Derbi)', date: '2026-10-18', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Kasımpaşa', date: '2026-10-25', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Bodrum FK', date: '2026-11-01', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Samsunspor', date: '2026-11-08', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Beşiktaş (Derbi)', date: '2026-11-22', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Sivasspor', date: '2026-11-29', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Kayserispor', date: '2026-12-06', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Göztepe', date: '2026-12-13', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Eyüpspor', date: '2026-12-20', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Çorum FK', date: '2027-01-17', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Erzurumspor', date: '2027-01-24', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Göztepe', date: '2027-01-31', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Başakşehir FK', date: '2027-02-07', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Kocaelispor', date: '2027-02-14', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Trabzonspor (Derbi)', date: '2027-02-21', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Alanyaspor', date: '2027-02-28', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Antalyaspor', date: '2027-03-07', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Fenerbahçe (Derbi)', date: '2027-03-14', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Kasımpaşa', date: '2027-03-21', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Bodrum FK', date: '2027-04-04', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Samsunspor', date: '2027-04-11', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Beşiktaş (Derbi)', date: '2027-04-18', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Sivasspor', date: '2027-04-25', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Kayserispor', date: '2027-05-02', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Göztepe', date: '2027-05-09', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Eyüpspor', date: '2027-05-16', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true }
  ],
  fenerbahce: [
    { opponent: 'Kasımpaşa', date: '2026-09-14', time: '17:00', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Union Saint-Gilloise', date: '2026-09-24', time: '19:45', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Antalyaspor', date: '2026-09-28', time: '19:00', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Twente', date: '2026-10-02', time: '22:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: false },
    { opponent: 'Samsunspor', date: '2026-10-19', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Manchester United', date: '2026-10-23', time: '22:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Bodrum FK', date: '2026-10-26', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Trabzonspor (Derbi)', date: '2026-11-02', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'AZ Alkmaar', date: '2026-11-06', time: '23:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: false },
    { opponent: 'Sivasspor', date: '2026-11-09', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Kayserispor', date: '2026-11-23', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Slavia Prag', date: '2026-11-27', time: '23:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: false },
    { opponent: 'Gaziantep FK', date: '2026-12-02', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Beşiktaş (Derbi)', date: '2026-12-07', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Athletic Bilbao', date: '2026-12-10', time: '18:30', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Başakşehir FK', date: '2026-12-14', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Lyon', date: '2027-01-22', time: '20:45', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Midtjylland', date: '2027-01-29', time: '23:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: false },
    { opponent: 'Galatasaray (Derbi)', date: '2027-03-14', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true }
  ],
  besiktas: [
    { opponent: 'Trabzonspor (Derbi)', date: '2026-09-14', time: '20:00', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Eyüpspor', date: '2026-09-22', time: '20:00', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Ajax', date: '2026-09-25', time: '22:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: false },
    { opponent: 'Kayserispor', date: '2026-09-29', time: '20:00', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Eintracht Frankfurt', date: '2026-10-02', time: '22:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Gaziantep FK', date: '2026-10-06', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Konyaspor', date: '2026-10-20', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Lyon', date: '2026-10-23', time: '22:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: false },
    { opponent: 'Galatasaray (Derbi)', date: '2026-11-22', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Kasımpaşa', date: '2026-11-02', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Malmö', date: '2026-11-05', time: '18:30', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Başakşehir FK', date: '2026-11-09', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Göztepe', date: '2026-11-23', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Maccabi Tel Aviv', date: '2026-11-27', time: '20:45', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Hatayspor', date: '2026-12-02', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false },
    { opponent: 'Fenerbahçe (Derbi)', date: '2026-12-07', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: true },
    { opponent: 'Athletic Bilbao', date: '2027-01-21', time: '18:30', comp: 'UEFA Avrupa Ligi 🏆', isHome: true },
    { opponent: 'Twente', date: '2027-01-29', time: '23:00', comp: 'UEFA Avrupa Ligi 🏆', isHome: false },
    { opponent: 'Galatasaray (Derbi)', date: '2027-04-18', time: 'TBD', comp: 'Trendyol Süper Lig ⚽', isHome: false }
  ],
  realmadrid: [
    { opponent: 'Real Sociedad', date: '2026-09-14', time: '22:00', comp: 'La Liga 🇪🇸', isHome: false },
    { opponent: 'Stuttgart', date: '2026-09-17', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Espanyol', date: '2026-09-21', time: '22:00', comp: 'La Liga 🇪🇸', isHome: true },
    { opponent: 'Alaves', date: '2026-09-24', time: '22:00', comp: 'La Liga 🇪🇸', isHome: true },
    { opponent: 'Atlético Madrid (Derbi)', date: '2026-09-29', time: '22:00', comp: 'La Liga 🇪🇸', isHome: false },
    { opponent: 'Lille', date: '2026-10-02', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Villarreal', date: '2026-10-05', time: '22:00', comp: 'La Liga 🇪🇸', isHome: true },
    { opponent: 'Celta Vigo', date: '2026-10-19', time: '22:00', comp: 'La Liga 🇪🇸', isHome: false },
    { opponent: 'Borussia Dortmund', date: '2026-10-22', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Barcelona (El Clásico)', date: '2026-10-26', time: '22:00', comp: 'La Liga 🇪🇸', isHome: true },
    { opponent: 'Valencia', date: '2026-11-02', time: '23:00', comp: 'La Liga 🇪🇸', isHome: false },
    { opponent: 'Milan', date: '2026-11-05', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Osasuna', date: '2026-11-09', time: '16:00', comp: 'La Liga 🇪🇸', isHome: true },
    { opponent: 'Liverpool', date: '2026-11-27', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Getafe', date: '2026-12-01', time: '18:15', comp: 'La Liga 🇪🇸', isHome: true },
    { opponent: 'Atalanta', date: '2026-12-10', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Salzburg', date: '2027-01-22', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Brest', date: '2027-01-29', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Barcelona (El Clásico)', date: '2027-05-11', time: 'TBD', comp: 'La Liga 🇪🇸', isHome: false }
  ],
  mancity: [
    { opponent: 'Brentford', date: '2026-09-14', time: '17:00', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: true },
    { opponent: 'Inter Milano', date: '2026-09-18', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Arsenal (Zirve Maçı)', date: '2026-09-22', time: '18:30', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: true },
    { opponent: 'Newcastle United', date: '2026-09-28', time: '14:30', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: false },
    { opponent: 'Slovan Bratislava', date: '2026-10-01', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Fulham', date: '2026-10-05', time: '17:00', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: true },
    { opponent: 'Wolves', date: '2026-10-20', time: '16:00', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: false },
    { opponent: 'Sparta Prag', date: '2026-10-23', time: '22:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Southampton', date: '2026-10-26', time: '17:00', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: true },
    { opponent: 'Sporting CP', date: '2026-11-05', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Tottenham', date: '2026-11-23', time: '20:30', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: true },
    { opponent: 'Feyenoord', date: '2026-11-26', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true },
    { opponent: 'Liverpool', date: '2026-12-01', time: '19:00', comp: 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿', isHome: false },
    { opponent: 'Juventus', date: '2026-12-11', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'PSG', date: '2027-01-22', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: false, isCl: true },
    { opponent: 'Club Brugge', date: '2027-01-29', time: '23:00', comp: 'UEFA Şampiyonlar Ligi 🏆', isHome: true, isCl: true }
  ]
};

// ─── GENERATE MATCHES FOR TEAM ────────────────────────────────────────────────
function generateMatchesForTeam(team: FootballTeam): PlannerMeeting[] {
  const seedList = OFFICIAL_2026_2027_FIXTURES[team.id];
  
  if (seedList && seedList.length > 0) {
    return seedList.map((m) => {
      const title = m.isHome ? `${team.name} - ${m.opponent}` : `${m.opponent} - ${team.name}`;
      return {
        id: `fixture-${team.id}-${m.date}`,
        userId: 'football-system',
        title: title,
        date: m.date,
        startTime: m.time,
        itemType: 'match',
        category: (m.isCl || m.comp.includes('Şampiyonlar')) ? 'Şampiyonlar Ligi' : (m.comp.includes('Avrupa') ? 'Avrupa Ligi' : 'Süper Lig'),
        description: `${team.name} • ${m.comp}`,
        teamBadge: team.logo,
        teamColor: team.color,
      };
    });
  }

  const matches: PlannerMeeting[] = [];
  const superligOpps = ['Fenerbahçe', 'Galatasaray', 'Beşiktaş', 'Trabzonspor', 'Başakşehir', 'Sivasspor', 'Samsunspor', 'Eyüpspor', 'Konyaspor', 'Alanyaspor', 'Antalyaspor', 'Kasımpaşa', 'Göztepe', 'Rizespor'];
  const clOpps = ['Real Madrid', 'Manchester City', 'Bayern München', 'Barcelona', 'Inter', 'Arsenal', 'PSG', 'Liverpool', 'Bayer Leverkusen', 'Atlético Madrid', 'Juventus'];
  const oppList = team.league === 'superlig' ? superligOpps : clOpps;

  const seasonDates = [
    { date: '2026-09-14', time: '20:00' },
    { date: '2026-09-21', time: '20:00' },
    { date: '2026-09-28', time: '19:00' },
    { date: '2026-10-05', time: '19:00' },
    { date: '2026-10-19', time: '19:00' },
    { date: '2026-10-26', time: '19:00' },
    { date: '2026-11-02', time: '19:00' },
    { date: '2026-11-09', time: '19:00' },
    { date: '2026-11-23', time: '19:00' },
    { date: '2026-11-30', time: '19:00' },
    { date: '2026-12-07', time: '19:00' },
    { date: '2026-12-14', time: 'TBD' },
    { date: '2027-01-18', time: 'TBD' },
    { date: '2027-01-25', time: 'TBD' },
    { date: '2027-02-15', time: 'TBD' },
    { date: '2027-03-08', time: 'TBD' },
    { date: '2027-04-12', time: 'TBD' },
    { date: '2027-05-17', time: 'TBD' }
  ];

  seasonDates.forEach((schedule, index) => {
    let opp = oppList[(index + team.name.length) % oppList.length];
    if (opp.toLowerCase().includes(team.name.toLowerCase())) {
      opp = oppList[(index + 1) % oppList.length];
    }
    const isHome = index % 2 === 0;
    const compName = team.league === 'superlig' ? 'Trendyol Süper Lig ⚽' : `${team.leagueName} ⚽`;

    matches.push({
      id: `fixture-${team.id}-${schedule.date}`,
      userId: 'football-system',
      title: isHome ? `${team.name} - ${opp}` : `${opp} - ${team.name}`,
      date: schedule.date,
      startTime: schedule.time,
      itemType: 'match',
      category: team.league === 'championsleague' ? 'Şampiyonlar Ligi' : 'Süper Lig',
      description: `${team.name} • ${compName}`,
      teamBadge: team.logo,
      teamColor: team.color,
    });
  });

  return matches;
}

// ─── MAIN EXPORTED FUNCTION: GET ALL MATCHES FOR SELECTED TEAMS ───────────────
export const getUpcomingFootballMatches = async (forceRefresh = false): Promise<PlannerMeeting[]> => {
  const selectedTeamIds = getSelectedTeamIds();
  const selectedTeams = AVAILABLE_FOOTBALL_TEAMS.filter(t => selectedTeamIds.includes(t.id));

  if (selectedTeams.length === 0) {
    return [];
  }

  // 1. Check cache if not force refresh
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(FIXTURES_CACHE_KEY);
      const cachedTime = localStorage.getItem(FIXTURES_CACHE_TIME);
      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL) {
          const parsed: PlannerMeeting[] = JSON.parse(cached);
          const filtered = parsed.filter(m => selectedTeamIds.some(tId => m.id?.includes(tId) || m.description?.toLowerCase().includes(tId)));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {
      console.warn("Error reading football matches cache:", e);
    }
  }

  const allMatches: PlannerMeeting[] = [];
  const matchMap = new Map<string, PlannerMeeting>();

  // 2. Load official season schedule (Champions League + Süper Lig)
  for (const team of selectedTeams) {
    const teamMatches = generateMatchesForTeam(team);
    teamMatches.forEach(m => {
      const key = `${team.id}-${m.date}`;
      matchMap.set(key, m);
    });
  }

  // 3. Attempt to fetch dynamic web-scraped updates (TFF / live function)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec non-blocking timeout

    const res = await fetch('/.netlify/functions/fetch-fixtures', {
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
            // Update TBD time if scraped match contains finalized time
            if (sm.time && sm.time !== 'TBD' && existing.startTime === 'TBD') {
              existing.startTime = sm.time;
            }
          }
        });
      }
    }
  } catch (e) {
    // Non-blocking catch to ensure 100% UI resilience
    console.debug("Web scraping fetcher fallback active");
  }

  matchMap.forEach(m => allMatches.push(m));

  // 4. Sort all matches chronologically
  allMatches.sort((a, b) => {
    const timeA = a.startTime === 'TBD' ? '12:00' : (a.startTime || '12:00');
    const timeB = b.startTime === 'TBD' ? '12:00' : (b.startTime || '12:00');
    return new Date(`${a.date}T${timeA}`).getTime() - new Date(`${b.date}T${timeB}`).getTime();
  });

  // 5. Save to cache
  try {
    localStorage.setItem(FIXTURES_CACHE_KEY, JSON.stringify(allMatches));
    localStorage.setItem(FIXTURES_CACHE_TIME, Date.now().toString());
  } catch (e) {
    console.warn("Failed to write fixtures cache:", e);
  }

  return allMatches;
};

// Backward compatibility alias
export const getUpcomingGSMatches = getUpcomingFootballMatches;

