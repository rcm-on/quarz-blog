# Calendario editorial — Serie "Conocimiento retenido"

> Este archivo lo mantiene el comando `/organizar-post-linkedin` de Claude Code.
> No editar el formato de la tabla manualmente — solo los valores de las celdas.

## Estado

| # | Artículo (blog) | Post LinkedIn | Estado | Fecha blog | Fecha LinkedIn |
|---|---|---|---|---|---|
| 1 | coste-conocimiento-retenido-organizaciones | 01-coste-conocimiento | ✅ Listo para lanzar | _pendiente_ | _pendiente_ |
| 2 | onboarding-talento-desperdiciado | 02-onboarding-talento | ✅ Listo para lanzar | _pendiente_ | _pendiente_ |
| 3 | talento-que-se-apaga | 03-talento-apagado | ✅ Listo para lanzar | _pendiente_ | _pendiente_ |

## Orden de lanzamiento (no cambiar)

Los artículos están enlazados entre sí en el footer ("relacionados"),
así que hay que respetar el orden numérico: 1 → 2 → 3 → ...

---

## Serie "LiteLLM"

| # | Artículo (blog) | Post LinkedIn | Estado | Fecha blog | Fecha LinkedIn |
|---|---|---|---|---|---|
| 1 | litellm-multiproveedor | litellm-multiproveedor | ✔️ Publicado | 2026-07-08 | 2026-07-11 |

Independiente de la serie "Conocimiento retenido" — no comparte orden ni footer de relacionados.

## Serie "Datos navegables para agentes"

| # | Artículo (blog) | Post LinkedIn | Estado | Fecha blog | Fecha LinkedIn |
|---|---|---|---|---|---|
| 1 | graphify-grafo-navegable | graphify-grafo-navegable | ✔️ Publicado | 2026-07-18 | 2026-07-18 |

Par concepto↔lab: `04 Arquitectura IA/datos-navegables-para-agentes` (artículo) ↔ `02 Laboratorios/graphify-grafo-navegable` (lab), enlazados entre sí.
⚠️ El artículo pareja aún tiene en el pie un enlace al toolkit propio, que **no está publicado**: revisar antes de publicar el artículo.

## Ritmo sugerido

- Publicar el artículo en el blog.
- Publicar en LinkedIn 1 día después (para que el link ya esté indexado).
- Dejar 3-4 días entre cada artículo de la serie, para no saturar el feed.

## Leyenda de estados

- ⏳ Por preparar — aún no existe el carrusel ni el texto
- ✅ Listo para lanzar — carrusel + texto ya en su carpeta, pendiente de programar
- 📅 Programado — ya está metido en LinkedIn con fecha futura
- ✔️ Publicado — ya salió, tanto blog como LinkedIn

## Notas operativas

- Recordar quitar `draft: true` en el frontmatter antes de cada publicación de blog.
- **NO subir PDF ni carrusel.** Cada post lleva **una sola imagen o ilustración** potente
  (una captura del lab, o una ilustración del concepto). Motivo: el PDF/Documento es
  descargable y no queremos que nadie se lleve el deck; y una imagen única va más directa
  que un carrusel para estos posts.
- Programar cada post desde el propio LinkedIn (icono de reloj al redactar).
- Cada carpeta `NN-nombre-post/` dentro de `private/linkedin/` contiene siempre
  **una imagen** (`imagen.png` o similar) + `texto-post.md`, nunca más archivos.
  (Se deja de generar/guardar `carousel.pdf` y las slides.)
