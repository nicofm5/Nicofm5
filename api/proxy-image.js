// api/proxy-image.js — Proxy de imágenes de Supabase Storage
// ============================================================================
// Sirve una imagen externa desde el mismo dominio de la app. Esto permite
// que el canvas del navegador la lea con getImageData() (necesario para el
// recorte automático de los logos de liga). Whitelist a Supabase Storage:
// no proxiamos cualquier URL para evitar abuso.

export default async function handler(req, res) {
  const url = req.query && req.query.url;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'param "url" requerido' });
    return;
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\//.test(url)) {
    res.status(403).json({ error: 'host no permitido' });
    return;
  }
  try {
    const r = await fetch(url);
    if (!r.ok) {
      res.status(r.status).send(`upstream ${r.status}`);
      return;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buf);
  } catch (e) {
    res.status(502).json({ error: String(e && e.message || e) });
  }
}
