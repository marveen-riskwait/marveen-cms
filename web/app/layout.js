import "./globals.css";

import { Footer, Header } from "../components/Nav";
import { getMenu, getSettings } from "../lib/api";
import { googleFontsHref, themeCss } from "../lib/theme";

export async function generateMetadata() {
  const settings = await getSettings();
  const name = settings?.site_name || "Marveen";
  return {
    title: { default: name, template: `%s` },
    description: settings?.default_meta_description || "",
  };
}

export default async function RootLayout({ children }) {
  const [settings, header, footer] = await Promise.all([
    getSettings(), getMenu("header"), getMenu("footer"),
  ]);
  const fontsHref = googleFontsHref(settings);

  return (
    <html lang="fr">
      <head>
        {fontsHref && <link rel="stylesheet" href={fontsHref} />}
        {/* Theme tokens from the CMS override the defaults in globals.css. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(settings) }} />
      </head>
      <body>
        <Header settings={settings} menu={header} />
        <main>{children}</main>
        <Footer settings={settings} menu={footer} />
      </body>
    </html>
  );
}
