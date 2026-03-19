const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");

class HistoryLogAbl extends OcAppCore.Crud {

  constructor() {
    super("historyLog", dao);
  }

  async log(tournamentId, identityId, entityType, entityId, action, diff = {}) {
    return await super.create({
      tournamentId,
      identityId,
      entityType,
      entityId,
      action,
      diff,
      ts: new Date(),
    });
  }

  async list(tournamentId, dtoIn = {}) {
    const filter = { tournamentId };
    if (dtoIn.entityType) filter.entityType = dtoIn.entityType;
    if (dtoIn.entityId) filter.entityId = dtoIn.entityId;
    return dao.list(filter, dtoIn.pageInfo);
  }
}

module.exports = new HistoryLogAbl();
