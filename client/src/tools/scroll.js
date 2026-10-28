import { useEffect, useRef, useRoute } from "uu5g05";

// Parametry, jejichž změna je pořád táž stránka: přepnutí sezóny u mužstva nechá čtenáře,
// kde byl.
const SAME_PAGE_PARAM_LIST = ["seasonId"];

function pageKey(route) {
  const params = { ...route?.params };
  for (const name of SAME_PAGE_PARAM_LIST) delete params[name];
  const sorted = Object.keys(params)
    .sort()
    .map((name) => [name, params[name]]);
  return `${route?.uu5Route ?? ""}?${JSON.stringify(sorted)}`;
}

/**
 * Po přechodu na jinou stránku začít na jejím začátku (vzor z caio_propertyman
 * `client/src/tools/scroll.js`, Caio 2026-10-28).
 *
 * `RouteProvider` z uu5g05 řeší jen DVĚ situace -- skok na fragment a návrat na
 * zapamatovanou pozici při Zpět/Vpřed. Obyčejný přechod scroll nechává být, takže detail
 * hráče otevřený z konce soupisky začínal tam, kde byla soupiska odskrolovaná.
 *
 * Proti propertymanu se tu stránka pozná i podle parametrů, ne jen podle routy: z hráče
 * na hráče nebo ze zápasu na zápas se přechází změnou `id` na téže routě.
 *
 * Obě situace, které uu5g05 řeší samo, se obcházejí:
 *   - fragment -> nedělá se nic, skok si odbaví RouteProvider,
 *   - Zpět/Vpřed -> `popstate` si zapamatuje adresu a přechod na ni se přeskočí. Jinak by
 *     tenhle `useEffect` přepsal obnovenou pozici, kterou RouteProvider nastavuje
 *     v `useLayoutEffect`, tedy DŘÍV. Adresa, ne jen příznak: Zpět, které změní jen
 *     sezónu, přechod nevyvolá, a příznak by pak spolkl až další skutečný přechod.
 */
export function useScrollTopOnRouteChange() {
  const [route] = useRoute();
  const key = pageKey(route);
  const fragment = route?.fragment;

  const prevKeyRef = useRef(key);
  const popHrefRef = useRef(null);

  useEffect(() => {
    const onPopState = () => (popHrefRef.current = window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;

    const fromHistory = popHrefRef.current === window.location.href;
    popHrefRef.current = null;
    if (fromHistory) return;
    if (fragment) return;

    window.scrollTo(0, 0);
  }, [key, fragment]);
}
