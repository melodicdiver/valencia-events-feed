const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Curated dictionary of iconic Valencia art venues, museums, and street addresses
const KNOWN_VENUES = [
  { pattern: /reina 121|la reina 121/i, name: 'Espai La Reina 121', address: 'Carrer de la Reina, 121, 46011 València' },
  { pattern: /\bivam\b|julio gonz[aá]lez/i, name: 'IVAM', address: 'Guillem de Castro, 118, 46003 València' },
  { pattern: /belles arts|bellas artes|san p[ií]o v|rubens/i, name: 'Museu de Belles Arts de València', address: 'Carrer de Sant Pius V, 9, 46010 València' },
  { pattern: /\bmuvim\b/i, name: 'MuVIM', address: 'Carrer de Quevedo, 10, 46001 València' },
  { pattern: /fundaci[oó] bancaixa|fundaci[oó]n bancaja/i, name: 'Fundació Bancaixa', address: 'Plaça de Tetuan, 23, 46003 València' },
  { pattern: /bombas gens/i, name: 'Bombas Gens Centre d’Arts Digitals', address: 'Avinguda de Burjassot, 54, 46009 València' },
  { pattern: /caixaforum/i, name: 'CaixaForum València', address: 'Carrer d’Eduardo Primo Yúfera, 1A, 46013 València' },
  { pattern: /la nau/i, name: 'La Nau Centre Cultural', address: 'Carrer de la Universitat, 2, 46003 València' },
  { pattern: /almud[ií]n|l’almod[ií]/i, name: 'L’Almodí', address: 'Plaça de Sant Lluís Bertran, 2, 46003 València' },
  { pattern: /museu de cer[aà]mica|marqu[eé]s de dos aguas/i, name: 'Museu Nacional de Ceràmica', address: 'Carrer del Poeta Querol, 2, 46002 València' },
  { pattern: /drassanes|atarazanas|la mar [eè]pica/i, name: 'Drassanes del Grau', address: 'Plaça de Joan Pau II, 46024 València' },
  { pattern: /l’etno|museu valenci[aà] d’etnologia/i, name: 'L’Etno', address: 'Carrer de la Corona, 36, 46003 València' },
  { pattern: /prehist[oò]ria/i, name: 'Museu de Prehistòria de València', address: 'Carrer de la Corona, 36, 46003 València' },
  { pattern: /palau de les arts/i, name: 'Palau de les Arts Reina Sofía', address: 'Av. del Professor López Piñero, 1, 46013 València' },
  { pattern: /palau de la m[uú]sica/i, name: 'Palau de la Música', address: 'Passeig de l’Albereda, 30, 46023 València' },
  { pattern: /jard[ií] bot[aà]nic|l’albufera/i, name: 'Jardí Botànic UV', address: 'Carrer de Quart, 80, 46008 València' },
  { pattern: /la mutant/i, name: 'La Mutant', address: 'Carrer de Joan Verdaguer, 22, 46024 València' },
  { pattern: /las naves|valencia se ilustra/i, name: 'Las Naves', address: 'Carrer de Joan Verdaguer, 16, 46024 València' },
  { pattern: /teatre el musical|tem\b/i, name: 'Teatre El Musical (TEM)', address: 'Plaça del Rosari, 3, 46011 València' },
  { pattern: /casa museu benlliure/i, name: 'Casa Museu Benlliure', address: 'Carrer de Blanqueries, 23, 46003 València' },
  { pattern: /camilo sesto/i, name: 'Museu Camilo Sesto', address: 'Alcoi' },
  { pattern: /ateneo mercantil|frida kahlo/i, name: 'Ateneo Mercantil de Valencia', address: 'Plaça de l’Ajuntament, 18, 46002 València' },
  { pattern: /rector peset/i, name: 'Col·legi Major Rector Peset', address: 'Forn de Sant Nicolau, 4, 46001 València' },
  { pattern: /centre del carme|cccc|consorci de museus/i, name: 'Centre del Carme (CCCC)', address: 'Carrer del Museu, 2, 46003 València' },
];

/**
 * Strips outer template chrome (header, nav, footer, sidebar, widgets)
 */
function cleanArticleContent(html) {
  if (!html) return '';
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*(?:sidebar|widget|menu|related|footer)[^"']*["'][\s\S]*?<\/div>/gi, '');
}

/**
 * Resolves accurate venue name and address
 */
function resolveVenueInfo(cardTitle = '', cardDesc = '', rawHtml = '') {
  const cardText = `${cardTitle} ${cardDesc}`.trim();

  // 1. High-Confidence Check: card title and excerpt (0% HTML pollution)
  for (const item of KNOWN_VENUES) {
    if (item.pattern.test(cardText)) {
      return { venueName: item.name, address: item.address };
    }
  }

  // 2. Strip template chrome from the fetched article page
  const cleanHtml = cleanArticleContent(rawHtml);

  // 3. Explicit label check inside the article body (e.g., "Lloc: MuVIM", "Lugar: Ateneo")
  const explicitMatch = cleanHtml.match(/(?:<strong>|<b>)?\s*(?:Lloc|Lugar|On|Dónde|Espai|Espacio|Sala|Sede)\s*(?:<\/strong>|<\/b>)?\s*[:：]\s*([^<.\n\r]+)/i);
  if (explicitMatch) {
    const rawVenue = explicitMatch[1].replace(/<[^>]+>/g, '').trim();
    for (const item of KNOWN_VENUES) {
      if (item.pattern.test(rawVenue)) {
        return { venueName: item.name, address: item.address };
      }
    }
    if (rawVenue.length > 2 && rawVenue.length < 50 && !/val[eè]ncia/i.test(rawVenue)) {
      return { venueName: rawVenue, address: 'València' };
    }
  }

  // 4. Check KNOWN_VENUES against the stripped article text
  const cleanText = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const item of KNOWN_VENUES) {
    if (item.pattern.test(cleanText)) {
      return { venueName: item.name, address: item.address };
    }
  }

  return { venueName: 'València', address: 'València' };
}

