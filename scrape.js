const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Curated dictionary for Valencia museums, cultural centers, and theaters
const KNOWN_VENUES = [
  // Major Museums & Cultural Centers
  { pattern: /mubav|belles arts|bellas artes/i, name: 'Museu de Belles Arts de València (MuBAV)', address: 'Carrer de Sant Pius V, 9, 46010 València' },
  { pattern: /\bcccc\b|centre del carme/i, name: 'Centre del Carme (CCCC)', address: 'Carrer del Museu, 2, 46003 València' },
  { pattern: /\bivam\b/i, name: 'IVAM', address: 'Guillem de Castro, 118, 46003 València' },
  { pattern: /l['’]?etno|\betno\b/i, name: "L'ETNO (Museu Valencià d'Etnologia)", address: 'Carrer de la Corona, 36, 46003 València' },
  { pattern: /sala municipal/i, name: "Sala Municipal d'Exposicions", address: "Carrer de l'Arquebisbe Mayoral, 1, 46002 València" },
  { pattern: /bancaixa|bancaja|\bf\.?\s*banca/i, name: 'Fundació Bancaixa', address: 'Plaça de Tetuan, 23, 46003 València' },
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

  // Stage, Theaters & Venues
  { pattern: /rambleta/i, name: 'La Rambleta', address: 'Bulevar Sur esq. Carrer Pío IX, 46017 València' },
  { pattern: /espai inestable|\be\.?\s*inestable\b/i, name: 'Espai Inestable', address: 'Carrer d’Aparisi i Guijarro, 7, 46003 València' },
  { pattern: /teatre el musical|\btem\b/i, name: 'Teatre El Musical (TEM)', address: 'Plaça del Rosari, 3, 46011 València' },
  { pattern: /la mutant/i, name: 'La Mutant', address: 'Carrer de Joan Verdaguer, 22, 46024 València' },
  { pattern: /las naves/i, name: 'Las Naves', address: 'Carrer de Joan Verdaguer, 16, 46024 València' },
  { pattern: /sala russafa/i, name: 'Sala Russafa', address: 'Carrer de Dénia, 55, 46006 València' },
  { pattern: /teatre talia|teatro tal[ií]a/i, name: 'Teatre Talia', address: 'Carrer dels Cavallers, 31, 46001 València' },
  { pattern: /teatre olympia|teatro olympia/i, name: 'Teatre Olympia', address: 'Carrer de Sant Vicent Màrtir, 44, 46002 València' },
  { pattern: /teatre principal|teatro principal/i, name: 'Teatre Principal', address: 'Carrer de les Barques, 15, 46002 València' },
  { pattern: /teatre rialto|teatro rialto/i, name: 'Teatre Rialto', address: 'Plaça de l’Ajuntament, 17, 46002 València' },
  { pattern: /teatre micalet/i, name: 'Teatre Micalet', address: 'Carrer del Mestre Palau, 6, 46008 València' },
  { pattern: /carme teatre/i, name: 'Carme Teatre', address: 'Carrer de Gregori Gea, 6, 46009 València' },
  { pattern: /espai lagranja|la granja/i, name: 'Espai LaGranja', address: 'Passeig de la Pechina, 15, 46008 València' },
  { pattern: /palau de les arts|les arts/i, name: 'Palau de les Arts Reina Sofía', address: 'Av. del Professor López Piñero, 1, 46013 València' },
  { pattern: /palau de la m[uú]sica/i, name: 'Palau de la Música', address: 'Passeig de l’Albereda, 30, 46023 València' },
  { pattern: /jardins del palau/i, name: 'Jardins del Palau', address: 'Passeig de l’Albereda, 30, 46023 València' },
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

/**
 * Robust header extractor that catches all weekday formats and multi-line venues
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

  // Matches date lines starting with prepositions OR weekdays:
  // "DEL DIMARTS 1 AL DIUMENGE 20/9", "VIERNES 25 Y SÁBADO 26/9", "FINS AL 13/9"
  const dateIdx = lines.findIndex((l) => {
    if (!/\b\d{1,2}(?:\/\d{1,2})+\b/.test(l)) return false;
    return /(?:fins|hasta|del|des de|des del|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i.test(l);
  });

  if (dateIdx === -1) return null;

  const dateLine = lines[dateIdx];

  // Collect candidate venue lines (short non-paragraph lines immediately below date)
  const candidateVenueLines = [];
  for (let i = dateIdx + 1; i < Math.min(dateIdx + 4, lines.length); i++) {
    const line = lines[i];
    if (line.length > 90) break; // Paragraph text starts
    if (line.length > 2) candidateVenueLines.push(line);
  }

  return { dateLine, candidateVenueLines };
}

/**
 * Flexible date parser for ranges, consecutive days, and shared-month strings
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

  // 1. Explicit range with both months: "del dissabte 5/9 al dissabte 31/10"
  const rangeBothMonths = clean.match(
    /(?:del|des de|des del)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(?:al|fins al|hasta el)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
  if (rangeBothMonths) {
    let sYear = rangeBothMonths[3];
    let eYear = rangeBothMonths[6];
    const sMonth = parseInt(rangeBothMonths[2], 10);
    const eMonth = parseInt(rangeBothMonths[5], 10);
    if (!eYear && sMonth > eMonth) eYear = (currentYear + 1).toString();
    const sIso = toIso(rangeBothMonths[1], rangeBothMonths[2], sYear);
    const eIso = toIso(rangeBothMonths[4], rangeBothMonths[5], eYear);
    if (eIso) return { startDate: sIso || new Date().toISOString(), endDate: eIso };
  }

  // 2. Range sharing month: "del dimarts 1 al diumenge 20/9"
  const rangeSharedMonth = clean.match(
    /(?:del|des de|des del)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\s+(?:al|fins al|hasta el)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
  if (rangeSharedMonth) {
    const sIso = toIso(rangeSharedMonth[1], rangeSharedMonth[3], rangeSharedMonth[4]);
    const eIso = toIso(rangeSharedMonth[2], rangeSharedMonth[3], rangeSharedMonth[4]);
    if (sIso && eIso) return { startDate: sIso, endDate: eIso };
  }

  // 3. Consecutive days: "viernes 25 y sábado 26/9" or "dissabte 5 i diumenge 6/9"
  const consecutiveDays = clean.match(
    /(\d{1,2})\s+(?:y|i)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
  if (consecutiveDays) {
    const sIso = toIso(consecutiveDays[1], consecutiveDays[3], consecutiveDays[4]);
    const eIso = toIso(consecutiveDays[2], consecutiveDays[3], consecutiveDays[4]);
    if (sIso && eIso) return { startDate: sIso, endDate: eIso };
  }

  // 4. Single end date: "fins al 13/9", "hasta el domingo 4/10"
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

  // 5. Single date: "dijous 24/9"
  const singleDate = clean.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
  if (singleDate) {
    const iso = toIso(singleDate[1], singleDate[2], singleDate[3]);
    if (iso) return { startDate: iso, endDate: iso };
  }

  return null;
}

/**
 * Resolves venue and address across all header lines without treating 'Pl.' as a venue abbreviation
 */
function resolveVenueFromCandidateLines(candidateLines = []) {
  if (!candidateLines || candidateLines.length === 0) {
    return { venueName: 'València', address: 'València' };
  }

  // 1. Check all candidate lines against our verified venues dictionary
  for (const line of candidateLines) {
    for (const item of KNOWN_VENUES) {
      if (item.pattern.test(line)) {
        return { venueName: item.name, address: item.address };
      }
    }
  }

  // 2. Check for public squares / plazas (e.g. "PL. NÀPOLS I SICÍLIA")
  for (const line of candidateLines) {
    const plazaMatch = line.match(/^(?:pl|plaça|plaza)\.?\s+(.*)$/i);
    if (plazaMatch) {
      const plazaName = toNaturalCase(`Plaça de ${plazaMatch[1].trim()}`);
      return { venueName: plazaName, address: `${plazaName}, València` };
    }
  }

  // 3. Fallback: Parse "[VENUE]. [ADDRESS]" where the address starts after the dot
  for (const line of candidateLines) {
    const dotSplit = line.match(/^([^.]+)\.\s+(.*)$/);
    if (dotSplit) {
      const rawV = dotSplit[1].trim();
      const rawA = dotSplit[2].trim();
      return {
        venueName: toNaturalCase(rawV),
        address: rawA.toLowerCase().includes('val') ? rawA : `${rawA}, València`,
      };
    }
  }

  // 4. Single unpunctuated venue name (e.g. "Poblats Marítims")
  return {
    venueName: toNaturalCase(candidateLines[0]),
    address: 'València',
  };
}

async function scrapeSongkick(page, context) {
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
          const rawImg = Array.isArray(item.image) ? item.image[0] : item.image;

          // Check if Songkick image is a real photo or a default blank silhouette
          let validImg = undefined;
          if (rawImg && typeof rawImg === 'string') {
            try {
              const res = await context.request.get(rawImg, { maxRedirects: 3 });
              const finalUrl = res.url();
              const isDefaultPlaceholder =
                finalUrl.includes('default') ||
                finalUrl.includes('placeholder') ||
                finalUrl.includes('avatar-artist') ||
                finalUrl.includes('silhouette');

              if (res.ok() && !isDefaultPlaceholder) {
                validImg = rawImg;
              }
            } catch (_) {}
          }

          events.push({
            id: `sk-${events.length + 1}-${Date.now()}`,
            title: item.name || 'Concierto en Valencia',
            description: `Concierto en directo en ${venue}`,
            category: 'musica',
            startDate: item.startDate ? new Date(item.startDate).toISOString() : new Date().toISOString(),
            endDate: item.endDate ? new Date(item.endDate).toISOString() : undefined,
            venueName: venue,
            address: address,
            imageUrl: validImg,
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
    const { venueName, address } = resolveVenueFromCandidateLines(headerMeta?.candidateVenueLines);

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

  const musicEvents = await scrapeSongkick(page);

  const expoEvents = await scrapeAuSection(page, context, 'Exposicions', 'exposicions', [
    'https://au-agenda.com/exposicions/',
    'https://au-agenda.com/exposicions/page/2/',
  ]);

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

  if (combined.length === 0 && fs.existsSync(outPath)) {
    console.warn('Scraper collected 0 events; keeping previous events.json.');
    return;
  }

  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2), 'utf-8');
  console.log('Saved consolidated feed to public/events.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
