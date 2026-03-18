const OcAppCore = require("../libs/oc_app-core");
const dao = require("./turnament-dao");

const ERROR_CODE_PREFIX = "oc_turnament";
const Error = {
  Unauthorized: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "unauthorized"].join("/");
      super(`User is not authorized to run this use case for ${name}.`, { cause: e, code, ...opts, status: 403 });
    }
  },
  InvalidState: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "invalidState"].join("/");
      super(`Invalid state in use case for ${name}.`, { cause: e, code, ...opts });
    }
  },
  MissingTeamListCode: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "missingTeamListCode"].join("/");
      super(`There is missing code in some team for ${name}.`, { cause: e, code, ...opts });
    }
  },
  InvalidPlaceList: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "invalidPlaceList"].join("/");
      super(`Place list must be undefined or with same length as group list for ${name}.`, { cause: e, code, ...opts });
    }
  },
  MatchNotFound: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "matchNotFound"].join("/");
      super(`Match does not exist for ${name}.`, { cause: e, code, ...opts, status: 404 });
    }
  },
}

async function getTurnamentWithAccess(id, useCase, accessGroupList, identity) {
  if (!identity) throw new Error.Unauthorized(this.name, null, { useCase, id });

  const turnament = await dao.get(id);

  if (identity.profileList.includes("operatives") || identity.profileList.includes("authorities")) {
    return turnament;
  }

  if (!accessGroupList.find((key) => turnament[key]?.includes(identity.identity))) {
    throw new Error.Unauthorized(this.name, null, { useCase, id });
  }

  return turnament;
}

function createGroups(teamList) {
  const groups = {};

  teamList.forEach((team) => {
    const code = team.code ?? team.group ?? "";
    const match = code.match(/^(.*[A-Za-z]+)(\d+)$/);
    if (!match) return;
    const [, group, order] = match;
    groups[group] ??= [];
    groups[group][parseInt(order, 10) - 1] = team;
  });

  return groups;
}

const MATCH_CONFIG = {
  "4": [
    [1, 2],
    [3, 4],
    [1, 3],
    [2, 4],
    [1, 4],
    [2, 3],
  ],
  "5": [
    [1, 2],
    [3, 4],
    [1, 5],
    [2, 3],
    [4, 5],
    [1, 3],
    [2, 4],
    [3, 5],
    [1, 4],
    [2, 5],
  ],
};

/**
 * Berger algorithm for round-robin pairing.
 * Odd team count: add dummy, generate n rounds, filter out dummy matches.
 * Even team count: n-1 rounds.
 */
function createBergerRounds(teamCount) {
  const n = teamCount;
  const isOdd = n % 2 === 1;
  const size = isOdd ? n + 1 : n;
  const rounds = isOdd ? n : n - 1;

  const pairs = [];
  let order = Array.from({ length: size }, (_, i) => i + 1);

  for (let r = 0; r < rounds; r++) {
    const half = size / 2;
    for (let i = 0; i < half; i++) {
      const a = order[i];
      const b = order[size - 1 - i];
      if (isOdd && (a === size || b === size)) continue;
      pairs.push([a, b]);
    }
    const rotated = [order[0], order[size - 1], ...order.slice(1, size - 1)];
    order = rotated;
  }

  return pairs;
}

function getMatchConfig(teamCount) {
  return MATCH_CONFIG[teamCount + ""] ?? createBergerRounds(teamCount);
}

function createMatchListPerGroup(teamList, group = "A", placeList) {
  const matchConfig = getMatchConfig(teamList.length);
  return matchConfig.map(([n1, n2], i) => ({
    code: [group + n1, group + n2].join("-"),
    place: placeList ? placeList[i % placeList.length] : undefined,
  }));
}

function createMatchList(groups, placeList) {
  const groupCount = Object.keys(groups).length;
  let matchList = [];

  if (groupCount === 1) {
    const teamList = Object.values(groups)[0].filter(Boolean);
    matchList = createMatchListPerGroup(teamList, "A", placeList);
  } else {
    if (!placeList || placeList.length === 1) {
      const groupMatchList = Object.entries(groups).map(([group, teamList]) => {
        return createMatchListPerGroup(teamList.filter(Boolean), group, placeList ? [placeList[0]] : undefined);
      });
      for (let i = 0; i < Math.max(...groupMatchList.map((matchList) => matchList.length)); i++) {
        groupMatchList.forEach((mList) => {
          if (mList[i]) matchList.push(mList[i]);
        });
      }
    } else if (placeList.length === groupCount) {
      Object.entries(groups).forEach(([group, teamList], i) => {
        matchList.push(...createMatchListPerGroup(teamList.filter(Boolean), group, [placeList[i]]));
      });
    }
  }

  return matchList;
}

