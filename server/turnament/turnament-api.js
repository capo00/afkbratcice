const path = require("path");
const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./turnament-abl");

const publicPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "../public") : path.resolve(__dirname, "../../client/oc_afkbratcice_maing01-hi/public");

const API = {
  "turnament": {
    method: "get",
    fn: ({ res }) => {
      res.sendFile(path.resolve(publicPath, "turnament.html"));
      return false;
    }
  },
  "turnament/detail": {
    method: "get",
    fn: ({ res }) => {
      res.sendFile(path.resolve(publicPath, "turnament.html"));
      return false;
    }
  },
  "turnament/list": {
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
  "turnament/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },
  "turnament/create": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      type: UuDataTypes.string,
      name: UuDataTypes.string,
      date: UuDataTypes.string,
      desc: UuDataTypes.string,
      // placeList: UuDataTypes.array,
      // operativeList: UuDataTypes.array,
      // refereeList: UuDataTypes.array,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },
  "turnament/delete": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.delete(dtoIn.id);
    },
  },
  "turnament/update": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      type: UuDataTypes.string,
      name: UuDataTypes.string,
      date: UuDataTypes.string,
      place: UuDataTypes.string,
      desc: UuDataTypes.string,
      operativeList: UuDataTypes.arrayOf(UuDataTypes.string),
      refereeList: UuDataTypes.arrayOf(UuDataTypes.string),
    }),
    fn: async ({ dtoIn }) => {
      delete dtoIn.sys;
      return await Abl.update(dtoIn);
    },
  },
  
  "turnament/updateData": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      teamList: UuDataTypes.arrayOf(UuDataTypes.exact({
        name: UuDataTypes.string,
        desc: UuDataTypes.string,
        code: UuDataTypes.string,
      })),
      refereeList: UuDataTypes.arrayOf(UuDataTypes.string),
      venueList: UuDataTypes.arrayOf(UuDataTypes.oneOf(["A", "B", "C", "D", "E", "F", "G", "H"])),
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.updateData(dtoIn, identity);
    },
  },
  "turnament/createSchedule": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.createSchedule(dtoIn, identity);
    },
  },
  "turnament/setResult": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      code: UuDataTypes.string,
      midleResultList: UuDataTypes.arrayOf(UuDataTypes.string),
      result: UuDataTypes.string,
      desc: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.setResult(dtoIn, identity);
    },
  },
}

module.exports = API;
