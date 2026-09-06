// Smoke test API proti BĚŽÍCÍMU serveru (`npm run dev` v jiném okně).
//
//   npm run smoke
//
// Zakládá vlastní data se jménem SMOKE, ověřuje bodování tabulky, autorizaci včetně
// role s rozsahem, pohledy na zápasy, ochranu osobních údajů, legacy přesměrování,
// iCal a sitemap -- a po sobě uklidí. Je to náhrada za neexistující integrační testy,
// ne za ně: běží proti reálnému Mongu, takže odhalí i chyby v indexech a v dotazech.
const BASE = process.env.SMOKE_BASE || `http://localhost:${process.env.PORT || 8081}`;

let pass = 0;
let fail = 0;

function ok(name, cond, detail) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? " -> " + JSON.stringify(detail) : "")); }
}

async function get(uc, dtoIn = {}, cookie) {
  const qs = new URLSearchParams(
    Object.entries(dtoIn).filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)]),
  );
  const res = await fetch(`${BASE}/${uc}?${qs}`, { headers: cookie ? { cookie } : {} });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function post(uc, dtoIn = {}, cookie) {
  const res = await fetch(`${BASE}/${uc}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(dtoIn),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// --- přihlášení správce -------------------------------------------------------
const ADMIN = { email: `smoke-admin-${Date.now()}@afkbratcice.cz`, password: "SmokeHeslo123" };
const reg = await post("auth/register", { firstName: "Smoke", surname: "Admin", ...ADMIN });
ok("registrace projde", reg.status === 201, reg.body);

// profil authorities zapíšeme přímo do Monga (jako první správce v ostrém provozu)
const { MongoClient } = await import("mongodb");
const mongo = new MongoClient("mongodb://127.0.0.1:27017");
await mongo.connect();
const db = mongo.db("afkbratcice");
await db.collection("sys_identity").updateOne(
  { email: ADMIN.email },
  { $set: { profileList: ["authorities"] } },
);

const login = await fetch(`${BASE}/auth/login`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ADMIN),
});
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
ok("přihlášení vrátí cookie", Boolean(cookie), cookie);

console.log("\n== health a konfigurace ==");
const health = await get("sys/health");
ok("sys/health hlásí mongo", health.body?.mongoConfigured === true, health.body);
const cfg = await get("appConfig/get");
ok("appConfig má výchozí pořadí kategorií", cfg.body?.categoryOrder?.[0] === "men", cfg.body?.categoryOrder);
ok("appConfig skrývá jména u žáků, ne u dorostu",
  cfg.body?.hideNamesAgeList?.includes("u14") && !cfg.body?.hideNamesAgeList?.includes("u18"),
  cfg.body?.hideNamesAgeList);

console.log("\n== autorizace ==");
const anon = await post("team/create", { name: "Anonym", age: "men" });
ok("nepřihlášený nezaloží tým (401)", anon.status === 401, anon.status);
const publicList = await get("team/list");
ok("veřejné čtení funguje bez přihlášení", publicList.status === 200, publicList.status);

console.log("\n== týmy a sezóna ==");
const own = await post("team/create", { name: "AFK Bratčice SMOKE", shortName: "AFK", age: "men", own: true }, cookie);
ok("založení vlastního týmu", own.status === 200 && own.body?.id, own.body);
const rival1 = await post("team/create", { name: "SMOKE Rival A", age: "men" }, cookie);
const rival2 = await post("team/create", { name: "SMOKE Rival B", age: "men" }, cookie);
const teamIds = [own.body.id, rival1.body.id, rival2.body.id];

const badTeam = await post("team/create", { name: "AFK Bratčice SMOKE", age: "men" }, cookie);
ok("duplicitní tým v kategorii neprojde", badTeam.status >= 400, badTeam.status);

const year = String(new Date().getMonth() + 1 < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear());
// `hasPenalties` je povinné, aby dávalo smysl testovat bodování 3/2/1/0: bez něj se
// remíza s vyplněným vítězem rozstřelu počítá po bodu, protože o modelu rozhoduje
// sezóna, ne zápis u zápasu (design/data-model.md, sekce 3).
const season = await post("season/create", {
  competition: "SMOKE III. třída", yearFrom: year, age: "men", teamList: teamIds, hasPenalties: true,
}, cookie);
ok("založení sezóny", season.status === 200 && season.body?.id, season.body);

console.log("\n== dynamické kategorie ==");
const current = await get("season/listCurrent");
const mine = current.body?.itemList?.find((i) => i.seasonId === season.body.id);
ok("season/listCurrent najde kategorii klubu", Boolean(mine), current.body);
ok("season/listCurrent hlásí hasPenalties", mine?.hasPenalties === true, mine);
ok("kategorie nese teamId a hasTable", mine?.teamId === own.body.id && mine?.hasTable === true, mine);
const emptyYear = await get("season/listCurrent", { yearFrom: "1990" });
ok("ročník bez sezón vrací prázdno", emptyYear.body?.itemList?.length === 0, emptyYear.body);

console.log("\n== zápasy a tabulka ==");
const mk = (h, g, hg, gg, round, extra = {}) => post("match/create", {
  seasonId: season.body.id, homeTeamId: h, guestTeamId: g,
  homeGoals: hg, guestGoals: gg, round, time: `2026-0${round || 9}-01T15:00:00.000Z`, ...extra,
}, cookie);

const m1 = await mk(teamIds[0], teamIds[1], 2, 1, "1");
ok("založení zápasu", m1.status === 200, m1.body);
const m2 = await mk(teamIds[1], teamIds[2], 1, 1, "2", { penaltyWinnerTeamId: teamIds[1] });
const m3 = await mk(teamIds[2], teamIds[0], 0, 0, "3");
// přátelák -- do tabulky nesmí
const friendly = await mk(teamIds[0], teamIds[2], 9, 0, "");
ok("přátelák se založí i bez kola", friendly.status === 200, friendly.body);
const friendly2 = await mk(teamIds[0], teamIds[2], 5, 0, "");
ok("druhý přátelák stejné dvojice projde (částečný index)", friendly2.status === 200, friendly2.body);

const sameTeams = await mk(teamIds[0], teamIds[0], 1, 0, "9");
ok("tým nesmí hrát sám se sebou", sameTeams.status >= 400, sameTeams.status);

const table = await get("stats/getTable", { seasonId: season.body.id });
const rows = table.body?.table ?? [];
const row = (id) => rows.find((r) => r.team.id === id);
ok("tabulka má 3 týmy", rows.length === 3, rows.length);
ok("výhra 3 + remíza 1 = 4 body", row(teamIds[0])?.points === 4, row(teamIds[0]));
ok("výhra na penalty = 2 body", row(teamIds[1])?.points === 2, row(teamIds[1]));
ok("prohra na penalty = 1 bod, remíza 1 = 2", row(teamIds[2])?.points === 2, row(teamIds[2]));
ok("přátelák se do skóre nepočítá", row(teamIds[0])?.goalsFor === 2, row(teamIds[0])?.goalsFor);
ok("vzájemný zápas rozhodl pořadí (B před C)",
  rows.findIndex((r) => r.team.id === teamIds[1]) < rows.findIndex((r) => r.team.id === teamIds[2]),
  rows.map((r) => r.team.name));
ok("forma se počítá", Array.isArray(row(teamIds[0])?.form) && row(teamIds[0]).form.length === 2, row(teamIds[0])?.form);

const badPenalty = await post("match/setResult", {
  id: m1.body.id, homeGoals: 2, guestGoals: 1, penaltyWinnerTeamId: teamIds[0],
}, cookie);
ok("rozstřel u neremízy je chyba", badPenalty.status >= 400, badPenalty.status);

console.log("\n== pohledy na zápasy ==");
const round2 = await get("match/list", { seasonId: season.body.id, round: "2" });
ok("kolo v soutěži vrátí jeden zápas", round2.body?.itemList?.length === 1, round2.body?.itemList?.length);
const program = await get("match/list", {
  teamIdList: teamIds.slice(0, 1), dateFrom: "2026-01-01T00:00:00.000Z", dateTo: "2026-12-31T00:00:00.000Z",
});
ok("program podle rozsahu dat", (program.body?.itemList?.length ?? 0) >= 3, program.body?.itemList?.length);
const h2h = await get("match/list", { teamId: teamIds[0], opponentId: teamIds[2] });
ok("vzájemné zápasy najdou obě orientace", h2h.body?.itemList?.length === 3, h2h.body?.itemList?.length);
const desc = await get("match/list", { seasonId: season.body.id, order: "desc" });
const asc = await get("match/list", { seasonId: season.body.id, order: "asc" });
ok("řazení asc/desc je opačné",
  desc.body?.itemList?.[0]?.id === asc.body?.itemList?.at(-1)?.id, {
    desc: desc.body?.itemList?.[0]?.id, asc: asc.body?.itemList?.at(-1)?.id });

console.log("\n== osoby, hráči, soukromí ==");
const person = await post("person/create", {
  name: "Jan", surname: "Smoke", email: "jan@smoke.cz", phone: "+420111222333",
}, cookie);
ok("založení osoby", person.status === 200, person.body);
const player = await post("player/create", {
  personId: person.body.id, position: "MF", number: 8, teamList: [{ id: teamIds[0], dateFrom: "2026-01-01", dateTo: null }],
}, cookie);
ok("založení hráče", player.status === 200, player.body);

const anonPerson = await get("person/get", { id: person.body.id });
ok("nepřihlášený nevidí e-mail osoby", anonPerson.body?.email === undefined, anonPerson.body);
const adminPerson = await get("person/get", { id: person.body.id }, cookie);
ok("správce e-mail vidí", adminPerson.body?.email === "jan@smoke.cz", adminPerson.body?.email);
const anonRoster = await get("player/list", { teamId: teamIds[0], active: "true" });
ok("soupiska je veřejná a bez kontaktů",
  anonRoster.body?.itemList?.[0]?.person?.surname === "Smoke" && anonRoster.body.itemList[0].person.phone === undefined,
  anonRoster.body?.itemList?.[0]?.person);

console.log("\n== sestava a statistiky ==");
const lineup = await post("match/setLineup", {
  id: m1.body.id,
  playerList: [{ playerId: player.body.id, position: "MF", substitute: false, goals: 2, yellowCard: true, redCard: false }],
}, cookie);
ok("zápis sestavy", lineup.status === 200, lineup.body);
const stats = await get("stats/listPlayerStats", { seasonId: season.body.id });
const st = stats.body?.itemList?.[0];
ok("statistiky sečtou góly a karty", st?.goals === 2 && st?.yellowCards === 1 && st?.appearances === 1, st);
const playerStats = await get("stats/getPlayerStats", { playerId: player.body.id });
ok("statistika hráče má součet i sezóny",
  playerStats.body?.total?.goals === 2 && playerStats.body?.bySeasonList?.length === 1, playerStats.body);

const matchDetail = await get("match/get", { id: m1.body.id });
ok("detail zápasu vloží týmy a sestavu",
  matchDetail.body?.homeTeam?.id === teamIds[0] && matchDetail.body?.playerList?.[0]?.person?.surname === "Smoke",
  { home: matchDetail.body?.homeTeam?.name, lineup: matchDetail.body?.playerList?.length });

console.log("\n== teamEditor (role s rozsahem) ==");
await db.collection("sys_identity").updateOne(
  { email: ADMIN.email }, { $set: { profileList: ["teamEditor:" + teamIds[0]] } },
);
const teLogin = await fetch(`${BASE}/auth/login`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ADMIN),
});
const teCookie = (teLogin.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

const teOwn = await post("team/update", { id: teamIds[0], shortName: "AFK2" }, teCookie);
ok("teamEditor upraví svůj tým", teOwn.status === 200, teOwn.status);
const teForeign = await post("team/update", { id: teamIds[1], shortName: "X" }, teCookie);
ok("teamEditor neupraví cizí tým", teForeign.status === 401, teForeign.status);
const teDelete = await post("match/delete", { id: m3.body.id }, teCookie);
ok("teamEditor nesmí mazat zápasy", teDelete.status === 401, teDelete.status);
const teSwap = await post("match/update", { id: m1.body.id, guestTeamId: teamIds[2], note: "poznamka" }, teCookie);
const afterSwap = await get("match/get", { id: m1.body.id });
ok("teamEditor nepřepíše soupeře, ale poznámku ano",
  teSwap.status === 200 && afterSwap.body?.guestTeamId === teamIds[1] && afterSwap.body?.note === "poznamka",
  { guest: afterSwap.body?.guestTeamId, note: afterSwap.body?.note });
const teIdentity = await get("identity/adminList", {}, teCookie);
ok("teamEditor nevidí identity", teIdentity.status === 401, teIdentity.status);

console.log("\n== legacy přesměrování ==");
// Adresy nové appky jsou české a shodné s v0, takže `/historie` se **nepřesměrovává** --
// SPA fallback ji obslouží rovnou. Přesměrování zbylo jen tam, kde se adresa liší.
const redir = await fetch(`${BASE}/tymove_fotky`, { redirect: "manual" });
ok("/tymove_fotky -> /tymove-fotky", redir.status === 301 && redir.headers.get("location") === "/tymove-fotky",
  { status: redir.status, loc: redir.headers.get("location") });
const gone = await fetch(`${BASE}/pokladna`, { redirect: "manual" });
ok("/pokladna je 410 Gone", gone.status === 410, gone.status);
const news = await fetch(`${BASE}/home-3`, { redirect: "manual" });
ok("/home-3 -> stránkování novinek", news.headers.get("location") === "/novinky?pageIndex=2", news.headers.get("location"));

console.log("\n== iCal a sitemap ==");
const ics = await fetch(`${BASE}/calendar/team?teamId=${teamIds[0]}`);
const icsBody = await ics.text();
ok("iCal má hlavičku i události",
  ics.headers.get("content-type")?.includes("text/calendar") && icsBody.includes("BEGIN:VEVENT"),
  ics.headers.get("content-type"));
ok("iCal obsahuje název zápasu", icsBody.includes("SUMMARY:AFK Bratčice SMOKE"), icsBody.split("\r\n").find((l) => l.startsWith("SUMMARY")));
const sitemap = await fetch(`${BASE}/sitemap.xml`);
ok("sitemap je XML", (await sitemap.text()).startsWith("<?xml"), sitemap.status);

// --- úklid --------------------------------------------------------------------
console.log("\n== úklid ==");
for (const c of ["team", "season", "match", "person", "player"]) {
  await db.collection(c).deleteMany({ $or: [{ name: /SMOKE/ }, { competition: /SMOKE/ }, { surname: "Smoke" }, { seasonId: season.body.id }] });
}
await db.collection("sys_identity").deleteMany({ email: ADMIN.email });
await mongo.close();
console.log("  hotovo");

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
