import { Authorization } from "caio-server";
import Config from "../config.js";
import crud from "./crud.js";
import dao from "./dao.js";
import { validate, shape, mongoId, oneOf, array, any, boolean, pageInfo, truthy } from "../services/validators.js";

const teamMembership = shape({
  id: mongoId().isRequired(),
  role: oneOf(Config.TEAM_ROLE).isRequired(),
  dateFrom: any(),
  dateTo: any(),
});
// Výbor je klubový: bez týmu, jen funkce a období. Začátek u starších členů neznáme.
const boardMembership = shape({
  role: oneOf(Config.BOARD_ROLE).isRequired(),
  dateFrom: any(),
  dateTo: any(),
  showContact: boolean(),
});
const idDtoIn = shape({ id: mongoId().isRequired() });

const listDtoIn = shape({
  teamId: mongoId(),
  board: any(),
  role: oneOf([...Config.TEAM_ROLE, ...Config.BOARD_ROLE]),
  active: any(),
  seasonId: mongoId(),
  idList: array(mongoId()),
  pageInfo: pageInfo(),
});

const writeDtoIn = shape({
  id: mongoId(),
  personId: mongoId(),
  teamList: array(teamMembership),
  boardList: array(boardMembership),
});

/**
 * Týmy, kterých se zápis týká -- ty z dtoIn **i** ty uložené: editor týmu A nesmí záznam
 * týmu B „převést“ na svůj tým. Záznam s výborem (v dtoIn nebo uložený) nepatří žádnému
 * týmu, takže `[]` = smí jen CONTENT (`Authorization.auth`: nic nevyřešeno = bez přístupu).
 */
async function teamsOfManagement({ dtoIn }) {
  const current = dtoIn?.id ? await dao.get(dtoIn.id).catch(() => null) : null;
  if (dtoIn?.boardList?.length || current?.boardList?.length) return [];
  const teamList = [...(dtoIn?.teamList ?? []), ...(current?.teamList ?? [])];
  return [...new Set(teamList.map((t) => t.id))];
}

const writeAuth = Authorization.auth(Config.CONTENT, {
  role: Config.ROLE.TEAM_EDITOR,
  resolve: teamsOfManagement,
  mode: "all",
});

export default {
  "management/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn, identity }) =>
      crud
        .list({ ...dtoIn, board: truthy(dtoIn.board), active: truthy(dtoIn.active) }, identity)
        .then((itemList) => ({ itemList })),
  },

  "management/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn, identity }) => crud.get(dtoIn.id, identity),
  },

  "management/create": {
    method: "post",
    auth: writeAuth,
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  "management/update": {
    method: "post",
    auth: writeAuth,
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  "management/delete": {
    method: "post",
    auth: writeAuth,
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
