import matchDao from "../match/dao.js";
import teamDao from "../team/dao.js";
import galleryDao from "../gallery/dao.js";
import { buildCalendar } from "../services/ical.js";
import { getYearFrom } from "../services/season.js";

// Netypové trasy. Registrují se jako běžný use case, který si odpověď pošle sám přes
// `res` a vrátí `false` -- App.init pak nic dalšího neodesílá.

function getBaseUrl(req) {
  return process.env.APP_URL?.replace(/\/+$/, "") ?? `${req.protocol}://${req.get("host")}`;
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

  "sitemap.xml": {
    method: "get",
    fn: async ({ req, res }) => {
      const base = getBaseUrl(req);
      const yearFrom = getYearFrom();

      const [ownTeams, galleries] = await Promise.all([
        teamDao.listOwn(),
        galleryDao.listByFilter({ state: "published" }, { pageSize: 200 }),
      ]);

      const urlList = [
        { loc: `${base}/`, priority: "1.0" },
        { loc: `${base}/teams`, priority: "0.8" },
        { loc: `${base}/gallery`, priority: "0.6" },
        { loc: `${base}/files`, priority: "0.4" },
        ...ownTeams.flatMap((team) => [
          { loc: `${base}/team?id=${team.id}&seasonId=`, priority: "0.7" },
          { loc: `${base}/team/matches?id=${team.id}`, priority: "0.7" },
          { loc: `${base}/team/table?id=${team.id}`, priority: "0.6" },
        ]),
        ...galleries.map((g) => ({ loc: `${base}/gallery/detail?id=${g.id}`, priority: "0.4" })),
      ];

      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urlList
          .map((u) => `  <url><loc>${u.loc.replace(/&/g, "&amp;")}</loc><priority>${u.priority}</priority></url>`)
          .join("\n") +
        "\n</urlset>\n";

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
      return false;
    },
  },

  // /rss zatím nevzniká: publikuje články, a ty do doby ECC nejsou (design/README.md,
  // sekce 2). Přidá se s nimi.
};
