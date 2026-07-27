/*
 * scripts/sync-results-hub.mjs — Sincronizador de resultados (HUB multi-liga)
 * ===========================================================================
 * Igual que sync-results.mjs, pero para el Supabase COMPARTIDO donde viven
 * TODAS las ligas self-service (una fila por liga en la tabla `leagues`).
 *
 * Hace UNA sola consulta a football-data.org y luego, para CADA liga del hub,
 * upsertea los resultados en match_results con su league_id. Así, en cuanto se
 * crea una liga nueva, queda automáticamente cubierta por el robot.
 *
 * Se ejecuta cada hora vía .github/workflows/sync-hub.yml.
 *
 * Variables de entorno requeridas (Secrets en GitHub):
 *   FOOTBALL_DATA_API_KEY   — clave de https://www.football-data.org
 *   SUPABASE_URL_HUB        — URL del Supabase compartido (hub)
 *   SUPABASE_ANON_KEY_HUB   — anon key del hub
 *
 * No requiere instalar paquetes: usa fetch nativo de Node 18+.
 */

import { fetchFinishedResults } from './wc-results.mjs';

async function main() {
  const FOOTBALL_KEY = process.env.FOOTBALL_DATA_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL_HUB;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY_HUB;

  if (!FOOTBALL_KEY) {
    console.error('Falta la variable de entorno FOOTBALL_DATA_API_KEY');
    process.exit(1);
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Faltan las variables SUPABASE_URL_HUB / SUPABASE_ANON_KEY_HUB');
    process.exit(1);
  }

  const sbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  // 1. Resultados finalizados del Mundial (una sola llamada a la API).
  const { results, skipped } = await fetchFinishedResults(FOOTBALL_KEY);

  // 2. Todas las ligas del hub.
  const leaguesRes = await fetch(`${SUPABASE_URL}/rest/v1/leagues?select=id,code`, { headers: sbHeaders });
  if (!leaguesRes.ok) {
    const errText = await leaguesRes.text();
    console.error(`Error al listar ligas del hub: ${errText}`);
    process.exit(1);
  }
  const leagues = await leaguesRes.json();

  if (!leagues.length || !results.length) {
    console.log(JSON.stringify({
      ok: true, leagues: leagues.length, finished: results.length, upserted: 0, skipped,
      timestamp: new Date().toISOString(),
    }, null, 2));
    return;
  }

  // 3. Un upsert masivo: cada resultado replicado por cada liga (con su league_id).
  const now = new Date().toISOString();
  const toUpsert = [];
  for (const lg of leagues) {
    for (const r of results) {
      toUpsert.push({ league_id: lg.id, match_id: r.match_id, home_goals: r.home_goals, away_goals: r.away_goals, updated_at: now });
    }
  }

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/match_results`, {
    method: 'POST',
    headers: {
      ...sbHeaders,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(toUpsert),
  });
  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    console.error(`Error al guardar en Supabase (hub): ${errText}`);
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    leagues: leagues.length,
    finished: results.length,
    upserted: toUpsert.length,
    skipped,
    timestamp: now,
  }, null, 2));
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
