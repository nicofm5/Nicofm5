/*
 * app.js — Lógica de la aplicación
 * ================================
 * Orquesta vistas, login, editor de pronósticos, bloqueo horario, ticket,
 * ranking y panel de administrador.
 */
(function () {
  'use strict';

  const cfg = window.PRODE_CONFIG;
  const { TEAMS, GROUPS, MATCHES, flagUrl } = window.PRODE_DATA;
  const DB = window.PRODE_DB;
  const { buildLeaderboard, pointsForMatch } = window.PRODE_SCORING;

  const LOCK_MS = cfg.LOCK_MINUTES * 60 * 1000;
  const SESSION_KEY = 'prode2026_session';

  const state = {
    player: null,        // jugador logueado
    clockOffset: 0,      // (hora servidor - hora local) en ms
    results: {},         // resultados oficiales cacheados
    adminAuthed: false,
  };

  // ----- Utilidades ----------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Clave única e insensible a mayúsculas/acentos/espacios.
  function normalizeKey(first, last) {
    const raw = `${first} ${last}`.trim().toLowerCase();
    return raw.normalize('NFD').replace(/[̀-ͯ]/g, '') // saca acentos
      .replace(/\s+/g, ' ');
  }
  function normalizeDni(v) { return (v || '').replace(/\D/g, ''); } // solo dígitos

  // Hora "efectiva" sincronizada con el servidor: base del bloqueo uniforme.
  const effectiveNow = () => Date.now() + state.clockOffset;

  function kickoffMs(match) { return new Date(match.kickoffUTC).getTime(); }
  function lockMs(match) { return kickoffMs(match) - LOCK_MS; }
  function isLocked(match) { return effectiveNow() >= lockMs(match); }
  // ¿El jugador ya guardó (y por lo tanto bloqueó) este partido?
  function hasSavedPred(match) {
    const p = state.player && state.player.predictions;
    return !!(p && p[match.id] && p[match.id].h != null && p[match.id].a != null);
  }

  // Fecha/hora en zona horaria de Argentina (UTC-3).
  function formatAR(iso) {
    return new Date(iso).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function teamName(key) { return TEAMS[key].name; }

  // ----- Navegación / vistas -------------------------------------------------
  function showView(name) {
    $$('.view').forEach((v) => { v.hidden = v.id !== `view-${name}`; });
    $$('.nav-btn[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ----- Sesión --------------------------------------------------------------
  function saveSession(key) { sessionStorage.setItem(SESSION_KEY, key); }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  // ============================================================================
  // LOGIN
  // ============================================================================
  async function handleLogin(e) {
    e.preventDefault();
    const first = $('#firstName').value.trim();
    const last = $('#lastName').value.trim();
    const errEl = $('#loginError');
    errEl.hidden = true;

    if (!first || !last) {
      errEl.textContent = 'Completá nombre y apellido.';
      errEl.hidden = false;
      return;
    }
    const dni = normalizeDni($('#dni').value);
    if (dni.length < 6) {
      errEl.textContent = 'Ingresá un DNI válido (solo números).';
      errEl.hidden = false;
      return;
    }

    const key = normalizeKey(first, last);
    const btn = $('#loginBtn');
    btn.disabled = true; btn.textContent = 'Ingresando...';

    try {
      let player = await DB.getPlayer(key);
      if (player) {
        const savedDni = normalizeDni(player.dni);
        if (savedDni && savedDni !== dni) {
          errEl.textContent = 'El DNI no coincide con el de ese nombre y apellido.';
          errEl.hidden = false;
          return; // el finally reactiva el botón
        }
        if (!savedDni) player = await DB.setDni(key, dni); // jugador previo sin DNI: lo registra
      } else {
        player = await DB.createPlayer({
          player_key: key, first_name: first, last_name: last, dni,
        });
      }
      state.player = player;
      saveSession(key);
      enterApp();
    } catch (err) {
      console.error(err);
      errEl.textContent = 'No se pudo ingresar: ' + (err.message || err);
      errEl.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = 'Ingresar';
    }
  }

  function enterApp() {
    $('#nav').hidden = false;
    $('#userChip').hidden = false;
    $('#userChip').textContent = `${state.player.first_name} ${state.player.last_name}`;
    $('#logoutBtn').hidden = false;
    // El editor siempre está disponible: los partidos ya guardados se muestran
    // bloqueados y los que faltan se pueden completar (hasta su horario límite).
    renderGroups();
    showView('fixture');
  }

  function logout() {
    clearSession();
    state.player = null;
    state.adminAuthed = false;
    $('#nav').hidden = true;
    $('#userChip').hidden = true;
    $('#logoutBtn').hidden = true;
    $('#loginForm').reset();
    showView('welcome');
  }

  // ============================================================================
  // EDITOR DE PRONÓSTICOS
  // ============================================================================
  function renderGroups() {
    const preds = state.player.predictions || {};
    const container = $('#groupsContainer');
    const groupLetters = Object.keys(GROUPS);

    container.innerHTML = groupLetters.map((g) => {
      const matches = MATCHES.filter((m) => m.group === g);
      return `
        <section class="group">
          <h3 class="group-title">Grupo ${g}</h3>
          <div class="matches">
            ${matches.map((m) => matchCardHTML(m, preds[m.id])).join('')}
          </div>
        </section>`;
    }).join('');

    refreshLocks();
  }

  function matchCardHTML(m, pred) {
    const h = pred && pred.h != null ? pred.h : '';
    const a = pred && pred.a != null ? pred.a : '';
    return `
      <div class="match-card" data-match="${m.id}">
        <div class="match-meta">
          <span class="match-when">🕒 ${escapeHtml(formatAR(m.kickoffUTC))} h</span>
          <span class="match-where">${escapeHtml(m.city)} · ${escapeHtml(m.stadium)}</span>
        </div>
        <div class="match-row">
          <div class="team team-home">
            <img class="flag" src="${flagUrl(m.home)}" alt="${escapeHtml(teamName(m.home))}" loading="lazy" />
            <span class="team-name">${escapeHtml(teamName(m.home))}</span>
          </div>
          <div class="score">
            <input type="number" min="0" max="99" inputmode="numeric" class="goal" data-match="${m.id}" data-side="h" value="${h}" />
            <span class="vs">-</span>
            <input type="number" min="0" max="99" inputmode="numeric" class="goal" data-match="${m.id}" data-side="a" value="${a}" />
          </div>
          <div class="team team-away">
            <img class="flag" src="${flagUrl(m.away)}" alt="${escapeHtml(teamName(m.away))}" loading="lazy" />
            <span class="team-name">${escapeHtml(teamName(m.away))}</span>
          </div>
        </div>
        <div class="match-status" data-status="${m.id}"></div>
      </div>`;
  }

  // Actualiza en vivo qué partidos están cerrados (sin re-renderizar inputs).
  function refreshLocks() {
    MATCHES.forEach((m) => {
      const timeLocked = isLocked(m);
      const saved = hasSavedPred(m);
      const locked = timeLocked || saved;
      const statusEl = $(`[data-status="${m.id}"]`);
      const card = $(`.match-card[data-match="${m.id}"]`);
      if (!statusEl || !card) return;
      $$(`input.goal[data-match="${m.id}"]`).forEach((inp) => { inp.disabled = locked; });
      card.classList.toggle('locked', locked);
      if (saved) {
        statusEl.innerHTML = '<span class="badge ok">✓ Guardado (bloqueado)</span>';
      } else if (timeLocked) {
        statusEl.innerHTML = '<span class="badge closed">🔒 Cerrado · sin pronóstico</span>';
      } else {
        const mins = Math.round((lockMs(m) - effectiveNow()) / 60000);
        statusEl.innerHTML = `<span class="badge open">Abierto · cierra en ${formatCountdown(mins)}</span>`;
      }
    });
  }

  function formatCountdown(mins) {
    if (mins <= 0) return 'instantes';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60), d = Math.floor(h / 24);
    if (h < 24) return `${h} h ${mins % 60} min`;
    return `${d} día(s)`;
  }

  // Lee los inputs (solo partidos NO cerrados y con ambos goles cargados).
  function collectPredictions() {
    // Partimos de las predicciones existentes para no perder partidos ya cerrados.
    const preds = { ...(state.player.predictions || {}) };
    MATCHES.forEach((m) => {
      if (isLocked(m) || hasSavedPred(m)) return; // cerrados o ya guardados: no se tocan
      const hEl = $(`input.goal[data-match="${m.id}"][data-side="h"]`);
      const aEl = $(`input.goal[data-match="${m.id}"][data-side="a"]`);
      const hv = hEl.value.trim(), av = aEl.value.trim();
      if (hv !== '' && av !== '') {
        preds[m.id] = { h: Math.max(0, parseInt(hv, 10)), a: Math.max(0, parseInt(av, 10)) };
      } else {
        delete preds[m.id];
      }
    });
    return preds;
  }

  async function savePlays() {
    const status = $('#saveStatus');
    const existing = state.player.predictions || {};
    const preds = collectPredictions();
    // Solo los partidos NUEVOS (los ya guardados no se vuelven a tocar).
    const nuevos = Object.keys(preds).filter((id) => !existing[id]);
    if (!nuevos.length) {
      status.textContent = 'No hay pronósticos nuevos para guardar.';
      setTimeout(() => { status.textContent = ''; }, 2500);
      return;
    }
    const ok = window.confirm(
      `Vas a guardar ${nuevos.length} pronóstico(s). Una vez guardados quedan BLOQUEADOS y no se pueden cambiar. ` +
      `Los partidos que falten los podés completar más adelante, antes del horario de cada uno. ¿Guardar?`
    );
    if (!ok) return;
    status.textContent = 'Guardando...';
    try {
      state.player = await DB.savePredictions(state.player.player_key, preds, state.player.payment_reference);
      renderGroups(); // re-dibuja: los recién guardados quedan bloqueados
      status.textContent = '✓ Pronósticos guardados y bloqueados';
      setTimeout(() => { status.textContent = ''; }, 3000);
    } catch (err) {
      console.error(err);
      status.textContent = 'Error al guardar: ' + (err.message || err);
    }
  }

  // ============================================================================
  // TICKET
  // ============================================================================
  function ticketCode(player) {
    let hash = 0;
    const base = (player.player_key || '');
    for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    return 'MD26-' + hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  }

  function renderTicket() {
    const p = state.player;
    const preds = p.predictions || {};
    const ids = MATCHES.filter((m) => preds[m.id]).map((m) => m.id);

    const rows = ids.map((id) => {
      const m = MATCHES.find((x) => x.id === id);
      const pr = preds[id];
      return `
        <div class="ticket-row">
          <span class="tk-when">${escapeHtml(formatAR(m.kickoffUTC))}</span>
          <span class="tk-match">
            <img class="flag-xs" src="${flagUrl(m.home, 40)}" alt="" /> ${escapeHtml(teamName(m.home))}
            <b>${pr.h} - ${pr.a}</b>
            ${escapeHtml(teamName(m.away))} <img class="flag-xs" src="${flagUrl(m.away, 40)}" alt="" />
          </span>
        </div>`;
    }).join('') || '<p class="muted">No cargaste pronósticos.</p>';

    const updatedAt = p.updated_at ? formatAR(p.updated_at) : (p.confirmed_at ? formatAR(p.confirmed_at) : '—');
    const payRef = p.payment_reference
      ? `<div class="tk-line">Comprobante / Alias: <strong>${escapeHtml(p.payment_reference)}</strong></div>` : '';
    const payState = p.payment_validated
      ? '<span class="badge ok">Pago validado</span>'
      : '<span class="badge pending">Pago pendiente de validación</span>';

    $('#ticket').innerHTML = `
      <div class="ticket-head">
        <div class="logo-ph small">26</div>
        <div>
          <h2>Ticket de Jugadas</h2>
          <span class="muted">${escapeHtml(cfg.APP_TITLE)}</span>
        </div>
      </div>
      <div class="ticket-info">
        <div class="tk-line">Jugador: <strong>${escapeHtml(p.first_name + ' ' + p.last_name)}</strong></div>
        <div class="tk-line">Código: <strong>${ticketCode(p)}</strong></div>
        <div class="tk-line">Actualizado: <strong>${escapeHtml(updatedAt)} h</strong></div>
        ${payRef}
        <div class="tk-line">${cfg.ENTRY_ENABLED ? payState : ''}</div>
      </div>
      <div class="ticket-rows">${rows}</div>
      <div class="ticket-foot">
        <span>${ids.length} pronóstico(s)</span>
        <span class="muted">¡Mucha suerte! 🏆</span>
      </div>`;
  }

  // ============================================================================
  // RANKING
  // ============================================================================
  async function renderRanking() {
    const container = $('#rankingContainer');
    container.innerHTML = '<p class="muted">Cargando tabla...</p>';
    try {
      const [players, results] = await Promise.all([DB.getAllPlayers(), DB.getResults()]);
      state.results = results;
      const board = buildLeaderboard(players, results);
      const playedCount = Object.keys(results).length;

      if (!board.length) { container.innerHTML = '<p class="muted">Todavía no hay jugadores.</p>'; return; }

      container.innerHTML = `
        <p class="muted">${playedCount} partido(s) con resultado cargado.</p>
        <div class="table-wrap">
          <table class="ranking">
            <thead>
              <tr><th>#</th><th>Jugador</th><th>Pts</th><th>Aciertos</th><th>Exactos</th><th>Pago</th></tr>
            </thead>
            <tbody>
              ${board.map((r) => `
                <tr class="${state.player && r.player_key === state.player.player_key ? 'me' : ''}">
                  <td class="rank">${r.rank}</td>
                  <td>${escapeHtml(r.name)}</td>
                  <td class="pts">${r.points}</td>
                  <td>${r.hits}</td>
                  <td>${r.exact}</td>
                  <td>${r.payment_validated ? '✅' : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch (err) {
      console.error(err);
      container.innerHTML = '<p class="error">Error al cargar el ranking: ' + escapeHtml(err.message || '') + '</p>';
    }
  }

  // ============================================================================
  // ADMIN
  // ============================================================================
  function handleAdminLogin(e) {
    e.preventDefault();
    const pass = $('#adminPass').value;
    const errEl = $('#adminError');
    if (pass === cfg.ADMIN_PASSWORD) {
      state.adminAuthed = true;
      $('#adminLogin').hidden = true;
      $('#adminPanel').hidden = false;
      errEl.hidden = true;
      renderAdminResults();
    } else {
      errEl.textContent = 'Contraseña incorrecta.';
      errEl.hidden = false;
    }
  }

  async function syncResultsFromApi() {
    const btn = $('#syncApiBtn');
    const status = $('#syncApiStatus');
    btn.disabled = true;
    status.textContent = 'Sincronizando...';
    status.className = 'muted';
    try {
      const res = await fetch('/api/sync-results');
      const data = await res.json();
      if (!res.ok) {
        status.textContent = 'Error: ' + (data.error || res.status);
        status.className = 'error';
      } else if (data.synced === 0) {
        status.textContent = 'Sin resultados nuevos.';
        status.className = 'muted';
      } else {
        status.textContent = `Sincronizados: ${data.synced} partido(s) (${data.match_ids.join(', ')})`;
        status.className = 'badge ok';
        await renderAdminResults();
      }
    } catch (err) {
      status.textContent = 'Error de conexión: ' + err.message;
      status.className = 'error';
    } finally {
      btn.disabled = false;
    }
  }

  async function renderAdminResults() {
    const panel = $('#adminResults');
    panel.innerHTML = '<p class="muted">Cargando partidos...</p>';
    state.results = await DB.getResults();
    const groupLetters = Object.keys(GROUPS);
    panel.innerHTML = `
      <div class="sync-bar">
        <button class="btn small" id="syncApiBtn">Sincronizar desde API</button>
        <span id="syncApiStatus" class="muted"></span>
        <span class="muted small-note">Se actualiza automáticamente cada hora vía cron.</span>
      </div>
      ` + groupLetters.map((g) => {
      const matches = MATCHES.filter((m) => m.group === g);
      return `
        <section class="group">
          <h3 class="group-title">Grupo ${g}</h3>
          ${matches.map((m) => {
            const r = state.results[m.id];
            return `
              <div class="admin-match">
                <span class="am-when">${escapeHtml(formatAR(m.kickoffUTC))}</span>
                <span class="am-teams"><img class="flag-xs" src="${flagUrl(m.home, 40)}" alt="" loading="lazy" /> ${escapeHtml(teamName(m.home))} <span class="vs">vs</span> <img class="flag-xs" src="${flagUrl(m.away, 40)}" alt="" loading="lazy" /> ${escapeHtml(teamName(m.away))}</span>
                <span class="am-inputs">
                  <input type="number" min="0" class="goal" data-res="${m.id}" data-side="h" value="${r ? r.h : ''}" />
                  <span class="vs">-</span>
                  <input type="number" min="0" class="goal" data-res="${m.id}" data-side="a" value="${r ? r.a : ''}" />
                  <button class="btn small" data-save-res="${m.id}">Guardar</button>
                  <span class="res-status" data-resstatus="${m.id}"></span>
                </span>
              </div>`;
          }).join('')}
        </section>`;
    }).join('');

    panel.querySelectorAll('[data-save-res]').forEach((btn) => {
      btn.addEventListener('click', () => saveAdminResult(btn.dataset.saveRes));
    });

    const syncBtn = $('#syncApiBtn');
    if (syncBtn) syncBtn.addEventListener('click', syncResultsFromApi);
  }

  async function saveAdminResult(matchId) {
    const hEl = $(`input[data-res="${matchId}"][data-side="h"]`);
    const aEl = $(`input[data-res="${matchId}"][data-side="a"]`);
    const statusEl = $(`[data-resstatus="${matchId}"]`);
    const hv = hEl.value.trim(), av = aEl.value.trim();
    if (hv === '' || av === '') { statusEl.textContent = 'Cargá ambos goles'; return; }
    try {
      await DB.saveResult(matchId, Math.max(0, parseInt(hv, 10)), Math.max(0, parseInt(av, 10)));
      state.results[matchId] = { h: parseInt(hv, 10), a: parseInt(av, 10) };
      statusEl.textContent = '✓';
      setTimeout(() => { statusEl.textContent = ''; }, 1500);
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Error';
    }
  }

  async function renderAdminPlayers() {
    const panel = $('#adminPlayers');
    panel.innerHTML = '<p class="muted">Cargando jugadores...</p>';
    const players = await DB.getAllPlayers();
    if (!players.length) { panel.innerHTML = '<p class="muted">Aún no hay jugadores.</p>'; return; }

    panel.innerHTML = players.map((p) => {
      const count = Object.keys(p.predictions || {}).length;
      return `
        <div class="admin-player">
          <div class="ap-head">
            <strong>${escapeHtml(p.first_name + ' ' + p.last_name)}</strong>
            <span class="badge ${count >= MATCHES.length ? 'ok' : 'pending'}">${count}/${MATCHES.length} pronósticos</span>
          </div>
          <div class="ap-body">
            <span>DNI: <strong>${escapeHtml(p.dni || '—')}</strong></span>
            <label class="switch">
              <input type="checkbox" data-validate="${escapeHtml(p.player_key)}" ${p.payment_validated ? 'checked' : ''} />
              Acreditado
            </label>
            <button class="btn small ghost" data-view-plays="${escapeHtml(p.player_key)}">Ver jugadas</button>
          </div>
          <div class="ap-plays" data-plays="${escapeHtml(p.player_key)}" hidden></div>
        </div>`;
    }).join('');

    panel.querySelectorAll('[data-validate]').forEach((chk) => {
      chk.addEventListener('change', async () => {
        try { await DB.setPaymentValidated(chk.dataset.validate, chk.checked); }
        catch (err) { console.error(err); chk.checked = !chk.checked; alert('No se pudo guardar'); }
      });
    });
    panel.querySelectorAll('[data-view-plays]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.viewPlays;
        const box = panel.querySelector(`[data-plays="${CSS.escape(key)}"]`);
        const p = players.find((x) => x.player_key === key);
        if (box.hidden) { box.innerHTML = playerPlaysHTML(p); box.hidden = false; }
        else box.hidden = true;
      });
    });
  }

  function playerPlaysHTML(p) {
    const preds = p.predictions || {};
    const ids = MATCHES.filter((m) => preds[m.id]).map((m) => m.id);
    if (!ids.length) return '<p class="muted">Sin jugadas.</p>';
    return ids.map((id) => {
      const m = MATCHES.find((x) => x.id === id);
      const pr = preds[id];
      const res = state.results[id];
      const pts = res ? pointsForMatch(pr, res) : null;
      return `<div class="tk-line small">${escapeHtml(teamName(m.home))} <b>${pr.h}-${pr.a}</b> ${escapeHtml(teamName(m.away))}
        ${pts != null ? `<span class="badge ${pts === 2 ? 'ok' : pts === 1 ? 'open' : 'pending'}">${pts} pt</span>` : ''}</div>`;
    }).join('');
  }

  function switchAdminTab(tab) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    $('#adminResults').hidden = tab !== 'results';
    $('#adminPlayers').hidden = tab !== 'players';
    if (tab === 'results') renderAdminResults();
    else renderAdminPlayers();
  }

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  function applyConfigToUI() {
    // Tema (colores) de la liga: sobrescribe variables CSS en :root
    if (cfg.THEME && typeof cfg.THEME === 'object') {
      const root = document.documentElement;
      for (const varName in cfg.THEME) {
        if (cfg.THEME[varName]) root.style.setProperty(varName, cfg.THEME[varName]);
      }
    }
    // Logo de la liga (barra superior y hero), si está definido
    if (cfg.LOGO) {
      document.querySelectorAll('.brand-logo, .hero-logo').forEach((img) => {
        img.src = cfg.LOGO;
      });
    }

    $('#appTitle').textContent = cfg.APP_TITLE;
    $('#appSubtitle').textContent = cfg.APP_SUBTITLE;
    $('#lockMins').textContent = cfg.LOCK_MINUTES;
    const ruleLock = $('#ruleLock'); if (ruleLock) ruleLock.textContent = cfg.LOCK_MINUTES;
    document.title = cfg.APP_TITLE;

    if (cfg.ENTRY_ENABLED) {
      $('#entryBox').hidden = false;
      $('#entryCost').textContent = cfg.ENTRY_COST;
      $('#entryAlias').textContent = cfg.ENTRY_ALIAS;
      $('#entryNote').textContent = cfg.ENTRY_NOTE;
    }

    const note = $('#backendNote');
    note.textContent = DB.isRemote()
      ? '🟢 Conectado al servidor compartido (multijugador).'
      : '🟡 Modo demo (sin backend): los datos quedan solo en este navegador. Configurá Supabase en js/config.js para jugar entre varios.';
  }

  function bindEvents() {
    $('#loginForm').addEventListener('submit', handleLogin);
    $('#logoutBtn').addEventListener('click', logout);
    $('#saveDraftBtn').addEventListener('click', savePlays);
    $('#ticketBtn').addEventListener('click', () => { renderTicket(); showView('ticket'); });
    $('#printBtn').addEventListener('click', () => window.print());
    $('#backFromTicket').addEventListener('click', () => { renderGroups(); showView('fixture'); });
    $('#adminForm').addEventListener('submit', handleAdminLogin);

    $$('.nav-btn[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view === 'fixture') {
          renderGroups(); showView('fixture');
        } else if (view === 'ranking') {
          showView('ranking'); renderRanking();
        } else if (view === 'admin') {
          showView('admin');
          if (state.adminAuthed) { $('#adminPanel').hidden = false; $('#adminLogin').hidden = true; }
        }
      });
    });

    $$('.tab').forEach((t) => t.addEventListener('click', () => switchAdminTab(t.dataset.tab)));

    // Re-evaluar bloqueos cada 30s (cierra partidos en vivo sin recargar).
    setInterval(() => {
      if (!$('#view-fixture').hidden) refreshLocks();
    }, 30000);
  }

  async function init() {
    applyConfigToUI();
    bindEvents();

    // Sincronizar reloj con el servidor para un bloqueo uniforme entre clientes.
    try {
      const serverNow = await DB.getServerNow();
      state.clockOffset = serverNow - Date.now();
    } catch (e) { state.clockOffset = 0; }

    // Restaurar sesión si el jugador ya había ingresado en esta pestaña.
    const savedKey = sessionStorage.getItem(SESSION_KEY);
    if (savedKey) {
      try {
        const player = await DB.getPlayer(savedKey);
        if (player) { state.player = player; enterApp(); return; }
      } catch (e) { console.warn('No se pudo restaurar la sesión:', e.message); }
    }
    showView('welcome');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
