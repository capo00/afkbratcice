// Lineup editor state (variant C, Caio 2026-11-10; canvas "AFK Bratčice – sestava v modalu
// výsledku"). Pure functions without uu5, so node can test them (lineup-state.test.js).
//
// The editor works with **positions on the pitch** (slots), not with a flat list: a slot is a
// position (`positionDetail`) that holds one player or nobody. Two players never share a
// position (Caio 2026-10-27), so a slot is identified by its position code. Substitutes are
// a plain list. Entries of players who are not on the edited team's roster (the other team of
// a friendly, a manual fix in the database) are kept aside and sent back unchanged.
//
//   state = { slots: [{ positionDetail, entry | null }], subs: [entry], foreign: [entry] }
//   entry = { playerId, positionDetail?, position?, goals, yellowCard, redCard }
//
// A target names what the player modal edits: `{ kind: "slot", positionDetail }` or
// `{ kind: "sub", playerId }` (`playerId: null` = a new substitute).

/** Default formation of a new lineup (Caio 2026-11-10): goalkeeper, a back four with a sweeper-stopper pair, four midfielders, two forwards. */
const DEFAULT_FORMATION = ["GK", "RB", "CB", "FCB", "LB", "RM", "CDM", "CAM", "LM", "RF", "LF"];

const TEAM_SIZE = 11;

function cleanEntry(entry) {
  const out = {
    playerId: entry.playerId,
    goals: Number.isFinite(entry.goals) ? entry.goals : 0,
    yellowCard: Boolean(entry.yellowCard),
    redCard: Boolean(entry.redCard),
  };
  if (entry.positionDetail) out.positionDetail = entry.positionDetail;
  // A record without an exact position keeps its line, the server would lose it otherwise.
  else if (entry.position) out.position = entry.position;
  return out;
}

/**
 * Editor state from a match lineup.
 *
 * @param playerList   `match.playerList`
 * @param isOwn        (playerId) => true for players of the edited team (on its roster)
 * @param positionMap  exact position -> line (`Config.LINEUP_POSITION_MAP`)
 */
function toEditorState(playerList = [], isOwn, positionMap) {
  const own = [];
  const foreign = [];
  for (const entry of playerList) (isOwn(entry.playerId) ? own : foreign).push(entry);

  const slots = [];
  const used = new Set();
  const withoutPosition = [];
  for (const entry of own.filter((e) => !e.substitute)) {
    if (entry.positionDetail && positionMap[entry.positionDetail] && !used.has(entry.positionDetail)) {
      slots.push({ positionDetail: entry.positionDetail, entry: cleanEntry(entry) });
      used.add(entry.positionDetail);
    } else {
      withoutPosition.push(entry);
    }
  }

  // Older records have only a line: a free default position of that line, else any free one.
  const free = [...DEFAULT_FORMATION, ...Object.keys(positionMap)].filter((code, i, all) => all.indexOf(code) === i && !used.has(code));
  for (const entry of withoutPosition) {
    // No line either (bad data): any free position but the goalkeeper's.
    const byLine = free.findIndex((code) => positionMap[code] === entry.position);
    const index = byLine >= 0 ? byLine : Math.max(0, free.findIndex((code) => positionMap[code] !== "GK"));
    const [code] = free.splice(index, 1);
    if (!code) break;
    slots.push({ positionDetail: code, entry: { ...cleanEntry(entry), positionDetail: code } });
    used.add(code);
  }
  for (const entry of slots) delete entry.entry.position;

  // Empty default positions up to a full team.
  for (const code of DEFAULT_FORMATION) {
    if (slots.length >= TEAM_SIZE) break;
    if (!used.has(code)) {
      slots.push({ positionDetail: code, entry: null });
      used.add(code);
    }
  }

  return {
    slots,
    subs: own.filter((e) => e.substitute).map(cleanEntry),
    foreign: foreign.map((e) => ({ ...e })),
  };
}

/** Where a player is in the lineup: `{ kind: "slot", positionDetail }`, `{ kind: "sub", playerId }` or null. */
function findPlayer(state, playerId) {
  if (!playerId) return null;
  const slot = state.slots.find((s) => s.entry?.playerId === playerId);
  if (slot) return { kind: "slot", positionDetail: slot.positionDetail };
  if (state.subs.some((e) => e.playerId === playerId)) return { kind: "sub", playerId };
  return null;
}

/** The entry a target holds now (null for an empty slot or a new substitute). */
function entryAt(state, target) {
  if (!target) return null;
  if (target.kind === "slot") return state.slots.find((s) => s.positionDetail === target.positionDetail)?.entry ?? null;
  return target.playerId ? (state.subs.find((e) => e.playerId === target.playerId) ?? null) : null;
}

function sameTarget(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  return a.kind === "slot" ? a.positionDetail === b.positionDetail : a.playerId === b.playerId;
}

