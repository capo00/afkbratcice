const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/ecc-section-dao");

const MAX_LOCK_MS = 8 * 60 * 60 * 1000; // 8h

const ERROR_CODE_PREFIX = "oc_afkbratcice";
const Error = {
  Locked: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "locked"].join("/");
      super(`${name} is locked`, { cause: e, code, ...opts });
    }
  },
}

class EccSectionAbl extends OcAppCore.Crud {

  constructor() {
    super("eccSection", dao);
  }

  async create(dtoIn) {
    return await super.create({ ...dtoIn, rev: 0 });
  }

  async lock({ id }, { identity, name }) {
    const section = await this._get(id);
    const { lock, ...newSection } = section;

    if (lock) {
      const timeDiffMs = Date.now() - new Date(lock.timeFrom).getTime();
      if (timeDiffMs < MAX_LOCK_MS && lock.identity !== identity) {
        throw new Error.Locked(this.name, undefined, { lockedBy: { identity, name } });
      }
    }

    newSection.lock = { timeFrom: new Date().toISOString(), identity, name };

    return await super.update(newSection, { merge: false });
  }

  async unlock({ id, uu5String }, { identity }) {
    const { lock, ...section } = await this._get(id);
    const { timeFrom, ...lockedBy } = lock;

    const timeDiffMs = Date.now() - new Date(timeFrom).getTime();
    if (timeDiffMs < MAX_LOCK_MS && lockedBy.identity !== identity) {
      throw new Error.Locked(this.name, undefined, { lockedBy });
    }

    return await super.update({ ...section, uu5String }, { merge: false });
  }
}

module.exports = new EccSectionAbl();
