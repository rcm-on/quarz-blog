# ARCH.md — Contexto de arquitectura para agentes IA

> Este archivo es el contrato operativo del proyecto. Todo agente o asistente de IA que trabaje
> en este repositorio debe leerlo antes de actuar. No es documentación — es contexto de trabajo.

---

## Qué es este proyecto

Blog técnico de Ramón Campos Martin publicado con **Quartz 4** en GitHub Pages.
Dominio: Arquitectura de software, DevOps e IA.
Audiencia: arquitectos, ingenieros senior, equipos técnicos.
Tono: directo, con criterio propio, sin hype. Primera persona cuando aplica.

URL producción: `https://rcm-on.github.io/quarz-blog/`
Rama principal: `v4`

---

## Estructura de contenido

```
content/
├── index.md                    ← home, solo enlaza lo que existe
├── 01 Artículos/               ← artículos de opinión y análisis
├── 02 Laboratorios/            ← experimentos prácticos con código
├── 03 Guidelines/              ← estándares y convenciones
├── 04 Arquitectura IA/         ← arquitectura de sistemas con IA
│   └── index.md                ← índice con mindmap de la categoría
├── private/                    ← NUNCA se publica (ignorado por Quartz)
└── templates/                  ← plantillas Obsidian (ignoradas por Quartz)
```

### Reglas de contenido

- **No crear** enlaces en `index.md` a artículos que no existen aún.
- **No publicar** nada en `private/` — es solo para borradores y notas personales.
- **Frontmatter obligatorio**: `title`, `date`, `tags`, `description`.
- `draft: true` excluye el artículo del build aunque esté en una carpeta pública.

---

## Convenciones de escritura

- Artículos: máximo 800-1200 palabras. Un concepto por artículo.
- Diagramas: Mermaid integrado en el Markdown. Sin `style fill:` hardcoded — dejar el tema por defecto.
- Citas de fuentes: al final del artículo en bloque `>`.
- No usar emojis en el cuerpo del texto.
- Encabezados: `##` y `###` únicamente dentro de artículos. Nunca `#` (lo genera Quartz desde `title`).

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| SSG | Quartz 4.5.2 |
| Editor | Obsidian |
| Hosting | GitHub Pages |
| Deploy | GitHub Actions |
| Estilos custom | `quartz/styles/custom.scss` |
| Tipografía | Manrope (headers) / Source Sans 3 (body) / JetBrains Mono (code) |
| Paleta | Índigo `#4338ca` (primario) + Coral `#f97316` (acento) |

---

## Sistema de diseño

Los tokens de marca están en `quartz/styles/custom.scss` bajo el prefijo `--rcm-*`.
Los colores base del tema (que Quartz inyecta como `--light`, `--secondary`, etc.) están en `quartz.config.ts`.

**Nunca** editar `quartz/styles/base.scss` — es código upstream de Quartz.
**Siempre** usar `custom.scss` para cualquier override o adición.

---

## Restricciones de ejecución

- **No ejecutar** `git push --force` en ninguna circunstancia.
- **No modificar** archivos en `quartz/` excepto `styles/custom.scss` y `quartz.config.ts`.
- **No borrar** contenido en `content/` sin confirmación explícita del usuario.
- Antes de cualquier commit: verificar que `npx quartz build` no produce errores.

---

## Cómo añadir contenido nuevo

1. Elegir la categoría correcta (`01`, `02`, `03` o `04`).
2. Usar la plantilla de `content/templates/` correspondiente al tipo.
3. Rellenar frontmatter completo (`title`, `date`, `tags`, `description`).
4. Si el artículo no está listo: `draft: true` en frontmatter o mover a `private/`.
5. Actualizar el `index.md` de la categoría si existe.
6. **No** actualizar `content/index.md` (home) hasta que el artículo esté publicado.

---

## Aprendizajes acumulados (ratchet)

> Esta sección crece. Nunca se elimina una entrada — solo se añaden.

- `2026-05-14` — No usar `style fill:#color` en diagramas Mermaid: los colores hardcoded chocan con el tema del sitio. Dejar el tema Mermaid por defecto.
- `2026-05-14` — No añadir `\n` en labels de Mermaid: no se interpreta. Usar frases cortas o `<br/>` en nodos HTML.
- `2026-05-14` — El home (`content/index.md`) solo debe enlazar artículos que existen. Los enlaces rotos se muestran como advertencias en el build y confunden al lector.
- `2026-05-14` — Los efectos de fondo (aurora, red neuronal) solo están activos en modo oscuro. El modo claro usa un gradiente suave en esquinas.
- `2026-05-14` — No usar `\n` en labels de nodos Mermaid con corchetes `[]`. No se interpreta como salto de línea. Usar frases cortas con `:` o `—` como separador. En nodos con comillas dobles `""` tampoco es fiable entre versiones.
