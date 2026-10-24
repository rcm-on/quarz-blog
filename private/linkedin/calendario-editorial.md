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
| 1 | 02 Laboratorios/tsql-lineage-toolkit | tsql-lineage-toolkit | ✔️ Publicado | 2026-06-17 | 2026-08-01 |
| 2 | 04 Arquitectura IA/medir-agentes-no-scripts | medir-agentes-no-scripts | ✅ Listo para lanzar | _pendiente_ | _pendiente_ |
| 3 | 04 Arquitectura IA/orquestar-un-equipo-de-modelos | orquestar-un-equipo-de-modelos | ✔️ Publicado | 2026-08-10 | 2026-08-23 |

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
| 1 | 04 Arquitectura IA/doce-fallos-en-mi-herramienta | doce-fallos-en-mi-herramienta | ✔️ Publicado | 2026-07-30 | **2026-10-24** |
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


---

## Rendimiento real en LinkedIn (export 2025-10-23 → 2026-10-22)

Cruzado con los hashtags de cada `texto-post.md`. **El calendario llevaba cuatro
errores**: daba por no publicados posts que sí salieron.

| Fecha | Post | Formato | Impr. | Alcanz. | Fuera red | Guard. | Clics |
|---|---|---|---|---|---|---|---|
| 2026-08-23 | orquestar-un-equipo-de-modelos | Imagen | 171 | 87 | 43% | 0 | 2 |
| 2026-08-01 | tsql-lineage-toolkit | Imagen | 254 | 87 | 31% | 0 | 0 |
| 2026-07-18 | graphify-grafo-navegable | Imagen | 668 | 179 | 26% | 0 | 0 |
| 2026-07-11 | litellm-multiproveedor | **Documento** | **725** | **400** | **62%** | **3** | 0 |
| 2026-05-22 | documentacion-poder-conocimiento | Imagen | 186 | 59 | 23% | 0 | 0 |
| 2026-05-15 | harness-engineering | **Documento** | 428 | 176 | 34% | 1 | 0 |

Más cuatro posts de opinión/enlace sin artículo detrás (2026-07-24 repost: 70 impr.
con 99% dentro de la red; 2026-06-02 y 2025-12-12 texto; 2026-05-13 vídeo).

**Totales del año: 10 posts · 2.902 impresiones · 1.160 alcanzados · 2 seguidores
ganados · 22 visitas al perfil · 4 guardados · 9 clics a enlace.** Último post:
2026-08-23 — dos meses de silencio.

### Lo que dicen los datos

- **El formato Documento es el que más alcanza**: los dos únicos que hay son el 1º
  y el 3º por impresiones, y se llevan **los 4 guardados del año**. N=2, no es
  prueba, pero es la única señal que hay. Contradice la regla de "post de tesis →
  una sola imagen".
- **Texto, vídeo y repost pierden**: 90, 179, 131 y 70 impresiones. El repost tuvo
  el 99% dentro de la red propia: no sirve para alcanzar a nadie nuevo.
- **LinkedIn no manda tráfico al blog**: 9 clics en todo el año, y los 7 mejores
  son de un post que era solo un enlace. El post del toolkit tuvo **0 clics**.
- **Nada convierte**: 2 seguidores en 12 meses con 1.160 personas alcanzadas.

### Nunca publicados en LinkedIn (texto ya escrito)

- ~~`doce-fallos-en-mi-herramienta`~~ — **publicado el 2026-10-24**, en formato Documento (`cheatsheet.pdf`, 10 páginas) con el enlace en el primer comentario. Primer Documento desde julio: medir impresiones y guardados hacia el 2026-10-31.
- `medir-agentes-no-scripts` — texto listo (531), pero el artículo sigue en `draft: true`.
- `01-coste-conocimiento`, `02-onboarding-talento`, `03-talento-apagado` — textos y carruseles listos, artículos en `draft: true`.
- `ratchet-efecto-memoria-agente` — artículo vivo, sin texto preparado.


---

## Medición pendiente — doce-fallos (publicado 2026-10-24)

Primer post en formato **Documento** desde el de LiteLLM (2026-07-11). Hacia el
**2026-10-31** hay que exportar el rendimiento y anotar aquí:

| Dato | LiteLLM (Documento) | harness (Documento) | doce-fallos |
|---|---|---|---|
| Impresiones | 725 | 428 | _pendiente_ |
| Alcanzados | 400 | 176 | _pendiente_ |
| Fuera de la red | 62% | 34% | _pendiente_ |
| Guardados | 3 | 1 | _pendiente_ |
| Seguidores ganados | 0 | 0 | _pendiente_ |

Con tres Documentos medidos ya se puede decir si el formato aguanta o si el 725
de LiteLLM fue suerte. Hasta entonces, N=2 y no es prueba de nada.

**Novedad respecto a los dos anteriores:** el enlace va en el primer comentario,
no en el cuerpo. Si los clics suben de forma apreciable sobre los 9 de todo el
año anterior, esa decisión se queda.
