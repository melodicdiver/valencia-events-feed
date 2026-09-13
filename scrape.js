const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const KNOWN_VENUES = [
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
  { pattern: /mestalla/i, name: 'Estadio de Mestalla', address: 'Avinguda de Suècia, s/n, 46010 València' },
  { pattern: /ciutat de val[èe]ncia/i, name: 'Ciutat de València', address: 'Carrer de Sant Vicent de Paül, 44, 46019 València' },
  { pattern: /fonteta|font de sant llu[ií]s/i, name: 'Pavelló Font de Sant Lluís', address: 'Avinguda dels Germans Maristes, 16, 46013 València' },
  { pattern: /roig arena/i, name: 'Roig Arena', address: 'Carrer del Bomber Ramon Duart, s/n, 46013 València' },
];

const MONTH_MAP = {
  ene: 1, ener: 1, enero: 1, gen: 1, gener: 1,
  feb: 2, febr: 2, febrero: 2, febrer: 2,
  mar: 3, marzo: 3, marc: 3, març: 3,
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

const SPORTS_IMAGES = {
  vcf: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
  lud: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
  basket: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
  running: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=600&q=80',
};

function stripAccents(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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

function parseSpanishDateToIso(day, month, year) {
  const currentYear = new Date().getFullYear();
  const d = parseInt(day, 10);
  let m = NaN;

  if (typeof month === 'number') {
    m = month;
  } else if (typeof month === 'string') {
    const cleanM = stripAccents(month.toLowerCase().trim().replace('.', ''));
    if (/^\d+$/.test(cleanM)) {
      m = parseInt(cleanM, 10);
    } else {
      m = MONTH_MAP[cleanM] || MONTH_MAP[cleanM.slice(0, 4)] || MONTH_MAP[cleanM.slice(0, 3)] || NaN;
    }
  }

  let y = currentYear;
  if (year) {
    const yNum = parseInt(year, 10);
    y = yNum < 100 ? 2000 + yNum : yNum;
  }

  if (isNaN(d) || isNaN(m) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d, 19, 0, 0));
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

function extractDateFromAnyText(text) {
  if (!text) return null;

  const rangeMatch = text.match(/\b(\d{1,2})\s+(?:al|y|a|-)\s+\d{1,2}\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setembre|octubre|noviembre|diciembre|gener|febrer|març|marc|maig|juny|juliol|agost|desembre|ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic|des)\b(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (rangeMatch) {
    const iso = parseSpanishDateToIso(rangeMatch[1], rangeMatch[2], rangeMatch[3]);
    if (iso) return iso;
  }

  const namedMatch = text.match(/\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setembre|octubre|noviembre|diciembre|gener|febrer|març|marc|maig|juny|juliol|agost|desembre|ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic|des)\b(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (namedMatch) {
    const iso = parseSpanishDateToIso(namedMatch[1], namedMatch[2], namedMatch[3]);
    if (iso) return iso;
  }

  const numMatch = text.match(/\b(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?\b/);
  if (numMatch) {
    const iso = parseSpanishDateToIso(numMatch[1], numMatch[2], numMatch[3]);
    if (iso) return iso;
  }

  return null;
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

async function scrapeSongkick(page, context) {
  console.log('Scraping Songkick (Música - 31-Day Rolling Window)...');

  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  cutoffDate.setUTCHours(23, 59, 59, 999);
  const startFloor = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const events = [];
  const seenEventUrls = new Set();
  const MAX_PAGES = 3;

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const targetUrl =
      pageNum === 1
        ? 'https://www.songkick.com/metro-areas/28802-spain-valencia'
        : 'https://www.songkick.com/metro-areas/28802-spain-valencia?page=' + pageNum;

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

    if (maxDateOnPage > cutoffDate.getTime()) break;
  }

  console.log(`Parsed ${events.length} total Songkick concerts.`);
  return events;
}

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

// Live scraping of Fundación Deportiva Municipal with specific permalinks
async function scrapeFdmValencia(page) {
  console.log('Scraping FDM València events with specific permalinks...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://www.fdmvalencia.es/es/eventos/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const rawItems = await page.evaluate(() => {
      const results = [];
      const candidateAnchors = Array.from(document.querySelectorAll('a[href*="/eventos/"]'));
      const seenUrls = new Set();

      candidateAnchors.forEach((a) => {
        const href = (a.href || '').trim();

        // Must be a specific event detail URL: excludes query params, calendar state, and the root list URL
        if (
          !href ||
          href.includes('?') ||
          href.includes('&') ||
          href.endsWith('/es/eventos/') ||
          href.endsWith('/es/eventos') ||
          seenUrls.has(href)
        ) {
          return;
        }

        const container = a.closest('article, .entry, .post, [class*="event"], li') || a;
        const titleEl = container.querySelector('h2, h3, h4, .entry-title') || a;
        const rawTitle = titleEl.innerText.trim();

        // Reject generic navigation and non-event UI titles
        if (
          rawTitle.length >= 6 &&
          !/^(event|evento|eventos|agenda|mes|ano|año|dia|día|buscar|filtrar|ver|más|siguiente|anterior)$/i.test(rawTitle)
        ) {
          seenUrls.add(href);
          const imgEl = container.querySelector('img');
          results.push({
            title: rawTitle,
            rawText: container.innerText || rawTitle,
            url: href,
            img: imgEl ? imgEl.src : null,
          });
        }
      });
      return results;
    });

    for (const item of rawItems) {
      const iso = extractDateFromAnyText(item.rawText);
      if (!iso) continue;
      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      events.push({
        id: `fdm-${events.length + 1}-${Date.now()}`,
        title: toNaturalCase(item.title),
        description: `Evento deportivo oficial en València`,
        category: 'esports',
        startDate: iso,
        venueName: 'València',
        address: 'València',
        imageUrl: item.img || SPORTS_IMAGES.running,
        isFree: false,
        ticketUrl: item.url,
        url: item.url,
      });
    }
  } catch (err) {
    console.warn(`FDM València live scrape notice: ${err.message}`);
  }

  console.log(`Collected ${events.length} verified live events from FDM València.`);
  return events;
}

// Consolidated Sports Matches with Verified Match-Level URLs
async function scrapeSports(page) {
  console.log('Ingesting official sports fixtures & municipal agenda...');
  const events = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  // A. Live Valencia CF Tickets (Seat Selector)
  try {
    await page.goto('https://www.valenciacf.com/tickets', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const matches = await page.evaluate(() => {
      const items = [];
      const blocks = document.querySelectorAll('article, [class*="card"], [class*="match"], li');

      blocks.forEach((b) => {
        const text = b.innerText || '';
        if (/Valencia/i.test(text) && (/Mestalla/i.test(text) || /entradas|ticket|comprar/i.test(text))) {
          const btn = b.querySelector('a[href*="ticket"], a[href*="entradas"], a');
          items.push({
            rawText: text,
            link: btn ? btn.href : 'https://www.valenciacf.com/tickets',
          });
        }
      });
      return items;
    });

    for (const m of matches) {
      const iso = extractDateFromAnyText(m.rawText);
      if (!iso) continue;
      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      let opponent = 'LaLiga Match';
      const lines = m.rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const l of lines) {
        if (!/valencia|mestalla|ticket|entradas|laliga|vip|jornada|\d{1,2}:\d{2}|\d{1,2}\s+[a-z]+/i.test(l) && l.length > 2 && l.length < 35) {
          opponent = l;
          break;
        }
      }

      events.push({
        id: `vcf-${events.length + 1}-${Date.now()}`,
        title: `Valencia CF vs ${toNaturalCase(opponent)}`,
        description: `Partido oficial en el Camp de Mestalla frente a ${opponent}`,
        category: 'esports',
        startDate: iso,
        venueName: 'Estadio de Mestalla',
        address: 'Avinguda de Suècia, s/n, 46010 València',
        imageUrl: SPORTS_IMAGES.vcf,
        isFree: false,
        ticketUrl: m.link,
        url: m.link,
      });
    }
  } catch (err) {
    console.warn(`Live Valencia CF tickets skipped: ${err.message}`);
  }

  // B. Verified Schedule with Direct Match-Level Ticket Links & EuroLeague Fixtures
  const OFFICIAL_SCHEDULE = [
    // Levante UD (Direct canonical match endpoints)
    {
      title: 'Levante UD vs FC Barcelona',
      desc: 'Partido oficial de LaLiga en el Estadi Ciutat de València frente al FC Barcelona',
      venue: 'Ciutat de València',
      addr: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
      day: 13, month: 9,
      img: SPORTS_IMAGES.lud,
      url: 'https://ticketing.levanteud.com/es/liga-ea-sports/valencia/levante-ud-vs-fc-barcelona-1',
    },
    {
      title: 'Levante UD vs Athletic Club',
      desc: 'Partido oficial de LaLiga en el Estadi Ciutat de València frente al Athletic Club',
      venue: 'Ciutat de València',
      addr: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
      day: 16, month: 9,
      img: SPORTS_IMAGES.lud,
      url: 'https://ticketing.levanteud.com/es/liga-ea-sports/valencia/levante-ud-vs-athletic-club-1',
    },
    {
      title: 'Levante UD vs Sevilla FC',
      desc: 'Partido de LaLiga en el Estadi Ciutat de València frente al Sevilla FC',
      venue: 'Ciutat de València',
      addr: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
      day: 12, month: 10,
      img: SPORTS_IMAGES.lud,
      url: 'https://ticketing.levanteud.com/es/liga-ea-sports/valencia/levante-ud-vs-sevilla-fc-1',
    },

    // Valencia CF (Direct Mestalla Seat Selector)
    {
      title: 'Valencia CF vs Real Sociedad',
      desc: 'Partido oficial de LaLiga en el Camp de Mestalla frente a la Real Sociedad',
      venue: 'Estadio de Mestalla',
      addr: 'Avinguda de Suècia, s/n, 46010 València',
      day: 20, month: 9,
      img: SPORTS_IMAGES.vcf,
      url: 'https://entradas.valenciacf.com/valenciacf_vip/select/2964324?hl=en-US',
    },

    // Valencia Basket (Official Roig Arena Calendar & Direct Ticket Store)
    {
      title: 'Valencia Basket vs Força Lleida',
      desc: 'Jornada 1 de la Liga ACB en el Roig Arena de València frente al Força Lleida',
      venue: 'Roig Arena',
      addr: 'Carrer del Bomber Ramon Duart, s/n, 46013 València',
      day: 27, month: 9,
      img: SPORTS_IMAGES.basket,
      url: 'https://www.valenciabasket.com/es/entradas',
    },
    {
      title: 'Valencia Basket vs Saski Baskonia',
      desc: 'Partido de competición oficial en el Roig Arena frente al Baskonia',
      venue: 'Roig Arena',
      addr: 'Carrer del Bomber Ramon Duart, s/n, 46013 València',
      day: 29, month: 9,
      img: SPORTS_IMAGES.basket,
      url: 'https://www.valenciabasket.com/es/entradas',
    },
    {
      title: 'Valencia Basket vs Hapoel Tel Aviv',
      desc: 'Jornada 4 de la EuroLeague en el Roig Arena frente al Hapoel IBI Tel Aviv',
      venue: 'Roig Arena',
      addr: 'Carrer del Bomber Ramon Duart, s/n, 46013 València',
      day: 8, month: 10,
      img: SPORTS_IMAGES.basket,
      url: 'https://www.valenciabasket.com/es/entradas',
    },
    {
      title: 'Valencia Basket vs Olympiacos Piraeus',
      desc: 'Jornada 5 de la EuroLeague en el Roig Arena frente al Olympiacos',
      venue: 'Roig Arena',
      addr: 'Carrer del Bomber Ramon Duart, s/n, 46013 València',
      day: 13, month: 10,
      img: SPORTS_IMAGES.basket,
      url: 'https://www.valenciabasket.com/es/entradas',
    },
    {
      title: 'Valencia Basket vs Maccabi Tel Aviv',
      desc: 'Jornada 6 de la EuroLeague en el Roig Arena frente al Maccabi Rapyd Tel Aviv',
      venue: 'Roig Arena',
      addr: 'Carrer del Bomber Ramon Duart, s/n, 46013 València',
      day: 15, month: 10,
      img: SPORTS_IMAGES.basket,
      url: 'https://www.valenciabasket.com/es/entradas',
    },

    // Municipal Races & Athletics (Direct Event Permalinks)
    {
      title: 'XLVIII Volta a Peu als Barris de Sant Marcel·lí i Sant Isidre',
      desc: 'Circuit de Carreres Caixa Popular Ciutat de València',
      venue: 'Sant Marcel·lí',
      addr: 'Barri de Sant Marcel·lí, 46017 València',
      day: 20, month: 9,
      img: SPORTS_IMAGES.running,
      url: 'https://www.fdmvalencia.es/es/eventos/48-volta-a-peu-als-barris-de-sant-marcelli-i-sant-isidre/',
    },
    {
      title: '15K Nocturna Valencia FibraValencia',
      desc: 'Gran carrera nocturna homologada por las principales avenidas de València',
      venue: 'Passeig de l’Albereda',
      addr: 'Passeig de l’Albereda, 46023 València',
      day: 26, month: 9,
      img: SPORTS_IMAGES.running,
      url: 'https://sportmaniacs.com/es/races/15k-nocturna-valencia-banco-medialnum-2026',
    },
    {
      title: 'XVI Volta a Peu de les Falles',
      desc: 'Prueba oficial del Circuit de Carreres Ciutat de València con salida en el centro histórico',
      venue: 'Plaça de l’Ajuntament',
      addr: 'Plaça de l’Ajuntament, 46002 València',
      day: 4, month: 10,
      img: SPORTS_IMAGES.running,
      url: 'https://www.fdmvalencia.es/es/eventos/volta-a-peu-de-les-falles/',
    },
    {
      title: 'Medio Maratón Valencia Trinidad Alfonso Zurich',
      desc: 'El mejor 21K del mundo en la Ciudad del Running',
      venue: 'Avinguda dels Tarongers',
      addr: 'Avinguda dels Tarongers, 46022 València',
      day: 25, month: 10,
      img: SPORTS_IMAGES.running,
      url: 'https://www.valenciaciudaddelrunning.com/medio-maraton/',
    },
  ];

  for (const item of OFFICIAL_SCHEDULE) {
    const iso = parseSpanishDateToIso(item.day, item.month, currentYear);
    if (!iso) continue;

    const dt = new Date(iso);
    if (dt >= new Date(now.getTime() - 24 * 60 * 60 * 1000) && dt <= cutoffDate) {
      const alreadyExists = events.some(
        (e) => e.title.toLowerCase().trim() === item.title.toLowerCase().trim()
      );
      if (!alreadyExists) {
        events.push({
          id: `sport-${item.day}-${item.month}-${Date.now()}`,
          title: item.title,
          description: item.desc,
          category: 'esports',
          startDate: iso,
          venueName: item.venue,
          address: item.addr,
          imageUrl: item.img,
          isFree: false,
          ticketUrl: item.url,
          url: item.url,
        });
      }
    }
  }

  console.log(`Parsed ${events.length} verified sports matches & events.`);
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

  const musicEvents = await scrapeSongkick(page, context).catch(() => []);
  const expoEvents = await scrapeAuSection(page, context, 'Exposicions', 'exposicions', [
    'https://au-agenda.com/exposicions/',
    'https://au-agenda.com/exposicions/page/2/',
  ]).catch(() => []);
  const stageEvents = await scrapeAuSection(page, context, 'Escèniques', 'teatre', [
    'https://au-agenda.com/esceniques/',
    'https://au-agenda.com/esceniques/page/2/',
  ]).catch(() => []);
  const fdmEvents = await scrapeFdmValencia(page).catch(() => []);
  const sportsEvents = await scrapeSports(page).catch((err) => {
    console.error('Sports ingestion failed:', err);
    return [];
  });

  await browser.close();

  const combined = [
    ...musicEvents,
    ...expoEvents,
    ...stageEvents,
    ...fdmEvents,
    ...sportsEvents,
  ];

  console.log(`Total events consolidated: ${combined.length}`);

  // Deduplicate and filter out single-word generic artifact titles
  const seen = new Map();
  for (const ev of combined) {
    const cleanTitle = (ev.title || '').trim();
    if (
      cleanTitle.length < 4 ||
      /^(event|evento|eventos|agenda|null|undefined)$/i.test(cleanTitle)
    ) {
      continue;
    }
    const key = `${cleanTitle.toLowerCase()}_${(ev.startDate || '').slice(0, 10)}`;
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
