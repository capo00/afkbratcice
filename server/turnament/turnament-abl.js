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
    const [, group, order] = team.group.match(/^(.*[A-Za-z]+)(\d+)$/);
    groups[group] ??= [];
    groups[group][order - 1] = team;
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
  ]
};

function createMatchListPerGroup(teamList, group = "A", placeList) {
  const matchConfig = MATCH_CONFIG[teamList.length + ""];
  return MATCH_CONFIG[teamList.length + ""].map(([n1, n2], i) => ({
    code: [group + n1, group + n2].join("-"),
    place: placeList ? placeList[i % placeList.length] : undefined,
  }));
}

function createMatchList(groups, placeList) {
  const groupCount = Object.keys(groups).length;
  let matchList = [];

  if (groupCount === 1) {
    const teamList = Object.values(groups)[0];
    matchList = createMatchListPerGroup(teamList, "A", placeList)
  } else {
    if (!placeList || placeList.length === 1) {
      const groupMatchList = Object.entries(groups).map(([group, teamList]) => {
        return createMatchListPerGroup(teamList, group, placeList ? [placeList[0]] : undefined);
      });
      for (let i = 0; i < Math.max(...groupMatchList.map((matchList) => matchList.length)); i++) {
        groupMatchList.forEach((mList) => {
          if (mList[i]) matchList.push(mList[i]);
        });
      }
    } else if (placeList.length === groupCount) {
      Object.entries(groups).forEach(([group, teamList], i) => {
        matchList.push(...createMatchListPerGroup(teamList, group, [placeList[i]]));
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
      new Error.InvalidState(this.name, null, { id, useCase: "createSchedule", state: turnament.state });
    }

    if (turnament.teamList.find((team) => team.code == null)) {
      new Error.MissingTeamListCode(this.name, null, { id, useCase: "createSchedule", teamList: turnament.teamList });
    }

    const groups = createGroups(turnament.teamList);

    const groupList = Object.keys(groups);
    if (turnament.placeList?.length > 1 && groupList.length > 1 && groupList.length !== turnament.placeList.length) {
      new Error.InvalidPlaceList(this.name, null, { id, useCase: "createSchedule", placeList: turnament.placeList, groupList });
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
      new Error.MatchNotFound(this.name, null, { id, useCase: "setResult", code });
    }

    return super.update(turnament, { merge: false });
  }
}

module.exports = new TurnamentAbl();
