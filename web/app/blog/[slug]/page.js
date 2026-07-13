import { notFound } from "next/navigation";

import { getBlogPost, getSettings, mediaUrl } from "../../../lib/api";

export async function generateMetadata({ params }) {
  const [post, settings] = await Promise.all([getBlogPost(params.slug), getSettings()]);
  if (!post) return {};
  const site = settings?.site_name || "Marveen";
  return {
    title: { absolute: `${post.title} — ${site}` },
    description: post.excerpt || "",
    openGraph: {
      title: post.title, description: post.excerpt || "", type: "article",
      images: post.cover_image ? [{ url: mediaUrl(post.cover_image) }] : undefined,
    },
  };
}

export default async function BlogPost({ params }) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();

  return (
    <article className="blk container" style={{ maxWidth: 760 }}>
      <a href="/blog" className="blog-back">← Retour au blog</a>
      {post.category && <span className="blog-card__cat">{post.category}</span>}
      <h1>{post.title}</h1>
      {post.date && (
        <time style={{ color: "var(--muted)" }}>{new Date(post.date).toLocaleDateString("fr-FR")}</time>
      )}
      {post.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="blk-img" style={{ marginTop: "1.2rem" }} src={mediaUrl(post.cover_image)} alt={post.title} />
      )}
      <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
    </article>
  );
}
