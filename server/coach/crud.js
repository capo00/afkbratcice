import { Crud } from "caio-server";
import dao from "./dao.js";
import personDao from "../person/dao.js";
import { PersonCrud } from "../person/crud.js";

class CoachCrud extends Crud {
  constructor() {
    super("coach", dao);
  }

  async _withPerson(itemList, identity) {
    const personIdList = [...new Set(itemList.map((c) => c.personId).filter(Boolean))];
    const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];
    return itemList.map((coach) => ({
      ...coach,
      person: PersonCrud.forIdentity(persons.find((x) => x.id === coach.personId) ?? null, identity),
    }));
  }

  async list({ teamId, role, active, idList, pageInfo } = {}, identity) {
    const itemList = (await dao.listByFilter({ teamId, role, active, idList }, pageInfo)).map((i) => this._getData(i));
    return this._withPerson(itemList, identity);
  }

  async get(id, identity) {
    const [withPerson] = await this._withPerson([this._getData(await this._get(id))], identity);
    return withPerson;
  }
}

export default new CoachCrud();
