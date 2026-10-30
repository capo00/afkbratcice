import { useRoute } from "uu5g05";
import { UiApp } from "caio-ui";
import { OG_LOCALE, SITE_NAME, getRouteSeo } from "../config/seo.js";

// Meta data stránky podle routy: titulek, popis, canonical, `og:*` a `robots`. Co která routa
// dostane, říká `config/seo.js`; zápis do `<head>` dělá caio-ui `UiApp.usePageMeta`
// (canonical a `og:url` jen s `APP_URL`, statickou hlavičku pro roboty bez JS staví devkit).

/** Výchozí meta podle routy. Volá se jednou, v `Shell` (app.jsx). */
export function usePageMeta() {
  const [route] = useRoute();
  const uu5Route = route?.uu5Route;
  const seo = getRouteSeo(typeof uu5Route === "string" ? uu5Route : "");

  UiApp.usePageMeta({
    siteName: SITE_NAME,
    title: seo.title ?? undefined,
    description: seo.description ?? undefined,
    noindex: seo.noindex,
    locale: OG_LOCALE,
  });
}

/**
 * Titulek (a případně popis) z dat stránky, např. „AFK Bratčice – Chotusice". Bez `title`
 * se nic nemění -- data ještě nedorazila. `noindex` u stránek, které do vyhledávání
 * nepatří (hráč, jehož jméno se skrývá). Platí, dokud je stránka vykreslená.
 */
export function usePageTitle({ title, description, noindex } = {}) {
  UiApp.usePageMeta(
    { title: title || undefined, description: (title && description) || undefined, noindex: noindex || undefined },
    { priority: 1 },
  );
}
