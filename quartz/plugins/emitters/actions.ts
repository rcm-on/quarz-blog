import fs from "fs/promises"
import { QuartzEmitterPlugin } from "../types"
import { FilePath, FullSlug, joinSegments, simplifySlug } from "../../util/path"
import { write } from "./helpers"

/**
 * Actions emitter — la capa ejecutable del blog.
 *
 * Un post entra en esta capa declarando un bloque `action:` en su frontmatter
 * (con `id`, `kind` y `when_to_use`): su presencia es el opt-in explícito.
 * Sus instrucciones NO viven aquí ni en llms.txt: viven en el propio post,
 * en una sección "Instrucciones para agentes", junto al contenido que las
 * explica a los humanos. Este emitter:
 *
 *  1. Agrega los posts marcados en un manifiesto de descubrimiento
 *     (`/static/actions.json`) y publica su esquema (`/actions.schema.json`).
 *  2. Empaqueta la sección de instrucciones de cada post como una skill
 *     instalable (`/skills/<id>/SKILL.md`) con catálogo en `/skills/index.json`.
 *     La instrucción es el contenido; la skill es el contenedor: mismo
 *     Markdown fuente, cero drift.
 *
 * Si un post declara `action:` pero le falta `id`, `when_to_use` o la sección
 * de instrucciones, el build FALLA: una acción sin pasos canónicos es un bug.
 *
 * Flujo para un agente: llms.txt → actions.json (qué hay ejecutable) →
 * post#instrucciones (contexto + pasos) o skills/<id>/SKILL.md (instalable).
 */

const INSTRUCTIONS_ANCHOR = "instrucciones-para-agentes"
const INSTRUCTIONS_HEADING = /^##\s+Instrucciones para agentes\s*$/m

type ActionKind = "runbook" | "skill"

type ActionManifestEntry = {
  id: string
  kind: ActionKind
  title?: string
  when_to_use?: string
  source: string // URL canónica del post que documenta y explica la acción
  instructions: string // URL directa a la sección "Instrucciones para agentes"
  skill: string // URL del SKILL.md instalable generado desde esa sección
  slug: string
  tags: string[]
}

