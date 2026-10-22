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
✅ El enlace al toolkit propio del pie ya resuelve: `github.com/rcm-on/tsql-lineage-toolkit` está **público** (2026-07-25).

## Serie "T-SQL Lineage Toolkit" (producto + método)

| # | Artículo (blog) | Post LinkedIn | Estado | Fecha blog | Fecha LinkedIn |
|---|---|---|---|---|---|
| 1 | 02 Laboratorios/tsql-lineage-toolkit | tsql-lineage-toolkit | 📤 Blog publicado, falta LinkedIn | 2026-06-17 | _pendiente_ |
| 2 | 04 Arquitectura IA/medir-agentes-no-scripts | medir-agentes-no-scripts | ✅ Listo para lanzar | _pendiente_ | _pendiente_ |
| 3 | 04 Arquitectura IA/orquestar-un-equipo-de-modelos | orquestar-un-equipo-de-modelos | 📤 Blog publicado, falta LinkedIn | 2026-08-10 | _pendiente_ |

Orden sugerido: **1 primero** (el producto, con el repo ya público como CTA) → 2 → 3 (el método detrás). Cada carpeta lleva su `imagen.png` generada con `_generador/imagen.template.py` (1080×1350, marca navy × coral).

✅ **El 1 ya no está bloqueado.** Las cifras se cerraron el 2026-07-26 con la
ejecución canónica del toolkit (`docs/ejecucion-canonica.md`, commit `f19b4de`):
el "47 vs 64" eran dos escalas legítimas —47 módulos en `sys.sql_modules`, 64 en
el grafo porque descubre 17 triggers creados en runtime. Artículo, capturas y
texto del post ya están al día. **Es el siguiente que sale.**

## Serie "Método" (las nueve capas · verificado 2026-08-22)

| # | Artículo (blog) | Post LinkedIn | Estado | Fecha blog | Fecha LinkedIn |
|---|---|---|---|---|---|
| 0 | 04 Arquitectura IA/ratchet-efecto-memoria-agente | _sin preparar_ | 📤 Blog publicado, falta LinkedIn | 2026-08-22 | _pendiente_ |
| 1 | 04 Arquitectura IA/doce-fallos-en-mi-herramienta | _sin preparar_ | 📤 Blog publicado, falta LinkedIn | 2026-08-22 | _pendiente_ |
| 2 | 04 Arquitectura IA/como-se-encarga-trabajo-a-un-agente | _sin preparar_ | ⏳ Por preparar | _pendiente_ | _pendiente_ |
| 3 | 04 Arquitectura IA/un-solo-corpus-te-engana | _sin preparar_ | ⏳ Por preparar | _pendiente_ | _pendiente_ |
| 4 | 04 Arquitectura IA/cambiar-el-instrumento-de-medida | _sin preparar_ | ⏳ Por preparar | _pendiente_ | _pendiente_ |
| 5 | 04 Arquitectura IA/quien-valida-al-validador | _sin preparar_ | ⏳ Por preparar | _pendiente_ | _pendiente_ |

⚠️ **Deuda de enlaces**: para que el 1 pudiera salir solo se le quitaron 4 enlaces
a borradores (la línea "serie de cuatro", `datos-navegables`,
`confiabilidad-no-viene-del-modelo` y el "sigue en la serie" del pie).
**Al publicar el 2, hay que devolvérselos.**

🗑️ `capas-de-verificacion.md` es duplicado del 1 (mismo título y descripción, cero
enlaces entrantes). Pendiente de borrar.

📐 Formato de imagen por post (ver `_generador/prompts-imagen-gemini.md`):
0 y 1 → **ilustración** (son tesis). 2 → **cheat sheet imprimible** (es la plantilla
de encargo, lo más guardable de la serie). 3, 4, 5 → ilustración.

## Ritmo sugerido

- Publicar el artículo en el blog.
- Publicar en LinkedIn 1 día después (para que el link ya esté indexado).
- Dejar 3-4 días entre cada artículo de la serie, para no saturar el feed.

## Leyenda de estados

- ⏳ Por preparar — aún no existe el carrusel ni el texto
- ✅ Listo para lanzar — carrusel + texto ya en su carpeta, pendiente de programar
- 📅 Programado — ya está metido en LinkedIn con fecha futura
- ✔️ Publicado — ya salió, tanto blog como LinkedIn
- ⛔ Bloqueado — el material existe pero hay algo que impide publicarlo (ver la nota de la serie)
- 📤 Blog publicado, falta LinkedIn — el artículo ya está vivo pero el post no ha salido

## Notas operativas

- Recordar quitar `draft: true` en el frontmatter antes de cada publicación de blog.
- **El formato depende del tipo de post** (decidido 2026-08-22, sustituye a la regla
  anterior de "nunca PDF"):
  - **Post de tesis** (algo pasó y significa algo) → **una sola imagen** potente.
    Sigue valiendo el motivo de antes: va más directa que un carrusel.
  - **Post de proceso / método / comandos** → **cheat sheet en PDF**, carrusel e
    imprimible. Aquí el criterio se invierte a propósito: que se lo lleven **es** el
    objetivo. Un cheat sheet colgado en el monitor de alguien durante meses vale más
    que proteger el material.
  - La prueba: ¿el lector querría *guardarlo* para el lunes? → PDF. ¿Querría
    *entenderlo* y seguir leyendo? → imagen única.
- Programar cada post desde el propio LinkedIn (icono de reloj al redactar).
- Cada carpeta `NN-nombre-post/` dentro de `private/linkedin/` contiene
  `texto-post.md` + **o bien** `imagen.png` (post de tesis) **o bien**
  `cheatsheet.pdf` + `cheatsheet-print.pdf` (post de proceso). Nunca las dos cosas.
- **El logo nunca lo dibuja el modelo de imagen.** Se estampa después con
  `python private/linkedin/_generador/marca.py imagen.png --pdf`, que lo toma de
  `quartz/static/icon.png`. Opacidad medida: 0,30 (0,38 en portada).
