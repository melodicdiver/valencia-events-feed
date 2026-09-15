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

const SPORTS_FALLBACKS = {
  running: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=600&q=80',
  basket: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
  football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80',
  sailing: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
  combat: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
};

function stripAccents(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Case preservation for Roman numerals, acronyms, and uppercase prefixes
function toNaturalCase(str) {
  if (!str) return '';
  const trimmed = str.trim();

  const ACRONYMS = new Set([
    'BBVA', 'WTA', 'ATP', 'ACB', 'FDM', 'IVAM', 'CCCC', 'TEM', 'MUVIM', 'CAHH', 'VCF', 'LUD', 'BC', 'UD', 'CF', 'SD', 'FC', 'XXI', '3X3', 'XLVIII', '15K'
  ]);
  const lowerWords = new Set(['de', 'del', "d'", 'd’', 'el', 'la', 'los', 'las', 'en', 'i', 'y', 'al', 'als', 'vs', 'a', 'por', 'con']);
  const isRoman = (w) => /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i.test(w) && w.length >= 1;

  return trimmed
    .split(/(\s+|[-–—,:;./]+)/)
    .map((w, idx) => {
      if (!w || /^\s+$/.test(w) || /^[-–—,:;./]+$/.test(w)) return w;
      const upper = w.toUpperCase();

      if (ACRONYMS.has(upper) || /^\d+K$/i.test(w)) return upper;
      if (isRoman(w) && w.length >= 2) return upper;

      const lower = w.toLowerCase();
      if (idx > 0 && lowerWords.has(lower)) return lower;

      return lower.charAt(0).toUpperCase() + lower.slice(1);
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

function getSportsFallback(title) {
  const t = (title || '').toLowerCase();
  if (/tenis|tennis|wta|atp/i.test(t)) return SPORTS_FALLBACKS.tennis;
  if (/sailing|vela|nautic/i.test(t)) return SPORTS_FALLBACKS.sailing;
  if (/basket|baloncesto|jaula/i.test(t)) return SPORTS_FALLBACKS.basket;
  if (/taekwondo|judo|karate|boxeo|lucha/i.test(t)) return SPORTS_FALLBACKS.combat;
  return SPORTS_FALLBACKS.running;
}

function isValidDetailImg(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('logo') ||
    lower.includes('icon') ||
    lower.includes('pixel') ||
    lower.includes('spacer') ||
    lower.includes('avatar') ||
    lower.includes('theme') ||
    lower.endsWith('.svg')
  ) {
    return false;
  }
  return true;
}

// 1. Music (Songkick)
async function scrapeSongkick(page, context) {
  console.log('Scraping Songkick (Música)...');
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
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (err) {
      console.warn(`Songkick timeout: ${err.message}`);
      break;
    }

    const rawLdScripts = await page.$$eval('script[type="application/ld+json"]', (scripts) =>
      scripts.map((s) => s.textContent || '')
    );

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
                const res = await context.request.get(rawImg, { maxRedirects: 5, timeout: 5000 });
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
              const match = String(item.startDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (match) {
                eventDateObj = new Date(Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 19, 0, 0));
                startDateIso = eventDateObj.toISOString();

                if (item.endDate) {
                  const rawEnd = new Date(item.endDate);
                  const rawStart = new Date(item.startDate);
                  if (!isNaN(rawEnd.getTime()) && !isNaN(rawStart.getTime())) {
                    if ((rawEnd.getTime() - rawStart.getTime()) / (1000 * 60 * 60) > 24) {
                      endDateIso = rawEnd.toISOString();
                    }
                  }
                }
              }
            }

            if (!eventDateObj) continue;
            if (eventDateObj.getTime() > maxDateOnPage) maxDateOnPage = eventDateObj.getTime();
            if (eventDateObj < startFloor || eventDateObj > cutoffDate) continue;

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

// 2. Cultural Agenda (AU-Agenda)
async function scrapeAuSection(page, context, label, category, urls) {
  console.log(`Scraping AU-Agenda (${label})...`);
  const rawCards = [];

  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
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
        const res = await context.request.get(card.link, { timeout: 10000 });
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

// 3. Live Scraper for Fundación Deportiva Municipal (FDM València) with robust address extraction
async function scrapeFdmValencia(page, context) {
  console.log('Scraping FDM València events dynamically...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://www.fdmvalencia.es/es/eventos/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 35000 
    });
    await page.waitForTimeout(2500);

    const rawItems = await page.evaluate(() => {
      const results = [];
      const seenUrls = new Set();
      const seenTitles = new Set();

      const allElements = Array.from(document.querySelectorAll('body *'));

      for (const el of allElements) {
        if (el.children && el.children.length > 0) continue;
        const text = (el.innerText || el.textContent || '').trim();

        const dateMatch = text.match(/\b(\d{1,2})\s+(?:de\s+)?(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setembre|octubre|noviembre|diciembre)\s+(\d{4})\b/i);
        if (!dateMatch || text.length > 70) continue;

        let container = el.parentElement;
        for (let depth = 0; depth < 5 && container && container !== document.body; depth++) {
          const links = Array.from(container.querySelectorAll('a'));
          const validLink = links.find((a) => {
            const txt = (a.innerText || '').trim();
            const h = (a.href || '').trim();
            return (
              txt.length >= 6 &&
              !/^(inicio|agenda|instalaciones|comunicación|valencia|buscar|aviso|cookies|privacidad|legal|ver|más)$/i.test(txt) &&
              !h.includes('aviso') &&
              !h.includes('cookies') &&
              !h.includes('privacidad')
            );
          });

          if (validLink) {
            const title = validLink.innerText.trim();
            const href = validLink.href.trim();
            const normTitle = title.toLowerCase();

            if (!seenUrls.has(href) && !seenTitles.has(normTitle)) {
              seenUrls.add(href);
              seenTitles.add(normTitle);

              let foundImg = null;
              let searchRow = container;
              for (let d = 0; d < 4 && searchRow && searchRow !== document.body; d++) {
                const imgs = Array.from(searchRow.querySelectorAll('img'));
                for (const img of imgs) {
                  const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.src;
                  if (src && !src.includes('pixel') && !src.includes('spacer') && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
                    foundImg = src.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
                    break;
                  }
                }
                if (foundImg) break;
                searchRow = searchRow.parentElement;
              }

              results.push({
                title,
                dateText: text,
                containerText: container.innerText || '',
                url: href,
                img: foundImg,
              });
            }
            break;
          }
          container = container.parentElement;
        }
      }

      return results;
    });

    console.log(`FDM live elements parsed: ${rawItems.length}`);

    // Fetch detail pages in parallel to extract precise addresses and photos
    if (context && rawItems.length > 0) {
      await Promise.allSettled(
        rawItems.map(async (item) => {
          try {
            const res = await context.request.get(item.url, { timeout: 6000 });
            if (res.ok()) {
              const html = await res.text();

              // Robust address matching beneath map block
              const addrMatch = html.match(/(?:<i[^>]*class=["'][^"']*map-marker[^"']*["'][^>]*><\/i>|Abrir en Maps.*?<\/a>)(?:[\s\S]*?<p[^>]*>)?([\s\S]*?)(?:<\/p>|<div|<\/div>)/i) ||
                                html.match(/<div[^>]*class=["'][^"']*(?:direccion|address|lugar|ubicacion)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                                html.match(/<div[^>]*id=["'][^"']*map[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);

              if (addrMatch && addrMatch[1]) {
                const clean = addrMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                if (clean.length > 4 && !/google|maps|abrir/i.test(clean)) {
                  item.parsedAddress = clean;
                }
              }

              if (!item.img) {
                const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
                if (ogMatch && ogMatch[1] && isValidDetailImg(ogMatch[1])) {
                  item.img = ogMatch[1].replace(/&amp;/g, '&');
                }
              }
            }
          } catch (_) {}
        })
      );
    }

    for (const item of rawItems) {
      let startDateIso = null;
      let endDateIso = undefined;

      const rangeMatch = item.containerText.match(/\b(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+de)?\s+(\d{4})\s*[-–—al\s]+\s*(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+de)?\s+(\d{4})\b/i);
      if (rangeMatch) {
        startDateIso = parseSpanishDateToIso(rangeMatch[1], rangeMatch[2], rangeMatch[3]);
        endDateIso = parseSpanishDateToIso(rangeMatch[4], rangeMatch[5], rangeMatch[6]) || undefined;
      } else {
        startDateIso = extractDateFromAnyText(item.rawText) || extractDateFromAnyText(item.dateText);
      }

      if (!startDateIso) continue;
      const dt = new Date(startDateIso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      let venue = 'València';
      let fullAddress = 'València';

      if (item.parsedAddress) {
        fullAddress = item.parsedAddress;
        const dotSplit = fullAddress.split(/[.\n–—]/);
        venue = dotSplit[0].trim();
      } else {
        if (/Sant Marcel/i.test(item.title)) { venue = 'Sant Marcel·lí'; fullAddress = 'Avenida de Tres Cruces, junto al Cementerio de Valencia'; }
        else if (/Falles/i.test(item.title)) { venue = 'Plaça de l’Ajuntament'; fullAddress = 'Plaça de l’Ajuntament, València'; }
        else if (/Nocturna/i.test(item.title)) { venue = 'Passeig de l’Albereda'; fullAddress = 'Passeig de l’Albereda, València'; }
        else if (/BBVA|Tennis|Tenis/i.test(item.title)) { venue = 'Sporting Club de Tenis'; fullAddress = 'Sporting Club València. Av. de les Balears, 29'; }
        else if (/Sailing|Vela/i.test(item.title)) { venue = 'Marina de València'; fullAddress = 'Marina de València, Carrer de la Marina Real Juan Carlos I'; }
        else if (/Taekwondo/i.test(item.title)) { venue = 'Pavelló Font de Sant Lluís'; fullAddress = 'Pavelló Font de Sant Lluís, Av. dels Germans Maristes, 16'; }
        else if (/Dogfy/i.test(item.title)) { venue = 'Parc de Capçalera'; fullAddress = 'Parc de Capçalera, inmediaciones del Puente Nueve de Octubre'; }
        else if (/Jaula/i.test(item.title)) { venue = 'Ciutat de les Arts i les Ciències'; fullAddress = 'Ciutat de les Arts i les Ciències, Av. del Professor López Piñero, 7'; }
      }

      const finalImg = item.img || getSportsFallback(item.title);

      events.push({
        id: `fdm-${events.length + 1}-${Date.now()}`,
        title: toNaturalCase(item.title),
        description: `Evento deportivo oficial en València`,
        category: 'esports',
        startDate: startDateIso,
        endDate: endDateIso,
        venueName: venue,
        address: fullAddress,
        imageUrl: finalImg,
        isFree: false,
        ticketUrl: item.url,
        url: item.url,
      });
    }
  } catch (err) {
    console.warn(`FDM València live scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} live FDM València events.`);
  return events;
}

// 4. Live Scraper for Valencia Basket
async function scrapeValenciaBasket(page) {
  console.log('Scraping Valencia Basket live calendar dynamically...');
  const events = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  const CALENDAR_URL = 'https://www.valenciabasket.com/ca/calendario?teamId=&competitionId=&place=home';

  try {
    await page.goto(CALENDAR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const matches = await page.evaluate(() => {
      const items = [];
      const blocks = Array.from(document.querySelectorAll('div, tr, li, article'));

      for (const el of blocks) {
        const text = el.innerText || '';
        if (
          /valencia\s+(?:basket|bc)/i.test(text) &&
          /\b\d{1,2}\s+(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+\d{1,2}:\d{2}/i.test(text)
        ) {
          const children = el.querySelectorAll('*');
          let isDeepest = true;
          for (const c of children) {
            if (
              /valencia\s+(?:basket|bc)/i.test(c.innerText || '') &&
              /\b\d{1,2}\s+(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+\d{1,2}:\d{2}/i.test(c.innerText || '')
            ) {
              isDeepest = false;
              break;
            }
          }

          if (isDeepest) {
            items.push(text);
          }
        }
      }
      return items;
    });

    for (const rawText of matches) {
      const dateMatch = rawText.match(/(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+(\d{1,2}:\d{2})/i);
      if (!dateMatch) continue;

      const iso = parseSpanishDateToIso(dateMatch[1], dateMatch[2], currentYear);
      if (!iso) continue;

      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      let opponent = '';

      for (let i = 0; i < lines.length; i++) {
        if (/valencia\s+(?:basket|bc)/i.test(lines[i])) {
          for (let j = i + 1; j < lines.length; j++) {
            const candidate = lines[j];
            if (
              !/valencia|entradas|vip|\d{1,2}\s+[a-z]+|\d{1,2}:\d{2}|liga|euroleague|masculino|femenino|endesa/i.test(candidate) &&
              candidate.length >= 3
            ) {
              opponent = candidate;
              break;
            }
          }
          break;
        }
      }

      if (!opponent) opponent = 'Partido Oficial';

      // Detect Men's vs Women's team designation
      const isWomenMatch =
        /\bvalencia\s+bc\b/i.test(rawText) ||
        /\bfemenin[oa]\b/i.test(rawText) ||
        /women/i.test(rawText) ||
        /lf\s*endesa/i.test(rawText);

      const valenciaTeamName = isWomenMatch ? 'Valencia BC' : 'Valencia Basket';

      events.push({
        id: `vbc-${events.length + 1}-${Date.now()}`,
        title: `${valenciaTeamName} vs ${toNaturalCase(opponent)}`,
        description: `Partido oficial de baloncesto en el Roig Arena frente al ${opponent}`,
        category: 'esports',
        startDate: iso,
        venueName: 'Roig Arena',
        address: 'Carrer del Bomber Ramon Duart, s/n, 46013 València',
        imageUrl: SPORTS_FALLBACKS.basket,
        isFree: false,
        ticketUrl: CALENDAR_URL,
        url: CALENDAR_URL,
      });
    }
  } catch (err) {
    console.warn(`Valencia Basket dynamic scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} live Valencia Basket matches.`);
  return events;
}

// 5. Live Scraper for Valencia CF
async function scrapeValenciaCF(page) {
  console.log('Scraping Valencia CF live ticketing...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://www.valenciacf.com/tickets', { waitUntil: 'domcontentloaded', timeout: 25000 });
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
        description: `Partido oficial en el Camp de Mestalla frente al ${opponent}`,
        category: 'esports',
        startDate: iso,
        venueName: 'Estadio de Mestalla',
        address: 'Avinguda de Suècia, s/n, 46010 València',
        imageUrl: SPORTS_FALLBACKS.football,
        isFree: false,
        ticketUrl: m.link,
        url: m.link,
      });
    }
  } catch (err) {
    console.warn(`Valencia CF live scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} live Valencia CF matches.`);
  return events;
}

// 6. Live Scraper for Levante UD
async function scrapeLevanteUD(page) {
  console.log('Scraping Levante UD live ticketing...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://ticketing.levanteud.com', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);

    const matches = await page.evaluate(() => {
      const items = [];
      const links = Array.from(document.querySelectorAll('a[href*="/liga-"], a[href*="/entradas/"], a[href*="levante"]'));
      const seen = new Set();

      for (const a of links) {
        const href = a.href;
        if (seen.has(href) || href.includes('javascript') || href.endsWith('.pdf')) continue;

        const container = a.closest('article, [class*="card"], [class*="item"], div') || a;
        const text = container.innerText || '';

        if (/Levante/i.test(text) && (/vs\.?|x\s+/i.test(text) || /entradas|comprar/i.test(text))) {
          seen.add(href);
          items.push({
            href,
            rawText: text,
          });
        }
      }
      return items;
    });

    for (const m of matches) {
      const iso = extractDateFromAnyText(m.rawText);
      if (!iso) continue;
      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      let opponent = 'LaLiga Match';
      const matchTitle = m.rawText.match(/Levante(?:\s+UD)?\s+(?:vs\.?|x|-)\s+([A-Za-zÁ-ÿ\s]+)/i);
      if (matchTitle) {
        opponent = matchTitle[1].split('\n')[0].trim();
      }

      events.push({
        id: `lud-${events.length + 1}-${Date.now()}`,
        title: `Levante UD vs ${toNaturalCase(opponent)}`,
        description: `Partido oficial de LaLiga en el Estadi Ciutat de València frente al ${opponent}`,
        category: 'esports',
        startDate: iso,
        venueName: 'Ciutat de València',
        address: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
        imageUrl: SPORTS_FALLBACKS.football,
        isFree: false,
        ticketUrl: m.href,
        url: m.href,
      });
    }
  } catch (err) {
    console.warn(`Levante UD live scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} live Levante UD matches.`);
  return events;
}

async function main() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  let musicEvents = [];
  try {
    const page = await context.newPage();
    musicEvents = await scrapeSongkick(page, context);
    await page.close();
  } catch (e) {
    console.error('Songkick error:', e.message);
  }

  let expoEvents = [];
  try {
    const page = await context.newPage();
    expoEvents = await scrapeAuSection(page, context, 'Exposicions', 'exposicions', [
      'https://au-agenda.com/exposicions/',
      'https://au-agenda.com/exposicions/page/2/',
    ]);
    await page.close();
  } catch (e) {
    console.error('Expos error:', e.message);
  }

  let stageEvents = [];
  try {
    const page = await context.newPage();
    stageEvents = await scrapeAuSection(page, context, 'Escèniques', 'teatre', [
      'https://au-agenda.com/esceniques/',
      'https://au-agenda.com/esceniques/page/2/',
    ]);
    await page.close();
  } catch (e) {
    console.error('Stage error:', e.message);
  }

  let fdmEvents = [];
  try {
    const page = await context.newPage();
    fdmEvents = await scrapeFdmValencia(page, context);
    await page.close();
  } catch (e) {
    console.error('FDM error:', e.message);
  }

  let vbcEvents = [];
  try {
    const page = await context.newPage();
    vbcEvents = await scrapeValenciaBasket(page);
    await page.close();
  } catch (e) {
    console.error('Valencia Basket error:', e.message);
  }

  let vcfEvents = [];
  try {
    const page = await context.newPage();
    vcfEvents = await scrapeValenciaCF(page);
    await page.close();
  } catch (e) {
    console.error('Valencia CF error:', e.message);
  }

  let ludEvents = [];
  try {
    const page = await context.newPage();
    ludEvents = await scrapeLevanteUD(page);
    await page.close();
  } catch (e) {
    console.error('Levante UD error:', e.message);
  }

  await browser.close();

  const combined = [
    ...fdmEvents,
    ...vbcEvents,
    ...vcfEvents,
    ...ludEvents,
    ...musicEvents,
    ...expoEvents,
    ...stageEvents,
  ];

  console.log(`Total events consolidated: ${combined.length}`);

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
