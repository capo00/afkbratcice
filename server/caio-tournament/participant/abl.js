const OcAppCore = require("../../libs/oc_app-core");
const dao = require("./dao");
const tournamentDao = require("../tournament/dao");

function assertCreatedState(tournament) {
  if (tournament.state === "final") {
    throw new OcAppCore.AppError.Failed("Tournament is closed. No modifications allowed.", {
      code: "caio-tournament/participant/tournamentClosed",
      status: 403,
    });
  }
  if (tournament.state !== "created") {
    throw new OcAppCore.AppError.Failed("Participants can only be modified in 'created' state.", {
      code: "caio-tournament/participant/invalidState",
      status: 400,
    });
  }
}

class ParticipantAbl extends OcAppCore.Crud {

  constructor() {
    super("caio-tournament/participant", dao);
  }

  async list(tournamentId, dtoIn = {}) {
    const filter = { tournamentId };
    if (dtoIn.group) filter.group = dtoIn.group;
    return await dao.list(filter, dtoIn.pageInfo);
  }

  async create(tournamentId, dtoIn, identity) {
    const tournament = await tournamentDao.get(tournamentId);
    if (!tournament) throw new OcAppCore.Crud.Error.DoesNotExists("tournament");
    assertCreatedState(tournament);

    return await super.create({
      tournamentId,
      name: dtoIn.name,
      desc: dtoIn.desc,
      group: dtoIn.group,
      seed: dtoIn.seed,
      playerList: dtoIn.playerList,
      stats: { played: 0, wins: 0, draws: 0, losses: 0, scored: 0, conceded: 0, points: 0 },
    });
  }

  async update(dtoIn, identity) {
    const item = await this._get(dtoIn.id);
    const tournament = await tournamentDao.get(item.tournamentId);
    if (tournament) assertCreatedState(tournament);
    return await super.update({ ...item, ...dtoIn }, { merge: false });
  }

  async delete(id, identity) {
    const item = await this._get(id);
    const tournament = await tournamentDao.get(item.tournamentId);
    if (tournament) assertCreatedState(tournament);
    return await super.delete(id);
  }
}

module.exports = new ParticipantAbl();
