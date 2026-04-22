const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");

class ProductAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-lenavisage/product", dao);
  }

  async list() {
    return (await dao.list()).map(super._getData);
  }

  async create(dtoIn) {
    return await super.create(dtoIn);
  }

  async update(dtoIn) {
    return await super.update(dtoIn);
  }

  async seed(productList) {
    const existing = await dao.list();
    if (existing.length > 0) return { seeded: false, count: existing.length };

    const created = await super.createMany(productList);
    return { seeded: true, count: created.length };
  }
}

module.exports = new ProductAbl();
