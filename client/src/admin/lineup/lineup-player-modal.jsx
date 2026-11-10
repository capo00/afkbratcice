import { useEffect, useRef, useMemo, useLsi, useScreenSize, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
import { CardIcon } from "../../components/lineup-pitch/lineup-pitch.jsx";

const LSI_PATH = ["admin", "matches"];

// Grid of the modal body, four columns (Caio 2026-11-10): player and post side by side,
// then goals over two columns and the two cards.
const WIDE_AREAS = `"player player post post" "goals goals yellow red"`;
const NARROW_AREAS = `"player player player player" "post post post post" "goals goals yellow red"`;
const CARD_CELL_CSS = (area) => Config.Css.css({ gridArea: area, alignSelf: "end", display: "flex", alignItems: "center", minBlockSize: 32 });

/**
 * Another player chosen: goals and cards follow that player -- his current entry in the
 * lineup, or nothing for a player who is not in it yet. Otherwise the numbers of whoever was
 * on the position would silently pass to the new one.
 */
function FollowPlayer({ entryOf }) {
  const { value, setItemValue } = Uu5Forms.useFormApi();
  const previousRef = useRef(value?.playerId);
  useEffect(() => {
    if (value?.playerId === previousRef.current) return;
    previousRef.current = value?.playerId;
    const entry = value?.playerId ? entryOf(value.playerId) : null;
    setItemValue("goals", entry?.goals ?? 0);
    setItemValue("yellowCard", Boolean(entry?.yellowCard));
    setItemValue("redCard", Boolean(entry?.redCard));
  }, [value?.playerId, entryOf, setItemValue]);
  return null;
}

/**
 * Who plays on a position, or who came on as a substitute, with goals and cards (variant C,
 * Caio 2026-11-10). "Apply" changes only the lineup being edited; the match modal saves it.
 *
 * @param isSub           a substitute: the position is optional
 * @param initialValue    `{ playerId, positionDetail, goals, yellowCard, redCard }`
 * @param playerItemList  roster players for the select (`{ value, children }`)
 * @param entryOf         (playerId) => the player's current lineup entry, or null
 * @param removeLsi       LSI path of the remove action; none = no remove action
 * @param onApply         (draft) => void
 */
function LineupPlayerModal({ header, isSub, initialValue, playerItemList, entryOf, removeLsi, onApply, onRemove, onClose }) {
  // TextSelect searches its items by text, so the post labels are strings, not `<Lsi>`.
  const positionLsi = useLsi(importLsi, ["enum", "lineupPosition"]);
  const pitchLsi = useLsi(importLsi, ["match", "pitch"]);
  const positionItemList = useMemo(
    () => Config.LINEUP_POSITION_LIST.map((code) => ({ value: code, children: positionLsi[code] ?? code })),
    [positionLsi],
  );
  // Player and post side by side from a tablet up; on a phone each takes its own row.
  const [screenSize] = useScreenSize();
  const wide = screenSize !== "xs";

  function submit(e) {
    const v = e.data.value;
    onApply({
      playerId: v.playerId ?? null,
      positionDetail: v.positionDetail || undefined,
      goals: Number.isFinite(v.goals) ? v.goals : 0,
      yellowCard: Boolean(v.yellowCard),
      redCard: Boolean(v.redCard),
    });
  }

  return (
    <Uu5Forms.Form.Provider
      onSubmit={submit}
      initialValue={{
        playerId: initialValue.playerId ?? undefined,
        positionDetail: initialValue.positionDetail ?? undefined,
        goals: initialValue.goals ?? 0,
        yellowCard: Boolean(initialValue.yellowCard),
        redCard: Boolean(initialValue.redCard),
      }}
    >
      <FollowPlayer entryOf={entryOf} />
      <Uu5Elements.Modal
        open
        onClose={onClose}
        header={header}
        footer={
          <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8 })}>
            {removeLsi ? (
              <Uu5Elements.Button colorScheme="negative" significance="subdued" icon="uugds-delete" onClick={onRemove}>
                <Lsi import={importLsi} path={removeLsi} />
              </Uu5Elements.Button>
            ) : null}
            <span className={Config.Css.css({ flex: 1 })} />
            <Uu5Forms.CancelButton onClick={onClose} />
            <Uu5Forms.SubmitButton icon="uugds-check">
              <Lsi import={importLsi} path={[...LSI_PATH, "apply"]} />
            </Uu5Forms.SubmitButton>
          </div>
        }
      >
        <div className={Config.Css.css({ display: "grid", gap: 16, gridTemplateAreas: wide ? WIDE_AREAS : NARROW_AREAS, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" })}>
          {/* Both are TextSelects: the roster has a dynamic number of players and there are more
              than ten posts (rule Caio 2026-11-10: a select that can have more than ten items
              searches). */}
          <Uu5Forms.FormTextSelect
            name="playerId"
            label={<Lsi import={importLsi} path={[...LSI_PATH, "player"]} />}
            itemList={playerItemList}
            required
            className={Config.Css.css({ gridArea: "player" })}
          />
          <Uu5Forms.FormTextSelect
            name="positionDetail"
            label={<Lsi import={importLsi} path={[...LSI_PATH, isSub ? "subPosition" : "position"]} />}
            itemList={positionItemList}
            required={!isSub}
            className={Config.Css.css({ gridArea: "post" })}
          />
          <Uu5Forms.FormNumber
            name="goals"
            label={<Lsi import={importLsi} path={[...LSI_PATH, "goals"]} />}
            min={0}
            step={1}
            className={Config.Css.css({ gridArea: "goals" })}
          />
          {/* Cards next to the goals with the card itself as the label, aligned to the bottom of
              the goals input (Caio 2026-11-10). */}
          <div className={CARD_CELL_CSS("yellow")}>
            <Uu5Forms.FormCheckbox name="yellowCard" view="toggle" label={<CardIcon color="yellow" label={pitchLsi.yellowCard} />} />
          </div>
          <div className={CARD_CELL_CSS("red")}>
            <Uu5Forms.FormCheckbox name="redCard" view="toggle" label={<CardIcon color="red" label={pitchLsi.redCard} />} />
          </div>
        </div>
      </Uu5Elements.Modal>
    </Uu5Forms.Form.Provider>
  );
}

export { LineupPlayerModal };
export default LineupPlayerModal;
