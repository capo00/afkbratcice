const OcAppServer = require("../libs/oc_app-server");
const teamDao = require("../dao/team-dao");
const OcBinaryStore = require("../libs/oc_binarystore");

const ERROR_CODE_PREFIX = "afkbratcice/team/";
const TeamError = {
  DoesNotExists: class extends OcAppServer.AppError.DoesNotExists {
    constructor(e, opts) {
      super("Team does not exist", { cause: e, codePrefix: ERROR_CODE_PREFIX, ...opts });
    }
  },

  CreateFailed: class extends OcAppServer.AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "createFailed";

    constructor(e, opts) {
      super("Creating of team was failed", { cause: e, code: TeamError.CreateFailed.CODE, ...opts });
    }
  },

  UpdateFailed: class extends OcAppServer.AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "updateFailed";

    constructor(e, opts) {
      super("Updating of team was failed", { cause: e, code: TeamError.UpdateFailed.CODE, ...opts });
    }
  },

  DeleteFailed: class extends OcAppServer.AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "deleteFailed";

    constructor(e, opts) {
      super("Deleting of team was failed", { cause: e, code: TeamError.DeleteFailed.CODE, ...opts });
    }
  },
}

class TeamAbl {
  static async list(pageInfo) {
    return await teamDao.list(pageInfo);
  }

  static async get(id) {
    const { logoId, ...data } = await TeamAbl.#get(id);
    return data;
  }

  static async create(item) {
    const { logoUri, ...restParams } = item;
    const logo = await OcBinaryStore.Abl.Binary.create(logoUri);
    try {
      return await teamDao.create({ ...restParams, logoId: logo.id, logoUri: logo.uri });
    } catch (e) {
      try {
        await OcBinaryStore.Abl.Binary.delete(logo.id);
      } catch (e) {
        console.error("Binary cannot be deleted", logo.id);
      }
      throw new TeamError.CreateFailed(e);
    }
  }

  static async update(data) {
    const { logoUri, ...restParams } = data;

    if (logoUri !== undefined) {
      const { logoId } = await TeamAbl.#get(data.id);

      if (logoUri) {
        let logo;
        if (logoId) {
          await OcBinaryStore.Abl.Binary.update(logoId, logoUri);
        } else {
          logo = await OcBinaryStore.Abl.Binary.create(logoUri);
          restParams.logoId = logo.id;
          restParams.logoUri = logo.uri;
        }
      } else if (logoUri === null) {
        await OcBinaryStore.Abl.Binary.delete(logoId);
        restParams.logoId = null;
        restParams.logoUri = null;
      }
    }

    try {
      return await teamDao.update(restParams);
    } catch (e) {
      if (restParams.logoId) {
        try {
          await OcBinaryStore.Abl.Binary.delete(restParams.logoId);
        } catch (e) {
          console.error("Binary cannot be deleted", restParams.logoId);
        }
      }
      throw new TeamError.UpdateFailed(e);
    }
  }

  static async delete(id) {
    const { logoId } = await TeamAbl.#get(id);
    if (logoId) await OcBinaryStore.Abl.Binary.delete(logoId);

    try {
      return await teamDao.delete(id);
    } catch (e) {
      throw new TeamError.DeleteFailed(e);
    }
  }

  static async #get(id) {
    try {
      return await teamDao.get(id);
    } catch (e) {
      throw new TeamError.DoesNotExists(e);
    }
  }
}

module.exports = TeamAbl;
