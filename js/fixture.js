/*
 * fixture.js — Datos de la fase de grupos del Mundial FIFA 2026
 * =============================================================
 * Fuente: sorteo final (5-dic-2025) + calendario oficial. Todos los repechajes
 * ya están resueltos (estamos en 2026). Datos cruzados de varias fuentes; si la
 * FIFA ajusta algún horario, editá SOLO el campo `kickoffUTC` del partido — la
 * lógica de la app no depende de nada más.
 *
 * IMPORTANTE sobre la hora:
 *   - `kickoffUTC` está SIEMPRE en UTC (ISO 8601, sufijo "Z").
 *   - Los horarios oficiales se publicaron en ET (hora del Este de EE.UU.).
 *     En junio rige EDT = UTC-4, por lo tanto:  UTC = ET + 4 horas.
 *   - En pantalla se muestran en hora de Argentina (UTC-3) automáticamente.
 *     (Argentina = ET + 1 hora; ej.: 15:00 ET = 16:00 en Argentina.)
 */

// Catálogo de selecciones: clave -> { name (ES), code (ISO alpha-2 para flagcdn) }
// Reino Unido usa subdivisiones soportadas por flagcdn: gb-eng, gb-sct, gb-wls.
const TEAMS = {
  mx: { name: 'México', code: 'mx' },
  kr: { name: 'Corea del Sur', code: 'kr' },
  za: { name: 'Sudáfrica', code: 'za' },
  cz: { name: 'Chequia', code: 'cz' },
  ca: { name: 'Canadá', code: 'ca' },
  ch: { name: 'Suiza', code: 'ch' },
  qa: { name: 'Qatar', code: 'qa' },
  ba: { name: 'Bosnia y Herzegovina', code: 'ba' },
  br: { name: 'Brasil', code: 'br' },
  ma: { name: 'Marruecos', code: 'ma' },
  sct: { name: 'Escocia', code: 'gb-sct' },
  ht: { name: 'Haití', code: 'ht' },
  us: { name: 'Estados Unidos', code: 'us' },
  au: { name: 'Australia', code: 'au' },
  py: { name: 'Paraguay', code: 'py' },
  tr: { name: 'Turquía', code: 'tr' },
  de: { name: 'Alemania', code: 'de' },
  ec: { name: 'Ecuador', code: 'ec' },
  ci: { name: 'Costa de Marfil', code: 'ci' },
  cw: { name: 'Curazao', code: 'cw' },
  nl: { name: 'Países Bajos', code: 'nl' },
  jp: { name: 'Japón', code: 'jp' },
  tn: { name: 'Túnez', code: 'tn' },
  se: { name: 'Suecia', code: 'se' },
  be: { name: 'Bélgica', code: 'be' },
  ir: { name: 'Irán', code: 'ir' },
  eg: { name: 'Egipto', code: 'eg' },
  nz: { name: 'Nueva Zelanda', code: 'nz' },
  es: { name: 'España', code: 'es' },
  uy: { name: 'Uruguay', code: 'uy' },
  sa: { name: 'Arabia Saudita', code: 'sa' },
  cv: { name: 'Cabo Verde', code: 'cv' },
  fr: { name: 'Francia', code: 'fr' },
  sn: { name: 'Senegal', code: 'sn' },
  no: { name: 'Noruega', code: 'no' },
  iq: { name: 'Irak', code: 'iq' },
  ar: { name: 'Argentina', code: 'ar' },
  at: { name: 'Austria', code: 'at' },
  dz: { name: 'Argelia', code: 'dz' },
  jo: { name: 'Jordania', code: 'jo' },
  pt: { name: 'Portugal', code: 'pt' },
  co: { name: 'Colombia', code: 'co' },
  uz: { name: 'Uzbekistán', code: 'uz' },
  cd: { name: 'RD Congo', code: 'cd' },
  eng: { name: 'Inglaterra', code: 'gb-eng' },
  hr: { name: 'Croacia', code: 'hr' },
  gh: { name: 'Ghana', code: 'gh' },
  pa: { name: 'Panamá', code: 'pa' },
};

