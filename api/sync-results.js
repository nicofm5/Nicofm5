/*
 * api/sync-results.js — Vercel serverless function
 * =================================================
 * Obtiene resultados finalizados del Mundial 2026 desde football-data.org
 * y los sincroniza en la tabla match_results de Supabase.
 *
 * Variables de entorno requeridas en Vercel:
 *   FOOTBALL_DATA_API_KEY  — clave gratuita de https://www.football-data.org/client/register
 *   SUPABASE_URL           — URL del proyecto Supabase (ej. https://xxx.supabase.co)
 *   SUPABASE_ANON_KEY      — clave anon/public del proyecto Supabase
 *
 * El cron en vercel.json llama a este endpoint cada hora durante el torneo.
 * También se puede disparar manualmente desde el panel admin de la app.
 */

// Mapeo: nombre del equipo en football-data.org → clave interna del fixture
const TEAM_MAP = {
  'Mexico': 'mx',
  'South Korea': 'kr',
  'Korea Republic': 'kr',
  'South Africa': 'za',
  'Czech Republic': 'cz',
  'Czechia': 'cz',
  'Canada': 'ca',
  'Switzerland': 'ch',
  'Qatar': 'qa',
  'Bosnia-Herzegovina': 'ba',
  'Bosnia and Herzegovina': 'ba',
  'Brazil': 'br',
  'Morocco': 'ma',
  'Scotland': 'sct',
  'Haiti': 'ht',
  'USA': 'us',
  'United States': 'us',
  'Australia': 'au',
  'Paraguay': 'py',
  'Turkey': 'tr',
  'Türkiye': 'tr',
  'Germany': 'de',
  'Ecuador': 'ec',
  'Ivory Coast': 'ci',
  "Côte d'Ivoire": 'ci',
  'Cote d\'Ivoire': 'ci',
  'Curaçao': 'cw',
  'Curacao': 'cw',
  'Netherlands': 'nl',
  'Japan': 'jp',
  'Tunisia': 'tn',
  'Sweden': 'se',
  'Belgium': 'be',
  'Iran': 'ir',
  'IR Iran': 'ir',
  'Egypt': 'eg',
  'New Zealand': 'nz',
  'Spain': 'es',
  'Uruguay': 'uy',
  'Saudi Arabia': 'sa',
  'Cape Verde': 'cv',
  'France': 'fr',
  'Senegal': 'sn',
  'Norway': 'no',
  'Iraq': 'iq',
  'Argentina': 'ar',
  'Austria': 'at',
  'Algeria': 'dz',
  'Jordan': 'jo',
  'Portugal': 'pt',
  'Colombia': 'co',
  'Uzbekistan': 'uz',
  'DR Congo': 'cd',
  'Congo DR': 'cd',
  'Democratic Republic of Congo': 'cd',
  'England': 'eng',
  'Croatia': 'hr',
  'Ghana': 'gh',
  'Panama': 'pa',
};

// Fixture compacto (solo los datos necesarios para el mapeo)
const MATCHES = [
  { id: 'A1', home: 'mx', away: 'za' },
  { id: 'A2', home: 'kr', away: 'cz' },
  { id: 'A3', home: 'cz', away: 'za' },
  { id: 'A4', home: 'mx', away: 'kr' },
  { id: 'A5', home: 'cz', away: 'mx' },
  { id: 'A6', home: 'za', away: 'kr' },
  { id: 'B1', home: 'ca', away: 'ba' },
  { id: 'B2', home: 'qa', away: 'ch' },
  { id: 'B3', home: 'ch', away: 'ba' },
  { id: 'B4', home: 'ca', away: 'qa' },
  { id: 'B5', home: 'ch', away: 'ca' },
  { id: 'B6', home: 'ba', away: 'qa' },
  { id: 'C1', home: 'br', away: 'ma' },
  { id: 'C2', home: 'ht', away: 'sct' },
  { id: 'C3', home: 'sct', away: 'ma' },
  { id: 'C4', home: 'br', away: 'ht' },
  { id: 'C5', home: 'sct', away: 'br' },
  { id: 'C6', home: 'ma', away: 'ht' },
  { id: 'D1', home: 'us', away: 'py' },
  { id: 'D2', home: 'au', away: 'tr' },
  { id: 'D3', home: 'us', away: 'au' },
  { id: 'D4', home: 'tr', away: 'py' },
  { id: 'D5', home: 'tr', away: 'us' },
  { id: 'D6', home: 'py', away: 'au' },
  { id: 'E1', home: 'de', away: 'cw' },
  { id: 'E2', home: 'ci', away: 'ec' },
  { id: 'E3', home: 'de', away: 'ci' },
  { id: 'E4', home: 'ec', away: 'cw' },
  { id: 'E5', home: 'cw', away: 'ci' },
  { id: 'E6', home: 'ec', away: 'de' },
  { id: 'F1', home: 'nl', away: 'jp' },
  { id: 'F2', home: 'se', away: 'tn' },
  { id: 'F3', home: 'nl', away: 'se' },
  { id: 'F4', home: 'tn', away: 'jp' },
  { id: 'F5', home: 'jp', away: 'se' },
  { id: 'F6', home: 'tn', away: 'nl' },
  { id: 'G1', home: 'be', away: 'eg' },
  { id: 'G2', home: 'ir', away: 'nz' },
  { id: 'G3', home: 'be', away: 'ir' },
  { id: 'G4', home: 'nz', away: 'eg' },
  { id: 'G5', home: 'eg', away: 'ir' },
  { id: 'G6', home: 'nz', away: 'be' },
  { id: 'H1', home: 'es', away: 'cv' },
  { id: 'H2', home: 'sa', away: 'uy' },
  { id: 'H3', home: 'es', away: 'sa' },
  { id: 'H4', home: 'uy', away: 'cv' },
  { id: 'H5', home: 'cv', away: 'sa' },
  { id: 'H6', home: 'uy', away: 'es' },
  { id: 'I1', home: 'fr', away: 'sn' },
  { id: 'I2', home: 'iq', away: 'no' },
  { id: 'I3', home: 'fr', away: 'iq' },
  { id: 'I4', home: 'no', away: 'sn' },
  { id: 'I5', home: 'no', away: 'fr' },
  { id: 'I6', home: 'sn', away: 'iq' },
  { id: 'J1', home: 'ar', away: 'dz' },
  { id: 'J2', home: 'at', away: 'jo' },
  { id: 'J3', home: 'ar', away: 'at' },
  { id: 'J4', home: 'jo', away: 'dz' },
  { id: 'J5', home: 'jo', away: 'ar' },
  { id: 'J6', home: 'dz', away: 'at' },
  { id: 'K1', home: 'pt', away: 'cd' },
  { id: 'K2', home: 'uz', away: 'co' },
  { id: 'K3', home: 'pt', away: 'uz' },
  { id: 'K4', home: 'co', away: 'cd' },
  { id: 'K5', home: 'co', away: 'pt' },
  { id: 'K6', home: 'cd', away: 'uz' },
  { id: 'L1', home: 'eng', away: 'hr' },
  { id: 'L2', home: 'gh', away: 'pa' },
  { id: 'L3', home: 'eng', away: 'gh' },
  { id: 'L4', home: 'pa', away: 'hr' },
  { id: 'L5', home: 'pa', away: 'eng' },
  { id: 'L6', home: 'hr', away: 'gh' },
];

