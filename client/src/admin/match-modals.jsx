import { createVisualComponent, useDataObject, useState, useMemo, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { enumItemList, personLabel } from "./fields.jsx";

const { theme } = Config;

const LSI_PATH = ["admin", "matches"];

// Dva modaly nad zápasem: **výsledek** a **sestava**. Obojí je vlastní use case
// (`match/setResult`, `match/setLineup`), ne `match/update` — a to schválně:
//
// - `setResult` hlídá, že rozstřel dává smysl jen u remízy a že vítěz je jeden ze dvou
//   týmů; kdyby to byl obyčejný update, dala by se tabulka rozbít vyplněním formuláře,
// - `setLineup` pouští editora jednoho týmu jen k hráčům jeho týmu, i když zápas má dva.
//
// Formulář výsledku odpovídá v0 `editZapas.php`, jen bez ručního psaní loginů.

/**
 * @param onSubmit  volitelný zapisovač — dostane hotový dtoIn místo toho, aby se volal
 *                  `match/setResult` napřímo. Je to kvůli `useDataList`: když zápis projde
 *                  **položkovým handlerem** seznamu, seznam si položku aktualizuje sám tím,
 *                  co server vrátil, a nemusí se přenačítat celý (viz `components/match-tile.jsx`).
 *                  Bez něj se volá use case přímo — pro obrazovky, které seznam nedrží.
 */
function ResultModal({ match, onClose, onSaved, onSubmit }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState();

  const teamItemList = [
    { value: match.homeTeamId, children: match.homeTeam?.name ?? match.homeTeamId },
    { value: match.guestTeamId, children: match.guestTeam?.name ?? match.guestTeamId },
  ];

  async function submit(e) {
    const v = e.data.value;
    setPending(true);
    setError();
    try {
      const dtoIn = {
        id: match.id,
        homeGoals: v.homeGoals,
        guestGoals: v.guestGoals,
        homeGoalsHalf: v.homeGoalsHalf ?? null,
        guestGoalsHalf: v.guestGoalsHalf ?? null,
        penaltyWinnerTeamId: v.penaltyWinnerTeamId ?? null,
      };
      if (onSubmit) await onSubmit(dtoIn);
      else await UiElements.Call.cmdPost("/match/setResult", dtoIn);
      onSaved?.();
      onClose();
    } catch (err) {
      // Server odmítne rozstřel u neremízy — hláška patří k formuláři, ne do konzole.
      setError(err?.message ?? String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Uu5Forms.Form.Provider
      onSubmit={submit}
      initialValue={{
        homeGoals: match.homeGoals ?? undefined,
        guestGoals: match.guestGoals ?? undefined,
        homeGoalsHalf: match.homeGoalsHalf ?? undefined,
        guestGoalsHalf: match.guestGoalsHalf ?? undefined,
        penaltyWinnerTeamId: match.penaltyWinnerTeamId ?? undefined,
      }}
    >
      <Uu5Elements.Modal
        open
        onClose={onClose}
        header={<Lsi import={importLsi} path={[...LSI_PATH, "resultHeader"]} />}
        footer={
          <div className={Config.Css.css({ display: "flex", gap: 8, justifyContent: "end" })}>
            <Uu5Forms.CancelButton onClick={onClose} disabled={pending} />
            <Uu5Forms.SubmitButton icon="uugds-check" disabled={pending} />
          </div>
        }
      >
        <Uu5Forms.Form.View>
          <Uu5Elements.Grid rowGap={12}>
            <div className={Config.Css.css({ ...theme.typography.display, fontSize: 18 })}>
              {(match.homeTeam?.name ?? "?") + " – " + (match.guestTeam?.name ?? "?")}
            </div>

            <Uu5Elements.Grid templateColumns="1fr 1fr" rowGap={12} columnGap={12}>
              <Uu5Forms.FormNumber name="homeGoals" label={<Lsi import={importLsi} path={[...LSI_PATH, "homeGoals"]} />} min={0} step={1} required />
              <Uu5Forms.FormNumber name="guestGoals" label={<Lsi import={importLsi} path={[...LSI_PATH, "guestGoals"]} />} min={0} step={1} required />
              <Uu5Forms.FormNumber name="homeGoalsHalf" label={<Lsi import={importLsi} path={[...LSI_PATH, "homeGoalsHalf"]} />} min={0} step={1} />
              <Uu5Forms.FormNumber name="guestGoalsHalf" label={<Lsi import={importLsi} path={[...LSI_PATH, "guestGoalsHalf"]} />} min={0} step={1} />
            </Uu5Elements.Grid>

            <Uu5Forms.FormSelect
              name="penaltyWinnerTeamId"
              label={<Lsi import={importLsi} path={[...LSI_PATH, "penaltyWinner"]} />}
              itemList={teamItemList}
            />

            {error ? (
              <Uu5Elements.Text
                category="interface"
                segment="content"
                type="medium"
                className={Config.Css.css({ color: theme.color.destructive })}
              >
                {error}
              </Uu5Elements.Text>
            ) : null}
          </Uu5Elements.Grid>
        </Uu5Forms.Form.View>
      </Uu5Elements.Modal>
    </Uu5Forms.Form.Provider>
  );
}

// Sloupce sestavy drží hlavička i řádky — jeden zdroj, aby se nemohly rozejít.
const LINEUP_COLUMNS = "minmax(140px, 2fr) 110px 90px 70px 70px 70px";

/** Řádek sestavy — jeden hráč a co v zápase udělal. */
function LineupRow({ player, entry, onChange }) {
  const set = (patch) => onChange({ ...entry, ...patch });

  return (
    <>
    <Uu5Elements.Grid
      templateColumns={LINEUP_COLUMNS}
      columnGap={8}
      alignItems="center"
      className={Config.Css.css({ paddingBlock: 4 })}
    >
      <div>
        {player.person ? personLabel(player.person) : `#${player.number ?? "?"}`}
        {player.number ? <span className={Config.Css.css({ color: theme.color.mutedFg })}> · {player.number}</span> : null}
      </div>

      <Uu5Forms.Select
        value={entry?.position ?? player.position ?? undefined}
        itemList={enumItemList("position", Config.POSITION_LIST)}
        disabled={!entry}
        onChange={(e) => set({ position: e.data.value })}
      />

      <Uu5Forms.Number
        value={entry?.goals ?? 0}
        min={0}
        step={1}
        disabled={!entry}
        onChange={(e) => set({ goals: e.data.value })}
      />

      <Uu5Forms.Checkbox value={!!entry} onChange={(e) => onChange(e.data.value ? { playerId: player.id, position: player.position, goals: 0 } : null)} />
      <Uu5Forms.Checkbox value={!!entry?.substitute} disabled={!entry} onChange={(e) => set({ substitute: e.data.value })} />
      <div className={Config.Css.css({ display: "flex", gap: 4 })}>
        <Uu5Forms.Checkbox value={!!entry?.yellowCard} disabled={!entry} onChange={(e) => set({ yellowCard: e.data.value })} />
        <Uu5Forms.Checkbox value={!!entry?.redCard} disabled={!entry} onChange={(e) => set({ redCard: e.data.value })} />
      </div>
    </Uu5Elements.Grid>
    {/* Linka za řádkem, ne `borderBlockEnd` na mřížce — barvu i sílu dá GDS. Řádky jsou
        sourozenci v obyčejném `<div>`, takže `Line` mezi ně jde vložit bez obalu navíc. */}
    <Uu5Elements.Line significance="subdued" />
    </>
  );
}

/** `onSubmit` má stejný smysl jako u `ResultModal` výš — zápis přes položkový handler. */
function LineupModal({ match, onClose, onSaved, onSubmit }) {
  const [pending, setPending] = useState(false);
  const [playerList, setPlayerList] = useState(() => match.playerList ?? []);

  // Nabídnou se hráči **obou** týmů: sestavu zapisuje jeden člověk pro celý zápas
  // a u přáteláků hrají za oba i lidé z klubu.
  const { state, data } = useDataObject(
    {
      handlerMap: {
        load: async () => {
          const lists = await Promise.all(
            [match.homeTeamId, match.guestTeamId].filter(Boolean).map((teamId) =>
              UiElements.Call.cmdGet("/player/list", { teamId, active: "true" }).catch(() => ({ itemList: [] })),
            ),
          );
          const byId = new Map();
          for (const list of lists) for (const player of list.itemList ?? []) byId.set(player.id, player);
          return { itemList: [...byId.values()] };
        },
      },
    },
    [match.id],
  );

  const players = useMemo(() => data?.itemList ?? [], [data]);
  const entryOf = (playerId) => playerList.find((p) => p.playerId === playerId) ?? null;

  function change(playerId, entry) {
    setPlayerList((list) => {
      const rest = list.filter((p) => p.playerId !== playerId);
      return entry ? [...rest, { ...entry, playerId }] : rest;
    });
  }

  async function save() {
    setPending(true);
    try {
      const dtoIn = { id: match.id, playerList };
      if (onSubmit) await onSubmit(dtoIn);
      else await UiElements.Call.cmdPost("/match/setLineup", dtoIn);
      onSaved?.();
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Uu5Elements.Modal
      open
      onClose={onClose}
      header={<Lsi import={importLsi} path={[...LSI_PATH, "lineupHeader"]} />}
      footer={
        <div className={Config.Css.css({ display: "flex", gap: 8, justifyContent: "end" })}>
          <Uu5Elements.Button onClick={onClose} disabled={pending}>
            <Lsi import={importLsi} path={[...LSI_PATH, "cancel"]} />
          </Uu5Elements.Button>
          <Uu5Elements.Button colorScheme="primary" significance="highlighted" onClick={save} disabled={pending}>
            <Lsi import={importLsi} path={[...LSI_PATH, "save"]} />
          </Uu5Elements.Button>
        </div>
      }
    >
      {state === "pendingNoData" ? (
        <Uu5Elements.Skeleton height={240} />
      ) : (
        <div>
          <Uu5Elements.Grid
            templateColumns={LINEUP_COLUMNS}
            columnGap={8}
            className={Config.Css.css({ color: theme.color.mutedFg, paddingBlockEnd: 4 })}
          >
            <span><Lsi import={importLsi} path={[...LSI_PATH, "player"]} /></span>
            <span><Lsi import={importLsi} path={[...LSI_PATH, "position"]} /></span>
            <span><Lsi import={importLsi} path={[...LSI_PATH, "goals"]} /></span>
            <span><Lsi import={importLsi} path={[...LSI_PATH, "played"]} /></span>
            <span><Lsi import={importLsi} path={[...LSI_PATH, "substitute"]} /></span>
            <span><Lsi import={importLsi} path={[...LSI_PATH, "cards"]} /></span>
          </Uu5Elements.Grid>

          {players.map((player) => (
            <LineupRow key={player.id} player={player} entry={entryOf(player.id)} onChange={(entry) => change(player.id, entry)} />
          ))}

          {players.length === 0 ? (
            <Uu5Elements.Text category="interface" segment="content" type="medium">
              <Lsi import={importLsi} path={[...LSI_PATH, "noPlayers"]} />
            </Uu5Elements.Text>
          ) : null}
        </div>
      )}
    </Uu5Elements.Modal>
  );
}

export { ResultModal, LineupModal };
