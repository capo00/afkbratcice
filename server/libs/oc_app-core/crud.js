const AppError = require("./app-error");

const ERROR_CODE_PREFIX = "oc_app-server";
const CrudError = {
  DoesNotExists: class extends AppError.DoesNotExists {
    constructor(name, e, opts) {
      const codePrefix = [ERROR_CODE_PREFIX, name].join("/");
      super(`Object ${name} does not exist`, { cause: e, codePrefix, ...opts });
    }
  },

  CreateFailed: class extends AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "createFailed"].join("/");
      super(`Creating of ${name} was failed`, { cause: e, code, ...opts });
    }
  },

  UpdateFailed: class extends AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "updateFailed"].join("/");
      super(`Updating of ${name} was failed`, { cause: e, code, ...opts });
    }
  },

  DeleteFailed: class extends AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "deleteFailed"].join("/");
      super(`Deleting of ${name} was failed`, { cause: e, code, ...opts });
    }
  },
}

class Crud {

  constructor(name, dao) {
    this.name = name;
    this.dao = dao;
  }

  async list(pageInfo) {
    return (await this.dao.list(pageInfo)).map(this._getData);
  }

  async get(id) {
    return this._getData(await this._get(id));
  }

  async create(data) {
    try {
      return this._getData(await this.dao.create(data));
    } catch (e) {
      throw new CrudError.CreateFailed(this.name, e);
    }
  }

  async update(data, { merge = true } = {}) {
    try {
      let newData = data;
      if (merge) {
        const item = await this._get(data.id);
        newData = { ...item, ...data };
      }

      return this._getData(await this.dao.update(newData));
    } catch (e) {
      throw new CrudError.UpdateFailed(this.name, e);
    }
  }

  async delete(id) {
    try {
      return await this.dao.delete(id);
    } catch (e) {
      throw new CrudError.DeleteFailed(this.name, e);
    }
  }

  async _get(id) {
    try {
      return await this.dao.get(id);
    } catch (e) {
      throw new CrudError.DoesNotExists(e);
    }
  }

  _getData(object) {
    return object;
  }
}

Crud.Error = CrudError;

module.exports = Crud;
