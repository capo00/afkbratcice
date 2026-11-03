import { Crud, Error as CoreError } from "caio-server";
import dao from "./dao.js";
import personDao from "../person/dao.js";
import { PersonCrud } from "../person/crud.js";
import { isActive, seasonRangeOf } from "../services/membership.js";

class ManagementCrud extends Crud {
  constructor() {
    super("management", dao);
  }

  /**
   * Vloží osobu. Její kontakty jsou neveřejné (`PersonCrud.forIdentity`) s jedinou výjimkou:
   * člen výboru, kterému administrace zaškrtla „Zobrazit kontakt“ (`showContact`) u funkce,
   * která trvá, má na webu telefon a e-mail -- jako `contact`, ne v `person`, aby ji nikdo
   * nepoužil jako „osoba je veřejná“.
   */
  async _withPerson(itemList, identity) {
    const personIdList = [...new Set(itemList.map((m) => m.personId).filter(Boolean))];
    const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];
    return itemList.map((item) => {
      const person = persons.find((x) => x.id === item.personId) ?? null;
      const showContact = (item.boardList ?? []).some((b) => b.showContact && isActive(b));
      return {
        ...item,
        person: PersonCrud.forIdentity(person, identity),
        ...(showContact && person ? { contact: { email: person.email ?? null, phone: person.phone ?? null } } : null),
      };
    });
  }

  async list({ teamId, board, role, active, seasonId, idList, pageInfo } = {}, identity) {
    const range = seasonId ? await seasonRangeOf(seasonId) : undefined;
    if (range === null) return [];
    const itemList = (await dao.listByFilter({ teamId, board, role, active, range, idList }, pageInfo)).map((i) =>
      this._getData(i),
    );
    return this._withPerson(itemList, identity);
  }

  async get(id, identity) {
    const [withPerson] = await this._withPerson([this._getData(await this._get(id))], identity);
    return withPerson;
  }

  /**
   * Zápis vrací **týž tvar jako `list`/`get`**, tedy s vloženou `person` -- klient
   * (`useDataList`) položku v seznamu nahradí tím, co přišlo ze serveru, a bez `person`
   * by ve sloupci zůstalo holé id.
   */
  async create(data, identity) {
    this._checkNotEmpty(data);
    const [withPerson] = await this._withPerson([await super.create(data)], identity);
    return withPerson;
  }

  async update(data, identity) {
    const current = await this._get(data.id);
    this._checkNotEmpty({ ...current, ...data });
    const [withPerson] = await this._withPerson([await super.update(data)], identity);
    return withPerson;
  }

  /** Záznam bez osoby nebo bez jediného působení (v týmu ani ve výboru) nemá smysl. */
  _checkNotEmpty({ personId, teamList, boardList }) {
    if (!personId) {
      throw new CoreError("personId is required", { status: 400, code: CoreError.code("management", "personRequired") });
    }
    if (!teamList?.length && !boardList?.length) {
      throw new CoreError("At least one team or board membership is required", {
        status: 400,
        code: CoreError.code("management", "membershipRequired"),
      });
    }
  }
}

export default new ManagementCrud();
