Prepara TODO el material de LinkedIn para un post del blog: carpeta, texto y
una imagen única con el estilo de la web. Solo tienes que indicarme sobre qué post.

## Dato que necesito

Pídemelo si no te lo he dado ya:
- SLUG_O_RUTA del artículo del blog (p. ej. `litellm-multiproveedor` o la ruta al .md).

Todo lo demás lo deduces del artículo.

## Procedimiento fijo

1. **Localiza y lee el artículo** en `content/**/<slug>.md`. Si no existe, detente y dímelo.

2. **Crea la carpeta** `private/linkedin/<slug>/` si no existe. Contendrá
   **una imagen** (`imagen.png`) + `texto-post.md`, y —si la imagen es una ilustración
   generada— su fuente editable `hero.svg`. Nada más.
   **Nunca PDF ni carrusel**: el post lleva una sola imagen (no descargable, más directa
   que un deck).

3. **Escribe `texto-post.md`** con el mismo formato que los existentes en
   `private/linkedin/` (mira `litellm-multiproveedor` o `graphify-grafo-navegable`):
   - Cabecera: `**Artículo:**`, `**Adjunto:** una sola imagen`, `**Fecha sugerida:**`.
     Esta cabecera es nota interna del fichero — sí puede llevar markdown, no se pega en LinkedIn.
   - `## Texto del post`: gancho fuerte en la primera línea, **texto corto** y sintetizado,
     cierre con `[LINK AL ARTÍCULO]`.
   - Si el lab lo pide, una frase para copiar y pegar con un prompt que el lector
     pega a su agente, integrada en el mismo bloque de texto (ver regla de formato abajo).
   - Hashtags al final acordes al tema.
   - Tono: experto, directo, **sin hype**. Voz de Ramón Campos Martín.

   **⚠️ LinkedIn no interpreta markdown — todo lo que va bajo `## Texto del post`
   tiene que ser texto plano, listo para copiar y pegar tal cual:**
   - Nada de `**negrita**`, `` `backticks` `` ni bloques ```` ```código``` ````:
     LinkedIn los muestra como caracteres literales (asteriscos y comillas invertidas
     de sobra), no los renderiza.
   - Las flechas `→`, los emoji y los `#hashtags` sí son texto plano normal — esos se quedan.
   - Los saltos de línea/párrafo en blanco sí funcionan en LinkedIn — para dar
     estructura usa solo eso, nunca encabezados `##` ni `---` dentro de esa sección.
   - Marca la sección en el propio fichero como
     `## Texto del post (LISTO PARA PEGAR — texto plano)`, para que quien lo lea
     no tenga dudas de qué parte es la que se copia tal cual.

4. **La imagen** (`imagen.png`): una sola, potente. Dos opciones según el post:
   - **Captura del lab** (lo más honesto para labs): una pantalla real del resultado
     — el grafo, el dashboard, la salida de un comando. Mira primero en
     `quartz/static/labs/<lab>/`, que es de donde salen las capturas del artículo.
     Si no la hay, deja el hueco y recuérdame que la capture yo al ejecutarlo.
     **No inventes capturas ni las simules.**
   - **Ilustración de marca** (para artículos de concepto, o para un lab si prefiero
     titular a captura): se genera con la plantilla, nunca a mano.
   - Si el usuario ya te pasa una imagen terminada, úsala en vez de generar.

   **Cómo se genera** (no tienes generador de imágenes; se renderiza con Chrome
   headless, el mismo motor que pinta el blog):

   1. Copia `private/linkedin/_generador/imagen.template.py` al scratchpad como `build.py`.
   2. Edita **solo** el bloque de contenido: badge, título (con `<span class="hl">`
      en el remate), subtítulo, y `.metrics` (datos medidos) o `ul.bullets`.
   3. `python build.py` → `imagen.png` 1080×1350, y cópiala a la carpeta del post.

   Referencia visual de cómo debe quedar: `private/linkedin/graphify-grafo-navegable/`.

5. **Actualiza `private/linkedin/calendario-editorial.md`**: añade o actualiza la fila
   del post (solo valores de celdas, no el formato de tabla). Si es de una serie nueva,
   crea su sub-tabla como la de "LiteLLM".

6. **Resume** qué se creó/modificó y recuérdame que `[LINK AL ARTÍCULO]` es un
   placeholder que relleno yo al publicar, y que revise la imagen antes de subirla.

No hagas commit ni push — lo reviso yo antes.

## Marca — reglas fijas (NO improvisar)

Las mismas del carrusel; están en la cabecera de `_generador/imagen.template.py` y
`_generador/carrusel.template.py`, y la paleta sale de `quartz.config.ts` (`darkMode`).
Si algo cambia, manda el CSS del blog.

- **Vertical 4:5, 1080×1350.** Nunca horizontal: ocupa ~2× más pantalla en móvil.
- **Navy `#0d1424`** + malla blueprint blanca tenue de dos niveles (es *el fondo*)
  + aurora coral/índigo. Títulos `#eef2f8`, cuerpo `#c7d2e2`, gris `#8294b3`.
- **Acento coral `#ff6b6b`**, único acento cálido: badge, rail, remate del título,
  la cifra que importa. **Nunca ámbar, naranja ni amarillo.**
- **Marca de agua: el icono `m.`** (el mismo de `quartz/static/icon.svg`), coral tenue,
  anclado al borde derecho. **Nunca la R.** (retirada) ni el wordmark completo.
- **Footer siempre**: `Ramón Campos Martín · IA en producción, sin hype` + `blog.rcmon.dev`.
- **Tipografía**: Space Grotesk (títulos), Inter (cuerpo), JetBrains Mono (código y datos).
- Las cifras de `.metrics` son **datos medidos del artículo**. Contrástalas con el `.md`
  antes de ponerlas; si no están medidas, no van.
