const OcMongo = require("../libs/oc_mongo");
const Config = require("../config/config")

const mongoUri = new URL(Config.mongodbUri);
if (process.env.NODE_ENV === "production") {
  mongoUri.searchParams.set("ssl", true);
}
mongoUri.searchParams.set("retryWrites", "true");
mongoUri.searchParams.set("w", "majority");


class Dao extends OcMongo.Dao {
  constructor(collectionName) {
    super(collectionName, { uri: mongoUri.toString() });
  }
}

module.exports = Dao;
