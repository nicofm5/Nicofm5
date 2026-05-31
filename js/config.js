/*
 * config.js — Resolutor de la liga activa (multi-liga)
 * ==============================================================================
 * NO edites este archivo para personalizar. Toda la configuración de cada liga
 * vive en js/leagues.js. Este archivo solo decide CUÁL liga mostrar y arma el
 * objeto window.PRODE_CONFIG que el resto de la app consume.
 *
 * Cómo elige la liga (en este orden):
 *   1) ?liga=key en la URL  (para probar; queda recordado en este navegador)
 *   2) el dominio actual, comparándolo con los "hostnames" de cada liga
 *   3) la liga por defecto (window.PRODE_DEFAULT_LEAGUE)
 */
(function () {
  const leagues = window.PRODE_LEAGUES || {};
  const defaultKey = window.PRODE_DEFAULT_LEAGUE;

  function pickLeagueKey() {
    // 1) override por querystring (?liga=...) — útil para probar
    try {
      const qs = new URLSearchParams(window.location.search);
      const q = qs.get('liga');
      if (q && leagues[q]) {
        localStorage.setItem('prode_liga_override', q);
        return q;
      }
      const saved = localStorage.getItem('prode_liga_override');
      if (saved && leagues[saved]) return saved;
    } catch (e) { /* sin localStorage: seguimos */ }

    // 2) por dominio
    const host = window.location.hostname;
    for (const key in leagues) {
      const hosts = leagues[key].hostnames || [];
      if (hosts.includes(host)) return key;
    }

    // 3) por defecto
    if (defaultKey && leagues[defaultKey]) return defaultKey;
    return Object.keys(leagues)[0];
  }

  const key = pickLeagueKey();
  const L = leagues[key] || {};
  const b = L.branding || {};
  const sb = L.supabase || {};
  const entry = L.entry || {};
  const prizes = L.prizes || {};

  // Objeto que el resto de la app ya conoce (forma original de PRODE_CONFIG)
  window.PRODE_CONFIG = {
    LEAGUE_KEY: key,

    // Supabase
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

    // Premios del podio (1°, 2°, 3°)
    PRIZES: {
      first: prizes.first || '1° Premio',
      second: prizes.second || '2° Premio',
      third: prizes.third || '3° Premio',
    },
  };
})();
