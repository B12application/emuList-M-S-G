import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  try {
    // Sources to try
    const sources = [
      {
        url: 'https://api.genelpara.com/json/?list=altin',
        parser: (json: any) => json['GA']
      },
      {
        url: 'https://finans.truncgil.com/v3/today.json',
        parser: (json: any) => json['gram-altin'] || json['gram_altin']
      }
    ];

    for (const source of sources) {
      try {
        console.log(`Trying source: ${source.url}`);
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const json = await response.json();
          if (source.parser(json)) {
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300' // Cache for 5 mins
              },
              body: JSON.stringify(json),
            };
          }
        }
      } catch (e) {
        console.error(`Source ${source.url} failed:`, e);
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Could not fetch gold data from any source' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : String(error) 
      }),
    };
  }
};
