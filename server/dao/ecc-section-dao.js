const Dao = require("./dao");

class EccSectionDao extends Dao {
  constructor() {
    super("ecc_section");
  }
}

module.exports = new EccSectionDao();
