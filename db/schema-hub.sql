-- =============================================================================
-- PRODE Mundial 2026 — Esquema del "HUB" de ligas self-service
-- =============================================================================
-- Este esquema es para UN proyecto Supabase NUEVO y COMPARTIDO donde viven
-- TODAS las ligas creadas por los usuarios (cada liga = una fila en `leagues`).
-- Convive con las ligas "fijas" actuales (Vamos Argentina, Productos Pozo), que
-- siguen usando su propio Supabase y su propio db/schema.sql sin cambios.
--
-- Cómo usarlo:
--   1. Creá un proyecto nuevo en https://supabase.com (será el "hub").
--   2. SQL Editor -> New query -> pegá TODO este archivo -> Run.
--   3. IMPORTANTE: editá abajo la constante v_key (clave general de creación).
--   4. Copiá Project URL y anon public key (Settings -> API) y pegalas en
--      js/leagues.js -> window.PRODE_HUB.
--
-- Nota de seguridad (app casual, identidad por nombre):
--   Igual que en el esquema original, el rol anónimo puede leer/escribir. La
--   protección del admin de cada liga es por contraseña del lado cliente (vive
--   en la fila de la liga). La clave general de creación SÍ se valida del lado
--   servidor dentro de create_league() para frenar el abuso.
-- =============================================================================

-- ---------- Tabla de LIGAS (cada fila = una liga creada por un usuario) -------
create table if not exists public.leagues (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                 -- código corto para el link (?liga=ABC123)
  name        text not null,                        -- título de la liga
  subtitle    text,                                 -- subtítulo opcional
  logo_url    text,                                 -- logo opcional (URL absoluta)
  admin_pass  text not null,                        -- clave del admin de ESTA liga (cliente)
  colors      jsonb not null default '{}'::jsonb,   -- overrides de variables CSS
  entry       jsonb not null default '{}'::jsonb,   -- { enabled, cost, alias, note }
  prizes      jsonb not null default '{}'::jsonb,   -- { first, second, third }
  created_at  timestamptz not null default now()
);

-- ---------- Jugadores (igual que el esquema base + league_id) -----------------
create table if not exists public.players (
  id                uuid primary key default gen_random_uuid(),
  league_id         uuid not null references public.leagues(id) on delete cascade,
  player_key        text not null,                  -- "nombre apellido" normalizado
  first_name        text not null,
  last_name         text not null,
  dni               text,                           -- clave del jugador (no se muestra)
  payment_reference text,                           -- nº comprobante / alias
  payment_validated boolean not null default false, -- lo marca el admin de la liga
  predictions       jsonb not null default '{}'::jsonb,
  confirmed         boolean not null default false,
  confirmed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- el mismo nombre puede existir en ligas distintas, pero es único dentro de cada liga
  unique (league_id, player_key)
);

-- ---------- Resultados oficiales por liga -------------------------------------
-- (Cada liga puede cargar/sincronizar sus propios resultados.)
create table if not exists public.match_results (
  league_id  uuid not null references public.leagues(id) on delete cascade,
  match_id   text not null,                         -- id del fixture, ej. 'A1'
  home_goals int not null,
  away_goals int not null,
  updated_at timestamptz not null default now(),
  primary key (league_id, match_id)
);

create index if not exists idx_players_league on public.players(league_id);
create index if not exists idx_results_league on public.match_results(league_id);

-- ---------- Hora del servidor (bloqueo horario uniforme) ----------------------
create or replace function public.server_now()
returns timestamptz language sql stable as $$ select now() $$;

-- ---------- Trigger: mantener updated_at --------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Trigger: pronósticos inmutables por partido -----------------------
-- Cada pronóstico guardado NO se puede cambiar; solo se AGREGAN partidos nuevos.
create or replace function public.protect_predictions()
returns trigger language plpgsql as $$
begin
  new.predictions := new.predictions || old.predictions;
  new.first_name  := old.first_name;
  new.last_name   := old.last_name;
  new.league_id   := old.league_id;   -- un jugador no cambia de liga
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

-- ---------- RPC: crear una liga (valida la clave general de creación) ---------
-- SECURITY DEFINER: corre con permisos del dueño para insertar saltando RLS,
-- pero solo si la clave general coincide. Genera un code único (reintenta ante
-- colisión). Devuelve la fila creada (incluye el code para armar el link).
create or replace function public.create_league(
  p_creation_key text,
  p_name         text,
  p_admin_pass   text,
  p_subtitle     text  default null,
  p_logo_url     text  default null,
  p_colors       jsonb default '{}'::jsonb,
  p_entry        jsonb default '{}'::jsonb,
  p_prizes       jsonb default '{}'::jsonb
) returns public.leagues
language plpgsql security definer
set search_path = public
as $$
declare
  -- ▼▼▼ EDITÁ ESTA CLAVE: es la "clave general de creación" que repartís. ▼▼▼
  v_key      constant text := 'CAMBIAME-CLAVE-CREACION';
  -- ▲▲▲ ----------------------------------------------------------------- ▲▲▲
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- sin 0/O/1/I/L
  v_code     text;
  v_row      public.leagues;
  i          int;
begin
  if p_creation_key is distinct from v_key then
    raise exception 'CLAVE_INVALIDA';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'NOMBRE_REQUERIDO';
  end if;
  if coalesce(btrim(p_admin_pass), '') = '' then
    raise exception 'ADMIN_PASS_REQUERIDO';
  end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into public.leagues (code, name, subtitle, logo_url, admin_pass, colors, entry, prizes)
      values (
        v_code,
        btrim(p_name),
        nullif(btrim(p_subtitle), ''),
        nullif(btrim(p_logo_url), ''),
        p_admin_pass,
        coalesce(p_colors, '{}'::jsonb),
        coalesce(p_entry,  '{}'::jsonb),
        coalesce(p_prizes, '{}'::jsonb)
      )
      returning * into v_row;
      return v_row;
    exception when unique_violation then
      -- el code colisionó (rarísimo): reintentamos con otro
    end;
  end loop;
end $$;

grant execute on function public.create_league(text, text, text, text, text, jsonb, jsonb, jsonb)
  to anon, authenticated;

-- ---------- Row Level Security ------------------------------------------------
alter table public.leagues       enable row level security;
alter table public.players       enable row level security;
alter table public.match_results enable row level security;

-- leagues: lectura pública (la app necesita el branding y la clave admin del
-- lado cliente). El alta NO es por insert directo, sino por create_league()
-- (que valida la clave general). Por eso NO habilitamos insert para anon.
drop policy if exists leagues_select on public.leagues;
create policy leagues_select on public.leagues for select using (true);

-- players: lectura/alta/edición/baja abiertas (el trigger protege lo confirmado).
drop policy if exists players_select on public.players;
create policy players_select on public.players for select using (true);
drop policy if exists players_insert on public.players;
create policy players_insert on public.players for insert with check (true);
drop policy if exists players_update on public.players;
create policy players_update on public.players for update using (true) with check (true);
drop policy if exists players_delete on public.players;
create policy players_delete on public.players for delete using (true);

-- match_results: lectura pública; escritura abierta (la app la protege con la
-- clave admin de cada liga del lado cliente).
drop policy if exists results_select on public.match_results;
create policy results_select on public.match_results for select using (true);
drop policy if exists results_write on public.match_results;
create policy results_write on public.match_results for all using (true) with check (true);
