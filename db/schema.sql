-- =============================================================================
-- PRODE Mundial 2026 — Esquema de base de datos para Supabase
-- =============================================================================
-- Cómo usarlo:
--   1. Entrá a tu proyecto en https://supabase.com
--   2. Menú "SQL Editor" -> "New query"
--   3. Pegá TODO este archivo y dale "Run".
--   4. Copiá la URL del proyecto y la clave "anon public" (Settings -> API)
--      y pegalas en js/config.js.
--
-- Nota de seguridad (app casual, identidad por nombre):
--   Las políticas permiten lectura/escritura al rol anónimo porque no usamos
--   login real. La protección del panel admin y de "no re-editar tras confirmar"
--   se refuerza en el cliente y, para las jugadas, también con un trigger acá.
-- =============================================================================

-- ---------- Tabla de jugadores ----------------------------------------------
create table if not exists public.players (
  id                uuid primary key default gen_random_uuid(),
  player_key        text unique not null,          -- "nombre apellido" normalizado
  first_name        text not null,
  last_name         text not null,
  payment_reference text,                           -- nº comprobante / alias
  payment_validated boolean not null default false, -- lo marca el administrador
  predictions       jsonb not null default '{}'::jsonb, -- { "A1": {"h":2,"a":1}, ... }
  confirmed         boolean not null default false,
  confirmed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------- Tabla de resultados oficiales (los carga el admin) ---------------
create table if not exists public.match_results (
  match_id   text primary key,    -- coincide con el id del fixture, ej. 'A1'
  home_goals int not null,
  away_goals int not null,
  updated_at timestamptz not null default now()
);

-- ---------- Hora del servidor (para bloqueo horario uniforme) ----------------
create or replace function public.server_now()
returns timestamptz
language sql stable
as $$ select now() $$;

-- ---------- Trigger: mantener updated_at -------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Trigger: pronósticos inmutables por partido ----------------------
-- Cada pronóstico guardado NO se puede cambiar; solo se pueden AGREGAR partidos
-- nuevos. Se logra mezclando jsonb con el operador ||, dando precedencia a los
-- valores viejos (old gana en las claves que ya existían). El nombre tampoco se
-- puede cambiar una vez creado. payment_validated (admin) sí se puede actualizar.
create or replace function public.protect_predictions()
returns trigger language plpgsql as $$
begin
  new.predictions := new.predictions || old.predictions;
  new.first_name  := old.first_name;
  new.last_name   := old.last_name;
  return new;
end $$;

drop trigger if exists trg_players_updated_at on public.players;
create trigger trg_players_updated_at before update on public.players
  for each row execute function public.set_updated_at();

drop trigger if exists trg_players_protect on public.players;
create trigger trg_players_protect before update on public.players
  for each row execute function public.protect_predictions();

drop trigger if exists trg_results_updated_at on public.match_results;
create trigger trg_results_updated_at before update on public.match_results
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------------------------------------------
alter table public.players       enable row level security;
alter table public.match_results enable row level security;

-- players: lectura, alta y edición abiertas al rol anónimo
--          (el trigger protege las jugadas confirmadas).
drop policy if exists players_select on public.players;
create policy players_select on public.players for select using (true);

drop policy if exists players_insert on public.players;
create policy players_insert on public.players for insert with check (true);

drop policy if exists players_update on public.players;
create policy players_update on public.players for update using (true) with check (true);

-- match_results: lectura pública; escritura abierta (la app la protege con
-- ADMIN_PASSWORD del lado cliente).
drop policy if exists results_select on public.match_results;
create policy results_select on public.match_results for select using (true);

drop policy if exists results_write on public.match_results;
create policy results_write on public.match_results for all using (true) with check (true);