const ACTIONS_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://blog.rcmon.dev/actions.schema.json",
  title: "Manifiesto de acciones ejecutables del blog",
  description:
    "Índice de descubrimiento de la capa ejecutable. Cada entrada es un post " +
    "con un bloque `action:` en su frontmatter cuyo cuerpo contiene una sección " +
    "'Instrucciones para agentes' con los pasos canónicos (precondiciones, " +
    "pasos, verificación). Esa sección se publica además empaquetada como " +
    "skill instalable en `skill`. El agente debe leer los pasos antes de " +
    "ejecutar; este manifiesto solo dice QUÉ existe y DÓNDE está.",
  type: "object",
  required: ["site", "generated", "count", "actions"],
  properties: {
    $schema: { type: "string" },
    site: { type: "string", description: "Dominio del blog" },
    title: { type: "string" },
    description: { type: "string" },
    generated: {
      type: "string",
      format: "date-time",
      description: "Momento del build que generó este manifiesto",
    },
    count: { type: "integer", minimum: 0 },
    actions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "kind", "source", "instructions", "skill"],
        properties: {
          id: { type: "string", description: "Identificador estable de la acción" },
          kind: {
            type: "string",
            enum: ["runbook", "skill"],
            description:
              "runbook: procedimiento que se ejecuta una vez para alcanzar un estado. " +
              "skill: práctica reutilizable que el agente aplica en muchos contextos.",
          },
          title: { type: "string" },
          when_to_use: {
            type: "string",
            description: "Cuándo conviene ejecutar esta acción (para que el agente decida)",
          },
          source: {
            type: "string",
            format: "uri",
            description: "URL del post completo — contexto para humanos y agentes",
          },
          instructions: {
            type: "string",
            format: "uri",
            description:
              "URL con ancla a la sección 'Instrucciones para agentes' del post. " +
              "Es la fuente canónica de los pasos ejecutables.",
          },
          skill: {
            type: "string",
            format: "uri",
            description:
              "URL del SKILL.md generado desde la sección de instrucciones. " +
              "Instalable en el directorio de skills del agente (p. ej. " +
              ".claude/skills/<id>/SKILL.md) con consentimiento del usuario.",
          },
          slug: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const

// Devuelve el markdown de la sección "Instrucciones para agentes":
// desde su heading (excluido) hasta el siguiente h2 o el final del fichero.
function extractInstructions(raw: string): string | undefined {
  const match = INSTRUCTIONS_HEADING.exec(raw)
  if (!match) return undefined
  const start = match.index + match[0].length
  const rest = raw.slice(start)
  const next = /^##\s/m.exec(rest)
  const body = (next ? rest.slice(0, next.index) : rest).trim()
  // el separador --- previo al siguiente h2 pertenece al post, no a la skill
  return body.replace(/\n-{3,}\s*$/, "").trim()
}

function skillMd(entry: ActionManifestEntry, instructions: string): string {
  const description = entry.when_to_use ?? entry.title ?? entry.id
  return [
    "---",
    `name: ${entry.id}`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    "---",
    "",
    `> Skill generada en cada build de [${entry.slug}](${entry.source}) — tipo: **${entry.kind}**.`,
    `> El post enlazado es la fuente canónica y el contexto completo; esta skill es su sección`,
    `> "Instrucciones para agentes" empaquetada. Ejecuta siempre con consentimiento del usuario.`,
    "",
    instructions,
    "",
  ].join("\n")
}

function skillsIndexHtml(pageTitle: string, base: string, actions: ActionManifestEntry[]): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  const items = actions
    .map(
      (a) => `  <article>
    <h2>${esc(a.title ?? a.id)}</h2>
    <p><code>${esc(a.id)}</code> · tipo: <strong>${a.kind}</strong></p>
    <p><em>Cuándo usarla:</em> ${esc(a.when_to_use ?? "")}</p>
    <p>
      <a href="${a.skill}">SKILL.md</a> ·
      <a href="${a.source}">post con el contexto completo</a> ·
      <a href="${a.instructions}">instrucciones en el post</a>
    </p>
    <pre><code>curl --create-dirs -o .claude/skills/${esc(a.id)}/SKILL.md ${a.skill}</code></pre>
  </article>`,
    )
    .join("\n")
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skills — ${esc(pageTitle)}</title>
  <meta name="description" content="Catálogo de skills instalables generadas desde los posts ejecutables del blog.">
  <style>
    body { max-width: 42rem; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; line-height: 1.6; }
    pre { overflow-x: auto; background: #f4f4f4; padding: .5rem; }
    @media (prefers-color-scheme: dark) { body { background: #16161d; color: #e6e6ea; } pre { background: #24242e; } a { color: #8fa8ff; } }
  </style>
</head>
<body>
  <h1>Skills del blog</h1>
  <p>Cada skill se genera en el build desde la sección "Instrucciones para agentes" de un post
     ejecutable. Instálala en el directorio de skills de tu agente (siempre con consentimiento
     del usuario) o, si tu LLM no puede escribir ficheros, lee el SKILL.md y aplica sus pasos
     en la sesión. Catálogo legible por máquina: <a href="https://${base}/skills/index.json">index.json</a> ·
     punto de entrada para agentes: <a href="https://${base}/llms.txt">llms.txt</a>.</p>
${items}
</body>
</html>
`
}

export const Actions: QuartzEmitterPlugin = () => ({
  name: "Actions",
  async emit(ctx, content) {
    const cfg = ctx.cfg.configuration
    const base = cfg.baseUrl ?? ""
    const toUrl = (path: string) => (base ? `https://${joinSegments(base, path)}` : `/${path}`)

    const emitted: FilePath[] = []
    const actions: ActionManifestEntry[] = []

    for (const [, file] of content) {
      const fm = file.data.frontmatter as Record<string, any> | undefined
      // Opt-in explícito: la presencia del bloque `action:` declara el post ejecutable.
      const action = fm?.action as Record<string, any> | undefined
      if (!action || typeof action !== "object" || Array.isArray(action)) continue

      if (!action.id || !action.when_to_use) {
        throw new Error(
          `[Actions] ${file.data.filePath}: el bloque action: necesita "id" (identificador ` +
            `estable) y "when_to_use" (el trigger de la skill). Complétalo o elimínalo.`,
        )
      }

      const simple = simplifySlug(file.data.slug!)
      const source = toUrl(encodeURI(simple))
      const id = String(action.id)
      const kind: ActionKind = action.kind === "skill" ? "skill" : "runbook"

      const raw = await fs.readFile(file.data.filePath!, "utf-8")
      const instructions = extractInstructions(raw)
      if (!instructions) {
        throw new Error(
          `[Actions] ${file.data.filePath}: declara un bloque action: pero no contiene ` +
            `la sección "## Instrucciones para agentes". Añádela o quita el bloque.`,
        )
      }

      const entry: ActionManifestEntry = {
        id,
        kind,
        title: action.title ?? fm?.title,
        when_to_use: action.when_to_use,
        source,
        instructions: `${source}#${action.instructions_anchor ?? INSTRUCTIONS_ANCHOR}`,
        skill: toUrl(`skills/${id}/SKILL.md`),
        slug: simple,
        tags: fm?.tags ?? [],
      }
      actions.push(entry)

      emitted.push(
        await write({
          ctx,
          content: skillMd(entry, instructions),
          slug: joinSegments("skills", id, "SKILL") as FullSlug,
          ext: ".md",
        }),
      )
    }

    // orden estable para que el diff del build sea reproducible
    actions.sort((a, b) => a.id.localeCompare(b.id))

    const manifest = {
      $schema: toUrl("actions.schema.json"),
      site: base,
      title: cfg.pageTitle,
      description:
        "Capa ejecutable del blog: posts con bloque `action:` en su frontmatter. Este manifiesto " +
        "es solo descubrimiento — los pasos canónicos de cada acción están en la " +
        "sección 'Instrucciones para agentes' del post enlazado en `instructions`, " +
        "también instalable como skill desde `skill`.",
      generated: new Date().toISOString(),
      count: actions.length,
      actions,
    }

    emitted.push(
      await write({
        ctx,
        content: JSON.stringify(manifest, null, 2),
        slug: joinSegments("static", "actions") as FullSlug,
        ext: ".json",
      }),
    )

    emitted.push(
      await write({
        ctx,
        content: JSON.stringify(ACTIONS_SCHEMA, null, 2),
        slug: "actions.schema" as FullSlug,
        ext: ".json",
      }),
    )

    // catálogo de skills: qué instalar y dónde, sin duplicar los pasos
    emitted.push(
      await write({
        ctx,
        content: JSON.stringify(
          {
            site: base,
            description:
              "Skills instalables generadas desde los posts ejecutables del blog. " +
              "Instalación: descarga cada SKILL.md en el directorio de skills de tu " +
              "agente (p. ej. .claude/skills/<id>/SKILL.md), siempre con " +
              "consentimiento del usuario.",
            skills: actions.map((a) => ({
              id: a.id,
              kind: a.kind,
              description: a.when_to_use ?? a.title,
              skill: a.skill,
              source: a.source,
            })),
          },
          null,
          2,
        ),
        slug: joinSegments("skills", "index") as FullSlug,
        ext: ".json",
      }),
    )

    // catálogo también en HTML (/skills/): para humanos y para LLMs cuyo
    // lector de URLs no acepta application/json (p. ej. Gemini)
    emitted.push(
      await write({
        ctx,
        content: skillsIndexHtml(cfg.pageTitle, base, actions),
        slug: joinSegments("skills", "index") as FullSlug,
        ext: ".html",
      }),
    )

    return emitted
  },
  async *partialEmit() {},
})
