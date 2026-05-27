/*
 * config.js — Configuración de la app (editá SOLO este archivo para personalizar)
 * ==============================================================================
 * 1) BACKEND: pegá la URL y la clave anónima (anon public) de tu proyecto Supabase.
 *    Si los dejás vacíos, la app funciona en "modo demo" usando localStorage
 *    (NO es multijugador: cada navegador guarda lo suyo). Sirve para probar.
 * 2) INSCRIPCIÓN: costo y alias de transferencia que se muestran al jugador.
 * 3) BLOQUEO: minutos antes del inicio en que se cierran las predicciones.
 * 4) ADMIN: contraseña del panel de administración.
 *    OJO: es un candado del lado del cliente (app casual). Cualquiera con
 *    conocimientos podría leerla en el código. No la reutilices de otra cuenta.
 */
window.PRODE_CONFIG = {
  // 1) Supabase ---------------------------------------------------------------
  SUPABASE_URL: 'https://wqxxwpzuizltvzsalxoa.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_IH70uWZpw8BHw_mse_QTZA_Ie6VjZ6t',   // clave publicable (segura para el navegador)

  // 2) Inscripción / premio ---------------------------------------------------
  ENTRY_ENABLED: true,
  ENTRY_COST: '$1000 ARS',
  ENTRY_ALIAS: 'nicofm5',               // alias / CBU / CVU donde reciben el pago
  ENTRY_NOTE: 'Transferí el valor de la inscripción y pegá el número de comprobante o tu alias para que el administrador valide tu participación.',

  // 3) Bloqueo horario --------------------------------------------------------
  LOCK_MINUTES: 60,        // se cierra la edición 60 min antes del inicio

  // 4) Panel de administración ------------------------------------------------
  ADMIN_PASSWORD: 'Laacademia555',

  // Branding (texto) ----------------------------------------------------------
  APP_TITLE: 'PRODE Mundial 2026',
  APP_SUBTITLE: 'Fase de grupos · Canadá · México · Estados Unidos',
};
