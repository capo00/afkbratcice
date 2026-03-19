const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");
const participantDao = require("../participant/dao");
const tournamentDao = require("../tournament/dao");

const idStr = (id) => id?.toString?.() || id;

class MatchAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-tournament/match", dao);
  }

  async list(tournamentId, dtoIn = {}) {
    const filter = { tournamentId };
    if (dtoIn.phase) filter.phase = dtoIn.phase;
    if (dtoIn.group) filter.group = dtoIn.group;
    return await dao.list(filter, dtoIn.pageInfo);
  }

  async setResult(matchId, dtoIn, identity) {
    const match = await this._get(matchId);

    const tournament = await tournamentDao.get(match.tournamentId);
    if (!tournament) throw new OcAppCore.Crud.Error.DoesNotExists("tournament");

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

    let winnerId = null;
    if (homeScore > awayScore) winnerId = match.homeParticipantId;
    else if (awayScore > homeScore) winnerId = match.awayParticipantId;

    await dao.update({
      id: matchId,
      score: { home: homeScore, away: awayScore },
      winnerId,
      status: "played",
      playedAt: new Date(),
    });

    if (match.phase === "group") {
      await this.#recalculateStandings(match.tournamentId, match.group);
    } else {
      await this.#advancePlayoffWinner(match, winnerId);
    }

    const TournamentAbl = require("../tournament/abl");
    await TournamentAbl.checkCompletion(match.tournamentId);

    return await dao.get(matchId);
  }

  async #recalculateStandings(tournamentId, group) {
    const participants = await participantDao.list({ tournamentId, group });
    const matches = await dao.list({ tournamentId, phase: "group", group });

    const statsMap = {};
    participants.forEach((p) => {
      statsMap[idStr(p.id)] = { played: 0, wins: 0, draws: 0, losses: 0, scored: 0, conceded: 0, points: 0 };
    });

    matches.forEach((m) => {
      if (m.status !== "played" || m.score?.home == null) return;
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

  async #advancePlayoffWinner(match, winnerId) {
    if (!winnerId) return;
    if (match.phase === "final" || match.phase === "thirdPlace") return;

    const PHASE_ORDER = ["quarter", "semi", "final"];
    const currentIdx = PHASE_ORDER.indexOf(match.phase);
    if (currentIdx < 0 || currentIdx >= PHASE_ORDER.length - 1) return;

    const nextPhase = PHASE_ORDER[currentIdx + 1];

    const currentPhaseMatches = await dao.list({ tournamentId: match.tournamentId, phase: match.phase });
    currentPhaseMatches.sort((a, b) => (a.round || 0) - (b.round || 0));

    const matchIndex = currentPhaseMatches.findIndex((m) => idStr(m.id) === idStr(match.id));
    const pairIndex = Math.floor(matchIndex / 2);
    const pairStart = pairIndex * 2;
    const partner = currentPhaseMatches[pairStart + (matchIndex % 2 === 0 ? 1 : 0)];

    if (!partner || partner.status !== "played" || !partner.winnerId) return;

    const homeWinner = matchIndex % 2 === 0 ? winnerId : partner.winnerId;
    const awayWinner = matchIndex % 2 === 0 ? partner.winnerId : winnerId;

    await super.create({
      tournamentId: match.tournamentId,
      phase: nextPhase,
      group: null,
      round: pairIndex,
      homeParticipantId: homeWinner,
      awayParticipantId: awayWinner,
      score: { home: null, away: null },
      winnerId: null,
      status: "scheduled",
      playedAt: null,
    });

    if (match.phase === "semi") {
      const thisLoserId = idStr(winnerId) === idStr(match.homeParticipantId)
        ? match.awayParticipantId
        : match.homeParticipantId;
      const partnerLoserId = idStr(partner.winnerId) === idStr(partner.homeParticipantId)
        ? partner.awayParticipantId
        : partner.homeParticipantId;

      const homeLoser = matchIndex % 2 === 0 ? thisLoserId : partnerLoserId;
      const awayLoser = matchIndex % 2 === 0 ? partnerLoserId : thisLoserId;

      await super.create({
        tournamentId: match.tournamentId,
        phase: "thirdPlace",
        group: null,
        round: pairIndex,
        homeParticipantId: homeLoser,
        awayParticipantId: awayLoser,
        score: { home: null, away: null },
        winnerId: null,
        status: "scheduled",
        playedAt: null,
      });
    }
  }
}

module.exports = new MatchAbl();
