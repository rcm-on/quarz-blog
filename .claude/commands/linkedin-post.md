Prepara TODO el material de LinkedIn para un post del blog: carpeta, texto y
una imagen única con el estilo de la web. Solo tienes que indicarme sobre qué post.

## Dato que necesito

Pídemelo si no te lo he dado ya:
- SLUG_O_RUTA del artículo del blog (p. ej. `litellm-multiproveedor` o la ruta al .md).

Todo lo demás lo deduces del artículo.

## Procedimiento fijo

1. **Localiza y lee el artículo** en `content/**/<slug>.md`. Si no existe, detente y dímelo.

2. **Crea la carpeta** `private/linkedin/<slug>/` si no existe. Contendrá SIEMPRE
   exactamente dos cosas: **una imagen** (`imagen.png`) + `texto-post.md`.
   **Nunca PDF ni carrusel**: el post lleva una sola imagen (no descargable, más directa
   que un deck).

3. **Escribe `texto-post.md`** con el mismo formato que los existentes en
   `private/linkedin/` (mira `litellm-multiproveedor` o `graphify-grafo-navegable`):
   - Cabecera: `**Artículo:**`, `**Adjunto:** una sola imagen`, `**Fecha sugerida:**`.
   - `## Texto del post`: gancho fuerte en la primera línea, **texto corto** y sintetizado,
     cierre con `[LINK AL ARTÍCULO]`.
   - Si el lab lo pide, un bloque `## Frase para copiar y pegar` con un prompt en ```text```
     que el lector pega a su agente.
   - Hashtags al final acordes al tema.
   - Tono: experto, directo, **sin hype**. Voz de Ramón Campos Martín.

4. **La imagen** (`imagen.png`): una sola, potente. Dos opciones según el post:
   - **Captura del lab** (lo más honesto para labs): una pantalla real del resultado
     — el grafo, el dashboard, la salida de un comando. Si no la tienes, deja el hueco
     y recuérdame que la capture yo al ejecutarlo; no inventes capturas.
   - **Ilustración esquemática de marca** (para artículos de concepto): un diagrama del
     problema→solución, NO stock-art ni AI-art genérico. Reglas de estilo: navy `#0d1424`,
     grid blueprint y acento coral `#ff6b6b`, watermark **m.** (nunca la R.), y firma
     `Ramón Campos Martín · IA en producción, sin hype`.
   - Si el usuario ya te pasa una imagen terminada, úsala en vez de generar.

5. **Actualiza `private/linkedin/calendario-editorial.md`**: añade o actualiza la fila
   del post (solo valores de celdas, no el formato de tabla). Si es de una serie nueva,
   crea su sub-tabla como la de "LiteLLM".

6. **Resume** qué se creó/modificó y recuérdame que `[LINK AL ARTÍCULO]` es un
   placeholder que relleno yo al publicar, y que revise la imagen antes de subirla.

No hagas commit ni push — lo reviso yo antes.
