/*
 * scoring.js — Reglas de puntuación y armado del ranking
 * ======================================================
 * Regla acordada:
 *   +1 punto  si acertás el resultado (ganador local, visitante o empate)
 *   +1 punto  ADICIONAL si además coincide el marcador exacto
 *   => máximo 2 puntos por partido.
 */

// Puntos de UNA predicción contra UN resultado oficial. pred/res = { h, a }.
function pointsForMatch(pred, res) {
  if (!pred || !res) return 0;
  if (pred.h == null || pred.a == null || res.h == null || res.a == null) return 0;

  let pts = 0;
  const outcome = (m) => Math.sign(m.h - m.a); // 1 = gana local, -1 = gana visitante, 0 = empate
  if (outcome(pred) === outcome(res)) pts += 1; // acierta el resultado (ganador/empate)
  if (pred.h === res.h && pred.a === res.a) pts += 1; // acierta el marcador exacto
  return pts; // 0, 1 o 2
}

// Desglose de un jugador sobre todos los resultados cargados.
// players: [{ player_key, first_name, last_name, predictions, payment_validated, ... }]
// results: { matchId: { h, a }, ... }
function buildLeaderboard(players, results) {
  const rows = players.map((p) => {
    let points = 0;
    let exact = 0;   // marcadores exactos
    let hits = 0;    // resultados acertados (ganador/empate), incluye exactos
    const preds = p.predictions || {};

    for (const matchId of Object.keys(results)) {
      const res = results[matchId];
      const pred = preds[matchId];
      const pts = pointsForMatch(pred, res);
      points += pts;
      if (pts >= 1) hits += 1;
      if (pts === 2) exact += 1;
    }

    return {
      player_key: p.player_key,
      name: `${p.first_name} ${p.last_name}`.trim(),
      points,
      hits,
      exact,
      payment_validated: !!p.payment_validated,
    };
  });

  // Orden: más puntos, luego más exactos, luego más aciertos, luego alfabético.
  rows.sort((a, b) =>
    b.points - a.points ||
    b.exact - a.exact ||
    b.hits - a.hits ||
    a.name.localeCompare(b.name, 'es')
  );

  // Asignar puesto con empates compartidos (mismo puntaje => mismo puesto).
  let lastPoints = null;
  let lastRank = 0;
  rows.forEach((row, i) => {
    if (row.points !== lastPoints) {
      lastRank = i + 1;
      lastPoints = row.points;
    }
    row.rank = lastRank;
  });

  return rows;
}

window.PRODE_SCORING = { pointsForMatch, buildLeaderboard };
