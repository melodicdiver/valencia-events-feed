const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Curated dictionary for Valencia museums, cultural centers, and stage venues
const KNOWN_VENUES = [
  // Art & Museums
  { pattern: /mubav|belles arts|bellas artes/i, name: 'Museu de Belles Arts de València (MuBAV)', address: 'Carrer de Sant Pius V, 9, 46010 València' },
  { pattern: /\bcccc\b|centre del carme/i, name: 'Centre del Carme (CCCC)', address: 'Carrer del Museu, 2, 46003 València' },
  { pattern: /\bivam\b/i, name: 'IVAM', address: 'Guillem de Castro, 118, 46003 València' },
  { pattern: /l['’]?etno|\betno\b/i, name: "L'ETNO (Museu Valencià d'Etnologia)", address: 'Carrer de la Corona, 36, 46003 València' },
  { pattern: /sala municipal/i, name: "Sala Municipal d'Exposicions", address: "Carrer de l'Arquebisbe Mayoral, 1, 46002 València" },
  { pattern: /bancaixa|bancaja/i, name: 'Fundació Bancaixa', address: 'Plaça de Tetuan, 23, 46003 València' },
  { pattern: /ateneu|ateneo/i, name: 'Ateneu Mercantil de València', address: 'Plaça de l’Ajuntament, 18, 46002 València' },
  { pattern: /reina 121/i, name: 'Espai La Reina 121', address: 'Carrer de la Reina, 121, 46011 València' },
  { pattern: /bombas gens/i, name: 'Bombas Gens Centre d’Arts Digitals', address: 'Avinguda de Burjassot, 54, 46009 València' },
  { pattern: /caixaforum/i, name: 'CaixaForum València', address: 'Carrer d’Eduardo Primo Yúfera, 1A, 46013 València' },
  { pattern: /la nau/i, name: 'La Nau Centre Cultural', address: 'Carrer de la Universitat, 2, 46003 València' },
  { pattern: /muvim/i, name: 'MuVIM', address: 'Carrer de Quevedo, 10, 46001 València' },
  { pattern: /bot[aà]nic/i, name: 'Jardí Botànic UV', address: 'Carrer de Quart, 80, 46008 València' },
  { pattern: /drassanes/i, name: 'Drassanes del Grau', address: 'Plaça de Joan Pau II, 46024 València' },
  { pattern: /almod[ií]/i, name: "L'Almodí", address: 'Plaça de Sant Lluís Bertran, 2, 46003 València' },
  { pattern: /camilo sesto/i, name: 'Museu Camilo Sesto', address: 'Alcoi' },
  { pattern: /rector peset/i, name: 'Col·legi Major Rector Peset', address: 'Forn de Sant Nicolau, 4, 46001 València' },

  // Stage & Theaters
  { pattern: /teatre el musical|\btem\b/i, name: 'Teatre El Musical (TEM)', address: 'Plaça del Rosari, 3, 46011 València' },
  { pattern: /la mutant/i, name: 'La Mutant', address: 'Carrer de Joan Verdaguer, 22, 46024 València' },
  { pattern: /las naves/i, name: 'Las Naves', address: 'Carrer de Joan Verdaguer, 16, 46024 València' },
  { pattern: /sala russafa/i, name: 'Sala Russafa', address: 'Carrer de Dénia, 55, 46006 València' },
  { pattern: /teatre talia|teatro tal[ií]a/i, name: 'Teatre Talia', address: 'Carrer dels Cavallers, 31, 46001 València' },
  { pattern: /teatre olympia|teatro olympia/i, name: 'Teatre Olympia', address: 'Carrer de Sant Vicent Màrtir, 44, 46002 València' },
  { pattern: /teatre principal|teatro principal/i, name: 'Teatre Principal', address: 'Carrer de les Barques, 15, 46002 València' },
  { pattern: /teatre rialto|teatro rialto/i, name: 'Teatre Rialto', address: 'Plaça de l’Ajuntament, 17, 46002 València' },
  { pattern: /espai inestable/i, name: 'Espai Inestable', address: 'Carrer d’Aparisi i Guijarro, 7, 46003 València' },
  { pattern: /teatre micalet/i, name: 'Teatre Micalet', address: 'Carrer del Mestre Palau, 6, 46008 València' },
  { pattern: /carme teatre/i, name: 'Carme Teatre', address: 'Carrer de Gregori Gea, 6, 46009 València' },
  { pattern: /la rambleta/i, name: 'La Rambleta', address: 'Bulevar Sur esq. Carrer Pío IX, 46017 València' },
  { pattern: /espai lagranja|la granja/i, name: 'Espai LaGranja', address: 'Passeig de la Pechina, 15, 46008 València' },
  { pattern: /palau de les arts/i, name: 'Palau de les Arts Reina Sofía', address: 'Av. del Professor López Piñero, 1, 46013 València' },
  { pattern: /palau de la m[uú]sica/i, name: 'Palau de la Música', address: 'Passeig de l’Albereda, 30, 46023 València' },
];

function toNaturalCase(str) {
  if (!str) return '';
  if (/^(IVAM|CCCC|TEM|MUVIM)$/i.test(str)) return str.toUpperCase();
  const lowerWords = new Set(['de', 'del', "d'", 'd’', 'el', 'la', 'los', 'las', 'en', 'i', 'y', 'al', 'als']);

  return str
    .toLowerCase()
    .split(/(\s+|[-–—,:;.]+)/)
    .map((w, idx) => {
      if (!w || /^\s+$/.test(w) || /^[-–—,:;.]+$/.test(w)) return w;
      if (idx > 0 && lowerWords.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join('');
}

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

  const dateIdx = lines.findIndex(
    (l) => /^(?:fins|hasta|del|des de|des del)\b/i.test(l) && /\d{1,2}\/\d{1,2}/.test(l)
  );

  if (dateIdx === -1) return null;

  const dateLine = lines[dateIdx];
  const nextLine = lines[dateIdx + 1] || '';
  const venueLine = nextLine.length < 80 ? nextLine : '';

  return { dateLine, venueLine };
}

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

function resolveVenueFromHeader(venueLine = '') {
  if (!venueLine) return { venueName: 'València', address: 'València' };

  for (const item of KNOWN_VENUES) {
    if (item.pattern.test(venueLine)) {
      return { venueName: item.name, address: item.address };
    }
  }

  const addrMatch = venueLine.match(
    /\.\s+((?:(?:pl|plaça|plaza|c\/|carrer|calle|av|avinguda|avenida|gran via|passeig|paseo)\b|[^,.]+,?\s*\d+).*)$/i
  );

  let rawVenue = venueLine;
  let rawAddress = '';

  if (addrMatch) {
    rawVenue = venueLine.slice(0, addrMatch.index).trim();
    rawAddress = addrMatch[1].trim();
  } else {
    const lastDot = venueLine.lastIndexOf('.');
    if (lastDot > 0 && lastDot < venueLine.length - 1) {
      rawVenue = venueLine.slice(0, lastDot).trim();
      rawAddress = venueLine.slice(lastDot + 1).trim();
    }
  }

  const formattedVenue = toNaturalCase(rawVenue);
  const formattedAddress = rawAddress
    ? rawAddress.toLowerCase().includes('val')
      ? rawAddress
      : `${rawAddress}, València`
    : 'València';

  return { venueName: formattedVenue, address: formattedAddress };
}

async function scrapeSongkick(page) {
  console.log('Scraping Songkick (Música)...');
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

async function scrapeAuSection(page, context, label, category, urls) {
  console.log(`Scraping AU-Agenda (${label})...`);
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

  const events = [];
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
    const { venueName, address } = resolveVenueFromHeader(headerMeta?.venueLine);

    const parsedDates = parseAuDateLine(headerMeta?.dateLine);
    const startDate = parsedDates?.startDate || now.toISOString();
    const endDate = parsedDates?.endDate || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

    events.push({
      id: `au-${category}-${events.length + 1}-${Date.now()}`,
      title: card.title,
      description: card.desc ? card.desc.slice(0, 180) : `${label} a ${venueName}`,
      category: category,
      startDate,
      endDate,
      venueName,
      address,
      imageUrl: card.img || undefined,
      isFree: false,
      ticketPrice: undefined,
      ticketUrl: card.link || urls[0],
      url: card.link || urls[0],
    });
  }

  console.log(`Parsed ${events.length} items from ${label}.`);
  return events;
}

async function main() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // 1. Music (Songkick)
  const musicEvents = await scrapeSongkick(page);

  // 2. Exhibitions (AU-Agenda)
  const expoEvents = await scrapeAuSection(page, context, 'Exposicions', 'exposicions', [
    'https://au-agenda.com/exposicions/',
    'https://au-agenda.com/exposicions/page/2/',
  ]);

  // 3. Stage & Theater (AU-Agenda)
  const stageEvents = await scrapeAuSection(page, context, 'Escèniques', 'teatre', [
    'https://au-agenda.com/esceniques/',
    'https://au-agenda.com/esceniques/page/2/',
  ]);

  await browser.close();

  const combined = [...musicEvents, ...expoEvents, ...stageEvents];
  console.log(`Total events consolidated: ${combined.length}`);

  const outDir = path.join(__dirname, 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'events.json');

  // Safety: never overwrite good data with an empty file if network/scraping drops
  if (combined.length === 0 && fs.existsSync(outPath)) {
    console.warn('Scraper collected 0 events; keeping previous events.json to avoid downtime.');
    return;
  }

  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2), 'utf-8');
  console.log('Saved consolidated feed to public/events.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
