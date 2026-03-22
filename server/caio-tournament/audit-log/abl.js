const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");

class AuditLogAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-tournament/auditLog", dao);
  }

  async create(tournamentId, identityId, entityType, entityId, action, diff = {}) {
    return await super.create({
      tournamentId,
      identityId,
      entityType,
      entityId,
      action,
      diff,
    });
  }

  async list(tournamentId, dtoIn = {}) {
    const filter = { tournamentId };
    if (dtoIn.entityType) filter.entityType = dtoIn.entityType;
    if (dtoIn.entityId) filter.entityId = dtoIn.entityId;
    return dao.list(filter, dtoIn.pageInfo);
  }
}

module.exports = new AuditLogAbl();
