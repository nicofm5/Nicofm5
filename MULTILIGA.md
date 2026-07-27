# Guía multi-liga

Una sola base de código, varias "ligas" (Libro Mundial, Productos Pozo, etc.).
Cada liga tiene:

- **Su branding** (nombre, subtítulo, colores, logo) → en `js/leagues.js`
- **Sus datos separados** → un proyecto **Supabase** propio
- **Su URL** → un proyecto **Vercel** propio
- **Su robot de resultados** → un workflow en `.github/workflows/`

La lógica del prode (fixture, puntajes, panel admin) y el script que sincroniza
los resultados (`scripts/sync-results.mjs`) son **compartidos**: si los mejorás,
el cambio aplica a **todas** las ligas automáticamente.

---

## Ligas self-service (las crea cada usuario, sin que vos intervengas)

Además de las ligas "fijas" de `leagues.js` (cada una con su Supabase/Vercel),
ahora cualquiera puede **crear su propia liga** desde la app. Todas esas ligas
viven en **un solo Supabase compartido** (el "hub"), cada una como una **fila**.

**Flujo para el usuario:** entra → botón **"Crear mi liga"** → pone nombre y una
clave de admin propia + la **clave general de creación** → recibe un **link**
(`tusitio/?liga=ABC123`) que comparte. Quien entre con ese link juega en su liga;
el creador administra **solo la suya** con su clave. Vos no intervenís.

**Dónde vive el hub:** para no pasar el límite de 2 proyectos del plan gratuito
de Supabase, el hub **es el mismo proyecto de Vamos Argentina**. Esa liga pasó a
ser una *fila* del hub (con un `leagueId` fijo en `leagues.js`) y comparte base
con todas las ligas nuevas. Productos Pozo sigue como liga *standalone* aparte.

**Cómo se activó (una sola vez):**

1. En el SQL Editor del proyecto de **Vamos Argentina**, correr
   `db/migration-vamos-to-hub.sql` (PASO 1 borra las tablas viejas vacías),
   luego `db/schema-hub.sql` (PASO 2 — ¡editar antes la constante `v_key`, que
   es la **clave general de creación**!), y luego el PASO 3 de la migración
   (crea la fila de Vamos Argentina con su id fijo).
2. `js/leagues.js` ya tiene `window.PRODE_HUB` con las credenciales de ese
   proyecto y el campo `leagueId` en la liga `vamos-argentina`.
3. **Robot de resultados del hub:** en GitHub → Settings → Secrets and variables
   → Actions, agregar `SUPABASE_URL_HUB` y `SUPABASE_ANON_KEY_HUB` (con los
   MISMOS valores que `SUPABASE_URL` / `SUPABASE_ANON_KEY` de Vamos Argentina).
   `.github/workflows/sync-hub.yml` recorre **todas** las ligas del hub cada
   hora (incluida Vamos Argentina), así que el workflow viejo
   `sync-results.yml` se eliminó.

Mientras `PRODE_HUB` esté vacío, la creación queda desactivada y las ligas
fijas siguen funcionando igual (convivencia total).

> **Robot de resultados:** una sola corrida (`scripts/sync-results-hub.mjs`)
> consulta football-data.org y upsertea los resultados en cada liga del hub con
> su `league_id`. Las ligas fijas siguen con su propio workflow
> (`scripts/sync-results.mjs`). La lógica de mapeo de equipos es compartida
> (`scripts/wc-results.mjs`).

---

## Cómo elige la app qué liga mostrar

1. `?liga=clave` en la URL (para probar; queda recordado en ese navegador).
2. El dominio actual, comparado con los `hostnames` de cada liga en `leagues.js`.
3. La liga por defecto (`PRODE_DEFAULT_LEAGUE`).

Probar una liga sin tener su dominio:
`https://tu-sitio.vercel.app/?liga=productos-pozo`

---

## Migración pendiente para ligas YA creadas (admin: eliminar jugadores)

Si tu liga se creó con una versión vieja de `db/schema.sql`, corré una vez en el
SQL Editor de **cada** Supabase (Vamos Argentina y Productos Pozo) el archivo
`db/migration-admin.sql`. Habilita que el panel admin pueda **eliminar
jugadores**. ("Blanquear clave" ya funciona sin migración.)

## Premios del podio

Cada liga define sus premios 1°/2°/3° en `js/leagues.js` (campo `prizes`).
Aparecen en el podio del ranking. Editá esos textos cuando los definas.

## Agregar una liga nueva (paso a paso)

### 1) Crear el Supabase de la liga
- Entrá a https://supabase.com → New project.
- En el SQL Editor, pegá y corré el contenido de `db/schema.sql`
  (ya incluye el permiso de borrado de jugadores).
- Copiá la **Project URL** y la **anon public key** (Settings → API).

### 2) Registrar la liga en el código
En `js/leagues.js`, copiá un bloque existente dentro de `PRODE_LEAGUES` y editá:
- `key`, `hostnames`, `branding` (título, subtítulo, logo), `theme` (colores),
  `supabase` (URL y anon key del paso 1), `admin.password`.
- Si la liga lleva logo propio, subí la imagen a `/assets/` y apuntá `branding.LOGO`.

### 3) Crear el proyecto Vercel de la liga
- En Vercel → New Project → importá este mismo repo.
- Production branch: `claude/magical-hawking-gqhf9`.
- Deploy. Anotá el dominio que te asigna y agregalo a `hostnames` de esa liga.

### 4) Activar el robot de resultados de la liga
- En GitHub → Settings → Secrets and variables → Actions, agregá:
  - `SUPABASE_URL_XXX` y `SUPABASE_ANON_KEY_XXX` (de esa liga).
  - `FOOTBALL_DATA_API_KEY` ya está cargado y se comparte.
- Copiá `.github/workflows/sync-productos-pozo.yml` a un archivo nuevo
  (`sync-xxx.yml`), cambiá el `name:`, el `cron` (usá un minuto distinto para
  no pisar a las otras: `10 * * * *`, `15 * * * *`, ...) y los secrets.

¡Listo! Esa liga ya carga resultados sola cada hora.

---

## Ligas actuales

| Liga             | clave              | Supabase     | Workflow                  |
|------------------|--------------------|--------------|---------------------------|
| Vamos Argentina  | `vamos-argentina`  | configurado  | `sync-results.yml`        |
| Productos Pozo   | `productos-pozo`   | configurado  | `sync-productos-pozo.yml` |

> "Libro Mundial" todavía no está creada. Para sumarla, seguí los pasos de
> "Agregar una liga nueva" más arriba (Supabase nuevo, entrada en `leagues.js`,
> proyecto Vercel y workflow propios).
