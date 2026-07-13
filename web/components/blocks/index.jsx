import { mediaUrl } from "../../lib/api";

// Block renderer — maps a stored block `type` to a component. Mirrors the admin
// block registry (frontend/src/config/blocks.js) and the backend allow-list.

function Hero({ data }) {
  const bg = mediaUrl(data.image);
  return (
    <section className="blk-hero" style={bg ? { backgroundImage: `url(${bg})` } : undefined}>
      <div className="blk-hero__overlay" />
      <div className="blk-hero__content container">
        {data.title && <h1>{data.title}</h1>}
        {data.subtitle && <p className="blk-hero__sub">{data.subtitle}</p>}
        {data.cta_label && data.cta_url && (
          <a className="btn" href={data.cta_url}>{data.cta_label}</a>
        )}
      </div>
    </section>
  );
}

function Text({ data }) {
  return (
    <section className="blk container">
      <div className="blk-text" dangerouslySetInnerHTML={{ __html: data.html || "" }} />
    </section>
  );
}

function ImageBlock({ data }) {
  if (!data.src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img className="blk-img" src={mediaUrl(data.src)} alt={data.alt || ""} loading="lazy" />;
  return (
    <figure className="blk container">
      {data.link
        ? <a href={data.link} target={data.link_new_tab ? "_blank" : undefined}
             rel={data.link_new_tab ? "noreferrer" : undefined}>{img}</a>
        : img}
      {data.caption && <figcaption className="blk-caption">{data.caption}</figcaption>}
    </figure>
  );
}

function Gallery({ data }) {
  const images = Array.isArray(data.images) ? data.images : [];
  if (images.length === 0) return null;
  return (
    <section className="blk container">
      <div className="blk-gallery">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={mediaUrl(src)} alt="" loading="lazy" />
        ))}
      </div>
    </section>
  );
}

function Quote({ data }) {
  return (
    <section className="blk container">
      <blockquote className="blk-quote">
        <p>{data.text}</p>
        {data.author && <cite>— {data.author}</cite>}
      </blockquote>
    </section>
  );
}

function Cta({ data }) {
  if (!data.label || !data.url) return null;
  return (
    <section className="blk container blk-cta">
      <a className={`btn btn--${data.style || "primary"}`} href={data.url}>{data.label}</a>
    </section>
  );
}

function Video({ data }) {
  if (!data.url) return null;
  if (data.provider === "youtube" || data.provider === "vimeo") {
    return (
      <section className="blk container">
        <div className="blk-embed">
          <iframe src={data.url} title="video" allowFullScreen frameBorder="0" />
        </div>
      </section>
    );
  }
  return (
    <section className="blk container">
      <video className="blk-video" src={mediaUrl(data.url)} controls />
    </section>
  );
}

function Html({ data }) {
  return (
    <section className="blk container">
      <div dangerouslySetInnerHTML={{ __html: data.html || "" }} />
    </section>
  );
}

function MapBlock({ data }) {
  if (!data.address) return null;
  // Google Maps embed (no API key): a pin is placed at the address.
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&z=15&output=embed`;
  return (
    <section className="blk container">
      {data.title && <h2 style={{ textAlign: "center" }}>{data.title}</h2>}
      <div className="blk-map">
        <iframe src={src} title={data.title || data.address} loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    </section>
  );
}

const REGISTRY = {
  hero: Hero, text: Text, image: ImageBlock, gallery: Gallery,
  quote: Quote, cta: Cta, video: Video, map: MapBlock, html: Html,
};

export function Blocks({ blocks }) {
  const list = Array.isArray(blocks) ? blocks : [];
  return (
    <>
      {list.map((block, i) => {
        if (block.active === false) return null; // hidden block
        const Comp = REGISTRY[block.type];
        return Comp ? <Comp key={i} data={block.data || {}} /> : null;
      })}
    </>
  );
}
