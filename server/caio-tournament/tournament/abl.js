const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");
const participantDao = require("../participant/dao");
const matchDao = require("../match/dao");

const idStr = (id) => id?.toString?.() || id;

function isAuthorities(identity) {
  return identity?.profileList?.includes("authorities");
}

function isOperator(tournament, identity) {
  if (!identity) return false;
  if (isAuthorities(identity)) return true;
  const id = identity.identity;
  return tournament.operativeList?.includes(id) || tournament.createdBy === id;
}

function assertAuthorities(identity) {
  if (!isAuthorities(identity)) {
    throw new OcAppCore.AppError.Failed("Only authorities can perform this action.", {
      code: "caio-tournament/tournament/forbidden",
      status: 403,
    });
  }
}

function assertOperator(tournament, identity) {
  if (!isOperator(tournament, identity)) {
    throw new OcAppCore.AppError.Failed("Only operators or authorities can perform this action.", {
      code: "caio-tournament/tournament/forbidden",
      status: 403,
    });
  }
}

function assertNotFinal(tournament) {
  if (tournament.state === "final") {
    throw new OcAppCore.AppError.Failed("Tournament is closed. No modifications allowed.", {
      code: "caio-tournament/tournament/tournamentClosed",
      status: 403,
    });
  }
}

function assertState(tournament, expected, message) {
  if (tournament.state !== expected) {
    throw new OcAppCore.AppError.Failed(message, {
      code: "caio-tournament/tournament/invalidState",
      status: 400,
    });
  }
}

function createBergerRounds(teamCount) {
  const n = teamCount;
  const isOdd = n % 2 === 1;
  const size = isOdd ? n + 1 : n;
  const rounds = isOdd ? n : n - 1;
  const pairs = [];
  let order = Array.from({ length: size }, (_, i) => i);

  for (let r = 0; r < rounds; r++) {
    const half = Math.floor(size / 2);
    for (let i = 0; i < half; i++) {
      const a = order[i];
      const b = order[size - 1 - i];
      if (isOdd && (a === size - 1 || b === size - 1)) continue;
      pairs.push([a, b]);
    }
    order = [order[0], order[size - 1], ...order.slice(1, size - 1)];
  }
  return pairs;
}

function headToHeadComparator(matches) {
  return (aId, bId) => {
    for (const m of matches) {
      if (m.status !== "played") continue;
      const hId = idStr(m.homeParticipantId);
      const awId = idStr(m.awayParticipantId);
      if (hId === aId && awId === bId) {
        if (m.score.home > m.score.away) return -1;
        if (m.score.home < m.score.away) return 1;
        return 0;
      }
      if (hId === bId && awId === aId) {
        if (m.score.home > m.score.away) return 1;
        if (m.score.home < m.score.away) return -1;
        return 0;
      }
    }
    return 0;
  };
}

function standingsSorter(statsGetter, h2h) {
  return (a, b) => {
    const sa = statsGetter(a);
    const sb = statsGetter(b);
    if ((sb.points || 0) !== (sa.points || 0)) return (sb.points || 0) - (sa.points || 0);
    const h = h2h(a, b);
    if (h !== 0) return h;
    const diffA = (sa.scored || 0) - (sa.conceded || 0);
    const diffB = (sb.scored || 0) - (sb.conceded || 0);
    if (diffB !== diffA) return diffB - diffA;
    return (sb.scored || 0) - (sa.scored || 0);
  };
}

class TournamentAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-tournament/tournament", dao);
  }

  async list({ pageInfo, state, excludeState } = {}) {
    const filter = {};
    if (state) filter.state = state;
    if (excludeState) filter.state = { $ne: excludeState };
    return await dao.list(filter, pageInfo);
  }

  async create(dtoIn, identity) {
    assertAuthorities(identity);
    const identityId = identity?.identity || null;
    return await super.create({
      state: "created",
      type: dtoIn.type,
      name: dtoIn.name,
      date: dtoIn.date,
      place: dtoIn.place,
      desc: dtoIn.desc,
      groupCount: dtoIn.groupCount,
      venueCount: dtoIn.venueCount,
      advanceFromGroup: dtoIn.advanceFromGroup,
      createdBy: identityId,
      operativeList: identityId ? [identityId] : [],
      refereeList: [],
    });
  }

  async update(dtoIn, identity) {
    const item = await this._get(dtoIn.id);
    assertNotFinal(item);
    assertOperator(item, identity);
    assertState(item, "created", "Tournament can only be updated in 'created' state.");
    return await super.update({ ...item, ...dtoIn }, { merge: false });
  }

  async delete(id, identity) {
    const item = await this._get(id);
    assertNotFinal(item);
    assertAuthorities(identity);
    return await super.delete(id);
  }

  async close(tournamentId, identity) {
    const tournament = await this._get(tournamentId);
    assertAuthorities(identity);
    assertState(tournament, "completed", "Tournament can only be closed in 'completed' state.");
    return await super.update({ id: tournamentId, state: "final" });
  }

  async generateMatches(tournamentId, identity) {
    const tournament = await this._get(tournamentId);
    assertOperator(tournament, identity);
    assertState(tournament, "created", "Matches can only be generated in 'created' state.");

    const participants = await participantDao.list({ tournamentId });
    const unassigned = participants.filter((p) => !p.group || p.seed == null);
    if (unassigned.length > 0) {
      throw new OcAppCore.AppError.Failed("All participants must have group and seed assigned before generating matches.", {
        code: "caio-tournament/tournament/participantsNotReady",
        status: 400,
      });
    }

    const byGroup = {};
    participants.forEach((p) => {
      byGroup[p.group] = byGroup[p.group] || [];
      byGroup[p.group].push(p);
    });

    const matches = [];
    for (const [group, list] of Object.entries(byGroup)) {
      const sorted = [...list].sort((a, b) => (a.seed || 0) - (b.seed || 0));
      const pairs = createBergerRounds(sorted.length);
      pairs.forEach(([i, j], round) => {
        matches.push({
          tournamentId,
          phase: "group",
          group,
          round,
          homeParticipantId: idStr(sorted[i].id),
          awayParticipantId: idStr(sorted[j].id),
          score: { home: null, away: null },
          winnerId: null,
          status: "scheduled",
          playedAt: null,
        });
      });
    }

    const created = await matchDao.createMany(matches);
    await dao.update({ id: tournamentId, state: "run" });
    return created;
  }

  async checkCompletion() {
    // completion is triggered manually via evaluate
  }

  async evaluate(tournamentId, identity) {
    const tournament = await this._get(tournamentId);
    assertOperator(tournament, identity);
    assertState(tournament, "playOff", "Tournament can only be evaluated in 'playOff' state.");

    const allPlayoff = await matchDao.list({
      tournamentId,
      phase: { $in: ["quarter", "semi", "thirdPlace", "final"] },
    });
    const unplayed = allPlayoff.filter((m) => m.status !== "played");
    if (unplayed.length > 0) {
      throw new OcAppCore.AppError.Failed("All playoff matches (including 3rd place and final) must be played.", {
        code: "caio-tournament/tournament/playoffNotFinished",
        status: 400,
      });
    }

    const finalStandings = await this.#buildFinalStandings(tournamentId);
    await dao.update({ id: tournamentId, state: "completed", finalStandings });
    return finalStandings;
  }

  async getFinalStandings(tournamentId) {
    const tournament = await this._get(tournamentId);
    return tournament.finalStandings || [];
  }

  async generatePlayoff(tournamentId, identity) {
    const tournament = await this._get(tournamentId);
    assertOperator(tournament, identity);
    assertState(tournament, "run", "Playoff can only be generated in 'run' state.");

    const groupMatches = await matchDao.list({ tournamentId, phase: "group" });
    if (groupMatches.length === 0 || !groupMatches.every((m) => m.status === "played")) {
      throw new OcAppCore.AppError.Failed("All group matches must be played before generating playoff.", {
        code: "caio-tournament/tournament/groupMatchesNotPlayed",
        status: 400,
      });
    }

    const groupCount = tournament.groupCount || 1;
    const advanceFromGroup = tournament.advanceFromGroup || 1;
    const groups = Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i));

    const advancing = [];
    for (const group of groups) {
      const standings = await this.listStandings(tournamentId, group);
      advancing.push(...standings.slice(0, advanceFromGroup).map((p, idx) => ({ ...p, groupRank: idx + 1, group })));
    }

    const totalAdvancing = advancing.length;
    let firstPhase;
    if (totalAdvancing <= 2) firstPhase = "final";
    else if (totalAdvancing <= 4) firstPhase = "semi";
    else firstPhase = "quarter";

    const seeded = totalAdvancing <= 2 ? advancing : this.#seedCross(advancing, groupCount);

    const playoffMatches = [];
    for (let i = 0; i < seeded.length; i += 2) {
      if (!seeded[i] || !seeded[i + 1]) continue;
      playoffMatches.push({
        tournamentId,
        phase: firstPhase,
        group: null,
        round: i / 2,
        homeParticipantId: idStr(seeded[i].id),
        awayParticipantId: idStr(seeded[i + 1].id),
        score: { home: null, away: null },
        winnerId: null,
        status: "scheduled",
        playedAt: null,
      });
    }

    const created = await matchDao.createMany(playoffMatches);
    await dao.update({ id: tournamentId, state: "playOff" });
    return created;
  }

  async listStandings(tournamentId, group = null) {
    const filter = { tournamentId };
    if (group) filter.group = group;
    const participants = await participantDao.list(filter);
    const matches = await matchDao.list({ tournamentId, phase: "group", ...(group ? { group } : {}) });

    const h2h = headToHeadComparator(matches);
    participants.sort(standingsSorter(
      (p) => p.stats || {},
      (a, b) => h2h(idStr(a.id), idStr(b.id)),
    ));
    return participants;
  }

  async playoff(tournamentId) {
    return await matchDao.list({ tournamentId, phase: { $in: ["quarter", "semi", "thirdPlace", "final"] } });
  }

  #seedCross(advancing, groupCount) {
    const byGroup = {};
    advancing.forEach((p) => {
      byGroup[p.group] = byGroup[p.group] || [];
      byGroup[p.group].push(p);
    });
    const groupKeys = Object.keys(byGroup).sort();
    groupKeys.forEach((g) => byGroup[g].sort((a, b) => a.groupRank - b.groupRank));

    const pairs = [];
    const n = byGroup[groupKeys[0]]?.length || 0;

    if (groupKeys.length === 2) {
      const gA = byGroup[groupKeys[0]];
      const gB = byGroup[groupKeys[1]];
      for (let i = 0; i < n; i++) {
        const oppIdx = n - 1 - i;
        if (gA[i] && gB[oppIdx]) pairs.push(gA[i], gB[oppIdx]);
        if (gB[i] && gA[oppIdx]) pairs.push(gB[i], gA[oppIdx]);
      }
    } else {
      for (let i = 0; i < groupKeys.length; i++) {
        const oppIdx = (i + 1) % groupKeys.length;
        const gHome = byGroup[groupKeys[i]];
        const gAway = byGroup[groupKeys[oppIdx]];
        for (let r = 0; r < gHome.length; r++) {
          const away = gAway[gAway.length - 1 - r];
          if (away) pairs.push(gHome[r], away);
        }
      }
    }

    const seen = new Set();
    const unique = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const key = [idStr(pairs[i].id), idStr(pairs[i + 1].id)].sort().join("-");
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(pairs[i], pairs[i + 1]);
      }
    }
    return unique;
  }

  async #buildFinalStandings(tournamentId) {
    const allMatches = await matchDao.list({ tournamentId });
    const allParticipants = await participantDao.list({ tournamentId });

    const pMap = {};
    allParticipants.forEach((p) => { pMap[idStr(p.id)] = p; });

    const finalMatch = allMatches.find((m) => m.phase === "final" && m.status === "played");
    const thirdMatch = allMatches.find((m) => m.phase === "thirdPlace" && m.status === "played");

    const placed = new Set();
    const standings = [];

    const addMatchPlacement = (match, winPos, losePos) => {
      if (!match) return;
      const winnerId = idStr(match.winnerId);
      const loserId = winnerId === idStr(match.homeParticipantId)
        ? idStr(match.awayParticipantId) : idStr(match.homeParticipantId);
      standings.push({ position: winPos, participantId: winnerId, name: pMap[winnerId]?.name || "?" });
      standings.push({ position: losePos, participantId: loserId, name: pMap[loserId]?.name || "?" });
      placed.add(winnerId);
      placed.add(loserId);
    };

    addMatchPlacement(finalMatch, 1, 2);
    addMatchPlacement(thirdMatch, 3, 4);

    for (const phase of ["quarter", "semi"]) {
      const phaseMatches = allMatches.filter((m) => m.phase === phase && m.status === "played");
      if (phaseMatches.length === 0) continue;

      const losers = [];
      phaseMatches.forEach((m) => {
        const wId = idStr(m.winnerId);
        const lId = wId === idStr(m.homeParticipantId)
          ? idStr(m.awayParticipantId) : idStr(m.homeParticipantId);
        if (!placed.has(lId)) losers.push(lId);
      });

      const loserMatches = allMatches.filter(
        (m) => m.phase === "group" && m.status === "played"
          && losers.includes(idStr(m.homeParticipantId))
          && losers.includes(idStr(m.awayParticipantId))
      );

      const h2h = headToHeadComparator(loserMatches);
      losers.sort(standingsSorter((id) => pMap[id]?.stats || {}, h2h));
      this.#assignSharedPositions(losers, standings, placed, pMap, h2h, (id) => pMap[id]?.stats || {});
    }

    const remaining = allParticipants
      .filter((p) => !placed.has(idStr(p.id)))
      .map((p) => ({ ...p, pid: idStr(p.id) }));

    const groupMatches = allMatches.filter((m) => m.phase === "group" && m.status === "played");
    const h2h = headToHeadComparator(groupMatches);

    remaining.sort(standingsSorter(
      (p) => p.stats || {},
      (a, b) => h2h(a.pid, b.pid),
    ));

    this.#assignSharedPositions(
      remaining.map((p) => p.pid),
      standings, placed, pMap,
      h2h,
      (id) => pMap[id]?.stats || {},
    );

    return standings;
  }

  #assignSharedPositions(ids, standings, placed, pMap, h2h, statsGetter) {
    let i = 0;
    while (i < ids.length) {
      let j = i + 1;
      while (j < ids.length) {
        const sa = statsGetter(ids[i]);
        const sb = statsGetter(ids[j]);
        const samePoints = (sa.points || 0) === (sb.points || 0);
        const sameDiff = ((sa.scored || 0) - (sa.conceded || 0)) === ((sb.scored || 0) - (sb.conceded || 0));
        const sameScored = (sa.scored || 0) === (sb.scored || 0);
        if (samePoints && h2h(ids[i], ids[j]) === 0 && sameDiff && sameScored) {
          j++;
        } else {
          break;
        }
      }
      const pos = standings.length + 1;
      for (let k = i; k < j; k++) {
        standings.push({
          position: pos,
          participantId: ids[k],
          name: pMap[ids[k]]?.name || "?",
          shared: j - i > 1,
        });
        placed.add(ids[k]);
      }
      i = j;
    }
  }
}

module.exports = new TournamentAbl();
