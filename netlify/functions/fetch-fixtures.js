const TEAM_SLUGS = {
    galatasaray: 'galatasaray',
    fenerbahce: 'fenerbahce',
    besiktas: 'besiktas',
    trabzonspor: 'trabzonspor',
    basaksehir: 'istanbul-basaksehir-fk',
    samsunspor: 'samsunspor',
    eyupspor: 'eyupspor',
    sivasspor: 'sivasspor',
    realmadrid: 'real-madrid',
    mancity: 'manchester-city',
    arsenal: 'arsenal',
    barcelona: 'fc-barcelona',
    bayern: 'bayern-munchen',
    inter: 'inter',
    liverpool: 'liverpool',
    psg: 'paris-saint-germain',
    bayerleverkusen: 'bayer-leverkusen',
    atleticomadrid: 'atletico-madrid',
    juventus: 'juventus'
};
function parseIcs(teamId, icsText) {
    const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
    const events = unfolded.split('BEGIN:VEVENT').slice(1);
    const matches = [];
    for (const ev of events) {
        const startMatch = ev.match(/DTSTART(?:;[^:]+)?:(\d{8}(?:T\d{6}Z?)?)/);
        const summaryMatch = ev.match(/SUMMARY:([^\r\n]+)/);
        if (!startMatch || !summaryMatch)
            continue;
        const dt = startMatch[1];
        const rawSummary = summaryMatch[1].trim();
        // Sadece 2026/2027 sezonu
        if (dt < '20260801' || dt > '20270701')
            continue;
        const dateStr = `${dt.substring(0, 4)}-${dt.substring(4, 6)}-${dt.substring(6, 8)}`;
        let timeStr = 'TBD';
        if (dt.includes('T')) {
            const h = parseInt(dt.substring(9, 11), 10);
            const m = dt.substring(11, 13);
            const turkeyH = (h + 3) % 24;
            timeStr = `${String(turkeyH).padStart(2, '0')}:${m}`;
        }
        let category = 'Süper Lig';
        let comp = 'Trendyol Süper Lig ⚽';
        if (rawSummary.includes('[CL]') || rawSummary.toLowerCase().includes('champions league')) {
            category = 'Şampiyonlar Ligi';
            comp = 'UEFA Şampiyonlar Ligi 🏆';
        }
        else if (rawSummary.includes('[UEL]') || rawSummary.toLowerCase().includes('europa league')) {
            category = 'Avrupa Ligi';
            comp = 'UEFA Avrupa Ligi 🏆';
        }
        else if (rawSummary.includes('[UECL]') || rawSummary.toLowerCase().includes('conference league')) {
            category = 'Konferans Ligi';
            comp = 'UEFA Konferans Ligi 🏆';
        }
        else if (rawSummary.includes('[TC]')) {
            category = 'Türkiye Kupası';
            comp = 'Ziraat Türkiye Kupası 🏆';
        }
        else if (rawSummary.includes('[SK]')) {
            category = 'Süper Kupa';
            comp = 'Turkcell Süper Kupa 🏆';
        }
        const cleanTitle = rawSummary
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\s*\[.*?\]\s*/g, ' ')
            .replace(/\s*\(\d+-\d+\)\s*/g, ' ')
            .trim();
        matches.push({
            teamId,
            opponent: cleanTitle,
            title: cleanTitle,
            date: dateStr,
            time: timeStr,
            comp,
            category
        });
    }
    return matches;
}
export const handler = async (event, _context) => {
    try {
        const requestedTeamsParam = event.queryStringParameters?.teams || event.queryStringParameters?.team;
        let targetTeamIds = ['galatasaray'];
        if (requestedTeamsParam) {
            targetTeamIds = requestedTeamsParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        }
        const scrapedMatches = [];
        // Paralel çekim (en fazla 6 takım aynı anda)
        const fetchPromises = targetTeamIds.slice(0, 6).map(async (teamId) => {
            const slug = TEAM_SLUGS[teamId] || teamId;
            try {
                const url = `https://ics.fixtur.es/v2/${slug}.ics`;
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (res.ok) {
                    const text = await res.text();
                    const matches = parseIcs(teamId, text);
                    scrapedMatches.push(...matches);
                }
            }
            catch (err) {
                console.warn(`[fetch-fixtures] Failed for ${teamId}:`, err.message);
            }
        });
        await Promise.all(fetchPromises);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300'
            },
            body: JSON.stringify({
                success: true,
                count: scrapedMatches.length,
                scrapedMatches,
                lastUpdated: new Date().toISOString()
            }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
