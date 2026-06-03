-- =============================================================================
-- MIGRACIÓN: convertir el proyecto "Vamos Argentina" en el HUB de ligas
-- =============================================================================
-- Reutiliza el proyecto Supabase de Vamos Argentina como base COMPARTIDA: pasa
-- a hospedar su propia liga + todas las ligas que cree la gente. Así no hace
-- falta un 3er proyecto ni pausar nada.
--
-- ⚠️ REQUISITO: este proyecto NO debe tener datos reales todavía (esta
--    migración BORRA las tablas players/match_results para recrearlas con
--    league_id). Si ya hubiera jugadores/resultados, NO la corras: avisame y
--    te paso una versión que conserve los datos con backfill.
--
-- ORDEN DE EJECUCIÓN en el SQL Editor de ESTE proyecto (3 corridas):
--   PASO 1 → corré el bloque "PASO 1" de abajo (borra las tablas viejas).
--   PASO 2 → corré TODO el archivo db/schema-hub.sql (¡editá antes la clave
--            v_key dentro de create_league!).
--   PASO 3 → corré el bloque "PASO 3" de abajo (crea la fila de Vamos Argentina).
-- =============================================================================

-- ----------------------------- PASO 1 ----------------------------------------
-- Borrar las tablas viejas (no hay datos que perder). El esquema viejo no tenía
-- league_id, por eso hay que recrearlas con schema-hub.sql.
drop table if exists public.match_results cascade;
drop table if exists public.players cascade;


-- =============================================================================
-- (PASO 2: ahora corré db/schema-hub.sql en este mismo proyecto y volvé acá)
-- =============================================================================


-- ----------------------------- PASO 3 ----------------------------------------
-- Crear la liga "Vamos Argentina" como una fila del hub, con un id FIJO. Ese id
-- es el que la app ya tiene configurado en js/leagues.js (campo leagueId), para
-- que el dominio de Vamos Argentina siga mostrando SU liga.
insert into public.leagues (id, code, name, subtitle, logo_url, admin_pass, colors)
values (
  '11111111-1111-1111-1111-111111111111',
  'VAMOSAR',
  'Mundial 2026 Prode · Vamos Argentina',
  'Fase de grupos · Canadá · México · Estados Unidos',
  'assets/logo26.png',
  'Laacademia555',
  '{"--celeste":"#75ace4","--celeste-2":"#3f86c9","--gold":"#e7b94e","--gold-2":"#c8922a","--navy":"#0a2a55"}'::jsonb
)
on conflict (id) do nothing;
