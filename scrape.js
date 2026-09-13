const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Curated dictionary for Valencia museums, cultural centers, and theaters
const KNOWN_VENUES = [
  // Major Museums & Cultural Centers
  { pattern: /\bcahh\b|hortensia herrero/i, name: 'CAHH', address: 'Carrer del Mar, 31, 46003 València' },
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
  { pattern: /teatre talia|teatro tal[ií]a|\bt\.?\s*talia/i, name: 'Teatre Talia', address: 'Carrer dels Cavallers, 31, 46001 València' },
  { pattern: /c[ií]rculo|\bt\.?\s*c[ií]rculo/i, name: 'Teatre Círculo', address: 'Carrer de Prudenci Alcón i Mateu, 3, 46008 València' },
  { pattern: /flumen|\bt\.?\s*flumen/i, name: 'Teatre Flumen', address: 'Carrer de Gregori Gea, 15, 46009 València' },
  { pattern: /teatre olympia|teatro olympia|\bt\.?\s*olympia/i, name: 'Teatre Olympia', address: 'Carrer de Sant Vicent Màrtir, 44, 46002 València' },
  { pattern: /teatre principal|teatro principal|\bt\.?\s*principal/i, name: 'Teatre Principal', address: 'Carrer de les Barques, 15, 46002 València' },
  { pattern: /teatre rialto|teatro rialto|\bt\.?\s*rialto/i, name: 'Teatre Rialto', address: 'Plaça de l’Ajuntament, 17, 46002 València' },
  { pattern: /teatre micalet|\bt\.?\s*micalet/i, name: 'Teatre Micalet', address: 'Carrer del Mestre Palau, 6, 46008 València' },
  { pattern: /carme teatre/i, name: 'Carme Teatre', address: 'Carrer de Gregori Gea, 6, 46009 València' },
  { pattern: /sala off|\boff\b/i, name: 'Sala Off', address: 'Carrer del Túria, 47, 46008 València' },
  { pattern: /espai lagranja|la granja/i, name: 'Espai LaGranja', address: 'Passeig de la Pechina, 15, 46008 València' },
  { pattern: /palau de les arts|les arts/i, name: 'Palau de les Arts Reina Sofía', address: 'Av. del Professor López Piñero, 1, 46013 València' },
  { pattern: /palau de la m[uú]sica/i, name: 'Palau de la Música', address: 'Passeig de l’Albereda, 30, 46023 València' },
  { pattern: /jardins del palau/i, name: 'Jardins del Palau', address: 'Passeig de l’Albereda, 30, 46023 València' },
];

const MONTH_MAP = {
  ene: 1, ener: 1, enero: 1, gen: 1, gener: 1,
  feb: 2, febr: 2, febrero: 2, febrer: 2,
  mar: 3, marzo: 3, març: 3,
  abr: 4, abril: 4,
  may: 5, mayo: 5, mai: 5, maig: 5,
  jun: 6, junio: 6, juny: 6,
  jul: 7, julio: 7, juliol: 7,
  ago: 8, agos: 8, agosto: 8, agost: 8,
  sep: 9, set: 9, sept: 9, septiembre: 9, setembre: 9,
  oct: 10, octubre: 10,
  nov: 11, novi: 11, noviembre: 11, novembre: 11,
  dic: 12, des: 12, dici: 12, diciembre: 12, desembre: 12,
};

