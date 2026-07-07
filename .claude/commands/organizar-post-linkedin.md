# .claude/commands/organizar-post-linkedin.md

Voy a darte los datos de UN post de la serie de LinkedIn. Ejecuta siempre 
el mismo procedimiento con esos datos, sin improvisar pasos nuevos.

## Datos de este post

Pídeme estos datos si no te los he dado ya en el mensaje:
- SLUG_ARTICULO
- NUMERO_POST
- NOMBRE_CARPETA
- ARCHIVO_PDF_ORIGEN
- ARCHIVO_TEXTO_ORIGEN
- RUTA_ARTICULO_BLOG
- QUITAR_DRAFT (sí/no)

## Procedimiento fijo

1. Verifica que existen ARCHIVO_PDF_ORIGEN, ARCHIVO_TEXTO_ORIGEN y RUTA_ARTICULO_BLOG.
   Si falta alguno, detente y dímelo.
2. Crea la carpeta `private/linkedin/NOMBRE_CARPETA/` si no existe.
3. Copia ARCHIVO_PDF_ORIGEN a `private/linkedin/NOMBRE_CARPETA/carousel.pdf`.
4. Copia ARCHIVO_TEXTO_ORIGEN a `private/linkedin/NOMBRE_CARPETA/texto-post.md`.
   (La carpeta solo contiene esos dos archivos, nunca más.)
5. Si QUITAR_DRAFT es "sí", elimina la línea `draft: true` del frontmatter de
   RUTA_ARTICULO_BLOG. Si es "no", no toques el artículo.
6. Actualiza la fila de NUMERO_POST en `private/linkedin/calendario-editorial.md`:
   pon el estado en "✅ Listo para lanzar" (solo cambia valores de celdas, no el
   formato de la tabla).
7. Resume qué archivos se han creado/modificado.

No hagas commit ni push — lo reviso yo antes.