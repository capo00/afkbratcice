const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/season-dao");

const ERROR_CODE_PREFIX = "oc_afkbratcice";
const Error = {
  GetCurrentByTeamFailed: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "getCurrentByTeamFailed"].join("/");
      super(`Getting current season by team was failed`, { cause: e, code, ...opts });
    }
  },
}

class SeasonAbl extends OcAppCore.Crud {

  constructor() {
    super("season", dao);
  }

  async list({ pageInfo, teamId }) {
    let dtoOut;
    if (teamId) {
      dtoOut = (await this.dao.listByTeam(teamId)).map(this._getData);
    } else {
      dtoOut = await super.list({ pageInfo });
    }
    return dtoOut;
  }

  async getCurrentByTeam(teamId) {
    try {
      return await this.dao.getCurrentByTeam(teamId);
    } catch (e) {
      throw new Error.GetCurrentByTeamFailed(this.name, e);
    }
  }
}

module.exports = new SeasonAbl();
