/*
 * supabaseClient.js — Capa de acceso a datos (sincronización central)
 * ===================================================================
 * Toda la comunicación con el backend compartido pasa por acá. Si Supabase
 * está configurado en config.js, se usa la base real (multijugador). Si no,
 * se cae a un "modo demo" con localStorage para poder probar la app sin backend.
 *
 * SINCRONIZACIÓN DE HORA (clave del bloqueo uniforme):
 *   getServerNow() consulta la hora del servidor (función SQL server_now) una vez
 *   al cargar. Con eso, app.js calcula un offset contra el reloj local y todos los
 *   clientes evalúan el bloqueo contra la MISMA referencia temporal, sin importar
 *   si la PC del jugador tiene la hora mal configurada.
 */
(function () {
  const cfg = window.PRODE_CONFIG;
  const REMOTE = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const sb = REMOTE ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  // ----- Modo demo (localStorage) -------------------------------------------
  const LS_PLAYERS = 'prode2026_players';
  const LS_RESULTS = 'prode2026_results';
  const lsGet = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch { return def; } };
  const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  function normalizePlayer(row) {
    if (!row) return null;
    return { ...row, predictions: row.predictions || {} };
  }

  // ----- Hora del servidor ---------------------------------------------------
  async function getServerNow() {
    if (!REMOTE) return Date.now();
    try {
      const { data, error } = await sb.rpc('server_now');
      if (error) throw error;
      return new Date(data).getTime();
    } catch (e) {
      console.warn('[prode] No se pudo obtener la hora del servidor, uso reloj local:', e.message);
      return Date.now();
    }
  }

  // ----- Jugadores -----------------------------------------------------------
  async function getPlayer(playerKey) {
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      return normalizePlayer(all[playerKey] || null);
    }
    const { data, error } = await sb.from('players').select('*').eq('player_key', playerKey).maybeSingle();
    if (error) throw error;
    return normalizePlayer(data);
  }

  async function createPlayer({ player_key, first_name, last_name, payment_reference, dni }) {
    const record = {
      player_key, first_name, last_name,
      payment_reference: payment_reference || null,
      dni: dni || null,
      predictions: {}, confirmed: false, payment_validated: false,
    };
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      all[player_key] = { ...record, created_at: new Date().toISOString() };
      lsSet(LS_PLAYERS, all);
      return normalizePlayer(all[player_key]);
    }
    const { data, error } = await sb.from('players').insert(record).select().single();
    if (error) throw error;
    return normalizePlayer(data);
  }

  // Registrar el DNI (clave) de un jugador que ya existía sin DNI.
  async function setDni(player_key, dni) {
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      if (!all[player_key]) return null;
      all[player_key].dni = dni;
      lsSet(LS_PLAYERS, all);
      return normalizePlayer(all[player_key]);
    }
    const { data, error } = await sb.from('players').update({ dni }).eq('player_key', player_key).select().single();
    if (error) throw error;
    return normalizePlayer(data);
  }

  // Guardar predicciones (los partidos ya guardados quedan inmutables).
  async function savePredictions(player_key, predictions, payment_reference) {
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      if (!all[player_key]) return null;
      // Inmutable por partido: lo ya guardado gana; solo se agregan partidos nuevos.
      all[player_key].predictions = { ...predictions, ...(all[player_key].predictions || {}) };
      if (payment_reference !== undefined) all[player_key].payment_reference = payment_reference;
      lsSet(LS_PLAYERS, all);
      return normalizePlayer(all[player_key]);
    }
    const patch = { predictions };
    if (payment_reference !== undefined) patch.payment_reference = payment_reference;
    const { data, error } = await sb.from('players').update(patch).eq('player_key', player_key).select().single();
    if (error) throw error;
    return normalizePlayer(data);
  }

  // Confirmar definitivamente: congela las jugadas. Tras esto no se puede re-editar
  // (en la base lo refuerza un trigger; en el cliente, no se abre el editor).
  async function confirmPlayer(player_key, predictions, payment_reference) {
    const confirmedAt = new Date().toISOString();
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      if (!all[player_key] || all[player_key].confirmed) return normalizePlayer(all[player_key]);
      all[player_key] = { ...all[player_key], predictions, confirmed: true, confirmed_at: confirmedAt };
      if (payment_reference !== undefined) all[player_key].payment_reference = payment_reference;
      lsSet(LS_PLAYERS, all);
      return normalizePlayer(all[player_key]);
    }
    const patch = { predictions, confirmed: true, confirmed_at: confirmedAt };
    if (payment_reference !== undefined) patch.payment_reference = payment_reference;
    const { data, error } = await sb.from('players').update(patch).eq('player_key', player_key).select().single();
    if (error) throw error;
    return normalizePlayer(data);
  }

  async function getAllPlayers() {
    if (!REMOTE) return Object.values(lsGet(LS_PLAYERS, {})).map(normalizePlayer);
    const { data, error } = await sb.from('players').select('*');
    if (error) throw error;
    return (data || []).map(normalizePlayer);
  }

  // ----- Resultados oficiales (admin) ---------------------------------------
  async function getResults() {
    if (!REMOTE) return lsGet(LS_RESULTS, {});
    const { data, error } = await sb.from('match_results').select('*');
    if (error) throw error;
    const map = {};
    (data || []).forEach((r) => { map[r.match_id] = { h: r.home_goals, a: r.away_goals }; });
    return map;
  }

  async function saveResult(match_id, home_goals, away_goals) {
    if (!REMOTE) {
      const all = lsGet(LS_RESULTS, {});
      all[match_id] = { h: home_goals, a: away_goals };
      lsSet(LS_RESULTS, all);
      return;
    }
    const { error } = await sb.from('match_results')
      .upsert({ match_id, home_goals, away_goals, updated_at: new Date().toISOString() });
    if (error) throw error;
  }

  // Eliminar un jugador por completo (solo admin).
  async function deletePlayer(player_key) {
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      delete all[player_key];
      lsSet(LS_PLAYERS, all);
      return;
    }
    const { error } = await sb.from('players').delete().eq('player_key', player_key);
    if (error) throw error;
  }

  // Blanquear la clave (DNI) de un jugador: la deja vacía para que pueda
  // reingresar y registrar una nueva. No toca sus jugadas (solo admin).
  async function resetDni(player_key) {
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      if (all[player_key]) { all[player_key].dni = null; lsSet(LS_PLAYERS, all); }
      return;
    }
    const { error } = await sb.from('players').update({ dni: null }).eq('player_key', player_key);
    if (error) throw error;
  }

  async function setPaymentValidated(player_key, validated) {
    if (!REMOTE) {
      const all = lsGet(LS_PLAYERS, {});
      if (all[player_key]) { all[player_key].payment_validated = validated; lsSet(LS_PLAYERS, all); }
      return;
    }
    const { error } = await sb.from('players').update({ payment_validated: validated }).eq('player_key', player_key);
    if (error) throw error;
  }

  window.PRODE_DB = {
    isRemote: () => REMOTE,
    getServerNow, getPlayer, createPlayer, setDni, savePredictions, confirmPlayer,
    getAllPlayers, getResults, saveResult, setPaymentValidated,
    deletePlayer, resetDni,
  };
})();
