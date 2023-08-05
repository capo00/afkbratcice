const { CapoDao } = require("../libs/capo-dao/exports");

const MONGO_URI = "mongodb+srv://capo00:3kyodh8FA8CMFpmW@afkbratcice.rlsghl6.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = "afkbratcice";

class Dao extends CapoDao {
  constructor(collectionName) {
    super(collectionName, { dbName: DB_NAME, uri: MONGO_URI });
  }
}

module.exports = Dao;
