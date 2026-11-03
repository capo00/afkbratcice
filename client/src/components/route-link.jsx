import { createVisualComponent, useRoute, Environment } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

// Odkaz na routu webu: skutečné `<a href>` (prostřední klik i Ctrl otevře nový panel, robot
// ho projde) a běžný klik přes `setRoute`, takže se nenačítá celá stránka. Stejný idiom jako
// navigace v patičce (`layout/footer.jsx`), jen s parametry.
//
// `href` je absolutní od `appBaseUri`: relativní `zapas?id=…` by se z `/muzstvo/zapasy`
// složil na `/muzstvo/zapas`.

function routeHref(route, params) {
  const query = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ).toString();
  return new URL(`${route}${query ? `?${query}` : ""}`, Environment.appBaseUri).href;
}

const RouteLink = createVisualComponent({
  uu5Tag: Config.TAG + "RouteLink",

  render({ route, params, children, colorScheme = "building", significance = "common", ...props }) {
    const [, setRoute] = useRoute();

    return (
      <Uu5Elements.Link
        {...props}
        href={routeHref(route, params)}
        colorScheme={colorScheme}
        significance={significance}
        onClick={(e) => {
          // Odkaz často leží v klikací ploše (řádek tabulky, karta): ta se nemá rozkliknout taky.
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
          e.preventDefault();
          setRoute(route, params);
        }}
      >
        {children}
      </Uu5Elements.Link>
    );
  },
});

/**
 * Odkaz na detail týmu. Náš tým má soupisku, soupeř jen zápasy a tabulku -- proto vede
 * rovnou na jeho zápasy. `seasonId` = sezóna, ze které se kliká (tabulka, zápas).
 */
function TeamLink({ team, seasonId, children, ...props }) {
  if (!team?.id) return children ?? null;
  return (
    <RouteLink route={team.own ? "muzstvo" : "muzstvo/zapasy"} params={{ id: team.id, seasonId }} {...props}>
      {children ?? team.name}
    </RouteLink>
  );
}

/** Odkaz na detail sezóny, s `round` rovnou na sekci kola. */
function SeasonLink({ seasonId, round, children, ...props }) {
  if (!seasonId) return children ?? null;
  return (
    <RouteLink route="sezona" params={{ id: seasonId, kolo: round }} {...props}>
      {children}
    </RouteLink>
  );
}

export { RouteLink, TeamLink, SeasonLink, routeHref };
export default RouteLink;
