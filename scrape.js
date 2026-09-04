const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeSongkick() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const targetUrl = 'https://www.songkick.com/metro-areas/28802-spain-valencia/this-month';
  console.log(`Navigating to ${targetUrl}...`);

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const rawLdScripts = await page.$$eval('script[type="application/ld+json"]', (scripts) =>
    scripts.map((s) => s.textContent || '')
  );

  const events = [];

  for (const raw of rawLdScripts) {
    try {
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item['@type'] === 'MusicEvent') {
          const venue = item.location?.name || 'València';
          const address = item.location?.address?.streetAddress || item.location?.address?.addressLocality || 'València';
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          const price = offer?.price ? `${offer.price}€` : undefined;

          events.push({
            id: `sk-${events.length + 1}-${Date.now()}`,
            title: item.name || 'Concierto en Valencia',
            description: `Concierto en directo en ${venue}`,
            category: 'musica',
            startDate: item.startDate ? new Date(item.startDate).toISOString() : new Date().toISOString(),
            endDate: item.endDate ? new Date(item.endDate).toISOString() : undefined,
            venueName: venue,
            address: address,
            isFree: offer?.price === 0 || offer?.price === '0',
            ticketPrice: price,
            ticketUrl: offer?.url || item.url,
            url: item.url || 'https://www.songkick.com',
          });
        }
      }
    } catch (_) {}
  }

  await browser.close();
  console.log(`Parsed ${events.length} concerts.`);

  const outDir = path.join(__dirname, 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(events, null, 2), 'utf-8');
  console.log('Saved to public/events.json');
}

scrapeSongkick().catch((err) => {
  console.error(err);
  process.exit(1);
});
