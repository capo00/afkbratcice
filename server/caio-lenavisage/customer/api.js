const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./abl");
const path = require("path");

module.exports = {
  "caio-lenavisage/customer": {
    method: "get",
    fn: async ({ res, publicPath }) => {
      res.sendFile(path.resolve(publicPath, "caio-lenavisage.html"));
      return false;
    },
  },

  "caio-lenavisage/customer/list": {
    method: "get",
    auth: ["authorities", "operatives"],
    validator: UuDataTypes.exact({
      query: UuDataTypes.string,
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

  "caio-lenavisage/customer/create": {
    method: "post",
    auth: ["authorities", "operatives"],
    validator: UuDataTypes.exact({
      name: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },

  "caio-lenavisage/customer/update": {
    method: "post",
    auth: ["authorities", "operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      name: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.update(dtoIn);
    },
  },

  "caio-lenavisage/customer/delete": {
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
