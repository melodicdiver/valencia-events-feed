const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Official dictionary for AU-Agenda venue acronyms and shorthand names
const VENUE_MAP = {
  mubav: {
    name: 'Museu de Belles Arts de València (MuBAV)',
    address: 'Carrer de Sant Pius V, 9, 46010 València',
  },
  cccc: {
    name: 'Centre del Carme (CCCC)',
    address: 'Carrer del Museu, 2, 46003 València',
  },
  ivam: {
    name: 'IVAM',
    address: 'Guillem de Castro, 118, 46003 València',
  },
  "l'etno": {
    name: "L'ETNO (Museu Valencià d'Etnologia)",
    address: 'Carrer de la Corona, 36, 46003 València',
  },
  letno: {
    name: "L'ETNO (Museu Valencià d'Etnologia)",
    address: 'Carrer de la Corona, 36, 46003 València',
  },
  etno: {
    name: "L'ETNO (Museu Valencià d'Etnologia)",
    address: 'Carrer de la Corona, 36, 46003 València',
  },
  'sala municipal': {
    name: "Sala Municipal d'Exposicions",
    address: "Carrer de l'Arquebisbe Mayoral, 1, 46002 València",
  },
  muvim: {
    name: 'MuVIM',
    address: 'Carrer de Quevedo, 10, 46001 València',
  },
  'reina 121': {
    name: 'Espai La Reina 121',
    address: 'Carrer de la Reina, 121, 46011 València',
  },
  'la reina 121': {
    name: 'Espai La Reina 121',
    address: 'Carrer de la Reina, 121, 46011 València',
  },
  bancaixa: {
    name: 'Fundació Bancaixa',
    address: 'Plaça de Tetuan, 23, 46003 València',
  },
  'fundacio bancaixa': {
    name: 'Fundació Bancaixa',
    address: 'Plaça de Tetuan, 23, 46003 València',
  },
  'fundacion bancaja': {
    name: 'Fundació Bancaixa',
    address: 'Plaça de Tetuan, 23, 46003 València',
  },
  'bombas gens': {
    name: 'Bombas Gens Centre d’Arts Digitals',
    address: 'Avinguda de Burjassot, 54, 46009 València',
  },
  caixaforum: {
    name: 'CaixaForum València',
    address: 'Carrer d’Eduardo Primo Yúfera, 1A, 46013 València',
  },
  'la nau': {
    name: 'La Nau Centre Cultural',
    address: 'Carrer de la Universitat, 2, 46003 València',
  },
  'botànic': {
    name: 'Jardí Botànic UV',
    address: 'Carrer de Quart, 80, 46008 València',
  },
  botanic: {
    name: 'Jardí Botànic UV',
    address: 'Carrer de Quart, 80, 46008 València',
  },
  'jardi botanic': {
    name: 'Jardí Botànic UV',
    address: 'Carrer de Quart, 80, 46008 València',
  },
  'ateneo mercantil': {
    name: 'Ateneo Mercantil de Valencia',
    address: 'Plaça de l’Ajuntament, 18, 46002 València',
  },
  ateneo: {
    name: 'Ateneo Mercantil de Valencia',
    address: 'Plaça de l’Ajuntament, 18, 46002 València',
  },
  'las naves': {
    name: 'Las Naves',
    address: 'Carrer de Joan Verdaguer, 16, 46024 València',
  },
  'la mutant': {
    name: 'La Mutant',
    address: 'Carrer de Joan Verdaguer, 22, 46024 València',
  },
  tem: {
    name: 'Teatre El Musical (TEM)',
    address: 'Plaça del Rosari, 3, 46011 València',
  },
  'teatre el musical': {
    name: 'Teatre El Musical (TEM)',
    address: 'Plaça del Rosari, 3, 46011 València',
  },
  drassanes: {
    name: 'Drassanes del Grau',
    address: 'Plaça de Joan Pau II, 46024 València',
  },
  'drassanes del grau': {
    name: 'Drassanes del Grau',
    address: 'Plaça de Joan Pau II, 46024 València',
  },
  almodi: {
    name: "L'Almodí",
    address: 'Plaça de Sant Lluís Bertran, 2, 46003 València',
  },
  'camilo sesto': {
    name: 'Museu Camilo Sesto',
    address: 'Carrer Verge dels Desemparats, 46003 Alcoi',
  },
  'rector peset': {
    name: 'Col·legi Major Rector Peset',
    address: 'Forn de Sant Nicolau, 4, 46001 València',
  },
};

