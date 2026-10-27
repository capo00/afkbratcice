// Rozestavení sestavy na hřišti (varianta C, schválil Caio 2026-10-27).
//
// Čisté funkce bez uu5, aby šly testovat v node (layout.test.js). Souřadnice jsou v procentech
// hřiště na výšku: `x` zleva, `y` shora; tým útočí nahoru, brankář je dole. Hřiště se tak
// zmenšuje a zvětšuje i s hráči a nic se nerozjede (lineup-pitch.jsx).
//
// Dva hráči na jednom postu v zápase být nemůžou (Caio), takže se nic nerozestupuje.
// Souřadnice jsou zvolené tak, aby se nepřekrýval ani kruh s fotkou a jméno sousedních postů
// při nejmenší šířce hřiště (kontroluje layout.test.js).

/** Kód přesného postu (server/services/lineup-position.js) -> bod na hřišti. */
const POSITION_POINT = {
  // hroty útoku
  LS: { x: 31, y: 7 },
  ST: { x: 50, y: 7 },
  RS: { x: 69, y: 7 },
  // útok
  LF: { x: 12, y: 18 },
  CF: { x: 50, y: 19 },
  RF: { x: 88, y: 18 },
  // ofenzivní záloha
  LAM: { x: 12, y: 30 },
  LCAM: { x: 31, y: 30 },
  CAM: { x: 50, y: 30 },
  RCAM: { x: 69, y: 30 },
  RAM: { x: 88, y: 30 },
  // záloha
  LM: { x: 12, y: 42 },
  LCM: { x: 31, y: 42 },
  CM: { x: 50, y: 42 },
  RCM: { x: 69, y: 42 },
  RM: { x: 88, y: 42 },
  // defenzivní záloha
  LDM: { x: 12, y: 54 },
  LCDM: { x: 31, y: 54 },
  CDM: { x: 50, y: 54 },
  RCDM: { x: 69, y: 54 },
  RDM: { x: 88, y: 54 },
  // obrana
  FCB: { x: 50, y: 65 },
  LB: { x: 12, y: 72 },
  RB: { x: 88, y: 72 },
  LCB: { x: 31, y: 77 },
  CB: { x: 50, y: 77 },
  RCB: { x: 69, y: 77 },
  // brankář
  GK: { x: 50, y: 89 },
};

// Místo, které hráč (kruh s fotkou a jméno pod ním) zabírá, v procentech hřiště: šířka
// jména, výška od středu kruhu nahoru a dolů a nejmenší svislý rozestup dvou hráčů.
// Komponenta podle toho nastavuje šířku jména a velikost kruhu (lineup-pitch.jsx), takže
// se hráči nepřekryjí při žádné šířce hřiště; test kontroluje souřadnice postů.
const PLAYER_BOX = { width: 18, height: 11, up: 5, down: 8 };

// Starší zápisy mají jen linii (`position`): hráči linie se rozestaví rovnoměrně v její řadě.
const LINE_Y = { GK: 89, DF: 75, MF: 42, FW: 18 };

/**
 * @param entryList sestava jednoho týmu (`match.playerList` z `match/get`)
 * @returns `{ placed: [{ entry, x, y }], substitutes: [entry], unplaced: [entry] }`
 *   `placed` hráči základní sestavy na hřišti, `substitutes` střídající, `unplaced` hráči
 *   základní sestavy bez postu i linie (vykreslí se pod hřištěm).
 */
function layoutLineup(entryList = []) {
  const placed = [];
  const substitutes = [];
  const unplaced = [];
  const byLine = {};

  for (const entry of entryList) {
    if (entry.substitute) substitutes.push(entry);
    else if (POSITION_POINT[entry.positionDetail]) placed.push({ entry, ...POSITION_POINT[entry.positionDetail] });
    else if (LINE_Y[entry.position]) (byLine[entry.position] = byLine[entry.position] ?? []).push(entry);
    else unplaced.push(entry);
  }

  for (const [line, list] of Object.entries(byLine)) {
    list.forEach((entry, index) => placed.push({ entry, x: ((index + 1) / (list.length + 1)) * 100, y: LINE_Y[line] }));
  }

  return { placed, substitutes, unplaced };
}

/**
 * „Shpuryk O.“ -- příjmení a první písmeno jména; s `surnameOnly` jen „Shpuryk“ (hřiště na
 * mobilu, Caio 2026-10-27). Bez jména číslo dresu, jinak null.
 */
function shortName(entry, { surnameOnly = false } = {}) {
  const surname = entry.person?.surname;
  const initial = entry.person?.name?.trim()?.[0];
  if (surname) return initial && !surnameOnly ? `${surname} ${initial}.` : surname;
  return entry.player?.number ? `#${entry.player.number}` : null;
}

/** Iniciály do kruhu bez fotky („OS“). */
function initials(entry) {
  const text = [entry.person?.name, entry.person?.surname]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("");
  return text || (entry.player?.number ? String(entry.player.number) : "?");
}

export { POSITION_POINT, LINE_Y, PLAYER_BOX, layoutLineup, shortName, initials };
