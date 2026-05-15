import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ArticleBanner: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const banner = fileData.frontmatter?.banner as string | undefined
  if (!banner) return null

  return (
    <div class="article-banner">
      <img src={banner} alt="" aria-hidden="true" />
    </div>
  )
}

ArticleBanner.css = `
.article-banner {
  width: 100%;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--lightgray);
}

.article-banner img {
  width: 100%;
  height: auto;
  display: block;
}
`

export default (() => ArticleBanner) satisfies QuartzComponentConstructor
