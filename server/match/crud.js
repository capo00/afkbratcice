import { Crud, Error as CoreError } from "caio-server";
import dao from "./dao.js";
import teamDao from "../team/dao.js";
import playerDao from "../player/dao.js";
import personDao from "../person/dao.js";
import Config from "../config.js";
import { hasRole, myTeamIdList } from "../services/authorize.js";

class MatchCrud extends Crud {
  constructor() {
    super("match", dao);
  }

  /**
   * `departureTime` je interní údaj (kdy se odjíždí), který nemá být veřejný. Filtruje
   * se tady, ve vrstvě crud, ne v jednotlivých use casech -- jinak by stačilo najít
   * druhý endpoint, který zápas vrací, a filtr se obejde.
   */
  _forIdentity(match, identity) {
    if (hasRole(identity, Config.MEMBER) || myTeamIdList(identity).length) return match;
    const { departureTime, ...rest } = match;
    return rest;
  }

  async list(dtoIn = {}, identity) {
    const { pageInfo, order, ...filter } = dtoIn;
    const itemList = await dao.listByFilter(filter, pageInfo, order);
    return itemList.map((item) => this._forIdentity(this._getData(item), identity));
  }

  async get(id, identity) {
    const match = this._getData(await this._get(id));
    const [homeTeam, guestTeam] = await Promise.all([
      teamDao.get(match.homeTeamId).catch(() => null),
      teamDao.get(match.guestTeamId).catch(() => null),
    ]);

    return {
      ...this._forIdentity(match, identity),
      homeTeam,
      guestTeam,
      playerList: await this._expandPlayerList(match.playerList),
    };
  }

  async getLast(teamId, identity) {
    const found = await dao.findLast(teamId);
    return found ? this._forIdentity(this._getData(found), identity) : {};
  }

  async getNext(teamId, identity) {
    const found = await dao.findNext(teamId);
    return found ? this._forIdentity(this._getData(found), identity) : {};
  }

  /** Sestava se vrací i s osobami, aby klient nemusel dotahovat každého hráče zvlášť. */
  async _expandPlayerList(playerList) {
    if (!playerList?.length) return [];

    const playerIdList = [...new Set(playerList.map((p) => p.playerId).filter(Boolean))];
    if (!playerIdList.length) return playerList;

    const players = await playerDao.listByIdList(playerIdList);
    const personIdList = [...new Set(players.map((p) => p.personId).filter(Boolean))];
    const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];

