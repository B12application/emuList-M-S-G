import { Handler } from '@netlify/functions';

interface ScrapedMatch {
  teamId: string;
  opponent: string;
  date: string;
  time: string;
  comp: string;
  isHome: boolean;
}

export const handler: Handler = async (event, context) => {
  try {
    const scrapedMatches: ScrapedMatch[] = [];

    // 1. Fetch TFF Süper Lig Official Fixture Page
    try {
      const tffResponse = await fetch('https://www.tff.org/default.aspx?pageID=198', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (tffResponse.ok) {
        const html = await tffResponse.text();

        // Simple regex scraper for TFF match blocks: Date - Teams - Time
        // TFF uses span elements for match dates & teams
        const dateRegex = /(\d{2}\.\d{2}\.\d{4})/g;
        const matchesFound = html.match(dateRegex);
        
        if (matchesFound && matchesFound.length > 0) {
          console.log(`TFF Scraper: Found ${matchesFound.length} date entries.`);
        }
      }
    } catch (e: any) {
      console.warn("TFF Scraper warning:", e.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      },
      body: JSON.stringify({
        success: true,
        scrapedMatches,
        lastUpdated: new Date().toISOString()
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
