# CONTENT-MAP — Mapa de contenido del blog (rcm-on / quarz-blog)

> Fichero de contexto para IA. Describe la estructura completa de `content/` a fecha 2026-07-06.
> Blog Quartz (Obsidian + GitHub Actions) sobre Arquitectura de Software, DevOps e IA. Idioma: español.
> Convención: `draft: true` = no publicado. Carpetas `private/` y `templates/` son internas (no producción).

## Estructura general

```
content/
├── index.md                  # Home: "IA en producción, sin hype."
├── 01 Artículos/             # Reflexión: documentación, cultura técnica, talento
├── 02 Laboratorios/          # Labs prácticos: guías reproducibles con código
├── 03 Guidelines/            # Documentación interna del propio blog (draft)
├── 04 Arquitectura IA/       # Serie principal: arquitectura para agentes IA
├── private/                  # Borradores, PDFs fuente y contenido LinkedIn
└── templates/                # Plantillas Obsidian (adr, artículo, lab, nota, referencia)
```

## content/index.md
- **title:** IA en producción, sin hype.
- Home del blog. Secciones: 📝 Artículos · 🧠 Arquitectura IA · 🤖 Laboratorios.

---

## 01 Artículos — reflexión sobre documentación, conocimiento y talento

### coste-conocimiento-retenido-organizaciones.md `[DRAFT]`
- **title:** El coste oculto del conocimiento retenido en las organizaciones
- **date:** 2026-05-14 · **tags:** arquitectura, documentación, cultura-técnica, organizaciones, talento
- **tesis:** Dos tipos de bloqueo de conocimiento: el que no puede compartirse y el que no se quiere compartir porque da poder. La IA lo hace urgente.
- **secciones:** Por qué las organizaciones no documentan · Los dos tipos de bloqueo de talento · El coste que no se calcula · La IA como acelerador y revelador · Lo que hay que cambiar · El patrón siempre fue el mismo

### documentacion-poder-conocimiento.md `[PUBLICADO]`
- **title:** El conocimiento que no se documenta no se comparte. Era una elección.
- **date:** 2026-05-14 · **tags:** arquitectura, documentación, cultura-técnica, reflexión, ia
- **tesis:** No documentar era miedo, pereza o poder. La IA lo ha dejado al descubierto.
- **secciones:** Las excusas que todos conocemos · El precio que pagó el equipo · La desidia no es la única explicación · Lo que los agentes IA han cambiado · Saber que hay que documentar no basta · El formato importa tanto como el contenido · El cambio cultural pendiente
- **relacionado:** private/linkedin/linkedin-documentacion-poder.md

### documentar-ahora-es-diferente.md `[PUBLICADO]`
- **title:** Documentar ahora es diferente. Y por fin lo entendemos.
- **date:** 2026-05-14 · **tags:** arquitectura, ia, documentación, reflexión
- **tesis:** Los técnicos creían que documentar era perder el tiempo; con agentes IA la documentación se vuelve infraestructura operativa.
- **secciones:** El argumento que siempre perdíamos · Lo que cambió · Por qué ahora es natural · El tipo de documentación que importa · Lo que siempre supimos y ahora podemos demostrar · El cambio real no es técnico

### onboarding-talento-desperdiciado.md `[DRAFT]`
- **title:** El onboarding que nunca ocurre y el talento que se pierde en él
- **date:** 2026-05-14 · **tags:** cultura-técnica, organizaciones, talento, liderazgo, onboarding
- **tesis:** El onboarding roto no es un problema de RRHH sino de liderazgo y documentación.
- **secciones:** El onboarding que existe en papel · Lo que le cuesta al nuevo · Lo que le cuesta a la organización · Nadie sabe qué se espera · Lo que un buen senior hace distinto · La documentación como acto de liderazgo · Lo que hay que exigir

### talento-que-se-apaga.md `[DRAFT]`
- **title:** El talento que se apaga
- **date:** 2026-05-15 · **tags:** cultura-técnica, organizaciones, talento, liderazgo
- **tesis:** Personas brillantes que se vuelven invisibles: no las echaron, las ignoraron hasta que aprendieron a callar.
- **secciones:** Lo que pasa cuando levantas la mano · Las reuniones en silencio · El efecto superviviente · El daño que no aparece en informes · Qué se puede hacer
- **nota:** existe copia en private/borradores/talento-que-se-apaga.md (mismo contenido)

---

## 02 Laboratorios — guías prácticas con código