    return playerList.map((entry) => {
      const player = players.find((p) => p.id === entry.playerId);
      const person = player ? persons.find((x) => x.id === player.personId) : null;
      // Veřejná sestava nese jen jméno -- kontakty osoby sem nepatří.
      return {
        ...entry,
        player: player ? { id: player.id, position: player.position, number: player.number, teamList: player.teamList } : null,
        person: person ? { id: person.id, name: person.name, surname: person.surname } : null,
      };
    });
  }

  /**
   * Přátelský zápas nemá kolo. Prázdný řetězec normalizujeme na null, protože částečný
   * unikátní index stojí na `round: { $type: "string" }` -- s "" by dva přátelské zápasy
   * stejné dvojice v jedné sezóně kolidovaly.
   */
  _normalize(data) {
    if (!("round" in data)) return data;
    return { ...data, round: data.round === "" || data.round === undefined ? null : data.round };
  }

  async create(data, identity) {
    this._checkTeams(data);
    const item = this._normalize(data);
    return this._forIdentity(await super.create({ ...item, state: item.state ?? this._deriveState(item) }), identity);
  }

  async createMany(dataList) {
    for (const item of dataList) this._checkTeams(item);
    return super.createMany(
      dataList.map((item) => {
        const normalized = this._normalize(item);
        return { ...normalized, state: normalized.state ?? this._deriveState(normalized) };
      }),
    );
  }

  /**
   * @param identity  když volající prošel jen rozsahovou rolí (teamEditor), nesmí
   *                  přepsat soupeře -- jinak by si zápas přetáhl k sobě.
   */
  async update(data, identity) {
    const scopedOnly = Boolean(identity) && !hasRole(identity, Config.MATCH) && myTeamIdList(identity).length > 0;

    if (scopedOnly) {
      const { homeTeamId, guestTeamId, ...rest } = data;
      return this._forIdentity(await super.update(this._normalize(rest)), identity);
    }

    if (data.homeTeamId || data.guestTeamId) {
      const current = await this._get(data.id);
      this._checkTeams({ ...current, ...data });
    }
    return this._forIdentity(await super.update(this._normalize(data)), identity);
  }

  async setResult({ id, homeGoals, guestGoals, homeGoalsHalf, guestGoalsHalf, penaltyWinnerTeamId }, identity) {
    const current = await this._get(id);

    if (penaltyWinnerTeamId) {
      if (![current.homeTeamId, current.guestTeamId].includes(penaltyWinnerTeamId)) {
        throw this._error("invalidPenaltyWinner", "Penalty winner must be one of the two teams", { penaltyWinnerTeamId });
      }
      // Rozstřel dává smysl jen u remízy -- jinak by tabulka počítala nesmysl.
      if (homeGoals !== guestGoals) {
        throw this._error("invalidPenaltyWinner", "Penalty shootout is only possible on a draw", { homeGoals, guestGoals });
      }
    }

    // `_forIdentity` i tady, aby zápis vracel týž tvar jako `list` -- klient položku
    // v seznamu nahradí tímhle objektem (`useDataList`), takže by se jinak lišila
    // od sousedů o `departureTime`.
    return this._forIdentity(
      await super.update({
        id,
        homeGoals,
        guestGoals,
        homeGoalsHalf: homeGoalsHalf ?? null,
        guestGoalsHalf: guestGoalsHalf ?? null,
        penaltyWinnerTeamId: penaltyWinnerTeamId ?? null,
        state: "played",
      }),
      identity,
    );
  }

  /**
   * Zápis sestavy. Editor jednoho týmu smí psát **jen hráče svého týmu** -- zápas má
   * dva a `any` v autorizaci pustí editora kteréhokoli z nich, ale sestavu soupeři
   * zapisovat nesmí. Ostatní záznamy proto zůstávají, jak byly.
   */
  async setLineup({ id, playerList = [] }, identity) {
    const current = await this._get(id);
    const teamIdList = [current.homeTeamId, current.guestTeamId];

    const players = playerList.length
      ? await playerDao.listByIdList([...new Set(playerList.map((p) => p.playerId))])
      : [];

    for (const entry of playerList) {
      const player = players.find((p) => p.id === entry.playerId);
      if (!player) throw this._error("unknownPlayer", "Player does not exist", { playerId: entry.playerId });

      const playerTeamIdList = (player.teamList ?? []).map((t) => t.id);
      if (!playerTeamIdList.some((teamId) => teamIdList.includes(teamId))) {
        throw this._error("playerNotInMatch", "Player does not belong to either team of the match", {
          playerId: entry.playerId,
        });
      }
    }

    const scopedOnly = Boolean(identity) && !hasRole(identity, Config.MATCH) && myTeamIdList(identity).length > 0;
    let nextPlayerList = playerList;

    if (scopedOnly) {
      const mine = myTeamIdList(identity);
      const isMine = (entry) => {
        const player = players.find((p) => p.id === entry.playerId);
        return (player?.teamList ?? []).some((t) => mine.includes(t.id));
      };
      if (!playerList.every(isMine)) {
        throw this._error("foreignLineup", "A team editor may only write their own team's lineup", {});
      }
      // Zachovat sestavu druhého týmu.
      const foreign = (current.playerList ?? []).filter((entry) => !isMine(entry));
      nextPlayerList = [...foreign, ...playerList];
    }

    // Součet gólů vyšší než skóre týmu je varování, ne chyba -- vlastní góly existují.
    const goalSum = nextPlayerList.reduce((sum, entry) => sum + (entry.goals ?? 0), 0);
    const scoreSum = (current.homeGoals ?? 0) + (current.guestGoals ?? 0);
    if (Number.isFinite(scoreSum) && goalSum > scoreSum) {
      console.warn(`[match] lineup goals (${goalSum}) exceed the score (${scoreSum}) on match ${id}`);
    }

    // Vrací se **holý zápas**, ne rozbalená sestava ani vložené týmy. Zápis dotahovat
    // tranzitivní data nemusí: klient si současnou položku doplní o to, co přišlo
    // (viz `routes/admin/matches.jsx`), takže `homeTeam`/`guestTeam` z `get` zůstanou
    // zachované a nemusí se kvůli jednomu zápisu načítat znovu.
    return this._forIdentity(await super.update({ id, playerList: nextPlayerList }), identity);
  }

  _deriveState(data) {
    return Number.isFinite(data.homeGoals) && Number.isFinite(data.guestGoals) ? "played" : "planned";
  }

  _checkTeams(data) {
    if (data.homeTeamId && data.guestTeamId && data.homeTeamId === data.guestTeamId) {
      throw this._error("sameTeams", "A team cannot play against itself", { teamId: data.homeTeamId });
    }
  }

  _error(code, message, paramMap) {
    return new CoreError(message, { status: 400, code: `${Config.ERROR_PREFIX}/match/${code}`, paramMap });
  }
}

export default new MatchCrud();
