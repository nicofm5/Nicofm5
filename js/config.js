/*
 * config.js — Resolutor de la liga activa (multi-liga)
 * ==============================================================================
 * NO edites este archivo para personalizar. Toda la configuración de cada liga
 * vive en js/leagues.js. Este archivo solo decide CUÁL liga mostrar y arma el
 * objeto window.PRODE_CONFIG que el resto de la app consume.
 *
 * Cómo elige la liga (en este orden):
 *   1) ?liga=valor en la URL  (queda recordado en este navegador)
 *        - si "valor" es una liga FIJA (de leagues.js) → la usa tal cual
 *        - si NO lo es y el HUB está configurado → es una liga de USUARIO
 *          (una fila en el Supabase compartido); su branding se resuelve después
 *          de cargar (app.js consulta el hub por ese código).
 *   2) el dominio actual, comparándolo con los "hostnames" de cada liga fija
 *   3) la liga por defecto (window.PRODE_DEFAULT_LEAGUE)
 */
(function () {
  const leagues = window.PRODE_LEAGUES || {};
  const defaultKey = window.PRODE_DEFAULT_LEAGUE;
  const HUB = window.PRODE_HUB || {};
  const HUB_READY = !!(HUB.url && HUB.anonKey);

  // Devuelve el valor pedido explícitamente (?liga=... o el recordado), o null.
  function getOverride() {
    try {
      const qs = new URLSearchParams(window.location.search);
      const q = qs.get('liga');
      if (q) { localStorage.setItem('prode_liga_override', q); return q; }
      const saved = localStorage.getItem('prode_liga_override');
      if (saved) return saved;
    } catch (e) { /* sin localStorage: seguimos */ }
    return null;
  }

  function getDomainKey() {
    const host = window.location.hostname;
    for (const k in leagues) {
      if ((leagues[k].hostnames || []).includes(host)) return k;
    }
    return null;
  }

  const override = getOverride();
  let key, isUserLeague = false;
  if (override && leagues[override]) {
    key = override;                 // liga fija elegida explícitamente
  } else if (override && HUB_READY) {
    key = override; isUserLeague = true;  // código de liga de usuario (se resuelve luego)
  } else {
    key = getDomainKey() || (defaultKey && leagues[defaultKey] ? defaultKey : Object.keys(leagues)[0]);
  }

  const L = leagues[key] || {};
  const b = L.branding || {};
  const sb = isUserLeague ? { url: HUB.url, anonKey: HUB.anonKey } : (L.supabase || {});
  const entry = L.entry || {};
  const prizes = L.prizes || {};

  // Objeto que el resto de la app ya conoce (forma original de PRODE_CONFIG)
  window.PRODE_CONFIG = {
    LEAGUE_KEY: key,

    // Liga de usuario (hub): el branding/admin se completa tras resolver el código.
    IS_USER_LEAGUE: isUserLeague,
    LEAGUE_ID: null,
    HUB_READY: HUB_READY,

    // Supabase (para liga de usuario apunta al hub compartido)
    SUPABASE_URL: sb.url || '',
    SUPABASE_ANON_KEY: sb.anonKey || '',

    // Inscripción / premio
    ENTRY_ENABLED: !!entry.enabled,
    ENTRY_COST: entry.cost || '',
    ENTRY_ALIAS: entry.alias || '',
    ENTRY_NOTE: entry.note || '',

    // Bloqueo horario
    LOCK_MINUTES: L.lockMinutes != null ? L.lockMinutes : 60,

    // Admin
    ADMIN_PASSWORD: (L.admin && L.admin.password) || '',

    // Branding
    APP_TITLE: b.APP_TITLE || 'Prode Mundial 2026',
    APP_SUBTITLE: b.APP_SUBTITLE || 'Fase de grupos',
    LOGO: b.LOGO || 'assets/logo26.png',

    // Tema (colores) para aplicar a las variables CSS
    THEME: L.theme || {},

    // Banner de liga cruzada
    CROSS_PROMO: L.crossPromo || null,

    // Premios del podio (1°, 2°, 3°)
    PRIZES: {
      first: prizes.first || '1° Premio',
      second: prizes.second || '2° Premio',
      third: prizes.third || '3° Premio',
    },
  };
})();
