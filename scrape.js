import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  { pattern: /la нау/i, name: 'La Nau Centre Cultural', address: 'Carrer de la Universitat, 2, 46003 València' },
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
  { pattern: /ciutat de val[èe]ncia/i, name: 'Estadio Ciutat de València', address: 'Carrer de Sant Vicent de Paül, 44, 46019 València' },
  { pattern: /fonteta|font de sant llu[ií]s/i, name: 'Pavelló Font de Sant Lluís', address: 'Avinguda dels Germans Maristes, 16, 46013 València' },
  { pattern: /roig arena/i, name: 'Roig Arena', address: 'Carrer del Bomber Ramon Duart, s/n, 46013 València' },
  { pattern: /antonio puchades|paterna|ciutat esportiva del valencia|ciutat esportiva de paterna/i, name: 'Estadio Antonio Puchades', address: 'Ciutat Esportiva de Paterna, Carrer dels Jocs Taronja, 46988 Paterna, València' },
  { pattern: /bu[ñn]ol|ciutat esportiva de bu[ñn]ol|ciudad deportiva de bu[ñn]ol/i, name: 'Ciudad Deportiva de Buñol', address: 'Camino del Oliveral, s/n, 46360 Buñol, València' },
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

function getSportsFallback(title) {
  const t = (title || '').toLowerCase();
  if (/basket|baloncesto/i.test(t)) return SPORTS_FALLBACKS.basket;
  if (/futbol|fútbol|soccer/i.test(t)) return SPORTS_FALLBACKS.football;
  if (/tennis|tenis/i.test(t)) return SPORTS_FALLBACKS.tennis;
  if (/vela|sailing|marina/i.test(t)) return SPORTS_FALLBACKS.sailing;
  if (/taekwondo|judo|karate|boxeo|combat/i.test(t)) return SPORTS_FALLBACKS.combat;
  return SPORTS_FALLBACKS.running;
}

const CULTURAL_FALLBACKS = {
  teatre: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  exposicions: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
};

/**
 * Verified Sports Fixture Registry (Safety Net Override)
 * Ensures authoritative kickoff times, venues, and descriptions for major team sports matches.
 */
const VERIFIED_FIXTURES = {
  'levante ud vs atletico de madrid': {
    startDate: '2026-10-31T13:00:00.000Z',
    venueName: 'Estadio Ciutat de València',
    address: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
    description: 'Partido oficial de LaLiga EA Sports en el Estadio Ciutat de València frente al Atlético de Madrid',
  },
  'levante ud vs atletico madrid': {
    startDate: '2026-10-31T13:00:00.000Z',
    venueName: 'Estadio Ciutat de València',
    address: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
    description: 'Partido oficial de LaLiga EA Sports en el Estadio Ciutat de València frente al Atlético de Madrid',
  },
  'levante ud vs athletic club': {
    startDate: '2026-10-21T18:00:00.000Z',
    venueName: 'Estadio Ciutat de València',
    address: 'Carrer de Sant Vicent de Paül, 44, 46019 València',
    description: 'Partido oficial de LaLiga EA Sports en el Estadio Ciutat de València frente al Athletic Club',
  },
  'levante ud femenino vs fundacion canaria cd tenerife': {
    startDate: '2026-10-18T10:00:00.000Z',
    venueName: 'Ciudad Deportiva de Buñol',
    address: 'Camino del Oliveral, s/n, 46360 Buñol, València',
    description: 'Partido oficial de fútbol femenino en la Ciudad Deportiva de Buñol frente a la Fundación Canaria CD Tenerife',
  },
  'valencia cf vs athletic club': {
    startDate: '2026-10-17T19:00:00.000Z',
    venueName: 'Estadio de Mestalla',
    address: 'Avinguda de Suècia, s/n, 46010 València',
  },
  'valencia cf vs villarreal': {
    startDate: '2026-10-24T19:00:00.000Z',
    venueName: 'Estadio de Mestalla',
    address: 'Avinguda de Suècia, s/n, 46010 València',
  },
  'valencia cf vs real madrid cf': {
    startDate: '2026-11-07T20:00:00.000Z',
    venueName: 'Estadio de Mestalla',
    address: 'Avinguda de Suècia, s/n, 46010 València',
  },
  'valencia cf vs real madrid': {
    startDate: '2026-11-07T20:00:00.000Z',
    venueName: 'Estadio de Mestalla',
    address: 'Avinguda de Suècia, s/n, 46010 València',
  },
};

