async function testTffParse() {
  try {
    const res = await fetch('https://www.tff.org/default.aspx?pageID=198', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    
    // Find where Galatasaray appears
    let idx = 0;
    while ((idx = text.indexOf('GALATASARAY', idx)) !== -1) {
      console.log(`--- MATCH AT ${idx} ---`);
      console.log(text.substring(idx - 100, idx + 200).replace(/\s+/g, ' '));
      idx += 11;
      if (idx > 50000) break;
    }

  } catch (e) {
    console.error(e);
  }
}

testTffParse();
