import Config from "../config.js";

/**
 * Smí spolu hrát dva týmy? (design/data-model.md, 2.3)
 *
 * - Přátelský zápas (bez kola) jde napříč věkovými skupinami.
 * - Stará garda smí hrát proti komukoli.
 * - Jinak musí mít oba týmy stejnou věkovou skupinu (`category.age`), a to stejnou jako
 *   sezóna, do které zápas patří -- B a C týmy mužů tak spolu hrát můžou, muži s dorostem ne.
 *
 * @returns kód chyby, nebo `null`, když je zápas v pořádku.
 */
function checkMatchAges({ homeAge, guestAge, seasonAge, friendly }) {
  if (friendly) return null;
  if (homeAge === Config.AGE_ANY_OPPONENT || guestAge === Config.AGE_ANY_OPPONENT) return null;
  if (homeAge !== guestAge) return "ageMismatch";
  if (seasonAge && homeAge !== seasonAge) return "seasonAgeMismatch";
  return null;
}

/** Přátelský zápas nemá kolo (`round` null nebo prázdný řetězec, viz match/crud.js). */
function isFriendly(round) {
  return round === null || round === undefined || round === "";
}

export { checkMatchAges, isFriendly };
