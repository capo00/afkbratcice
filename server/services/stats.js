import matchDao from "../match/dao.js";
import playerDao from "../player/dao.js";
import personDao from "../person/dao.js";
import { countsTowardsTable } from "./table.js";

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

/** Doplní k agregovaným řádkům hráče a osobu (bez kontaktů -- statistiky jsou veřejné). */
async function decorate(rowList) {
  const playerIdList = rowList.map((r) => r.playerId).filter(Boolean);
  if (!playerIdList.length) return [];

  const players = await playerDao.listByIdList(playerIdList);
  const personIdList = [...new Set(players.map((p) => p.personId).filter(Boolean))];
  const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];

  return rowList.map((row) => {
    const player = players.find((p) => p.id === row.playerId) ?? null;
    const person = player ? persons.find((x) => x.id === player.personId) : null;
    return {
      ...row,
      player: player ? { id: player.id, position: player.position, number: player.number } : null,
      person: person ? { id: person.id, name: person.name, surname: person.surname } : null,
    };
  });
}

async function listPlayerStats({ seasonId, teamId } = {}) {
  const rows = await matchDao.aggregate([
    { $match: buildMatchFilter({ seasonId, teamId }) },
    { $unwind: "$playerList" },
    SUM_STAGE,
  ]);

  const rowList = rows
    .map(({ _id, ...rest }) => ({ playerId: _id ? String(_id) : null, ...rest }))
    .filter((r) => r.playerId)
    .sort((a, b) => b.goals - a.goals || b.appearances - a.appearances);

  return decorate(rowList);
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

export { listPlayerStats, getPlayerStats, countsTowardsTable };
