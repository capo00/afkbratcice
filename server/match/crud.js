import { Crud, Error as CoreError, Authorization } from "caio-server";
import dao from "./dao.js";
import teamDao from "../team/dao.js";
import playerDao from "../player/dao.js";
import rosterDao from "../roster/dao.js";
import personDao from "../person/dao.js";
import seasonDao from "../season/dao.js";
import categoryDao from "../category/dao.js";
import Config from "../config.js";
import { checkMatchAges, isFriendly } from "../services/category.js";
import { withLineupPositions } from "../services/lineup-position.js";
import { personForIdentity } from "../services/hidden-names.js";
import { loadHiddenTeamIdSet } from "../services/hidden-teams.js";
import { isActive } from "../services/membership.js";
import { withTeamList } from "../services/roster.js";
import { departureOnMatchDay } from "../services/prague-time.js";

// Hráčů jednoho týmu v základu (`substitute: false`) je nejvýš tolik.
const MAX_STARTERS = 11;

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
    if (Authorization.hasProfile(identity, [...Config.MEMBER, Config.ANY_TEAM_EDITOR])) return match;
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
    const [homeTeam, guestTeam, hiddenTeamIdSet] = await Promise.all([
      teamDao.get(match.homeTeamId).catch(() => null),
      teamDao.get(match.guestTeamId).catch(() => null),
      loadHiddenTeamIdSet(),
    ]);
    // Sestava zápasu dětí jde bez jmen a fotek (services/hidden-names.js).
    const hidden = hiddenTeamIdSet.has(match.homeTeamId) || hiddenTeamIdSet.has(match.guestTeamId);

    return {
      ...this._forIdentity(match, identity),
      homeTeam,
      guestTeam,
      playerList: await this._expandPlayerList(match.playerList, { hidden, identity }),
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
  async _expandPlayerList(playerList, { hidden = false, identity } = {}) {
    if (!playerList?.length) return [];

    const playerIdList = [...new Set(playerList.map((p) => p.playerId).filter(Boolean))];
    if (!playerIdList.length) return playerList;

    // `teamList` je odvozený ze soupisky -- podle něj web rozdělí sestavu na domácí a hosty.
    const players = await withTeamList(await playerDao.listByIdList(playerIdList));
    const personIdList = [...new Set(players.map((p) => p.personId).filter(Boolean))];
    const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];

    return playerList.map((entry) => {
      const player = players.find((p) => p.id === entry.playerId);
      const found = player ? persons.find((x) => x.id === player.personId) : null;
      // O skrytí rozhoduje celá osoba (i `identity` kvůli výjimce pro ni samu), ořízne se až potom.
      const person = found ? personForIdentity(found, identity, hidden) : null;
      // Veřejná sestava nese jen jméno a fotku -- kontakty osoby sem nepatří. Fotka se do
      // zápasu neukládá, bere se z osoby až tady (hřiště v detailu zápasu na webu).
      return {
        ...entry,
        player: player ? { id: player.id, position: player.position, teamList: player.teamList } : null,
        person: person ? { id: person.id, name: person.name, surname: person.surname, photoUri: person.photoUri ?? null } : null,
      };
    });
  }

  /**
   * Přátelský zápas nemá kolo. Prázdný řetězec normalizujeme na null, protože částečný
   * unikátní index stojí na `round: { $type: "string" }` -- s "" by dva přátelské zápasy
   * stejné dvojice v jedné sezóně kolidovaly.
   */
  _normalize(data) {
    let out = data;
    if ("playerList" in out) out = { ...out, playerList: withLineupPositions(out.playerList) };
    if (!("round" in out)) return out;
    return { ...out, round: out.round === "" || out.round === undefined ? null : out.round };
  }

  async create(data, identity) {
    this._checkTeams(data);
    await this._checkAges(data);
    const item = this._normalize(this._withDeparture(data));
    return this._forIdentity(await super.create({ ...item, state: item.state ?? this._deriveState(item) }), identity);
  }

  async createMany(dataList) {
    for (const item of dataList) this._checkTeams(item);
    await this._checkAgesMany(dataList);
    for (const [index, item] of dataList.entries()) await this._checkResult(item, { index });
    const withDeparture = dataList.map((item, index) => this._withDeparture(item, null, { index }));
    return super.createMany(
      withDeparture.map((item) => {
        const normalized = this._normalize(item);
        return { ...normalized, state: normalized.state ?? this._deriveState(normalized) };
      }),
    );
  }

  /**
   * @param identity  když volající prošel jen rozsahovou rolí (teamEditor), nesmí
   *                  přepsat soupeře -- jinak by si zápas přetáhl k sobě.
   */
  async update(input, identity) {
    const data =
      "time" in input || "departureTime" in input ? this._withDeparture(input, this._getData(await this._get(input.id))) : input;
    const scopedOnly =
      !Authorization.hasProfile(identity, Config.MATCH) && Authorization.hasProfile(identity, [Config.ANY_TEAM_EDITOR]);

    if (scopedOnly) {
      const { homeTeamId, guestTeamId, ...rest } = data;
      // Ani editor týmu nesmí z přáteláku napříč věkovými skupinami udělat mistrovský zápas
      // (doplnit kolo, přehodit sezónu).
      if (rest.seasonId || "round" in rest) await this._checkAges({ ...(await this._get(data.id)), ...rest });
      return this._forIdentity(await super.update(this._normalize(rest)), identity);
    }

    if (data.homeTeamId || data.guestTeamId || data.seasonId || "round" in data) {
      const current = await this._get(data.id);
      this._checkTeams({ ...current, ...data });
      await this._checkAges({ ...current, ...data });
    }
    return this._forIdentity(await super.update(this._normalize(data)), identity);
  }

  /**
   * Odjezd je čas **v den zápasu** (Caio 2026-11-18): ve formuláři se vybírá jen čas, datum je
   * výkopu. Server proto odjezd při každém zápisu termínu nebo odjezdu posadí na den zápasu
   * (stejný český čas) -- přesunutý zápas tak nenechá odjezd na starém dni, a projde i starý
   * tvar „HH:MM:SS“ z v0, dokud ho nepřevede migrace. Odjezd po výkopu nebo bez výkopu je chyba.
   *
   * @param current  uložený zápas (u `update`), z něj se doplní, co v `data` chybí
   * @param extra    data navíc do chyby (pořadí položky importu)
   */
  _withDeparture(data, current = null, extra = {}) {
    const time = "time" in data ? data.time : current?.time;
    const departureTime = "departureTime" in data ? data.departureTime : current?.departureTime;
    if (!departureTime) return data;

    const aligned = departureOnMatchDay(departureTime, time);
    if (!aligned || new Date(aligned) > new Date(time)) {
      throw this._error("invalidDepartureTime", "Departure must be on the match day, not after the kick-off", {
        time: time ?? null,
        departureTime,
        ...extra,
      });
    }
    return { ...data, departureTime: aligned };
  }

  /**
   * Rules of a match result, shared by `setResult` and the fixture import (`createMany`) -- every
   * way a result enters the database goes through them (review 2026-11-12, V1). The season is
   * loaded only when there is a shootout winner to check.
   *
   * @param match  the teams and the season of the match plus the result being written
   * @param extra  additional error data (the item index of an import)
   */
  async _checkResult(
    { homeTeamId, guestTeamId, seasonId, homeGoals, guestGoals, homeGoalsHalf, guestGoalsHalf, penaltyWinnerTeamId },
    extra = {},
  ) {
    // Gól daný v prvním poločase se už nevezme, takže poločas nemůže být vyšší než konečné skóre
    // (review 2026-11-12, 5.4: 3 takové zápasy z importu v0).
    for (const [half, full] of [[homeGoalsHalf, homeGoals], [guestGoalsHalf, guestGoals]]) {
      if (Number.isFinite(half) && Number.isFinite(full) && half > full) {
        throw this._error("invalidHalfTime", "Half-time score cannot exceed the final score", {
          homeGoals,
          guestGoals,
          homeGoalsHalf,
          guestGoalsHalf,
          ...extra,
        });
      }
    }

    if (!penaltyWinnerTeamId) return;

    if (![homeTeamId, guestTeamId].includes(penaltyWinnerTeamId)) {
      throw this._error("invalidPenaltyWinner", "Penalty winner must be one of the two teams", { penaltyWinnerTeamId, ...extra });
    }
    // A shootout only makes sense on a draw -- otherwise the table would count nonsense.
    if (homeGoals !== guestGoals) {
      throw this._error("invalidPenaltyWinner", "Penalty shootout is only possible on a draw", { homeGoals, guestGoals, ...extra });
    }
    // ... and only in a competition played with shootouts (`season.hasPenalties`). Elsewhere the
    // table would not count the winner anyway (services/table.js) and the web would show a badge
    // that means nothing. A match without a season is a friendly without shootouts.
    const season = seasonId ? await seasonDao.get(seasonId).catch(() => null) : null;
    if (!season?.hasPenalties) {
      throw this._error("invalidPenaltyWinner", "Penalty shootout is not played in this season", {
        seasonId: seasonId ?? null,
        ...extra,
      });
    }
  }

  async setResult({ id, homeGoals, guestGoals, homeGoalsHalf, guestGoalsHalf, penaltyWinnerTeamId }, identity) {
    const current = await this._get(id);
    await this._checkResult({ ...current, homeGoals, guestGoals, homeGoalsHalf, guestGoalsHalf, penaltyWinnerTeamId });

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
  async setLineup({ id, playerList = [], teamId }, identity) {
    const current = await this._get(id);
    const teamIdList = [current.homeTeamId, current.guestTeamId];

    const playerIdList = [...new Set(playerList.map((p) => p.playerId))];
    const players = playerList.length ? await playerDao.listByIdList(playerIdList) : [];
    // Soupiska hráčů sestavy i hráčů dosavadní sestavy (kvůli `isMine` níž).
    const rosterList = await rosterDao.listByPlayerIdList([
      ...new Set([...playerIdList, ...(current.playerList ?? []).map((p) => p.playerId)]),
    ]);
    // Hráč patří k zápasu, když byl v den zápasu na soupisce domácích nebo hostů; zápas
    // bez termínu bere kterékoli působení.
    const matchDay = current.time ? String(current.time).slice(0, 10) : null;

    if (teamId) return this._setTeamLineup({ id, current, teamId, playerList, players, rosterList, matchDay }, identity);

    for (const entry of playerList) {
      const player = players.find((p) => p.id === entry.playerId);
      if (!player) throw this._error("unknownPlayer", "Player does not exist", { playerId: entry.playerId });

      const inMatch = rosterList.some(
        (r) => r.playerId === entry.playerId && teamIdList.includes(r.teamId) && (!matchDay || isActive(r, matchDay)),
      );
      if (!inMatch) {
        throw this._error("playerNotInMatch", "Player does not belong to either team of the match", {
          playerId: entry.playerId,
        });
      }
    }

    for (const matchTeamId of teamIdList) {
      const ofTeam = playerList.filter((entry) =>
        rosterList.some((r) => r.playerId === entry.playerId && r.teamId === matchTeamId && (!matchDay || isActive(r, matchDay))),
      );
      this._checkStarters(ofTeam, matchTeamId);
    }

    const scopedOnly =
      !Authorization.hasProfile(identity, Config.MATCH) && Authorization.hasProfile(identity, [Config.ANY_TEAM_EDITOR]);
    let nextPlayerList = playerList;

    if (scopedOnly) {
      const mine = Authorization.scopesOf(identity, Config.ROLE.TEAM_EDITOR);
      const isMine = (entry) => rosterList.some((r) => r.playerId === entry.playerId && mine.includes(r.teamId));
      if (!playerList.every(isMine)) {
        throw this._error("foreignLineup", "A team editor may only write their own team's lineup", {});
      }
      // Zachovat sestavu druhého týmu.
      const foreign = (current.playerList ?? []).filter((entry) => !isMine(entry));
      nextPlayerList = [...foreign, ...playerList];
    }

    return this._saveLineup(id, current, nextPlayerList, identity);
  }

  /**
   * Lineup of **one team** of the match (`teamId`, the match modal): the players of that team's
   * roster on the match day are replaced by `playerList`, every other entry stays as it is --
   * for a match manager and a team editor alike. Without it the client and the server would
   * have to agree on which entries are "the other ones", and a team editor's save could
   * silently delete entries his client never showed him (review 2026-11-10).
   */
  async _setTeamLineup({ id, current, teamId, playerList, players, rosterList, matchDay }, identity) {
    if (teamId !== current.homeTeamId && teamId !== current.guestTeamId) {
      throw this._error("teamNotInMatch", "The team does not play this match", { teamId });
    }
    const scopedOnly =
      !Authorization.hasProfile(identity, Config.MATCH) && Authorization.hasProfile(identity, [Config.ANY_TEAM_EDITOR]);
    if (scopedOnly && !Authorization.scopesOf(identity, Config.ROLE.TEAM_EDITOR).includes(teamId)) {
      throw this._error("foreignLineup", "A team editor may only write their own team's lineup", {});
    }

    const onTeam = (playerId) =>
      rosterList.some((r) => r.playerId === playerId && r.teamId === teamId && (!matchDay || isActive(r, matchDay)));
    for (const entry of playerList) {
      if (!players.some((p) => p.id === entry.playerId)) {
        throw this._error("unknownPlayer", "Player does not exist", { playerId: entry.playerId });
      }
      if (!onTeam(entry.playerId)) {
        throw this._error("playerNotInMatch", "Player is not on the team's roster on the match day", { playerId: entry.playerId });
      }
    }

    this._checkStarters(playerList, teamId);

    const kept = (current.playerList ?? []).filter((entry) => !onTeam(entry.playerId));
    return this._saveLineup(id, current, [...kept, ...playerList], identity);
  }

  /**
   * Nejvýš 11 hráčů jednoho týmu v základu (review 2026-11-12, 5.4: dvě sestavy z importu v0
   * jich mají 12). Méně projde -- v nižších soutěžích se nastupuje i v devíti. Kontroluje se jen
   * to, co se právě zapisuje, ne ponechaná sestava soupeře.
   */
  _checkStarters(teamPlayerList, teamId) {
    const starterCount = teamPlayerList.filter((entry) => !entry.substitute).length;
    if (starterCount > MAX_STARTERS) {
      throw this._error("tooManyStarters", `A team can have at most ${MAX_STARTERS} starters`, {
        teamId,
        starterCount,
        maxStarterCount: MAX_STARTERS,
      });
    }
  }

  async _saveLineup(id, current, nextPlayerList, identity) {
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
    return this._forIdentity(await super.update({ id, playerList: withLineupPositions(nextPlayerList) }), identity);
  }

  _deriveState(data) {
    return Number.isFinite(data.homeGoals) && Number.isFinite(data.guestGoals) ? "played" : "planned";
  }

  _checkTeams(data) {
    if (data.homeTeamId && data.guestTeamId && data.homeTeamId === data.guestTeamId) {
      throw this._error("sameTeams", "A team cannot play against itself", { teamId: data.homeTeamId });
    }
  }

  /**
   * Věkové skupiny týmů a sezóny (services/category.js). Tým bez kategorie nebo kategorie,
   * která neexistuje, pravidlo nezastaví -- to hlídá `team/create`/`update`.
   */
  async _checkAges(data) {
    return this._checkAgesMany([data]);
  }

  /**
   * Týmy, sezóny a kategorie se načtou jedním dotazem pro celou dávku (hromadné zakládání
   * rozlosování má stovky zápasů). Chyba nese pořadí položky (`index`).
   */
  async _checkAgesMany(dataList) {
    const withTeams = dataList.filter((data) => data.homeTeamId && data.guestTeamId);
    if (!withTeams.length) return;

    const teamIdList = [...new Set(withTeams.flatMap((data) => [data.homeTeamId, data.guestTeamId]))];
    const seasonIdList = [...new Set(withTeams.map((data) => data.seasonId).filter(Boolean))];
    const [teams, seasons] = await Promise.all([
      teamDao.listByIdList(teamIdList).catch(() => []),
      seasonIdList.length ? seasonDao.listByIdList(seasonIdList).catch(() => []) : [],
    ]);
    const codeList = [...new Set(teams.map((team) => team.category).filter(Boolean))];
    const categories = codeList.length ? await categoryDao.listByCodeList(codeList) : [];
    const ageOfTeam = (id) => categories.find((c) => c.code === teams.find((t) => t.id === id)?.category)?.age;

    dataList.forEach((data, index) => {
      if (!data.homeTeamId || !data.guestTeamId) return;
      const homeAge = ageOfTeam(data.homeTeamId);
      const guestAge = ageOfTeam(data.guestTeamId);
      if (!homeAge || !guestAge) return;
      const seasonAge = seasons.find((season) => season.id === data.seasonId)?.age;

      const problem = checkMatchAges({ homeAge, guestAge, seasonAge, friendly: isFriendly(data.round) });
      if (problem) {
        throw this._error(problem, "Teams of these categories cannot play this match", {
          index,
          homeTeamId: data.homeTeamId,
          guestTeamId: data.guestTeamId,
          homeAge,
          guestAge,
          seasonAge,
        });
      }
    });
  }

  _error(code, message, paramMap) {
    return new CoreError(message, { status: 400, code: CoreError.code("match", code), paramMap });
  }
}

export default new MatchCrud();
