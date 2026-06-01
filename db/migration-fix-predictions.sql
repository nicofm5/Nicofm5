-- =============================================================================
-- MIGRACIÓN — Reparar el guardado de pronósticos (jugadas nuevas no se guardaban)
-- =============================================================================
-- SÍNTOMA:
--   Al cargar un partido nuevo y guardar, aparecía el aviso de confirmación,
--   pero la jugada no quedaba guardada (ni en pantalla al refrescar ni en el
--   ticket). La app ahora detecta esto y muestra:
--     "⚠ No se pudo guardar: <Partido>. Probá de nuevo."
--
-- CAUSA:
--   La base de datos en vivo tenía una versión vieja/incorrecta del trigger
--   `protect_predictions` que CONGELABA todas las predicciones (no dejaba
--   AGREGAR partidos nuevos). El trigger correcto debe:
--     * mantener INMUTABLE cada pronóstico ya guardado (no se puede cambiar), y
--     * permitir AGREGAR partidos nuevos que todavía no estaban cargados.
--   Eso se logra con la unión jsonb `new.predictions || old.predictions`
--   (gana el valor viejo en las claves repetidas; las claves nuevas se suman).
--
-- CÓMO CORRERLA:
--   1. Supabase de CADA liga (Vamos Argentina y Productos Pozo) -> SQL Editor.
--   2. Pegá TODO este archivo y dale "Run". Es seguro correrlo más de una vez.
--
-- Nota: NO toca datos existentes; solo redefine la función y el trigger.
-- =============================================================================

create or replace function public.protect_predictions()
returns trigger language plpgsql as $$
begin
  -- Unión jsonb: gana OLD en las claves repetidas (inmutabilidad por partido),
  -- y se AGREGAN las claves nuevas que vengan en NEW (partidos recién cargados).
  new.predictions := new.predictions || old.predictions;
  -- El nombre tampoco se puede cambiar una vez creado.
  new.first_name  := old.first_name;
  new.last_name   := old.last_name;
  return new;
end $$;

-- Recreamos el trigger por las dudas (apunta a la función ya corregida).
drop trigger if exists trg_players_protect on public.players;
create trigger trg_players_protect before update on public.players
  for each row execute function public.protect_predictions();