function findMatchId(homeKey, awayKey) {
  const m = MATCHES.find((x) => x.home === homeKey && x.away === awayKey);
  return m ? m.id : null;
}

function resolveTeam(name, shortName, tla) {
  return TEAM_MAP[name] || TEAM_MAP[shortName] || TEAM_MAP[tla] || null;
}

export default async function handler(req, res) {
  // Solo GET y POST (el cron de Vercel usa GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const FOOTBALL_KEY = process.env.FOOTBALL_DATA_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!FOOTBALL_KEY) {
    return res.status(500).json({ error: 'Falta la variable de entorno FOOTBALL_DATA_API_KEY' });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Faltan las variables de entorno SUPABASE_URL / SUPABASE_ANON_KEY' });
  }

  // 1. Obtener partidos finalizados del Mundial 2026
  let apiData;
  try {
    const apiRes = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
      { headers: { 'X-Auth-Token': FOOTBALL_KEY } }
    );
    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(502).json({ error: `football-data.org respondió ${apiRes.status}`, detail: text });
    }
    apiData = await apiRes.json();
  } catch (err) {
    return res.status(502).json({ error: 'No se pudo conectar con football-data.org', detail: err.message });
  }

  const finishedMatches = apiData.matches || [];

  // 2. Mapear a nuestros IDs y armar los registros a upsertear
  const toUpsert = [];
  const skipped = [];

  for (const match of finishedMatches) {
    const homeGoals = match.score?.fullTime?.home;
    const awayGoals = match.score?.fullTime?.away;
    if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) continue;

    const homeKey = resolveTeam(match.homeTeam?.name, match.homeTeam?.shortName, match.homeTeam?.tla);
    const awayKey = resolveTeam(match.awayTeam?.name, match.awayTeam?.shortName, match.awayTeam?.tla);

    if (!homeKey || !awayKey) {
      skipped.push({ home: match.homeTeam?.name, away: match.awayTeam?.name, reason: 'equipo no mapeado' });
      continue;
    }

    const matchId = findMatchId(homeKey, awayKey);
    if (!matchId) {
      skipped.push({ home: match.homeTeam?.name, away: match.awayTeam?.name, reason: 'partido no encontrado en fixture' });
      continue;
    }

    toUpsert.push({
      match_id: matchId,
      home_goals: homeGoals,
      away_goals: awayGoals,
      updated_at: new Date().toISOString(),
    });
  }

  // 3. Upsertear en Supabase (REST API directa, sin SDK)
  if (toUpsert.length > 0) {
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/match_results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(toUpsert),
    });

    if (!upsertRes.ok) {
      const errText = await upsertRes.text();
      return res.status(502).json({ error: 'Error al guardar en Supabase', detail: errText });
    }
  }

  return res.status(200).json({
    ok: true,
    synced: toUpsert.length,
    match_ids: toUpsert.map((r) => r.match_id),
    skipped,
    timestamp: new Date().toISOString(),
  });
}
