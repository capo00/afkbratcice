// Přesný post hráče v sestavě -- zrcadlo server/services/lineup-position.js (server z client/
// importovat nesmí, klient ze serveru nemá). Shodu hlídá lineup-position.test.js.
// Kód -> linie (`Config.POSITION_LIST`), v pořadí, v jakém se nabízí ve formuláři. České
// názvy jsou v lsi (`enum.lineupPosition`).
const LINEUP_POSITION_MAP = {
  GK: "GK",
  RB: "DF",
  LB: "DF",
  CB: "DF",
  FCB: "DF",
  RCB: "DF",
  LCB: "DF",
  RM: "MF",
  LM: "MF",
  CM: "MF",
  RCM: "MF",
  LCM: "MF",
  CDM: "MF",
  RDM: "MF",
  LDM: "MF",
  RCDM: "MF",
  LCDM: "MF",
  CAM: "MF",
  RAM: "MF",
  LAM: "MF",
  RCAM: "MF",
  LCAM: "MF",
  RF: "FW",
  LF: "FW",
  CF: "FW",
  ST: "FW",
  RS: "FW",
  LS: "FW",
};
const LINEUP_POSITION_LIST = Object.keys(LINEUP_POSITION_MAP);

export { LINEUP_POSITION_MAP, LINEUP_POSITION_LIST };
