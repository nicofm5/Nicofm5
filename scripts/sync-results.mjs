/*
 * scripts/sync-results.mjs — Sincronizador de resultados (ligas FIJAS)
 * =====================================================================
 * Obtiene resultados finalizados del Mundial 2026 desde football-data.org y los
 * guarda en la tabla match_results de UN Supabase (una liga fija).
 *
 * Se ejecuta automáticamente cada hora vía GitHub Actions
 * (ver .github/workflows/sync-results.yml y sync-productos-pozo.yml).
 *
 * Para las ligas self-service (hub), usá scripts/sync-results-hub.mjs.
 *
 * Variables de entorno requeridas (Secrets en GitHub):
 *   FOOTBALL_DATA_API_KEY  — clave gratuita de https://www.football-data.org
 *   SUPABASE_URL           — URL del proyecto Supabase
 *   SUPABASE_ANON_KEY      — clave anon/public del proyecto Supabase
 *
 * No requiere instalar paquetes: usa fetch nativo de Node 18+.
 */

import { fetchFinishedResults } from './wc-results.mjs';

async function main() {
  const FOOTBALL_KEY = process.env.FOOTBALL_DATA_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!FOOTBALL_KEY) {
    console.error('Falta la variable de entorno FOOTBALL_DATA_API_KEY');
    process.exit(1);
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Faltan las variables SUPABASE_URL / SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const { results, skipped } = await fetchFinishedResults(FOOTBALL_KEY);
  const now = new Date().toISOString();
  const toUpsert = results.map((r) => ({ ...r, updated_at: now }));

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
      console.error(`Error al guardar en Supabase: ${errText}`);
      process.exit(1);
    }
  }

  console.log(JSON.stringify({
    ok: true,
    synced: toUpsert.length,
    match_ids: toUpsert.map((r) => r.match_id),
    skipped,
    timestamp: now,
  }, null, 2));
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
