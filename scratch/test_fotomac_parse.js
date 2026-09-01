async function testParse() {
  try {
    const res = await fetch('https://www.fotomac.com.tr/galatasaray/fikstur', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    // Look for match dates or team names in HTML
    const dateRegex = /\d{2}\.\d{2}\.\d{4}/g;
    const dates = html.match(dateRegex);
    console.log('Found dates:', dates ? dates.slice(0, 10) : 'None');

    const sampleIdx = html.indexOf('fixture') > -1 ? html.indexOf('fixture') : html.indexOf('fikstur');
    console.log('Snippet around fixture:', html.substring(sampleIdx, sampleIdx + 1000));
  } catch (e) {
    console.error(e);
  }
}

testParse();
