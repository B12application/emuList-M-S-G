import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const sources = [
    {
      name: 'CollectAPI',
      url: 'https://api.collectapi.com/economy/goldPrice',
      headers: {
        'authorization': process.env.COLLECT_API_KEY || ''
      },
      check: (json: any) => json.success === true && Array.isArray(json.result)
    },
    {
      name: 'Truncgil_v3',
      url: 'https://finans.truncgil.com/v3/today.json',
      check: (json: any) => json['gram-altin'] || json['gram_altin'] || json['GA']
    },
    {
      name: 'GenelPara_Backup',
      url: 'https://api.genelpara.com/json/?list=altin',
      check: (json: any) => json['GA']
    }
  ];

  for (const source of sources) {
    try {
      console.log(`Checking ${source.name}...`);

      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.google.com/',
          ...(source.headers || {})
        }
      });

      if (!response.ok) {
        console.error(`${source.name} HTTP Error: ${response.status}`);
        continue;
      }

      const json = await response.json();

      if (source.check(json)) {
        console.log(`${source.name} data retrieved successfully.`);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60'
          },
          body: JSON.stringify(json),
        };
      }
      console.warn(`${source.name} data key not found. Keys:`, Object.keys(json));
    } catch (e: any) {
      console.error(`${source.name} failed:`, e.message);
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Gold data unavailable at the moment' }),
  };
};