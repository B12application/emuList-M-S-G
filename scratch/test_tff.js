async function testTff() {
  try {
    const res = await fetch('https://www.tff.org/default.aspx?pageID=198', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    console.log('TFF Status:', res.status, 'HTML length:', text.length);
    if (text.includes('Galatasaray') || text.includes('GALATASARAY')) {
      console.log('Found Galatasaray in TFF page!');
    } else {
      console.log('No direct GS match on home fixture page');
    }
  } catch (e) {
    console.error('TFF fetch error:', e.message);
  }
}

testTff();