class TurnamentAbl extends OcAppCore.Crud {

  constructor() {
    super("turnament", dao);
  }

  list({ pageInfo }) {
    return super.list({ pageInfo });
  }

  async updateData({ id, venueList, refereeList, teamList }, identity) {
    const turnament = await getTurnamentWithAccess(id, "updateData", ["operativeList"], identity);

    if (turnament.state === "initial") {
      if (venueList) turnament.venueList = venueList;
      if (teamList) turnament.teamList = teamList.toSorted((t1, t2) => t1.code?.localeCompare(t2.code));
    }
    if (refereeList) turnament.refereeList = refereeList;

    return super.update(turnament, { merge: false });
  }

  async createSchedule({ id }, identity) {
    const turnament = await getTurnamentWithAccess(id, "createSchedule", ["operativeList"], identity);

    if (turnament.state !== "initial") {
      throw new Error.InvalidState(this.name, null, { id, useCase: "createSchedule", state: turnament.state });
    }

    if (turnament.teamList.find((team) => team.code == null)) {
      throw new Error.MissingTeamListCode(this.name, null, { id, useCase: "createSchedule", teamList: turnament.teamList });
    }

    const groups = createGroups(turnament.teamList);

    const groupList = Object.keys(groups);
    if (turnament.placeList?.length > 1 && groupList.length > 1 && groupList.length !== turnament.placeList.length) {
      throw new Error.InvalidPlaceList(this.name, null, { id, useCase: "createSchedule", placeList: turnament.placeList, groupList });
    }

    turnament.matchList = createMatchList(groups, turnament.placeList);
    turnament.state = "active";

    return super.update(turnament, { merge: false });
  }

  async setResult({ id, code, middleResultList, result }, identity) {
    const turnament = await getTurnamentWithAccess(id, "createSchedule", ["operativeList", "refereeList"], identity);

    const match = turnament.matchList.find((match) => match.code === code);

    if (match) {
      if (middleResultList) match.middleResultList = middleResultList;
      if (result) match.result = result;
    } else {
      throw new Error.MatchNotFound(this.name, null, { id, useCase: "setResult", code });
    }

    return super.update(turnament, { merge: false });
  }

  async getStandings({ id, group }, identity) {
    const turnament = await dao.get(id);
    const matchList = turnament.matchList ?? [];
    const teamList = turnament.teamList ?? [];

    const codeToTeam = {};
    teamList.forEach((t) => {
      const c = t.code ?? t.group;
      if (c) codeToTeam[c] = { ...t, stats: { played: 0, wins: 0, draws: 0, losses: 0, scored: 0, conceded: 0, points: 0 } };
    });

    matchList.forEach((match) => {
      if (!match.result) return;
      const [homeCode, awayCode] = (match.code ?? "").split("-");
      const m = match.result.match(/^(\d+)\s*[:–-]\s*(\d+)$/);
      if (!m) return;
      const homeGoals = parseInt(m[1], 10);
      const awayGoals = parseInt(m[2], 10);

      const home = codeToTeam[homeCode];
      const away = codeToTeam[awayCode];
      if (!home || !away) return;

      home.stats.played++;
      away.stats.played++;
      home.stats.scored += homeGoals;
      home.stats.conceded += awayGoals;
      away.stats.scored += awayGoals;
      away.stats.conceded += homeGoals;

      if (homeGoals > awayGoals) {
        home.stats.wins++;
        home.stats.points += 3;
        away.stats.losses++;
      } else if (homeGoals < awayGoals) {
        away.stats.wins++;
        away.stats.points += 3;
        home.stats.losses++;
      } else {
        home.stats.draws++;
        away.stats.draws++;
        home.stats.points++;
        away.stats.points++;
      }
    });

    let standings = Object.values(codeToTeam);
    if (group) {
      standings = standings.filter((t) => {
        const c = t.code ?? t.group ?? "";
        return c.startsWith(group) || c.match(new RegExp("^" + group + "\\d"));
      });
    }

    standings.sort((a, b) => {
      const s1 = a.stats;
      const s2 = b.stats;
      if (s2.points !== s1.points) return s2.points - s1.points;
      const diff1 = s1.scored - s1.conceded;
      const diff2 = s2.scored - s2.conceded;
      if (diff2 !== diff1) return diff2 - diff1;
      if (s2.scored !== s1.scored) return s2.scored - s1.scored;
      return 0;
    });

    return standings;
  }
}

module.exports = new TurnamentAbl();
