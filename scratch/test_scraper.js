async function testScrapers() {
  const sources = [
    { name: 'Google Calendar GS ICS', url: 'https://calendar.google.com/calendar/ical/turkishsuperlig%40gmail.com/public/basic.ics' },
    { name: 'Fixtures.es GS', url: 'https://fixtur.es/en/wedstrijden/galatasaray.ics' },
    { name: 'Fotomaç / Spor', url: 'https://www.fotomac.com.tr/galatasaray/fikstur' }
  ];

  for (const s of sources) {
    try {
      const res = await fetch(s.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      console.log(`[${res.status}] ${s.name} => length: ${(await res.text()).length}`);
    } catch (e) {
      console.log(`[ERR] ${s.name} => ${e.message}`);
    }
  }
}

testScrapers();
