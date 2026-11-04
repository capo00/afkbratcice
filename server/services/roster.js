import rosterDao from "../roster/dao.js";

// Hráč už členství v týmech nedrží (`afk_roster`, design/data-model.md, sekce 6.1), ale
// čtenáři API -- detail zápasu, sestava, stránka hráče, skrývání jmen dětí -- se ptají
// `player.teamList`. Tady se odvodí ze soupisky ve stejném tvaru jako dřív:
// `[{ id: teamId, dateFrom, dateTo }]`.

/** Hráči s odvozeným `teamList`, jedním dotazem na soupisku pro celý seznam. */
async function withTeamList(playerList) {
  const idList = [...new Set(playerList.map((p) => String(p.id)).filter(Boolean))];
  const rowList = await rosterDao.listByPlayerIdList(idList);
  return playerList.map((player) => ({
    ...player,
    teamList: rowList
      .filter((r) => r.playerId === String(player.id))
      .map((r) => ({ id: r.teamId, dateFrom: r.dateFrom ?? null, dateTo: r.dateTo ?? null })),
  }));
}

export { withTeamList };