// Composición de los 12 grupos (orden de siembra 1-4 según los bombos del sorteo).
const GROUPS = {
  A: ['mx', 'kr', 'za', 'cz'],
  B: ['ca', 'ch', 'qa', 'ba'],
  C: ['br', 'ma', 'sct', 'ht'],
  D: ['us', 'au', 'py', 'tr'],
  E: ['de', 'ec', 'ci', 'cw'],
  F: ['nl', 'jp', 'tn', 'se'],
  G: ['be', 'ir', 'eg', 'nz'],
  H: ['es', 'uy', 'sa', 'cv'],
  I: ['fr', 'sn', 'no', 'iq'],
  J: ['ar', 'at', 'dz', 'jo'],
  K: ['pt', 'co', 'uz', 'cd'],
  L: ['eng', 'hr', 'gh', 'pa'],
};

/*
 * Los 72 partidos de la fase de grupos.
 * id: identificador estable (NO cambiar: es la clave de predicciones y resultados).
 * home/away: claves de TEAMS.  kickoffUTC: instante de inicio en UTC.
 */
const MATCHES = [
  // ---------- Grupo A ----------
  { id: 'A1', group: 'A', kickoffUTC: '2026-06-11T19:00:00Z', city: 'Ciudad de México', stadium: 'Estadio Azteca', home: 'mx', away: 'za' },
  { id: 'A2', group: 'A', kickoffUTC: '2026-06-12T02:00:00Z', city: 'Guadalajara', stadium: 'Estadio Akron', home: 'kr', away: 'cz' },
  { id: 'A3', group: 'A', kickoffUTC: '2026-06-18T16:00:00Z', city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', home: 'cz', away: 'za' },
  { id: 'A4', group: 'A', kickoffUTC: '2026-06-19T01:00:00Z', city: 'Guadalajara', stadium: 'Estadio Akron', home: 'mx', away: 'kr' },
  { id: 'A5', group: 'A', kickoffUTC: '2026-06-25T01:00:00Z', city: 'Ciudad de México', stadium: 'Estadio Azteca', home: 'cz', away: 'mx' },
  { id: 'A6', group: 'A', kickoffUTC: '2026-06-25T01:00:00Z', city: 'Monterrey', stadium: 'Estadio BBVA', home: 'za', away: 'kr' },

  // ---------- Grupo B ----------
  { id: 'B1', group: 'B', kickoffUTC: '2026-06-12T19:00:00Z', city: 'Toronto', stadium: 'BMO Field', home: 'ca', away: 'ba' },
  { id: 'B2', group: 'B', kickoffUTC: '2026-06-13T19:00:00Z', city: 'Santa Clara', stadium: "Levi's Stadium", home: 'qa', away: 'ch' },
  { id: 'B3', group: 'B', kickoffUTC: '2026-06-18T19:00:00Z', city: 'Inglewood', stadium: 'SoFi Stadium', home: 'ch', away: 'ba' },
  { id: 'B4', group: 'B', kickoffUTC: '2026-06-18T22:00:00Z', city: 'Vancouver', stadium: 'BC Place', home: 'ca', away: 'qa' },
  { id: 'B5', group: 'B', kickoffUTC: '2026-06-24T19:00:00Z', city: 'Vancouver', stadium: 'BC Place', home: 'ch', away: 'ca' },
  { id: 'B6', group: 'B', kickoffUTC: '2026-06-24T19:00:00Z', city: 'Seattle', stadium: 'Lumen Field', home: 'ba', away: 'qa' },

  // ---------- Grupo C ----------
  { id: 'C1', group: 'C', kickoffUTC: '2026-06-13T22:00:00Z', city: 'East Rutherford', stadium: 'MetLife Stadium', home: 'br', away: 'ma' },
  { id: 'C2', group: 'C', kickoffUTC: '2026-06-14T01:00:00Z', city: 'Foxborough', stadium: 'Gillette Stadium', home: 'ht', away: 'sct' },
  { id: 'C3', group: 'C', kickoffUTC: '2026-06-19T22:00:00Z', city: 'Foxborough', stadium: 'Gillette Stadium', home: 'sct', away: 'ma' },
  { id: 'C4', group: 'C', kickoffUTC: '2026-06-20T00:30:00Z', city: 'Filadelfia', stadium: 'Lincoln Financial Field', home: 'br', away: 'ht' },
  { id: 'C5', group: 'C', kickoffUTC: '2026-06-24T22:00:00Z', city: 'Miami', stadium: 'Hard Rock Stadium', home: 'sct', away: 'br' },
  { id: 'C6', group: 'C', kickoffUTC: '2026-06-24T22:00:00Z', city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', home: 'ma', away: 'ht' },

  // ---------- Grupo D ----------
  { id: 'D1', group: 'D', kickoffUTC: '2026-06-13T01:00:00Z', city: 'Inglewood', stadium: 'SoFi Stadium', home: 'us', away: 'py' },
  { id: 'D2', group: 'D', kickoffUTC: '2026-06-13T04:00:00Z', city: 'Vancouver', stadium: 'BC Place', home: 'au', away: 'tr' },
  { id: 'D3', group: 'D', kickoffUTC: '2026-06-19T19:00:00Z', city: 'Seattle', stadium: 'Lumen Field', home: 'us', away: 'au' },
  { id: 'D4', group: 'D', kickoffUTC: '2026-06-20T03:00:00Z', city: 'Santa Clara', stadium: "Levi's Stadium", home: 'tr', away: 'py' },
  { id: 'D5', group: 'D', kickoffUTC: '2026-06-26T02:00:00Z', city: 'Inglewood', stadium: 'SoFi Stadium', home: 'tr', away: 'us' },
  { id: 'D6', group: 'D', kickoffUTC: '2026-06-26T02:00:00Z', city: 'Santa Clara', stadium: "Levi's Stadium", home: 'py', away: 'au' },

  // ---------- Grupo E ----------
  { id: 'E1', group: 'E', kickoffUTC: '2026-06-14T17:00:00Z', city: 'Houston', stadium: 'NRG Stadium', home: 'de', away: 'cw' },
  { id: 'E2', group: 'E', kickoffUTC: '2026-06-14T23:00:00Z', city: 'Filadelfia', stadium: 'Lincoln Financial Field', home: 'ci', away: 'ec' },
  { id: 'E3', group: 'E', kickoffUTC: '2026-06-20T20:00:00Z', city: 'Toronto', stadium: 'BMO Field', home: 'de', away: 'ci' },
  { id: 'E4', group: 'E', kickoffUTC: '2026-06-21T00:00:00Z', city: 'Kansas City', stadium: 'Arrowhead Stadium', home: 'ec', away: 'cw' },
  { id: 'E5', group: 'E', kickoffUTC: '2026-06-25T20:00:00Z', city: 'Filadelfia', stadium: 'Lincoln Financial Field', home: 'cw', away: 'ci' },
  { id: 'E6', group: 'E', kickoffUTC: '2026-06-25T20:00:00Z', city: 'East Rutherford', stadium: 'MetLife Stadium', home: 'ec', away: 'de' },

  // ---------- Grupo F ----------
  { id: 'F1', group: 'F', kickoffUTC: '2026-06-14T20:00:00Z', city: 'Arlington', stadium: 'AT&T Stadium', home: 'nl', away: 'jp' },
  { id: 'F2', group: 'F', kickoffUTC: '2026-06-15T02:00:00Z', city: 'Monterrey', stadium: 'Estadio BBVA', home: 'se', away: 'tn' },
  { id: 'F3', group: 'F', kickoffUTC: '2026-06-20T17:00:00Z', city: 'Houston', stadium: 'NRG Stadium', home: 'nl', away: 'se' },
  { id: 'F4', group: 'F', kickoffUTC: '2026-06-20T04:00:00Z', city: 'Monterrey', stadium: 'Estadio BBVA', home: 'tn', away: 'jp' },
  { id: 'F5', group: 'F', kickoffUTC: '2026-06-25T23:00:00Z', city: 'Arlington', stadium: 'AT&T Stadium', home: 'jp', away: 'se' },
  { id: 'F6', group: 'F', kickoffUTC: '2026-06-25T23:00:00Z', city: 'Kansas City', stadium: 'Arrowhead Stadium', home: 'tn', away: 'nl' },

  // ---------- Grupo G ----------
  { id: 'G1', group: 'G', kickoffUTC: '2026-06-15T19:00:00Z', city: 'Seattle', stadium: 'Lumen Field', home: 'be', away: 'eg' },
  { id: 'G2', group: 'G', kickoffUTC: '2026-06-16T01:00:00Z', city: 'Inglewood', stadium: 'SoFi Stadium', home: 'ir', away: 'nz' },
  { id: 'G3', group: 'G', kickoffUTC: '2026-06-21T19:00:00Z', city: 'Inglewood', stadium: 'SoFi Stadium', home: 'be', away: 'ir' },
  { id: 'G4', group: 'G', kickoffUTC: '2026-06-22T01:00:00Z', city: 'Vancouver', stadium: 'BC Place', home: 'nz', away: 'eg' },
  { id: 'G5', group: 'G', kickoffUTC: '2026-06-27T03:00:00Z', city: 'Seattle', stadium: 'Lumen Field', home: 'eg', away: 'ir' },
  { id: 'G6', group: 'G', kickoffUTC: '2026-06-27T03:00:00Z', city: 'Vancouver', stadium: 'BC Place', home: 'nz', away: 'be' },

  // ---------- Grupo H ----------
  { id: 'H1', group: 'H', kickoffUTC: '2026-06-15T16:00:00Z', city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', home: 'es', away: 'cv' },
  { id: 'H2', group: 'H', kickoffUTC: '2026-06-15T22:00:00Z', city: 'Miami', stadium: 'Hard Rock Stadium', home: 'sa', away: 'uy' },
  { id: 'H3', group: 'H', kickoffUTC: '2026-06-21T16:00:00Z', city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', home: 'es', away: 'sa' },
  { id: 'H4', group: 'H', kickoffUTC: '2026-06-21T22:00:00Z', city: 'Miami', stadium: 'Hard Rock Stadium', home: 'uy', away: 'cv' },
  { id: 'H5', group: 'H', kickoffUTC: '2026-06-27T00:00:00Z', city: 'Houston', stadium: 'NRG Stadium', home: 'cv', away: 'sa' },
  { id: 'H6', group: 'H', kickoffUTC: '2026-06-27T00:00:00Z', city: 'Guadalajara', stadium: 'Estadio Akron', home: 'uy', away: 'es' },

  // ---------- Grupo I ----------
  { id: 'I1', group: 'I', kickoffUTC: '2026-06-16T19:00:00Z', city: 'East Rutherford', stadium: 'MetLife Stadium', home: 'fr', away: 'sn' },
  { id: 'I2', group: 'I', kickoffUTC: '2026-06-16T22:00:00Z', city: 'Foxborough', stadium: 'Gillette Stadium', home: 'iq', away: 'no' },
  { id: 'I3', group: 'I', kickoffUTC: '2026-06-22T21:00:00Z', city: 'Filadelfia', stadium: 'Lincoln Financial Field', home: 'fr', away: 'iq' },
  { id: 'I4', group: 'I', kickoffUTC: '2026-06-23T00:00:00Z', city: 'East Rutherford', stadium: 'MetLife Stadium', home: 'no', away: 'sn' },
  { id: 'I5', group: 'I', kickoffUTC: '2026-06-26T19:00:00Z', city: 'Foxborough', stadium: 'Gillette Stadium', home: 'no', away: 'fr' },
  { id: 'I6', group: 'I', kickoffUTC: '2026-06-26T19:00:00Z', city: 'Toronto', stadium: 'BMO Field', home: 'sn', away: 'iq' },

  // ---------- Grupo J ----------
  { id: 'J1', group: 'J', kickoffUTC: '2026-06-17T01:00:00Z', city: 'Kansas City', stadium: 'Arrowhead Stadium', home: 'ar', away: 'dz' },
  { id: 'J2', group: 'J', kickoffUTC: '2026-06-17T04:00:00Z', city: 'Santa Clara', stadium: "Levi's Stadium", home: 'at', away: 'jo' },
  { id: 'J3', group: 'J', kickoffUTC: '2026-06-22T17:00:00Z', city: 'Arlington', stadium: 'AT&T Stadium', home: 'ar', away: 'at' },
  { id: 'J4', group: 'J', kickoffUTC: '2026-06-23T03:00:00Z', city: 'Santa Clara', stadium: "Levi's Stadium", home: 'jo', away: 'dz' },
  { id: 'J5', group: 'J', kickoffUTC: '2026-06-28T02:00:00Z', city: 'Arlington', stadium: 'AT&T Stadium', home: 'jo', away: 'ar' },
  { id: 'J6', group: 'J', kickoffUTC: '2026-06-28T02:00:00Z', city: 'Kansas City', stadium: 'Arrowhead Stadium', home: 'dz', away: 'at' },

  // ---------- Grupo K ----------
  { id: 'K1', group: 'K', kickoffUTC: '2026-06-17T17:00:00Z', city: 'Houston', stadium: 'NRG Stadium', home: 'pt', away: 'cd' },
  { id: 'K2', group: 'K', kickoffUTC: '2026-06-18T02:00:00Z', city: 'Ciudad de México', stadium: 'Estadio Azteca', home: 'uz', away: 'co' },
  { id: 'K3', group: 'K', kickoffUTC: '2026-06-23T17:00:00Z', city: 'Houston', stadium: 'NRG Stadium', home: 'pt', away: 'uz' },
  { id: 'K4', group: 'K', kickoffUTC: '2026-06-24T02:00:00Z', city: 'Guadalajara', stadium: 'Estadio Akron', home: 'co', away: 'cd' },
  { id: 'K5', group: 'K', kickoffUTC: '2026-06-27T23:30:00Z', city: 'Miami', stadium: 'Hard Rock Stadium', home: 'co', away: 'pt' },
  { id: 'K6', group: 'K', kickoffUTC: '2026-06-27T23:30:00Z', city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', home: 'cd', away: 'uz' },

  // ---------- Grupo L ----------
  { id: 'L1', group: 'L', kickoffUTC: '2026-06-17T20:00:00Z', city: 'Arlington', stadium: 'AT&T Stadium', home: 'eng', away: 'hr' },
  { id: 'L2', group: 'L', kickoffUTC: '2026-06-17T23:00:00Z', city: 'Toronto', stadium: 'BMO Field', home: 'gh', away: 'pa' },
  { id: 'L3', group: 'L', kickoffUTC: '2026-06-23T20:00:00Z', city: 'Foxborough', stadium: 'Gillette Stadium', home: 'eng', away: 'gh' },
  { id: 'L4', group: 'L', kickoffUTC: '2026-06-23T23:00:00Z', city: 'Toronto', stadium: 'BMO Field', home: 'pa', away: 'hr' },
  { id: 'L5', group: 'L', kickoffUTC: '2026-06-27T21:00:00Z', city: 'East Rutherford', stadium: 'MetLife Stadium', home: 'pa', away: 'eng' },
  { id: 'L6', group: 'L', kickoffUTC: '2026-06-27T21:00:00Z', city: 'Filadelfia', stadium: 'Lincoln Financial Field', home: 'hr', away: 'gh' },
];

// URL absoluta de bandera en alta calidad desde flagcdn.com (sin rutas locales).
function flagUrl(teamKey, width = 320) {
  const team = TEAMS[teamKey];
  return `https://flagcdn.com/w${width}/${team.code}.png`;
}

// Exponer al resto de la app (no se usan módulos ES para mantener el deploy estático simple).
window.PRODE_DATA = { TEAMS, GROUPS, MATCHES, flagUrl };
