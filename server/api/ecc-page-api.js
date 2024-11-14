const UuDataTypes = require("uu_datatypesg01");
const Abl = require("../abl/ecc-page-abl");

module.exports = {
  "eccPage/list": {
    method: "get",
    validator: UuDataTypes.exact({
      pageInfo: UuDataTypes.exact({
        pageSize: UuDataTypes.number,
        pageIndex: UuDataTypes.number
      }),
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn);
      return { itemList };
    },
  },
  "eccPage/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },
  "eccPage/create": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      name: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },
  "eccPage/update": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      name: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      delete dtoIn.sys;
      return await Abl.update(dtoIn);
    },
  },
  "eccPage/delete": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.delete(dtoIn.id);
    },
  },
  "eccPage/load": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.load(dtoIn.id);
    },
  },
  "eccPage/createSectionBefore": {
    method: "post",
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   sectionId: UuDataTypes.string,
    //   data: UuDataTypes.object,
    // }),
    fn: async ({ dtoIn }) => {
      return await Abl.createSectionBefore(dtoIn);
    },
  },
  "eccPage/createSectionAfter": {
    method: "post",
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   sectionId: UuDataTypes.string,
    //   data: UuDataTypes.object,
    // }),
    fn: async ({ dtoIn }) => {
      return await Abl.createSectionAfter(dtoIn);
    },
  },
  "eccPage/updateSectionOrder": {
    method: "post",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      sectionList: UuDataTypes.arrayOf(UuDataTypes.string),
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.updateSectionOrder(dtoIn);
    },
  },
  "eccPage/deleteSection": {
    method: "post",
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   sectionId: UuDataTypes.string,
    // }),
    fn: async ({ dtoIn }) => {
      return await Abl.deleteSection(dtoIn);
    },
  },
}
