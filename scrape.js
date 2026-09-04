const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Month map for Spanish & Valencian dates
const MONTHS = {
  gener: 0, enero: 0, gen: 0, ene: 0,
  febrer: 1, febrero: 1, feb: 1,
  març: 2, marzo: 2, mar: 2,
  abril: 3, abr: 3,
  maig: 4, mayo: 4, mai: 4, may: 4,
  juny: 5, junio: 5, jun: 5,
  juliol: 6, julio: 6, jul: 6,
  agost: 7, agosto: 7, ago: 7,
  setembre: 8, septiembre: 8, set: 8, sep: 8,
  octubre: 9, oct: 9,
  novembre: 10, noviembre: 10, nov: 10,
  desembre: 11, diciembre: 11, des: 11, dic: 11,
};

function parseSpanishValencianDate(text) {
  if (!text) return null;
  const currentYear = new Date().getFullYear();
  const clean = text.toLowerCase();

  // Pattern: "fins al 15 d'octubre" or "hasta el 30 de noviembre de 2026"
  const singleMatch = clean.match(/(?:fins al|fins|hasta el|hasta)\s+(\d{1,2})\s+(?:de|d')\s*([a-zç]+)(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (singleMatch) {
    const day = parseInt(singleMatch[1], 10);
    const month = MONTHS[singleMatch[2]];
    const year = singleMatch[3] ? parseInt(singleMatch[3], 10) : currentYear;
    if (month !== undefined) {
      return new Date(Date.UTC(year, month, day, 20, 0, 0)).toISOString();
    }
  }

  // Pattern: "del 5 de setembre al 20 d'octubre"
  const rangeMatch = clean.match(/al\s+(\d{1,2})\s+(?:de|d')\s*([a-zç]+)(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (rangeMatch) {
    const day = parseInt(rangeMatch[1], 10);
    const month = MONTHS[rangeMatch[2]];
    const year = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : currentYear;
    if (month !== undefined) {
      return new Date(Date.UTC(year, month, day, 20, 0, 0)).toISOString();
    }
  }

  return null;
}

async function scrapeSongkick(page) {
  console.log('Scraping Songkick (Concerts)...');
  const targetUrl = 'https://www.songkick.com/metro-areas/28802-spain-valencia/this-month';
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
          const img = Array.isArray(item.image) ? item.image[0] : item.image;

          events.push({
            id: `sk-${events.length + 1}-${Date.now()}`,
            title: item.name || 'Concierto en Valencia',
            description: `Concierto en directo en ${venue}`,
            category: 'musica',
            startDate: item.startDate ? new Date(item.startDate).toISOString() : new Date().toISOString(),
            endDate: item.endDate ? new Date(item.endDate).toISOString() : undefined,
            venueName: venue,
            address: address,
            imageUrl: img || undefined,
            isFree: offer?.price === 0 || offer?.price === '0',
            ticketPrice: price,
            ticketUrl: offer?.url || item.url,
            url: item.url || 'https://www.songkick.com',
          });
        }
      }
    } catch (_) {}
  }

  console.log(`Parsed ${events.length} Songkick concerts.`);
  return events;
}

async function scrapeAuAgendaExpos(page) {
  console.log('Scraping AU-Agenda (Exposicions)...');
  const urls = [
    'https://au-agenda.com/exposicions/',
    'https://au-agenda.com/exposicions/page/2/',
  ];

  const expos = [];
  const now = new Date();

  for (const url of urls) {
    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

      const rawCards = await page.$$eval('article, .post, .type-post', (cards) => {
        return cards.map((el) => {
          const titleEl = el.querySelector('h2, h3, .entry-title');
          const title = titleEl ? titleEl.textContent.trim() : '';
          const linkEl = el.querySelector('a');
          const link = linkEl ? linkEl.href : '';
          
          const imgEl = el.querySelector('img');
          const img = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || imgEl.src || '') : '';
          
          const descEl = el.querySelector('.entry-summary, .entry-content, p');
          const desc = descEl ? descEl.textContent.trim() : '';

          return { title, link, img, desc };
        });
      });

      for (const card of rawCards) {
        if (!card.title || card.title.length < 3) continue;

        // Try to parse end date from description text
        const parsedEndDate = parseSpanishValencianDate(card.desc);
        
        // Exhibitions span weeks/months; default fallback is 30 days if not stated
        const defaultEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = parsedEndDate || defaultEndDate;

        // Detect known Valencia museums/galleries from text
        const text = `${card.title} ${card.desc}`.toLowerCase();
        let venue = 'València';
        if (text.includes('ivam')) venue = 'IVAM';
        else if (text.includes('centre del carme') || text.includes('cccc')) venue = 'Centre del Carme (CCCC)';
        else if (text.includes('bombas gens')) venue = 'Bombas Gens Centre d’Arts Digitals';
        else if (text.includes('bancaixa') || text.includes('bancaja')) venue = 'Fundació Bancaixa';
        else if (text.includes('muvim')) venue = 'MuVIM';
        else if (text.includes('bellas artes') || text.includes('belles arts')) venue = 'Museu de Belles Arts de València';
        else if (text.includes('la nau')) venue = 'La Nau Centre Cultural';
        else if (text.includes('caixaforum')) venue = 'CaixaForum València';
        else if (text.includes('palau de les arts')) venue = 'Palau de les Arts';

        expos.push({
          id: `au-expo-${expos.length + 1}-${Date.now()}`,
          title: card.title,
          description: card.desc ? card.desc.slice(0, 180) : `Exposició a ${venue}`,
          category: 'exposicions',
          startDate: now.toISOString(),
          endDate: endDate,
          venueName: venue,
          address: 'València',
          imageUrl: card.img || undefined,
          isFree: false,
          ticketPrice: undefined,
          ticketUrl: card.link || 'https://au-agenda.com/exposicions/',
          url: card.link || 'https://au-agenda.com/exposicions/',
        });
      }
    } catch (err) {
      console.warn(`Failed scraping ${url}: ${err.message}`);
    }
  }

  console.log(`Parsed ${expos.length} AU-Agenda exhibitions.`);
  return expos;
}

async function main() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const musicEvents = await scrapeSongkick(page);
  const expoEvents = await scrapeAuAgendaExpos(page);

  await browser.close();

  const combined = [...musicEvents, ...expoEvents];
  console.log(`Total events consolidated: ${combined.length}`);

  const outDir = path.join(__dirname, 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(combined, null, 2), 'utf-8');
  console.log('Saved consolidated feed to public/events.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
