const OcAppCore = require("../../libs/oc_app-core");
const CustomerAbl = require("../customer/abl");
const dao = require("./dao");

class OrderAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-lenavisage/order", dao);
  }

  async list(dtoIn = {}) {
    const filter = {};
    if (dtoIn.product) filter.product = dtoIn.product;
    if (dtoIn.customerId) filter.customerId = dtoIn.customerId;
    if (dtoIn.year) {
      if (dtoIn.product === "wedding") {
        filter["wedding.time"] = {
          $gte: `${dtoIn.year}-01-01`,
          $lte: `${dtoIn.year}-12-31`,
        };
      } else {
        filter["paydate"] = {
          $gte: `${dtoIn.year}-01-01`,
          $lte: `${dtoIn.year}-12-31`,
        };
      }
    }
    return (await dao.list(filter, dtoIn.pageInfo)).map(super._getData);
  }

  async create(dtoIn) {
    const data = {
      product: dtoIn.product,
      subtotal: dtoIn.subtotal,
      total: dtoIn.total,
    };
    
    ["customerId", "customerName", "note", "paydate"].forEach((key) => {
      if (dtoIn[key] != null) data[key] = dtoIn[key];
    });

    if (dtoIn.product === "hair" && dtoIn.hair) {
      data.hair = {
        category: dtoIn.hair.category,
        services: dtoIn.hair.services,
      };

      if (dtoIn.hair.type) data.hair.type = dtoIn.hair.type;
    }

    if (dtoIn.product === "wedding" && dtoIn.wedding) {
      data.wedding = { ...dtoIn.wedding };
    }

    if (dtoIn.product === "event" && dtoIn.event) {
      data.event = { ...dtoIn.event };
    }

    if (dtoIn.product === "eyelash" && dtoIn.eyelash) {
      data.eyelash = { ...dtoIn.eyelash };
    }

    if (data.customerName && !data.customerId) {
      const customer = await CustomerAbl.create({ name: data.customerName });
      data.customerId = customer.id;
    }

    return await super.create(data);
  }

  async update(dtoIn) {
    if (dtoIn.customerName && !dtoIn.customerId) {
      const customer = await CustomerAbl.create({ name: data.customerName });
      dtoIn = { ...dtoIn, customerId: customer.id };
    }

    return await super.update(dtoIn);
  }
}

module.exports = new OrderAbl();
