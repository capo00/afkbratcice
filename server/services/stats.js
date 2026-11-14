import matchDao from "../match/dao.js";
import playerDao from "../player/dao.js";
import personDao from "../person/dao.js";
import { countsTowardsTable } from "./table.js";
import { personForIdentity, isPlayerHidden } from "./hidden-names.js";
import { withTeamList } from "./roster.js";

// Statistiky hráčů se agregují v Mongu ($unwind nad playerList), ne v paměti -- sezóna
// má stovky zápasů a načítat je všechny kvůli součtu by bylo zbytečné.

function buildMatchFilter({ seasonId, teamId, playerId }) {
  const filter = {};
  if (seasonId) filter.seasonId = seasonId;
  if (teamId) filter.$or = [{ homeTeamId: teamId }, { guestTeamId: teamId }];
  if (playerId) filter["playerList.playerId"] = playerId;
  // Do statistik jdou jen odehrané soutěžní zápasy -- stejné pravidlo jako u tabulky.
  filter.round = { $type: "string" };
  filter.homeGoals = { $ne: null };
  return filter;
}

const SUM_STAGE = {
  $group: {
    _id: "$playerList.playerId",
    appearances: { $sum: 1 },
    starts: { $sum: { $cond: [{ $eq: ["$playerList.substitute", true] }, 0, 1] } },
    goals: { $sum: { $ifNull: ["$playerList.goals", 0] } },
    yellowCards: { $sum: { $cond: [{ $eq: ["$playerList.yellowCard", true] }, 1, 0] } },
    redCards: { $sum: { $cond: [{ $eq: ["$playerList.redCard", true] }, 1, 0] } },
  },
};

/**
 * Doplní k agregovaným řádkům hráče a osobu (bez kontaktů -- statistiky jsou veřejné).
 * `hidden`: statistiky dětí jdou bez jmen (services/hidden-names.js) -- `true`/`false` for the
 * whole list (the context of a team or a season decides), or a function `(player) => boolean`
 * deciding per player (no context; the player gets their `teamList` for it first).
 */
async function decorate(rowList, { hidden = false, identity } = {}) {
  const playerIdList = rowList.map((r) => r.playerId).filter(Boolean);
  if (!playerIdList.length) return [];

  const perPlayer = typeof hidden === "function";
  let players = await playerDao.listByIdList(playerIdList);
  if (perPlayer) players = await withTeamList(players);
  const personIdList = [...new Set(players.map((p) => p.personId).filter(Boolean))];
  const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];

  return rowList.map((row) => {
    const player = players.find((p) => p.id === row.playerId) ?? null;
    const found = player ? persons.find((x) => x.id === player.personId) : null;
    // O skrytí rozhoduje celá osoba (i `identity` kvůli výjimce pro ni samu), ořízne se až potom.
    const person = found ? personForIdentity(found, identity, perPlayer ? hidden(player) : hidden) : null;
    return {
      ...row,
      player: player ? { id: player.id, position: player.position } : null,
      person: person ? { id: person.id, name: person.name, surname: person.surname } : null,
    };
  });
}

/**
 * Whether the names in player statistics are hidden (services/hidden-names.js). With a season or
 * a team the context decides -- the age of the season, or the team asked about. Without either
 * the statistics span every category, so it is decided per player, the same rule as
 * `player/list` (an open membership in a hidden team); without it one anonymous request listed
 * the names of the whole U15 (review 2026-11-12, V3).
 *
 * @returns `true`/`false` for the whole list, or `(player) => boolean` for `decorate`
 */
function hiddenNamesRule({ seasonId, teamId, season, hiddenAgeList, hiddenTeamIdSet }) {
  if (!seasonId && !teamId) return (player) => isPlayerHidden(player, hiddenTeamIdSet);
  return hiddenAgeList.includes(season?.age) || (teamId ? hiddenTeamIdSet.has(teamId) : false);
}

async function listPlayerStats({ seasonId, teamId, hidden = false, identity } = {}) {
  const rows = await matchDao.aggregate([
    { $match: buildMatchFilter({ seasonId, teamId }) },
    { $unwind: "$playerList" },
    SUM_STAGE,
  ]);

  const rowList = rows
    .map(({ _id, ...rest }) => ({ playerId: _id ? String(_id) : null, ...rest }))
    .filter((r) => r.playerId)
    .sort((a, b) => b.goals - a.goals || b.appearances - a.appearances);

  return decorate(rowList, { hidden, identity });
}

/** Kariérní součet jednoho hráče plus rozpad po sezónách. */
async function getPlayerStats({ playerId }) {
  const rows = await matchDao.aggregate([
    { $match: buildMatchFilter({ playerId }) },
    { $unwind: "$playerList" },
    { $match: { "playerList.playerId": playerId } },
    {
      $group: {
        _id: "$seasonId",
        appearances: { $sum: 1 },
        starts: { $sum: { $cond: [{ $eq: ["$playerList.substitute", true] }, 0, 1] } },
        goals: { $sum: { $ifNull: ["$playerList.goals", 0] } },
        yellowCards: { $sum: { $cond: [{ $eq: ["$playerList.yellowCard", true] }, 1, 0] } },
        redCards: { $sum: { $cond: [{ $eq: ["$playerList.redCard", true] }, 1, 0] } },
      },
    },
  ]);

  const bySeasonList = rows.map(({ _id, ...rest }) => ({ seasonId: _id ? String(_id) : null, ...rest }));
  const total = bySeasonList.reduce(
    (acc, row) => ({
      appearances: acc.appearances + row.appearances,
      starts: acc.starts + row.starts,
      goals: acc.goals + row.goals,
      yellowCards: acc.yellowCards + row.yellowCards,
      redCards: acc.redCards + row.redCards,
    }),
    { appearances: 0, starts: 0, goals: 0, yellowCards: 0, redCards: 0 },
  );

  return { total, bySeasonList };
}

// `buildMatchFilter` je exportované kvůli testům: je to jediný kus statistik, který jde
// ověřit bez Monga, a zároveň ten, kde se pravidlo „jen odehrané soutěžní zápasy" musí
// shodovat s tabulkou (`countsTowardsTable`).
export { listPlayerStats, getPlayerStats, hiddenNamesRule, countsTowardsTable, buildMatchFilter };
