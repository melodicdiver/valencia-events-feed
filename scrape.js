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
  { pattern: /teatro carolina/i, name: 'Teatro Carolina', address: 'Carrer de Rugat, 10, 46021 València' },
  { pattern: /la m[aá]quina/i, name: 'La Máquina', address: 'Carrer del Pare Jofré, 7, 46007 València' },
  { pattern: /espai ctm/i, name: 'Espai CTM', address: 'Carrer de Pelai, 33, 46007 València' },
  { pattern: /patio de butacas/i, name: 'Patio de Butacas', address: 'Carrer de la Reina, 219, 46011 València' },
  { pattern: /artea(?:\s*espai)?/i, name: 'Artea Espai', address: "Carrer de la Vall d'Uixó, 3, 46014 València" },
  { pattern: /fusionart/i, name: 'Fusionart', address: "Carrer d'Aparisi i Guijarro, 8, 46003 València" },
  { pattern: /big bang/i, name: 'Big Bang', address: 'Carrer de Botànica Cabanilles, 32, 46010 València' },
  { pattern: /escalante|nau\s*(?:3\s*)?ribes/i, name: 'Teatre Escalante (Nau Ribes)', address: 'Nau 3 Ribes (Parc Central), Carrer de Filipines, s/n, 46006 València' },
  { pattern: /l['’]?horta/i, name: 'Sala L’Horta', address: 'Carrer de Sant Martí de Porres, 17, 46017 Castellar-Oliveral, València' },
  { pattern: /hub cultural(?:\s*cabanyal)?/i, name: 'HUB Cultural Cabanyal', address: 'Carrer de la Reina, 219, 46011 València' },
  { pattern: /la estrella|petxina|cabanyal/i, name: 'Teatro La Estrella', address: 'Carrer del Dr. Serrano, 21 / Carrer de los Ángeles, 33, València' },
  { pattern: /matilde salvador/i, name: 'Sala Matilde Salvador (La Nau)', address: 'Carrer de la Universitat, 2, 46003 València' },
  { pattern: /octubre|\boccc\b/i, name: 'Octubre Centre de Cultura Contemporània (OCCC)', address: 'Carrer de Sant Ferran, 12, 46001 València' },
  { pattern: /ca revolta/i, name: 'Ca Revolta', address: 'Carrer de Santa Teresa, 10, 46001 València' },
  { pattern: /batisfera/i, name: 'La Batisfera', address: 'Carrer de la Reina, 167, 46011 València' },
  { pattern: /kaf caf[eé]/i, name: 'Kaf Café', address: "Carrer d'Arquitecte Arnau, 16, 46020 València" },
  { pattern: /sporting club(?:\s*russafa)?/i, name: 'Sporting Club Russafa', address: 'Carrer de Sevilla, 5, 46006 València' },
  { pattern: /auditori.*torrent/i, name: 'L’Auditori de Torrent', address: 'Carrer de Vicent Pallardó, 25, 46900 Torrent, València' },
  { pattern: /g\.?\s*t\.?\s*alzira|gran teatre.*alzira/i, name: "Gran Teatre d'Alzira", address: 'Plaça de la Lluita Obrera, 46600 Alzira, València' },
  { pattern: /teatre agr[ií]cola|agr[ií]cola.*alboraia/i, name: 'Teatre Agrícola', address: 'Carrer de Cervantes, 3, 46120 Alboraia, València' },
  { pattern: /massamagrell/i, name: 'Centre Cultural de Massamagrell', address: 'Passeig del Rei en Jaume, s/n, 46130 Massamagrell, València' },
  { pattern: /teatreromadesagunt|teatre rom[aà].*sagunt|sagunto/i, name: 'Teatre Romà de Sagunt', address: 'Carrer del Teatre Romà, s/n, 46500 Sagunt, València' },
  { pattern: /palau de congressos|palacio de congresos|p\.?\s*congresos/i, name: 'Palau de Congressos de València', address: 'Avinguda de les Corts Valencianes, 60, 46015 València' },
  { pattern: /plazeta/i, name: 'La PlaZeta', address: 'Avinguda dels Germans Machado, 4, 46025 València' },
  { pattern: /prehist[oò]ria/i, name: 'Museu de Prehistòria de València', address: 'Carrer de la Corona, 36, 46003 València' },
  { pattern: /cer[aà]mica|dos aig[uü]es/i, name: 'Museu Nacional de Ceràmica', address: 'Carrer del Poeta Querol, 2, 46002 València' },
  { pattern: /chirivella soriano/i, name: 'Fundación Chirivella Soriano', address: 'Carrer de Valeriola, 13, 46001 València' },
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

const CDN_SALAS = 'https://cdn.jsdelivr.net/gh/melodicdiver/valencia-events-feed@main/logos_salas';

const VENUE_LOGO_RULES = [
  { file: 'salas.teatreprincipal_ph.png', regex: /\b(?:teatre|teatro)?\s*principal\b/i },
  { file: 'salas.teatrerialto_ph.png', regex: /\b(?:teatre|teatro)?\s*rialto\b/i },
  { file: 'salas.palaudelesartsreinasofia_ph.png', regex: /\b(?:palau\s*de\s*les\s*arts|les\s*arts|^p\.?\s*arts|reina\s*sof[ií]a)\b/i },
  { file: 'salas.teatrolympia_ph.png', regex: /\b(?:teatre|teatro)?\s*olympia\b/i },
  { file: 'salas.teatretalia_ph.png', regex: /\b(?:teatre|teatro)?\s*talia\b/i },
  { file: 'salas.teatreelmusical_ph.png', regex: /\b(?:teatre\s*el\s*musical|\btem\b)/i },
  { file: 'salas.lamutant_ph.png', regex: /\b(?:la\s*)?mutant\b/i },
  { file: 'salas.teatremicalet_ph.png', regex: /\b(?:teatre|teatro)?\s*micalet\b/i },
  { file: 'salas.larambleta_ph.png', regex: /\b(?:la\s*)?rambleta\b/i },
  { file: 'salas.teatroflumen_ph.png', regex: /\b(?:teatre|teatro)?\s*flumen\b/i },
  { file: 'salas.sportingclubrussafa_ph.png', regex: /\bsporting\s*club(?:\s*russafa)?\b/i },
  { file: 'salas.salarussafa_ph.png', regex: /\b(?:sala\s*)?russafa\b/i },
  { file: 'salas.espacioinestable_ph.png', regex: /\b(?:espacio|espai)\s*inestable\b/i },
  { file: 'salas.carmeteatre_ph.png', regex: /\bcarme\s*teatre\b/i },
  { file: 'salas.salaoff_ph.png', regex: /\b(?:sala\s*)?off\b/i },
  { file: 'salas.teatrocirculo_ph.png', regex: /\b(?:teatre|teatro)?\s*c[ií]rculo\b/i },
  { file: 'salas.teatrocarolina_ph.png', regex: /\b(?:teatre|teatro)\s*carolina\b/i },
  { file: 'salas.lamaquina_ph.png', regex: /\b(?:la\s*)?m[aá]quina(?:\s*teatro)?\b/i },
  { file: 'salas.espaictm_ph.png', regex: /\b(?:espai\s*)?ctm\b/i },
  { file: 'salas.elpatiodebutacas_ph.png', regex: /\b(?:el\s*)?patio\s*de\s*butacas\b/i },
  { file: 'salas.arteaespai_ph.png', regex: /\bartea(?:\s*espai)?\b/i },
  { file: 'salas.fusionart_ph.png', regex: /\bfusionart\b/i },
  { file: 'salas.bigbangsala_ph.png', regex: /\bbig\s*bang(?:\s*sala)?\b/i },
  { file: 'salas.teatreescalante_ph.png', regex: /\b(?:escalante|nau\s*(?:3\s*)?ribes)\b/i },
  { file: 'salas.lhortateatre_ph.png', regex: /\b(?:sala\s*)?l['’]?horta\b/i },
  { file: 'salas.hubculturalcabanyal_ph.png', regex: /\bhub\s*cultural(?:\s*cabanyal)?\b/i },
  { file: 'salas.teatrolaestrella_ph.png', regex: /\b(?:teatre|teatro)?\s*la\s*estrella\b|\bsala\s*(?:petxina|cabanyal)\b/i },
  { file: 'salas.espailagranja_ph.png', regex: /\b(?:espai\s*)?lagranja|la\s*granja\b/i },
  { file: 'salas.octubreccc_ph.png', regex: /\boctubre\s*(?:ccc|centre)|\boccc\b/i },
  { file: 'salas.carevolta_ph.png', regex: /\bca\s*revolta\b/i },
  { file: 'salas.labatisfera_ph.png', regex: /\b(?:la\s*)?batisfera\b/i },
  { file: 'salas.kafcafe_ph.png', regex: /\bkaf\s*caf[eé]\b/i },
  { file: 'salas.lauditoridetorrent_ph.png', regex: /\bauditori\s*(?:de\s*)?torrent\b/i },
  { file: 'salas.granteatredalzira_ph.png', regex: /\b(?:g\.?\s*t\.?\s*alzira|gran\s*teatre.*alzira)\b/i },
  { file: 'salas.teatreagricolaalboraia_ph.png', regex: /\b(?:teatre|teatro)?\s*agr[ií]cola\b/i },
  { file: 'salas.centreculturaldemassamagrell_ph.png', regex: /\b(?:centre\s*cultural|cultural)?.*massamagrell\b/i },
  { file: 'salas.teatreromadesagunt_ph.png', regex: /\b(?:teatre|teatro)?\s*rom[aà].*sagunt|sagunto\b/i },
  { file: 'salas.palaudecongressosdevalencia_ph.png', regex: /\b(?:palau\s*de\s*congressos|palacio\s*de\s*congresos|p\.?\s*congresos)\b/i },
  { file: 'salas.laplazeta_ph.png', regex: /\b(?:la\s*)?plazeta\b/i },
  { file: 'salas.institutvalenciadecultura_ph.png', regex: /\b(?:institut\s*valenci[aà]\s*de\s*cultura|\bivc\b)/i },

  { file: 'salas.ivaminstitutvalenciadartmodern_ph.png', regex: /\b(?:ivam|julio\s*gonz[aá]lez)\b/i },
  { file: 'salas.museudebellesartsdevalencia_ph.png', regex: /\b(?:mubav|belles\s*arts|bellas\s*artes|sant\s*pius\s*v)\b/i },
  { file: 'salas.centredelcarmecccc_ph.png', regex: /\b(?:cccc|centre\s*del\s*carme)\b/i },
  { file: 'salas.centredarthortensiaherrerocahh_ph.png', regex: /\b(?:cahh|hortensia\s*herrero)\b/i },
  { file: 'salas.fundacionbancaja_ph.png', regex: /\b(?:fundaci[oó]\s*)?bancaixa|bancaja\b/i },
  { file: 'salas.caixaforum_ph.png', regex: /\bcaixaforum\b/i },
  { file: 'salas.bombasgenscentredartsdigitals_ph.png', regex: /\bbombas\s*gens\b/i },
  { file: 'salas.muvim_ph.png', regex: /\bmuvim\b/i },
  { file: 'salas.letnomuseuvalenciadetnologia_ph.png', regex: /\b(?:l['’]?etno|etnologia)\b/i },
  { file: 'salas.museudeprehistoriadevalencia_ph.png', regex: /\bprehist[oò]ria\b/i },
  { file: 'salas.museonacionaldeceramica_ph.png', regex: /\b(?:cer[aà]mica|marqu[eé]s\s*de\s*dos\s*aig[uü]es)\b/i },
  { file: 'salas.lalmodidevalencia_ph.png', regex: /\bl['’]?almod[ií]\b/i },
  { file: 'salas.drassanesdelgrau_ph.png', regex: /\bdrassanes(?:\s*del\s*grau)?\b/i },
  { file: 'salas.salamunicipaldexposicions_ph.png', regex: /\bsala\s*municipal(?:\s*d['’]exposicions)?\b/i },
  { file: 'salas.lanaucentrecultural_ph.png', regex: /\b(?:la\s*nau|nau\s*centre\s*cultural|matilde\s*salvador)\b/i },
  { file: 'salas.fundacionchirivellasoriano_ph.png', regex: /\bchirivella\s*soriano\b/i },
  { file: 'salas.ateneomercantildevalencia_ph.png', regex: /\batene[ou]\s*mercantil\b/i },
  { file: 'salas.collegimajorrectorpreset_ph.png', regex: /\brector\s*peset\b/i },
  { file: 'salas.jardibotanicuv_ph.png', regex: /\bjard[ií]\s*bot[aà]nic\b/i },
  { file: 'salas.lareina121_ph.png', regex: /\breina\s*121\b/i },
  { file: 'salas.lasnaves_ph.png', regex: /\blas\s*naves\b/i },

  { file: 'salas.16toneladas_ph.png', regex: /\b(?:16\s*toneladas|diecis[eé]is\s*toneladas)\b/i },
  { file: 'salas.akuarelaplaya_ph.png', regex: /\bakuarela/i },
  { file: 'salas.barraca_ph.png', regex: /\bbarraca\b/i },
  { file: 'salas.blacknoteclub_ph.png', regex: /\bblack\s*note/i },
  { file: 'salas.centroexcursionista_ph.png', regex: /\bcentro\s*excursionista\b/i },
  { file: 'salas.chocolate_ph.png', regex: /\bchocolate\b/i },
  { file: 'salas.elvolander_ph.png', regex: /\b(?:el\s*)?volander\b/i },
  { file: 'salas.jerusalem_ph.png', regex: /\bjerusal[eé][mn]/i },
  { file: 'salas.la3_ph.png', regex: /\b(?:la\s*3|la3|la\s*tres)(?:\s*club)?\b/i },
  { file: 'salas.latex_ph.png', regex: /\bl[aá]tex\b/i },
  { file: 'salas.lococlub_ph.png', regex: /\bloco\s*club\b/i },
  { file: 'salas.marinabeachclub_ph.png', regex: /\bmarina\s*beach\b/i },
  { file: 'salas.matisseclub_ph.png', regex: /\bmatisse\b/i },
  { file: 'salas.moon_ph.png', regex: /\bmoon\b/i },
  { file: 'salas.myal umbracle_ph.png', regex: /\b(?:mya|umbracle)\b/i },
  { file: 'salas.palaualameda_ph.png', regex: /\bpalau\s*alameda\b/i },
  { file: 'salas.peterrockclub_ph.png', regex: /\bpeter\s*rock\b/i },
  { file: 'salas.piccadilly_ph.png', regex: /\bpiccadilly\b/i },
  { file: 'salas.radiocity_ph.png', regex: /\bradio\s*city\b/i },
  { file: 'salas.republicca_ph.png', regex: /\brepv?[bl]+ic+a\b/i },
  { file: 'salas.rockcity_ph.png', regex: /\brock\s*city\b/i },
  { file: 'salas.roigarena_ph.png', regex: /\b(?:roig\s*arena|arena\s*roig)\b/i },
  { file: 'salas.zuluklub_ph.png', regex: /\bzul[uú]/i },
  { file: 'salas.lamarina_ph.png', regex: /\b(?:la\s*)?marina\s*(?:de\s*val[eè]ncia|nord)?\b/i },
  { file: 'salas.palaudelamusica_ph.png', regex: /\bpalau\s*de\s*la\s*m[uú]sica\b/i },
];

function getVenuePlaceholderUrl(venueName, eventTitle, category) {
  if (!venueName && !eventTitle) return null;
  const rawCombined = `${venueName || ''} ${eventTitle || ''}`;
  const normalized = stripAccents(rawCombined).toLowerCase();

  for (const rule of VENUE_LOGO_RULES) {
    if (rule.regex.test(rawCombined) || rule.regex.test(normalized)) {
      return `${CDN_SALAS}/${encodeURIComponent(rule.file)}`;
    }
  }

  return null;
}

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

// Mixed-case tokens that must preserve exact capitalization across titles and club names
const SPECIAL_MIXED_CASE = {
  // General sports, venues & brands
  MOTOGP: 'MotoGP',
  LALIGA: 'LaLiga',
  MUBAV: 'MuBAV',
  MUVIM: 'MuVIM',
  CAIXAFORUM: 'CaixaForum',
  LAGRANJA: 'LaGranja',
  PLAZETA: 'PlaZeta',
  "L'ETNO": "L'ETNO",
  'L’ETNO': 'L’ETNO',
  // Football & basketball clubs / title sponsors with canonical mixed casing
  VFB: 'VfB',
  VFL: 'VfL',
  TSV: 'TSV',
  ELPOZO: 'ElPozo',
  'KIDS&US': 'Kids&Us',
  MORABANC: 'MoraBanc',
  'INNOVA-TSN': 'Innova-TSN',
  'U-BT': 'U-BT',
  '7BET': '7Bet',
  '7BET-LIETKABELIS': '7Bet-Lietkabelis',
  'ESBVA-LM': 'ESBVA-LM',
  'HUN-THERM': 'HUN-Therm',
  'SEPSI-SIC': 'Sepsi-SIC',
};

// Acronyms safe to uppercase globally (strictly non-colliding with ordinary Spanish/Valencian/English words)
const GENERAL_ACRONYMS = new Set([
  // General events, sports competitions & cultural venues
  'BBVA', 'WTA', 'ATP', 'ACB', 'FEB', 'LEB', 'BKT', 'FDM', 'FIH', 'MSC',
  'UEFA', 'FIFA', 'FIBA', 'NBA', 'WNBA', 'UCL', 'UEL', 'UWCL', 'RFEF', 'FUTFEM', 'LF',
  'IVAM', 'CCCC', 'TEM', 'CAHH', 'OCCC', 'IVC', 'CTM',
  'VIP', 'DJ', 'VJ', 'EP', 'LP', 'B2B', 'DVD', 'OST', 'TV', 'FM', 'HD', '3D', '4K', 'VR',
  '3X3', '15K', '10K', '5K', 'S14', 'S16', 'S18', 'U18', 'U19', 'U20', 'U21',
  // Unambiguous core sports club acronyms safe even outside "Team A vs Team B" titles
  'VCF', 'VBC', 'LUD', 'BC', 'UD', 'CF', 'SD', 'FC', 'CD', 'RCD', 'RCDE', 'CFF', 'CB',
  'UCAM', 'BAXI', 'ASVEL', 'LDLC', 'CSKA',
]);

// Complete football & basketball club acronyms (scoped to sports club names so cultural titles/venues
// like "Ca Revolta", "El Gato con Botas", "Ad Libitum" or Spanish "se" are NEVER falsely uppercased)
const SPORTS_CLUB_ACRONYMS = new Set([
  ...GENERAL_ACRONYMS,
  // Spanish & Catalan football prefixes/suffixes (LaLiga EA Sports, Hypermotion, RFEF, Liga F, 1ª Fed FutFem, Copa)
  'CA',   // Club Atlético (CA Osasuna, CA Osasuna Femenino, CA Antoniano)
  'RC',   // Real Club (RC Celta, RC Deportivo, RC Recreativo de Huelva)
  'AD',   // Agrupación Deportiva (AD Alcorcón, AD Ceuta FC, AD Mérida)
  'AE',   // Agrupació Esportiva (AE Prat)
  'CE',   // Club Esportiu (CE Sabadell, CE Europa, CE L'Hospitalet)
  'CP',   // Club Polideportivo (CP Cacereño)
  'SE',   // Societat Esportiva (SE AEM)
  'AEM',  // SE AEM Lleida
  'UE',   // Unió Esportiva (UE Cornellà, UE Olot, UE Sant Andreu)
  'UP',   // Unión Popular (UP Langreo)
  'FF',   // Fútbol Femenino (Albacete FF)
  'CDFF', // Club Deportivo de Fútbol Femenino
  'EDF',  // Escuelas de Fútbol (EDF Logroño)
  'DUX',  // DUX Logroño, DUX Internacional de Madrid
  'UDG',  // UDG Tenerife
  'SAD',  // Sociedad Anónima Deportiva
  'FCB', 'RMA', 'RSG', 'UDL', 'RCF',
  // European football prefixes/suffixes (UCL, UEL, UECL, UWCL)
  'AC',   // Associazione Calcio / Athletic Club (AC Milan, AC Monza, AC Sparta Praha)
  'AS',   // Associazione Sportiva / Association Sportive (AS Roma, AS Monaco, AS Saint-Étienne)
  'SSC',  // Società Sportiva Calcio (SSC Napoli)
  'SS',   // Società Sportiva (SS Lazio)
  'ACF',  // Associazione Calcio Fiorentina (ACF Fiorentina)
  'US',   // Unione Sportiva (US Lecce, US Sassuolo)
  'SC',   // Sport-Club / Sporting Clube (SC Braga, SC Freiburg, SC Heerenveen)
  'SK',   // Sportklub / Spor Kulübü (SK Sturm Graz, SK Slavia Praha, SK Rapid Wien)
  'FK',   // Fußballklub / Fudbalski Klub (FK Bodø/Glimt, FK Crvena Zvezda, FK Qarabağ)
  'PFC', 'PFK', // PFC Ludogorets, PFK CSKA
  'PAOK', 'AEK', 'OFI', 'APOEL', 'AEL',
  'PSV', 'AZ', 'NEC', 'NAC', 'PEC', 'RKC',
  'RB',   // RasenBallsport (RB Leipzig, FC RB Salzburg)
  'TSG',  // TSG Hoffenheim
  'FSV',  // FSV Mainz 05
  'SV',   // Sportverein (SV Werder Bremen, SV Darmstadt 98)
  'BVB',  // BVB Borussia Dortmund
  'BSC',  // Hertha BSC, BSC Young Boys
  'KRC',  // KRC Genk
  'RSC',  // RSC Anderlecht
  'KAA',  // KAA Gent
  'KV',   // Koninklijke Voetbalclub (KV Mechelen, KV Kortrijk)
  'KVC',  // KVC Westerlo
  'STVV', // STVV Sint-Truiden
  'OH',   // Oud-Heverlee (OH Leuven)
  'OGC',  // OGC Nice
  'LOSC', // LOSC Lille
  'AJ',   // Association de la Jeunesse (AJ Auxerre)
  'SM',   // Stade Malherbe (SM Caen)
  'PSG', 'OM', 'OL', 'ASNL', 'ESTAC',
  'SL',   // Sport Lisboa (SL Benfica)
  'GD',   // Grupo Desportivo (GD Estoril, GD Chaves)
  'GNK',  // GNK Dinamo Zagreb
  'HNK',  // HNK Hajduk Split, HNK Rijeka
  'NK',   // Nogometni Klub (NK Maribor, NK Olimpija)
  'CS',   // Clubul Sportiv / Club Sportif (CS Rapid București)
  'FCSB', 'CFR', 'FCV', 'CSM', 'CSU', 'CSA',
  'LASK', 'WAC', 'SCR',
  'AIK', 'IFK', 'HJK', 'BK', 'BATE', 'QPR', 'AFC', 'WFC', 'FCW',
  // Spanish & European basketball prefixes/sponsors (ACB, LF Endesa, EuroLeague, EuroCup, ELW, ECW, BCL)
  'CAB',  // CAB Estepona
  'CBF', 'CBC', 'BSR',
  'SPAR', // SPAR Girona, SPAR Gran Canaria
  'IDK',  // IDK Euskotren
  'ASISA',// ASISA Joventut
  'FIATC',// FIATC Bàsquet Girona
  'TSN',  // Innova-TSN Leganés
  'EA7',  // EA7 Emporio Armani Milan
  'AKTOR',// Panathinaikos AKTOR Athens
  'IBI',  // Hapoel IBI Tel Aviv
  'ALBA', // ALBA Berlin
  'KK',   // Košarkaški Klub (KK Partizan, KK Crvena Zvezda, KK Budućnost)
  'KKZ',  // KKZ Crvena Zvezda
  'VOLI', // Budućnost VOLI Podgorica
  'JL',   // Jeunesse Laïque (Cosea JL Bourg-en-Bresse)
  'MHP',  // MHP Riesen Ludwigsburg
  'NINERS', 'SYNTAINICS', 'MBC', 'WKS',
  'ZVVZ', 'USK', // ZVVZ USK Praha
  'ÇIMSA', 'CIMSA', 'CBK', // ÇIMSA CBK Mersin
  'DVTK', 'HUNTHERM', // DVTK HUN-Therm
  'TARR', 'KSC', // TARR KSC Szekszárd
  'AZS', 'UMCS', // AZS UMCS Lublin
  'KGHM', // KGHM BC Polkowice
  'VBW',  // VBW Gdynia
  'ESBVA', 'LM', // ESBVA-LM, Villeneuve d'Ascq LM
  'BLMA', // Basket Lattes Montpellier Agglomération
  'ACS', 'SIC', // ACS Sepsi-SIC
  'PF',   // Pallacanestro Femminile (PF Schio)
  'KP', 'TANY', // KP TANY Brno
  'MBK',  // MBK Ružomberok
  'NKA',  // NKA Universitas Pécs
  'BCF',  // BCF Elfic Fribourg
  'OGM',  // OGM Ormanspor
  'BOTAŞ', 'BOTAS', // BOTAŞ SK
  'SFP',  // Olympiacos SFP
  'HC', 'HBC', 'VK',
]);

// Canonical club diacritics & multi-word proper-name fixes for football & basketball teams
const SPORTS_CLUB_PHRASE_FIXES = [
  { pattern: /\bCadi\s+La\s+Seu\b/gi, replacement: 'Cadí La Seu' },
  { pattern: /\bAlaves\b/gi, replacement: 'Alavés' },
  { pattern: /\bAlcorcon\b/gi, replacement: 'Alcorcón' },
  { pattern: /\bLeganes\b/gi, replacement: 'Leganés' },
  { pattern: /\bCadiz\b/gi, replacement: 'Cádiz' },
  { pattern: /\bMalaga\b/gi, replacement: 'Málaga' },
  { pattern: /\bCordoba\b/gi, replacement: 'Córdoba' },
  { pattern: /\bCastellon\b/gi, replacement: 'Castellón' },
  { pattern: /\bAlmeria\b/gi, replacement: 'Almería' },
  { pattern: /\bJaen\b/gi, replacement: 'Jaén' },
  { pattern: /\bCacereno\b/gi, replacement: 'Cacereño' },
  { pattern: /\bLogrono\b/gi, replacement: 'Logroño' },
  { pattern: /\bLogrones\b/gi, replacement: 'Logroñés' },
  { pattern: /\bRio\s+Breogan\b/gi, replacement: 'Río Breogán' },
  { pattern: /\bBreogan\b/gi, replacement: 'Breogán' },
  { pattern: /\bBasquet\b/gi, replacement: 'Bàsquet' },
  { pattern: /\bAtletico\b/gi, replacement: 'Atlético' },
  { pattern: /\bGijon\b/gi, replacement: 'Gijón' },
  { pattern: /\bCoruna\b/gi, replacement: 'Coruña' },
  { pattern: /\bSan\s+Sebastian\b/gi, replacement: 'San Sebastián' },
  { pattern: /\bDe\s+Los\s+Reyes\b/gi, replacement: 'de los Reyes' },
  { pattern: /\bDuran\s+Maquinaria\b/gi, replacement: 'Durán Maquinaria' },
  { pattern: /\bPerfumerias\s+Avenida\b/gi, replacement: 'Perfumerías Avenida' },
  { pattern: /\bOses\s+Construccion\b/gi, replacement: 'Osés Construcción' },
  { pattern: /\bFundacion\b/gi, replacement: 'Fundación' },
  { pattern: /\bUnion\b/gi, replacement: 'Unión' },
  { pattern: /\bMerida\b/gi, replacement: 'Mérida' },
  { pattern: /\bCornella\b/gi, replacement: 'Cornellà' },
  { pattern: /\bFenerbahce\b/gi, replacement: 'Fenerbahçe' },
  { pattern: /\bBesiktas\b/gi, replacement: 'Beşiktaş' },
  { pattern: /\bZalgiris\b/gi, replacement: 'Žalgiris' },
  { pattern: /\bBucuresti\b/gi, replacement: 'București' },
  { pattern: /\bMunchen\b/gi, replacement: 'München' },
  { pattern: /\bBuducnost\b/gi, replacement: 'Budućnost' },
  { pattern: /\bSlask\s+Wroclaw\b/gi, replacement: 'Śląsk Wrocław' },
  { pattern: /\bNeptunas\s+Klaipeda\b/gi, replacement: 'Neptūnas Klaipėda' },
  { pattern: /\bSzekszard\b/gi, replacement: 'Szekszárd' },
  { pattern: /\bPecs\b/gi, replacement: 'Pécs' },
  { pattern: /\bUni\s+Gy[oő]r\b/gi, replacement: 'UNI Győr' },
  { pattern: /\bRuzomberok\b/gi, replacement: 'Ružomberok' },
  { pattern: /\bConstanta\b/gi, replacement: 'Constanța' },
  { pattern: /\bBahcesehir\b/gi, replacement: 'Bahçeşehir' },
  { pattern: /\bTurk\s+Telekom\b/gi, replacement: 'Türk Telekom' },
  { pattern: /\bCimsa\b/gi, replacement: 'ÇIMSA' },
  { pattern: /\bBotas\b/gi, replacement: 'BOTAŞ' },
  { pattern: /\bBodo\/Glimt\b/gi, replacement: 'Bodø/Glimt' },
  { pattern: /\bKobenhavn\b/gi, replacement: 'København' },
  { pattern: /\bGoteborg\b/gi, replacement: 'Göteborg' },
  { pattern: /\bZurich\b/gi, replacement: 'Zürich' },
  { pattern: /\bSaint-Etienne\b/gi, replacement: 'Saint-Étienne' },
  { pattern: /\bMalmo\b/gi, replacement: 'Malmö' },
  { pattern: /\bQarabag\b/gi, replacement: 'Qarabağ' },
];

// False-positive Roman numerals that are actually real Spanish/Catalan/English words
const ROMAN_FALSE_POSITIVES = new Set([
  'MI', 'DI', 'LI', 'CI', 'ID', 'IL', 'SI', 'ME', 'CL', 'DC', 'CM', 'MD', 'DM',
  'MIL', 'MIX', 'DIM', 'MID', 'LID', 'VID', 'DID', 'LIL', 'CIVIL', 'MIMI',
]);

function isSafeRomanNumeral(w) {
  if (!w || w.length < 2) return false;
  const upper = w.toUpperCase();
  if (ROMAN_FALSE_POSITIVES.has(upper)) return false;
  return /^(?=[MDCLXVI])M{0,3}(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/.test(upper);
}

/**
 * Formats a single football or basketball club name with authoritative acronym,
 * mixed-case sponsor/prefix, contraction, and diacritic preservation.
 * Examples:
 * - "CA OSASUNA" -> "CA Osasuna"
 * - "PANATHINAIKOS AKTOR ATHENS" -> "Panathinaikos AKTOR Athens"
 * - "CADI LA SEU" -> "Cadí La Seu"
 * - "LDLC ASVEL VILLEURBANNE" -> "LDLC ASVEL Villeurbanne"
 * - "INNOVA-TSN LEGANES" -> "Innova-TSN Leganés"
 * - "VFB STUTTGART" -> "VfB Stuttgart"
 * - "U-BT CLUJ-NAPOCA" -> "U-BT Cluj-Napoca"
 */
export function formatClubName(rawName) {
  if (!rawName) return '';
  const trimmed = String(rawName).replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  const lowerConnectors = new Set([
    'de', 'del', 'da', 'do', 'dos', 'das', 'i', 'y', 'en',
    'van', 'von', 'der', 'den', 'am', 'an', 'im', 'et', 'du', 'des', 'sur', 'lès', 'les', 'aux',
  ]);

  const formatSubToken = (tok, isFirst) => {
    if (!tok) return tok;
    const upper = tok.toUpperCase();

    if (SPECIAL_MIXED_CASE[upper]) return SPECIAL_MIXED_CASE[upper];
    if (SPORTS_CLUB_ACRONYMS.has(upper)) return upper;

    // Handle Catalan/French apostrophe contractions (e.g. L'Hospitalet, d'Ascq)
    const apoMatch = tok.match(/^([ldLD])(['’])(.+)$/);
    if (apoMatch) {
      const lead = apoMatch[1].toLowerCase();
      const prefix = (isFirst || lead === 'l' ? lead.toUpperCase() : lead) + apoMatch[2];
      return prefix + formatSubToken(apoMatch[3], true);
    }

    const lower = tok.toLowerCase();
    if (!isFirst && lowerConnectors.has(lower)) return lower;

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  let formatted = trimmed
    .split(/(\s+)/)
    .map((chunk, idx) => {
      if (!chunk || /^\s+$/.test(chunk)) return chunk;

      // Preserve whole mixed-case compound tokens (e.g. Kids&Us, Innova-TSN, U-BT, ESBVA-LM, HUN-Therm)
      const wholeUpper = chunk.toUpperCase();
      if (SPECIAL_MIXED_CASE[wholeUpper]) return SPECIAL_MIXED_CASE[wholeUpper];
      if (SPORTS_CLUB_ACRONYMS.has(wholeUpper)) return wholeUpper;

      // Split on hyphens/slashes/dots while keeping delimiters intact (e.g. Bourg-en-Bresse, C.A., Bodø/Glimt)
      const parts = chunk.split(/([-–—/.,:;()]+)/);
      return parts
        .map((part, pIdx) => {
          if (!part || /^[-–—/.,:;()]+$/.test(part)) return part;
          return formatSubToken(part, idx === 0 && pIdx === 0);
        })
        .join('');
    })
    .join('');

  for (const { pattern, replacement } of SPORTS_CLUB_PHRASE_FIXES) {
    formatted = formatted.replace(pattern, replacement);
  }

  return formatted;
}

/**
 * Formats a sports match title of the form "Team A vs Team B" using formatClubName on each side.
 */
export function formatSportsMatchTitle(title) {
  if (!title) return '';
  const match = String(title).trim().match(/^(.+?)\s+(?:vs\.?)\s+(.+)$/i);
  if (!match) return formatClubName(title);
  return `${formatClubName(match[1])} vs ${formatClubName(match[2])}`;
}

function toNaturalCase(str) {
  if (!str) return '';
  const trimmed = str.trim();

  // If this looks like a "Team A vs Team B" sports fixture, delegate to the sports club formatter
  if (/\s+vs\.?\s+/i.test(trimmed)) {
    return formatSportsMatchTitle(trimmed);
  }

  const lowerWords = new Set(['de', 'del', "d'", 'd’', 'el', 'la', 'los', 'las', 'en', 'i', 'y', 'al', 'als', 'vs', 'a', 'por', 'con']);

  return trimmed
    .split(/(\s+|[-–—,:;./]+)/)
    .map((w, idx) => {
      if (!w || /^\s+$/.test(w) || /^[-–—,:;./]+$/.test(w)) return w;
      const upper = w.toUpperCase();

      if (SPECIAL_MIXED_CASE[upper]) return SPECIAL_MIXED_CASE[upper];
      if (GENERAL_ACRONYMS.has(upper) || /^\d+K$/i.test(w)) return upper;
      if (isSafeRomanNumeral(w)) return upper;

      const lower = w.toLowerCase();
      if (idx > 0 && lowerWords.has(lower)) return lower;

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

const AWAY_STADIUMS_REGEX =
  /anoeta|reale arena|riazor|deportivo|bernab[eé]u|santiago bernab[eé]u|metropolitano|c[ií]vitas metropolitano|wanda|camp nou|montju[iï]c|ol[ií]mpic llu[ií]s companys|san mam[eé]s|coliseum|coliseum alfonso p[eé]rez|sadar|el sadar|villamar[ií]n|benito villamar[ií]n|s[aá]nchez pizju[aá]n|ram[oó]n s[aá]nchez|bala[ií]dos|abanca bala[ií]dos|gran canaria|estadio de gran canaria|son moix|visit mallorca|mallorca son moix|mendizorroza|mendizorrotza|anxo carro|cartagonova|montilivi|estadi montilivi|jos[eé] zorrilla|zorrilla|el molin[oó]n|molin[oó]n|los c[aá]rmenes|nuevo los c[aá]rmenes|el alcoraz|butarque|estadio municipal de butarque|estadio de la cer[aá]mica|cer[aá]mica|mart[ií]nez valero|palau blaugrana|wizink center|buesa arena|fernando buesa|gran canaria arena|ol[ií]mpic de badalona|pabell[oó]n pr[ií]ncipe felipe|miribilla|bilbao arena/i;

const AWAY_CITIES_REGEX =
  /\/(san-sebastian|madrid|barcelona|bilbao|sevilla|vigo|a-coruna|coruna|pamplona|girona|palma|las-palmas|vitoria|granada|valladolid|zaragoza|gijon|santander|albacete|burgos|huesca|leganes|alcorcon|cartagena|elche|villarreal)\//i;

function isAwayMatch(title, venueName, addressOrLocality, url) {
  const t = (title || '').toLowerCase();
  const v = (venueName || '').toLowerCase();
  const loc = (addressOrLocality || '').toLowerCase();
  const u = (url || '').toLowerCase();

  // 1. Venue check: Known away stadiums / arenas outside Valencia
  if (v && AWAY_STADIUMS_REGEX.test(v)) return true;
  if (t && AWAY_STADIUMS_REGEX.test(t)) return true;

  // 2. URL slug check: ticketing portal paths for away cities
  if (u && AWAY_CITIES_REGEX.test(u)) return true;

  // 3. Locality check: only trigger if known away stadium or away city appears
  if (loc && AWAY_STADIUMS_REGEX.test(loc)) return true;

  // 4. Team positioning: In European fixtures, the home team is listed FIRST.
  const isValenciaClub = (str) =>
    /levante(?:\s*ud)?|valencia(?:\s*(?:cf|basket|bc))?/i.test(str);

  const parts = (title || '').split(/\s+(?:vs\.?|v\.|x)\s+/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const firstTeam = parts[0];
    const lastTeam = parts[parts.length - 1];
    if (!isValenciaClub(firstTeam) && isValenciaClub(lastTeam)) {
      return true;
    }
  }

  // 5. Catch double "vs" or patterns where opponent is listed first
  if (
    /(?:real sociedad|atletico|atl[eé]tico|real madrid|fc barcelona|barcelona|sevilla|real betis|athletic club|celta|osasuna|getafe|rayo vallecano|girona|mallorca|alaves|alav[eé]s|las palmas|valladolid|espanyol|leganes|legan[eé]s)\s+(?:vs\.?|v\.|x)\s+(?:levante|valencia)/i.test(
      t
    )
  ) {
    return true;
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
          const locality = item.location?.address?.addressLocality;

          return {
            title: item.name,
            description: item.description,
            startDate: startDate,
            endDate: item.endDate,
            venueName: venue,
            address: address,
            locality: locality,
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
  if (url.startsWith('data:')) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('logo-rojo') ||
    lower.includes('ayto+fdm') ||
    lower.includes('gc_button') ||
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

function cleanAuSlug(slug) {
  if (!slug) return '';
  return slug
    .replace(/-\d{4}-\d{2}-\d{2}(?:-\d+)?$/, '')
    .replace(/-\d+$/, '')
    .trim();
}

function cleanVenueForMatching(venue) {
  if (!venue) return '';
  let v = stripAccents(venue).toLowerCase();
  if (/hub cultural|cabanyal|reina 121|escorxador/i.test(v)) {
    return 'hub cultural cabanyal';
  }
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

/**
 * Normalizes event URLs to force canonical Spanish versions across all event sources.
 * Specifically converts Valencia CF VIP URLs to standard ticketing blockmap view,
 * forces HTTPS and Spanish locale for Songkick, removes Catalan locale from Valencia Basket,
 * rewrites IVC Open Data URLs to Spanish, and sets HUB Cultural Cabanyal to Spanish (?lang=cas).
 */
export function normalizeSpanishEventUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  let url = rawUrl.trim();

  // 1. Upgrade insecure http to https for known domains
  if (url.startsWith('http://www.songkick.com') || url.startsWith('http://songkick.com')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  // 2. Songkick Spanish locale enforcement
  if (/songkick\.com\/(?:concerts|artists|venues)/i.test(url) && !url.includes('/es/')) {
    url = url.replace(/songkick\.com\//i, 'songkick.com/es/');
  }

  // 3. Valencia CF: Rewrite VIP ticketing to regular webservices seat selection in Spanish
  // e.g. https://entradas.valenciacf.com/valenciacf_vip/select/2964328?hl=en-US -> https://entradas.valenciacf.com/valenciacf_webservices/select/2964328?viewCode=V_blockmap_view
  const vcfVipMatch = url.match(/entradas\.valenciacf\.com\/valenciacf_vip\/select\/(\d+)/i);
  if (vcfVipMatch) {
    const matchId = vcfVipMatch[1];
    return `https://entradas.valenciacf.com/valenciacf_webservices/select/${matchId}?viewCode=V_blockmap_view`;
  }

  // If already webservices, ensure viewCode and remove any hl=en
  const vcfWsMatch = url.match(/entradas\.valenciacf\.com\/valenciacf_webservices\/select\/(\d+)/i);
  if (vcfWsMatch) {
    const matchId = vcfWsMatch[1];
    return `https://entradas.valenciacf.com/valenciacf_webservices/select/${matchId}?viewCode=V_blockmap_view`;
  }

  // Valencia CF root tickets / calendar landing pages
  if (/valenciacf\.com\/tickets(?:\/|$|\?)/i.test(url)) {
    url = url.replace(/\/tickets/i, '/es/entradas');
  }
  if (/valenciacf\.com\/entradas(?:\/|$|\?)/i.test(url) && !url.includes('/es/entradas')) {
    url = url.replace(/\/entradas/i, '/es/entradas');
  }
  if (/valenciacf\.com\/resultados-vcf-femenino/i.test(url) && !url.includes('/es/resultados-vcf-femenino')) {
    url = url.replace(/valenciacf\.com\/resultados-vcf-femenino/i, 'valenciacf.com/es/resultados-vcf-femenino');
  }

  // 4. Valencia Basket: Remove /ca/ Catalan prefix to default to Spanish
  if (url.includes('valenciabasket.com/ca/')) {
    url = url.replace('valenciabasket.com/ca/', 'valenciabasket.com/');
  }

  // 5. IVC Open Data: Replace /val/ with Spanish /es/
  if (url.includes('ivc.gva.es/val/escena-val/')) {
    url = url.replace('ivc.gva.es/val/escena-val/', 'ivc.gva.es/es/escena-es/');
  } else if (url.includes('ivc.gva.es/val/')) {
    url = url.replace('ivc.gva.es/val/', 'ivc.gva.es/es/');
  }

  // 6. HUB Cultural Cabanyal: Force Spanish language (?lang=cas)
  if (url.includes('culturacabanyal.com/agenda') && !url.includes('lang=cas') && !url.includes('lang=es')) {
    const hashIdx = url.indexOf('#');
    if (hashIdx !== -1) {
      const base = url.slice(0, hashIdx).replace(/\/+$/, '');
      const hash = url.slice(hashIdx);
      url = `${base}/?lang=cas${hash}`;
    } else {
      url = url.replace(/\/+$/, '') + '/?lang=cas';
    }
  }

  // 7. General cleanup of ?hl=en-US or &hl=en-US across any links
  url = url.replace(/[?&]hl=en(?:-[A-Z]+)?/gi, '');
  url = url.replace(/\?&/, '?').replace(/[?&]$/, '');

  return url;
}

function isDirectTicketingUrl(url) {
  if (!url || url === '#') return false;
  return (
    /entradas|taquilla|servientradas|ticketmaster|wegow|notikumi|larambleta\.com|teatroenvalencia\.com|ivc\.gva\.es|ivam\.es|valenciabasket\.com|valenciacf|entradas\.valenciacf|oneboxtds\.com/i.test(url) &&
    !/au-agenda\.com\/evento/i.test(url)
  );
}

function isAbono(title, desc = '') {
  const s = `${title || ''} ${desc || ''}`;
  return /\b(abono|abonos|abonament|abonaments)\b/i.test(s);
}

function isSocialOrJunk(title, url = '') {
  const t = (title || '').trim();
  const u = (url || '').trim();
  if (/\b(facebook|instagram|twitter|tiktok|youtube|linkedin|social|link to facebook|redes sociales|comparte en|s[ií]guenos)\b/i.test(t)) return true;
  if (/facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|tiktok\.com|linkedin\.com/i.test(u)) return true;
  if (/^(link|enlace|web|inicio|share|compartir)$/i.test(t)) return true;
  return false;
}

function isCinemaOrMovie(title, desc = '', type = '', cat = '') {
  if (/^(cine|cinema)$/i.test(cat)) return true;
  if (/pel[ií]cula|audiovisuales/i.test(type)) return true;
  const s = `${title || ''} ${desc || ''}`;
  if (/\b(ciclo de cine|cicle de cinema|filmoteca|proyecci[oó]n de la pel[ií]cula|projecci[oó] de la pel[·.]l[ií]cula|sesi[oó]n de cine|cineclub|proyecci[oó]n de cortos|curtmetratges|cortometrajes|film screening|proyecci[oó]n cinematogr[aá]fica)\b/i.test(s)) return true;
  return false;
}

// 1. Music (Songkick - Spanish Version)
async function scrapeSongkick(page, context) {
  console.log('Scraping Songkick (Música en español)...');
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

            const spanishUrl = normalizeSpanishEventUrl(item.url || 'https://www.songkick.com/es');
            const spanishTicketUrl = normalizeSpanishEventUrl(offer?.url || item.url || 'https://www.songkick.com/es');

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
              ticketUrl: spanishTicketUrl,
              url: spanishUrl,
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

// 2. Cultural Agenda (AU-Agenda / AU Live)
async function scrapeAuAgenda(context) {
  console.log('Scraping AU Live (Escénicas & Exposiciones)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  let rawEvents = [];

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

  const targetEvents = rawEvents.filter((e) => {
    const cat = (e.category || '').toLowerCase();
    if (cat !== 'esceniques' && cat !== 'exposicions' && cat !== 'inauguracio-expo') return false;
    if (isAbono(e.title, e.description)) return false;
    if (isSocialOrJunk(e.title, e.sourceUrl || e.url)) return false;
    if (isCinemaOrMovie(e.title, e.description, '', cat)) return false;
    return true;
  });

  const grouped = new Map();
  for (const ev of targetEvents) {
    const cat = ev.category === 'inauguracio-expo' ? 'exposicions' : ev.category;
    const venueNorm = cleanVenueForMatching(ev.venue);
    const groupKey = `${cat}::${venueNorm}::${normalizeKey(ev.title)}`;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey).push(ev);
  }

  const events = [];

  for (const [_, items] of grouped.entries()) {
    items.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    const first = items[0];

    const validDates = items.map((it) => it.startDate).filter(Boolean).sort();
    let startDateStr = validDates[0] || first.startDate;
    let endDateStr =
      validDates.length > 1 && validDates[validDates.length - 1] !== startDateStr
        ? validDates[validDates.length - 1]
        : undefined;

    if (!startDateStr && first.dateLabel) {
      const label = first.dateLabel.trim();
      const monthMap = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };

      const mRange = label.match(/(\d{1,2})(?:\s+(?:de\s+)?([a-zçà-ú]{3,10}))?(?:\s+(\d{4}))?\s*[-–—]\s*(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,10})\s*(\d{4})?/i);
      if (mRange) {
        const sDay = parseInt(mRange[1], 10);
        const eDay = parseInt(mRange[4], 10);
        const eMon = monthMap[mRange[5].toLowerCase().slice(0, 3)];
        const eYr = mRange[6] ? parseInt(mRange[6], 10) : now.getFullYear();
        const sMon = mRange[2] ? monthMap[mRange[2].toLowerCase().slice(0, 3)] : eMon;
        const sYr = mRange[3] ? parseInt(mRange[3], 10) : (mRange[2] && sMon > eMon ? eYr - 1 : eYr);
        if (sMon && eMon) {
          const sIso = `${sYr}-${String(sMon).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;
          const eIso = `${eYr}-${String(eMon).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;
          if (eIso >= todayStr) {
            startDateStr = sIso;
            endDateStr = eIso;
          }
        }
      }

      if (!startDateStr) {
        const mExplicitHasta = label.match(/^hasta\s+(?:el\s+)?(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,10})\s*(\d{4})?/i);
        if (mExplicitHasta) {
          const day = parseInt(mExplicitHasta[1], 10);
          const mon = monthMap[mExplicitHasta[2].toLowerCase().slice(0, 3)];
          let targetYear = mExplicitHasta[3] ? parseInt(mExplicitHasta[3], 10) : now.getFullYear();
          if (!mExplicitHasta[3] && mon < (now.getMonth() + 1)) targetYear += 1;
          const targetIso = `${targetYear}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (targetIso >= todayStr) {
            startDateStr = todayStr;
            endDateStr = targetIso;
          }
        }
      }

      if (!startDateStr) {
        const mSingle = label.match(/^(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,10})\s*(\d{4})?$/i);
        if (mSingle) {
          const day = parseInt(mSingle[1], 10);
          const mon = monthMap[mSingle[2].toLowerCase().slice(0, 3)];
          if (day && mon) {
            let targetYear = mSingle[3] ? parseInt(mSingle[3], 10) : now.getFullYear();
            if (!mSingle[3] && mon < (now.getMonth() + 1)) targetYear += 1;
            const targetIso = `${targetYear}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (targetIso >= todayStr) {
              startDateStr = targetIso;
              endDateStr = undefined;
            }
          }
        }
      }
    }

    if (!startDateStr || startDateStr === 'undefined' || startDateStr.includes('undefined')) {
      continue;
    }

    const effectiveEnd = endDateStr || startDateStr;
    if (effectiveEnd < todayStr) continue;
    if (startDateStr > cutoffStr) continue;

    const validImg = items.find(
      (x) => x.imageUrl && typeof x.imageUrl === 'string' && x.imageUrl.startsWith('http') && isValidDetailImg(x.imageUrl)
    )?.imageUrl;

    const appCategory = first.category === 'esceniques' ? 'teatre' : 'exposicions';
    const fallbackImg = appCategory === 'teatre' ? CULTURAL_FALLBACKS.teatre : CULTURAL_FALLBACKS.exposicions;

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

    const isFree = first.price === 'Gratis' || first.price === 'Gratuito' || first.priceFrom === 0;
    const ticketPrice = first.price && !isFree ? first.price : undefined;

    const cleanSlug = cleanAuSlug(first.slug) || normalizeKey(first.title).replace(/[^a-z0-9]+/g, '-');
    const upcomingSessions = items.filter((it) => (it.startDate || '') >= todayStr);
    let targetSession = upcomingSessions[0] || items[items.length - 1] || first;

    if (targetSession.startDate === todayStr && upcomingSessions.length > 1) {
      const currentHour = now.getHours();
      if (currentHour >= 21) {
        targetSession = upcomingSessions[1];
      }
    }

    const sessionSlug = targetSession.slug || `${cleanSlug}-${targetSession.startDate || todayStr}`;
    const canonicalAuUrl = `https://www.au-agenda.com/evento/${sessionSlug}`;

    let directTicketUrl = null;
    for (const it of items) {
      const u = (it.sourceUrl || it.ticketUrl || '').trim();
      if (u && u !== '#' && isDirectTicketingUrl(u)) {
        directTicketUrl = u;
        break;
      }
    }

    let externalLink = null;
    for (const it of items) {
      const u = (it.sourceUrl || it.url || '').trim();
      if (u && u !== '#' && !u.includes('au-agenda.com') && !u.includes('facebook.com')) {
        externalLink = u;
        break;
      }
    }

    const finalUrl = externalLink || directTicketUrl || canonicalAuUrl;
    const finalTicketUrl = directTicketUrl || externalLink || canonicalAuUrl;

    events.push({
      id: `au-${appCategory}-${cleanSlug}-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      category: appCategory,
      startDate: `${startDateStr}T19:00:00.000Z`,
      endDate: endDateStr ? `${endDateStr}T21:00:00.000Z` : undefined,
      venueName: venueName,
      address: address,
      imageUrl: validImg || getVenuePlaceholderUrl(venueName, cleanTitle, appCategory) || fallbackImg,
      isFree: isFree,
      ticketPrice: ticketPrice,
      ticketUrl: finalTicketUrl,
      url: finalUrl,
      source: 'au',
      authority: 2,
    });
  }

  console.log(`Consolidated ${events.length} clean, folded AU Live events for Escénicas and Exposiciones.`);
  return events;
}

// 2b. Official Institutional Open Data: IVC (Teatre Principal & Teatre Rialto)
async function scrapeIvcOpenData(context) {
  console.log('Scraping IVC Open Data (Teatre Principal, Rialto & Les Arts)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
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

      const rawTitle = (cols[0] || '').replace(/^[\x27"]|[\x27"]$/g, '').trim();
      const type = (cols[1] || '').toLowerCase().trim();
      const sDate = (cols[2] || '').trim();
      const eDate = (cols[3] || '').trim();
      const mun = (cols[7] || '').trim();
      const rawVenue = (cols[8] || '').trim();
      const address = (cols[9] || '').trim() || 'València';
      const price = (cols[11] || '').trim();
      const link = (cols[14] || '').trim();

      if (!mun || !/val[eè]ncia/i.test(mun)) continue;
      if (/pel[ií]cula|audiovisuales|cine/i.test(type)) continue;
      if (/edificio rialto/i.test(rawVenue)) continue;
      if (/pelicula-|audiovisuales/i.test(link)) continue;
      if (isAbono(rawTitle)) continue;

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

        const spanishIvcUrl = normalizeSpanishEventUrl(link || 'https://ivc.gva.es/es/');
        events.push({
          id: `ivc-${category}-${normalizeKey(cleanTitle).slice(0, 30)}-${sIso}`,
          title: cleanTitle,
          description: `Programación oficial del Institut Valencià de Cultura (IVC) en ${venueName}. ${type}`,
          category,
          startDate: `${sIso}T19:00:00.000Z`,
          endDate: eIso && eIso !== sIso ? `${eIso}T21:00:00.000Z` : undefined,
          venueName,
          address: address || `${venueName}, València`,
          imageUrl:
            getVenuePlaceholderUrl(venueName, cleanTitle, category) ||
            (category === 'teatre' ? CULTURAL_FALLBACKS.teatre : CULTURAL_FALLBACKS.exposicions),
          isFree,
          ticketPrice: price && !isFree ? price : undefined,
          ticketUrl: spanishIvcUrl,
          url: spanishIvcUrl,
          source: 'ivc',
          authority: 1,
        });
    }

    // Live Webpage Photo Enrichment for IVC shows (Teatre Principal & Rialto)
    if (context && events.length > 0) {
      console.log(`Enriching ${events.length} IVC events with live page photos from ivc.gva.es...`);
      await Promise.allSettled(
        events.map(async (ev) => {
          if (ev.url && ev.url.includes('ivc.gva.es')) {
            try {
              const pageRes = await context.request.get(ev.url, { timeout: 10000 });
              if (pageRes.ok()) {
                const html = await pageRes.text();
                const photoMatch =
                  html.match(/class=["']bloque-fotos["'][\s\S]*?<a[^>]+href=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i) ||
                  html.match(/class=["']bloque-fotos["'][\s\S]*?<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i) ||
                  html.match(/src=["'](https:\/\/ivc\.gva\.es\/admin\/assets\/images\/[^"']+)["']/i);
                if (photoMatch && photoMatch[1]) {
                  ev.imageUrl = photoMatch[1];
                }
              }
            } catch (_) {}
          }
        })
      );
    }
  } catch (err) {
    console.warn(`IVC Open Data notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official IVC events.`);
  return events;
}

// 2c. HUB Cultural Cabanyal
async function scrapeCulturaCabanyal(context) {
  console.log('Scraping HUB Cultural Cabanyal (culturacabanyal.com/agenda)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  const events = [];

  try {
    let html = '';
    const targetUrl = 'https://culturacabanyal.com/agenda';

    if (context && context.request && typeof context.request.get === 'function') {
      try {
        const res = await context.request.get(targetUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'ca,es;q=0.9,en;q=0.8',
          },
          timeout: 25000,
        });
        if (res.ok()) {
          html = await res.text();
        }
      } catch (reqErr) {
        console.warn(`Playwright request fetch notice: ${reqErr.message}`);
      }
    }

    if (!html && typeof fetch === 'function') {
      const res = await fetch(targetUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'ca,es;q=0.9,en;q=0.8',
        },
      });
      if (res.ok) {
        html = await res.text();
      }
    }

    if (!html) {
      console.warn('HUB Cultural Cabanyal: unable to retrieve HTML');
      return [];
    }

    function normTitleKey(s) {
      return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
    }

    const jsonLdMap = new Map();
    const ldList = [];
    const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const ldObj = JSON.parse(jsonLdMatch[1]);
        if (Array.isArray(ldObj.itemListElement)) {
          for (const el of ldObj.itemListElement) {
            const it = el.item;
            if (it && it.name) {
              const key = normTitleKey(it.name);
              if (key) jsonLdMap.set(key, it);
              ldList.push(it);
            }
          }
        }
      } catch (ldErr) {
        console.warn(`HUB Cultural Cabanyal JSON-LD parse notice: ${ldErr.message}`);
      }
    }

    function classifyCabanyal(title, discipline, about, desc) {
      const discNorm = (discipline || '').toLowerCase();
      const aboutNorm = (about || '').toLowerCase();
      const titleLower = (title || '').toLowerCase();
      const descLower = (desc || '').toLowerCase();
      const combined = [titleLower, discNorm, aboutNorm, descLower].join(' ');

      if (
        discNorm.includes('música') || discNorm.includes('musica') ||
        aboutNorm.includes('música') || aboutNorm.includes('musica') ||
        /\b(?:concert|concierto|recital|ac[uú]stic|acustics|nadalenc|nadales|cantant|violinista|guitarra|piano|en concert|en concierto)\b/i.test(titleLower) ||
        /\b(?:cor\s+femen[ií]|nadales i melodies|interpretaran nadales|cantant i violinista|projecte musical)\b/i.test(descLower)
      ) {
        if (!/\b(?:obra\s+de\s+teatre|dramat[uú]rgia|lectura\s+dram[aà]tica)\b/i.test(combined)) {
          return 'musica';
        }
      }

      if (
        discNorm.includes('escèn') || discNorm.includes('escen') ||
        aboutNorm.includes('escèn') || aboutNorm.includes('escen') ||
        /\b(?:arts?\s+esc[eè]niques?|teatre?|teatral|dansa|dance|danza|circ|clown|stand[\s-]?up|com[eè]dia|mon[oò]leg|titelles|marionet)\b/i.test(discNorm + ' ' + aboutNorm) ||
        /\b(?:lectura\s+dram[aà]tica|stand[\s-]?up\s+comedy|open\s+de\s+comedia|dansa|danza|teatre?|teatral|improvisaci[oó]\s+teatral)\b/i.test(titleLower) ||
        /\b(?:lectura\s+dram[aà]tica|pe[cç]a\s+que\s+s’alça\s+com\s+una\s+paradoxa\s+que\s+dansa|dansa\s+per\s+a\s+dones|improvisaci[oó]\s+teatral|obra\s+de\s+teatre|espectacle|estrena)\b/i.test(descLower) ||
        /\b(?:samba|dancing\s+queen|impros[aà]vies|gestotop[ií]as|mom,\s+i\s+am\s+a\s+rich\s+man|paco\s+panjabi)\b/i.test(titleLower)
      ) {
        return 'teatre';
      }

      if (/\b(?:animaci[oó]\s+lectora|contacontes|cuentacuentos|narraci[oó]\s+oral)\b/i.test(combined)) {
        return 'teatre';
      }

      if (
        discNorm.includes('exposici') || aboutNorm.includes('exposici') ||
        discNorm.includes('arts visuals') || aboutNorm.includes('arts visuals') ||
        /\b(?:exposici[oó]|mostra|fotograf[ií]a|pintura|il·lustraci[oó]|taulellet|brodat|ganxet|crochet|arteterapia)\b/i.test(titleLower) ||
        /\b(?:exposici[oó]|fotograf[ií]a\s+m[oò]bil|obres\s+de|llibre\s+t[aà]ctil|taulellet|il·lustracions|arteterapia)\b/i.test(descLower)
      ) {
        return 'exposicions';
      }

      if (
        discNorm.includes('literatur') || aboutNorm.includes('literatur') ||
        /\b(?:llibre|novel·la|c[oò]mic|lectura|poesia|poeta|machado)\b/i.test(titleLower)
      ) {
        if (/\b(?:c[oò]mic|il·lustr)\b/i.test(titleLower + ' ' + descLower)) {
          return 'exposicions';
        }
        return 'teatre';
      }

      if (/\btaller\b/i.test(combined)) {
        if (/\b(?:dansa|danza|moviment|teatre|impro)\b/i.test(combined)) return 'teatre';
        if (/\b(?:m[uú]sic|cantar|cor\b|veu)\b/i.test(combined)) return 'musica';
        return 'exposicions';
      }

      return 'exposicions';
    }

    const cardRegex =
      /<div\s+class="event-card"[^>]*data-id="(?:wp-)?(\d+)"[^>]*>([\s\S]*?)(?=<div\s+class="event-card"|<\/div>\s*<\/div>\s*<\/div>\s*<\/main>|$)/gi;

    let match;
    const seenIds = new Set();

    while ((match = cardRegex.exec(html)) !== null) {
      const eventId = match[1];
      if (seenIds.has(eventId)) continue;
      seenIds.add(eventId);

      const cardChunk = match[2];

      const titleMatch =
        cardChunk.match(/<h3\s+class="event-title">([^<]+)<\/h3>/i) ||
        cardChunk.match(/alt="([^"]+)"/i);
      let rawTitle = titleMatch ? titleMatch[1].trim() : '';
      if (!rawTitle) continue;

      if (/^HCC\s+Hub\s+Cultural\s+Cabanyal$/i.test(rawTitle) || eventId === '2252') {
        continue;
      }

      rawTitle = rawTitle.replace(/[\uFFFD]/g, 'à');

      const discMatch = cardChunk.match(/class="professional-discipline">([^<]+)<\/span>/i);
      const discipline = discMatch ? discMatch[1].trim() : '';

      const infoMatch = cardChunk.match(/<p\s+class="event-info">([^<]+)<\/p>/i);
      const artistOrAuthor = infoMatch ? infoMatch[1].trim() : '';

      const titleKey = normTitleKey(rawTitle);
      let ld = jsonLdMap.get(titleKey);
      if (!ld) {
        ld = ldList.find((it) => {
          const k2 = normTitleKey(it.name);
          return k2 === titleKey || (k2.length > 5 && (k2.includes(titleKey) || titleKey.includes(k2)));
        });
      }

      const cleanTitle = ld?.name || toNaturalCase(rawTitle);

      const isWorkshop =
        /taller/i.test(discipline) ||
        /taller/i.test(ld?.about || '') ||
        /\b(?:taller|talleres|curs|curso)\b/i.test(rawTitle) ||
        /\b(?:taller|talleres|curs|curso)\b/i.test(cleanTitle) ||
        /\b\d+\s+sessions?\b/i.test(rawTitle) ||
        /\b\d+\s+sessions?\b/i.test(cleanTitle) ||
        /ganchilleras|dancing queen|reines de samba|impros[aà]vies/i.test(rawTitle) ||
        /ganchilleras|dancing queen|reines de samba|impros[aà]vies/i.test(cleanTitle);

      if (isWorkshop) {
        continue;
      }

      let imageUrl = '';
      if (ld && Array.isArray(ld.image) && ld.image[0]) {
        imageUrl = ld.image[0];
      } else if (ld && typeof ld.image === 'string') {
        imageUrl = ld.image;
      }

      if (!imageUrl) {
        const imgMatch = cardChunk.match(/<img[^>]*src="([^"]+)"/i);
        if (imgMatch) {
          let rawSrc = imgMatch[1].replace(/&amp;/g, '&');
          if (rawSrc.includes('_next/image?url=')) {
            const uMatch = rawSrc.match(/url=([^&]+)/);
            if (uMatch) {
              const decoded = decodeURIComponent(uMatch[1]);
              imageUrl = decoded.startsWith('http') ? decoded : `https://culturacabanyal.com${decoded}`;
            } else {
              imageUrl = rawSrc.startsWith('http') ? rawSrc : `https://culturacabanyal.com${rawSrc}`;
            }
          } else {
            imageUrl = rawSrc.startsWith('http') ? rawSrc : `https://culturacabanyal.com${rawSrc}`;
          }
        }
      }

      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `https://culturacabanyal.com${imageUrl}`;
      }

      const category = classifyCabanyal(cleanTitle, discipline, ld?.about || '', ld?.description || '');

      let startDateIso = '';
      if (ld?.startDate) {
        try {
          startDateIso = new Date(ld.startDate).toISOString();
        } catch {}
      }

      if (!startDateIso) {
        const dayMatch = cardChunk.match(/class="event-date-day"[^>]*>(\d{1,2})<\/span>/i);
        const monMatch = cardChunk.match(/class="event-date-month"[^>]*>([A-Z]{3,4})<\/span>/i);
        const timeMatch = cardChunk.match(/fa-clock<\/i>\s*(?:<!-- -->)?\s*(\d{1,2}:\d{2})/i);

        if (dayMatch && monMatch) {
          const months = {
            GEN: 1, ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAI: 5, MAY: 5, JUN: 6,
            JUL: 7, AGO: 8, AGU: 8, SET: 9, SEP: 9, OCT: 10, NOV: 11, DES: 12, DIC: 12,
          };
          const mNum = months[monMatch[1].toUpperCase()] || 11;
          const dNum = parseInt(dayMatch[1], 10);
          let yNum = now.getFullYear();
          if (mNum < (now.getMonth() + 1)) yNum += 1;
          const time = timeMatch ? timeMatch[1] : '19:00';
          const [hh, mm] = time.split(':');
          const dt = new Date(yNum, mNum - 1, dNum, parseInt(hh, 10), parseInt(mm, 10));
          startDateIso = dt.toISOString();
        } else {
          startDateIso = `${todayStr}T19:00:00.000Z`;
        }
      }

      let endDateIso = undefined;
      if (ld?.endDate) {
        try {
          const rawEnd = ld.endDate;
          if (/^\d{4}-\d{2}-\d{2}$/.test(rawEnd)) {
            endDateIso = `${rawEnd}T20:00:00.000Z`;
          } else {
            endDateIso = new Date(rawEnd).toISOString();
          }
        } catch {}
      }

      const effectiveEnd = (endDateIso || startDateIso).slice(0, 10);
      if (effectiveEnd < todayStr) continue;
      if (startDateIso.slice(0, 10) > cutoffStr) continue;

      const deepLink = `https://culturacabanyal.com/agenda#event-${eventId}`;
      const deepLinkEs = `https://culturacabanyal.com/agenda/?lang=cas#event-${eventId}`;

      const locName = ld?.location?.name || '';
      let address = 'Carrer de la Reina, 219, 46011 València';
      if (/reina\s*121/i.test(locName)) {
        address = 'Carrer de la Reina, 121, 46011 València';
      } else if (/escorxador/i.test(locName)) {
        address = 'Carrer de Sant Pere, 37, 46011 València';
      }

      const desc =
        ld?.description ||
        (artistOrAuthor
          ? `Actividad cultural en el HUB Cultural Cabanyal con ${artistOrAuthor}: ${cleanTitle}`
          : `Actividad cultural en el HUB Cultural Cabanyal: ${cleanTitle}`);

      const isFree = ld?.offers?.price === 0 || /gratu[iï]t|gratis/i.test(cardChunk);
      const ticketPrice = isFree ? undefined : (ld?.offers?.price ? `${ld.offers.price} €` : undefined);

      events.push({
        id: `cabanyal-${eventId}`,
        title: cleanTitle,
        description: desc,
        category,
        startDate: startDateIso,
        endDate: endDateIso,
        venueName: 'HUB Cultural Cabanyal',
        address,
        imageUrl,
        isFree,
        ticketUrl: deepLinkEs,
        url: deepLinkEs,
        urlEs: deepLinkEs,
        urlVa: deepLink,
        ticketUrlEs: deepLinkEs,
        ticketUrlVa: deepLink,
        source: 'culturacabanyal',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`HUB Cultural Cabanyal scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official HUB Cultural Cabanyal events.`);
  return events;
}

// 2d. IVAM
async function scrapeIvamExposiciones(page, context) {
  console.log('Scraping IVAM (Institut Valencià d’Art Modern)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  const months = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
  const events = [];

  try {
    let html = '';
    if (page) {
      await page.goto('https://ivam.es/es/exposiciones/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      html = await page.content();
    } else if (context) {
      const res = await context.request.get('https://ivam.es/es/exposiciones/', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        timeout: 20000,
      });
      if (res.ok()) html = await res.text();
    }

    if (html) {
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

        const rawYears = dateRaw.match(/\b(20\d{2})\b/g) || [];
        const endYearFallback = rawYears.length > 0 ? parseInt(rawYears[rawYears.length - 1], 10) : now.getFullYear();

        const parseDate = (str, fallbackYr) => {
          if (!str) return null;
          const m = str.match(/(\d{1,2})\s+([a-zçà-ú]{3,4})\.?(?:\s+(\d{4}))?/i);
          if (!m) return null;
          const day = parseInt(m[1], 10);
          const monKey = m[2].toLowerCase().slice(0, 3);
          const mon = months[monKey];
          const yr = m[3] ? parseInt(m[3], 10) : fallbackYr;
          if (!mon || !yr) return null;
          return `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        };

        const dateParts = dateRaw.split(/\s*[\-–—\u2013\u2014]\s*|\s+a\s+/i);
        const startIso = parseDate(dateParts[0], endYearFallback);
        const endIso = dateParts[1] ? parseDate(dateParts[1], endYearFallback) : undefined;

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
    }
  } catch (err) {
    console.warn(`IVAM scrape notice: ${err.message}`);
  }

  return events;
}

// 2e. MuBAV
async function scrapeMubavExposiciones(context) {
  console.log('Scraping MuBAV (Museu de Belles Arts de València)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
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
    if (!res.ok()) return [];

    const html = await res.text();
    const actualBlock = html.split('Exposiciones actuales')[1]?.split('Exposiciones pasadas')[0] || '';
    const items = actualBlock.split(/class="[^"]*asset-item\b/i).slice(1);

    for (const it of items) {
      const titleM = it.match(/class="[^"]*asset-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const dateM = it.match(/class="[^"]*asset-summary[^"]*"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/i);
      const imgM = it.match(/style=[\x27"]background-image:url\(([^)]+)\)[\x27"]/i);

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

  return events;
}

// 2f. Teatre Talia & Olympia
async function scrapeTaliaCartelera(context) {
  console.log('Scraping Teatre Talia & Teatre Olympia (Olympia Metropolitana)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
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
    if (!res.ok()) return [];

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
      const str = dateText.trim();

      const mDash = str.match(/^(\d{1,2})(?:\s+(?:de\s+)?([a-zçà-ú]{3,10}))?(?:\s+(\d{4}))?\s*[-–—]\s*(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,10})\s*(\d{4})?/i);
      if (mDash) {
        const sDay = parseInt(mDash[1], 10);
        const eDay = parseInt(mDash[4], 10);
        const eMon = months[mDash[5].toLowerCase().slice(0, 3)];
        const eYr = mDash[6] ? parseInt(mDash[6], 10) : now.getFullYear();
        const sMon = mDash[2] ? months[mDash[2].toLowerCase().slice(0, 3)] : eMon;
        const sYr = mDash[3] ? parseInt(mDash[3], 10) : (mDash[2] && sMon > eMon ? eYr - 1 : eYr);
        if (sMon && eMon) {
          sIso = `${sYr}-${String(sMon).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;
          eIso = `${eYr}-${String(eMon).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;
        }
      }

      if (!sIso) {
        const mDel = str.match(/del\s+(\d{1,2})\s+al\s+(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,10})\s*(\d{4})?/i);
        if (mDel) {
          const sDay = parseInt(mDel[1], 10);
          const eDay = parseInt(mDel[2], 10);
          const mon = months[mDel[3].toLowerCase().slice(0, 3)];
          const yr = mDel[4] ? parseInt(mDel[4], 10) : now.getFullYear();
          if (mon) {
            sIso = `${yr}-${String(mon).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;
            eIso = `${yr}-${String(mon).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;
          }
        }
      }

      if (!sIso) {
        const mExplicitHasta = str.match(/^hasta\s+(?:el\s+)?(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,10})\s*(\d{4})?/i);
        if (mExplicitHasta) {
          const day = parseInt(mExplicitHasta[1], 10);
          const mon = months[mExplicitHasta[2].toLowerCase().slice(0, 3)];
          const yr = mExplicitHasta[3] ? parseInt(mExplicitHasta[3], 10) : now.getFullYear();
          if (mon) {
            const target = `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (target >= todayStr) {
              sIso = todayStr;
              eIso = target;
            }
          }
        }
      }

      if (!sIso) {
        const mSingle = str.match(/^(\d{1,2})\s+(?:de\s+)?([a-zçà-ú]{3,10})\s*(\d{4})?$/i);
        if (mSingle) {
          const day = parseInt(mSingle[1], 10);
          const mon = months[mSingle[2].toLowerCase().slice(0, 3)];
          let yr = mSingle[3] ? parseInt(mSingle[3], 10) : now.getFullYear();
          if (!mSingle[3] && mon < (now.getMonth() + 1)) yr += 1;
          if (mon) {
            sIso = `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            eIso = undefined;
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

  return events;
}

// 2g. La Mutant
async function scrapeLaMutant(context) {
  console.log('Scraping La Mutant (Teatre Municipal)...');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
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
    if (!res.ok()) return [];

    const html = await res.text();
    const items = html.split(/class=[\x27"][^\x27"]*av-masonry-entry\b/i).slice(1);

    for (const it of items) {
      const titleM = it.match(/title=[\x27"]([^\x27"]+)[\x27"]/i);
      const linkM = it.match(/data-av-masonry-custom-link=[\x27"]([^\x27"]+)[\x27"]/i) || it.match(/href=[\x27"](https:\/\/www\.lamutant\.com\/[^\x27"]+)['"]/i);
      const imgM = it.match(/<img[^>]*src=[\x27"]([^\x27"]+)[\x27"]/i);

      if (!titleM || !linkM) continue;
      const rawTitle = titleM[1].replace(/&#8217;/g, '’').replace(/&amp;/g, '&').trim();
      const link = linkM[1];
      if (isSocialOrJunk(rawTitle, link)) continue;
      if (isAbono(rawTitle)) continue;
      if (isCinemaOrMovie(rawTitle)) continue;

      const title = toNaturalCase(rawTitle);
      const dateMatch = it.match(/(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|[a-zçà-ú]{3,4})(?:\s+(\d{4}))?/i);
      let sIso = null;
      if (dateMatch) {
        const d = parseInt(dateMatch[1], 10);
        const mKey = dateMatch[2].toLowerCase().slice(0, 3);
        const mIndex = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 }[mKey];
        if (mIndex && d) {
          const yr = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();
          sIso = `${yr}-${String(mIndex).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }
      if (!sIso || sIso < todayStr || sIso > cutoffStr) continue;

      events.push({
        id: `mutant-${normalizeKey(title).slice(0, 30)}-${sIso}`,
        title,
        description: 'Programación oficial en La Mutant (Espacio de Artes Vivas de València)',
        category: 'teatre',
        startDate: `${sIso}T19:00:00.000Z`,
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

  return events;
}

// 3. Live Scraper for Fundación Deportiva Municipal (FDM València)
async function scrapeFdmValencia(page, context) {
  console.log('Scraping FDM València events dynamically...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  try {
    await page.goto('https://www.fdmvalencia.es/es/agenda/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 35000 
    });
    await page.waitForTimeout(2500);

    const rawItems = await page.evaluate(() => {
      const results = [];
      const seenUrls = new Set();
      const seenTitles = new Set();

      const rows = Array.from(document.querySelectorAll('.event-row'));

      for (const row of rows) {
        const titleLink = row.querySelector('.event-title a') || row.querySelector('a[href*="/eventos/"]');
        if (!titleLink) continue;

        const title = (titleLink.textContent || '').trim();
        const href = titleLink.href;
        const normTitle = title.toLowerCase();

        if (seenUrls.has(href) || seenTitles.has(normTitle)) continue;
        seenUrls.add(href);
        seenTitles.add(normTitle);

        const imgEl = row.querySelector('.fourcol img') || row.querySelector('img');
        let img = null;
        if (imgEl) {
          const srcset = imgEl.getAttribute('srcset') || imgEl.srcset;
          if (srcset) {
            const candidates = srcset.split(',').map((s) => {
              const parts = s.trim().split(/\s+/);
              const url = parts[0];
              const width = parts[1] && parts[1].endsWith('w') ? parseInt(parts[1], 10) : 0;
              return { url, width };
            }).filter((c) => c.url && !c.url.startsWith('data:') && !c.url.includes('logo'));
            if (candidates.length > 0) {
              candidates.sort((a, b) => b.width - a.width);
              img = candidates[0].url;
            }
          }

          if (!img) {
            const src = imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || imgEl.currentSrc || imgEl.src || '';
            if (src && !src.startsWith('data:') && !src.includes('logo')) {
              img = src.replace(/-\d{2,4}x\d{2,4}(\.[a-zA-Z]+)$/, '$1');
            }
          }
        }

        if (img) {
          if (img.startsWith('http://')) img = img.replace('http://', 'https://');
          else if (img.startsWith('//')) img = 'https:' + img;
        }

        const timeSpans = Array.from(row.querySelectorAll('.event-time'));
        const timeText = timeSpans.map((s) => (s.textContent || '').trim()).filter(Boolean).join(' ');

        results.push({
          title,
          url: href,
          img,
          dateText: timeText,
          containerText: row.innerText || '',
        });
      }

      return results;
    });

    console.log(`FDM live elements parsed: ${rawItems.length}`);

    if (context && rawItems.length > 0) {
      await Promise.allSettled(
        rawItems.map(async (item) => {
          try {
            const res = await context.request.get(item.url, { timeout: 8000 });
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

              let detailImg = null;
              const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
              if (ogMatch && ogMatch[1] && isValidDetailImg(ogMatch[1])) {
                detailImg = ogMatch[1].replace(/&amp;/g, '&');
              }

              if (!detailImg) {
                const contentImgMatch = html.match(/<img[^>]+class=["'][^"']*(?:wp-post-image|size-page-width|attachment-full)[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                                       html.match(/<div class="entry-content"[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
                if (contentImgMatch && contentImgMatch[1] && isValidDetailImg(contentImgMatch[1])) {
                  detailImg = contentImgMatch[1].replace(/&amp;/g, '&');
                }
              }

              if (detailImg) {
                if (detailImg.startsWith('http://')) detailImg = detailImg.replace('http://', 'https://');
                else if (detailImg.startsWith('//')) detailImg = 'https:' + detailImg;
                else if (detailImg.startsWith('/')) detailImg = 'https://www.fdmvalencia.es' + detailImg;

                if (!item.img || !isValidDetailImg(item.img) || item.img.startsWith('data:')) {
                  item.img = detailImg;
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
      const effectiveEnd = endDateIso ? new Date(endDateIso) : dt;
      if (effectiveEnd < new Date(now.getTime() - 24 * 60 * 60 * 1000) || dt > cutoffDate) continue;

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

      if (!/val[eè]ncia/i.test(fullAddress)) {
        fullAddress = `${fullAddress}, València`;
      }

      if (item.img) {
        if (item.img.startsWith('http://')) item.img = item.img.replace('http://', 'https://');
        else if (item.img.startsWith('//')) item.img = 'https:' + item.img;
        else if (item.img.startsWith('/')) item.img = 'https://www.fdmvalencia.es' + item.img;

        if (!isValidDetailImg(item.img)) {
          item.img = null;
        }
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

// 4. Valencia Basket
async function scrapeValenciaBasket(page) {
  console.log('Scraping Valencia Basket live calendar dynamically...');
  const events = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const CALENDAR_URL = 'https://www.valenciabasket.com/calendario?teamId=&competitionId=&place=home';

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

          if (isDeepest) items.push(text);
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

      const formattedOpponent = formatClubName(opponent);
      const fullTitle = `${valenciaTeamName} vs ${formattedOpponent}`;
      if (isAwayMatch(fullTitle, venueName)) continue;

      events.push({
        id: `vbc-${events.length + 1}-${Date.now()}`,
        title: fullTitle,
        description: `Partido oficial de ${compName} en el ${venueName} frente al ${formattedOpponent}`,
        category: 'esports',
        startDate: iso,
        venueName: venueName,
        address: address,
        imageUrl: SPORTS_FALLBACKS.basket,
        isFree: false,
        ticketUrl: normalizeSpanishEventUrl(CALENDAR_URL),
        url: normalizeSpanishEventUrl(CALENDAR_URL),
      });
    }
  } catch (err) {
    console.warn(`Valencia Basket dynamic scrape notice: ${err.message}`);
  }

  return events;
}

// 5. Valencia CF (Men's Team - Mestalla)
async function scrapeValenciaCF(page, context) {
  console.log('Scraping Valencia CF live ticketing (Mestalla)...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const URLS = ['https://www.valenciacf.com/es/entradas', 'https://www.valenciacf.com/entradas'];

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
            const allLinks = Array.from(b.querySelectorAll('a[href*="webservices"], a[href*="entradas"], a[href*="ticket"], a'));
            // Prioritize regular tickets over VIP packages
            const regularBtn = allLinks.find((a) => !/vip/i.test(a.href) && !/vip/i.test(a.innerText || '')) || allLinks[0];
            const imgEl = b.querySelector('img');
            items.push({
              rawText: text,
              link: regularBtn ? regularBtn.href : 'https://www.valenciacf.com/es/entradas',
              img: imgEl ? imgEl.src || imgEl.getAttribute('data-src') : null,
            });
          }
        });
        return items;
      });

      for (const m of matches) {
        let detailData = null;
        const normalizedMatchLink = normalizeSpanishEventUrl(m.link);

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
        const formattedOpponent = formatClubName(opponent);
        const fullTitle = `${teamTitle} vs ${formattedOpponent}`;

        if (isAwayMatch(fullTitle, venueName)) continue;

        const competition = isWomen
          ? (/copa/i.test(m.rawText) ? 'Copa de la Reina' : 'Liga F')
          : (/champions/i.test(m.rawText) ? 'UEFA Champions League' : /copa/i.test(m.rawText) ? 'Copa del Rey' : 'LaLiga EA Sports');

        events.push({
          id: `vcf-${events.length + 1}-${Date.now()}`,
          title: fullTitle,
          description: `Partido oficial de ${competition} en el ${venueName} frente al ${formattedOpponent}`,
          category: 'esports',
          startDate: iso,
          venueName: venueName,
          address: address,
          imageUrl: m.img || detailData?.imageUrl || SPORTS_FALLBACKS.football,
          isFree: false,
          ticketUrl: normalizedMatchLink,
          url: normalizedMatchLink,
        });
      }
    } catch (err) {
      console.warn(`Valencia CF live scrape notice (${url}): ${err.message}`);
    }
  }

  return events;
}

// 5b. Valencia CF Femenino (Official Calendar - Antonio Puchades / Liga F)
async function scrapeValenciaCFFemenino(page, context) {
  console.log('Scraping Valencia CF Femenino official calendar...');
  const events = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const startFloor = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const CALENDAR_URL = 'https://www.valenciacf.com/es/resultados-vcf-femenino?range=next';

  try {
    await page.goto(CALENDAR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    const matches = await page.evaluate(() => {
      const items = [];
      const cards = document.querySelectorAll('.card-game');

      cards.forEach((card) => {
        const leftTeamEl = card.querySelector('.card-game__teams__name--left');
        const rightTeamEl = card.querySelector('.card-game__teams__name--right');
        if (!leftTeamEl || !rightTeamEl) return;

        const homeTeam = (leftTeamEl.textContent || '').trim();
        const awayTeam = (rightTeamEl.textContent || '').trim();

        // Strictly HOME matches for Valencia CF Femenino (Valencia listed on the left)
        const isHome = /valencia(?:\s*cf)?(?:\s*femenin[oa])?/i.test(homeTeam) && !/valencia/i.test(awayTeam);
        if (!isHome) return;

        const dateEl = card.querySelector('.card-game__date__date, .card-game__date__nodate, .card-game__date');
        const locEl = card.querySelector('.card-game__date__location');
        const compEl = card.querySelector('.card-game__date__competicion__name');
        const timeEl = card.querySelector('.card-game__teams__time');
        const ticketBtn = card.querySelector('a.button-s, a[href*="tickets"], a[href*="entradas"], a[href*="onebox"]');

        const logos = Array.from(card.querySelectorAll('.card-game__teams__logo img'));
        const awayLogo = logos.length > 1 ? (logos[1].getAttribute('src') || logos[1].src) : null;

        items.push({
          homeTeam,
          awayTeam,
          rawDate: dateEl ? (dateEl.textContent || '').trim() : '',
          rawLoc: locEl ? (locEl.textContent || '').trim() : '',
          rawComp: compEl ? (compEl.textContent || '').trim() : '',
          rawTime: timeEl ? (timeEl.textContent || '').trim() : '',
          ticketLink: ticketBtn ? ticketBtn.href : '',
          img: awayLogo,
          cardText: card.innerText || '',
        });
      });

      return items;
    });

    console.log(`VCF Femenino calendar items extracted: ${matches.length}`);

    for (const m of matches) {
      let iso = null;

      // 1. If ticketing page is available and card has unconfirmed date, inspect ticket page JSON-LD
      let detailData = null;
      if (m.ticketLink && !/tmgrupoinmobiliario|partners|webvalenciacf/i.test(m.ticketLink) && context) {
        try {
          const res = await context.request.get(m.ticketLink, { timeout: 6000 });
          if (res.ok()) {
            const html = await res.text();
            detailData = parseEventJsonLd(html);
            if (detailData?.startDate) {
              iso = detailData.startDate;
            }
          }
        } catch (_) {}
      }

      // 2. Parse date from calendar card (e.g. 'lun. 09 nov. / Jor. 10' or '09 nov' or '15/11/2026')
      if (!iso) {
        const match = m.rawDate.match(/(\d{1,2})\s+([a-zçà-ú]{3,10})\.?(?:\s+(\d{4}))?/i);
        if (match) {
          const day = match[1];
          const month = match[2];
          const year = match[3] || currentYear;
          iso = parseSpanishDateToIso(day, month, year);

          if (iso && m.rawTime && /^\d{1,2}:\d{2}$/.test(m.rawTime.trim())) {
            const [hh, mm] = m.rawTime.trim().split(':');
            const dt = new Date(iso);
            dt.setUTCHours(Math.max(0, parseInt(hh, 10) - 1), parseInt(mm, 10), 0, 0);
            iso = dt.toISOString();
          }
        }
      }

      // If kickoff date is not yet confirmed by the league (e.g. 'Por determinar'),
      // skip until official scheduling is announced within the 4-week calendar window.
      if (!iso) continue;

      const dt = new Date(iso);
      if (dt < startFloor || dt > cutoffDate) continue;

      const isMestalla = /mestalla/i.test(m.rawLoc) || /mestalla/i.test(m.cardText);
      const venueName = isMestalla ? 'Estadio de Mestalla' : 'Estadio Antonio Puchades';
      const address = isMestalla
        ? 'Avinguda de Suècia, s/n, 46010 València'
        : 'Ciutat Esportiva de Paterna, Carrer dels Jocs Taronja, 46988 Paterna, València';

      let competition = 'Liga F';
      if (/copa/i.test(m.rawComp)) competition = 'Copa de la Reina';
      else if (/champions|uwcl/i.test(m.rawComp)) competition = "UEFA Women's Champions League";

      const cleanOpponent = formatClubName(m.awayTeam.replace(/\s+Femenino\b/i, '').replace(/\s+Fem\b/i, ''));
      const fullTitle = `Valencia CF Femenino vs ${formatClubName(m.awayTeam)}`;

      if (isAwayMatch(fullTitle, venueName)) continue;

      const validTicketUrl = normalizeSpanishEventUrl(
        m.ticketLink && !/tmgrupoinmobiliario|partners|webvalenciacf/i.test(m.ticketLink)
          ? m.ticketLink
          : CALENDAR_URL
      );

      let fullImg = null;
      if (m.img) {
        if (m.img.startsWith('http')) fullImg = m.img;
        else if (m.img.startsWith('/')) fullImg = `https://www.valenciacf.com${m.img}`;
      }

      events.push({
        id: `vcf-fem-${events.length + 1}-${Date.now()}`,
        title: fullTitle,
        description: `Partido oficial de ${competition} en el ${venueName} frente al ${cleanOpponent}`,
        category: 'esports',
        startDate: iso,
        venueName: venueName,
        address: address,
        imageUrl: fullImg || detailData?.imageUrl || SPORTS_FALLBACKS.football,
        isFree: false,
        ticketUrl: validTicketUrl,
        url: validTicketUrl,
        source: 'vcf-femenino',
        authority: 1,
      });
    }
  } catch (err) {
    console.warn(`Valencia CF Femenino scrape notice: ${err.message}`);
  }

  console.log(`Ingested ${events.length} official Valencia CF Femenino events.`);
  return events;
}

// 6. Levante UD
async function scrapeLevanteUD(page, context) {
  console.log('Scraping Levante UD live ticketing...');
  const events = [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

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
      if (isAwayMatch('', '', '', m.href)) continue;

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

      if (detailData && isAwayMatch(detailData.title, detailData.venueName, detailData.locality, m.href)) {
        continue;
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
      const rawTitle = detailData?.title || m.titleAttr || m.rawText || '';
      const titleParts = rawTitle.split(/\s+(?:vs\.?|v\.|x|-)\s+/i).map((s) => s.trim()).filter(Boolean);

      let fullTitle = '';
      let opponent = '';

      if (titleParts.length >= 2) {
        const homeCandidate = titleParts[0];
        const awayCandidate = titleParts[titleParts.length - 1];

        if (!/levante/i.test(homeCandidate)) {
          continue;
        }

        opponent = awayCandidate.replace(/\b(?:Buñol|Entradas|Comprar|Ver)\b/gi, '').trim();
        fullTitle = `${teamTitle} vs ${formatClubName(opponent)}`;
      } else {
        const candidateTitle = m.titleAttr || m.rawText;
        const matchTitle = candidateTitle.match(/Levante(?:\s+UD)?(?:\s+Femenino|\s+Fem)?\s+(?:vs\.?|x|-)\s+([A-Za-zÁ-ÿ\s]+)/i);
        if (matchTitle) {
          opponent = matchTitle[1]
            .split('\n')[0]
            .replace(/\b(?:Buñol|Entradas|Comprar|Ver)\b/gi, '')
            .trim();
        }
        if (!opponent) opponent = isWomen ? 'Liga F Match' : 'LaLiga Match';
        fullTitle = `${teamTitle} vs ${formatClubName(opponent)}`;
      }

      if (isAwayMatch(fullTitle, venueName, detailData?.locality, m.href)) continue;

      events.push({
        id: `lud-${events.length + 1}-${Date.now()}`,
        title: fullTitle,
        description: `Partido oficial de ${competition} en ${venueName} frente al ${formatClubName(opponent)}`,
        category: 'esports',
        startDate: iso,
        venueName: venueName,
        address: address,
        imageUrl: detailData?.imageUrl || m.img || SPORTS_FALLBACKS.football,
        isFree: false,
        ticketUrl: m.href,
        url: m.href,
      });
    }
  } catch (err) {
    console.warn(`Levante UD live scrape notice: ${err.message}`);
  }

  return events;
}

// ============================================================================
// VALENCIA CINEMAS (MOVIES) 3-TIER SCRAPER PIPELINE (13 OFFICIAL VENUES)
// Follows Micalet — Movies Feature Design Document & Schedule Directory
// ============================================================================

const VALENCIA_CINEMAS = [
  // Valencia Ciudad (9)
  {
    id: 'cines-lys',
    name: 'Cines Lys',
    zone: 'valencia-ciudad',
    neighborhood: 'Ciutat Vella',
    address: 'Passeig de Russafa, 3, 46002 València',
    tier: 1,
    reservaEntradasSlug: 'cineslys',
    url: 'https://www.reservaentradas.com/cine/valencia/cineslys',
    secondaryUrls: ['https://cineslys.com/calendario/mes/'],
  },
  {
    id: 'cines-babel',
    name: 'Cines Babel',
    zone: 'valencia-ciudad',
    neighborhood: 'El Pla del Real',
    address: 'C/ Vicent Sancho Tello, 10, 46021 València',
    tier: 1,
    reservaEntradasSlug: 'cinesbabel',
    url: 'https://www.reservaentradas.com/cine/valencia/cinesbabel',
    defaultVOSE: true,
  },
  {
    id: 'yelmo-campanar',
    name: 'Yelmo Cines Mercado de Campanar',
    zone: 'valencia-ciudad',
    neighborhood: 'Campanar',
    address: 'Av. Tirso de Molina, 16, 46015 València',
    tier: 2,
    sensaCineTheaterId: 'E0773',
    url: 'https://yelmocines.es/cartelera/valencia',
    voseUrl: 'https://yelmocines.es/cartelera-vo/valencia',
  },
  {
    id: 'ocine-aqua',
    name: 'Ocine Premium Aqua',
    zone: 'valencia-ciudad',
    neighborhood: 'Camins al Grau',
    address: 'CC Aqua, C/ Menorca, 19, 46023 València',
    tier: 2,
    sensaCineTheaterId: 'E0474',
    url: 'https://ocinepremiumaqua.es/',
  },
  {
    id: 'la-filmoteca',
    name: 'La Filmoteca (IVC)',
    zone: 'valencia-ciudad',
    neighborhood: 'Ciutat Vella',
    address: 'Edifici Rialto, Pl. Ajuntament, 17, 46002 València',
    tier: 1,
    url: 'https://ivc.gva.es/es/audiovisuales/programacion/valencia-la-filmoteca-cas',
    secondaryUrls: ['https://ivc.gva.es/val/audiovisual/programacio/valencia-la-filmoteca'],
    defaultEventType: 'especial',
  },
  {
    id: 'cinestudio-dor',
    name: "Cinestudio d'Or",
    zone: 'valencia-ciudad',
    neighborhood: "L'Eixample",
    address: 'C/ Almirall Cadarso, 31, 46005 València',
    tier: 1,
    reservaEntradasSlug: 'cinestudiodor',
    url: 'https://www.reservaentradas.com/cine/valencia/cinestudiodor',
  },
  {
    id: 'autocine-star',
    name: 'Autocine STAR',
    zone: 'valencia-ciudad',
    neighborhood: 'Pinedo',
    address: 'Carrera del Riu, 407, 46012 València',
    tier: 1,
    url: 'https://www.autocinestar.com/',
    defaultEventType: 'especial',
  },
  {
    id: 'cines-abc-park',
    name: 'Cines ABC Park',
    zone: 'valencia-ciudad',
    neighborhood: 'Ciutat Vella',
    address: 'C/ Roger de Llúria, 21, 46002 València',
    tier: 1,
    reservaEntradasSlug: 'abcpark',
    abcCinemaId: 2,
    abcVenueSlug: 'abc-park',
    url: 'https://www.cinesabc.com/cine/abcpark',
  },
  {
    id: 'cines-abc-el-saler',
    name: 'Cines ABC El Saler',
    zone: 'valencia-ciudad',
    neighborhood: 'Quatre Carreres',
    address: 'CC El Saler, Av. del Professor López Piñero, 16, 46013 València',
    tier: 1,
    reservaEntradasSlug: 'abcelsaler',
    abcCinemaId: 172,
    abcVenueSlug: 'abc-saler',
    url: 'https://www.cinesabc.com/cine/abcelsaler',
  },

  // Área Metropolitana (4)
  {
    id: 'kinepolis-valencia',
    name: 'Kinépolis València',
    zone: 'area-metropolitana',
    neighborhood: 'Paterna',
    address: 'Heron City, Av. de Francisco Tomás y Valiente, s/n, 46980 Paterna',
    tier: 2,
    sensaCineTheaterId: 'E0454',
    url: 'https://kinepolis.es/cines/kinepolis-valencia/informacion/',
  },
  {
    id: 'cinesa-bonaire',
    name: 'Cinesa LUXE Bonaire',
    zone: 'area-metropolitana',
    neighborhood: 'Aldaia',
    address: 'CC Bonaire, A-3 Km 345, 46960 Aldaia',
    tier: 2,
    sensaCineTheaterId: 'E0405',
    url: 'https://www.cinesa.es/cines/bonaire/',
  },
  {
    id: 'cines-mn4',
    name: 'Cines MN4',
    zone: 'area-metropolitana',
    neighborhood: 'Alfafar',
    address: 'CC MN4, C/ Alcalde José Puertes, 46910 Alfafar',
    tier: 1,
    reservaEntradasSlug: 'cinesmn4',
    url: 'https://www.reservaentradas.com/cine/valencia/cinesmn4',
  },
  {
    id: 'cines-abc-gran-turia',
    name: 'Cines ABC Gran Turia',
    zone: 'area-metropolitana',
    neighborhood: 'Xirivella',
    address: 'CC Gran Turia, Pl. d’Europa, s/n, 46950 Xirivella',
    tier: 1,
    reservaEntradasSlug: 'abcgranturia',
    abcCinemaId: 171,
    abcVenueSlug: 'abc-gran-turia',
    url: 'https://www.cinesabc.com/cine/abcgranturia',
  },
];

const CINEMA_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let _cheerioPromise = null;
async function getOptionalCheerio() {
  if (!_cheerioPromise) {
    _cheerioPromise = import('cheerio')
      .then((m) => m.default || m)
      .catch(() => null);
  }
  return _cheerioPromise;
}

function getValenciaTodayISO(nowDate = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(nowDate);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {}
  return nowDate.toISOString().slice(0, 10);
}

function addDaysToISO(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

function diffDaysISO(dateA, dateB) {
  const [yA, mA, dA] = dateA.split('-').map((n) => parseInt(n, 10));
  const [yB, mB, dB] = dateB.split('-').map((n) => parseInt(n, 10));
  const msA = Date.UTC(yA, mA - 1, dA);
  const msB = Date.UTC(yB, mB - 1, dB);
  return Math.round((msA - msB) / (24 * 60 * 60 * 1000));
}

function normalizeCinemaSlug(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
}

function decodeHtmlEntitiesCinema(str) {
  if (!str) return '';
  return String(str)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtmlTagsCinema(html) {
  if (!html) return '';
  return decodeHtmlEntitiesCinema(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function resolveAbsoluteCinemaUrl(rawUrl, baseUrl) {
  if (!rawUrl) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) return null;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

function normalizeAgeRating(raw) {
  if (!raw) return null;
  const s = String(raw).toUpperCase().trim();
  if (/\b(?:TP|APTA|TODOS\s+LOS\s+P[UÚ]BLICOS|0\+?)\b/.test(s)) return 'TP';
  const m = /(?:M\s*-?\s*|\+|MAYORES\s+DE\s+|NRM\s*|NR\s*)?(7|12|16|18)\b/.exec(s);
  if (m) return `M-${m[1]}`;
  return null;
}

function parseDurationMinutes(raw) {
  if (typeof raw === 'number' && raw >= 20 && raw <= 420) return Math.round(raw);
  if (!raw) return null;
  const s = String(raw);
  // ISO 8601 duration PT1H58M or PT118M
  const isoM = /PT(?:(\d+)H)?(?:(\d+)M)?/i.exec(s);
  if (isoM && (isoM[1] || isoM[2])) {
    const total = (parseInt(isoM[1] || '0', 10) * 60) + parseInt(isoM[2] || '0', 10);
    if (total >= 20 && total <= 420) return total;
  }
  const hrMin = /(\d+)\s*h(?:oras?)?\s*(\d{1,2})\s*(?:m|min)/i.exec(s);
  if (hrMin) {
    const total = parseInt(hrMin[1], 10) * 60 + parseInt(hrMin[2], 10);
    if (total >= 20 && total <= 420) return total;
  }
  const mins = /(\d{2,3})\s*(?:min|minutos|m\.|\')/i.exec(s);
  if (mins) {
    const val = parseInt(mins[1], 10);
    if (val >= 20 && val <= 420) return val;
  }
  return null;
}

function extractCinemaFormatAndVose(rawText, defaultVOSE = false) {
  const src = String(rawText || '');
  const hasExplicitDubbed = /\b(?:DOBLADA|VE|V\.E\.|CASTELLANO\s+DOBLAD|ESP\s+DOBLAD)\b/i.test(src);
  const hasExplicitVOSE =
    /\b(?:V\.?\s*O\.?\s*S\.?\s*E\.?|V\.?\s*O\.?\s*S\.?\s*C\.?|V\.?\s*O\.?\s*S\.?\s*V\.?|V\.?\s*O\.?\s*S\.?|V\.?\s*O\.?|SUBTITULADA|SUBT\.?|VERSI[OÓ]N\s+ORIGINAL|VERSI[OÓ]\s+ORIGINAL)\b/i.test(
      src
    );
  const isVOSE = hasExplicitVOSE ? true : hasExplicitDubbed ? false : Boolean(defaultVOSE);

  let format = null;
  if (/\bIMAX\b/i.test(src)) format = 'IMAX';
  else if (/\b4DX\b/i.test(src)) format = '4DX';
  else if (/\bScreenX\b/i.test(src)) format = 'ScreenX';
  else if (/\biSense\b/i.test(src)) format = 'iSense';
  else if (/\b35\s*mm\b/i.test(src)) format = '35mm';
  else if (/\b16\s*mm\b/i.test(src)) format = '16mm';
  else if (/\bDCP\b/i.test(src)) format = 'DCP';
  else if (/\bDolby\s*Atmos\b/i.test(src)) format = 'Atmos';
  else if (/\b3D\b/i.test(src)) format = '3D';
  else if (/\b2D\b/i.test(src)) format = '2D';

  const cleanedTitle = src
    .replace(/\(\s*(?:V\.?\s*O\.?\s*S\.?\s*E\.?|V\.?\s*O\.?\s*S\.?|V\.?\s*O\.?|VOSE|VOS|VO|2D|3D|IMAX|4DX|ScreenX|iSense|DCP|35mm|16mm|DIGITAL|DOBLADA)\s*\)/gi, '')
    .replace(/\[\s*(?:V\.?\s*O\.?\s*S\.?\s*E\.?|VOSE|VOS|VO|2D|3D|IMAX|4DX|ScreenX|iSense|DCP|35mm)\s*\]/gi, '')
    .replace(/\s*[-–—|·]\s*(?:V\.?\s*O\.?\s*S\.?\s*E\.?|VOSE|VOS|IMAX|4DX|ScreenX|iSense)\s*$/gi, '')
    .replace(/\s+\b(?:V\.?O\.?S\.?E\.?|VOSE)\b\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    isVOSE,
    format,
    language: isVOSE ? 'VO' : 'ES',
    subtitles: isVOSE ? 'ES' : null,
    cleanedTitle: cleanedTitle || src.trim(),
  };
}

function sessionTimeSortKey(timeStr) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(timeStr || '').trim());
  if (!m) return 9999;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  // Midnight screenings (00:00-04:59) sort after 23:59 so they stay on the evening date
  return (hh < 5 ? hh + 24 : hh) * 60 + mm;
}

function normalizeMovieSessionList(rawSessions) {
  if (!Array.isArray(rawSessions)) return [];
  const map = new Map();
  for (const s of rawSessions) {
    if (!s) continue;
    const rawTime = typeof s === 'string' ? s : String(s.time || '').trim();
    const tm = /(\d{1,2})[:.hH](\d{2})/.exec(rawTime);
    if (!tm) continue;
    const hhNum = parseInt(tm[1], 10);
    const mmNum = parseInt(tm[2], 10);
    if (hhNum > 24 || mmNum > 59) continue;
    const time = `${String(hhNum % 24).padStart(2, '0')}:${String(mmNum).padStart(2, '0')}`;
    const isVOSE = Boolean(typeof s === 'object' ? s.isVOSE : false);
    const format = typeof s === 'object' && s.format ? String(s.format).trim() : null;
    const key = `${time}|${isVOSE ? '1' : '0'}|${(format || '').toUpperCase()}`;

    const normalized = {
      time,
      isVOSE,
      language: (typeof s === 'object' && s.language) || (isVOSE ? 'VO' : 'ES'),
      subtitles: (typeof s === 'object' && s.subtitles) || (isVOSE ? 'ES' : null),
      format,
      hall: (typeof s === 'object' && s.hall) || null,
      ticketUrl: (typeof s === 'object' && s.ticketUrl) || null,
    };

    if (!map.has(key)) {
      map.set(key, normalized);
    } else {
      const prev = map.get(key);
      map.set(key, {
        ...prev,
        hall: prev.hall || normalized.hall,
        ticketUrl: prev.ticketUrl || normalized.ticketUrl,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => sessionTimeSortKey(a.time) - sessionTimeSortKey(b.time));
}

function detectCinemaCycleAndEventType(cinema, title, cycleName, extraText = '') {
  const combined = `${title || ''} ${cycleName || ''} ${extraText || ''}`;
  let detectedCycle = cycleName ? String(cycleName).trim() : null;

  if (!detectedCycle) {
    if (/cine\s*club\s*lys/i.test(combined)) detectedCycle = 'Cine Club Lys';
    else if (/anime\s*saikuru/i.test(combined)) detectedCycle = 'Anime Saikuru';
    else if (/proyecto\s*viridiana/i.test(combined)) detectedCycle = 'Proyecto Viridiana';
    else if (cinema.id === 'la-filmoteca') detectedCycle = 'La Filmoteca';
    else if (/\b(?:[oó]pera|ballet|royal\s+opera|met\s+opera)\b/i.test(combined)) detectedCycle = 'Ópera y Ballet';
    else if (/\b(?:marat[oó]n|preestreno|evento\s+especial|sesi[oó]n\s+especial|preventa)\b/i.test(combined)) {
      detectedCycle = 'Evento especial';
    }
  }

  const isSpecial =
    cinema.defaultEventType === 'especial' ||
    Boolean(detectedCycle) ||
    /\b(?:ciclo|cicle|filmoteca|cine\s*club|saikuru|viridiana|[oó]pera|ballet|preestreno|preventa|evento\s+especial|marat[oó]n|doble\s+sesi[oó]n|autocine)\b/i.test(
      combined
    );

  return {
    eventType: isSpecial ? 'especial' : 'cartelera',
    cycleName: detectedCycle,
  };
}

function parseSpanishOrIsoDate(rawStr, referenceISO) {
  if (!rawStr) return null;
  const s = String(rawStr).trim();
  const isoM = /(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (isoM) return `${isoM[1]}-${isoM[2]}-${isoM[3]}`;

  const dmyM = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/.exec(s);
  if (dmyM) {
    const day = parseInt(dmyM[1], 10);
    const mon = parseInt(dmyM[2], 10);
    const refYear = parseInt(referenceISO.slice(0, 4), 10);
    let yr = dmyM[3] ? parseInt(dmyM[3], 10) : refYear;
    if (yr < 100) yr += 2000;
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
      return `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const lower = s.toLowerCase();
  if (/\b(?:hoy|hui|today)\b/.test(lower)) return referenceISO;
  if (/\b(?:ma[ñn]ana|dem[aà]|tomorrow)\b/.test(lower)) return addDaysToISO(referenceISO, 1);

  const monthWordM = /(\d{1,2})\s+(?:de\s+|d['’])?([a-zçà-ú]{3,12})(?:\s+(?:de\s+)?(\d{4}))?/i.exec(lower);
  if (monthWordM) {
    const day = parseInt(monthWordM[1], 10);
    const monKey = monthWordM[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3);
    const mon = MONTH_MAP[monthWordM[2]] || MONTH_MAP[monKey];
    if (mon && day >= 1 && day <= 31) {
      const refYear = parseInt(referenceISO.slice(0, 4), 10);
      const refMonth = parseInt(referenceISO.slice(5, 7), 10);
      let yr = monthWordM[3] ? parseInt(monthWordM[3], 10) : refYear;
      if (!monthWordM[3] && mon < refMonth - 2) yr += 1;
      return `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

const CINEMA_TITLE_MINOR_WORDS = new Set([
  'a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los', 'o', 'para', 'por',
  'sin', 'sobre', 'su', 'sus', 'u', 'un', 'una', 'unas', 'unos', 'y',
  'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
  'd', 'l', 'els', 'les', 'i', 'per', 'amb',
]);

const CINEMA_TITLE_UPPER_TOKENS = new Set([
  'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'XIII', 'XIV', 'XV',
  '2D', '3D', '4DX', 'IMAX', 'VOSE', 'VIP', 'FBI', 'CIA', 'USA', 'UK', 'AI', 'DNA',
  'TV', 'DJ', 'DC', 'MCU', 'BTS', 'UFC', 'WWE', 'NASA', 'NY', 'LA', 'SF', 'SOS', 'S.O.S.',
]);

function formatCinemaMovieTitle(rawTitle) {
  const cleaned = decodeHtmlEntitiesCinema(rawTitle || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const letters = cleaned.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 3) return cleaned;
  const upperCount = (letters.match(/[A-ZÀ-ÖØ-Þ]/g) || []).length;
  // Only re-case titles that arrive in ALL-CAPS (>= 85% uppercase letters)
  if (upperCount / letters.length < 0.85) return cleaned;

  const tokens = cleaned.split(/(\s+)/);
  let forceCapNext = true;
  return tokens
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      const stripped = tok.replace(/^[¡¿"'«(\[]+|[!?.,:;"'»)\]]+$/g, '');
      const upperStripped = stripped.toUpperCase();
      const endsBreak = /[:.!?—–-]$/.test(tok);

      if (CINEMA_TITLE_UPPER_TOKENS.has(upperStripped)) {
        forceCapNext = endsBreak;
        return tok.replace(stripped, upperStripped);
      }

      const lowerWord = stripped.toLowerCase();
      let formattedWord;
      if (!forceCapNext && CINEMA_TITLE_MINOR_WORDS.has(lowerWord)) {
        formattedWord = lowerWord;
      } else {
        formattedWord = lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
      }
      forceCapNext = endsBreak;
      return stripped ? tok.replace(stripped, formattedWord) : tok;
    })
    .join('');
}

function isHotlinkProneCinemaPoster(url) {
  if (!url) return false;
  return /cineslys\.com\/wp-content\/uploads\//i.test(String(url));
}

function pickPreferredCinemaPoster(posterA, posterB) {
  if (!posterA) return posterB || null;
  if (!posterB) return posterA || null;
  const aHotlink = isHotlinkProneCinemaPoster(posterA);
  const bHotlink = isHotlinkProneCinemaPoster(posterB);
  if (aHotlink && !bHotlink) return posterB;
  if (bHotlink && !aHotlink) return posterA;
  return posterA;
}

function buildCinemaEventRecord(cinema, raw, todayISO, updatedAtISO) {
  const { isVOSE, format, language, subtitles, cleanedTitle } = extractCinemaFormatAndVose(
    raw.title,
    Boolean(cinema.defaultVOSE)
  );
  const title = formatCinemaMovieTitle(cleanedTitle);
  if (!title || title.length < 2) return null;

  const date = parseSpanishOrIsoDate(raw.date, todayISO) || todayISO;
  const rawSessions = (raw.sessions || []).map((s) => {
    if (typeof s === 'string') {
      return {
        time: s,
        isVOSE: Boolean(raw.isVOSE || isVOSE),
        language,
        subtitles,
        format: raw.format || format,
        hall: raw.hall || null,
        ticketUrl: raw.ticketUrl || null,
      };
    }
    const extraMeta = extractCinemaFormatAndVose(
      `${s.label || ''} ${s.format || ''} ${s.version || ''}`,
      Boolean(s.isVOSE ?? raw.isVOSE ?? isVOSE)
    );
    return {
      time: s.time,
      isVOSE: Boolean(s.isVOSE ?? extraMeta.isVOSE),
      language: s.language || extraMeta.language,
      subtitles: s.subtitles || extraMeta.subtitles,
      format: s.format || extraMeta.format || raw.format || format,
      hall: s.hall || raw.hall || null,
      ticketUrl: s.ticketUrl || raw.ticketUrl || null,
    };
  });

  const sessions = normalizeMovieSessionList(rawSessions);
  if (sessions.length === 0) return null;

  const { eventType, cycleName } = detectCinemaCycleAndEventType(
    cinema,
    title,
    raw.cycleName,
    `${raw.synopsis || ''} ${raw.extraText || ''}`
  );
  const effectiveEventType = raw.eventType === 'especial' ? 'especial' : eventType;

  // Enforce Hybrid Scheduling Horizon: cartelera <= 7 days (0..+6), especial <= 31 days (0..+31)
  const dayDiff = diffDaysISO(date, todayISO);
  if (dayDiff < 0) return null;
  const maxDays = effectiveEventType === 'especial' ? 31 : 6;
  if (dayDiff > maxDays) return null;

  const slug = normalizeCinemaSlug(title);
  const firstTime = sessions[0]?.time || '18:00';
  const startDate = `${date}T${firstTime}:00`;
  const posterUrl = raw.posterUrl ? resolveAbsoluteCinemaUrl(raw.posterUrl, cinema.url) : null;
  const sourceUrl = resolveAbsoluteCinemaUrl(raw.sourceUrl || raw.ticketUrl, cinema.url) || cinema.url;
  const hasVOSE = Boolean(raw.hasVOSE || sessions.some((s) => s.isVOSE));
  const synopsis = raw.synopsis ? decodeHtmlEntitiesCinema(raw.synopsis).slice(0, 600) : null;

  return {
    id: `cine-${cinema.id}-${slug}-${date}`,
    category: 'cine',
    eventType: effectiveEventType,
    title,
    originalTitle: raw.originalTitle ? decodeHtmlEntitiesCinema(raw.originalTitle) : null,
    director: raw.director ? decodeHtmlEntitiesCinema(raw.director) : null,
    durationMinutes: parseDurationMinutes(raw.durationMinutes),
    ageRating: normalizeAgeRating(raw.ageRating),
    synopsis,
    posterUrl,
    venue: {
      id: cinema.id,
      name: cinema.name,
      zone: cinema.zone,
      neighborhood: cinema.neighborhood,
      address: cinema.address,
    },
    date,
    hasVOSE,
    cycleName: cycleName || null,
    sessions,
    sourceUrl,
    updatedAt: updatedAtISO,

    // Standard EventItem compatibility fields for Micalet feed
    startDate,
    venueName: cinema.name,
    address: cinema.address,
    description: synopsis || `${cinema.name} · ${cinema.neighborhood}`,
    imageUrl: posterUrl || undefined,
    url: sourceUrl,
    ticketUrl: sessions.find((s) => s.ticketUrl)?.ticketUrl || sourceUrl,
    isFree: false,
    source: `cine-${cinema.id}`,
    authority: 1,
  };
}

function groupAndDeduplicateCinemaEvents(events) {
  const byKey = new Map();
  for (const ev of events) {
    if (!ev || ev.category !== 'cine') continue;
    const key = `${ev.venue?.id || ev.venueName}|${normalizeCinemaSlug(ev.title)}|${ev.date}`;
    if (!byKey.has(key)) {
      byKey.set(key, { ...ev, sessions: normalizeMovieSessionList(ev.sessions) });
    } else {
      const prev = byKey.get(key);
      const mergedSessions = normalizeMovieSessionList([...(prev.sessions || []), ...(ev.sessions || [])]);
      const firstTime = mergedSessions[0]?.time || '18:00';
      byKey.set(key, {
        ...prev,
        eventType: prev.eventType === 'especial' || ev.eventType === 'especial' ? 'especial' : 'cartelera',
        originalTitle: prev.originalTitle || ev.originalTitle || null,
        director: prev.director || ev.director || null,
        durationMinutes: prev.durationMinutes || ev.durationMinutes || null,
        ageRating: prev.ageRating || ev.ageRating || null,
        synopsis:
          prev.synopsis && prev.synopsis.length >= (ev.synopsis?.length || 0)
            ? prev.synopsis
            : ev.synopsis || prev.synopsis || null,
        posterUrl: pickPreferredCinemaPoster(prev.posterUrl, ev.posterUrl),
        imageUrl: pickPreferredCinemaPoster(prev.posterUrl || prev.imageUrl, ev.posterUrl || ev.imageUrl) || undefined,
        cycleName: prev.cycleName || ev.cycleName || null,
        hasVOSE: Boolean(prev.hasVOSE || ev.hasVOSE || mergedSessions.some((s) => s.isVOSE)),
        sessions: mergedSessions,
        startDate: `${prev.date}T${firstTime}:00`,
      });
    }
  }
  return Array.from(byKey.values());
}

/**
 * Cross-Venue Poster & Metadata Deduplication (Design Doc Section 5.3):
 * Propagates clean posterUrl, director, durationMinutes, ageRating, and synopsis
 * from richer venue payloads to venues screening the same film with missing metadata.
 */
function propagateCrossVenueCinemaMetadata(events) {
  const metaByFilm = new Map();
  for (const ev of events) {
    const filmKey = normalizeCinemaSlug(ev.title);
    if (!filmKey) continue;
    const prev = metaByFilm.get(filmKey) || {};
    metaByFilm.set(filmKey, {
      posterUrl: pickPreferredCinemaPoster(prev.posterUrl, ev.posterUrl),
      director: prev.director || ev.director || null,
      durationMinutes: prev.durationMinutes || ev.durationMinutes || null,
      ageRating: prev.ageRating || ev.ageRating || null,
      originalTitle: prev.originalTitle || ev.originalTitle || null,
      synopsis:
        prev.synopsis && prev.synopsis.length >= (ev.synopsis?.length || 0)
          ? prev.synopsis
          : ev.synopsis || prev.synopsis || null,
    });
  }

  return events.map((ev) => {
    const filmKey = normalizeCinemaSlug(ev.title);
    const shared = metaByFilm.get(filmKey);
    if (!shared) return ev;
    const posterUrl = pickPreferredCinemaPoster(ev.posterUrl, shared.posterUrl);
    const synopsis = ev.synopsis || shared.synopsis || null;
    return {
      ...ev,
      posterUrl,
      imageUrl: posterUrl || ev.imageUrl,
      director: ev.director || shared.director || null,
      durationMinutes: ev.durationMinutes || shared.durationMinutes || null,
      ageRating: ev.ageRating || shared.ageRating || null,
      originalTitle: ev.originalTitle || shared.originalTitle || null,
      synopsis,
      description: synopsis || ev.description,
    };
  });
}

async function fetchCinemaPage(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': CINEMA_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,ca;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { html: await res.text(), finalUrl: res.url || url };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCinemaHtml(url, timeoutMs = 15000) {
  const { html } = await fetchCinemaPage(url, timeoutMs);
  return html;
}

/**
 * Extracts Schema.org JSON-LD ScreeningEvent / Movie / Event blocks from any cinema HTML page.
 */
function extractJsonLdCinemaEntries(html, cinema, todayISO) {
  const results = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const nodes = [];
      const collect = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          obj.forEach(collect);
          return;
        }
        if (Array.isArray(obj['@graph'])) obj['@graph'].forEach(collect);
        nodes.push(obj);
      };
      collect(parsed);

      for (const node of nodes) {
        const typeStr = Array.isArray(node['@type']) ? node['@type'].join(' ') : String(node['@type'] || '');
        if (!/ScreeningEvent|Movie|Event/i.test(typeStr)) continue;
        const work = node.workPresented || node;
        const title = decodeHtmlEntitiesCinema(work.name || node.name || '');
        if (!title || title.length < 2) continue;

        const startIso = node.startDate || '';
        const date = parseSpanishOrIsoDate(startIso, todayISO);
        const timeM = /T(\d{2}:\d{2})/.exec(startIso);
        const poster =
          typeof (work.image || node.image) === 'string'
            ? work.image || node.image
            : (work.image?.url || node.image?.url || null);
        const director =
          typeof work.director === 'string'
            ? work.director
            : Array.isArray(work.director)
            ? work.director.map((d) => d?.name || d).filter(Boolean).join(', ')
            : work.director?.name || null;

        if (date && timeM) {
          let resolvedTime = timeM[1];
          // Skip bogus 00:00 placeholder times from WordPress The Events Calendar all-day items;
          // attempt to find a real showtime inside the description first
          if (resolvedTime === '00:00') {
            const descTimeM = /\b(1\d|2[0-3]):([0-5]\d)\b/.exec(
              `${work.description || ''} ${node.description || ''} ${node.name || ''}`
            );
            if (!descTimeM) continue;
            resolvedTime = `${descTimeM[1]}:${descTimeM[2]}`;
          }
          results.push({
            title,
            date,
            sessions: [
              {
                time: resolvedTime,
                isVOSE: /vose|v\.o\.s|subtitul/i.test(`${node.videoFormat || ''} ${node.inLanguage || ''} ${node.name || ''}`) || Boolean(cinema.defaultVOSE),
                format: node.videoFormat || null,
                ticketUrl: node.offers?.url || node.url || null,
              },
            ],
            director,
            durationMinutes: parseDurationMinutes(work.duration || node.duration),
            ageRating: normalizeAgeRating(work.contentRating),
            synopsis: decodeHtmlEntitiesCinema(work.description || node.description || ''),
            posterUrl: poster,
            sourceUrl: node.url || cinema.url,
          });
        }
      }
    } catch {}
  }
  return results;
}

/**
 * Generic HTML card/article extractor (uses cheerio when available, regex fallback otherwise).
 */
async function extractHtmlCinemaCards(html, cinema, todayISO, options = {}) {
  const baseUrl = options.baseUrl || cinema.url;
  const entries = [...extractJsonLdCinemaEntries(html, cinema, todayISO)];
  const $ = await getOptionalCheerio().then((ch) => (ch ? ch.load(html) : null));
  const timeRegex = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;

  if ($) {
    const cardSelectors = options.cardSelectors || [
      'article',
      '.pelicula',
      '.movie',
      '.film',
      '.cartelera-item',
      '.programa-item',
      '.ficha',
      '.event',
      '.card',
      'li[class*="pelicula"]',
      'div[class*="pelicula"]',
      'div[class*="movie"]',
      'div[class*="film"]',
      'div[class*="session"]',
    ];

    $(cardSelectors.join(', ')).each((_, el) => {
      const $el = $(el);
      const rawHeading =
        $el.find('h1, h2, h3, h4, .title, .titulo, .movie-title, .film-title').first().text() ||
        $el.find('a[title]').first().attr('title') ||
        '';
      const title = decodeHtmlEntitiesCinema(rawHeading);
      if (!title || title.length < 2 || title.length > 140) return;

      const blockText = decodeHtmlEntitiesCinema($el.text());
      const times = [];
      let tm;
      timeRegex.lastIndex = 0;
      while ((tm = timeRegex.exec(blockText)) !== null) {
        const hhmm = `${tm[1].padStart(2, '0')}:${tm[2]}`;
        if (hhmm !== '00:00') times.push(hhmm);
      }
      if (times.length === 0) return;

      const dateAttr =
        $el.attr('data-date') ||
        $el.find('[datetime]').first().attr('datetime') ||
        $el.find('[data-date]').first().attr('data-date') ||
        $el.closest('[data-date]').attr('data-date') ||
        blockText;
      const date = parseSpanishOrIsoDate(dateAttr, todayISO) || todayISO;

      const imgEl = $el.find('img').first();
      const rawPoster =
        imgEl.attr('data-original') ||
        imgEl.attr('data-src') ||
        imgEl.attr('data-lazy-src') ||
        imgEl.attr('src') ||
        null;
      const posterUrl = resolveAbsoluteCinemaUrl(rawPoster, baseUrl);
      const buyHref =
        $el.find('a[href*="entrada"], a[href*="ticket"], a[href*="enterticket"], a[href*="reservaentradas"], a[href*="compra"], a[href*="sesiones"]').first().attr('href') ||
        $el.find('a[href]').first().attr('href') ||
        baseUrl;
      const resolvedLink = resolveAbsoluteCinemaUrl(buyHref, baseUrl) || cinema.url;

      const directorM = /(?:Direcci[oó]n|Director(?:a)?|Dir\.?)\s*[:\-]\s*([^|\n·•]{2,60})/i.exec(blockText);
      const cycleText = $el.find('.ciclo, .cicle, .cycle, .categoria, .category, .tag').first().text();
      const meta = extractCinemaFormatAndVose(blockText, Boolean(cinema.defaultVOSE));

      entries.push({
        title,
        date,
        sessions: times.map((t) => ({
          time: t,
          isVOSE: meta.isVOSE,
          format: meta.format,
          ticketUrl: resolvedLink,
        })),
        director: directorM ? directorM[1].trim() : null,
        durationMinutes: parseDurationMinutes(blockText),
        ageRating: normalizeAgeRating(blockText),
        synopsis: decodeHtmlEntitiesCinema($el.find('p, .sinopsis, .synopsis, .description').first().text() || ''),
        posterUrl,
        cycleName: decodeHtmlEntitiesCinema(cycleText || '') || null,
        sourceUrl: resolvedLink,
        extraText: blockText.slice(0, 300),
      });
    });
  } else {
    // Zero-dependency HTML fallback when cheerio is not installed
    const blockRegex = /<(?:article|div|li)[^>]*(?:pelicula|movie|film|cartelera|program|event|card)[^>]*>([\s\S]{40,3500}?)<\/(?:article|div|li)>/gi;
    let m;
    while ((m = blockRegex.exec(html)) !== null) {
      const snippet = m[1];
      const hMatch = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i.exec(snippet);
      const title = stripHtmlTagsCinema(hMatch ? hMatch[1] : '');
      if (!title || title.length < 2 || title.length > 140) continue;

      const text = stripHtmlTagsCinema(snippet);
      const times = [];
      let tm;
      timeRegex.lastIndex = 0;
      while ((tm = timeRegex.exec(text)) !== null) {
        const hhmm = `${tm[1].padStart(2, '0')}:${tm[2]}`;
        if (hhmm !== '00:00') times.push(hhmm);
      }
      if (times.length === 0) continue;

      const imgM = /<img[^>]+(?:data-original|data-src|data-lazy-src|src)=["']([^"']+)["']/i.exec(snippet);
      const ticketHrefM = /<a[^>]+href=["']([^"']*(?:entrada|ticket|enterticket|reservaentradas|compra|sesiones)[^"']*)["']/i.exec(snippet);
      const hrefM = ticketHrefM || /<a[^>]+href=["']([^"']+)["']/i.exec(snippet);
      const date = parseSpanishOrIsoDate(text, todayISO) || todayISO;
      const meta = extractCinemaFormatAndVose(text, Boolean(cinema.defaultVOSE));
      const resolvedLink = hrefM ? resolveAbsoluteCinemaUrl(hrefM[1], baseUrl) : cinema.url;

      entries.push({
        title,
        date,
        sessions: times.map((t) => ({
          time: t,
          isVOSE: meta.isVOSE,
          format: meta.format,
          ticketUrl: resolvedLink,
        })),
        durationMinutes: parseDurationMinutes(text),
        ageRating: normalizeAgeRating(text),
        posterUrl: imgM ? resolveAbsoluteCinemaUrl(imgM[1], baseUrl) : null,
        sourceUrl: resolvedLink,
        extraText: text.slice(0, 300),
      });
    }
  }

  return entries;
}

/**
 * Builds the official per-movie ticket/schedule page URL for ReservaEntradas venues.
 * For Cines ABC (Park=2, El Saler=172, Gran Turia=171), builds the exact official deep link:
 *   https://www.cinesabc.com/e/abc-gran-turia/ruega-por-nosotras/171/3532
 */
function buildReservaEntradasMovieTicketUrl(cinema, sesionesUrl, movieSlug, movieId) {
  if (cinema.abcCinemaId && cinema.abcVenueSlug && movieSlug && movieId) {
    return `https://www.cinesabc.com/e/${cinema.abcVenueSlug}/${movieSlug}/${cinema.abcCinemaId}/${movieId}`;
  }
  return sesionesUrl || cinema.url;
}

function parseReservaEntradasAnalyticsJson(html) {
  const m = /reAnalyticsSesiones\s*=\s*(\{[\s\S]*?\})\s*;/.exec(html);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Dedicated scraper for all 7 ReservaEntradas-backed Valencia cinemas:
 * Cines ABC Park, Cines ABC El Saler, Cines ABC Gran Turia,
 * Cines Lys, Cines Babel, Cines MN4, and Cinestudio d'Or.
 * Extracts high-res non-hotlinked posters, 7-day showtimes, VOSE/format flags,
 * durations, age ratings, synopses, and direct per-movie / per-session ticket URLs.
 */
async function scrapeReservaEntradasCinemaVenue(cinema, todayISO, updatedAtISO) {
  const slug = cinema.reservaEntradasSlug;
  const listUrl = `https://www.reservaentradas.com/cine/valencia/${slug}`;
  const { html: listHtml } = await fetchCinemaPage(listUrl, 15000);
  const rows = listHtml.split('<div class="movie row"').slice(1);
  if (rows.length === 0) return [];

  const movies = [];
  for (const row of rows) {
    const sesLinkM = /href=["'](https?:\/\/www\.reservaentradas\.com\/sesiones\/([^/"']+)\/([^/"']+)\/([^/"']+)\/(\d+)\/?)["']/i.exec(row);
    if (!sesLinkM) continue;
    const sesionesUrl = sesLinkM[1];
    const citySlug = sesLinkM[2];
    const reSlug = sesLinkM[3];
    const movieSlug = sesLinkM[4];
    const movieId = sesLinkM[5];

    const titleAnchorM = /<div[^>]*title-movie-list[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(row);
    const altTitleM = /alt=["']Caratula\s+([^"']+)["']/i.exec(row);
    const rawTitle = stripHtmlTagsCinema(titleAnchorM ? titleAnchorM[1] : altTitleM ? altTitleM[1] : '');
    if (!rawTitle || rawTitle.length < 2) continue;

    const posterM = /data-original=["']([^"']+)["']/i.exec(row) || /<img[^>]+caratula[^>]+src=["']([^"']+)["']/i.exec(row);
    const posterUrl = posterM ? resolveAbsoluteCinemaUrl(posterM[1], listUrl) : null;

    const durM = /(\d{2,3})\s*min\./i.exec(row);
    const ageTitleM = /title=["']([^"']*(?:menores|p[uú]blicos|pendiente)[^"']*)["']/i.exec(row);
    const sinopsisM = /sinopsis\(\s*'((?:\\'|[^'])*)'\s*,/i.exec(row);
    const synopsis = sinopsisM
      ? decodeHtmlEntitiesCinema(sinopsisM[1].replace(/\\'/g, "'").replace(/\\n/g, ' '))
      : null;

    const movieTicketPageUrl = buildReservaEntradasMovieTicketUrl(cinema, sesionesUrl, movieSlug, movieId);

    // Fallback today sessions already embedded in the listing row
    const inlineSessions = [];
    const entradaRegex = /<a[^>]+href=["'](https?:\/\/www\.reservaentradas\.com\/entrada\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let em;
    while ((em = entradaRegex.exec(row)) !== null) {
      const timeM = /\b([012]\d:[0-5]\d)\b/.exec(stripHtmlTagsCinema(em[2]));
      if (timeM) {
        inlineSessions.push({
          date: todayISO,
          time: timeM[1],
          isVOSE: Boolean(cinema.defaultVOSE) || /v\.?o\.?s\.?e/i.test(row),
          format: null,
          hall: null,
          ticketUrl: cinema.abcCinemaId ? movieTicketPageUrl : em[1],
        });
      }
    }

    movies.push({
      rawTitle,
      posterUrl,
      durationMinutes: durM ? parseInt(durM[1], 10) : null,
      ageRating: ageTitleM ? normalizeAgeRating(ageTitleM[1]) : null,
      synopsis,
      sesionesUrl,
      citySlug,
      reSlug,
      movieSlug,
      movieId,
      movieTicketPageUrl,
      inlineSessions,
    });
  }

  // Fetch each movie's /sesiones/ page in small parallel batches (6 at a time) for full 7-day schedules
  const rawEntries = [];
  const batchSize = 6;
  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (movie) => {
        const sessionsByDate = new Map();
        const addSess = (dateStr, sessObj) => {
          if (!dateStr) return;
          if (!sessionsByDate.has(dateStr)) sessionsByDate.set(dateStr, []);
          sessionsByDate.get(dateStr).push(sessObj);
        };

        try {
          const { html: detailHtml } = await fetchCinemaPage(movie.sesionesUrl, 10000);
          const analyticsMap = parseReservaEntradasAnalyticsJson(detailHtml);
          if (analyticsMap && typeof analyticsMap === 'object') {
            for (const [sessionId, info] of Object.entries(analyticsMap)) {
              if (!info || !info.session_datetime) continue;
              const dtM = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(String(info.session_datetime));
              if (!dtM) continue;
              const dateStr = dtM[1];
              const timeStr = dtM[2];
              const cat4 = String(info.item_category4 || '');
              const meta = extractCinemaFormatAndVose(
                `${info.item_name || movie.rawTitle} ${cat4}`,
                Boolean(cinema.defaultVOSE)
              );
              const directSessionTicketUrl = cinema.abcCinemaId
                ? movie.movieTicketPageUrl
                : `https://www.reservaentradas.com/entrada/${movie.citySlug}/${movie.reSlug}/${movie.movieSlug}/${sessionId}/?step=2`;

              addSess(dateStr, {
                time: timeStr,
                isVOSE: meta.isVOSE,
                format: meta.format,
                hall: info.item_category5 || null,
                ticketUrl: directSessionTicketUrl,
              });
            }
          }
        } catch {
          // Fall back to inline sessions from listing page if detail page timed out
        }

        if (sessionsByDate.size === 0 && movie.inlineSessions.length > 0) {
          for (const s of movie.inlineSessions) {
            addSess(s.date, {
              time: s.time,
              isVOSE: s.isVOSE,
              format: s.format,
              hall: s.hall,
              ticketUrl: s.ticketUrl,
            });
          }
        }

        const out = [];
        for (const [dateStr, sessList] of sessionsByDate.entries()) {
          out.push({
            title: movie.rawTitle,
            date: dateStr,
            sessions: sessList,
            durationMinutes: movie.durationMinutes,
            ageRating: movie.ageRating,
            synopsis: movie.synopsis,
            posterUrl: movie.posterUrl,
            sourceUrl: movie.movieTicketPageUrl,
            ticketUrl: movie.movieTicketPageUrl,
          });
        }
        return out;
      })
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        rawEntries.push(...r.value);
      }
    }
  }

  return rawEntries
    .map((r) => buildCinemaEventRecord(cinema, r, todayISO, updatedAtISO))
    .filter(Boolean);
}

/**
 * Dedicated parser for Autocine STAR (https://www.autocinestar.com/new/)
 * Properly resolves relative media/cartelera/ poster URLs, extracts Enterticket buy links,
 * and splits multi-day date ranges ("27 y 28 de Noviembre") into individual screening dates.
 */
function parseAutocineStarHtml(html, finalUrl, cinema, todayISO) {
  const entries = [];
  const articles = html.match(/<article[^>]*pelicula-card[^>]*>[\s\S]*?<\/article>/gi) || [];
  const refYear = parseInt(todayISO.slice(0, 4), 10);
  const refMonth = parseInt(todayISO.slice(5, 7), 10);

  for (const art of articles) {
    const imgM = /<img[^>]+src=["']([^"']+)["']/i.exec(art);
    const posterUrl = imgM ? resolveAbsoluteCinemaUrl(imgM[1], finalUrl) : null;

    const ticketM = /<a[^>]+href=["'](https?:\/\/[^"']*enterticket\.es[^"']*)["']/i.exec(art);
    const ticketUrl = ticketM ? ticketM[1] : finalUrl;

    const titleMatches = [...art.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)]
      .map((m) => stripHtmlTagsCinema(m[1]))
      .filter((t) => t.length >= 2);
    const isDouble = /pelicula-card--doble|sesi[oó]n\s+doble/i.test(art);
    let title = titleMatches[0] || '';
    if (!title) {
      const altM = /alt=["']P[oó]ster\s+de\s+([^"']+)["']/i.exec(art);
      title = altM ? decodeHtmlEntitiesCinema(altM[1]) : '';
    }
    if (!title) continue;
    if (isDouble && !/^sesi[oó]n\s+doble/i.test(title)) {
      title = titleMatches.length >= 2 ? `Sesión doble: ${titleMatches[0]} + ${titleMatches[1]}` : `Sesión doble: ${title}`;
    }

    const text = stripHtmlTagsCinema(art);
    const times = [...new Set((text.match(/\b(?:1\d|2[0-3]):[0-5]\d\b/g) || []))];
    if (times.length === 0) times.push('21:15');

    // Parse dates like "27 y 28 de Noviembre" or "4, 5 y 6 de Diciembre"
    const dates = [];
    const multiDateM = /((?:\d{1,2}\s*(?:,|y|al|-)\s*)*\d{1,2})\s+de\s+([a-zçà-ú]{3,12})(?:\s+(?:de\s+)?(\d{4}))?/i.exec(text);
    if (multiDateM) {
      const days = (multiDateM[1].match(/\d{1,2}/g) || []).map((d) => parseInt(d, 10)).filter((d) => d >= 1 && d <= 31);
      const monKey = multiDateM[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3);
      const mon = MONTH_MAP[multiDateM[2].toLowerCase()] || MONTH_MAP[monKey];
      if (mon && days.length > 0) {
        let yr = multiDateM[3] ? parseInt(multiDateM[3], 10) : refYear;
        if (!multiDateM[3] && mon < refMonth - 2) yr += 1;
        for (const d of days) {
          dates.push(`${yr}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }
    }
    if (dates.length === 0) {
      const fallbackDate = parseSpanishOrIsoDate(text, todayISO);
      if (fallbackDate) dates.push(fallbackDate);
    }

    for (const d of dates) {
      entries.push({
        title,
        date: d,
        eventType: 'especial',
        sessions: times.map((t) => ({
          time: t,
          isVOSE: false,
          format: null,
          ticketUrl,
        })),
        posterUrl,
        sourceUrl: ticketUrl,
        ticketUrl,
        extraText: text.slice(0, 300),
      });
    }
  }
  return entries;
}

/**
 * Smart-cases ALL-CAPS Spanish/Valencian cinema titles (e.g. "LOS GIRASOLES CIEGOS" -> "Los girasoles ciegos")
 * while preserving Roman numerals and short acronyms.
 */
function normalizeAllCapsCinemaLabel(raw) {
  const clean = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const letters = clean.replace(/[^A-Za-zÁÉÍÓÚÜÑÀÈÌÒÙÇáéíóúüñàèìòùç]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return clean;
  const keepUpper = new Set(['II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'USA', 'EEUU', 'TV', 'ADN', 'IVC', 'SEMINCI', '3D', 'DCP']);
  const lowerWords = clean.toLowerCase().split(' ');
  return lowerWords
    .map((word, idx) => {
      const stripped = word.replace(/^[^a-záéíóúüñàèìòùç0-9]+|[^a-záéíóúüñàèìòùç0-9]+$/gi, '').toUpperCase();
      if (keepUpper.has(stripped)) return word.toUpperCase();
      if (idx === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      return word;
    })
    .join(' ');
}

/**
 * Dedicated parser for La Filmoteca (IVC) official programming pages:
 * https://ivc.gva.es/es/audiovisuales/programacion/valencia-la-filmoteca-cas
 * Parses <div class="actividad ..."> blocks including exact ISO ticket dates, showtimes,
 * directors, runtime, VOS/VOSE flags, archival formats (35mm/16mm/DCP), cycles, and posters.
 */
function parseLaFilmotecaHtml(html, finalUrl, cinema, todayISO) {
  const entries = [];
  const blocks = String(html || '').split(/<div\s+class=["']actividad\b[^>]*>/i).slice(1);
  const refYear = parseInt(todayISO.slice(0, 4), 10);
  const refMonth = parseInt(todayISO.slice(5, 7), 10);

  for (const block of blocks) {
    // 1. Extract date & time
    const diaM = /<span[^>]*class=["']dia["'][^>]*>([\s\S]*?)<\/span>/i.exec(block);
    const mesM = /<span[^>]*class=["']mes["'][^>]*>([\s\S]*?)<\/span>/i.exec(block);
    const horaM = /<span[^>]*class=["']hora["'][^>]*>([\s\S]*?)<\/span>/i.exec(block);
    const buyM = /<a[^>]*class=["'][^"']*btn-venta-entradas[^"']*["'][^>]*href=["']([^"']+)["']/i.exec(block) ||
                 /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*btn-venta-entradas[^"']*["']/i.exec(block);

    const buyUrl = buyM ? resolveAbsoluteCinemaUrl(decodeHtmlEntitiesCinema(buyM[1]), finalUrl) : null;

    let dateStr = null;
    if (buyUrl) {
      const isoInUrl = /\/(\d{4}-\d{2}-\d{2})(?:[/?#]|$)/.exec(buyUrl);
      if (isoInUrl) dateStr = isoInUrl[1];
    }
    if (!dateStr && diaM && mesM) {
      const dayNum = parseInt(stripHtmlTagsCinema(diaM[1]), 10);
      const mesRaw = stripHtmlTagsCinema(mesM[1])
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\./g, '')
        .trim();
      const mon = MONTH_MAP[mesRaw] || MONTH_MAP[mesRaw.slice(0, 3)];
      if (dayNum >= 1 && dayNum <= 31 && mon) {
        let yr = refYear;
        if (mon < refMonth - 2) yr += 1;
        else if (mon > refMonth + 9) yr -= 1;
        dateStr = `${yr}-${String(mon).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      }
    }
    if (!dateStr) continue;

    const timeM = horaM ? /\b([012]?\d:[0-5]\d)\b/.exec(stripHtmlTagsCinema(horaM[1])) : null;
    const time = timeM ? timeM[1].padStart(5, '0') : '18:00';

    // 2. Extract title & film detail link
    const h2LinkM = /<h2[^>]*>\s*<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i.exec(block);
    const h2PlainM = !h2LinkM ? /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(block) : null;
    const rawTitle = h2LinkM
      ? stripHtmlTagsCinema(h2LinkM[2])
      : h2PlainM
        ? stripHtmlTagsCinema(h2PlainM[1])
        : '';
    const title = normalizeAllCapsCinemaLabel(rawTitle);
    if (!title || title.length < 2) continue;

    const detailUrl = h2LinkM
      ? resolveAbsoluteCinemaUrl(decodeHtmlEntitiesCinema(h2LinkM[1]), finalUrl)
      : finalUrl;
    const ticketUrl = buyUrl || detailUrl || cinema.url;

    // 3. Extract poster image (encode accented Spanish filenames safely)
    const fotoM = /<div[^>]*class=["']foto-peli["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i.exec(block);
    let posterUrl = fotoM ? resolveAbsoluteCinemaUrl(decodeHtmlEntitiesCinema(fotoM[1]), finalUrl) : null;
    if (posterUrl) {
      try {
        posterUrl = encodeURI(decodeURI(posterUrl));
      } catch {
        posterUrl = encodeURI(posterUrl);
      }
    }

    // 4. Extract cycle name
    const cicloM = /<span[^>]*class=["']extra-ciclo["'][^>]*>([\s\S]*?)<\/span>/i.exec(block);
    const cycleName = cicloM ? normalizeAllCapsCinemaLabel(stripHtmlTagsCinema(cicloM[1])) : 'La Filmoteca';

    // 5. Extract technical metadata line (director, year, VOS, runtime, format)
    const textosM = /<div[^>]*class=["']textos-peli["'][^>]*>[\s\S]*?<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i.exec(block);
    const metaHtml = textosM ? textosM[1] : '';
    const metaText = stripHtmlTagsCinema(metaHtml);

    const dirM = /<strong[^>]*>([\s\S]*?)<\/strong>/i.exec(metaHtml);
    const director = dirM ? stripHtmlTagsCinema(dirM[1]) : undefined;

    const durM = /\b(\d{2,3})\s*['’′]/.exec(metaText) || /\b(\d{2,3})\s*min\b/i.exec(metaText);
    const durationMinutes = durM ? parseInt(durM[1], 10) : undefined;

    const isVOSE = /\bV\.?O\.?S\.?E?\.?\b|\bVOS\s+(?:CASTELLANO|VALENCIANO|ESPA[ÑN]OL|CATAL[AÀ])/i.test(metaText);

    let format = null;
    if (/\b35\s*mm\b/i.test(metaText)) format = '35mm';
    else if (/\b16\s*mm\b/i.test(metaText)) format = '16mm';
    else if (/\b70\s*mm\b/i.test(metaText)) format = '70mm';
    else if (/\bDCP\b/i.test(metaText)) format = 'DCP';

    // 6. Optional presentation note (<p class="azul">)
    const noteM = /<p[^>]*class=["'][^"']*azul[^"']*["'][^>]*>([\s\S]*?)<\/p>/i.exec(block);
    const noteText = noteM ? stripHtmlTagsCinema(noteM[1]) : '';
    const synopsisParts = [];
    if (noteText) synopsisParts.push(noteText);
    if (metaText) synopsisParts.push(metaText);

    entries.push({
      title,
      date: dateStr,
      eventType: 'especial',
      cycleName: cycleName || 'La Filmoteca',
      director,
      durationMinutes,
      synopsis: synopsisParts.join(' · ') || undefined,
      posterUrl,
      sourceUrl: detailUrl || cinema.url,
      ticketUrl,
      isVOSE,
      sessions: [
        {
          time,
          isVOSE,
          format,
          ticketUrl,
        },
      ],
    });
  }

  return entries;
}

/**
 * Parses SensaCine runtime strings like "2h 38min", "1h 54min", "55min" into integer minutes.
 */
function parseSensaCineRuntimeMinutes(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 400 ? Math.round(raw / 60) : Math.round(raw);
  }
  const s = String(raw || '').trim();
  if (!s) return undefined;
  let total = 0;
  const hM = /(\d+)\s*h/i.exec(s);
  const mM = /(\d+)\s*min/i.exec(s);
  if (hM) total += parseInt(hM[1], 10) * 60;
  if (mM) total += parseInt(mM[1], 10);
  if (total > 0 && total < 600) return total;
  const plainM = /^(\d{2,3})$/.exec(s);
  return plainM ? parseInt(plainM[1], 10) : undefined;
}

function normalizeSensaCineAgeRating(releases) {
  if (!Array.isArray(releases)) return undefined;
  for (const rel of releases) {
    const code = String(rel?.certificate?.code || '').trim().toUpperCase();
    if (!code) continue;
    if (/^\d{1,2}$/.test(code)) return `+${code}`;
    if (code === 'TP' || code === 'APTA' || code === 'A') return 'TP';
    return code;
  }
  return undefined;
}

function extractSensaCineFormat(showtime) {
  const bag = [
    ...(Array.isArray(showtime?.experience) ? showtime.experience : []),
    ...(Array.isArray(showtime?.projection) ? showtime.projection : []),
    ...(Array.isArray(showtime?.picture) ? showtime.picture : []),
    ...(Array.isArray(showtime?.sound) ? showtime.sound : []),
    ...(Array.isArray(showtime?.tags) ? showtime.tags : []),
  ]
    .join(' ')
    .toUpperCase();

  if (/\bIMAX\b/.test(bag)) return 'IMAX';
  if (/\b4DX\b/.test(bag)) return '4DX';
  if (/\bSCREENX\b/.test(bag)) return 'ScreenX';
  if (/\bISENSE\b/.test(bag)) return 'iSense';
  if (/DOLBY[\s_]*ATMOS|\bATMOS\b/.test(bag)) return 'Atmos';
  if (/\bF_3D\b|\b3D\b/.test(bag)) return '3D';
  return '2D';
}

function extractSensaCineDirectTicketUrl(showtime, fallbackUrl) {
  const list = showtime?.data?.ticketing;
  if (!Array.isArray(list) || list.length === 0) return fallbackUrl;
  const directDefault = list.find(
    (tk) => tk?.provider === 'default' && Array.isArray(tk.urls) && tk.urls[0] && /^https?:\/\//i.test(tk.urls[0])
  );
  if (directDefault) return directDefault.urls[0];
  const nonRelay = list.find(
    (tk) =>
      Array.isArray(tk?.urls) &&
      tk.urls[0] &&
      /^https?:\/\//i.test(tk.urls[0]) &&
      !/relay\.mvtx\.us/i.test(tk.urls[0])
  );
  if (nonRelay) return nonRelay.urls[0];
  return fallbackUrl;
}

function addDaysToIsoDate(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

/**
 * Direct JSON API scraper via SensaCine showtimes endpoint for major chains that block
 * datacenter IPs on their consumer frontends (Yelmo Campanar, Ocine Aqua, Kinépolis, Cinesa Bonaire).
 * Returns official direct seat-booking deep links (provider="default"), high-res posters,
 * exact VOSE flags, formats, directors, age ratings, runtimes, and 7-day rolling showtimes.
 */
async function scrapeSensaCineCinemaVenue(cinema, todayISO, updatedAtISO) {
  const theaterId = cinema.sensaCineTheaterId;
  if (!theaterId) return [];

  const headers = {
    'User-Agent': CINEMA_USER_AGENT,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const fetchJson = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  // Accumulate sessions per (movieId|date) so pagination & multi-day queries deduplicate cleanly
  const byMovieDate = new Map();
  const targetDates = Array.from({ length: 7 }, (_, i) => addDaysToIsoDate(todayISO, i));

  // Process dates in small batches of 2 to stay polite and fast
  for (let i = 0; i < targetDates.length; i += 2) {
    const dateBatch = targetDates.slice(i, i + 2);
    await Promise.allSettled(
      dateBatch.map(async (targetDate) => {
        const baseUrl = `https://www.sensacine.com/_/showtimes/theater-${theaterId}/d-${targetDate}/`;
        let firstPage;
        try {
          firstPage = await fetchJson(baseUrl);
        } catch (err) {
          console.warn(`[Cine SensaCine] ${cinema.id} ${targetDate} p1: ${err.message}`);
          return;
        }
        const totalPages = Math.min(5, Number(firstPage?.pagination?.totalPages || 1));
        const pages = [firstPage];

        for (let p = 2; p <= totalPages; p += 1) {
          try {
            const nextPage = await fetchJson(`${baseUrl}p-${p}/`);
            if (nextPage) pages.push(nextPage);
          } catch (err) {
            console.warn(`[Cine SensaCine] ${cinema.id} ${targetDate} p${p}: ${err.message}`);
          }
        }

        for (const pageData of pages) {
          const results = Array.isArray(pageData?.results) ? pageData.results : [];
          for (const item of results) {
            const movie = item?.movie;
            const showtimesObj = item?.showtimes;
            if (!movie?.title || !showtimesObj || typeof showtimesObj !== 'object') continue;

            const title = String(movie.title).replace(/\s+/g, ' ').trim();
            if (!title) continue;

            const originalTitle = movie.originalTitle
              ? String(movie.originalTitle).replace(/\s+/g, ' ').trim()
              : undefined;
            const posterUrl = movie.poster?.url || undefined;
            const synopsisRaw = movie.synopsisFull || movie.synopsis || '';
            const synopsis = stripHtmlTagsCinema(synopsisRaw) || undefined;
            const durationMinutes = parseSensaCineRuntimeMinutes(movie.runtime);
            const ageRating = normalizeSensaCineAgeRating(movie.releases);
            const director = Array.isArray(movie.credits)
              ? movie.credits
                  .filter((c) => String(c?.position?.name || '').toUpperCase() === 'DIRECTOR')
                  .map((c) => [c?.person?.firstName, c?.person?.lastName].filter(Boolean).join(' ').trim())
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(', ') || undefined
              : undefined;

            const movieKeyBase = String(movie.internalId || movie.id || title.toLowerCase());

            for (const [bucketKey, stList] of Object.entries(showtimesObj)) {
              if (!Array.isArray(stList) || stList.length === 0) continue;
              const bucketIsOriginal = /^original/i.test(bucketKey);

              for (const st of stList) {
                const startsAt = String(st?.startsAt || '');
                const dtM = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(startsAt);
                if (!dtM) continue;
                const sessionDate = dtM[1];
                const sessionTime = dtM[2];

                // Ignore stale/out-of-window dates outside targetDate
                if (sessionDate !== targetDate) continue;

                const tags = Array.isArray(st?.tags) ? st.tags : [];
                const isVOSE =
                  bucketIsOriginal ||
                  String(st?.diffusionVersion || '').toUpperCase() === 'ORIGINAL' ||
                  tags.some((tg) => /Version\.Original|Subtitle\.Spanish/i.test(String(tg)));

                const format = extractSensaCineFormat(st);
                const ticketUrl = extractSensaCineDirectTicketUrl(st, cinema.url);

                const mapKey = `${movieKeyBase}|${sessionDate}`;
                if (!byMovieDate.has(mapKey)) {
                  byMovieDate.set(mapKey, {
                    title,
                    originalTitle,
                    date: sessionDate,
                    director,
                    durationMinutes,
                    ageRating,
                    synopsis,
                    posterUrl,
                    sourceUrl: ticketUrl || cinema.url,
                    ticketUrl: ticketUrl || cinema.url,
                    sessions: [],
                  });
                }

                const entry = byMovieDate.get(mapKey);
                entry.sessions.push({
                  time: sessionTime,
                  isVOSE,
                  format,
                  ticketUrl,
                });
                if (entry.ticketUrl === cinema.url && ticketUrl && ticketUrl !== cinema.url) {
                  entry.ticketUrl = ticketUrl;
                  entry.sourceUrl = ticketUrl;
                }
              }
            }
          }
        }
      })
    );
  }

  return Array.from(byMovieDate.values())
    .map((entry) => buildCinemaEventRecord(cinema, entry, todayISO, updatedAtISO))
    .filter(Boolean);
}

/**
 * Recursively extracts cinema movie + showtime entries from arbitrary JSON API payloads
 * (used by Tier 2 chains: Yelmo, Cinesa, Kinépolis, Ocine, and Tier 3 Flutter Web Cines ABC).
 */
function extractCinemaEntriesFromApiJson(payload, cinema, todayISO, options = {}) {
  const entries = [];
  const forceVOSE = Boolean(options.forceVOSE || cinema.defaultVOSE);
  const visited = new Set();

  const walk = (node, context = {}) => {
    if (!node || typeof node !== 'object' || visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item, context);
      return;
    }

    // Detect movie-like object
    const rawTitle =
      node.Title ||
      node.title ||
      node.MovieTitle ||
      node.movieTitle ||
      node.FilmTitle ||
      node.filmTitle ||
      node.Name ||
      node.name ||
      node.titulo ||
      node.Titulo ||
      context.title;

    const rawPoster =
      node.Poster ||
      node.poster ||
      node.PosterUrl ||
      node.posterUrl ||
      node.ImageUrl ||
      node.imageUrl ||
      node.GraphicUrl ||
      node.cartel ||
      node.imagen ||
      context.posterUrl;

    const rawDirector =
      node.Director || node.director || node.direccion || context.director || null;
    const rawDuration =
      node.RunTime ||
      node.runtime ||
      node.Duration ||
      node.duration ||
      node.duracion ||
      context.durationMinutes ||
      null;
    const rawSynopsis =
      node.Synopsis ||
      node.synopsis ||
      node.Description ||
      node.description ||
      node.sinopsis ||
      context.synopsis ||
      null;
    const rawRating =
      node.Rating || node.rating || node.AgeRating || node.calificacion || context.ageRating || null;

    const rawDate =
      node.ShowtimeDate ||
      node.showtimeDate ||
      node.BusinessDate ||
      node.businessDate ||
      node.SessionDate ||
      node.sessionDate ||
      node.Date ||
      node.date ||
      node.fecha ||
      context.date;

    const nextCtx = {
      title: typeof rawTitle === 'string' && rawTitle.length >= 2 && rawTitle.length <= 150 ? rawTitle : context.title,
      posterUrl: typeof rawPoster === 'string' ? rawPoster : context.posterUrl,
      director: typeof rawDirector === 'string' ? rawDirector : context.director,
      durationMinutes: rawDuration ?? context.durationMinutes,
      synopsis: typeof rawSynopsis === 'string' ? rawSynopsis : context.synopsis,
      ageRating: typeof rawRating === 'string' ? rawRating : context.ageRating,
      date: parseSpanishOrIsoDate(rawDate, todayISO) || context.date,
      sourceUrl:
        node.DetailUrl ||
        node.detailUrl ||
        node.MovieUrl ||
        node.movieUrl ||
        node.FilmUrl ||
        node.filmUrl ||
        node.BuyUrl ||
        node.buyUrl ||
        node.BookingUrl ||
        node.bookingUrl ||
        node.TicketUrl ||
        node.ticketUrl ||
        node.Url ||
        node.url ||
        context.sourceUrl,
      extraText: `${node.Format || ''} ${node.Version || ''} ${node.Language || ''} ${node.Attributes || ''} ${Array.isArray(node.AttributeIds) ? node.AttributeIds.join(' ') : ''}`,
    };

    // Detect session-like leaf
    const rawTimeCandidate =
      node.Showtime ||
      node.showtime ||
      node.StartTime ||
      node.startTime ||
      node.SessionTime ||
      node.sessionTime ||
      node.Time ||
      node.time ||
      node.hora ||
      node.Hora ||
      node.ShowtimeDateTime ||
      node.startDateTime;

    if (rawTimeCandidate && nextCtx.title) {
      const timeStr = String(rawTimeCandidate);
      const isoDateFromTime = parseSpanishOrIsoDate(timeStr, todayISO);
      const timeM = /(?:T|\s|^)(\d{1,2})[:.hH](\d{2})/.exec(timeStr);
      if (timeM) {
        const hh = String(parseInt(timeM[1], 10) % 24).padStart(2, '0');
        const mm = timeM[2];
        const meta = extractCinemaFormatAndVose(
          `${nextCtx.title} ${nextCtx.extraText} ${node.Subtitles || ''} ${node.ScreenName || ''}`,
          forceVOSE
        );
        const sessionTicketUrl =
          node.BookingUrl ||
          node.bookingUrl ||
          node.BuyUrl ||
          node.buyUrl ||
          node.TicketUrl ||
          node.ticketUrl ||
          node.SessionUrl ||
          node.sessionUrl ||
          nextCtx.sourceUrl ||
          null;

        entries.push({
          title: nextCtx.title,
          date: isoDateFromTime || nextCtx.date || todayISO,
          sessions: [
            {
              time: `${hh}:${mm}`,
              isVOSE: forceVOSE || meta.isVOSE,
              format: meta.format,
              hall: node.ScreenName || node.Hall || node.sala || null,
              ticketUrl: sessionTicketUrl,
            },
          ],
          director: nextCtx.director,
          durationMinutes: nextCtx.durationMinutes,
          ageRating: nextCtx.ageRating,
          synopsis: nextCtx.synopsis,
          posterUrl: nextCtx.posterUrl,
          sourceUrl: nextCtx.sourceUrl || sessionTicketUrl || cinema.url,
          extraText: nextCtx.extraText,
        });
      }
    }

    for (const val of Object.values(node)) {
      if (val && typeof val === 'object') {
        walk(val, nextCtx);
      }
    }
  };

  walk(payload, {});
  return entries;
}

/**
 * Tier 1 Scraper (9 lightweight HTTP GET venues):
 * - 7 ReservaEntradas venues: Cines ABC Park, ABC El Saler, ABC Gran Turia,
 *   Cines Lys, Cines Babel, Cines MN4, Cinestudio d'Or
 * - Autocine STAR (dedicated HTML parser with redirected /new/ base URL)
 * - La Filmoteca (IVC)
 */
async function scrapeTier1CinemaVenue(cinema, todayISO, updatedAtISO) {
  const results = [];

  // 1. ReservaEntradas primary pipeline (7 Valencia cinemas)
  if (cinema.reservaEntradasSlug) {
    try {
      const reRecords = await scrapeReservaEntradasCinemaVenue(cinema, todayISO, updatedAtISO);
      results.push(...reRecords);
    } catch (err) {
      console.warn(`[Cine ReservaEntradas] ${cinema.id}: ${err.message}`);
    }
  }

  // 2. Autocine STAR dedicated HTML pipeline
  if (cinema.id === 'autocine-star') {
    try {
      const { html, finalUrl } = await fetchCinemaPage(cinema.url, 15000);
      const parsed = parseAutocineStarHtml(html, finalUrl, cinema, todayISO);
      const built = parsed
        .map((r) => buildCinemaEventRecord(cinema, r, todayISO, updatedAtISO))
        .filter(Boolean);
      results.push(...built);
      return results;
    } catch (err) {
      console.warn(`[Cine Autocine] ${cinema.id}: ${err.message}`);
      return results;
    }
  }

  // 2b. La Filmoteca (IVC) dedicated HTML pipeline (try Spanish primary first, Valencian fallback)
  if (cinema.id === 'la-filmoteca') {
    const filmotecaUrls = [cinema.url, ...(cinema.secondaryUrls || [])];
    for (const targetUrl of filmotecaUrls) {
      try {
        const { html, finalUrl } = await fetchCinemaPage(targetUrl, 15000);
        const parsed = parseLaFilmotecaHtml(html, finalUrl, cinema, todayISO);
        const built = parsed
          .map((r) => buildCinemaEventRecord(cinema, r, todayISO, updatedAtISO))
          .filter(Boolean);
        if (built.length > 0) {
          results.push(...built);
          return results;
        }
      } catch (err) {
        console.warn(`[Cine Filmoteca] ${cinema.id} (${targetUrl}): ${err.message}`);
      }
    }
    return results;
  }

  // 3. Secondary / HTML URLs (e.g. Cines Lys special cycles calendar)
  const urlsToFetch = cinema.reservaEntradasSlug
    ? cinema.secondaryUrls || []
    : [cinema.url, ...(cinema.secondaryUrls || [])];

  const rawEntries = [];
  for (const targetUrl of urlsToFetch) {
    try {
      const { html, finalUrl } = await fetchCinemaPage(targetUrl, 15000);
      const extracted = await extractHtmlCinemaCards(html, cinema, todayISO, { baseUrl: finalUrl });
      for (const item of extracted) {
        if (targetUrl.includes('proximamente') || targetUrl.includes('calendario')) {
          item.eventType = 'especial';
        }
        rawEntries.push(item);
      }
    } catch (err) {
      console.warn(`[Cine Tier 1] ${cinema.id} (${targetUrl}): ${err.message}`);
    }
  }

  results.push(
    ...rawEntries
      .map((r) => buildCinemaEventRecord(cinema, r, todayISO, updatedAtISO))
      .filter(Boolean)
  );
  return results;
}

/**
 * Tier 2 & Tier 3 Cinema Scraper:
 * - Primary: SensaCine JSON showtimes API (bypasses Cloudflare/CloudFront 403 on datacenter IPs
 *   for Yelmo Campanar, Ocine Premium Aqua, Kinépolis València, and Cinesa LUXE Bonaire,
 *   returning official direct seat-booking deep links).
 * - Fallback: Playwright with Network JSON Interception + Blocked Images/Fonts.
 */
async function scrapePlaywrightCinemaVenue(browser, cinema, todayISO, updatedAtISO) {
  if (cinema.sensaCineTheaterId) {
    try {
      const apiRecords = await scrapeSensaCineCinemaVenue(cinema, todayISO, updatedAtISO);
      if (apiRecords.length > 0) {
        return apiRecords;
      }
    } catch (err) {
      console.warn(`[Cine SensaCine] ${cinema.id} failed (${err.message}); falling back to Playwright`);
    }
  }

  const urls = [{ url: cinema.url, forceVOSE: Boolean(cinema.defaultVOSE) }];
  if (cinema.voseUrl) {
    urls.push({ url: cinema.voseUrl, forceVOSE: true });
  }

  const rawEntries = [];
  const context = await browser.newContext({
    userAgent: CINEMA_USER_AGENT,
    extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' },
  });

  try {
    for (const target of urls) {
      const page = await context.newPage();
      const interceptedPayloads = [];

      // Block heavy visual assets (images, fonts, media) to stay well within CI time budget
      await page.route('**/*', (route) => {
        const resType = route.request().resourceType();
        if (resType === 'image' || resType === 'font' || resType === 'media') {
          return route.abort();
        }
        return route.continue();
      });

      page.on('response', async (response) => {
        try {
          const ct = (response.headers()['content-type'] || '').toLowerCase();
          if (!ct.includes('json')) return;
          const reqUrl = response.url().toLowerCase();
          if (
            /movie|film|pelicul|session|sesion|showtime|horario|cartelera|schedule|cinema|vista|kinepolis|cinesa|yelmo|ocine|abc|graphql/i.test(
              reqUrl
            )
          ) {
            const json = await response.json().catch(() => null);
            if (json) interceptedPayloads.push(json);
          }
        } catch {}
      });

      try {
        await page.goto(target.url, {
          waitUntil: cinema.tier === 3 ? 'networkidle' : 'domcontentloaded',
          timeout: 15000,
        });
        await page.waitForTimeout(cinema.tier === 3 ? 3500 : 2500);

        for (const payload of interceptedPayloads) {
          const found = extractCinemaEntriesFromApiJson(payload, cinema, todayISO, {
            forceVOSE: target.forceVOSE,
          });
          rawEntries.push(...found);
        }

        // For Tier 2 HTML/SPA sites, also parse rendered DOM if JSON interception was sparse
        if (cinema.tier === 2 && rawEntries.length === 0) {
          const html = await page.content();
          const domEntries = await extractHtmlCinemaCards(html, cinema, todayISO);
          for (const item of domEntries) {
            if (target.forceVOSE) {
              item.isVOSE = true;
              item.sessions = (item.sessions || []).map((s) => ({ ...s, isVOSE: true }));
            }
            rawEntries.push(item);
          }
        }
      } catch (err) {
        console.warn(`[Cine Tier ${cinema.tier}] ${cinema.id} (${target.url}): ${err.message}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await context.close().catch(() => {});
  }

  return rawEntries
    .map((r) => buildCinemaEventRecord(cinema, r, todayISO, updatedAtISO))
    .filter(Boolean);
}

function loadPreviousCinemaCacheByVenue(outPath, todayISO) {
  const byVenue = new Map();
  try {
    if (!fs.existsSync(outPath)) return byVenue;
    const raw = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    if (!Array.isArray(raw)) return byVenue;
    for (const ev of raw) {
      if (ev?.category !== 'cine') continue;
      const venueId = ev.venue?.id;
      const dateStr = ev.date || (ev.startDate || '').slice(0, 10);
      if (!venueId || !dateStr || dateStr < todayISO) continue;
      if (!byVenue.has(venueId)) byVenue.set(venueId, []);
      byVenue.get(venueId).push(ev);
    }
  } catch {}
  return byVenue;
}

async function runCinemaVenueIsolated(cinema, scraperPromiseFn, previousCacheByVenue) {
  const timeoutMs =
    cinema.reservaEntradasSlug || cinema.sensaCineTheaterId ? 45000 : cinema.tier === 1 ? 20000 : 30000;
  try {
    const result = await Promise.race([
      scraperPromiseFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    if (Array.isArray(result) && result.length > 0) {
      console.log(`[Cine] ${cinema.name}: scraped ${result.length} movie-date entries`);
      return result;
    }
    const cached = previousCacheByVenue.get(cinema.id) || [];
    if (cached.length > 0) {
      console.warn(`[Cine] ${cinema.name}: 0 fresh items; retaining ${cached.length} cached future entries`);
      return cached;
    }
    console.warn(`[Cine] ${cinema.name}: 0 items scraped`);
    return [];
  } catch (err) {
    const cached = previousCacheByVenue.get(cinema.id) || [];
    console.warn(
      `[Cine] ${cinema.name} failed (${err.message}); ${
        cached.length > 0 ? `retaining ${cached.length} cached future entries` : 'skipping venue'
      }`
    );
    return cached;
  }
}

async function scrapeAllValenciaCinemas(browser, outPath) {
  const todayISO = getValenciaTodayISO();
  const updatedAtISO = new Date().toISOString();
  const previousCacheByVenue = loadPreviousCinemaCacheByVenue(outPath, todayISO);

  const tier1Venues = VALENCIA_CINEMAS.filter((c) => c.tier === 1);
  const tier2And3Venues = VALENCIA_CINEMAS.filter((c) => c.tier === 2 || c.tier === 3);

  // Run Tier 1 lightweight HTTP scrapers concurrently
  const tier1Settled = await Promise.allSettled(
    tier1Venues.map((cinema) =>
      runCinemaVenueIsolated(
        cinema,
        () => scrapeTier1CinemaVenue(cinema, todayISO, updatedAtISO),
        previousCacheByVenue
      )
    )
  );

  const collected = [];
  for (const res of tier1Settled) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      collected.push(...res.value);
    }
  }

  // Run Tier 2 & Tier 3 Playwright venues sequentially to keep CI memory & CPU stable
  for (const cinema of tier2And3Venues) {
    const items = await runCinemaVenueIsolated(
      cinema,
      () => scrapePlaywrightCinemaVenue(browser, cinema, todayISO, updatedAtISO),
      previousCacheByVenue
    );
    collected.push(...items);
  }

  const grouped = groupAndDeduplicateCinemaEvents(collected);
  const enriched = propagateCrossVenueCinemaMetadata(grouped);
  console.log(`[Cine] Total consolidated cinema entries across Valencia: ${enriched.length}`);
  return enriched;
}

function runCinemaSelfTests() {
  const assert = (cond, msg) => {
    if (!cond) throw new Error(`Cinema self-test failed: ${msg}`);
  };
  const today = '2026-11-24';
  const updatedAt = '2026-11-24T06:00:00.000Z';

  // 1. Verify all 13 venues exist (9 city + 4 metro)
  assert(VALENCIA_CINEMAS.length === 13, `Expected 13 venues, got ${VALENCIA_CINEMAS.length}`);
  assert(
    VALENCIA_CINEMAS.filter((v) => v.zone === 'valencia-ciudad').length === 9,
    'Expected 9 Valencia ciudad venues'
  );
  assert(
    VALENCIA_CINEMAS.filter((v) => v.zone === 'area-metropolitana').length === 4,
    'Expected 4 Área metropolitana venues'
  );

  // 2. Verify VOSE + format parsing + midnight screening sort order (Autocine STAR 00:10)
  const autocine = VALENCIA_CINEMAS.find((v) => v.id === 'autocine-star');
  const starRec = buildCinemaEventRecord(
    autocine,
    {
      title: 'Dune: Parte Dos (V.O.S.E.)',
      date: today,
      sessions: [{ time: '00:10' }, { time: '21:45' }],
      durationMinutes: '166 min',
      ageRating: 'NRM 12',
    },
    today,
    updatedAt
  );
  assert(starRec && starRec.date === today, 'Midnight screening stays on evening date');
  assert(starRec.sessions[0].time === '21:45' && starRec.sessions[1].time === '00:10', '00:10 sorts after 21:45');
  assert(starRec.hasVOSE === true, 'VOSE flag detected');
  assert(starRec.ageRating === 'M-12', 'Age rating normalized to M-12');
  assert(starRec.durationMinutes === 166, 'Runtime parsed');
  assert(starRec.eventType === 'especial', 'Autocine STAR classified as especial');

  // 3. Verify Hybrid Horizon: cartelera capped at +6 days, especial allowed up to +31 days
  const babel = VALENCIA_CINEMAS.find((v) => v.id === 'cines-babel');
  const carteleraTooFar = buildCinemaEventRecord(
    babel,
    { title: 'Anora', date: addDaysToISO(today, 9), sessions: [{ time: '20:00' }] },
    today,
    updatedAt
  );
  assert(carteleraTooFar === null, 'Regular cartelera beyond +6 days must be dropped');

  const filmoteca = VALENCIA_CINEMAS.find((v) => v.id === 'la-filmoteca');
  const filmotecaFar = buildCinemaEventRecord(
    filmoteca,
    {
      title: 'El Verdugo (35mm)',
      date: addDaysToISO(today, 22),
      sessions: [{ time: '18:00', format: '35mm', isVOSE: true }],
      cycleName: 'Clásicos IVC',
    },
    today,
    updatedAt
  );
  assert(filmotecaFar !== null && filmotecaFar.eventType === 'especial', 'Filmoteca allowed up to 31 days');
  assert(filmotecaFar.sessions[0].format === '35mm', '35mm archival format preserved');

  // 4. Verify grouping (One Movie + One Cinema + One Date) + Cross-Venue Poster Deduplication
  const lys = VALENCIA_CINEMAS.find((v) => v.id === 'cines-lys');
  const lysA = buildCinemaEventRecord(
    lys,
    {
      title: 'La Habitación de al Lado',
      date: today,
      sessions: [{ time: '18:30', isVOSE: false }],
      posterUrl: 'https://cineslys.com/posters/habitacion.jpg',
      director: 'Pedro Almodóvar',
      durationMinutes: 107,
    },
    today,
    updatedAt
  );
  const lysB = buildCinemaEventRecord(
    lys,
    {
      title: 'La Habitación de al Lado (VOSE)',
      date: today,
      sessions: [{ time: '20:45', isVOSE: true }],
    },
    today,
    updatedAt
  );
  const babelSame = buildCinemaEventRecord(
    babel,
    {
      title: 'La Habitación de al Lado',
      date: today,
      sessions: [{ time: '19:15' }],
    },
    today,
    updatedAt
  );

  const grouped = groupAndDeduplicateCinemaEvents([lysA, lysB, babelSame]);
  assert(grouped.length === 2, `Expected 2 grouped entries (Lys + Babel), got ${grouped.length}`);
  const lysMerged = grouped.find((e) => e.venue.id === 'cines-lys');
  assert(lysMerged.sessions.length === 2, 'Lys sessions merged into 1 card');
  assert(lysMerged.hasVOSE === true, 'Merged Lys card hasVOSE === true');

  const enriched = propagateCrossVenueCinemaMetadata(grouped);
  const babelEnriched = enriched.find((e) => e.venue.id === 'cines-babel');
  assert(
    babelEnriched.posterUrl === 'https://cineslys.com/posters/habitacion.jpg',
    'Cross-venue poster deduplication propagated posterUrl'
  );
  assert(babelEnriched.director === 'Pedro Almodóvar', 'Cross-venue metadata propagated director');

  // 5. Verify Cines ABC deep-link URL generation & ALL-CAPS title normalization
  const abcGranTuria = VALENCIA_CINEMAS.find((v) => v.id === 'cines-abc-gran-turia');
  const abcDeepLink = buildReservaEntradasMovieTicketUrl(
    abcGranTuria,
    'https://www.reservaentradas.com/sesiones/valencia/abcgranturia/ruega-por-nosotras/3532/',
    'ruega-por-nosotras',
    '3532'
  );
  assert(
    abcDeepLink === 'https://www.cinesabc.com/e/abc-gran-turia/ruega-por-nosotras/171/3532',
    `Unexpected ABC Gran Turia deep link: ${abcDeepLink}`
  );
  assert(
    formatCinemaMovieTitle('RUEGA POR NOSOTRAS') === 'Ruega por Nosotras',
    `Title normalization failed: ${formatCinemaMovieTitle('RUEGA POR NOSOTRAS')}`
  );
  assert(
    pickPreferredCinemaPoster(
      'https://cineslys.com/wp-content/uploads/2026/11/RRSS-2.jpg',
      'https://cineslys.reservaentradas.com/cineslys/obj/LCinesD_dat/eventos/JPg0047p.jpg'
    ) === 'https://cineslys.reservaentradas.com/cineslys/obj/LCinesD_dat/eventos/JPg0047p.jpg',
    'Preferred non-hotlinked ReservaEntradas poster over WordPress upload'
  );

  console.log('ALL CINEMA SCRAPER SELF-TESTS PASSED (17/17 assertions)');
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

  let cabanyalEvents = [];
  try {
    cabanyalEvents = await scrapeCulturaCabanyal(context);
  } catch (e) {
    console.error('HUB Cultural Cabanyal error:', e.message);
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

  let vcfFemEvents = [];
  try {
    const page = await context.newPage();
    vcfFemEvents = await scrapeValenciaCFFemenino(page, context);
    await page.close();
  } catch (e) {
    console.error('Valencia CF Femenino error:', e.message);
  }

  let ivcEvents = [];
  try {
    ivcEvents = await scrapeIvcOpenData(context);
  } catch (e) {
    console.error('IVC Open Data error:', e.message);
  }

  let ivamEvents = [];
  try {
    const ivamPage = await browser.newPage();
    ivamEvents = await scrapeIvamExposiciones(ivamPage, context);
    await ivamPage.close();
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

  let ludEvents = [];
  try {
    const page = await context.newPage();
    ludEvents = await scrapeLevanteUD(page, context);
    await page.close();
  } catch (e) {
    console.error('Levante UD error:', e.message);
  }

  const outDir = path.join(__dirname, 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'events.json');

  let cinemaEvents = [];
  try {
    cinemaEvents = await scrapeAllValenciaCinemas(browser, outPath);
  } catch (e) {
    console.error('Valencia Cinemas pipeline error:', e.message);
  }

  await browser.close();

  const combined = [
    ...fdmEvents,
    ...vbcEvents,
    ...vcfEvents,
    ...vcfFemEvents,
    ...ludEvents,
    ...musicEvents,
    ...ivcEvents,
    ...cabanyalEvents,
    ...ivamEvents,
    ...mubavEvents,
    ...taliaEvents,
    ...mutantEvents,
    ...auEvents,
    ...cinemaEvents,
  ];

  console.log(`Total events consolidated before validation: ${combined.length}`);

  const processed = combined.map((ev) => {
    let startDate = (ev.startDate || '').trim();
    let endDate = (ev.endDate || '').trim();
    let venueName = ev.venueName;
    let address = ev.address;
    let description = ev.description;

    const normKey = normalizeKey(ev.title);

    if (VERIFIED_FIXTURES[normKey]) {
      const fix = VERIFIED_FIXTURES[normKey];
      startDate = fix.startDate;
      if (fix.endDate) endDate = fix.endDate;
      if (fix.venueName) venueName = fix.venueName;
      if (fix.address) address = fix.address;
      if (fix.description) description = fix.description;
    }

    let title = ev.title;
    if (ev.category === 'esports' && /\s+vs\.?\s+/i.test(title || '')) {
      title = formatSportsMatchTitle(title);
    }

    return {
      ...ev,
      title,
      startDate,
      endDate: endDate || undefined,
      venueName,
      address,
      description,
      ticketUrl: normalizeSpanishEventUrl(ev.ticketUrl),
      url: normalizeSpanishEventUrl(ev.url),
      ticketUrlEs: ev.ticketUrlEs ? normalizeSpanishEventUrl(ev.ticketUrlEs) : undefined,
      urlEs: ev.urlEs ? normalizeSpanishEventUrl(ev.urlEs) : undefined,
    };
  }).filter((ev) => {
    // Drop away matches (skip for FDM since it's 100% municipal local events)
    if (ev.source !== 'fdm' && ev.category === 'esports' && isAwayMatch(ev.title, ev.venueName, ev.address, ev.ticketUrl || ev.url)) {
      return false;
    }
    return true;
  });

  const nowMs = Date.now();
  for (const [key, fix] of Object.entries(VERIFIED_FIXTURES)) {
    if (key === 'levante ud vs atletico madrid' || key === 'valencia cf vs real madrid') continue;
    const fixtureTime = new Date(fix.startDate).getTime();
    const isStillActive = fixtureTime + 3 * 60 * 60 * 1000 >= nowMs;
    if (isStillActive) {
      const alreadyPresent = processed.some(
        (e) => normalizeKey(e.title) === key || normalizeKey(e.title).includes(key)
      );
      if (!alreadyPresent) {
        const canonicalTitle = formatSportsMatchTitle(key);

        processed.push({
          id: `verified-fixture-${key.replace(/[^a-z0-9]+/g, '-')}`,
          title: canonicalTitle,
          description: fix.description || `Partido oficial de LaLiga EA Sports en el ${fix.venueName || 'estadio'}`,
          category: 'esports',
          startDate: fix.startDate,
          endDate: fix.endDate,
          venueName: fix.venueName || 'Estadio Ciutat de València',
          address: fix.address || 'Carrer de Sant Vicent de Paül, 44, 46019 València',
          imageUrl: key.includes('levante')
            ? 'https://static.tickelio.com/images/0/0/1/6/7/0/levante-ud-vs-athletic-club-2.jpeg'
            : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
          isFree: false,
          ticketPrice: 'Entradas en taquilla',
          ticketUrl: key.includes('levante') ? 'https://ticketing.levanteud.com' : 'https://www.valenciacf.com/es/entradas',
          url: key.includes('levante') ? 'https://ticketing.levanteud.com' : 'https://www.valenciacf.com/es/entradas',
          source: 'verified-sports',
          authority: 1,
        });
      }
    }
  }

  function cleanTitleDisplay(title) {
    if (!title) return '';
    return title
      .replace(
        /^(la rialleta|ciclo\s+(?:de\s+)?[a-zçà-ú]+|cicle\s+(?:de\s+)?[a-zçà-ú]+|festival\s+(?:de\s+)?[a-zçà-ú]+|mostra\s+(?:de\s+)?[a-zçà-ú]+|temporada\s+(?:de\s+)?[a-zçà-ú]+|gira\s+(?:de\s+)?[a-zçà-ú]+)[:\s-]+/gi,
        ''
      )
      .trim();
  }

  function selectBestTitle(t1, t2) {
    const c1 = cleanTitleDisplay(t1);
    const c2 = cleanTitleDisplay(t2);

    const hasCyclePrefix = (t) =>
      /^(la rialleta|ciclo|cicle|festival|mostra|temporada|fira)/i.test(t || '');
    if (hasCyclePrefix(t1) && !hasCyclePrefix(t2)) return c2 || c1;
    if (hasCyclePrefix(t2) && !hasCyclePrefix(t1)) return c1 || c2;

    if (c2.length > c1.length && c2.length < 75) return c2;
    return c1 || c2 || '';
  }

  function datesOverlapOrNearby(startA, endA, startB, endB) {
    if (!startA || !startB) return false;
    const sA = new Date(startA).getTime();
    const eA = endA ? new Date(endA).getTime() : sA;
    const sB = new Date(startB).getTime();
    const eB = endB ? new Date(endB).getTime() : sB;

    if (isNaN(sA) || isNaN(sB)) return false;
    if (startA.slice(0, 10) === startB.slice(0, 10)) return true;
    if (sB >= sA && sB <= eA) return true;
    if (sA >= sB && sA <= eB) return true;
    if (sA <= eB && sB <= eA) return true;

    return false;
  }

  function areTitlesSimilar(t1, t2, sameVenueAndDate = false) {
    const c1 = cleanTitleForComparison(t1);
    const c2 = cleanTitleForComparison(t2);
    if (!c1 || !c2) return false;
    if (c1 === c2) return true;
    if (c1.length >= 4 && c2.length >= 4 && (c1.includes(c2) || c2.includes(c1))) return true;

    const tok1 = extractSignificantKeywords(c1);
    const tok2 = extractSignificantKeywords(c2);
    if (!tok1.length || !tok2.length) return false;
    if (tok1.slice().sort().join(' ') === tok2.slice().sort().join(' ')) return true;

    if (sameVenueAndDate) {
      const common = tok1.filter((t) => tok2.includes(t));
      const minLen = Math.min(tok1.length, tok2.length);
      const overlapRatio = common.length / minLen;

      if (minLen >= 2 && overlapRatio >= 0.6) return true;
      if (minLen === 1 && common.length === 1 && tok1.length <= 2 && tok2.length <= 2) return true;

      let fuzzyMatches = 0;
      for (const w1 of tok1) {
        if (
          tok2.some(
            (w2) =>
              w1 === w2 ||
              (w1.length >= 5 &&
                w2.length >= 5 &&
                (w1.startsWith(w2.slice(0, -1)) ||
                  (Math.abs(w1.length - w2.length) <= 1 && (w1.includes(w2) || w2.includes(w1)))))
          )
        ) {
          fuzzyMatches++;
        }
      }
      if (fuzzyMatches / minLen >= 0.65) return true;
    }

    return false;
  }

  function areEventsDuplicates(e1, e2) {
    const isCine = e1.category === 'cine' || e2.category === 'cine';
    if (isCine) {
      if (e1.category !== e2.category) return false;
      const d1 = e1.date || (e1.startDate || '').slice(0, 10);
      const d2 = e2.date || (e2.startDate || '').slice(0, 10);
      if (!d1 || !d2 || d1 !== d2) return false;
      const vId1 = e1.venue?.id || cleanVenueForMatching(e1.venueName);
      const vId2 = e2.venue?.id || cleanVenueForMatching(e2.venueName);
      if (!vId1 || !vId2 || vId1 !== vId2) return false;
      return normalizeCinemaSlug(e1.title) === normalizeCinemaSlug(e2.title);
    }

    const isEsports = e1.category === 'esports' || e2.category === 'esports';
    if (isEsports) {
      if (e1.category !== e2.category) return false;
      return (
        cleanTitleForComparison(e1.title) === cleanTitleForComparison(e2.title) &&
        (e1.startDate || '').slice(0, 10) === (e2.startDate || '').slice(0, 10)
      );
    }

    const v1 = cleanVenueForMatching(e1.venueName);
    const v2 = cleanVenueForMatching(e2.venueName);
    const sameVenue = Boolean(v1 && v2 && (v1 === v2 || v1.includes(v2) || v2.includes(v1)));
    const sameDate = Boolean(e1.startDate && e2.startDate && e1.startDate.slice(0, 10) === e2.startDate.slice(0, 10));
    const datesMatch = sameDate || datesOverlapOrNearby(e1.startDate, e1.endDate, e2.startDate, e2.endDate);

    if (sameVenue && datesMatch) {
      if (cleanTitleForComparison(e1.title) === cleanTitleForComparison(e2.title)) return true;
      if (areTitlesSimilar(e1.title, e2.title, sameDate)) return true;

      const slug1 = extractSpecificSlug(e1.ticketUrl || e1.url);
      const slug2 = extractSpecificSlug(e2.ticketUrl || e2.url);
      if (slug1 && slug2) {
        if (slug1 === slug2 || slug1.includes(slug2) || slug2.includes(slug1)) return true;
        const stok1 = slug1.split('-').filter((w) => w.length >= 3 && !STOPWORDS.has(w));
        const stok2 = slug2.split('-').filter((w) => w.length >= 3 && !STOPWORDS.has(w));
        if (stok1.length && stok2.length && stok1.slice().sort().join(' ') === stok2.slice().sort().join(' ')) return true;
        const sCommon = stok1.filter((t) => stok2.includes(t));
        if (sCommon.length >= 2 && sCommon.length / Math.min(stok1.length, stok2.length) >= 0.6) return true;
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

    const sA = new Date(base.startDate).getTime();
    const sB = new Date(other.startDate).getTime();
    const minStart = !isNaN(sA) && !isNaN(sB) ? (sA <= sB ? base.startDate : other.startDate) : base.startDate;

    const eA = base.endDate ? new Date(base.endDate).getTime() : sA;
    const eB = other.endDate ? new Date(other.endDate).getTime() : sB;
    const maxEnd =
      !isNaN(eA) && !isNaN(eB)
        ? eA >= eB
          ? base.endDate || base.startDate
          : other.endDate || other.startDate
        : base.endDate || base.startDate;

    base.startDate = minStart;
    if (maxEnd && maxEnd !== minStart) {
      base.endDate = maxEnd;
    }

    const isGenericAgendaUrl = (u) =>
      !u ||
      u === '#' ||
      u.endsWith('/agenda') ||
      u.endsWith('/agenda/') ||
      /culturacabanyal\.com\/agenda\/?$/i.test(u);

    if (other.url && /culturacabanyal\.com\/agenda(?:\/\?lang=cas)?#event-/i.test(other.url)) {
      base.url = other.url;
      base.ticketUrl = other.ticketUrl || other.url;
      if (other.urlEs) base.urlEs = other.urlEs;
      if (other.urlVa) base.urlVa = other.urlVa;
      if (other.ticketUrlEs) base.ticketUrlEs = other.ticketUrlEs;
      if (other.ticketUrlVa) base.ticketUrlVa = other.ticketUrlVa;
    } else if (isGenericAgendaUrl(base.url) && other.url && !isGenericAgendaUrl(other.url)) {
      base.url = other.url;
    }

    if (other.ticketUrl && /culturacabanyal\.com\/agenda(?:\/\?lang=cas)?#event-/i.test(other.ticketUrl)) {
      base.ticketUrl = other.ticketUrl;
    } else if (isGenericAgendaUrl(base.ticketUrl) && other.ticketUrl && !isGenericAgendaUrl(other.ticketUrl)) {
      base.ticketUrl = other.ticketUrl || other.url;
    } else {
      if (!isDirectTicketingUrl(base.ticketUrl) && isDirectTicketingUrl(other.ticketUrl)) {
        base.ticketUrl = other.ticketUrl;
      }
      if (!isDirectTicketingUrl(base.url) && isDirectTicketingUrl(other.url)) {
        base.url = other.url;
      }
    }

    if (other.source === 'culturacabanyal' && base.source !== 'culturacabanyal') {
      base.source = other.source;
      base.id = other.id;
      base.category = other.category;
    }

    const isGenericImg = (img) =>
      !img ||
      Object.values(CULTURAL_FALLBACKS).includes(img) ||
      img.includes('fallback') ||
      img.includes('placeholder') ||
      img.includes('logos_salas') ||
      img.includes('_ph.png') ||
      img.includes('default');

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
    if (!base.urlEs && other.urlEs) base.urlEs = other.urlEs;
    if (!base.urlVa && other.urlVa) base.urlVa = other.urlVa;
    if (!base.ticketUrlEs && other.ticketUrlEs) base.ticketUrlEs = other.ticketUrlEs;
    if (!base.ticketUrlVa && other.ticketUrlVa) base.ticketUrlVa = other.ticketUrlVa;

    if (base.category === 'cine' || other.category === 'cine') {
      const mergedSessions = normalizeMovieSessionList([
        ...(base.sessions || []),
        ...(other.sessions || []),
      ]);
      base.sessions = mergedSessions;
      base.hasVOSE = Boolean(base.hasVOSE || other.hasVOSE || mergedSessions.some((s) => s.isVOSE));
      base.posterUrl = base.posterUrl || other.posterUrl || null;
      if (base.posterUrl) base.imageUrl = base.posterUrl;
      base.director = base.director || other.director || null;
      base.durationMinutes = base.durationMinutes || other.durationMinutes || null;
      base.ageRating = base.ageRating || other.ageRating || null;
      base.originalTitle = base.originalTitle || other.originalTitle || null;
      base.cycleName = base.cycleName || other.cycleName || null;
      base.synopsis =
        base.synopsis && base.synopsis.length >= (other.synopsis?.length || 0)
          ? base.synopsis
          : other.synopsis || base.synopsis || null;
      base.eventType =
        base.eventType === 'especial' || other.eventType === 'especial' ? 'especial' : 'cartelera';
    }

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
    if (cleanTitle.length < 4 || /^(event|evento|eventos|agenda|null|undefined)$/i.test(cleanTitle)) {
      return false;
    }
    if (isAbono(ev.title, ev.description)) return false;
    if (isSocialOrJunk(ev.title, ev.url || ev.ticketUrl)) return false;
    // Preserve official cinema pipeline events while filtering ungrouped movie posts from third-party cultural agendas
    if (ev.category !== 'cine' && isCinemaOrMovie(ev.title, ev.description, '', ev.category)) return false;
    return true;
  });

  const deduplicated = deduplicateAndMergeEvents(validEvents);
  const finalEvents = deduplicated.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  if (finalEvents.length === 0 && fs.existsSync(outPath)) {
    console.warn('Scraper collected 0 events; keeping previous events.json.');
    return;
  }

  fs.writeFileSync(outPath, JSON.stringify(finalEvents, null, 2), 'utf-8');
  console.log(`Saved ${finalEvents.length} consolidated events to public/events.json`);
}

if (process.argv.includes('--test-cinema')) {
  runCinemaSelfTests();
} else {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
