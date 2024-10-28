const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/match-dao");
const teamAbl = require("./team-abl");
const seasonAbl = require("./season-abl");
const getTeamMap = require("./get-team-map");

function createTable(matchList, teamMap) {
  // Initialize an empty object to keep track of each team's stats
  const table = {};

  matchList.forEach(match => {
    const { homeTeamId, guestTeamId, homeGoals, guestGoals } = match;

    // Ensure each team has an entry in the table
    if (!table[homeTeamId]) {
      table[homeTeamId] = {
        team: teamMap[homeTeamId],
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    }
    if (!table[guestTeamId]) {
      table[guestTeamId] = {
        team: teamMap[guestTeamId],
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    }

    // Update each team's 'played' and 'goals for'/'goals against' stats
    if (homeGoals != null) {
      table[homeTeamId].played += 1;
      table[guestTeamId].played += 1;
      table[homeTeamId].goalsFor += homeGoals;
      table[homeTeamId].goalsAgainst += guestGoals;
      table[guestTeamId].goalsFor += guestGoals;
      table[guestTeamId].goalsAgainst += homeGoals;

      // Determine match result and update wins, draws, losses, and points
      if (homeGoals > guestGoals) {
        // Home team wins
        table[homeTeamId].wins += 1;
        table[homeTeamId].points += 3;
        table[guestTeamId].losses += 1;
      } else if (homeGoals < guestGoals) {
        // Guest team wins
        table[guestTeamId].wins += 1;
        table[guestTeamId].points += 3;
        table[homeTeamId].losses += 1;
      } else {
        // Draw
        table[homeTeamId].draws += 1;
        table[guestTeamId].draws += 1;
        table[homeTeamId].points += 1;
        table[guestTeamId].points += 1;
      }
    }
  });

  // Convert the table object into an array and return it
  return Object.values(table).sort((a, b) => {
    let result = b.points - a.points;

    if (!result) {
      result = (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    }

    return result;
  });
}

class MatchAbl extends OcAppCore.Crud {

  constructor() {
    super("match", dao);
  }

  async list({ pageInfo, seasonId }) {
    let dtoOut;
    if (seasonId) {
      dtoOut = (await dao.listBySeason(seasonId)).map(this._getData);
    } else {
      dtoOut = await super.list({ pageInfo });
    }
    return dtoOut;
  }

  async getLast({ teamId }) {
    const match = await dao.getLastMatch(teamId);
    let result = {};
    if (match) {
      result = await this.#fillInfoToMatch(match);
    }
    return result;
  }

  async getNext({ teamId }) {
    const match = await dao.getNextMatch(teamId);
    let result = {};
    if (match) {
      result = await this.#fillInfoToMatch(match);
    }
    return result;
  }

  async getTable({ seasonId, teamId }) {
    let season;
    if (seasonId) season = await seasonAbl.get(seasonId);
    else season = await seasonAbl.getCurrentByTeam(teamId);
    const teamList = await teamAbl.list({ idList: season.teamList });
    const matchList = await this.list({ seasonId });
    return { table: createTable(matchList, getTeamMap(teamList)) };
  }


  async #fillInfoToMatch(match) {
    const { homeTeamId, guestTeamId, seasonId, ...result } = match;
    const teamList = await teamAbl.list({ idList: [homeTeamId, guestTeamId] });
    const season = await seasonAbl.get(seasonId);
    const teamMap = getTeamMap(teamList);
    result.homeTeam = teamMap[homeTeamId];
    result.guestTeam = teamMap[guestTeamId];
    result.season = season;
    return result;
  }
}

module.exports = new MatchAbl();