function toNaturalCase(str) {
  if (!str) return '';
  if (/^(IVAM|CCCC|TEM|MUVIM|CAHH|VCF|LUD)$/i.test(str)) return str.toUpperCase();
  const lowerWords = new Set(['de', 'del', "d'", 'd’', 'el', 'la', 'los', 'las', 'en', 'i', 'y', 'al', 'als', 'vs', 'a']);

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

function parseSpanishDateToIso(dayStr, monthStr, yearStr) {
  const currentYear = new Date().getFullYear();
  const d = parseInt(dayStr, 10);
  let m = NaN;

  if (monthStr) {
    const cleanM = monthStr.toLowerCase().trim().replace('.', '');
    if (/^\d+$/.test(cleanM)) {
      m = parseInt(cleanM, 10);
    } else {
      m = MONTH_MAP[cleanM.slice(0, 4)] || MONTH_MAP[cleanM.slice(0, 3)] || NaN;
    }
  }

  let y = currentYear;
  if (yearStr) {
    const yNum = parseInt(yearStr, 10);
    y = yNum < 100 ? 2000 + yNum : yNum;
  }

  if (isNaN(d) || isNaN(m) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d, 19, 0, 0));
  return isNaN(dt.getTime()) ? null : dt.toISOString();
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

  const dateIdx = lines.findIndex((l) => {
    if (!/\b\d{1,2}(?:\/\d{1,2})+\b/.test(l)) return false;
    return /(?:fins|hasta|del|des de|des del|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i.test(l);
  });

  if (dateIdx === -1) return null;

  const dateLine = lines[dateIdx];
  const candidateVenueLines = [];
  for (let i = dateIdx + 1; i < Math.min(dateIdx + 4, lines.length); i++) {
    const line = lines[i];
    if (line.length > 90) break;
    if (line.length > 2) candidateVenueLines.push(line);
  }

  return { dateLine, candidateVenueLines };
}

function parseAuDateLine(dateText) {
  if (!dateText) return null;
  const currentYear = new Date().getFullYear();
  const clean = dateText.replace(/\s+/g, ' ').toLowerCase();

  const toIso = (day, month, yearStr) => parseSpanishDateToIso(day, month, yearStr);

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

  const rangeSharedMonth = clean.match(
    /(?:del|des de|des del)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\s+(?:al|fins al|hasta el)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
  if (rangeSharedMonth) {
    const sIso = toIso(rangeSharedMonth[1], rangeSharedMonth[3], rangeSharedMonth[4]);
    const eIso = toIso(rangeSharedMonth[2], rangeSharedMonth[3], rangeSharedMonth[4]);
    if (sIso && eIso) return { startDate: sIso, endDate: eIso };
  }

  const consecutiveDays = clean.match(
    /(\d{1,2})\s+(?:y|i)\s+(?:[a-zçà-ú]+\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i
  );
  if (consecutiveDays) {
    const sIso = toIso(consecutiveDays[1], consecutiveDays[3], consecutiveDays[4]);
    const eIso = toIso(consecutiveDays[2], consecutiveDays[3], consecutiveDays[4]);
    if (sIso && eIso) return { startDate: sIso, endDate: eIso };
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

  const singleDate = clean.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
  if (singleDate) {
    const iso = toIso(singleDate[1], singleDate[2], singleDate[3]);
    if (iso) return { startDate: iso, endDate: undefined };
  }

  return null;
}

function resolveVenueFromCandidateLines(rawCandidateLines = []) {
  if (!rawCandidateLines || rawCandidateLines.length === 0) {
    return { venueName: 'València', address: 'València' };
  }

  const candidateLines = rawCandidateLines.map((line) =>
    line
      .replace(/^T\.\s*/i, 'Teatre ')
      .replace(/^E\.\s*/i, 'Espai ')
      .replace(/^F\.\s*/i, 'Fundació ')
      .replace(/^S\.\s*/i, 'Sala ')
      .replace(/^M\.\s*/i, 'Museu ')
      .trim()
  );

  for (const line of candidateLines) {
    for (const item of KNOWN_VENUES) {
      if (item.pattern.test(line)) {
        return { venueName: item.name, address: item.address };
      }
    }
  }

  for (const line of candidateLines) {
    const plazaMatch = line.match(/^(?:pl|plaça|plaza)\.?\s+(.*)$/i);
    if (plazaMatch) {
      const plazaName = toNaturalCase(`Plaça de ${plazaMatch[1].trim()}`);
      return { venueName: plazaName, address: `${plazaName}, València` };
    }
  }

  for (const line of candidateLines) {
    const dotSplit = line.match(/^([^.]{3,})\.\s+(.*)$/);
    if (dotSplit) {
      const rawV = dotSplit[1].trim();
      const rawA = dotSplit[2].trim();
      return {
        venueName: toNaturalCase(rawV),
        address: rawA.toLowerCase().includes('val') ? rawA : `${rawA}, València`,
      };
    }
  }

  return {
    venueName: toNaturalCase(candidateLines[0]),
    address: 'València',
  };
}

// 1. Music (Songkick)
async function scrapeSongkick(page, context) {
  console.log('Scraping Songkick (Música - 31-Day Rolling Window)...');

  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  cutoffDate.setUTCHours(23, 59, 59, 999);
  const startFloor = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const events = [];
  const seenEventUrls = new Set();
  const MAX_PAGES = 3;

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const targetUrl =
      pageNum === 1
        ? 'https://www.songkick.com/metro-areas/28802-spain-valencia'
        : `https://www.songkick.com/metro-areas/28802-spain-valencia?page=${pageNum}`;

    console.log(`Fetching Songkick page ${pageNum}: ${targetUrl}`);

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (err) {
      console.warn(`Songkick navigation timeout on page ${pageNum}: ${err.message}`);
      break;
    }

    const rawLdScripts = await page.$$eval('script[type="application/ld+json"]', (scripts) =>
      scripts.map((s) => s.textContent || '')
    );

    let foundEventsOnPage = 0;
    let maxDateOnPage = 0;

    for (const raw of rawLdScripts) {
      try {
        const data = JSON.parse(raw);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (item['@type'] === 'MusicEvent') {
            const eventUrl = item.url || '';
            if (eventUrl && seenEventUrls.has(eventUrl)) continue;
            if (eventUrl) seenEventUrls.add(eventUrl);

            const venue = item.location?.name || 'València';
            const address =
              item.location?.address?.streetAddress ||
              item.location?.address?.addressLocality ||
              'València';
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            const price = offer?.price ? `${offer.price}€` : undefined;
            const rawImg = Array.isArray(item.image) ? item.image[0] : item.image;

            let validImg = undefined;
            if (rawImg && typeof rawImg === 'string') {
              try {
                const res = await context.request.get(rawImg, { maxRedirects: 5 });
                const finalUrl = res.url();
                const buffer = await res.body();
                const isPlaceholder =
                  finalUrl.includes('default') ||
                  finalUrl.includes('placeholder') ||
                  finalUrl.includes('assets.sk-static.com') ||
                  buffer.length < 3500;

                if (res.ok() && !isPlaceholder) validImg = rawImg;
              } catch (_) {
                validImg = rawImg;
              }
            }

            let startDateIso = new Date().toISOString();
            let endDateIso = undefined;
            let eventDateObj = null;

            if (item.startDate) {
              const rawStr = String(item.startDate).trim();
              const match = rawStr.match(/^(\d{4})-(\d{2})-(\d{2})/);

              if (match) {
                const y = parseInt(match[1], 10);
                const m = parseInt(match[2], 10);
                const d = parseInt(match[3], 10);

                eventDateObj = new Date(Date.UTC(y, m - 1, d, 19, 0, 0));
                startDateIso = eventDateObj.toISOString();

                if (item.endDate) {
                  const rawEnd = new Date(item.endDate);
                  const rawStart = new Date(item.startDate);
                  if (!isNaN(rawEnd.getTime()) && !isNaN(rawStart.getTime())) {
                    const durationHours = (rawEnd.getTime() - rawStart.getTime()) / (1000 * 60 * 60);
                    if (durationHours > 24) endDateIso = rawEnd.toISOString();
                  }
                }
              }
            }

            if (!eventDateObj) continue;

            if (eventDateObj.getTime() > maxDateOnPage) {
              maxDateOnPage = eventDateObj.getTime();
            }

            if (eventDateObj < startFloor || eventDateObj > cutoffDate) continue;

            foundEventsOnPage++;
            events.push({
              id: `sk-${events.length + 1}-${Date.now()}`,
              title: item.name || 'Concierto en Valencia',
              description: `Concierto en directo en ${venue}`,
              category: 'musica',
              startDate: startDateIso,
              endDate: endDateIso,
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

    console.log(`Page ${pageNum}: Ingested ${foundEventsOnPage} valid concerts.`);
    if (maxDateOnPage > cutoffDate.getTime()) break;
  }

  console.log(`Parsed ${events.length} total Songkick concerts.`);
  return events;
}

// 2. Cultural Agenda (Expos & Stage)
async function scrapeAuSection(page, context, label, category, urls) {
  console.log(`Scraping AU-Agenda (${label})...`);
  const rawCards = [];

  for (const url of urls) {
    try {
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
        if (res.ok()) articleHtml = await res.text();
      } catch (_) {}
    }

    const headerMeta = extractAuArticleHeader(articleHtml);
    const { venueName, address } = resolveVenueFromCandidateLines(headerMeta?.candidateVenueLines);

    const parsedDates = parseAuDateLine(headerMeta?.dateLine);
    const startDate = parsedDates?.startDate || now.toISOString();
    const endDate = parsedDates?.endDate;

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

// 3. Sports: Valencia CF (Mestalla Home Matches)
async function scrapeValenciaCF(page, context) {
  console.log('Scraping Valencia CF (Mestalla Tickets)...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://www.valenciacf.com/tickets', { waitUntil: 'domcontentloaded', timeout: 45000 });

    const matches = await page.evaluate(() => {
      const items = [];
      const blocks = document.querySelectorAll('[class*="match"], [class*="Match"], article, .card');

      blocks.forEach((b) => {
        const text = b.innerText || '';
        if (/Mestalla/i.test(text) && /Valencia/i.test(text)) {
          const btn = b.querySelector('a[href*="ticket"], a[href*="entradas"], a');
          const img = b.querySelector('img');
          items.push({
            rawText: text,
            link: btn ? btn.href : 'https://www.valenciacf.com/tickets',
            img: img ? img.src : '',
          });
        }
      });
      return items;
    });

    for (const m of matches) {
      const dateMatch = m.rawText.match(/(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,9})(?:\s+(\d{4}))?/i);
      if (!dateMatch) continue;

      const iso = parseSpanishDateToIso(dateMatch[1], dateMatch[2], dateMatch[3]);
      if (!iso) continue;

      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      let opponent = 'LaLiga Match';
      const lines = m.rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const l of lines) {
        if (!/valencia|mestalla|ticket|entradas|laliga|vip|jornada|\d{1,2}:\d{2}/i.test(l) && l.length > 2 && l.length < 35) {
          opponent = l;
          break;
        }
      }

      events.push({
        id: `vcf-${events.length + 1}-${Date.now()}`,
        title: `Valencia CF vs ${toNaturalCase(opponent)}`,
        description: `Partido oficial en el Camp de Mestalla contra ${opponent}`,
        category: 'esports',
        startDate: iso,
        venueName: 'Estadio de Mestalla',
        address: 'Avinguda de Suècia, s/n, 46010 València',
        imageUrl: m.img || undefined,
        isFree: false,
        ticketUrl: m.link,
        url: m.link,
      });
    }
  } catch (err) {
    console.warn(`Valencia CF scraping skipped: ${err.message}`);
  }

  console.log(`Parsed ${events.length} Valencia CF home matches.`);
  return events;
}

// 4. Sports: Levante UD (Ciutat de València Home Matches)
async function scrapeLevanteUD(page, context) {
  console.log('Scraping Levante UD (Ciutat de València Tickets)...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://ticketing.levanteud.com/es/liga-ea-sports', { waitUntil: 'domcontentloaded', timeout: 45000 });

    const matches = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('.event-card, .match-card, [class*="card"], article');

      cards.forEach((c) => {
        const text = c.innerText || '';
        const btn = c.querySelector('a');
        const img = c.querySelector('img');
        if (text.length > 5) {
          items.push({
            text,
            link: btn ? btn.href : 'https://ticketing.levanteud.com',
            img: img ? img.src : '',
          });
        }
      });
      return items;
    });

    for (const m of matches) {
      const dateMatch = m.text.match(/(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,9})(?:\s+(\d{4}))?/i);
      if (!dateMatch) continue;

      const iso = parseSpanishDateToIso(dateMatch[1], dateMatch[2], dateMatch[3]);
      if (!iso) continue;

      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      let opponent = 'Rival';
      const lines = m.text.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const l of lines) {
        if (!/levante|ciutat|valencia|ticket|comprar|entradas|abono|\d{1,2}:\d{2}/i.test(l) && l.length > 2 && l.length < 35) {
          opponent = l;
          break;
        }
      }

      events.push({
        id: `lud-${events.length + 1}-${Date.now()}`,
        title: `Levante UD vs ${toNaturalCase(opponent)}`,
        description: `Partido en el Estadi Ciutat de València frente a ${opponent}`,
        category: 'esports',
        startDate: iso,
        venueName: 'Estadi Ciutat de València',
        address: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
        imageUrl: m.img || undefined,
        isFree: false,
        ticketUrl: m.link,
        url: m.link,
      });
    }
  } catch (err) {
    console.warn(`Levante UD scraping skipped: ${err.message}`);
  }

  console.log(`Parsed ${events.length} Levante UD home matches.`);
  return events;
}

// 5. Sports: Valencia Basket (Fonteta / Roig Arena Home Matches)
async function scrapeValenciaBasket(page, context) {
  console.log('Scraping Valencia Basket (Calendari)...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://www.valenciabasket.com/ca/calendario', { waitUntil: 'domcontentloaded', timeout: 45000 });

    const matchEntries = await page.evaluate(() => {
      const items = [];
      const blocks = document.querySelectorAll('li, tr, [class*="partit"], [class*="match"], .evento');

      blocks.forEach((b) => {
        const text = b.innerText || '';
        // Home game check: Valencia Basket or Valencia BC listed first
        const isHome = /Valencia\s*(Basket|BC)\s*(\.|-|\d|vs)/i.test(text) || /Fonteta|Roig Arena/i.test(text);
        if (isHome) {
          const link = b.querySelector('a');
          const img = b.querySelector('img');
          items.push({
            text,
            link: link ? link.href : 'https://www.valenciabasket.com/ca/calendario',
            img: img ? img.src : '',
          });
        }
      });
      return items;
    });

    for (const m of matchEntries) {
      const dateMatch = m.text.match(/(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,9})(?:\s+(\d{4}))?/i);
      if (!dateMatch) continue;

      const iso = parseSpanishDateToIso(dateMatch[1], dateMatch[2], dateMatch[3]);
      if (!iso) continue;

      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      const lines = m.text.split('\n').map((l) => l.trim()).filter(Boolean);
      let rival = 'Basket Match';
      for (const l of lines) {
        if (!/valencia|basket|fonteta|roig|entradas|ticket|masculino|femenino|jornada|\d{1,2}:\d{2}/i.test(l) && l.length > 2 && l.length < 35) {
          rival = l;
          break;
        }
      }

      events.push({
        id: `vbc-${events.length + 1}-${Date.now()}`,
        title: `Valencia Basket vs ${toNaturalCase(rival)}`,
        description: `Partido oficial de baloncesto en València frente a ${rival}`,
        category: 'esports',
        startDate: iso,
        venueName: /roig/i.test(m.text) ? 'Roig Arena' : 'Pavelló Font de Sant Lluís',
        address: 'Avinguda dels Germans Maristes, 16, 46013 València',
        imageUrl: m.img || undefined,
        isFree: false,
        ticketUrl: m.link,
        url: m.link,
      });
    }
  } catch (err) {
    console.warn(`Valencia Basket scraping skipped: ${err.message}`);
  }

  console.log(`Parsed ${events.length} Valencia Basket home games.`);
  return events;
}

