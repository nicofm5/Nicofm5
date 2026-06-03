-- =============================================================================
-- Storage para los LOGOS de las ligas (subida de imágenes)
-- =============================================================================
-- Crea un "bucket" público llamado 'league-logos' donde se guardan los logos
-- que los usuarios suben al crear su liga, y habilita que el rol anónimo pueda
-- subir archivos ahí (la lectura es pública por ser un bucket público).
--
-- Correr UNA vez en el SQL Editor del proyecto HUB (Vamos Argentina).
-- (También se puede crear el bucket desde Storage → New bucket → Public.)
-- =============================================================================

-- 1) Crear el bucket público (si no existe)
insert into storage.buckets (id, name, public)
values ('league-logos', 'league-logos', true)
on conflict (id) do update set public = true;

-- 2) Permitir que cualquiera (anon) SUBA un archivo a ese bucket
drop policy if exists "league_logos_insert" on storage.objects;
create policy "league_logos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'league-logos');

-- 3) Lectura pública del bucket (por las dudas, además de ser público)
drop policy if exists "league_logos_select" on storage.objects;
create policy "league_logos_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'league-logos');
