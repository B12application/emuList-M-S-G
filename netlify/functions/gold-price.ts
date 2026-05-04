import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const sources = [
    {
      name: 'GenelPara',
      url: 'https://api.genelpara.com/json/?list=altin',
      check: (json: any) => json['GA'] || json.GA
    },
    {
      name: 'Truncgil',
      url: 'https://finans.truncgil.com/v3/today.json',
      check: (json: any) => json['gram-altin'] || json['gram_altin']
    }
  ];

  for (const source of sources) {
    try {
      console.log(`Checking ${source.name}: ${source.url}`);

      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`${source.name} HTTP Error: ${response.status}`);
        continue;
      }

      const json = await response.json();

      // Kaynaktan gelen verinin yapısını kontrol et
      if (source.check(json)) {
        console.log(`${source.name} data retrieved successfully.`);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300'
          },
          body: JSON.stringify(json),
        };
      } else {
        console.warn(`${source.name} returned unexpected format:`, JSON.stringify(json).substring(0, 100));
      }
    } catch (e: any) {
      console.error(`${source.name} Fetch Failed:`, e.message);
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'No valid gold data found from any source' }),
  };
};