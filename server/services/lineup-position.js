// Přesný post hráče v sestavě zápasu (Caio, 2026-10-26): 28 postů z v0 tabulky `post`
// s anglickými kódy. Každý patří do jedné ze čtyř linií (`Config.POSITION_LIST`), takže
// `playerList[].position` se z něj dopočítá a statistiky i soupisky se nemění.
// Střídání post není, je to příznak `substitute`.
//
// Zrcadlo pro klienta je client/src/config/lineup-position.js (server z client/ importovat
// nesmí); shodu hlídá client/src/config/lineup-position.test.js. České názvy jsou v lsi
// klienta (`enum.lineupPosition`).

// Kód -> linie, v pořadí, v jakém se nabízí ve formuláři (brankář, obrana, záloha, útok).
const LINEUP_POSITION_MAP = {
  GK: "GK", // brankář
  RB: "DF", // pravá obrana
  LB: "DF", // levá obrana
  CB: "DF", // stoper
  FCB: "DF", // předstoper
  RCB: "DF", // pravá střední obrana
  LCB: "DF", // levá střední obrana
  RM: "MF", // pravá záloha
  LM: "MF", // levá záloha
  CM: "MF", // střední záloha
  RCM: "MF", // pravá střední záloha
  LCM: "MF", // levá střední záloha
  CDM: "MF", // střední defenzivní záloha
  RDM: "MF", // pravá defenzivní záloha
  LDM: "MF", // levá defenzivní záloha
  RCDM: "MF", // pravá střední defenzivní záloha
  LCDM: "MF", // levá střední defenzivní záloha
  CAM: "MF", // střední ofenzivní záloha
  RAM: "MF", // pravá ofenzivní záloha
  LAM: "MF", // levá ofenzivní záloha
  RCAM: "MF", // pravá střední ofenzivní záloha
  LCAM: "MF", // levá střední ofenzivní záloha
  RF: "FW", // pravý útok
  LF: "FW", // levý útok
  CF: "FW", // střední útok
  ST: "FW", // hrotový útok
  RS: "FW", // pravý hrotový útok
  LS: "FW", // levý hrotový útok
};
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