### arch-md-ejemplo.md `[PUBLICADO]`
- **title:** Lab: ARCH.md — cómo describir tu proyecto para que el agente entienda el contexto
- **date:** 2026-05-14 · **tags:** lab, ia, agentes, context-engineering
- **contenido:** Ejemplo genérico comentado de un ARCH.md (qué es el proyecto, estructura de carpetas, convenciones, restricciones de ejecución, aprendizajes acumulados).
- **relacionado:** 04 Arquitectura IA/documento-arquitectura-base.md (artículo conceptual pareja de este lab)

### clean-architecture-template.md `[DRAFT]`
- **title:** Lab: Clean Architecture — estructura base para proyectos nuevos
- **date:** 2026-05-14 · **tags:** lab, arquitectura, clean-architecture, typescript
- **contenido:** Plantilla copy-paste con TypeScript: regla de dependencias, estructura de carpetas, entidad de dominio, errores, contratos de repositorio, casos de uso, puertos e infraestructura.

### mermaid-test.md `[DRAFT — interno]`
- **title:** Diagramas Mermaid — Prueba de renders
- **date:** 2026-05-14 · **tags:** lab, mermaid
- **contenido:** Test de todos los tipos de diagrama Mermaid en Quartz (flowchart, sequence, architecture, state, ERD, gantt, mindmap).

### ollama-docker-local.md `[DRAFT]`
- **title:** Arquitectura y Despliegue de LLMs locales con Ollama y Docker
- **date:** 2026-03-30 · **tags:** llmops, docker, arquitectura, ia
- **contenido:** LLMs en local por privacidad y control: arquitectura de la solución e implementación con Docker Compose.

### tsql-lineage-toolkit.md `[DRAFT — nuevo, sin commitear]`
- **title:** TSql Lineage Toolkit: lineage de procedimientos SQL Server sin pagar licencias
- **date:** 2026-06-17 · **tags:** sql-server, data-lineage, dotnet, arquitectura, ia
- **contenido:** Toolkit .NET de data lineage; ejecución real con WideWorldImporters en SQL Server 2025; dashboard; NodeStore (grafo optimizado para agentes IA); comparativa; quick start desde ficheros .sql.
- **relacionado:** 04 Arquitectura IA/datos-navegables-para-agentes.md (artículo conceptual pareja de este lab)

---

## 03 Guidelines — documentación interna del blog (todo draft)

### Quartz + GitHub Actions.md `[DRAFT]`
- **title:** Docs-as-Code con Obsidian, Quartz y GitHub Actions
- **date:** 2026-03-31 · **tags:** quartz, github/actions, obsidian
- **contenido:** Cómo funciona este blog: entorno local Obsidian, clean URLs, pipeline CI/CD (fix del error de Jekyll), branding y UI/UX.

### design-system.md `[DRAFT — no enlazar desde producción]`
- **title:** Design System — Catálogo completo de componentes
- **date:** 2026-05-23 · **tags:** design, guidelines
- **contenido:** Referencia interna del sistema visual "Stone × Teal": todos los elementos HTML y componentes Quartz (encabezados, prosa, links, listas, código, etc.).

---

## 04 Arquitectura IA — serie principal sobre agentes IA

### index.md
- **title:** Arquitectura IA — índice de sección
- **description:** Patrones, decisiones y principios para construir sistemas de IA fiables en producción desde la perspectiva del arquitecto.

### arquitectura-como-contexto.md `[DRAFT]`
- **title:** La arquitectura no es solo para los humanos del equipo
- **date:** 2026-05-14 · **tags:** arquitectura, ia, patrones, fowler
- **tesis:** La arquitectura es el único mecanismo que mantiene la coherencia de un LLM entre sesiones. La arquitectura siempre fue comunicación.

### confiabilidad-no-viene-del-modelo.md `[DRAFT]`
- **title:** La confiabilidad de un agente no viene del modelo
- **date:** 2026-05-14 · **tags:** arquitectura, ia, confiabilidad, harness
- **tesis:** El problema de la IA en producción no es la calidad del modelo sino la ausencia de capas de verificación alrededor. El problema es arquitectónico.

### context-engineering.md `[DRAFT]`
- **title:** Context Engineering: la disciplina que nadie está nombrando
- **date:** 2026-05-14 · **tags:** arquitectura, ia, context-engineering, agentes
- **tesis:** Diseñar qué información entra al modelo, cuándo y en qué formato es la nueva competencia central del arquitecto.
- **secciones:** Qué es context engineering · Los dos errores opuestos · Por qué es competencia de arquitectura · La nueva pregunta del arquitecto

### datos-navegables-para-agentes.md `[DRAFT — nuevo, sin commitear]`
- **title:** Dar el grafo entero al agente no es dar contexto. Es dar ruido.
- **date:** 2026-06-17 · **tags:** ia, arquitectura, context-engineering, agentes, data-lineage
- **tesis:** Volcar un grafo de 1.600 KB a un agente destruye su capacidad de razonar; hay que diseñar datos navegables.
- **secciones:** El problema es cómo entregas el grafo · El NodeStore · SQL Server 2025 rompe el parser · La pregunta antes de conectar datos a un agente
- **relacionado:** 02 Laboratorios/tsql-lineage-toolkit.md

