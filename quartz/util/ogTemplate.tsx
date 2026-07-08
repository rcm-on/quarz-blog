import { SocialImageOptions } from "./og"
import { getFontSpecificationName } from "./theme"
import { formatDate, getDate } from "../components/Date"
import readingTime from "reading-time"
import { i18n } from "../i18n"

/**
 * Plantilla OG propia de la marca RCM:
 * lienzo navy + retícula "blueprint" + nodo neural coral + tipografía del sitio.
 * Reutiliza el mismo lenguaje visual del blog (ver custom.scss).
 */
export const blueprintOgImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  userOpts,
  title,
  description,
  fileData,
}) => {
  const { colorScheme } = userOpts
  const colors = cfg.theme.colors[colorScheme]
  const headerFont = getFontSpecificationName(cfg.theme.typography.header)
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)

  const navy = colors.light // en darkMode, el lienzo navy
  const coral = colors.secondary
  const ink = colors.dark
  const body = colors.darkgray
  const muted = colors.gray

  // Retícula blueprint como SVG (líneas explícitas → satori la rasteriza fiable)
  const W = 1200
  const H = 630
  const step = 44
  let lines = ""
  for (let x = 0; x <= W; x += step) lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`
  for (let y = 0; y <= H; y += step) lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`
  let major = ""
  for (let x = 0; x <= W; x += step * 5) major += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`
  for (let y = 0; y <= H; y += step * 5) major += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`
  const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><g stroke="#ffffff" stroke-opacity="0.05" stroke-width="1">${lines}</g><g stroke="#ffffff" stroke-opacity="0.08" stroke-width="1">${major}</g></svg>`
  const gridUri = `data:image/svg+xml;base64,${Buffer.from(gridSvg).toString("base64")}`

  // Nodo neural (marca) en coral
  const nodeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="${coral}" stroke-width="1.9" stroke-linecap="round"><path d="M24 24 L24 10"/><path d="M24 24 L24 38"/><path d="M24 24 L37 17"/><path d="M24 24 L11 31"/><path d="M24 24 L37 32"/><path d="M24 24 L11 16"/><g fill="${coral}" stroke="none"><circle cx="24" cy="24" r="4.4"/><circle cx="24" cy="10" r="2.4"/><circle cx="24" cy="38" r="2.4"/><circle cx="37" cy="17" r="2.4"/><circle cx="11" cy="31" r="2.4"/><circle cx="37" cy="32" r="2.4"/><circle cx="11" cy="16" r="2.4"/></g></svg>`
  const nodeUri = `data:image/svg+xml;base64,${Buffer.from(nodeSvg).toString("base64")}`

  const rawDate = getDate(cfg, fileData)
  const date = rawDate ? formatDate(rawDate, cfg.locale) : null
  const { minutes } = readingTime(fileData.text ?? "")
  const readingTimeText = i18n(cfg.locale).components.contentMeta.readingTime({
    minutes: Math.ceil(minutes),
  })
  const useSmallerFont = title.length > 32

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: navy,
        fontFamily: bodyFont,
      }}
    >
      {/* Retícula blueprint de fondo */}
      <img
        src={gridUri}
        width={W}
        height={H}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      {/* Barra de acento coral superior */}
      <div style={{ display: "flex", height: 8, width: "100%", backgroundColor: coral }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "3rem 3.5rem",
        }}
      >
        {/* Cabecera: nodo neural + dominio */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src={nodeUri} width={52} height={52} />
          <div style={{ display: "flex", fontSize: 30, color: muted }}>{cfg.baseUrl}</div>
        </div>

        {/* Título */}
        <div style={{ display: "flex", marginTop: "auto" }}>
          <div
            style={{
              margin: 0,
              fontSize: useSmallerFont ? 66 : 78,
              fontFamily: headerFont,
              fontWeight: 700,
              color: ink,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>

        {/* Descripción */}
        <div
          style={{
            display: "flex",
            marginTop: "1.25rem",
            fontSize: 32,
            color: body,
            lineHeight: 1.4,
          }}
        >
          <div
            style={{
              margin: 0,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        </div>

        {/* Pie: fecha · tiempo de lectura */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: `1px solid ${colors.lightgray}`,
            fontSize: 26,
            color: muted,
          }}
        >
          {date && <div style={{ display: "flex" }}>{date}</div>}
          {date && <div style={{ display: "flex", color: coral }}>·</div>}
          <div style={{ display: "flex" }}>{readingTimeText}</div>
        </div>
      </div>
    </div>
  )
}
