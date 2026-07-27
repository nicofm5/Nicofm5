-- =============================================================================
-- MIGRACIÓN — Funciones de administrador (eliminar jugadores)
-- =============================================================================
-- Corré este archivo en el SQL Editor de Supabase de CADA liga
-- (Vamos Argentina y Productos Pozo). Es seguro correrlo más de una vez.
--
-- Qué agrega:
--   * Permiso para que el panel admin pueda ELIMINAR jugadores.
--     (El schema original solo permitía leer / crear / actualizar.)
--
-- Nota: "blanquear la clave" (resetear el DNI de un jugador) ya funciona con
-- el permiso de UPDATE que existe; no necesita cambios en la base.
-- =============================================================================

drop policy if exists players_delete on public.players;
create policy players_delete on public.players for delete using (true);
