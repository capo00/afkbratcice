const OcMongo = require("../libs/oc_mongo");
const Config = require("../config/config")

const MONGO_URI = Config.mongodbUri + "?ssl=true&retryWrites=true&w=majority";

class Dao extends OcMongo.Dao {
  constructor(collectionName) {
    super(collectionName, { uri: MONGO_URI });
  }
}

module.exports = Dao;
