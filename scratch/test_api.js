const apiKey = 'fapi_ynnvc09ClGoVCZwxsN5ppC2oki7JFm2S';

const urlsToTest = [
  'https://api.thestatsapi.com/api/v1/teams',
  'https://api.thestatsapi.com/api/v1/leagues',
  'https://api.thestatsapi.com/api/v1/fixtures',
  'https://api.thestatsapi.com/api/v1/standings',
  'https://api.thestatsapi.com/api/v1/competitions',
  'https://api.thestatsapi.com/api/health'
];

async function testUrls() {
  for (const url of urlsToTest) {
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      });
      const text = await res.text();
      console.log(`[${res.status}] ${url} => ${text}`);
    } catch (e) {
      console.log(`[ERR] ${url} => ${e.message}`);
    }
  }
}

testUrls();
