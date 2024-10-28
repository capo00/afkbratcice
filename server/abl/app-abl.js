const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/app-dao");

const ERROR_CODE_PREFIX = "oc_afkbratcice";
const Error = {
  UpdateFailed: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "updateFailed"].join("/");
      super(`Updating of ${name} was failed`, { cause: e, code, ...opts });
    }
  },
}

class AppAbl {

  constructor() {
    this.name = "app";
    this.dao = dao;
  }

  async get() {
    const config = await this._get();
    let dtoOut;
    if (config) {
      dtoOut = this._getData(config);
    } else {
      dtoOut = { teams: { men: { teamId: "" } } };
    }
    return dtoOut;
  }

  async update(data, { merge = true } = {}) {
    try {
      let newData = data;
      if (merge) {
        const item = await this._get();
        newData = { ...item, ...data };
      }

      const fn = newData.id ? "update" : "create";
      return this._getData(await this.dao[fn](newData));
    } catch (e) {
      throw new Error.UpdateFailed(this.name, e);
    }
  }

  async _get() {
    return await this.dao.findOne();
  }

  _getData({ id, ...object }) {
    return object;
  }
}

AppAbl.Error = Error;

module.exports = new AppAbl();

