import Config from "../config.js";

// Přesný post hráče v sestavě zápasu (Caio, 2026-10-26): 28 postů z v0 tabulky `post`
// s anglickými kódy. Každý patří do jedné ze čtyř linií (`Config.POSITION_LIST`), takže
// `playerList[].position` se z něj dopočítá a statistiky i soupisky se nemění.
// Střídání post není, je to příznak `substitute`.
//
// Číselník (kód -> linie, v pořadí formuláře) je v caio.config.js `app.lineupPositionMap`, společný
// s klientem. České názvy jsou v lsi klienta (`enum.lineupPosition`).

const LINEUP_POSITION_MAP = Config.LINEUP_POSITION_MAP;
const LINEUP_POSITION_LIST = Object.keys(LINEUP_POSITION_MAP);

// v0 `post.zkratka` -> kód (tools/migrate-v0.js).
const LINEUP_POSITION_BY_V0 = {
  BR: "GK",
  PO: "RB",
  LO: "LB",
  ST: "CB",
  PST: "FCB",
  PSO: "RCB",
  LSO: "LCB",
  PZ: "RM",
  LZ: "LM",
  SZ: "CM",
  PSZ: "RCM",
  LSZ: "LCM",
  SDZ: "CDM",
  PDZ: "RDM",
  LDZ: "LDM",
  PSDZ: "RCDM",
  LSDZ: "LCDM",
  SOZ: "CAM",
  POZ: "RAM",
  LOZ: "LAM",
  PSOZ: "RCAM",
  LSOZ: "LCAM",
  PU: "RF",
  LU: "LF",
  SU: "CF",
  HU: "ST",
  PHU: "RS",
  LHU: "LS",
};

/**
 * Sestava s dopočítanou linií: kde je přesný post, `position` se bere z něj (formulář
 * i migrace tak nemůžou poslat post a linii, které si odporují).
 */
function withLineupPositions(playerList) {
  if (!Array.isArray(playerList)) return playerList;
  return playerList.map((entry) =>
    entry?.positionDetail ? { ...entry, position: LINEUP_POSITION_MAP[entry.positionDetail] ?? entry.position } : entry,
  );
}

export { LINEUP_POSITION_MAP, LINEUP_POSITION_LIST, LINEUP_POSITION_BY_V0, withLineupPositions };
