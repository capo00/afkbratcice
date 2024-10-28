const Abl = require("../abl/app-abl");

module.exports = {
  "app/get": {
    method: "get",
    fn: async () => {
      return await Abl.get();
    },
  },
  "app/update": {
    method: "post",
    auth: ["authorities"],
    fn: async ({dtoIn}) => {
      return await Abl.update(dtoIn);
    },
  },
}
