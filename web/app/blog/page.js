import { getBlogList, getSettings, mediaUrl } from "../../lib/api";

export async function generateMetadata() {
  const settings = await getSettings();
  return { title: { absolute: `Blog — ${settings?.site_name || "Marveen"}` } };
}

export default async function BlogIndex() {
  const { items } = await getBlogList();

  return (
    <section className="blk container">
      <h1>Blog</h1>
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Aucun article pour le moment.</p>
      ) : (
        <div className="blog-grid">
          {items.map((a) => (
            <a className="blog-card" key={a.slug} href={`/blog/${a.slug}`}>
              {a.cover_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(a.cover_image)} alt={a.title} loading="lazy" />
              )}
              <div className="blog-card__body">
                {a.category && <span className="blog-card__cat">{a.category}</span>}
                <h2>{a.title}</h2>
                {a.excerpt && <p>{a.excerpt}</p>}
                {a.date && <time>{new Date(a.date).toLocaleDateString("fr-FR")}</time>}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
