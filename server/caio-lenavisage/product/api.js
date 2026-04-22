const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./abl");
const path = require("path");

module.exports = {
  "caio-lenavisage/product": {
    method: "get",
    fn: async ({ res, publicPath }) => {
      res.sendFile(path.resolve(publicPath, "caio-lenavisage.html"));
      return false;
    },
  },

  "caio-lenavisage/product/list": {
    method: "get",
    auth: ["authorities", "operatives"],
    fn: async () => {
      const itemList = await Abl.list();
      return { itemList };
    },
  },

  "caio-lenavisage/product/get": {
    method: "get",
    auth: ["authorities", "operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },

  "caio-lenavisage/product/create": {
    method: "post",
    auth: ["authorities"],
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },

  "caio-lenavisage/product/update": {
    method: "post",
    auth: ["authorities"],
    fn: async ({ dtoIn }) => {
      return await Abl.update(dtoIn);
    },
  },

  "caio-lenavisage/product/delete": {
    method: "post",
    auth: ["authorities"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      await Abl.delete(dtoIn.id);
      return {};
    },
  },

  // "caio-lenavisage/product/seed": {
  //   method: "post",
  //   auth: ["authorities"],
  //   fn: async () => {
  //     const seedData = require("../seed");
  //     return await Abl.seed(seedData);
  //   },
  // },
};
