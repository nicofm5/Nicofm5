# PRODE Mundial 2026 ⚽🏆

Aplicación web para un **Prode** (pronósticos deportivos) de la **fase de grupos
del Mundial FIFA 2026**. Multijugador real y centralizado, sin costos: frontend
100% estático en **Vercel** + base de datos gratuita en **Supabase**.

## Características

- **Ingreso por nombre y apellido** (recupera tus jugadas si volvés).
- **Los 72 partidos** organizados por grupo (A–L), con **banderas en alta calidad**
  desde `flagcdn.com`, fecha y **hora de Argentina (UTC-3)**.
- **Bloqueo automático** de cada partido **60 minutos antes** de su inicio
  (configurable), sincronizado con la hora del servidor para que sea uniforme
  en todos los dispositivos.
- **Borrador** editable y **confirmación final** que congela las jugadas y
  genera un **Ticket imprimible** (`window.print()`).
- **Módulo de inscripción** configurable (costo + alias + número de comprobante).
- **Ranking público**: +1 punto por acertar el resultado y +1 extra si coincide
  el marcador exacto.
- **Panel de administrador** para cargar resultados oficiales y validar pagos.

## Estructura

```
index.html            # Vistas: bienvenida · editor · ticket · ranking · admin
styles.css            # Estética Mundial 2026, responsive, animaciones, @media print
js/
  config.js           # Tu configuración (Supabase, costo, alias, contraseña admin)
  fixture.js          # 12 grupos y 72 partidos (kickoff en UTC, editable)
  scoring.js          # Reglas de puntuación y ranking
  supabaseClient.js   # Acceso a datos (Supabase o localStorage en modo demo)
  app.js              # Lógica de la app
db/schema.sql         # Script para crear las tablas en Supabase
vercel.json           # Config de despliegue estático
assets/               # Placeholders de logo y mascotas
```

## Puesta en marcha

### 1) Probar ya mismo (modo demo, sin backend)

Abrí `index.html` con un servidor estático. Por ejemplo:

```bash
python3 -m http.server 8000
# luego entrá a http://localhost:8000
```

Sin Supabase, los datos quedan solo en **ese navegador** (no es multijugador).
Sirve para ver el funcionamiento.

### 2) Activar el backend compartido (Supabase, gratis)

1. Creá una cuenta y un proyecto en <https://supabase.com>.
2. En el panel, andá a **SQL Editor → New query**, pegá el contenido de
   [`db/schema.sql`](db/schema.sql) y dale **Run**.
3. En **Project Settings → API**, copiá:
   - **Project URL**
   - **anon public** key
4. Pegá ambos valores en [`js/config.js`](js/config.js):

   ```js
   SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOi...'
   ```

5. Ajustá también el costo, el alias de pago y la **contraseña del admin**.

### 3) Desplegar en Vercel

1. Subí el repositorio a GitHub.
2. En <https://vercel.com> → **Add New… → Project** → importá el repo.
3. **Framework Preset: Other** (no hay build). Deploy.
4. Listo: compartí la URL. Cada jugador entra con su nombre y apellido.

## Cómo se juega

1. El jugador ingresa nombre y apellido (y, si está habilitado, el comprobante de pago).
2. Carga los marcadores que predice para cada partido **abierto**.
3. Puede **guardar borrador** las veces que quiera y, cuando esté listo,
   **confirmar** (esto es definitivo: ya no podrá editar).
4. Obtiene su **Ticket** y puede imprimirlo.

## Administración

Entrá a **Admin** (botón en la barra) con la `ADMIN_PASSWORD` de `config.js`:

- **Cargar resultados**: anotá el marcador real de cada partido → el ranking se
  recalcula automáticamente.
- **Jugadores y pagos**: revisá las jugadas de cada uno, su comprobante/alias y
  marcá **Pago validado**.

## Puntuación

| Situación | Puntos |
|---|---|
| Acertás quién gana (o el empate) | **1** |
| Acertás además el marcador exacto | **2** (1 + 1) |
| No acertás el resultado | 0 |

## Notas

- **Datos del fixture**: tomados del sorteo y calendario oficial; si la FIFA
  ajusta algún horario, editá el campo `kickoffUTC` del partido en `js/fixture.js`
  (siempre en UTC; la app lo muestra en hora de Argentina).
- **Seguridad**: la identidad es por nombre (app casual entre conocidos) y el
  panel admin se protege con una contraseña del lado cliente. Para un entorno
  más estricto se podría sumar Supabase Auth.
- **Banderas**: se obtienen exclusivamente de `flagcdn.com` (URLs absolutas).
