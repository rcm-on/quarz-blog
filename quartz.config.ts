import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { blueprintOgImage } from "./quartz/util/ogTemplate"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Ramón Campos Martín · Arquitectura, DevOps e IA",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: { provider: "google", tagId: "G-QKST2MECVR" },
    locale: "es-ES",
    baseUrl: "blog.rcmon.dev",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Space Grotesk",
        body: "Inter",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#e9edf4",
          lightgray: "#d7dce6",
          gray: "#5b6678",
          darkgray: "#2a3142",
          dark: "#131826",
          secondary: "#cc3b32",
          tertiary: "#e0463b",
          highlight: "rgba(220, 79, 71, 0.07)",
          textHighlight: "#dc4f4730",
        },
        darkMode: {
          light: "#0d1424",
          lightgray: "#1b2336",
          gray: "#8294b3",
          darkgray: "#c7d2e2",
          dark: "#eef2f8",
          secondary: "#ff6b6b",
          tertiary: "#ff897a",
          highlight: "rgba(255, 107, 107, 0.10)",
          textHighlight: "#ff6b6b38",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "vitesse-light",
          dark: "vitesse-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({
        enableInHtmlEmbed: false,
        callouts: true,
      }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      Plugin.CNAME(),
      // Plugin.Actions(), — capa ejecutable retirada temporalmente (revisión de seguridad);
      // los posts que la documentan están en draft hasta rediseñarla.
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages({
        colorScheme: "darkMode",
        imageStructure: blueprintOgImage,
      }),
    ],
  },
}

export default config
