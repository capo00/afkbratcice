import matchDao from "../match/dao.js";
import teamDao from "../team/dao.js";
import seasonDao from "../season/dao.js";
import { Seo, Error as CoreError } from "caio-server";
import { buildCalendar } from "../services/ical.js";

// Netypové trasy. Registrují se jako běžný use case, který si odpověď pošle sám přes
// `res` a vrátí `false` -- App.init pak nic dalšího neodesílá. `robots.txt` a `sitemap.xml`
// odpovídá caio-server (use casy a administrace se smí stáhnout a nesou `X-Robots-Tag: noindex`,
// caio-server 0.8.0); obsah sitemapy je `sitemap` níž,
// předaný do `App.init({ seo })` v server/index.js.

// Obsahové stránky jsou natvrdo v klientu (`client/src/content/pages.js`) a serveru se
// odsud nedají naimportovat -- do nasazení jde build v `public/`, ne zdrojáky. Duplicitní
// seznam je tady schválně: chybějící kód stojí jeden řádek v sitemapě, nic víc.
const CONTENT_PAGE_LIST = ["historie", "hymna", "vybor", "tymove-fotky", "kontakt"];

// Sitemapa smí mít nejvýš 50 000 adres; zápasů našich týmů je kolem 460 (2026-11).
const SITEMAP_MATCH_LIMIT = 40000;

const { getBaseUrl } = Seo;

/**
 * Obsah `sitemap.xml` (caio-server ho obalí do XML, adresy doplní o základ webu). Adresy jsou
 * české a shodné s klientským `router.jsx` -- sitemapa s anglickými cestami by vyhledávačům
 * nabízela samá 404.
 */
export async function sitemap() {
  // Novinky a fotogalerie na webu nejsou (Caio 2026-11-19), v sitemapě tedy taky ne.
  const ownTeams = await teamDao.listOwn();

  const ownIdList = ownTeams.map((team) => team.id);

  // Sezóny, ve kterých hrál některý z našich týmů (detail sezóny: tabulka a všechna kola), a zápasy
  // našich týmů, odehrané i naplánované. Zápasy jsou na webu jen za kartou bez `<a href>` (review
  // S10), takže vyhledávač je bez sitemapy nenajde. Cizí zápasy soutěže sem nepatří. Hráči sem
  // nepatří taky (Caio 2026-11-20).
  const [seasons, matches] = ownIdList.length
    ? await Promise.all([
        seasonDao.find({ teamList: { $in: ownIdList } }, { pageSize: 500 }),
        matchDao.find(
          { $or: [{ homeTeamId: { $in: ownIdList } }, { guestTeamId: { $in: ownIdList } }] },
          { pageSize: SITEMAP_MATCH_LIMIT },
          { time: -1 },
          { _id: 1 },
        ),
      ])
    : [[], []];

  return [
    { path: "/", priority: "1.0" },
    { path: "/muzstva", priority: "0.8" },
    { path: "/zajimavosti", priority: "0.6" },
    ...CONTENT_PAGE_LIST.map((code) => ({ path: `/${code}`, priority: "0.5" })),
    ...ownTeams.flatMap((team) => [
      { path: `/muzstvo?id=${team.id}`, priority: "0.7" },
      { path: `/muzstvo/zapasy?id=${team.id}`, priority: "0.7" },
      { path: `/muzstvo/tabulka?id=${team.id}`, priority: "0.6" },
      { path: `/muzstvo/statistiky?id=${team.id}`, priority: "0.6" },
    ]),
    ...seasons.map((s) => ({ path: `/sezona?id=${s.id}`, priority: "0.5" })),
    ...matches.map((m) => ({ path: `/zapas?id=${m.id}`, priority: "0.4" })),
  ];
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
        res.status(400).json({ error: { code: CoreError.code("calendar", "teamIdRequired"), message: "teamId is required" } });
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
};

