const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./abl");
const path = require("path");

module.exports = {
  "caio-lenavisage/order": {
    method: "get",
    fn: async ({ res, publicPath }) => {
      res.sendFile(path.resolve(publicPath, "caio-lenavisage.html"));
      return false;
    },
  },

  "caio-lenavisage/order/list": {
    method: "get",
    auth: ["authorities", "operatives"],
    validator: UuDataTypes.exact({
      product: UuDataTypes.string,
      customerId: UuDataTypes.string,
      year: UuDataTypes.number,
      pageInfo: UuDataTypes.exact({
        pageSize: UuDataTypes.number,
        pageIndex: UuDataTypes.number,
      }),
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn);
      return { itemList };
    },
  },

  "caio-lenavisage/order/get": {
    method: "get",
    auth: ["authorities", "operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },

  "caio-lenavisage/order/create": {
    method: "post",
    auth: ["authorities", "operatives"],
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },

  "caio-lenavisage/order/update": {
    method: "post",
    auth: ["authorities", "operatives"],
    fn: async ({ dtoIn }) => {
      return await Abl.update(dtoIn);
    },
  },

  "caio-lenavisage/order/delete": {
    method: "post",
    auth: ["authorities", "operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      await Abl.delete(dtoIn.id);
      return {};
    },
  },
};
