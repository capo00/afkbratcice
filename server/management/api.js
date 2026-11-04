import { Authorization } from "caio-server";
import Config from "../config.js";
import crud from "./crud.js";
import dao from "./dao.js";
import { validate, shape, mongoId, oneOf, array, any, boolean, pageInfo, truthy } from "../services/validators.js";

const idDtoIn = shape({ id: mongoId().isRequired() });

const listDtoIn = shape({
  teamId: mongoId(),
  board: any(),
  role: oneOf([...Config.TEAM_ROLE, ...Config.BOARD_ROLE]),
  personId: mongoId(),
  active: any(),
  seasonId: mongoId(),
  idList: array(mongoId()),
  pageInfo: pageInfo(),
});

// Jedna funkce: osoba, tým (bez něj výbor), funkce, od, do. Že funkce patří k týmu / výboru
// a že se osobě v téže funkci nepřekrývá období, hlídá `crud._check`.
// Funkce, ne hodnota: `isRequired()` by sdílený DataType mohl změnit i pro update.
const role = () => oneOf([...Config.TEAM_ROLE, ...Config.BOARD_ROLE]);
const period = () => ({ dateFrom: any(), dateTo: any(), showContact: boolean() });
const createDtoIn = shape({ personId: mongoId().isRequired(), teamId: mongoId(), role: role().isRequired(), ...period() });
// Bez `teamId`: tým/výbor se u funkce nemění (jinak by editor týmu A „převedl“ funkci na svůj tým).
const updateDtoIn = shape({ id: mongoId().isRequired(), personId: mongoId(), role: role(), ...period() });

/**
 * Tým, kterého se zápis týká: u `create` z dtoIn, jinak uložený. Funkce ve výboru nepatří
 * žádnému týmu, takže `[]` = smí jen CONTENT (`Authorization.auth`: nic nevyřešeno = bez přístupu).
 */
async function teamsOfManagement({ dtoIn }) {
  if (!dtoIn?.id) return dtoIn?.teamId ? [dtoIn.teamId] : [];
  const current = await dao.get(dtoIn.id).catch(() => null);
  return current?.teamId ? [current.teamId] : [];
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
    validator: validate(createDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  "management/update": {
    method: "post",
    auth: writeAuth,
    validator: validate(updateDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  "management/delete": {
    method: "post",
    auth: writeAuth,
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