### documento-arquitectura-base.md `[PUBLICADO]`
- **title:** ARCH.md: el documento que le da memoria a tu agente
- **date:** 2026-05-14 · **tags:** arquitectura, ia, agentes, context-engineering
- **tesis:** Un documento de arquitectura base es el contrato operativo que permite al agente trabajar con coherencia sesión tras sesión.
- **relacionado:** 02 Laboratorios/arch-md-ejemplo.md

### genera-el-plan-primero.md `[DRAFT]`
- **title:** Pídele al modelo que piense antes de que genere
- **date:** 2026-05-14 · **tags:** arquitectura, ia, patrones, prompting
- **tesis:** Generated Knowledge Prompting y Spec-Driven Development: de generar código directo a explicitar la intención primero.

### harness-engineering-agentes-ia.md `[PUBLICADO — artículo bandera]`
- **title:** Harness Engineering: el nuevo rol del arquitecto en la era de los agentes IA
- **date:** 2026-05-14 · **tags:** ia, arquitectura, agentes, harness, orquestación
- **tesis:** La efectividad de un agente no depende del modelo sino del harness: control, supervisión y retroalimentación que convierten un LLM en sistema autónomo confiable.
- **secciones:** Qué es un harness · El ciclo que el modelo no ve · Markdown como infraestructura del harness (AGENTS.md) · Orquestación multi-agente
- **assets:** banner `/static/banners/harness-engineering.svg`, social `/static/social/harness-engineering-linkedin.svg`
- **relacionado:** private/linkedin/linkedin-harness-engineering.md

### ratchet-efecto-memoria-agente.md `[DRAFT]`
- **title:** El efecto ratchet: cómo los agentes IA aprenden a no repetir errores
- **date:** 2026-05-14 · **tags:** ia, agentes, context-engineering, harness
- **tesis:** El ratchet convierte cada error corregido en una restricción permanente: memoria acumulativa sin retroceso.
- **secciones:** El problema que resuelve · Cómo funciona · Qué documentar · Propiedades del ratchet · Documento vivo · Lo que el ratchet no es

---

## private/ — no publicado

- **borradores/talento-que-se-apaga.md** — duplicado del artículo de 01 Artículos.
- **linkedin/linkedin-documentacion-poder.md** — post LinkedIn (estado: borrador) para documentacion-poder-conocimiento.md. Incluye texto del post, assets, estructura de carousel y pasos para publicar.
- **linkedin/linkedin-harness-engineering.md** — post LinkedIn (estado: borrador) para harness-engineering-agentes-ia.md. Mismo formato.
- **Documentar_importancia.pdf, Harness.pdf** — PDFs fuente/investigación.

## templates/ — plantillas Obsidian (placeholders {{title}}, {{date}})

- **adr.md** — ADR: Estado · Contexto · Decisión · Consecuencias · Alternativas.
- **articulo.md** — Artículo: TL;DR · Contexto · Desarrollo · Conclusión · Referencias.
- **laboratorio.md** — Lab: Objetivo · Entorno · Pasos · Resultado · Problemas · Referencias.
- **nota-privada.md** — Nota privada (draft: true): Contexto · Ideas sueltas · Referencias.
- **referencia.md** — Referencia externa: De qué trata · Relevancia · Citas clave · Conexiones.

---

## Resumen de estado editorial

| Estado | Ficheros |
|---|---|
| Publicados | documentacion-poder-conocimiento, documentar-ahora-es-diferente, arch-md-ejemplo, documento-arquitectura-base, harness-engineering-agentes-ia, index (home y sección 04) |
| Drafts | Todos los demás artículos y labs (13 ficheros) |
| Nuevos sin commitear | tsql-lineage-toolkit.md, datos-navegables-para-agentes.md |

## Ejes temáticos (para relacionar contenido)

1. **Documentación y conocimiento organizacional** — 01 Artículos completos.
2. **Context engineering / harness para agentes IA** — 04 Arquitectura IA + labs arch-md-ejemplo y tsql-lineage-toolkit. Pares concepto↔lab: documento-arquitectura-base↔arch-md-ejemplo, datos-navegables-para-agentes↔tsql-lineage-toolkit.
3. **Infraestructura del blog** — 03 Guidelines (Docs-as-Code, design system Stone × Teal).
4. **Talento y cultura técnica** — talento-que-se-apaga, onboarding-talento-desperdiciado, coste-conocimiento-retenido.
