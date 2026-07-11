Prepara TODO el material de LinkedIn para un post del blog: carpeta, texto y
carrusel PDF con el estilo de la web. Solo tienes que indicarme sobre qué post.

## Dato que necesito

Pídemelo si no te lo he dado ya:
- SLUG_O_RUTA del artículo del blog (p. ej. `litellm-multiproveedor` o la ruta al .md).

Todo lo demás lo deduces del artículo.

## Procedimiento fijo

1. **Localiza y lee el artículo** en `content/**/<slug>.md`. Si no existe, detente y dímelo.

2. **Crea la carpeta** `private/linkedin/<slug>/` si no existe. Contendrá SIEMPRE
   exactamente dos archivos: `carousel.pdf` + `texto-post.md`. Nada más.

3. **Escribe `texto-post.md`** con el mismo formato que los existentes en
   `private/linkedin/` (mira `01-coste-conocimiento` o `litellm-multiproveedor`):
   - Cabecera: `**Artículo:**`, `**Adjunto:** carousel.pdf`, `**Fecha sugerida:**`.
   - `## Texto del post`: gancho fuerte en la primera línea, desarrollo sintetizado,
     cierre con `[LINK AL ARTÍCULO]`.
   - Hashtags al final acordes al tema.
   - Tono: experto, directo, **sin hype**. Voz de Ramón Campos Martín.

4. **Genera el carrusel** `carousel.pdf` (vertical 4:5, modo oscuro, estilo web):
   - Copia `private/linkedin/_generador/carrusel.template.py` al scratchpad como `build.py`.
   - Edita SOLO `build_slides()` con el contenido del post: 6-8 slides, una idea por
     slide, copy sintetizado y potente. Portada + problema + solución + 1-2 de
     código/detalle + resultado/CTA. Ajusta `TOTAL` y `KICKER_BADGE`.
   - La **última slide es SIEMPRE el cierre con wordmark `rcmon`** (partición A: rcm +
     on coral) — el placeholder de la plantilla ya la trae; conserva su estructura.
   - Reglas de estilo que NO se tocan (están en la plantilla): **1080x1350 (4:5 vertical)**,
     navy `#0d1424` + grid blueprint + acento coral `#ff6b6b`, watermark **m.** (nunca la R.),
     y footer SIEMPRE `Ramón Campos Martín · IA en producción, sin hype`.
   - Ejecuta `python build.py`, **revisa al menos la portada y una slide de código**
     leyendo los PNG, y copia el `carousel.pdf` resultante a `private/linkedin/<slug>/`.
   - Requiere **Space Grotesk instalada** para la tipografía correcta; si no lo está,
     el título cae a Segoe UI (peor). Si el usuario ya te pasa un PDF terminado, úsalo
     en vez de regenerar.

5. **Actualiza `private/linkedin/calendario-editorial.md`**: añade o actualiza la fila
   del post a `✅ Listo para lanzar` (solo valores de celdas, no el formato de tabla).
   Si es de una serie nueva, crea su sub-tabla como la de "LiteLLM".

6. **Resume** qué se creó/modificó y recuérdame que `[LINK AL ARTÍCULO]` es un
   placeholder que relleno yo al publicar, y que revise el PDF antes de subirlo.

No hagas commit ni push — lo reviso yo antes.