// 6. Sports: FDM València (Races, Athletics, Municipal Events)
async function scrapeFdmValencia(page, context) {
  console.log('Scraping FDM València (Esports & Curses)...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://www.fdmvalencia.es/es/eventos/', { waitUntil: 'domcontentloaded', timeout: 45000 });

    const cards = await page.$$eval('article, .evento, .type-evento, .post', (nodes) =>
      nodes.map((el) => {
        const titleEl = el.querySelector('h2, h3, .entry-title');
        const linkEl = el.querySelector('a');
        const imgEl = el.querySelector('img');
        const descEl = el.querySelector('p, .entry-summary');

        return {
          title: titleEl ? titleEl.textContent.trim() : '',
          link: linkEl ? linkEl.href : 'https://www.fdmvalencia.es/es/eventos/',
          img: imgEl ? imgEl.src || imgEl.getAttribute('data-src') || '' : '',
          desc: descEl ? descEl.textContent.trim() : '',
          fullText: el.innerText || '',
        };
      })
    );

    for (const card of cards) {
      if (!card.title || card.title.length < 3) continue;

      const dateMatch = card.fullText.match(/(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,9})(?:\s+(\d{4}))?/i);
      if (!dateMatch) continue;

      const iso = parseSpanishDateToIso(dateMatch[1], dateMatch[2], dateMatch[3]);
      if (!iso) continue;

      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      events.push({
        id: `fdm-${events.length + 1}-${Date.now()}`,
        title: toNaturalCase(card.title),
        description: card.desc ? card.desc.slice(0, 180) : `Cita deportiva en València: ${card.title}`,
        category: 'esports',
        startDate: iso,
        venueName: 'Ciutat de València',
        address: 'València, España',
        imageUrl: card.img || undefined,
        isFree: false,
        ticketUrl: card.link,
        url: card.link,
      });
    }
  } catch (err) {
    console.warn(`FDM València scraping skipped: ${err.message}`);
  }

  console.log(`Parsed ${events.length} FDM València sporting events.`);
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

  // 1. Music (Songkick - Rolling 31 Days)
  const musicEvents = await scrapeSongkick(page, context).catch(() => []);

  // 2. Exhibitions (AU-Agenda)
  const expoEvents = await scrapeAuSection(page, context, 'Exposicions', 'exposicions', [
    'https://au-agenda.com/exposicions/',
    'https://au-agenda.com/exposicions/page/2/',
  ]).catch(() => []);

  // 3. Stage & Theater (AU-Agenda)
  const stageEvents = await scrapeAuSection(page, context, 'Escèniques', 'teatre', [
    'https://au-agenda.com/esceniques/',
    'https://au-agenda.com/esceniques/page/2/',
  ]).catch(() => []);

  // 4. Sports (Valencia CF, Levante UD, Valencia Basket, FDM València)
  const vcfEvents = await scrapeValenciaCF(page, context).catch(() => []);
  const ludEvents = await scrapeLevanteUD(page, context).catch(() => []);
  const vbcEvents = await scrapeValenciaBasket(page, context).catch(() => []);
  const fdmEvents = await scrapeFdmValencia(page, context).catch(() => []);

  await browser.close();

  const combined = [
    ...musicEvents,
    ...expoEvents,
    ...stageEvents,
    ...vcfEvents,
    ...ludEvents,
    ...vbcEvents,
    ...fdmEvents,
  ];

  console.log(`Total events consolidated: ${combined.length}`);

  // Deduplication by title + venue key
  const seen = new Map();
  for (const ev of combined) {
    const key = `${ev.title.toLowerCase().trim()}_${(ev.startDate || '').slice(0, 10)}`;
    if (!seen.has(key)) seen.set(key, ev);
  }

  const finalEvents = Array.from(seen.values()).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const outDir = path.join(__dirname, 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'events.json');

  if (finalEvents.length === 0 && fs.existsSync(outPath)) {
    console.warn('Scraper collected 0 events; keeping previous events.json.');
    return;
  }

  fs.writeFileSync(outPath, JSON.stringify(finalEvents, null, 2), 'utf-8');
  console.log(`Saved ${finalEvents.length} consolidated events to public/events.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