/**
 * Extracts the date line and the venue/address line located directly under it
 */
function extractAuArticleHeader(html) {
  if (!html) return null;

  const textWithNewlines = html
    .replace(/<(?:br|\/p|\/div|\/h\d|li)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&');

  const lines = textWithNewlines
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Look for the date line (e.g., "FINS AL DIUMENGE 13/9", "HASTA EL DOMINGO 4/10")
  const dateIdx = lines.findIndex(
    (l) => /^(?:fins|hasta|del|des de|des del)\b/i.test(l) && /\d{1,2}\/\d{1,2}/.test(l)
  );

  if (dateIdx === -1) return null;

  const dateLine = lines[dateIdx];
  const nextLine = lines[dateIdx + 1] || '';

  // Venue lines are short (under 80 chars) and precede the article paragraphs
  const venueLine = nextLine.length < 80 ? nextLine : '';

  return { dateLine, venueLine };
}

/**
 * Parses numeric dates from the exact date header line
 */
function parseAuDateLine(dateText) {
  if (!dateText) return null;
  const currentYear = new Date().getFullYear();
  const clean = dateText.replace(/\s+/g, ' ').toLowerCase();

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

  // Date range: "del dissabte 5/9 al dissabte 31/10"
  const rangeMatch = clean.match(
    /(?:del|des de|des del)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(?:al|fins al|hasta el)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
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

  // Single end date: "fins al 13/9", "hasta el domingo 4/10", "fins el 28/2/2027"
  const endMatch = clean.match(
    /(?:fins al|fins el|fins|hasta el|hasta|al)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
  if (endMatch) {
    let eYear = endMatch[3];
    const eMonth = parseInt(endMatch[2], 10);
    const currMonth = new Date().getMonth() + 1;
    if (!eYear && eMonth < currMonth) eYear = (currentYear + 1).toString();

    const eIso = toIso(endMatch[1], endMatch[2], eYear);
    if (eIso) return { startDate: new Date().toISOString(), endDate: eIso };
  }

  return null;
}

/**
 * Resolves the venue and address from the exact venue line
 */
function resolveVenueFromHeader(venueLine = '') {
  if (!venueLine) return { venueName: 'València', address: 'València' };

  // Structure: "L'ETNO. Corona, 36" or "MuBAV. Sant Pius V, 9"
  const split = venueLine.match(/^([^.]+)\.\s*(.*)$/);
  const rawVenue = (split ? split[1] : venueLine).trim();
  const rawAddress = (split ? split[2] : '').trim();

  const key = rawVenue.toLowerCase().replace(/['’]/g, "'");

  if (VENUE_MAP[key]) {
    return {
      venueName: VENUE_MAP[key].name,
      address: VENUE_MAP[key].address,
    };
  }

  // Fallback if not in dictionary
  const formattedVenue = rawVenue.charAt(0).toUpperCase() + rawVenue.slice(1);
  const formattedAddress = rawAddress
    ? rawAddress.toLowerCase().includes('val')
      ? rawAddress
      : `${rawAddress}, València`
    : 'València';

  return { venueName: formattedVenue, address: formattedAddress };
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
          const address =
            item.location?.address?.streetAddress ||
            item.location?.address?.addressLocality ||
            'València';
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
            img: imgEl ? imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || imgEl.src || '' : '',
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

    const headerMeta = extractAuArticleHeader(articleHtml);

    // Accurate venue and address from the exact article header line
    const { venueName, address } = resolveVenueFromHeader(headerMeta?.venueLine);

    // Accurate dates from the exact article header line
    const parsedDates = parseAuDateLine(headerMeta?.dateLine);
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

  console.log(`Parsed ${expos.length} AU-Agenda exhibitions with accurate header metadata.`);
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
