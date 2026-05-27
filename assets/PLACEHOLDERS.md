# Imágenes (placeholders)

Esta carpeta es para tus imágenes propias. La app funciona sin ellas: usa
marcadores de posición para el **logo** y las **mascotas**.

Para reemplazarlos por los oficiales:

- **Logo**: dejá tu archivo en `assets/logo.png` y, en `index.html`, cambiá el
  bloque `<div class="logo-ph">26</div>` por
  `<img src="assets/logo.png" alt="Logo" class="logo-img" />`.
- **Mascotas**: dejá las imágenes en `assets/` y reemplazá los
  `<div class="mascot-ph">…</div>` por `<img>` en la sección de bienvenida.

> Las **banderas** NO van acá: se cargan dinámicamente desde
> `https://flagcdn.com` (no uses archivos locales para banderas).