/**
 * Parses numeric dates (e.g. "5/9", "4/10", "28/2/2027") from AU-Agenda
 */
function parseAuDates(text) {
  if (!text) return null;
  const currentYear = new Date().getFullYear();
  const clean = text.replace(/\s+/g, ' ').toLowerCase();

  const toIso = (day, month, yearStr) => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    let y = currentYear;
    if (yearStr) {
      const yNum = parseInt(yearStr, 10);
      y = yNum < 100 ? 2000 + yNum : yNum;
    }
    if (isNaN(d) || isNaN(m) || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d, 20, 0, 0));
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  };

  // 1. Date Range: "del dissabte 5/9 al dissabte 31/10"
  const rangeMatch = clean.match(/(?:del|des de|des del)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(?:al|fins al|hasta el)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
  if (rangeMatch) {
    let sYear = rangeMatch[3];
    let eYear = rangeMatch[6];
    const sMonth = parseInt(rangeMatch[2], 10);
    const eMonth = parseInt(rangeMatch[5], 10);
    if (!eYear && sMonth > eMonth) eYear = (currentYear + 1).toString();

    const sIso = toIso(rangeMatch[1], rangeMatch[2], sYear);
    const eIso = toIso(rangeMatch[4], rangeMatch[5], eYear);
    if (eIso) return { startDate: sIso || new Date().toISOString(), endDate: eIso };
  }

  // 2. Single End Date: "hasta el domingo 4/10", "fins al 13/9"
  const endMatch = clean.match(/(?:fins al|fins el|fins|hasta el|hasta|al)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
  if (endMatch) {
    let eYear = endMatch[3];
    const eMonth = parseInt(endMatch[2], 10);
    const currMonth = new Date().getMonth() + 1;
    if (!eYear && eMonth < currMonth) eYear = (currentYear + 1).toString();

    const eIso = toIso(endMatch[1], endMatch[2], eYear);
    if (eIso) return { startDate: new Date().toISOString(), endDate: eIso };
  }

  // 3. Ongoing start: "des del dijous 11/6"
  const startMatch = clean.match(/(?:des del|des de|desde el|desde)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
  if (startMatch) {
    const sIso = toIso(startMatch[1], startMatch[2], startMatch[3]);
    if (sIso) {
      const eIso = new Date(new Date(sIso).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
      return { startDate: sIso, endDate: eIso };
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

async function scrapeAuAgendaExpos(page, context) {
  console.log('Scraping AU-Agenda (Exposicions)...');
  const urls = [
    'https://au-agenda.com/exposicions/',
    'https://au-agenda.com/exposicions/page/2/',
  ];

  const rawCards = [];

  for (const url of urls) {
    try {
      console.log(`Fetching listing ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

      const cards = await page.$$eval('article, .post, .type-post', (nodes) =>
        nodes.map((el) => {
          const titleEl = el.querySelector('h2, h3, .entry-title');
          const linkEl = el.querySelector('a');
          const imgEl = el.querySelector('img');
          const descEl = el.querySelector('.entry-summary, .entry-content, p');

          return {
            title: titleEl ? titleEl.textContent.trim() : '',
            link: linkEl ? linkEl.href : '',
            img: imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || imgEl.src || '') : '',
            desc: descEl ? descEl.textContent.trim() : '',
          };
        })
      );
      rawCards.push(...cards);
    } catch (err) {
      console.warn(`Could not load ${url}: ${err.message}`);
    }
  }

  const expos = [];
  const now = new Date();

  for (const card of rawCards) {
    if (!card.title || card.title.length < 3) continue;

    let articleHtml = '';
    if (card.link) {
      try {
        const res = await context.request.get(card.link, { timeout: 15000 });
        if (res.ok()) {
          articleHtml = await res.text();
        }
      } catch (_) {}
    }

    const { venueName, address } = resolveVenueInfo(card.title, card.desc, articleHtml);

    const parsedDates = parseAuDates(card.desc) || parseAuDates(cleanArticleContent(articleHtml));
    const startDate = parsedDates?.startDate || now.toISOString();
    const endDate = parsedDates?.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    expos.push({
      id: `au-expo-${expos.length + 1}-${Date.now()}`,
      title: card.title,
      description: card.desc ? card.desc.slice(0, 180) : `Exposició a ${venueName}`,
      category: 'exposicions',
      startDate,
      endDate,
      venueName,
      address,
      imageUrl: card.img || undefined,
      isFree: false,
      ticketPrice: undefined,
      ticketUrl: card.link || 'https://au-agenda.com/exposicions/',
      url: card.link || 'https://au-agenda.com/exposicions/',
    });
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
  const expoEvents = await scrapeAuAgendaExpos(page, context);

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
