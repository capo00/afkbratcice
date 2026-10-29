import { useEffect, useRoute } from "uu5g05";
import Config from "../config/config.js";
import { OG_LOCALE, getRouteSeo, pageTitle } from "../config/seo.js";

// Meta data stránky podle routy: titulek, popis, canonical, `og:*` a `robots` (Caio
// 2026-10-29, vzor z caio_propertyman `tools/page-meta.js`). Co která routa dostane, říká
// `config/seo.js`; tady je jen zápis do `<head>`.
//
// Pozor: tagy píše JS, takže je vidí jen robot, který JS spouští (Google ano, Facebook,
// WhatsApp a Seznam ne). Ti vidí statické tagy z index.html (client/vite.config.js).
//
// Dvě vrstvy. `usePageMeta` (v `Shell`) nastaví výchozí meta routy. Stránka s daty pak
// zavolá `usePageTitle` s titulkem z dat; ten platí jen pro stejnou stránku (routa + `id`),
// takže po přechodu jinam se nepřenese. Pořadí efektů nevadí: React pouští efekty dítěte
// dřív než rodiče, a proto oba jen uloží svůj díl a zavolají `apply()`, který je spojí.

let base = { key: null, meta: null };
let override = { key: null, meta: null };

function pageKey(route) {
  return `${route?.uu5Route ?? ""}?${route?.params?.id ?? ""}`;
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (href == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function apply() {
  if (!base.meta) return;
  const meta = override.key === base.key ? { ...base.meta, ...override.meta } : base.meta;
  const title = pageTitle(meta.title);
  // Canonical a `og:url` jen s adresou webu (`APP_URL`), jinak žádné -- lepší žádné než
  // špatné (appspot místo domény). Adresa stránky i s parametry: `muzstvo?id=…` je jiná
  // stránka než `muzstvo?id=…` jiného mužstva.
  const url = Config.appUrl && !meta.noindex ? Config.appUrl + window.location.pathname + window.location.search : null;

  document.title = title;
  setMeta("name", "description", meta.noindex ? null : meta.description);
  setMeta("name", "robots", meta.noindex ? "noindex, nofollow" : null);
  setCanonical(url);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", meta.noindex ? null : meta.description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:locale", OG_LOCALE);
}

/** Výchozí meta podle routy. Volá se jednou, v `Shell` (app.jsx). */
export function usePageMeta() {
  const [route] = useRoute();
  const key = pageKey(route);
  const uu5Route = route?.uu5Route;

  useEffect(() => {
    base = { key, meta: getRouteSeo(typeof uu5Route === "string" ? uu5Route : "") };
    apply();
  }, [key, uu5Route]);
}

/**
 * Titulek (a případně popis) z dat stránky, např. „AFK Bratčice – Chotusice". Bez `title`
 * se nic nemění -- data ještě nedorazila. `noindex` u stránek, které do vyhledávání
 * nepatří (hráč, jehož jméno se skrývá).
 */
export function usePageTitle({ title, description, noindex = false } = {}) {
  const [route] = useRoute();
  const key = pageKey(route);

  useEffect(() => {
    if (!title) return;
    override = { key, meta: { title, ...(description ? { description } : null), ...(noindex ? { noindex } : null) } };
    apply();
  }, [key, title, description, noindex]);
}
