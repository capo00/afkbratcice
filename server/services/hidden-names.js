import Config from "../config.js";
import { hasRole, myTeamIdList } from "./authorize.js";

// Jména dětí odstraňuje server, ne klient (design/api.md, 1.2; rozhodnuto 2026-09-06,
// zavedeno 2026-10-28). U týmu, jehož kategorie má věk z `appConfig.hideNamesAgeList`,
// chodí osoba hráče bez jména a fotky každému, kdo nespravuje zápasy ani žádný tým.
// Klient místo jména ukazuje číslo dresu.
//
// Pravidla jsou tady bez přístupu k databázi, aby šla testovat (server/test/hidden-names.test.js);
// seznam skrytých týmů načítá services/hidden-teams.js.
//
// Kdo jména vidí: správa zápasů (`MATCH`, tedy i `CONTENT` a `ADMIN`) a editor kteréhokoli
// týmu -- obojí v administraci sestavuje sestavy a bez jmen by děti nepoznali. Návrh
// původně říkal jen `CONTENT`; editor sestav by pak u žáků viděl samá čísla. A osoba sama.
//
// Trenéři se neskrývají: jsou dospělí a rodiče mají vědět, kdo děti vede.

const HIDDEN_FIELD_LIST = ["name", "surname", "photoId", "photoUri"];

/** Vidí volající jména dětí kdekoli? */
function canSeeHiddenNames(identity) {
  return Boolean(identity) && (hasRole(identity, Config.MATCH) || myTeamIdList(identity).length > 0);
}

function isSelf(identity, person) {
  return Boolean(identity?.identity) && person?.identity === identity.identity;
}

/** Osoba bez jména a fotky; `id` zůstává, aby šel hráč pořád rozkliknout. */
function withoutName(person) {
  if (!person) return person;
  const result = { ...person };
  for (const field of HIDDEN_FIELD_LIST) delete result[field];
  return result;
}

/** Osoba tak, jak ji smí vidět volající, když je v kontextu skrytého týmu. */
function personForIdentity(person, identity, hidden) {
  if (!hidden || !person || canSeeHiddenNames(identity) || isSelf(identity, person)) return person;
  return withoutName(person);
}

function isOpenMembership(membership, today) {
  return !membership.dateTo || membership.dateTo >= today;
}

/**
 * Je hráč (mimo kontext konkrétního týmu, třeba detail hráče) dítě? Ano, když má otevřené
 * členství v některém skrytém týmu.
 */
function isPlayerHidden(player, hiddenTeamIdSet, today = new Date().toISOString().slice(0, 10)) {
  return (player?.teamList ?? []).some((m) => hiddenTeamIdSet.has(m.id) && isOpenMembership(m, today));
}

export { canSeeHiddenNames, withoutName, personForIdentity, isPlayerHidden, HIDDEN_FIELD_LIST };
