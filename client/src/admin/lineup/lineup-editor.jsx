import { useState, useMemo, useCallback, useLsi, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
import LineupPitch from "../../components/lineup-pitch/lineup-pitch.jsx";
import { personLabel } from "../fields.jsx";
import LineupPlayerModal from "./lineup-player-modal.jsx";
import { applyDraft, clearTarget, entryAt, findPlayer, goalSum, isEmpty } from "./lineup-state.js";

const LSI_PATH = ["admin", "matches"];

/**
 * Goals of the lineup against the team's score -- a warning, not an error: an own goal of the
 * opponent counts in the score and belongs to nobody (the server only logs it too). Reads the
 * score live from the match form, so it follows what is being typed on the Result tab.
 */
function GoalsWarning({ lineup, ownSide }) {
  const { value } = Uu5Forms.useFormApi();
  const ownGoals = ownSide === "home" ? value?.homeGoals : value?.guestGoals;
  const goals = goalSum(lineup);
  if (!Number.isFinite(ownGoals) || isEmpty(lineup) || goals === ownGoals) return null;
  return (
    <Uu5Elements.Text
      category="interface"
      segment="content"
      type="medium"
      colorScheme="warning"
      className={Config.Css.css({ display: "flex", gap: 8, alignItems: "flex-start" })}
    >
      <Uu5Elements.Icon icon="uugds-alert" />
      <Lsi import={importLsi} path={[...LSI_PATH, "goalsMismatch"]} params={{ goals, score: ownGoals }} />
    </Uu5Elements.Text>
  );
}

/**
 * The Lineup tab of the match modal (variant C, Caio 2026-11-10): the pitch of the match
 * detail (`LineupPitch` with `onSelect`) in the default formation, substitutes under it.
 * A click on a position or a substitute opens `LineupPlayerModal`. Changes stay in `lineup`
 * until the match modal saves them.
 *
 * @param lineup        editor state (lineup-state.js)
 * @param onChange      (lineup) => void
 * @param players       the team's roster on the match day (`player/list`, with `person`)
 * @param ownSide       "home" | "guest" -- which score the goals are compared with
 * @param loadPrevious  async () => lineup taken over from the previous match, or null
 */
function LineupEditor({ lineup, onChange, players, ownSide, loadPrevious }) {
  const [target, setTarget] = useState(null);
  const [takeOver, setTakeOver] = useState({ pending: false, missing: false });
  const positionLsi = useLsi(importLsi, ["enum", "lineupPosition"]);
  const matchesLsi = useLsi(importLsi, LSI_PATH);

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const withPerson = (entry) => ({ ...entry, person: playerById.get(entry.playerId)?.person ?? null });

  const entryList = [
    ...lineup.slots.filter((s) => s.entry).map((s) => withPerson({ ...s.entry, positionDetail: s.positionDetail, substitute: false })),
    ...lineup.subs.map((e) => withPerson({ ...e, substitute: true })),
  ];
  const emptyPositionList = lineup.slots.filter((s) => !s.entry).map((s) => s.positionDetail);

  // Roster players by name; where a player already is shows after the name -- picking him
  // swaps him with whoever holds the position now (lineup-state.js, `applyDraft`). Not for
  // the one already on the edited position: that is where he is going anyway.
  const playerItemList = useMemo(
    () =>
      [...players]
        .sort((a, b) => personLabel(a.person ?? {}).localeCompare(personLabel(b.person ?? {}), "cs"))
        .map((player) => {
          const where = findPlayer(lineup, player.id);
          const here =
            where &&
            target &&
            where.kind === target.kind &&
            (where.kind === "slot" ? where.positionDetail === target.positionDetail : where.playerId === target.playerId);
          const suffix = !where || here
            ? ""
            : where.kind === "slot"
              ? ` – ${(positionLsi[where.positionDetail] ?? where.positionDetail).toLowerCase()}`
              : ` – ${matchesLsi.onBench}`;
          return { value: player.id, children: personLabel(player.person ?? { id: player.id }) + suffix };
        }),
    [players, lineup, target, positionLsi, matchesLsi],
  );

  const entryOf = useCallback(
    (playerId) => {
      const where = findPlayer(lineup, playerId);
      return where ? entryAt(lineup, where) : null;
    },
    [lineup],
  );

  async function handleTakeOver() {
    setTakeOver({ pending: true, missing: false });
    try {
      const previous = await loadPrevious();
      if (previous) onChange(previous);
      setTakeOver({ pending: false, missing: !previous });
    } catch {
      setTakeOver({ pending: false, missing: true });
    }
  }

  const current = target ? entryAt(lineup, target) : null;
  const isSub = target?.kind === "sub";

  return (
    <div className={Config.Css.css({ display: "grid", gap: 16 })}>
      {isEmpty(lineup) ? (
        <div className={Config.Css.css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 })}>
          {/* Loaded only on demand: the previous match is one request nobody needs until asked. */}
          <Uu5Elements.Button
            icon={takeOver.pending ? undefined : "uugds-copy"}
            disabled={takeOver.pending}
            onClick={handleTakeOver}
          >
            {takeOver.pending ? <Uu5Elements.Pending size="xs" /> : null}
            <Lsi import={importLsi} path={[...LSI_PATH, "takeOverLineup"]} />
          </Uu5Elements.Button>
          {takeOver.missing ? (
            <Uu5Elements.Text category="interface" segment="content" type="medium" significance="subdued">
              <Lsi import={importLsi} path={[...LSI_PATH, "noPreviousLineup"]} />
            </Uu5Elements.Text>
          ) : null}
        </div>
      ) : null}

      <GoalsWarning lineup={lineup} ownSide={ownSide} />

      <LineupPitch
        entryList={entryList}
        emptyPositionList={emptyPositionList}
        onSelect={setTarget}
        benchFooter={
          <Uu5Elements.Button icon="uugds-plus" onClick={() => setTarget({ kind: "sub", playerId: null })}>
            <Lsi import={importLsi} path={[...LSI_PATH, "addSubstitute"]} />
          </Uu5Elements.Button>
        }
      />

      <Uu5Elements.Text category="interface" segment="content" type="small" significance="subdued">
        <Lsi import={importLsi} path={[...LSI_PATH, "lineupHint"]} />
      </Uu5Elements.Text>

      {target ? (
        <LineupPlayerModal
          header={
            isSub ? (
              <Lsi import={importLsi} path={[...LSI_PATH, target.playerId ? "editSubstitute" : "addSubstitute"]} />
            ) : (
              (positionLsi[target.positionDetail] ?? target.positionDetail)
            )
          }
          isSub={isSub}
          initialValue={
            current
              ? { ...current, positionDetail: isSub ? current.positionDetail : target.positionDetail }
              : { positionDetail: isSub ? undefined : target.positionDetail }
          }
          playerItemList={playerItemList}
          entryOf={entryOf}
          removeLsi={current ? [...LSI_PATH, isSub ? "removeSubstitute" : "clearPosition"] : null}
          onApply={(draft) => {
            onChange(applyDraft(lineup, target, draft));
            setTarget(null);
          }}
          onRemove={() => {
            onChange(clearTarget(lineup, target));
            setTarget(null);
          }}
          onClose={() => setTarget(null)}
        />
      ) : null}
    </div>
  );
}

export { LineupEditor };
export default LineupEditor;