/**
 * Apply what the player modal returned to `target`.
 *
 * - The chosen player is elsewhere in the lineup: the two swap. Whoever held `target` moves to
 *   the chosen player's old place with their own goals and cards; an empty slot leaves that
 *   place empty (a slot) or removes it (a substitute). Nobody is ever in the lineup twice.
 * - A slot moved to a position another slot holds: the two slots swap positions.
 * - No player chosen: the slot is emptied, a new substitute is not added.
 *
 * @param draft `{ playerId, positionDetail, goals, yellowCard, redCard }`
 */
function applyDraft(state, target, draft) {
  const slots = state.slots.map((s) => ({ ...s, entry: s.entry ? { ...s.entry } : null }));
  // Substitutes as an array with holes (null = removed), indexed like `state.subs`, so both
  // steps below address the original places even after the first one changed something.
  const subs = state.subs.map((e) => ({ ...e }));
  const before = entryAt(state, target);
  const other = findPlayer(state, draft.playerId);
  const entry = draft.playerId ? cleanEntry({ ...draft, positionDetail: draft.positionDetail || undefined }) : null;

  // 1. Whoever held the target goes to the chosen player's old place.
  if (other && !sameTarget(other, target)) {
    if (other.kind === "slot") {
      const holder = slots.find((s) => s.positionDetail === other.positionDetail);
      holder.entry = before ? { ...before, positionDetail: holder.positionDetail } : null;
    } else {
      const index = state.subs.findIndex((e) => e.playerId === other.playerId);
      subs[index] = before ? { ...before } : null;
    }
  }

  // 2. The target gets the chosen player.
  if (target.kind === "slot") {
    const slot = slots.find((s) => s.positionDetail === target.positionDetail);
    const nextPosition = draft.positionDetail || slot.positionDetail;
    const clash = nextPosition !== slot.positionDetail ? slots.find((s) => s.positionDetail === nextPosition) : null;
    if (clash) {
      // Swap positions: the slot that held the new position takes the old one.
      clash.positionDetail = slot.positionDetail;
      if (clash.entry) clash.entry.positionDetail = slot.positionDetail;
    }
    slot.positionDetail = nextPosition;
    slot.entry = entry ? { ...entry, positionDetail: nextPosition } : null;
  } else if (target.playerId) {
    const index = state.subs.findIndex((e) => e.playerId === target.playerId);
    subs[index] = entry;
  } else if (entry) {
    subs.push(entry);
  }

  return { ...state, slots, subs: subs.filter(Boolean) };
}

/** Empty a slot, or remove a substitute. */
function clearTarget(state, target) {
  if (target.kind === "slot") {
    return { ...state, slots: state.slots.map((s) => (s.positionDetail === target.positionDetail ? { ...s, entry: null } : s)) };
  }
  return { ...state, subs: state.subs.filter((e) => e.playerId !== target.playerId) };
}

/**
 * `playerList` for `match/setLineup`. Empty slots are left out. `includeForeign`: a match
 * manager sends the other entries back unchanged (the server replaces his whole list); a team
 * editor must not send them -- the server keeps them and rejects foreign players
 * (`match/foreignLineup`).
 */
function toPlayerList(state, { includeForeign = false } = {}) {
  const own = [
    ...state.slots.filter((s) => s.entry).map((s) => ({ ...s.entry, positionDetail: s.positionDetail, substitute: false })),
    ...state.subs.map((e) => ({ ...e, substitute: true })),
  ];
  return includeForeign ? [...state.foreign, ...own] : own;
}

/**
 * Lineup taken over from an earlier match: positions and substitutes stay, goals and cards are
 * reset, players no longer on the roster drop out. The current foreign entries stay.
 */
function fromPreviousMatch(state, previousPlayerList = [], isOwn, positionMap) {
  const taken = previousPlayerList
    .filter((e) => isOwn(e.playerId))
    .map((e) => ({ ...cleanEntry(e), goals: 0, yellowCard: false, redCard: false, substitute: Boolean(e.substitute) }));
  return { ...toEditorState(taken, () => true, positionMap), foreign: state.foreign };
}

function isEmpty(state) {
  return !state.slots.some((s) => s.entry) && state.subs.length === 0;
}

function playerCount(state) {
  return state.slots.filter((s) => s.entry).length + state.subs.length;
}

function goalSum(state) {
  return toPlayerList(state).reduce((sum, e) => sum + (e.goals ?? 0), 0);
}

/** A comparable form of the lineup -- did the user change anything? */
function lineupKey(state) {
  return JSON.stringify(
    toPlayerList(state, { includeForeign: true })
      .map((e) => [e.playerId, e.positionDetail ?? e.position ?? "", Boolean(e.substitute), e.goals ?? 0, Boolean(e.yellowCard), Boolean(e.redCard)])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
}

export {
  DEFAULT_FORMATION,
  toEditorState,
  findPlayer,
  entryAt,
  applyDraft,
  clearTarget,
  toPlayerList,
  fromPreviousMatch,
  isEmpty,
  playerCount,
  goalSum,
  lineupKey,
};
