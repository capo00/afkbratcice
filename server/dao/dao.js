const OcMongo = require("../libs/oc_mongo");
const Config = require("../config/config")

const ssl = process.env.NODE_ENV === "production" ? "ssl=true&" : "";
const MONGO_URI = Config.mongodbUri + "?" + ssl + "retryWrites=true&w=majority";

class Dao extends OcMongo.Dao {
  constructor(collectionName) {
    super(collectionName, { uri: MONGO_URI });
  }
}

module.exports = Dao;
