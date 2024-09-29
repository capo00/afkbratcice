// const OcMongo = require("oc_mongo");
const OcMongo = require("../../oc_mongo");
const Config = require("../config/config")

class Dao extends OcMongo.Dao {
  constructor(collectionName) {
    super(collectionName, { uri: Config.mongodbUri });
  }
}

module.exports = Dao;
