/**
 * scripts/sync-football-fixtures.cjs
 * B12 Kişisel Yaşam Asistanı - Otomatik Futbol Fikstür Senkronizasyon Job'u
 * 
 * Tüm Süper Lig ve Şampiyonlar Ligi / Avrupa devlerinin resmi fikstürlerini 
 * fixtur.es v2 ICS servisinden çeker, UTC -> Türkiye (UTC+3) saat dönüşümünü yapar,
 * temizler ve public/data/fixtures.json dosyasına kaydeder.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 18 Takımın Tanımları ve Doğrulanmış ICS Slug'ları
const TEAMS = [
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

function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHttps(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => {
      console.warn(`[Sync] Request error for ${url}:`, err.message);
      resolve(null);
    });
  });
}

function parseIcsToMeetings(team, icsContent) {
  if (!icsContent) return [];
  const unfolded = icsContent.replace(/\r?\n[ \t]/g, '');
  const events = unfolded.split('BEGIN:VEVENT').slice(1);
  const meetings = [];

  for (const ev of events) {
    const startMatch = ev.match(/DTSTART(?:;[^:]+)?:(\d{8}(?:T\d{6}Z?)?)/);
    const summaryMatch = ev.match(/SUMMARY:([^\r\n]+)/);
    if (!startMatch || !summaryMatch) continue;

    const dt = startMatch[1];
    const rawSummary = summaryMatch[1].trim();

    // 2026/2027 sezonu maçlarını filtrele (2026-08-01 ile 2027-07-01 arası)
    if (dt < '20260801' || dt > '20270701') continue;

    const year = dt.substring(0, 4);
    const month = dt.substring(4, 6);
    const day = dt.substring(6, 8);
    const dateStr = `${year}-${month}-${day}`;

    let timeStr = 'TBD';
    if (dt.includes('T')) {
      const h = parseInt(dt.substring(9, 11), 10);
      const m = dt.substring(11, 13);
      // UTC zamanından Türkiye Saatine (UTC+3) çevir
      const turkeyHour = (h + 3) % 24;
      timeStr = `${String(turkeyHour).padStart(2, '0')}:${m}`;
    }

    // Turnuva & Kategori Tespiti
    let category = 'Süper Lig';
    let compName = 'Trendyol Süper Lig ⚽';

    if (rawSummary.includes('[CL]') || rawSummary.toLowerCase().includes('champions league')) {
      category = 'Şampiyonlar Ligi';
      compName = 'UEFA Şampiyonlar Ligi 🏆';
    } else if (rawSummary.includes('[UEL]') || rawSummary.toLowerCase().includes('europa league')) {
      category = 'Avrupa Ligi';
      compName = 'UEFA Avrupa Ligi 🏆';
    } else if (rawSummary.includes('[UECL]') || rawSummary.toLowerCase().includes('conference league')) {
      category = 'Konferans Ligi';
      compName = 'UEFA Konferans Ligi 🏆';
    } else if (rawSummary.includes('[TC]')) {
      category = 'Türkiye Kupası';
      compName = 'Ziraat Türkiye Kupası 🏆';
    } else if (rawSummary.includes('[SK]')) {
      category = 'Süper Kupa';
      compName = 'Turkcell Süper Kupa 🏆';
    } else if (team.league === 'championsleague') {
      if (['realmadrid', 'barcelona', 'atleticomadrid'].includes(team.id)) {
        category = 'La Liga';
        compName = 'La Liga 🇪🇸';
      } else if (['mancity', 'arsenal', 'liverpool'].includes(team.id)) {
        category = 'Premier League';
        compName = 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      } else if (['bayern', 'bayerleverkusen'].includes(team.id)) {
        category = 'Bundesliga';
        compName = 'Bundesliga 🇩🇪';
      } else if (['inter', 'juventus'].includes(team.id)) {
        category = 'Serie A';
        compName = 'Serie A 🇮🇹';
      } else if (team.id === 'psg') {
        category = 'Ligue 1';
        compName = 'Ligue 1 🇫🇷';
      }
    }

    // Başlık temizliği (skor ve etiketleri temizle)
    let cleanTitle = rawSummary
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\s*\[.*?\]\s*/g, ' ')
      .replace(/\s*\(\d+-\d+\)\s*/g, ' ')
      .trim();

    meetings.push({
      id: `match-${team.id}-${dateStr}`,
      teamId: team.id,
      userId: 'football-system',
      title: cleanTitle,
      date: dateStr,
      startTime: timeStr,
      itemType: 'match',
      category: category,
      description: `${team.name} • ${compName}`,
      teamBadge: team.logo,
      teamColor: team.color
    });
  }

  // Tarihe göre sırala
  meetings.sort((a, b) => {
    const timeA = a.startTime === 'TBD' ? '12:00' : a.startTime;
    const timeB = b.startTime === 'TBD' ? '12:00' : b.startTime;
    return new Date(`${a.date}T${timeA}`).getTime() - new Date(`${b.date}T${timeB}`).getTime();
  });

  return meetings;
}

async function syncAllFixtures() {
  console.log(`[B12 Fixtures Sync] Başlatılıyor: Toplam ${TEAMS.length} takım senkronize edilecek...`);

  const teamMatchesMap = {};
  let totalMatchesCount = 0;

  for (const team of TEAMS) {
    const url = `https://ics.fixtur.es/v2/${team.slug}.ics`;
    process.stdout.write(`  -> [${team.name}] ${url} çekiliyor... `);

    const icsData = await fetchHttps(url);
    if (!icsData) {
      console.log(`⚠️ Başarısız!`);
      teamMatchesMap[team.id] = [];
      continue;
    }

    const matches = parseIcsToMeetings(team, icsData);
    teamMatchesMap[team.id] = matches;
    totalMatchesCount += matches.length;
    console.log(`✅ ${matches.length} maç bulundu.`);
  }

  const outputData = {
    updatedAt: new Date().toISOString(),
    season: '2026-2027',
    totalTeams: TEAMS.length,
    totalMatches: totalMatchesCount,
    teams: TEAMS.map(t => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      shortName: t.shortName,
      league: t.league,
      leagueName: t.leagueName,
      logo: t.logo,
      color: t.color,
      accentColor: t.accentColor,
      matchesCount: (teamMatchesMap[t.id] || []).length
    })),
    fixtures: teamMatchesMap
  };

  const outputDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'fixtures.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

  console.log(`\n[B12 Fixtures Sync] Başarıyla tamamlandı!`);
  console.log(`  Dosya: ${outputPath}`);
  console.log(`  Toplam Maç: ${totalMatchesCount}`);
}

syncAllFixtures().catch(err => {
  console.error("[B12 Fixtures Sync] Hata:", err);
  process.exit(1);
});
