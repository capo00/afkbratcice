const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");

class CustomerAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-lenavisage/customer", dao);
  }

  async list(dtoIn = {}) {
    if (dtoIn.query) {
      return (await dao.search(dtoIn.query)).map(super._getData);
    }
    return (await dao.list({}, dtoIn.pageInfo)).map(super._getData);
  }

  async create(dtoIn) {
    return await super.create({
      name: dtoIn.name,
    });
  }

  async update(dtoIn) {
    return await super.update(dtoIn);
  }
}

module.exports = new CustomerAbl();
