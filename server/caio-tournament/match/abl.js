const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");
const participantDao = require("../participant/dao");
const tournamentDao = require("../tournament/dao");

const idStr = (id) => id?.toString?.() || id;

function getWinnerId(match) {
  if (match.score?.home == null || match.score?.away == null) return null;
  if (match.score.home > match.score.away) return idStr(match.homeParticipantId);
  if (match.score.away > match.score.home) return idStr(match.awayParticipantId);
  return null;
}

function isAuthorities(identity) {
  return identity?.profileList?.includes("authorities");
}

function isReferee(tournament, identity) {
  if (!identity) return false;
  if (isAuthorities(identity)) return true;
  return tournament.refereeList?.includes(identity.identity);
}

function assertReferee(tournament, identity) {
  if (!isReferee(tournament, identity)) {
    throw new OcAppCore.AppError.Failed("Only referees or authorities can perform this action.", {
      code: "caio-tournament/match/forbidden",
      status: 403,
    });
  }
}

class MatchAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-tournament/match", dao);
  }

  async list(tournamentId, dtoIn = {}) {
    if (dtoIn.phase === "playoff") {
      return await dao.listPlayoff(tournamentId, dtoIn.pageInfo);
    } else if (dtoIn.phase === "group") {
      return await dao.listGroup(tournamentId, dtoIn.group, dtoIn.pageInfo);
    }
    return await dao.list(tournamentId, dtoIn.pageInfo);
  }

  async setResult(matchId, dtoIn, identity) {
    let tournamentId = dtoIn.tournamentId;
    let match;
    if (!tournamentId) {
      match = await this._get(matchId);
      tournamentId = match.tournamentId;
    }

    const tournament = await tournamentDao.get(tournamentId);
    if (!tournament) throw new OcAppCore.Crud.Error.DoesNotExists("tournament");

    assertReferee(tournament, identity);

    if (tournament.state === "final") {
      throw new OcAppCore.AppError.Failed("Tournament is closed. No modifications allowed.", {
        code: "caio-tournament/match/tournamentClosed",
        status: 403,
      });
    }

    const homeScore = Number(dtoIn.home);
    const awayScore = Number(dtoIn.away);
    if (isNaN(homeScore) || isNaN(awayScore)) {
      throw new OcAppCore.AppError.Failed("Invalid score", { code: "caio-tournament/match/invalidScore" });
    }

    if (!match) match = await this._get(matchId);

    const oldWinnerId = match.state === "played" ? getWinnerId(match) : null;

    let winnerId = null;
    if (homeScore > awayScore) winnerId = match.homeParticipantId;
    else if (awayScore > homeScore) winnerId = match.awayParticipantId;

    let allPlayoff = null;
    if (match.phase === "playoff" && oldWinnerId && idStr(oldWinnerId) !== idStr(winnerId)) {
      allPlayoff = await this.#assertDownstreamNotPlayed(match);
    }

    await dao.update({
      id: matchId,
      score: { home: homeScore, away: awayScore },
      state: "played",
      playedAt: new Date(),
    });

    if (match.phase === "group") {
      await this.#recalculateStandings(match.tournamentId, match.group);
    } else {
      await this.#advancePlayoffWinner(match, winnerId, oldWinnerId, allPlayoff);
    }

    return await dao.get(matchId);
  }

  async #recalculateStandings(tournamentId, group) {
    const participants = await participantDao.list({ tournamentId, group });
    const matches = await dao.listGroup(tournamentId, group);

    const statsMap = {};
    participants.forEach((p) => {
      statsMap[idStr(p.id)] = { played: 0, wins: 0, draws: 0, losses: 0, scored: 0, conceded: 0, points: 0 };
    });

    matches.forEach((m) => {
      if (m.state !== "played" || m.score?.home == null) return;
      const homeId = idStr(m.homeParticipantId);
      const awayId = idStr(m.awayParticipantId);
      const homeStats = statsMap[homeId];
      const awayStats = statsMap[awayId];
      if (!homeStats || !awayStats) return;

      const h = m.score.home;
      const a = m.score.away;

      homeStats.played++;
      awayStats.played++;
      homeStats.scored += h;
      homeStats.conceded += a;
      awayStats.scored += a;
      awayStats.conceded += h;

      if (h > a) {
        homeStats.wins++;
        homeStats.points += 3;
        awayStats.losses++;
      } else if (a > h) {
        awayStats.wins++;
        awayStats.points += 3;
        homeStats.losses++;
      } else {
        homeStats.draws++;
        awayStats.draws++;
        homeStats.points++;
        awayStats.points++;
      }
    });

    for (const [participantId, stats] of Object.entries(statsMap)) {
      await participantDao.update({ id: participantId, stats });
    }
  }

  async #assertDownstreamNotPlayed(match) {
    const GROUP_ORDER = ["quarter", "semi", "final"];
    const currentIdx = GROUP_ORDER.indexOf(match.group);
    if (currentIdx < 0) return null;

    const downstreamGroups = GROUP_ORDER.slice(currentIdx + 1);
    downstreamGroups.push("thirdPlace");

    const allPlayoff = await dao.listPlayoff(match.tournamentId);
    const hasPlayedDownstream = allPlayoff.some(
      (m) => downstreamGroups.includes(m.group) && m.state === "played",
    );
    if (hasPlayedDownstream) {
      throw new OcAppCore.AppError.Failed("Cannot change result: downstream matches already played.", {
        code: "caio-tournament/match/downstreamPlayed",
        status: 400,
      });
    }
    return allPlayoff;
  }

  async #advancePlayoffWinner(match, winnerId, oldWinnerId, allPlayoff) {
    if (!winnerId) return;
    if (match.group === "final" || match.group === "thirdPlace") return;

    const GROUP_ORDER = ["quarter", "semi", "final"];
    const currentIdx = GROUP_ORDER.indexOf(match.group);
    if (currentIdx < 0 || currentIdx >= GROUP_ORDER.length - 1) return;

    const nextGroup = GROUP_ORDER[currentIdx + 1];

    if (!allPlayoff) allPlayoff = await dao.listPlayoff(match.tournamentId);
    let maxRound = allPlayoff.reduce((max, m) => Math.max(max, m.round || 0), 0);

    const currentGroupMatches = allPlayoff.filter((m) => m.group === match.group);
    currentGroupMatches.sort((a, b) => (a.round || 0) - (b.round || 0));
    const matchIndex = currentGroupMatches.findIndex((m) => idStr(m.id) === idStr(match.id));
    const pairIndex = Math.floor(matchIndex / 2);

    const nextMatches = allPlayoff.filter((m) => m.group === nextGroup);
    nextMatches.sort((a, b) => (a.round || 0) - (b.round || 0));
    const nextMatch = nextMatches[pairIndex];

    // third place match must be before final match (round should be lower)
    if (match.group === "semi") {
      const loserId = idStr(winnerId) === idStr(match.homeParticipantId)
        ? match.awayParticipantId
        : match.homeParticipantId;
      const oldLoserId = oldWinnerId
        ? (idStr(oldWinnerId) === idStr(match.homeParticipantId) ? match.awayParticipantId : match.homeParticipantId)
        : null;

      const thirdPlaceMatches = allPlayoff.filter((m) => m.group === "thirdPlace");
      const thirdMatch = thirdPlaceMatches[0];

      if (thirdMatch) {
        if (!oldLoserId) {
          await dao.update({ id: thirdMatch.id, awayParticipantId: loserId });
        } else if (idStr(oldLoserId) !== idStr(loserId)) {
          const update = { id: thirdMatch.id };
          if (idStr(thirdMatch.homeParticipantId) === idStr(oldLoserId)) {
            update.homeParticipantId = loserId;
          } else {
            update.awayParticipantId = loserId;
          }
          await dao.update(update);
        }
      } else {
        await super.create({
          tournamentId: match.tournamentId,
          phase: "playoff",
          group: "thirdPlace",
          round: ++maxRound,
          homeParticipantId: loserId,
          awayParticipantId: null,
          score: { home: null, away: null },
          state: "scheduled",
          playedAt: null,
        });
      }
    }

    if (nextMatch) {
      if (!oldWinnerId) {
        await dao.update({ id: nextMatch.id, awayParticipantId: winnerId });
      } else if (idStr(oldWinnerId) !== idStr(winnerId)) {
        const update = { id: nextMatch.id };
        if (idStr(nextMatch.homeParticipantId) === idStr(oldWinnerId)) {
          update.homeParticipantId = winnerId;
        } else {
          update.awayParticipantId = winnerId;
        }
        await dao.update(update);
      }
    } else {
      await super.create({
        tournamentId: match.tournamentId,
        phase: "playoff",
        group: nextGroup,
        round: ++maxRound,
        homeParticipantId: winnerId,
        awayParticipantId: null,
        score: { home: null, away: null },
        state: "scheduled",
        playedAt: null,
      });
    }
  }
}

module.exports = new MatchAbl();