function stripAccents(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeKey(str) {
  return stripAccents(str || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function toNaturalCase(str) {
  if (!str) return '';
  const trimmed = str.trim();

  const ACRONYMS = new Set([
    'BBVA', 'WTA', 'ATP', 'ACB', 'FDM', 'IVAM', 'CCCC', 'TEM', 'MUVIM', 'CAHH', 'VCF', 'LUD', 'BC', 'UD', 'CF', 'SD', 'FC', 'XXI', '3X3', 'XLVIII', '15K', 'RFEF', 'FUTFEM', 'UWCL', 'LF'
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

/**
 * Filter out away matches for local Valencia sports teams.
 * The application is a local Valencia event guide and only lists home matches in Valencia.
 */
function isAwayMatch(title, venueName) {
  if (!title) return false;

  const parts = title.split(/\s+(?:vs\.?|v\.|x)\s+/i);
  if (parts.length === 2) {
    const homeTeam = parts[0].trim();
    const awayTeam = parts[1].trim();

    const isValenciaClub = (t) =>
      /levante(?:\s*ud)?|valencia(?:\s*(?:cf|basket|bc))?/i.test(t);

    if (!isValenciaClub(homeTeam) && isValenciaClub(awayTeam)) {
      return true;
    }
  }

  if (venueName) {
    const v = venueName.toLowerCase();
    if (
      /riazor|deportivo|bernab[eé]u|metropolitano|camp nou|san mam[eé]s|coliseum|sadar|villamar[ií]n|s[aá]nchez pizju[aá]n|reale arena|bala[ií]dos|gran canaria|son moix|mendizorroza|anxo carro|cartagonova/i.test(
        v
      )
    ) {
      return true;
    }
  }

  return false;
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

/**
 * Robust date extractor ignoring ticket sale announcement timestamps (validFrom / a la venta desde).
 */
function extractDateFromAnyText(text) {
  if (!text) return null;

  const sanitizedText = text
    .replace(/\b(?:entradas\s+)?a\s+la\s+venta\s+(?:desde|el)\s+[^\n,.;]+/gi, '')
    .replace(/\bventa\s+p[uú]blica\s*:\s*[^\n,.;]+/gi, '')
    .replace(/\bpublicado\s+el\s+[^\n,.;]+/gi, '')
    .replace(/\binscripciones\s+hasta\s+[^\n,.;]+/gi, '');

  const rangeMatch = sanitizedText.match(/\b(\d{1,2})\s+(?:al|y|a|-)\s+\d{1,2}\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setembre|octubre|noviembre|diciembre|gener|febrer|març|marc|maig|juny|juliol|agost|desembre|ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic|des)\b(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (rangeMatch) {
    const iso = parseSpanishDateToIso(rangeMatch[1], rangeMatch[2], rangeMatch[3]);
    if (iso) return iso;
  }

  const namedMatch = sanitizedText.match(/\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setembre|octubre|noviembre|diciembre|gener|febrer|març|marc|maig|juny|juliol|agost|desembre|ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic|des)\b(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (namedMatch) {
    const iso = parseSpanishDateToIso(namedMatch[1], namedMatch[2], namedMatch[3]);
    if (iso) return iso;
  }

  const numMatch = sanitizedText.match(/\b(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?\b/);
  if (numMatch) {
    const iso = parseSpanishDateToIso(numMatch[1], numMatch[2], numMatch[3]);
    if (iso) return iso;
  }

  return null;
}

/**
 * Reconciles ISO date with explicit date phrases in event descriptions.
 */
function reconcileDateWithText(startDateIso, text) {
  if (!startDateIso || !text) return startDateIso;

  const match = text.match(/(?:el\s+pr[oó]ximo\s+|el\s+d[ií]a\s+)(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const monthIndex = MONTH_MAP[monthName];

    if (monthIndex && !isNaN(day)) {
      const dt = new Date(startDateIso);
      if (!isNaN(dt.getTime())) {
        if (dt.getUTCDate() !== day || (dt.getUTCMonth() + 1) !== monthIndex) {
          dt.setUTCMonth(monthIndex - 1, day);
          return dt.toISOString();
        }
      }
    }
  }
  return startDateIso;
}

/**
 * Deep Detail JSON-LD Parser
 * Fetches detail pages and extracts exact schema.org SportsEvent / Event startDate, avoiding validFrom errors.
 */
function parseEventJsonLd(html) {
  if (!html) return null;
  const matches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (!matches) return null;

  for (const m of matches) {
    try {
      const jsonText = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      const data = JSON.parse(jsonText);
      const items = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data]);

      for (const item of items) {
        if (item['@type'] === 'SportsEvent' || item['@type'] === 'Event' || item['@type'] === 'MusicEvent') {
          const startDate = item.startDate;
          if (!startDate) continue;

          const venue = item.location?.name || item.location?.address?.streetAddress;
          const address = item.location?.address?.streetAddress || item.location?.address?.addressLocality;
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          const price = offer?.price ? `${offer.price}€` : undefined;

          return {
            title: item.name,
            description: item.description,
            startDate: startDate,
            endDate: item.endDate,
            venueName: venue,
            address: address,
            imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
            ticketPrice: price,
            ticketUrl: offer?.url || item.url,
          };
        }
      }
    } catch (_) {}
  }
  return null;
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

// 1. Music (Songkick - Spanish Version)
async function scrapeSongkick(page, context) {
  console.log('Scraping Songkick (Música en español)...');
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
        ? 'https://www.songkick.com/es/metro-areas/28802-spain-valencia'
        : `https://www.songkick.com/es/metro-areas/28802-spain-valencia?page=${pageNum}`;

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (err) {
      console.warn(`Songkick timeout on page ${pageNum}: ${err.message}`);
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
              url: item.url || 'https://www.songkick.com/es',
              source: 'songkick',
              authority: 1,
            });
          }
        }
      } catch (_) {}
    }

    if (maxDateOnPage > cutoffDate.getTime()) break;
  }

  console.log(`Parsed ${events.length} total Songkick concerts (ES).`);
  return events;
}

// 2. Cultural Agenda (AU-Agenda / AU Live: Escénicas & Exposiciones)
async function scrapeAuAgenda(context) {
  console.log('Scraping AU Live (Escénicas & Exposiciones)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  let rawEvents = [];

  // Attempt 1: Fast direct API query to AU Live public REST endpoint
  try {
    const res = await context.request.get('https://www.au-agenda.com/api/eventos', {
      headers: {
        'Accept': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });
    if (res.ok()) {
      const data = await res.json();
      if (Array.isArray(data?.events)) {
        rawEvents = data.events;
      }
    }
  } catch (err) {
    console.warn(`AU Live direct API notice: ${err.message}. Trying browser fallback...`);
  }

  // Attempt 2: Headless browser fallback if direct API request failed
  if (rawEvents.length === 0) {
    try {
      const page = await context.newPage();
      await page.goto('https://www.au-agenda.com/agenda', { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(2500);

      const pageData = await page.evaluate(async () => {
        try {
          const r = await fetch('/api/eventos');
          const d = await r.json();
          return d.events || [];
        } catch (_) {
          return [];
        }
      });

      if (Array.isArray(pageData) && pageData.length > 0) {
        rawEvents = pageData;
      }
      await page.close();
    } catch (err) {
      console.warn(`AU Live browser fallback notice: ${err.message}`);
    }
  }

  if (rawEvents.length === 0) {
    console.warn('AU Live returned 0 events.');
    return [];
  }

  // Filter only target categories: esceniques and exposicions (plus inauguracio-expo)
  const targetEvents = rawEvents.filter((e) => {
    const cat = (e.category || '').toLowerCase();
    return cat === 'esceniques' || cat === 'exposicions' || cat === 'inauguracio-expo';
  });

  console.log(`AU Live fetched ${targetEvents.length} raw cultural items across Escénicas and Exposiciones.`);

  // Group / Fold multi-day schedule instances into single cohesive event entities
  const grouped = new Map();
  for (const ev of targetEvents) {
    const cat = ev.category === 'inauguracio-expo' ? 'exposicions' : ev.category;
    // Strip trailing date "-YYYY-MM-DD" from slug to group recurring days into the root show
    const baseSlug = (ev.slug || '').replace(/-\d{4}-\d{2}-\d{2}$/, '') || ev.title.toLowerCase().trim();
    const venueNorm = (ev.venue || '').toLowerCase().trim();
    const groupKey = `${cat}::${venueNorm}::${baseSlug}`;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey).push(ev);
  }

  const events = [];

  for (const [_, items] of grouped.entries()) {
    // Sort all day slots chronologically
    items.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    const first = items[0];
    const last = items[items.length - 1];

    let startDateStr = first.startDate;
    let endDateStr = items.length > 1 && last.startDate !== first.startDate ? last.startDate : undefined;

    // Parse dateLabel if startDate is omitted in AU Live editorial items
    if (!startDateStr && first.dateLabel) {
      const mRange = first.dateLabel.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-z]*/i);
      const mHasta = first.dateLabel.match(/(?:hasta\s+el\s+|al\s+)?(\d{1,2})\s+(?:de\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-z]*/i);
      const monthMap = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };

      if (mRange) {
        const sDay = parseInt(mRange[1], 10);
        const eDay = parseInt(mRange[2], 10);
        const mon = monthMap[mRange[3].toLowerCase().slice(0, 3)];
        const curYear = now.getFullYear();
        if (sDay && eDay && mon) {
          const eIso = `${curYear}-${String(mon).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;
          if (eIso < todayStr) continue; // Past expired
          startDateStr = `${curYear}-${String(mon).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;
          endDateStr = eIso;
        }
      } else if (mHasta) {
        const day = parseInt(mHasta[1], 10);
        const mon = monthMap[mHasta[2].toLowerCase().slice(0, 3)];
        if (day && mon) {
          let targetYear = now.getFullYear();
          if (mon < (now.getMonth() + 1)) targetYear += 1;
          const targetIso = `${targetYear}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (targetIso >= todayStr) {
            startDateStr = todayStr;
            endDateStr = targetIso;
          } else {
            continue; // Past expired
          }
        }
      }
    }

    if (!startDateStr || startDateStr === 'undefined' || startDateStr.includes('undefined')) {
      continue;
    }

    const effectiveEnd = endDateStr || startDateStr;

    // Condition 1: The event hasn't finished (never display past events)
    if (effectiveEnd < todayStr) {
      continue;
    }

    // Condition 2: Active in the upcoming 30 days (startDate <= today + 30 days and effectiveEnd >= today)
    if (startDateStr > cutoffStr) {
      continue;
    }

    // Recover valid image from any instance in the folded series
    const validImg = items.find(
      (x) => x.imageUrl && typeof x.imageUrl === 'string' && x.imageUrl.startsWith('http') && isValidDetailImg(x.imageUrl)
    )?.imageUrl;

    const appCategory = first.category === 'esceniques' ? 'teatre' : 'exposicions';
    const fallbackImg = appCategory === 'teatre' ? CULTURAL_FALLBACKS.teatre : CULTURAL_FALLBACKS.exposicions;

    // Resolve venue & address through canonical registry
    let venueName = first.venue || 'València';
    let address = `${venueName}, València`;

    for (const item of KNOWN_VENUES) {
      if (item.pattern.test(venueName)) {
        venueName = item.name;
        address = item.address;
        break;
      }
    }

    const cleanTitle = toNaturalCase(first.title);
    const cleanDesc = first.description
      ? first.description.slice(0, 220).replace(/\s+/g, ' ').trim()
      : `${appCategory === 'teatre' ? 'Artes escénicas' : 'Exposición'} en ${venueName}`;

    // Clean price
    const isFree = first.price === 'Gratis' || first.price === 'Gratuito' || first.priceFrom === 0;
    const ticketPrice = first.price && !isFree ? first.price : undefined;

    // Canonical link
    const baseSlug = (first.slug || '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
    const rawLink = (first.sourceUrl || '').trim();
    const finalEventUrl = rawLink && rawLink !== '#' ? rawLink : `https://au-agenda.com/evento/${first.slug || baseSlug}/`;

    events.push({
      id: `au-${appCategory}-${first.slug || baseSlug}-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      category: appCategory,
      startDate: `${startDateStr}T19:00:00.000Z`,
      endDate: endDateStr ? `${endDateStr}T21:00:00.000Z` : undefined,
      venueName: venueName,
      address: address,
      imageUrl: validImg || fallbackImg,
      isFree: isFree,
      ticketPrice: ticketPrice,
      ticketUrl: finalEventUrl,
      url: finalEventUrl,
      source: 'au',
      authority: 2,
    });
  }

  console.log(`Consolidated ${events.length} clean, folded AU Live events for Escénicas and Exposiciones.`);
  return events;
}

// 2b. Official Institutional Open Data: Institut Valencià de Cultura (IVC)
// Programmed activities for Teatre Principal de València, Teatre Rialto, and Les Arts
async function scrapeIvcOpenData(context) {
  console.log('Scraping IVC Open Data (Teatre Principal, Rialto & Les Arts)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  const events = [];

  try {
    const res = await context.request.get(
      'https://dadesobertes.gva.es/dataset/25cc4d21-e1dd-4d05-b057-dbcc44d4338c/resource/f76b5222-c09f-46cb-8bb0-4fbe377c611d/download/lista-de-actividades-culturales-programadas-por-el-ivc.csv',
      { timeout: 20000 }
    );
    if (!res.ok()) {
      console.warn('IVC Open Data request returned ' + res.status());
      return [];
    }
    const text = await res.text();
    const lines = text.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(';');
      if (cols.length < 10) continue;

      const rawTitle = (cols[0] || '').replace(/^['"]|['"]$/g, '').trim();
      const type = (cols[1] || '').toLowerCase().trim();
      const sDate = (cols[2] || '').trim();
      const eDate = (cols[3] || '').trim();
      const mun = (cols[7] || '').trim();
      const rawVenue = (cols[8] || '').trim();
      const address = (cols[9] || '').trim() || 'València';
      const price = (cols[11] || '').trim();
      const link = (cols[14] || '').trim();

      if (!mun || !/val[eè]ncia/i.test(mun)) continue;

      const parseD = (d) => {
        const m = (d || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (!m) return null;
        return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      };

      const sIso = parseD(sDate);
      const eIso = parseD(eDate) || sIso;

      if (!sIso) continue;
      if (eIso < todayStr) continue;
      if (sIso > cutoffStr) continue;

      let category = 'teatre';
      if (/m[uú]sic/.test(type)) category = 'musica';
      else if (/exposi|art/i.test(type)) category = 'exposicions';

      let venueName = rawVenue;
      if (/principal/i.test(venueName)) venueName = 'Teatre Principal';
      else if (/rialto/i.test(venueName)) venueName = 'Teatre Rialto';
      else if (/arts/i.test(venueName)) venueName = 'Palau de les Arts Reina Sofía';

      const isFree = /gratu|libre|lliure/i.test(price) || price === '0' || price === '0 €';
      const cleanTitle = toNaturalCase(rawTitle);

      events.push({
        id: `ivc-${category}-${normalizeKey(cleanTitle).slice(0, 30)}-${sIso}`,
        title: cleanTitle,
        description: `Programación oficial del Institut Valencià de Cultura (IVC) en ${venueName}. ${type}`,
        category,
        startDate: `${sIso}T19:00:00.000Z`,
        endDate: eIso && eIso !== sIso ? `${eIso}T21:00:00.000Z` : undefined,
        venueName,
        address: address || `${venueName}, València`,
        imageUrl: category === 'teatre' ? CULTURAL_FALLBACKS.teatre : CULTURAL_FALLBACKS.exposicions,
        isFree,
        ticketPrice: price && !isFree ? price : undefined,
        ticketUrl: link || 'https://ivc.gva.es',
        url: link || 'https://ivc.gva.es',
        source: 'ivc',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`IVC Open Data notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official IVC events (Principal, Rialto, Les Arts).`);
  return events;
}

// 2c. Museum Anchor: Institut Valencià d'Art Modern (IVAM)
async function scrapeIvamExposiciones(context) {
  console.log('Scraping IVAM (Institut Valencià d’Art Modern)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  const months = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
  const events = [];

  try {
    const res = await context.request.get('https://www.ivam.es/es/exposiciones/', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 20000,
    });

    if (!res.ok()) {
      console.warn('IVAM request status: ' + res.status());
      return [];
    }

    const html = await res.text();
    const cards = html.split(/class="[^"]*ivam-post-card\b/i).slice(1);

    for (const card of cards) {
      const titleM = card.match(/class="ivam-post-card__title">([\s\S]*?)<\/h3>/i);
      const linkM = card.match(/href="(https:\/\/ivam\.es\/es\/exposiciones\/[^"]+)"/i);
      const imgM = card.match(/class="ivam-post-card__img"[^>]*src="([^"]+)"/i);
      const dateM = card.match(/<p class="date">([\s\S]*?)<\/p>/i);
      const venueM = card.match(/<span>(IVAM[^<]*)<\/span>/i);

      if (!titleM || !linkM) continue;
      const title = toNaturalCase(titleM[1].replace(/<[^>]+>/g, '').trim());
      const link = linkM[1];
      const img = imgM ? imgM[1] : CULTURAL_FALLBACKS.exposicions;
      const dateRaw = dateM ? dateM[1].replace(/<[^>]+>/g, '').trim() : '';
      const venue = venueM ? venueM[1].trim() : 'IVAM Centre Julio González';

      const dateParts = dateRaw.split(/\s*[-–—]\s*/);
      const parseDate = (str) => {
        const m = str.match(/(\d{1,2})\s+([a-zçà-ú]{3,4})\.?\s+(\d{4})/i);
        if (!m) return null;
        const day = parseInt(m[1], 10);
        const monKey = m[2].toLowerCase().slice(0, 3);
        const mon = months[monKey];
        const yr = parseInt(m[3], 10);
        if (!mon || !yr) return null;
        return `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      };

      const startIso = parseDate(dateParts[0]);
      const endIso = dateParts[1] ? parseDate(dateParts[1]) : undefined;

      if (!startIso) continue;
      const effectiveEnd = endIso || startIso;
      if (effectiveEnd < todayStr) continue;
      if (startIso > cutoffStr) continue;

      const slug = link.replace(/.*\/exposiciones\/([^/]+)\/?$/, '$1') || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      events.push({
        id: `ivam-expo-${slug}`,
        title,
        description: `Exposición oficial en el Institut Valencià d’Art Modern (IVAM). ${dateRaw}`,
        category: 'exposicions',
        startDate: `${startIso}T10:00:00.000Z`,
        endDate: endIso ? `${endIso}T20:00:00.000Z` : undefined,
        venueName: venue,
        address: 'Guillem de Castro, 118, 46003 València',
        imageUrl: img,
        isFree: false,
        ticketPrice: '5 €',
        ticketUrl: link,
        url: link,
        source: 'ivam',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`IVAM scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official IVAM exhibitions.`);
  return events;
}

// 2d. Museum Anchor: Museu de Belles Arts de València (MuBAV)
async function scrapeMubavExposiciones(context) {
  console.log('Scraping MuBAV (Museu de Belles Arts de València)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  const events = [];

  try {
    const res = await context.request.get('https://museobellasartesvalencia.gva.es/es/exposiciones', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 20000,
    });

    if (!res.ok()) {
      console.warn('MuBAV request status: ' + res.status());
      return [];
    }

    const html = await res.text();
    const actualBlock = html.split('Exposiciones actuales')[1]?.split('Exposiciones pasadas')[0] || '';
    const items = actualBlock.split(/class="[^"]*asset-item\b/i).slice(1);

    for (const it of items) {
      const titleM = it.match(/class="[^"]*asset-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const dateM = it.match(/class="[^"]*asset-summary[^"]*"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/i);
      const imgM = it.match(/style=['"]background-image:url\(([^)]+)\)['"]/i);

      if (!titleM) continue;
      const link = titleM[1].replace(/&amp;/g, '&');
      const title = toNaturalCase(titleM[2].replace(/<[^>]+>/g, '').trim());
      const dateText = dateM ? dateM[1].replace(/<[^>]+>/g, '').trim() : '';
      const img = imgM ? imgM[1] : CULTURAL_FALLBACKS.exposicions;

      const mDel = dateText.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})\s+(?:al|a|-)\s+(\d{1,2})[./](\d{1,2})[./](\d{4})/i);
      let sIso = null;
      let eIso = null;
      if (mDel) {
        sIso = `${mDel[3]}-${mDel[2].padStart(2, '0')}-${mDel[1].padStart(2, '0')}`;
        eIso = `${mDel[6]}-${mDel[5].padStart(2, '0')}-${mDel[4].padStart(2, '0')}`;
      }

      if (!sIso) continue;
      const effectiveEnd = eIso || sIso;
      if (effectiveEnd < todayStr) continue;
      if (sIso > cutoffStr) continue;

      events.push({
        id: `mubav-expo-${normalizeKey(title).slice(0, 30)}-${sIso}`,
        title,
        description: `Exposición en el Museu de Belles Arts de València (San Pío V). ${dateText}`,
        category: 'exposicions',
        startDate: `${sIso}T10:00:00.000Z`,
        endDate: eIso ? `${eIso}T20:00:00.000Z` : undefined,
        venueName: 'Museu de Belles Arts de València (MuBAV)',
        address: 'Carrer de Sant Pius V, 9, 46010 València',
        imageUrl: img,
        isFree: true,
        ticketPrice: undefined,
        ticketUrl: link,
        url: link,
        source: 'mubav',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`MuBAV scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official MuBAV exhibitions.`);
  return events;
}

// 2e. Performing Arts Anchor: Teatre Talia & Teatre Olympia (Olympia Metropolitana)
async function scrapeTaliaCartelera(context) {
  console.log('Scraping Teatre Talia & Teatre Olympia (Olympia Metropolitana)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  const months = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
  const events = [];

  try {
    const res = await context.request.get('https://www.teatretalia.es/cartelera', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 20000,
    });

    if (!res.ok()) {
      console.warn('Teatre Talia request status: ' + res.status());
      return [];
    }

    const html = await res.text();
    const cards = html.split(/class="[^"]*inner[^"]*"/i).slice(1);

    for (const card of cards) {
      const titleM = card.match(/<h3[^>]*class="widget-title"[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h3>/i);
      const dateM = card.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i);
      const imgM = card.match(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/i);

      if (!titleM) continue;
      const rawHref = titleM[1];
      const link = rawHref.startsWith('http') ? rawHref : `https://www.teatretalia.es${rawHref}`;
      const title = toNaturalCase(titleM[2].replace(/<[^>]+>/g, '').trim());
      const dateText = dateM ? dateM[1].replace(/<[^>]+>/g, '').trim() : '';
      const img = imgM ? imgM[1] : CULTURAL_FALLBACKS.teatre;

      let sIso = null;
      let eIso = null;

      const mHasta = dateText.match(/(?:hasta\s+el\s+|al\s+)?(\d{1,2})\s+(?:de\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-z]*\s*(\d{4})?/i);
      const mDel = dateText.match(/del\s+(\d{1,2})\s+al\s+(\d{1,2})\s+(?:de\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-z]*\s*(\d{4})?/i);

      if (mDel) {
        const sDay = parseInt(mDel[1], 10);
        const eDay = parseInt(mDel[2], 10);
        const mon = months[mDel[3].toLowerCase().slice(0, 3)];
        const yr = mDel[4] ? parseInt(mDel[4], 10) : now.getFullYear();
        if (mon) {
          sIso = `${yr}-${String(mon).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;
          eIso = `${yr}-${String(mon).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;
        }
      } else if (mHasta) {
        const day = parseInt(mHasta[1], 10);
        const mon = months[mHasta[2].toLowerCase().slice(0, 3)];
        const yr = mHasta[3] ? parseInt(mHasta[3], 10) : now.getFullYear();
        if (mon) {
          const target = `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (target >= todayStr) {
            sIso = todayStr;
            eIso = target;
          }
        }
      }

      if (!sIso) continue;
      const effectiveEnd = eIso || sIso;
      if (effectiveEnd < todayStr) continue;
      if (sIso > cutoffStr) continue;

      events.push({
        id: `talia-${normalizeKey(title).slice(0, 30)}-${sIso}`,
        title,
        description: `Espectáculo en cartelera en el Teatre Talia. ${dateText}`,
        category: 'teatre',
        startDate: `${sIso}T19:00:00.000Z`,
        endDate: eIso ? `${eIso}T21:00:00.000Z` : undefined,
        venueName: 'Teatre Talia',
        address: 'Carrer dels Cavallers, 31, 46001 València',
        imageUrl: img,
        isFree: false,
        ticketPrice: undefined,
        ticketUrl: link,
        url: link,
        source: 'talia',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`Teatre Talia scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official Talia shows.`);
  return events;
}

// 2f. Municipal Theaters: La Mutant & TEM (Ajuntament de València)
async function scrapeLaMutant(context) {
  console.log('Scraping La Mutant (Teatre Municipal)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  const events = [];

  try {
    const res = await context.request.get('https://lamutant.com/programacio/', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 20000,
    });

    if (!res.ok()) {
      console.warn('La Mutant request status: ' + res.status());
      return [];
    }

    const html = await res.text();
    const items = html.split(/class=['"][^'"]*av-masonry-entry\b/i).slice(1);

    for (const it of items) {
      const titleM = it.match(/title=['"]([^'"]+)['"]/i);
      const linkM = it.match(/data-av-masonry-custom-link=['"]([^'"]+)['"]/i) || it.match(/href=['"](https:\/\/www\.lamutant\.com\/[^'"]+)['"]/i);
      const imgM = it.match(/<img[^>]*src=['"]([^'"]+)['"]/i);

      if (!titleM || !linkM) continue;
      const rawTitle = titleM[1].replace(/&#8217;/g, '’').replace(/&amp;/g, '&').trim();
      const title = toNaturalCase(rawTitle);
      const link = linkM[1];
      const img = imgM ? imgM[1] : CULTURAL_FALLBACKS.teatre;

      events.push({
        id: `mutant-${normalizeKey(title).slice(0, 30)}-${Date.now()}`,
        title,
        description: 'Programación oficial en La Mutant (Espacio de Artes Vivas de València)',
        category: 'teatre',
        startDate: `${todayStr}T19:00:00.000Z`,
        venueName: 'La Mutant',
        address: 'Carrer de Joan Verdaguer, 22, 46024 València',
        imageUrl: img,
        isFree: false,
        ticketUrl: link,
        url: link,
        source: 'lamutant',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`La Mutant scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official La Mutant events.`);
  return events;
}

// 3. Live Scraper for Fundación Deportiva Municipal (FDM València)
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

    if (context && rawItems.length > 0) {
      await Promise.allSettled(
        rawItems.map(async (item) => {
          try {
            const res = await context.request.get(item.url, { timeout: 6000 });
            if (res.ok()) {
              const html = await res.text();

              const mapAnchorMatch = html.search(/(?:Abrir en Maps|google\.com\/maps|maps\.google\.com)/i);
              if (mapAnchorMatch !== -1) {
                const afterMap = html.slice(mapAnchorMatch, mapAnchorMatch + 3500);
                const endBlockMatch = afterMap.search(/(?:Entidad organizadora|Categor[ií]as del evento|Quiero inscribirme)/i);
                const sidebarSlice = endBlockMatch !== -1 ? afterMap.slice(0, endBlockMatch) : afterMap;

                const candidateLines = sidebarSlice
                  .replace(/<(?:br|\/p|\/div|\/li|h\d)[^>]*>/gi, '\n')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean);

                const addressLine = candidateLines.find((line) => {
                  const lower = line.toLowerCase();
                  if (lower.length < 5 || lower.length > 160) return false;
                  if (/abrir en maps|google|t[eé]rminos|datos del mapa|teclas|notificar|combinaciones|inscribirme/i.test(lower)) return false;
                  if (/^https?:\/\//i.test(lower) || /m[aá]s informaci[oó]n/i.test(lower)) return false;
                  if (/\b(?:\d{1,2}:\d{2}|\d{1,2}\s+(?:de\s+)?[a-z]+|s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes)\b/i.test(lower)) return false;
                  return true;
                });

                if (addressLine) {
                  item.parsedAddress = addressLine.replace(/\s+/g, ' ').trim();
                }
              }

              if (!item.parsedAddress) {
                const cleanBody = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
                const bodyMatch = cleanBody.match(/(?:tendr[aá]\s+lugar\s+en|arrancar[aá]\s+(?:a\s+las\s+\d{1,2}:\d{2}\s+horas\s+)?desde|celebrar[aá]\s+en|salida\s+desde)\s+([^,.;]{4,75})/i);
                if (bodyMatch && bodyMatch[1]) {
                  item.parsedAddress = bodyMatch[1].trim();
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
        startDateIso = extractDateFromAnyText(item.containerText) || extractDateFromAnyText(item.dateText);
      }

      if (!startDateIso) continue;
      const dt = new Date(startDateIso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      let venue = 'València';
      let fullAddress = 'València';

      if (item.parsedAddress) {
        fullAddress = item.parsedAddress;

        const cleanStr = fullAddress
          .replace(/^(?:salida\s+(?:desde\s+(?:el|la|l')?|en\s+(?:el|la|l')?|desde|en)?|meta\s+en|lugar:\s*|arranque\s+desde\s*|a\s+la\s+altura\s+de\s*)/i, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim();

        const expanded = cleanStr
          .replace(/\b(?:l')?av(?:inguda|enida|da)?\.?\s+/gi, 'Avenida ')
          .replace(/\b(?:carrer|calle|c\/|c\.)\s+/gi, 'Calle ')
          .replace(/\b(?:plaça|placa|plaza|pza|pl)\.?\s+/gi, 'Plaza ')
          .replace(/\b(?:passeig|paseo|pº|pg)\.?\s+/gi, 'Paseo ')
          .replace(/\bdr\.\s*/gi, 'Doctor ')
          .replace(/\bprof\.\s*/gi, 'Profesor ')
          .trim();

        const dotSplit = expanded.split(/[.\n–—]/).map((s) => s.trim()).filter(Boolean);
        if (dotSplit.length > 1 && dotSplit[0].length >= 6) {
          venue = dotSplit[0];
        } else {
          venue = expanded;
        }
      } else {
        if (/Sant Marcel/i.test(item.title)) { venue = 'Sant Marcel·lí'; fullAddress = 'Avenida de Tres Cruces, junto al Cementerio de Valencia'; }
        else if (/Falles/i.test(item.title)) { venue = 'Plaza del Ayuntamiento'; fullAddress = 'Plaza del Ayuntamiento, València'; }
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
        source: 'fdm',
        authority: 1,
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

      const isWomenMatch =
        /\bvalencia\s+bc\b/i.test(rawText) ||
        /\bfemenin[oa]\b/i.test(rawText) ||
        /women/i.test(rawText) ||
        /lf\s*endesa/i.test(rawText);

      const valenciaTeamName = isWomenMatch ? 'Valencia BC' : 'Valencia Basket';

      const isFonteta = /fonteta|font de sant llu[ií]s/i.test(rawText);
      const venueName = isFonteta ? 'Pavelló Font de Sant Lluís' : 'Roig Arena';
      const address = isFonteta
        ? 'Avinguda dels Germans Maristes, 16, 46013 València'
        : 'Carrer del Bomber Ramon Duart, s/n, 46013 València';

      const compName = isWomenMatch
        ? (/euroleague|euroliga/i.test(rawText) ? 'EuroLeague Women' : 'LF Endesa')
        : (/euroleague|euroliga/i.test(rawText) ? 'EuroLeague' : 'Liga Endesa ACB');

      const fullTitle = `${valenciaTeamName} vs ${toNaturalCase(opponent)}`;
      if (isAwayMatch(fullTitle, venueName)) continue;

      events.push({
        id: `vbc-${events.length + 1}-${Date.now()}`,
        title: fullTitle,
        description: `Partido oficial de ${compName} en el ${venueName} frente al ${opponent}`,
        category: 'esports',
        startDate: iso,
        venueName: venueName,
        address: address,
        imageUrl: SPORTS_FALLBACKS.basket,
        isFree: false,
        ticketUrl: CALENDAR_URL,
        url: CALENDAR_URL,
        source: 'vbc',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`Valencia Basket dynamic scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} live Valencia Basket matches.`);
  return events;
}

// 5. Live Scraper for Valencia CF
async function scrapeValenciaCF(page, context) {
  console.log('Scraping Valencia CF live ticketing...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
  const URLS = ['https://www.valenciacf.com/tickets', 'https://www.valenciacf.com/entradas'];

  for (const url of URLS) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(2000);

      const matches = await page.evaluate(() => {
        const items = [];
        const blocks = document.querySelectorAll('article, [class*="card"], [class*="match"], [class*="fixture"], li');

        blocks.forEach((b) => {
          const text = b.innerText || '';
          if (
            /Valencia/i.test(text) &&
            (/Mestalla|Puchades|Paterna|Femenin|Liga\s*F/i.test(text) || /entradas|ticket|comprar/i.test(text))
          ) {
            const btn = b.querySelector('a[href*="ticket"], a[href*="entradas"], a');
            const imgEl = b.querySelector('img');
            items.push({
              rawText: text,
              link: btn ? btn.href : 'https://www.valenciacf.com/tickets',
              img: imgEl ? imgEl.src || imgEl.getAttribute('data-src') : null,
            });
          }
        });
        return items;
      });

      for (const m of matches) {
        let detailData = null;
        if (m.link && context) {
          try {
            const res = await context.request.get(m.link, { timeout: 6000 });
            if (res.ok()) {
              const html = await res.text();
              detailData = parseEventJsonLd(html);
            }
          } catch (_) {}
        }

        const iso = detailData?.startDate || extractDateFromAnyText(m.rawText);
        if (!iso) continue;
        const dt = new Date(iso);
        if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

        const isWomen =
          /femenin[oa]|futfem|\bliga\s*f\b|puchades|paterna|vcf\s*fem/i.test(m.rawText) ||
          /femenin/i.test(m.link);

        const isPuchades = /puchades|paterna|ciutat esportiva/i.test(m.rawText);
        const venueName = detailData?.venueName || (isPuchades || (isWomen && !/mestalla/i.test(m.rawText))
          ? 'Estadio Antonio Puchades'
          : 'Estadio de Mestalla');

        const address = detailData?.address || (venueName === 'Estadio Antonio Puchades'
          ? 'Ciutat Esportiva de Paterna, Carrer dels Jocs Taronja, 46988 Paterna, València'
          : 'Avinguda de Suècia, s/n, 46010 València');

        let opponent = isWomen ? 'Liga F Match' : 'LaLiga Match';
        const lines = m.rawText.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const l of lines) {
          if (
            !/valencia|femenin|vcf|mestalla|puchades|paterna|ticket|entradas|laliga|liga\s*f|copa|vip|jornada|\d{1,2}:\d{2}|\d{1,2}\s+[a-z]+/i.test(l) &&
            l.length > 2 &&
            l.length < 35
          ) {
            opponent = l;
            break;
          }
        }

        const teamTitle = isWomen ? 'Valencia CF Femenino' : 'Valencia CF';
        const fullTitle = `${teamTitle} vs ${toNaturalCase(opponent)}`;

        if (isAwayMatch(fullTitle, venueName)) continue;

        const competition = isWomen
          ? (/copa/i.test(m.rawText) ? 'Copa de la Reina' : 'Liga F')
          : (/champions/i.test(m.rawText) ? 'UEFA Champions League' : /copa/i.test(m.rawText) ? 'Copa del Rey' : 'LaLiga EA Sports');

        events.push({
          id: `vcf-${events.length + 1}-${Date.now()}`,
          title: fullTitle,
          description: `Partido oficial de ${competition} en el ${venueName} frente al ${opponent}`,
          category: 'esports',
          startDate: iso,
          venueName: venueName,
          address: address,
          imageUrl: m.img || detailData?.imageUrl || SPORTS_FALLBACKS.football,
          isFree: false,
          ticketUrl: m.link,
          url: m.link,
          source: 'vcf',
          authority: 1,
        });
      }
    } catch (err) {
      console.warn(`Valencia CF live scrape notice (${url}): ${err.message}`);
    }
  }

  console.log(`Ingested ${events.length} live Valencia CF matches.`);
  return events;
}

// 6. Live Scraper for Levante UD (Deep JSON-LD & Date Protection)
async function scrapeLevanteUD(page, context) {
  console.log('Scraping Levante UD live ticketing...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://ticketing.levanteud.com', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);

    const matches = await page.evaluate(() => {
      const items = [];
      const links = Array.from(
        document.querySelectorAll(
          'a.evento, a[href*="/liga-"], a[href*="/entradas/"], a[href*="levante"], a[href*="futfem"], a[href*="femenino"], a[href*="bunol"]'
        )
      );
      const seen = new Set();

      for (const a of links) {
        const href = a.href;
        if (seen.has(href) || href.includes('javascript') || href.endsWith('.pdf')) continue;

        const container = a.closest('article, [class*="card"], [class*="item"], div') || a;
        const text = (container.innerText || '') + ' ' + (a.getAttribute('title') || '');

        if (
          (/Levante/i.test(text) || /bunol|futfem/i.test(href)) &&
          (/vs\.?|x\s+/i.test(text) || /entradas|comprar/i.test(text) || a.classList.contains('evento'))
        ) {
          seen.add(href);
          const imgEl = container.querySelector('img');
          items.push({
            href,
            rawText: text,
            titleAttr: a.getAttribute('title') || '',
            img: imgEl ? imgEl.src || imgEl.getAttribute('data-src') : null,
          });
        }
      }
      return items;
    });

    for (const m of matches) {
      let detailData = null;
      let detailHtml = '';

      if (m.href && context) {
        try {
          const res = await context.request.get(m.href, { timeout: 8000 });
          if (res.ok()) {
            detailHtml = await res.text();
            detailData = parseEventJsonLd(detailHtml);
          }
        } catch (_) {}
      }

      let iso = detailData?.startDate;

      if (!iso) {
        iso = extractDateFromAnyText(detailHtml) || extractDateFromAnyText(m.rawText);
      } else {
        iso = reconcileDateWithText(iso, detailHtml || m.rawText);
      }

      if (!iso) continue;
      const dt = new Date(iso);
      if (dt < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

      const isWomen =
        /femenin[oa]|futfem|\bliga\s*f\b|bu[ñn]ol/i.test(m.rawText + ' ' + m.href + ' ' + (detailData?.title || ''));

      const isBunol =
        /bu[ñn]ol|ciutat esportiva/i.test(m.rawText + ' ' + m.href) ||
        /bunol/i.test(m.href);

      const venueName = isBunol
        ? 'Ciudad Deportiva de Buñol'
        : (detailData?.venueName || (/ciutat de val[èe]ncia/i.test(m.rawText) || !isWomen ? 'Estadio Ciutat de València' : 'Ciudad Deportiva de Buñol'));

      const address = venueName === 'Ciudad Deportiva de Buñol'
        ? 'Camino del Oliveral, s/n, 46360 Buñol, València'
        : 'Carrer de Sant Vicent de Paül, 44, 46019 València';

      const lowerCombo = (m.href + ' ' + m.rawText + ' ' + detailHtml).toLowerCase();
      let competition = 'LaLiga EA Sports';
      if (isWomen) {
        competition = lowerCombo.includes('primera federacion') || lowerCombo.includes('primera-federacion')
          ? 'Primera Federación FutFem'
          : lowerCombo.includes('copa') ? 'Copa de la Reina' : 'Liga F';
      } else {
        competition = lowerCombo.includes('hypermotion') || lowerCombo.includes('segunda')
          ? 'LaLiga Hypermotion'
          : lowerCombo.includes('copa') ? 'Copa del Rey' : 'LaLiga EA Sports';
      }

      const teamTitle = isWomen ? 'Levante UD Femenino' : 'Levante UD';
      let opponent = detailData?.title ? detailData.title.replace(/Levante(?:\s+UD)?(?:\s+Femenino)?\s+(?:vs\.?|x|-)\s+/i, '').trim() : '';

      if (!opponent) {
        const candidateTitle = m.titleAttr || m.rawText;
        const matchTitle = candidateTitle.match(/Levante(?:\s+UD)?(?:\s+Femenino|\s+Fem)?\s+(?:vs\.?|x|-)\s+([A-Za-zÁ-ÿ\s]+)/i);
        if (matchTitle) {
          opponent = matchTitle[1]
            .split('\n')[0]
            .replace(/\b(?:Buñol|Entradas|Comprar|Ver)\b/gi, '')
            .trim();
        }
      }

      if (!opponent) opponent = isWomen ? 'Liga F Match' : 'LaLiga Match';

      const fullTitle = `${teamTitle} vs ${toNaturalCase(opponent)}`;

      if (isAwayMatch(fullTitle, venueName)) continue;

      events.push({
        id: `lud-${events.length + 1}-${Date.now()}`,
        title: fullTitle,
        description: `Partido oficial de ${competition} en ${venueName} frente al ${toNaturalCase(opponent)}`,
        category: 'esports',
        startDate: iso,
        venueName: venueName,
        address: address,
        imageUrl: detailData?.imageUrl || m.img || SPORTS_FALLBACKS.football,
        isFree: false,
        ticketUrl: m.href,
        url: m.href,
        source: 'lud',
        authority: 1,
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
    extraHTTPHeaders: {
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
  });

  let musicEvents = [];
  try {
    const page = await context.newPage();
    musicEvents = await scrapeSongkick(page, context);
    await page.close();
  } catch (e) {
    console.error('Songkick error:', e.message);
  }

  let auEvents = [];
  try {
    auEvents = await scrapeAuAgenda(context);
  } catch (e) {
    console.error('AU Agenda error:', e.message);
  }

  let ivcEvents = [];
  try {
    ivcEvents = await scrapeIvcOpenData(context);
  } catch (e) {
    console.error('IVC Open Data error:', e.message);
  }

  let ivamEvents = [];
  try {
    ivamEvents = await scrapeIvamExposiciones(context);
  } catch (e) {
    console.error('IVAM error:', e.message);
  }

  let mubavEvents = [];
  try {
    mubavEvents = await scrapeMubavExposiciones(context);
  } catch (e) {
    console.error('MuBAV error:', e.message);
  }

  let taliaEvents = [];
  try {
    taliaEvents = await scrapeTaliaCartelera(context);
  } catch (e) {
    console.error('Teatre Talia error:', e.message);
  }

  let mutantEvents = [];
  try {
    mutantEvents = await scrapeLaMutant(context);
  } catch (e) {
    console.error('La Mutant error:', e.message);
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
    vcfEvents = await scrapeValenciaCF(page, context);
    await page.close();
  } catch (e) {
    console.error('Valencia CF error:', e.message);
  }

  let ludEvents = [];
  try {
    const page = await context.newPage();
    ludEvents = await scrapeLevanteUD(page, context);
    await page.close();
  } catch (e) {
    console.error('Levante UD error:', e.message);
  }

  await browser.close();

  // Combine all sources: Authoritative institutional feeds + AU Agenda
  const combined = [
    ...fdmEvents,
    ...vbcEvents,
    ...vcfEvents,
    ...ludEvents,
    ...musicEvents,
    ...ivcEvents,
    ...ivamEvents,
    ...mubavEvents,
    ...taliaEvents,
    ...mutantEvents,
    ...auEvents,
  ];

  console.log(`Total events consolidated before validation: ${combined.length}`);

  const processed = combined.map((ev) => {
    let startDate = (ev.startDate || '').trim();
    let endDate = (ev.endDate || '').trim();
    let venueName = ev.venueName;
    let address = ev.address;
    let description = ev.description;

    const normKey = normalizeKey(ev.title);

    // Apply Verified Fixtures Safety Registry Override
    if (VERIFIED_FIXTURES[normKey]) {
      const fix = VERIFIED_FIXTURES[normKey];
      startDate = fix.startDate;
      if (fix.endDate) endDate = fix.endDate;
      if (fix.venueName) venueName = fix.venueName;
      if (fix.address) address = fix.address;
      if (fix.description) description = fix.description;
    }

    return {
      ...ev,
      startDate,
      endDate: endDate || undefined,
      venueName,
      address,
      description,
    };
  }).filter((ev) => {
    // Drop away matches
    if (ev.category === 'esports' && isAwayMatch(ev.title, ev.venueName)) {
      return false;
    }
    return true;
  });

  // Multi-Source Deduplication & Enrichment Pipeline:
  // Detects and unifies duplicate events from AU Agenda, official portals (Olympia, Talia, IVC, MuBAV, IVAM),
  // ticketing providers, and open data feeds based on date overlap, venue matching, title containment,
  // keyword overlap, and ticket URL slug matching.
  function cleanVenueForMatching(venue) {
    if (!venue) return '';
    let v = stripAccents(venue).toLowerCase();
    v = v.replace(/^(teatre|teatro|sala|auditori|auditorio|palacio de las artes|palau de les arts|palau de la musica|estadio de|centre|centro)\s+/gi, '');
    v = v.replace(/\b(valencia|valència)\b/gi, '');
    return v.trim();
  }

  function cleanTitleForComparison(title) {
    if (!title) return '';
    let t = stripAccents(title).toLowerCase();
    t = t.replace(/\s+@\s+.*$/, '');
    t = t.replace(/^(la rialleta|ciclo|cicle|festival|temporada|gira|espectaculo|obra|exposicion|exposicio|concierto|concert):\s*/gi, '');
    t = t.replace(/[\u2018\u2019\u201C\u201D\x27\x22`´:;–—\-.,?!()[\]{}]/g, ' ');
    return t.replace(/\s+/g, ' ').trim();
  }

  const STOPWORDS = new Set([
    'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'y', 'i', 'en', 'a', 'al', 'per', 'por', 'con', 'show', 'teatre', 'teatro',
    'valencia', 'valència', 'live', 'tour', 'trio', 'band', 'cia', 'cia.'
  ]);

  function extractSignificantKeywords(title) {
    const norm = cleanTitleForComparison(title);
    return norm.split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  }

  const GENERIC_SLUGS = new Set([
    'agenda', 'calendario', 'cartelera', 'eventos', 'espectaculos',
    'entradas', 'home', 'index', 'programacion', 'valencia', 'evento'
  ]);

  function extractSpecificSlug(url) {
    if (!url || url === '#') return '';
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      if (!parts.length) return '';
      let slug = parts[parts.length - 1];
      if (/^[A-Z0-9_-]{8,}$/.test(slug) && parts.length > 1) {
        slug = parts[parts.length - 2];
      }
      slug = slug.replace(/\.html?$/i, '').replace(/-\d+$/, '').toLowerCase();
      if (GENERIC_SLUGS.has(slug) || slug.length < 5) return '';
      return slug;
    } catch {
      return '';
    }
  }

  function isDirectTicketingUrl(url) {
    if (!url || url === '#') return false;
    return (
      /entradas|taquilla|servientradas|ticketmaster|wegow|notikumi|larambleta\.com|teatroenvalencia\.com|ivc\.gva\.es|ivam\.es|valenciabasket\.com/i.test(url) &&
      !/au-agenda\.com\/evento/i.test(url)
    );
  }

  function cleanTitleDisplay(title) {
    if (!title) return '';
    return title.replace(/^La Rialleta:\s*/i, '').trim();
  }

  function selectBestTitle(t1, t2) {
    const c1 = cleanTitleDisplay(t1);
    const c2 = cleanTitleDisplay(t2);

    if (c1.includes(':') && !c2.includes(':')) return c1;
    if (c2.includes(':') && !c1.includes(':')) return c2;

    if (c2.length > c1.length && c2.length < 75) return c2;
    return c1 || c2 || '';
  }

  function areEventsDuplicates(e1, e2) {
    if (e1.category !== e2.category) return false;

    if (e1.category === 'esports') {
      return (
        cleanTitleForComparison(e1.title) === cleanTitleForComparison(e2.title) &&
        (e1.startDate || '').slice(0, 10) === (e2.startDate || '').slice(0, 10)
      );
    }

    const d1 = (e1.startDate || '').slice(0, 10);
    const d2 = (e2.startDate || '').slice(0, 10);
    if (!d1 || !d2) return false;
    const sameDay = d1 === d2;

    let datesOverlap = sameDay;
    if (e1.category === 'exposicions') {
      const end1 = (e1.endDate || e1.startDate || '').slice(0, 10);
      const end2 = (e2.endDate || e2.startDate || '').slice(0, 10);
      datesOverlap = d1 <= end2 && end1 >= d2;
    }
    if (!datesOverlap) return false;

    const t1 = cleanTitleForComparison(e1.title);
    const t2 = cleanTitleForComparison(e2.title);

    if (t1 === t2 && sameDay) return true;

    const v1 = cleanVenueForMatching(e1.venueName);
    const v2 = cleanVenueForMatching(e2.venueName);
    const sameVenue = Boolean(v1 && v2 && (v1 === v2 || v1.includes(v2) || v2.includes(v1)));

    const slug1 = extractSpecificSlug(e1.ticketUrl || e1.url);
    const slug2 = extractSpecificSlug(e2.ticketUrl || e2.url);
    if (slug1 && slug2) {
      if (slug1 === slug2 || slug1.includes(slug2) || slug2.includes(slug1)) {
        if (sameDay || datesOverlap) return true;
      }
    }

    if (sameDay && sameVenue) {
      if (t1.includes(t2) || t2.includes(t1)) {
        const shorter = t1.length < t2.length ? t1 : t2;
        if (shorter.length >= 6) return true;
      }

      const kw1 = extractSignificantKeywords(e1.title);
      const kw2 = extractSignificantKeywords(e2.title);
      if (kw1.length > 0 && kw2.length > 0) {
        const set2 = new Set(kw2);
        const common = kw1.filter((k) => set2.has(k));
        const overlapRatio = common.length / Math.min(kw1.length, kw2.length);
        if (
          common.length >= 2 ||
          (overlapRatio === 1.0 && kw1.length >= 1 && kw2.length >= 1 && Math.min(kw1.length, kw2.length) >= 2)
        ) {
          return true;
        }
        if (common.length === 1 && common[0].length >= 7) {
          return true;
        }
      }
    }

    if (e1.category === 'musica' && sameDay && (sameVenue || !v1 || !v2)) {
      if (t1.includes(t2) || t2.includes(t1)) {
        const shorter = t1.length < t2.length ? t1 : t2;
        if (shorter.length >= 5) return true;
      }
    }

    return false;
  }

  function mergeDuplicateEvents(primary, secondary) {
    const auth1 = primary.authority || (primary.id && primary.id.startsWith('au-') ? 3 : 2);
    const auth2 = secondary.authority || (secondary.id && secondary.id.startsWith('au-') ? 3 : 2);

    let base = auth1 <= auth2 ? { ...primary } : { ...secondary };
    let other = auth1 <= auth2 ? secondary : primary;

    base.title = selectBestTitle(base.title, other.title);

    if (!isDirectTicketingUrl(base.ticketUrl) && isDirectTicketingUrl(other.ticketUrl)) {
      base.ticketUrl = other.ticketUrl;
    }
    if (!isDirectTicketingUrl(base.url) && isDirectTicketingUrl(other.url)) {
      base.url = other.url;
    }

    const isGenericImg = (img) =>
      !img || Object.values(CULTURAL_FALLBACKS).includes(img) || img.includes('fallback') || img.includes('placeholder');
    if (isGenericImg(base.imageUrl) && !isGenericImg(other.imageUrl)) {
      base.imageUrl = other.imageUrl;
    }

    if ((!base.description || base.description.length < 50) && other.description && other.description.length > 50) {
      base.description = other.description;
    }

    if (
      (!base.ticketPrice || base.ticketPrice === '0€' || base.ticketPrice === 'Gratis') &&
      other.ticketPrice &&
      other.ticketPrice !== '0€'
    ) {
      base.ticketPrice = other.ticketPrice;
    }

    if (!base.address && other.address) base.address = other.address;
    if (!base.venueName && other.venueName) base.venueName = other.venueName;
    if (!base.coordinates && other.coordinates) base.coordinates = other.coordinates;

    return base;
  }

  function deduplicateAndMergeEvents(list) {
    const mergedList = [];
    const processedIndices = new Set();

    for (let i = 0; i < list.length; i++) {
      if (processedIndices.has(i)) continue;
      let current = list[i];

      for (let j = i + 1; j < list.length; j++) {
        if (processedIndices.has(j)) continue;
        const candidate = list[j];
        if (areEventsDuplicates(current, candidate)) {
          current = mergeDuplicateEvents(current, candidate);
          processedIndices.add(j);
        }
      }

      mergedList.push(current);
      processedIndices.add(i);
    }

    return mergedList;
  }

  const validEvents = processed.filter((ev) => {
    const cleanTitle = (ev.title || '').trim();
    return (
      cleanTitle.length >= 4 &&
      !/^(event|evento|eventos|agenda|null|undefined)$/i.test(cleanTitle)
    );
  });

  const deduplicated = deduplicateAndMergeEvents(validEvents);

  const finalEvents = deduplicated.sort(
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
