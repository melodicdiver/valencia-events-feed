#!/usr/bin/env node
/**
 * Micalet FCM Topic Push Dispatcher (Zero external dependencies, Node 20+)
 *
 * Sends localized notifications via Firebase Cloud Messaging HTTP v1 API to:
 *   - weekend_es, weekend_va, weekend_en
 *   - weather_alerts_es, weather_alerts_va, weather_alerts_en
 *   - morning_brief_es, morning_brief_va, morning_brief_en
 *
 * Usage:
 *   node scripts/push/send-push.mjs --mode=weekend [--dry-run] [--check-schedule]
 *   node scripts/push/send-push.mjs --mode=weather_alerts [--dry-run] [--state-file=.push-state.json]
 *   node scripts/push/send-push.mjs --mode=morning_brief [--dry-run] [--check-schedule]
 *
 * Environment:
 *   FIREBASE_SERVICE_ACCOUNT  JSON string of a Firebase Admin service account (required unless --dry-run)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const VALENCIA_TZ = 'Europe/Madrid';
const VALENCIA_LAT = 39.4699;
const VALENCIA_LON = -0.3763;
const EVENTS_FEED_URL = 'https://melodicdiver.github.io/valencia-events-feed/events.json';
const FEEDS_CONFIG_URL = 'https://melodicdiver.github.io/valencia-events-feed/feeds.json';

const FALLBACK_RSS_URLS = [
  'https://www.valenciaextra.com/uploads/feeds/feed_valencia_es.xml',
  'https://www.levante-emv.com/rss/section/4503',
  'https://www.lasprovincias.es/rss/2.0/?section=valencia-ciudad',
  'https://www.apuntmedia.es/rss/noticies.xml',
];

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith('--mode='))?.split('=')[1] || '';
const dryRun = args.includes('--dry-run');
const checkSchedule = args.includes('--check-schedule');
const stateFileArg = args.find((a) => a.startsWith('--state-file='))?.split('=')[1] || '.push-alert-state.json';

const VALID_MODES = ['weekend', 'weather_alerts', 'morning_brief'];
if (!VALID_MODES.includes(modeArg)) {
  console.error(`Invalid or missing --mode. Expected one of: ${VALID_MODES.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Timezone helpers (Europe/Madrid — handles CET/CEST automatically)
// ---------------------------------------------------------------------------
function getMadridParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: VALENCIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  const hour = parseInt(get('hour'), 10) % 24;
  const minute = parseInt(get('minute'), 10);
  const isoDate = `${get('year')}-${get('month')}-${get('day')}`;
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    weekday: get('weekday'), // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    hour,
    minute,
    isoDate,
  };
}

function addDaysIso(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function shouldRunNowForSchedule(mode) {
  const now = getMadridParts();
  if (mode === 'morning_brief') {
    // Target: 09:30 Europe/Madrid (workflow fires at 07:30 & 08:30 UTC)
    return now.hour === 9;
  }
  if (mode === 'weekend') {
    // Target: Thursday 18:00 Europe/Madrid (workflow fires at 16:00 & 17:00 UTC Thu)
    return now.weekday === 'Thu' && now.hour === 18;
  }
  return true;
}

// ---------------------------------------------------------------------------
// FCM HTTP v1 Auth (RS256 JWT -> OAuth2 access_token)
// ---------------------------------------------------------------------------
function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getFcmAccessToken(serviceAccount) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 3600,
  };

  const unsignedJwt = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  const signature = signer.sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const assertion = `${unsignedJwt}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google OAuth2 token exchange failed (${tokenRes.status}): ${errText}`);
  }
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

async function sendTopicMessage({ projectId, accessToken, topic, title, body, data, channelId, highPriority = false }) {
  const payload = {
    message: {
      topic,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries({ ...data, topic }).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: highPriority ? 'HIGH' : 'NORMAL',
        notification: {
          channel_id: channelId,
          color: '#E85D04',
        },
      },
      apns: {
        headers: {
          'apns-priority': highPriority ? '10' : '5',
        },
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    },
  };

  if (dryRun) {
    console.log(`[DRY-RUN] Topic "${topic}":\n${JSON.stringify(payload, null, 2)}\n`);
    return { dryRun: true, topic };
  }

  const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`FCM send failed for topic "${topic}" (${res.status}): ${text}`);
  }
  console.log(`[SENT] Topic "${topic}" -> ${text}`);
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Data fetchers (Open-Meteo, Valencia Events Feed, Local RSS)
// ---------------------------------------------------------------------------
async function fetchOpenMeteo() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${VALENCIA_LAT}&longitude=${VALENCIA_LON}` +
    `&timezone=${encodeURIComponent(VALENCIA_TZ)}` +
    `&current=temperature_2m,weather_code,wind_gusts_10m` +
    `&hourly=temperature_2m,precipitation,weather_code,wind_gusts_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=5`;

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Open-Meteo failed (${res.status})`);
  return res.json();
}

function wmoShortLabel(code, lang) {
  const labels = {
    clear: { es: 'sol', va: 'sol', en: 'sunny' },
    partly: { es: 'nubes y claros', va: 'núvols i clars', en: 'partly cloudy' },
    cloudy: { es: 'nublado', va: 'ennuvolat', en: 'cloudy' },
    fog: { es: 'niebla', va: 'boira', en: 'foggy' },
    rain: { es: 'lluvia', va: 'pluja', en: 'rain' },
    storm: { es: 'tormenta', va: 'tempesta', en: 'storms' },
  };
  let key = 'partly';
  if (code === 0 || code === 1) key = 'clear';
  else if (code === 2) key = 'partly';
  else if (code === 3) key = 'cloudy';
  else if (code === 45 || code === 48) key = 'fog';
  else if (code >= 95) key = 'storm';
  else if (code >= 51) key = 'rain';
  return labels[key][lang] || labels[key].es;
}

function capitalizeHeadline(raw) {
  const cleaned = String(raw || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.replace(/^([«"¿¡'(\[\s]*)(\p{Ll})/u, (_, p, c) => `${p}${c.toLocaleUpperCase('es-ES')}`);
}

function truncateText(text, maxLen) {
  if (!text || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

async function fetchTopValenciaHeadline() {
  let feedUrls = [...FALLBACK_RSS_URLS];
  try {
    const cfgRes = await fetch(FEEDS_CONFIG_URL, { signal: AbortSignal.timeout(8000) });
    if (cfgRes.ok) {
      const cfg = await cfgRes.json();
      if (Array.isArray(cfg?.feeds)) {
        const active = cfg.feeds
          .filter((f) => f && f.url && f.enabled !== false && f.active !== false && f.disabled !== true)
          .filter((f) => !['deportes', 'sports'].includes(String(f.category || f.defaultCategory || '').toLowerCase()))
          .map((f) => f.url);
        if (active.length > 0) {
          feedUrls = [...active.slice(0, 6), ...FALLBACK_RSS_URLS];
        }
      }
    }
  } catch {
    // Use fallback RSS list
  }

  for (const rssUrl of feedUrls) {
    try {
      const res = await fetch(rssUrl, {
        headers: { 'User-Agent': 'MicaletPushBot/1.0 (+https://micalet.app)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const itemMatch = xml.match(/<item\b[\s\S]*?<\/item>/i);
      if (!itemMatch) continue;
      const titleMatch = itemMatch[0].match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const headline = capitalizeHeadline(titleMatch?.[1] || '');
      if (headline.length >= 20) {
        return headline;
      }
    } catch {
      // Try next outlet
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Mode 1: Weekend Plans Digest (weekend_es / weekend_va / weekend_en)
// ---------------------------------------------------------------------------
async function buildWeekendMessages() {
  const now = getMadridParts();
  // Upcoming Fri/Sat/Sun ISO dates relative to today in Madrid
  const dayOffsetMap = { Mon: 4, Tue: 3, Wed: 2, Thu: 1, Fri: 0, Sat: -1, Sun: -2 };
  const fridayOffset = dayOffsetMap[now.weekday] ?? 1;
  const weekendDates = new Set([
    addDaysIso(now.isoDate, fridayOffset),
    addDaysIso(now.isoDate, fridayOffset + 1),
    addDaysIso(now.isoDate, fridayOffset + 2),
  ]);

  let eventsCount = 0;
  let movieTitles = new Set();
  let featuredEventTitle = '';

  try {
    const res = await fetch(EVENTS_FEED_URL, { signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.events) ? json.events : [];
      for (const ev of list) {
        const startDay = String(ev?.startDate || '').slice(0, 10);
        if (!weekendDates.has(startDay)) continue;
        if (ev?.category === 'cine') {
          if (ev.title) movieTitles.add(String(ev.title).trim());
        } else {
          eventsCount += 1;
          if (!featuredEventTitle && ev?.title) {
            featuredEventTitle = String(ev.title).trim();
          }
        }
      }
    }
  } catch (err) {
    console.warn('Events feed warning:', err.message);
  }

  let satTemp = null;
  let satCode = 1;
  try {
    const weather = await fetchOpenMeteo();
    const satIso = addDaysIso(now.isoDate, fridayOffset + 1);
    const idx = weather?.daily?.time?.indexOf(satIso) ?? -1;
    if (idx >= 0) {
      satTemp = Math.round(weather.daily.temperature_2m_max[idx]);
      satCode = weather.daily.weather_code[idx];
    }
  } catch (err) {
    console.warn('Weekend weather warning:', err.message);
  }

  const moviesCount = movieTitles.size;

  const buildBody = (lang) => {
    const weatherPart = satTemp !== null ? `${satTemp}° ${wmoShortLabel(satCode, lang)}` : '';
    if (lang === 'va') {
      const parts = [];
      if (eventsCount > 0) parts.push(`${eventsCount} esdeveniments`);
      if (moviesCount > 0) parts.push(`${moviesCount} pel·lícules en cartellera`);
      if (weatherPart) parts.push(weatherPart);
      if (parts.length === 0) return 'Descobrix concerts, cinema i exposicions a València este cap de setmana.';
      return `${parts.join(' · ')}. Consulta l'agenda del cap de setmana.`;
    }
    if (lang === 'en') {
      const parts = [];
      if (eventsCount > 0) parts.push(`${eventsCount} events`);
      if (moviesCount > 0) parts.push(`${moviesCount} films in cinemas`);
      if (weatherPart) parts.push(weatherPart);
      if (parts.length === 0) return 'Discover concerts, cinema listings, and exhibitions across Valencia this weekend.';
      return `${parts.join(' · ')}. Explore your weekend plans in Valencia.`;
    }
    const parts = [];
    if (eventsCount > 0) parts.push(`${eventsCount} eventos`);
    if (moviesCount > 0) parts.push(`${moviesCount} películas en cartelera`);
    if (weatherPart) parts.push(weatherPart);
    if (parts.length === 0) return 'Descubre conciertos, estrenos de cine y exposiciones en València este finde.';
    return `${parts.join(' · ')}. Descubre los planes del finde en València.`;
  };

  return [
    {
      topic: 'weekend_es',
      title: 'Planes para este finde en València',
      body: buildBody('es'),
      data: { type: 'weekend', tab: 'events', timeframe: 'weekend' },
      channelId: 'micalet_general',
    },
    {
      topic: 'weekend_va',
      title: 'Plans per a este cap de setmana a València',
      body: buildBody('va'),
      data: { type: 'weekend', tab: 'events', timeframe: 'weekend' },
      channelId: 'micalet_general',
    },
    {
      topic: 'weekend_en',
      title: 'This weekend in Valencia',
      body: buildBody('en'),
      data: { type: 'weekend', tab: 'events', timeframe: 'weekend' },
      channelId: 'micalet_general',
    },
  ];
}

// ---------------------------------------------------------------------------
// Mode 2: Weather Alerts (weather_alerts_es / weather_alerts_va / weather_alerts_en)
// ---------------------------------------------------------------------------
function readAlertState() {
  try {
    if (fs.existsSync(stateFileArg)) {
      return JSON.parse(fs.readFileSync(stateFileArg, 'utf8'));
    }
  } catch {}
  return {};
}

function writeAlertState(state) {
  try {
    const dir = path.dirname(stateFileArg);
    if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFileArg, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn('Could not write alert state file:', err.message);
  }
}

async function buildWeatherAlertMessages() {
  const weather = await fetchOpenMeteo();
  const now = getMadridParts();
  const nowHourKey = `${now.isoDate}T${String(now.hour).padStart(2, '0')}:00`;

  const times = weather?.hourly?.time || [];
  let startIdx = times.findIndex((t) => t >= nowHourKey);
  if (startIdx < 0) startIdx = 0;

  // Inspect next 14 hours for genuinely alert-worthy conditions in Valencia
  const horizon = 14;
  let maxHourlyRain = 0;
  let totalRain12h = 0;
  let hasStorm = false;
  let maxGusts = 0;
  let maxTemp = -99;

  for (let i = startIdx; i < Math.min(times.length, startIdx + horizon); i++) {
    const rain = Number(weather.hourly.precipitation?.[i] || 0);
    const code = Number(weather.hourly.weather_code?.[i] || 0);
    const gust = Number(weather.hourly.wind_gusts_10m?.[i] || 0);
    const temp = Number(weather.hourly.temperature_2m?.[i] ?? -99);

    if (rain > maxHourlyRain) maxHourlyRain = rain;
    if (i < startIdx + 12) totalRain12h += rain;
    if (code >= 95) hasStorm = true;
    if (gust > maxGusts) maxGusts = gust;
    if (temp > maxTemp) maxTemp = temp;
  }

  let alertKind = null;
  let severity = 'moderate'; // 'moderate' | 'severe'

  if (hasStorm || maxHourlyRain >= 10 || totalRain12h >= 25) {
    alertKind = hasStorm ? 'storm' : 'heavy_rain';
    if (maxHourlyRain >= 20 || totalRain12h >= 45 || (hasStorm && maxHourlyRain >= 12)) {
      severity = 'severe';
    }
  } else if (maxGusts >= 65) {
    alertKind = 'wind';
    if (maxGusts >= 85) severity = 'severe';
  } else if (maxTemp >= 38) {
    alertKind = 'heat';
    if (maxTemp >= 41) severity = 'severe';
  }

  if (!alertKind) {
    console.log(
      `[WEATHER] No alert threshold met (maxRain=${maxHourlyRain.toFixed(1)}mm/h, rain12h=${totalRain12h.toFixed(1)}mm, storm=${hasStorm}, gusts=${Math.round(maxGusts)}km/h, maxTemp=${Math.round(maxTemp)}°C). Skipping.`
    );
    return [];
  }

  // Respect quiet hours (22:00 - 08:59 Madrid) except for severe warnings
  const isQuietHours = now.hour >= 22 || now.hour < 9;
  if (isQuietHours && severity !== 'severe') {
    console.log(`[WEATHER] Alert "${alertKind}" suppressed during quiet hours (${now.hour}:00 CET).`);
    return [];
  }

  // Deduplicate: do not repeat the same alert type within 12 hours
  const state = readAlertState();
  const lastSentAt = Number(state[alertKind] || 0);
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  if (!dryRun && Date.now() - lastSentAt < TWELVE_HOURS_MS) {
    console.log(`[WEATHER] Alert "${alertKind}" already sent within the last 12h. Skipping duplicate.`);
    return [];
  }

  const rainMm = Math.round(totalRain12h);
  const gustKmh = Math.round(maxGusts);
  const peakC = Math.round(maxTemp);

  const copy = {
    storm: {
      es: {
        title: 'Aviso de tormenta en València',
        body: `Se esperan tormentas y lluvias fuertes (${rainMm} mm previstos) en las próximas horas. Consulta la evolución por horas.`,
      },
      va: {
        title: 'Avís de tempesta a València',
        body: `S'esperen tempestes i pluges fortes (${rainMm} mm previstos) en les pròximes hores. Consulta la previsió per hores.`,
      },
      en: {
        title: 'Storm warning in Valencia',
        body: `Thunderstorms and heavy rain (${rainMm} mm expected) over the next hours. Check the hourly forecast.`,
      },
    },
    heavy_rain: {
      es: {
        title: 'Aviso de lluvia intensa en València',
        body: `Previsión de lluvia fuerte (${rainMm} mm en las próximas 12 h). Revisa el radar y las horas de mayor intensidad.`,
      },
      va: {
        title: 'Avís de pluja intensa a València',
        body: `Previsió de pluja forta (${rainMm} mm en les pròximes 12 h). Revisa les hores de major intensitat.`,
      },
      en: {
        title: 'Heavy rain alert in Valencia',
        body: `Heavy rainfall expected (${rainMm} mm over the next 12h). Check hourly timing before heading out.`,
      },
    },
    wind: {
      es: {
        title: 'Aviso por viento fuerte en València',
        body: `Rachas previstas de hasta ${gustKmh} km/h en las próximas horas. Consulta la previsión detallada.`,
      },
      va: {
        title: 'Avís per vent fort a València',
        body: `Ratxes previstes de fins a ${gustKmh} km/h en les pròximes hores. Consulta la previsió detallada.`,
      },
      en: {
        title: 'Strong wind alert in Valencia',
        body: `Wind gusts up to ${gustKmh} km/h forecast over the next hours. Check the detailed weather view.`,
      },
    },
    heat: {
      es: {
        title: 'Aviso por calor extremo en València',
        body: `Temperaturas máximas de hasta ${peakC}° hoy. Consulta las horas de mayor calor e índice UV.`,
      },
      va: {
        title: 'Avís per calor extrema a València',
        body: `Temperatures màximes de fins a ${peakC}° hui. Consulta les hores de més calor i l'índex UV.`,
      },
      en: {
        title: 'Extreme heat alert in Valencia',
        body: `Highs reaching ${peakC}° today. Check peak heat hours and UV index in Micalet.`,
      },
    },
  };

  if (!dryRun) {
    state[alertKind] = Date.now();
    writeAlertState(state);
  }

  return (['es', 'va', 'en']).map((lang) => ({
    topic: `weather_alerts_${lang}`,
    title: copy[alertKind][lang].title,
    body: copy[alertKind][lang].body,
    data: { type: 'weather_alerts', tab: 'weather', alert_kind: alertKind, severity },
    channelId: 'micalet_weather_alerts',
    highPriority: true,
  }));
}

// ---------------------------------------------------------------------------
// Mode 3: Morning Brief (morning_brief_es / morning_brief_va / morning_brief_en)
// ---------------------------------------------------------------------------
async function buildMorningBriefMessages() {
  const [weather, headline] = await Promise.all([
    fetchOpenMeteo().catch(() => null),
    fetchTopValenciaHeadline().catch(() => ''),
  ]);

  const maxTemp = weather?.daily?.temperature_2m_max?.[0];
  const minTemp = weather?.daily?.temperature_2m_min?.[0];
  const code = weather?.daily?.weather_code?.[0] ?? 1;
  const highStr = typeof maxTemp === 'number' ? `${Math.round(maxTemp)}°` : '';
  const lowStr = typeof minTemp === 'number' ? `${Math.round(minTemp)}°` : '';

  const shortHeadline = truncateText(headline, 95);

  const buildTitle = (lang) => {
    const cond = wmoShortLabel(code, lang);
    if (highStr && lowStr) {
      if (lang === 'va') return `Bon dia · ${highStr}/${lowStr} ${cond}`;
      if (lang === 'en') return `Good morning · ${highStr}/${lowStr} ${cond}`;
      return `Buenos días · ${highStr}/${lowStr} ${cond}`;
    }
    if (lang === 'va') return 'Bon dia, València';
    if (lang === 'en') return 'Good morning, Valencia';
    return 'Buenos días, València';
  };

  const buildBody = (lang) => {
    if (shortHeadline) return shortHeadline;
    if (lang === 'va') return "Consulta les notícies destacades i l'oratge de hui a València.";
    if (lang === 'en') return "Catch up on today's top local stories and weather in Valencia.";
    return 'Consulta las noticias destacadas y el tiempo de hoy en València.';
  };

  return (['es', 'va', 'en']).map((lang) => ({
    topic: `morning_brief_${lang}`,
    title: buildTitle(lang),
    body: buildBody(lang),
    data: { type: 'morning_brief', tab: 'news' },
    channelId: 'micalet_general',
  }));
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------
async function main() {
  if (checkSchedule && !shouldRunNowForSchedule(modeArg)) {
    const now = getMadridParts();
    console.log(
      `[SCHEDULE] Skipping "${modeArg}" — current Europe/Madrid time is ${now.weekday} ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}.`
    );
    return;
  }

  let messages = [];
  if (modeArg === 'weekend') {
    messages = await buildWeekendMessages();
  } else if (modeArg === 'weather_alerts') {
    messages = await buildWeatherAlertMessages();
  } else if (modeArg === 'morning_brief') {
    messages = await buildMorningBriefMessages();
  }

  if (messages.length === 0) {
    console.log(`[DONE] No messages to dispatch for mode="${modeArg}".`);
    return;
  }

  let projectId = 'micalet-dry-run';
  let accessToken = '';

  if (!dryRun) {
    const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawSa) {
      throw new Error(
        'Missing FIREBASE_SERVICE_ACCOUNT environment variable. Set it in GitHub Actions Secrets or pass --dry-run.'
      );
    }
    const serviceAccount = JSON.parse(rawSa);
    projectId = serviceAccount.project_id;
    accessToken = await getFcmAccessToken(serviceAccount);
  }

  for (const msg of messages) {
    await sendTopicMessage({
      projectId,
      accessToken,
      ...msg,
    });
  }

  console.log(`[DONE] Dispatched ${messages.length} topic message(s) for mode="${modeArg}".`);
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
