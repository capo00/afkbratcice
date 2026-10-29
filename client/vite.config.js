import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { createViteConfig } from "caio-devkit/vite";
import { HOME_DESCRIPTION, OG_LOCALE } from "./src/config/seo.js";

// Kořen repa -- tam je serverový `.env` s `APP_URL` (adresa webu). Jedna proměnná pro server
// (sitemapa, robots.txt) i klienta (canonical, `og:url`); proměnná v prostředí buildu má
// přednost. Vzor z caio_propertyman (Caio 2026-10-29).
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Statické SEO tagy hlavního webu pro roboty, kteří nespouštějí JS (Facebook, WhatsApp,
 * Seznam): popis, `og:type`, `og:locale` a absolutní `og:image` (devkit ho dává relativní,
 * protože doménu nezná, a náhled sdílení s relativním obrázkem nefunguje). Běží po devkitu
 * (`order: "post"`), aby jeho `og:image` už v dokumentu byl. Administrace má `noindex`
 * a nic z toho nedostane. `og:url` ani canonical se staticky nepíšou: index.html slouží
 * všem routám a ukazovaly by na úvod; píše je za běhu tools/page-meta.js.
 */
function seoHead(appUrl) {
  return {
    name: "afk-seo-head",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if ((ctx?.filename || ctx?.path || "").replace(/\\/g, "/").includes("/admin/")) return html;
        let out = html;
        if (appUrl) out = out.replace(/(<meta property="og:image" content=")(\/[^"]*")/, `$1${appUrl}$2`);
        // Popis z manifestu („Fotbalový klub AFK Bratčice") je na náhled sdílení krátký.
        out = out.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(HOME_DESCRIPTION)}$2`);
        const tags = [
          `<meta name="description" content="${escapeAttr(HOME_DESCRIPTION)}">`,
          `<meta property="og:type" content="website">`,
          `<meta property="og:locale" content="${OG_LOCALE}">`,
        ].filter((tag) => !out.includes(tag.slice(0, tag.indexOf(" content="))));
        return out.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
      },
    },
  };
}

export default (configEnv) => {
  const appUrl = (process.env.APP_URL || loadEnv("production", REPO_ROOT, "").APP_URL || "").replace(/\/+$/, "");

  return createViteConfig({
    define: {
      "process.env.APP_URL": JSON.stringify(appUrl),
    },
    plugins: [seoHead(appUrl)],
  })(configEnv);
};
