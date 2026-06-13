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
  // LIGA: Vamos Argentina  (prode base / público original)
  // ===========================================================================
  'vamos-argentina': {
    key: 'vamos-argentina',
    // Esta liga ahora vive en el HUB (su mismo Supabase es la base compartida).
    // El leagueId apunta a la fila creada por db/migration-vamos-to-hub.sql.
    leagueId: '11111111-1111-1111-1111-111111111111',
    hostnames: [
      'prodemundial.vercel.app',
      'prode-mundial-2026-vamos-argentina.vercel.app',
    ],
    branding: {
      APP_TITLE: 'Mundial 2026 Prode · Vamos Argentina',
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
    // Premios del podio (1°, 2° y 3°). Editá estos textos cuando los definas.
    prizes: {
      first: '1° Premio',
      second: '2° Premio',
      third: '3° Premio',
    },
    // Banner al pie invitando a otra app (dejá en null para no mostrar).
    crossPromo: {
      title: '¿YA ENTRASTE AL LIBRO DEL MUNDIAL?',
      desc: 'Informate sobre el Mundial, aprendé y jugá. ¡Es totalmente gratis!',
      url: 'https://nicofm5.github.io/libro-mundial/',
      btnText: 'Ir al Libro del Mundial',
      free: true,
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
    // Colores extraídos del logo real: cinta roja, óvalo azul, cartel amarillo
    theme: {
      '--celeste': '#D42B2B',
      '--celeste-2': '#A81A1A',
      '--gold': '#F5C800',
      '--gold-2': '#C99A00',
      '--navy': '#1A3A7A',
      '--c-bg': '#1A0505',
      '--c-bg-2': '#2E0A0A',
      '--bg-glow-1': 'rgba(212, 43, 43, 0.22)',
      '--bg-glow-2': 'rgba(245, 200, 0, 0.15)',
      '--bg-top': '#1A0505',
    },
    supabase: {
      url: 'https://esrjzhbyifpzelzofznh.supabase.co',
      anonKey: 'sb_publishable_NqCOvkD2WmTmR4iydftleg_sUpWA91y',
    },
    admin: { password: 'Laacademia555' },
    entry: {
      enabled: false,
      cost: '',
      alias: '',
      note: '',
    },
    // Premios del podio (1°, 2° y 3°). Editá estos textos cuando los definas.
    prizes: {
      first: '1° Premio',
      second: '2° Premio',
      third: '3° Premio',
    },
    lockMinutes: 60,
  },

};

// Liga que se usa si el dominio no coincide con ninguna (previews, local, etc.)
window.PRODE_DEFAULT_LEAGUE = 'vamos-argentina';

/*
 * ============================================================================
 * HUB de ligas self-service (las que crean los propios usuarios)
 * ============================================================================
 * Un solo Supabase COMPARTIDO donde vive cada liga creada desde la app como
 * una fila (ver db/schema-hub.sql). Cuando alguien entra con un código que NO
 * es una liga fija de arriba (ej: ?liga=ABC123), la app lo busca acá.
 *
 * Pasos:
 *   1) Creá un proyecto Supabase nuevo y corré db/schema-hub.sql.
 *   2) Pegá su Project URL y anon public key abajo.
 *   3) Definí la "clave general de creación" DENTRO de db/schema-hub.sql
 *      (constante v_key de la función create_league). La app no la guarda:
 *      el usuario la escribe al crear su liga y se valida del lado servidor.
 *
 * Mientras url/anonKey estén vacíos, la creación de ligas queda DESACTIVADA
 * (el botón "Crear mi liga" no aparece) y las ligas fijas siguen funcionando.
 */
// El hub es el MISMO proyecto Supabase de Vamos Argentina (lo convertimos con
// db/migration-vamos-to-hub.sql). Por eso estas credenciales coinciden con las
// de esa liga: todas las ligas nuevas viven en esa base compartida.
window.PRODE_HUB = {
  url: 'https://wqxxwpzuizltvzsalxoa.supabase.co',
  anonKey: 'sb_publishable_IH70uWZpw8BHw_mse_QTZA_Ie6VjZ6t',
};

// Banner "Libro del Mundial" que se muestra al pie de CUALQUIER liga que no
// tenga su propio crossPromo (por ejemplo, las ligas creadas por usuarios).
window.PRODE_GLOBAL_CROSS_PROMO = {
  title: '¿YA ENTRASTE AL LIBRO DEL MUNDIAL?',
  desc: 'Informate sobre el Mundial, aprendé y jugá. ¡Es totalmente gratis!',
  url: 'https://nicofm5.github.io/libro-mundial/',
  btnText: 'Ir al Libro del Mundial',
  free: true,
};

/*
 * ============================================================================
 * Ajustes locales por liga de USUARIO (sin tocar la base del hub)
 * ============================================================================
 * Clave = código de la liga (el de su link, ej. ?liga=Y6KJBD). Permite fijar
 * los premios del podio y un flyer de premios que se muestra al ingresar.
 * El flyer es una imagen subida a /assets de este repo.
 */
window.PRODE_LEAGUE_OVERRIDES = {
  'Y6KJBD': {   // LOGISTICA POZO
    prizes: {
      first: '🥇 $140.000',
      second: '🥈 $40.000',
      third: '🥉 $10.000 (recuperás lo apostado)',
    },
    prizesFlyer: 'assets/premios-logistica.png',
    // Inscripcion cerrada: solo entran jugadores ya registrados; los nombres
    // mal cargados no crean cuenta nueva, ven un error explicativo.
    registrationClosed: true,
  },
};
