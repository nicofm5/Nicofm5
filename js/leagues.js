/*
 * leagues.js — Registro de LIGAS (multi-liga)
 * ==============================================================================
 * Una sola base de código, varias "ligas". Cada liga tiene su propio branding
 * (nombre, colores, logo), su propio Supabase (datos separados) y su propia
 * contraseña de admin. La app elige qué liga mostrar según el dominio donde
 * está publicada (cada liga = su propio proyecto de Vercel con su URL).
 *
 * --------------------------------------------------------------------------
 * CÓMO AGREGAR UNA LIGA NUEVA (3 pasos):
 *   1) Copiá uno de los bloques de abajo dentro de PRODE_LEAGUES y cambialo:
 *        - key:        identificador corto, sin espacios (ej: 'mi-liga')
 *        - hostnames:  los dominios de Vercel de esa liga
 *        - branding:   título, subtítulo y logo
 *        - theme:      colores (podés dejar los del default si no querés cambiar)
 *        - supabase:   URL y anon key del Supabase NUEVO de esa liga
 *        - admin:      contraseña del panel de esa liga
 *   2) Creá un proyecto Supabase nuevo para esa liga y corré db/schema.sql.
 *   3) Creá un proyecto Vercel nuevo apuntando a este repo + un workflow de
 *      sync (ver .github/workflows/) con los secrets de ese Supabase.
 * --------------------------------------------------------------------------
 * Para PROBAR una liga en local o sin tener el dominio todavía:
 *   agregá  ?liga=key  al final de la URL  (ej: ...vercel.app/?liga=libro-mundial)
 */

window.PRODE_LEAGUES = {

  // ===========================================================================
  // LIGA: Libro Mundial  (prode general / público)
  // ===========================================================================
  'libro-mundial': {
    key: 'libro-mundial',
    hostnames: [
      'prode-mundial-2026-vamos-argentina.vercel.app',
      'libro-mundial.vercel.app',
    ],
    branding: {
      APP_TITLE: 'Libro Mundial 2026 · Prode',
      APP_SUBTITLE: 'Fase de grupos · Canadá · México · Estados Unidos',
      LOGO: 'assets/logo26.png',
    },
    // Colores (sobrescriben las variables del CSS). Dejá vacío {} para usar el default.
    theme: {
      '--celeste': '#75ace4',
      '--celeste-2': '#3f86c9',
      '--gold': '#e7b94e',
      '--gold-2': '#c8922a',
      '--navy': '#0a2a55',
    },
    supabase: {
      url: 'https://wqxxwpzuizltvzsalxoa.supabase.co',
      anonKey: 'sb_publishable_IH70uWZpw8BHw_mse_QTZA_Ie6VjZ6t',
    },
    admin: { password: 'Laacademia555' },
    entry: {
      enabled: false,
      cost: '$1000 ARS',
      alias: 'nicofm5',
      note: 'Transferí el valor de la inscripción y pegá el número de comprobante o tu alias para que el administrador valide tu participación.',
    },
    lockMinutes: 60,
  },

  // ===========================================================================
  // LIGA: Productos Pozo  (empresa)
  // ===========================================================================
  // IMPORTANTE: completá supabase.url / supabase.anonKey con los datos del
  // Supabase NUEVO de esta liga. Mientras estén vacíos, esta liga funciona en
  // "modo demo" (localStorage, no multijugador).
  'productos-pozo': {
    key: 'productos-pozo',
    hostnames: [
      'prode-productos-pozo.vercel.app',
    ],
    branding: {
      APP_TITLE: 'Prode Mundial 2026 · Productos Pozo',
      APP_SUBTITLE: 'Liga interna · Fase de grupos',
      LOGO: 'assets/logo-pozo.png',   // subí el logo de la empresa a /assets
    },
    // Tema corporativo (cambiá estos colores por los de la marca cuando los tengas)
    theme: {
      '--celeste': '#e23b2e',
      '--celeste-2': '#b81f15',
      '--gold': '#f0a500',
      '--gold-2': '#c47f00',
      '--navy': '#3a0d0a',
    },
    supabase: {
      url: '',        // ← pegá la URL del Supabase de Productos Pozo
      anonKey: '',    // ← pegá la anon key del Supabase de Productos Pozo
    },
    admin: { password: 'CAMBIAR_pozo_2026' },
    entry: {
      enabled: false,
      cost: '',
      alias: '',
      note: '',
    },
    lockMinutes: 60,
  },

};

// Liga que se usa si el dominio no coincide con ninguna (previews, local, etc.)
window.PRODE_DEFAULT_LEAGUE = 'libro-mundial';
