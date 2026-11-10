import { useEffect, useRef, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
import { enumItemList } from "../fields.jsx";

const LSI_PATH = ["admin", "matches"];

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
  const positionItemList = enumItemList("lineupPosition", Config.LINEUP_POSITION_LIST);

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
        <div className={Config.Css.css({ display: "grid", gap: 16 })}>
          <Uu5Forms.FormSelect
            name="playerId"
            label={<Lsi import={importLsi} path={[...LSI_PATH, "player"]} />}
            itemList={playerItemList}
            required
          />
          <Uu5Forms.FormSelect
            name="positionDetail"
            label={<Lsi import={importLsi} path={[...LSI_PATH, isSub ? "subPosition" : "position"]} />}
            itemList={positionItemList}
            required={!isSub}
          />
          <Uu5Forms.FormNumber
            name="goals"
            label={<Lsi import={importLsi} path={[...LSI_PATH, "goals"]} />}
            min={0}
            step={1}
          />
          <div className={Config.Css.css({ display: "flex", flexWrap: "wrap", gap: "8px 24px" })}>
            <Uu5Forms.FormCheckbox
              name="yellowCard"
              view="toggle"
              label={<Lsi import={importLsi} path={["match", "pitch", "yellowCard"]} />}
            />
            <Uu5Forms.FormCheckbox
              name="redCard"
              view="toggle"
              label={<Lsi import={importLsi} path={["match", "pitch", "redCard"]} />}
            />
          </div>
        </div>
      </Uu5Elements.Modal>
    </Uu5Forms.Form.Provider>
  );
}

export { LineupPlayerModal };
export default LineupPlayerModal;
