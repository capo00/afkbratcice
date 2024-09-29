const UuDataTypes = require("uu_datatypesg01");
const OcBinaryStore = require("../libs/oc_binarystore");
const BinaryAbl = OcBinaryStore.Abl.Binary;

module.exports = {
  "binary/list": {
    method: "get",
    validator: UuDataTypes.exact({
      pageInfo: UuDataTypes.exact({
        pageSize: UuDataTypes.number,
        pageIndex: UuDataTypes.number
      }),
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await BinaryAbl.list(dtoIn?.pageInfo);
      return { itemList };
    },
  },
  "binary/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await BinaryAbl.get(dtoIn.id);
    },
  },
  "binary/create": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   name: UuDataTypes.string,
    //   file: UuDataTypes.file,
    //   tagList: UuDataTypes.array,
    // }),
    fn: async ({ dtoIn }) => {
      return await BinaryAbl.create(dtoIn);
    },
  },
  "binary/update": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   name: UuDataTypes.string,
    //   file: UuDataTypes.file,
    //   tagList: UuDataTypes.array,
    // }),
    fn: async ({ dtoIn }) => {
      delete dtoIn.sys;
      return await BinaryAbl.update(dtoIn);
    },
  },
  "binary/delete": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await BinaryAbl.delete(dtoIn.id);
    },
  },
}
