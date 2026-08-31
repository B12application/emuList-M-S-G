export async function onRequest(context: any) {
  const env = context.env;
  const sources = [
    {
      name: 'CollectAPI',
      url: 'https://api.collectapi.com/economy/goldPrice',
      headers: {
        'authorization': env.COLLECT_API_KEY || ''
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

      const json: any = await response.json();

      if (source.check(json)) {
        console.log(`${source.name} data retrieved successfully.`);
        return new Response(JSON.stringify(json), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
          }
        });
      }
      console.warn(`${source.name} data key not found. Keys:`, Object.keys(json));
    } catch (e: any) {
      console.error(`${source.name} failed:`, e.message);
    }
  }

  return new Response(JSON.stringify({ error: 'Gold data unavailable at the moment' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
