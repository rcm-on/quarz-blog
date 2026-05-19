import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Ramón Campos Martin | Blog técnico de Arquitectura, DevOps e IA",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: { provider: "google", tagId: "G-QKST2MECVR" },
    locale: "en-US",
    baseUrl: "blog.rcmon.dev",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Syne",
        body: "Inter",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#fafafa",
          lightgray: "#e4e4e7",
          gray: "#71717a",
          darkgray: "#27272a",
          dark: "#09090b",
          secondary: "#6d28d9",
          tertiary: "#4f46e5",
          highlight: "rgba(109, 40, 217, 0.07)",
          textHighlight: "#6d28d930",
        },
        darkMode: {
          light: "#09090b",
          lightgray: "#18181b",
          gray: "#52525b",
          darkgray: "#a1a1aa",
          dark: "#fafafa",
          secondary: "#a78bfa",
          tertiary: "#818cf8",
          highlight: "rgba(167, 139, 250, 0.1)",
          textHighlight: "#a78bfa25",
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
          light: "github-light",
          dark: "github-dark",
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
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
