import matchDao from "../match/dao.js";
import teamDao from "../team/dao.js";
import galleryDao from "../gallery/dao.js";
import articleDao from "../article/dao.js";
import { buildCalendar } from "../services/ical.js";

// Netypové trasy. Registrují se jako běžný use case, který si odpověď pošle sám přes
// `res` a vrátí `false` -- App.init pak nic dalšího neodesílá.

// Obsahové stránky jsou natvrdo v klientu (`client/src/content/pages.js`) a serveru se
// odsud nedají naimportovat -- do nasazení jde `client/dist`, ne zdrojáky. Duplicitní
// seznam je tady schválně: chybějící kód stojí jeden řádek v sitemapě, nic víc.
const CONTENT_PAGE_LIST = ["historie", "hymna", "vybor", "treninky", "tymove-fotky", "kontakt"];

const RSS_ITEM_COUNT = 20;

function getBaseUrl(req) {
  return process.env.APP_URL?.replace(/\/+$/, "") ?? `${req.protocol}://${req.get("host")}`;
}

/** XML nesnese holé `&`, `<` ani `>`; do atributů se hodí i uvozovky. */
function xml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** RSS 2.0 chce RFC 822, ne ISO. `toUTCString()` je přesně ten tvar. */
function rfc822(isoTime) {
  const date = isoTime ? new Date(isoTime) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toUTCString() : new Date().toUTCString();
}

export default {
  /**
   * Rozpis zápasů týmu k odběru v telefonu.
   *
   * Trasa je `/calendar/team-<id>.ics`; use case se registruje bez přípony a id se bere
   * z query, protože App.init mapuje klíč 1:1 na cestu. Hezké URL na něj přesměruje
   * legacy-redirect.
   */
  "calendar/team": {
    method: "get",
    fn: async ({ dtoIn, req, res }) => {
      const teamId = dtoIn?.teamId;
      if (!teamId) {
        res.status(400).json({ error: { code: "afkbratcice/calendar/teamIdRequired", message: "teamId is required" } });
        return false;
      }

      const [team, matchList] = await Promise.all([
        teamDao.get(teamId).catch(() => null),
        matchDao.listByFilter({ teamId }, { pageSize: 500 }),
      ]);

      const teamIdList = [...new Set(matchList.flatMap((m) => [m.homeTeamId, m.guestTeamId]))];
      const teams = teamIdList.length ? await teamDao.listByIdList(teamIdList) : [];
      const teamMap = new Map(teams.map((t) => [t.id, t]));

      const body = buildCalendar({
        name: `${team?.name ?? "AFK Bratčice"} – rozpis`,
        matchList,
        teamMap,
        host: new URL(getBaseUrl(req)).host,
      });

      res.set("Content-Type", "text/calendar; charset=utf-8");
      res.set("Content-Disposition", `inline; filename="team-${teamId}.ics"`);
      res.send(body);
      return false;
    },
  },

  /**
   * Odběr novinek. Formát je RSS 2.0, ne Atom -- v0 publikoval RSS a čtečky, které si ho
   * kdo přidal, mají v odkazu tuhle adresu.
   */
  rss: {
    method: "get",
    fn: async ({ req, res }) => {
      const base = getBaseUrl(req);
      // Ne `crud.list`: tady není identita ani stránkování, jen posledních pár
      // publikovaných. Naplánované články filtrujeme stejně jako veřejný výpis.
      const { itemList } = await articleDao.listPageByFilter(
        { state: "published", publishedBefore: new Date().toISOString() },
        { pageSize: RSS_ITEM_COUNT },
        // Čistě chronologicky: připnutí je vlastnost webu, ne kanálu.
        { sort: { publishTime: -1 } },
      );

      const body =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
        "<channel>\n" +
        "  <title>AFK Bratčice – novinky</title>\n" +
        `  <link>${xml(base)}/novinky</link>\n` +
        "  <description>Novinky z fotbalového klubu AFK Bratčice</description>\n" +
        "  <language>cs</language>\n" +
        `  <atom:link href="${xml(base)}/rss" rel="self" type="application/rss+xml" />\n` +
        `  <lastBuildDate>${rfc822(itemList[0]?.publishTime)}</lastBuildDate>\n` +
        itemList
          .map((article) => {
            const link = `${base}/novinka?id=${article.id}`;
            return (
              "  <item>\n" +
              `    <title>${xml(article.name)}</title>\n` +
              `    <link>${xml(link)}</link>\n` +
              // guid je identifikátor, ne adresa; id je stálé i kdyby se adresa změnila.
              `    <guid isPermaLink="false">${xml(article.id)}</guid>\n` +
              `    <pubDate>${rfc822(article.publishTime)}</pubDate>\n` +
              `    <description>${xml(article.desc)}</description>\n` +
              "  </item>"
            );
          })
          .join("\n") +
        "\n</channel>\n</rss>\n";

      res.set("Content-Type", "application/rss+xml; charset=utf-8");
      res.send(body);
      return false;
    },
  },

  "sitemap.xml": {
    method: "get",
    fn: async ({ req, res }) => {
      const base = getBaseUrl(req);

      // Adresy jsou české a shodné s klientským `router.jsx` -- sitemapa s anglickými
      // cestami by vyhledávačům nabízela samá 404.
      const [ownTeams, galleries, articles] = await Promise.all([
        teamDao.listOwn(),
        galleryDao.listByFilter({ state: "published" }, { pageSize: 200 }),
        articleDao
          .listPageByFilter({ state: "published", publishedBefore: new Date().toISOString() }, { pageSize: 500 })
          .then(({ itemList }) => itemList),
      ]);

      const urlList = [
        { loc: `${base}/`, priority: "1.0" },
        { loc: `${base}/novinky`, priority: "0.9" },
        { loc: `${base}/muzstva`, priority: "0.8" },
        { loc: `${base}/fotogalerie`, priority: "0.6" },
        { loc: `${base}/ke-stazeni`, priority: "0.4" },
        ...CONTENT_PAGE_LIST.map((code) => ({ loc: `${base}/${code}`, priority: "0.5" })),
        ...ownTeams.flatMap((team) => [
          { loc: `${base}/muzstvo?id=${team.id}&seasonId=`, priority: "0.7" },
          { loc: `${base}/muzstvo/zapasy?id=${team.id}`, priority: "0.7" },
          { loc: `${base}/muzstvo/tabulka?id=${team.id}`, priority: "0.6" },
        ]),
        ...articles.map((a) => ({ loc: `${base}/novinka?id=${a.id}`, priority: "0.5" })),
        ...galleries.map((g) => ({ loc: `${base}/fotogalerie/album?id=${g.id}`, priority: "0.4" })),
      ];

      const body =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urlList.map((u) => `  <url><loc>${xml(u.loc)}</loc><priority>${u.priority}</priority></url>`).join("\n") +
        "\n</urlset>\n";

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.send(body);
      return false;
    },
  },
};
