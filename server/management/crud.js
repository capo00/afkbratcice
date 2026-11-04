import { Crud, Error as CoreError } from "caio-server";
import Config from "../config.js";
import dao from "./dao.js";
import personDao from "../person/dao.js";
import { PersonCrud } from "../person/crud.js";
import { isActive, overlaps, seasonRangeOf } from "../services/membership.js";

class ManagementCrud extends Crud {
  constructor() {
    super("management", dao);
  }

  /**
   * Vloží osobu. Její kontakty jsou neveřejné (`PersonCrud.forIdentity`) s jedinou výjimkou:
   * funkce ve výboru, které administrace zaškrtla „Kontakt na webu“ (`showContact`) a která
   * trvá -- telefon a e-mail jako `contact`, ne v `person`, aby ji nikdo nepoužil jako „osoba
   * je veřejná“.
   */
  async _withPerson(itemList, identity) {
    const personIdList = [...new Set(itemList.map((m) => m.personId).filter(Boolean))];
    const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];
    return itemList.map((item) => {
      const person = persons.find((x) => x.id === item.personId) ?? null;
      const showContact = !item.teamId && item.showContact && isActive(item);
      return {
        ...item,
        person: PersonCrud.forIdentity(person, identity),
        ...(showContact && person ? { contact: { email: person.email ?? null, phone: person.phone ?? null } } : null),
      };
    });
  }

  async list({ teamId, board, role, personId, active, seasonId, idList, pageInfo } = {}, identity) {
    const range = seasonId ? await seasonRangeOf(seasonId) : undefined;
    if (range === null) return [];
    const itemList = (await dao.listByFilter({ teamId, board, role, personId, active, range, idList }, pageInfo)).map(
      (i) => this._getData(i),
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
    const item = this._normalize(data);
    await this._check(item);
    const [withPerson] = await this._withPerson([await super.create(item)], identity);
    return withPerson;
  }

  /** Tým/výbor se nemění (`teamId` v dtoIn update není): jiný tým = jiná funkce, nový záznam. */
  async update(data, identity) {
    const current = await this._get(data.id);
    const item = this._normalize({ ...this._getData(current), ...data, teamId: current.teamId ?? null });
    await this._check(item);
    const [withPerson] = await this._withPerson([await super.update(item)], identity);
    return withPerson;
  }

  /** `teamId: null` = výbor; kontakt na webu má jen výbor. Chybějící data = `null`, ne `undefined`. */
  _normalize({ teamId, showContact, dateFrom, dateTo, ...rest }) {
    return {
      ...rest,
      teamId: teamId ?? null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      ...(teamId ? { showContact: false } : { showContact: Boolean(showContact) }),
    };
  }

  async _check(item) {
    const { personId, teamId, role, dateFrom, dateTo } = item;
    if (!personId) throw this._error("personRequired", "personId is required");

    const roleList = teamId ? Config.TEAM_ROLE : Config.BOARD_ROLE;
    if (!roleList.includes(role)) throw this._error("invalidRole", "Role does not belong to a team / the board", { role });

    if (dateFrom && dateTo && dateFrom > dateTo) throw this._error("invalidPeriod", "dateFrom is after dateTo");

    // Stejná osoba nesmí být ve stejné funkci dvakrát ve stejnou dobu (design/data-model.md, sekce 7).
    const clash = (await dao.listSameRole(item)).find((other) => String(other.id) !== String(item.id) && overlaps(other, item));
    if (clash) {
      throw this._error("overlap", "The person already holds this role in an overlapping period", {
        id: String(clash.id),
        dateFrom: clash.dateFrom ?? null,
        dateTo: clash.dateTo ?? null,
      });
    }
  }

  _error(code, message, paramMap) {
    return new CoreError(message, { status: 400, code: CoreError.code("management", code), paramMap });
  }
}

export default new ManagementCrud();
