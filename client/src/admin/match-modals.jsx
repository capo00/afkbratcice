import { createVisualComponent, useDataObject, useState, useMemo, useRef, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements, UiAuth } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { enumItemList, personLabel } from "./fields.jsx";
import { getMatchConfig, MATCH_PAIR_LIST } from "./match-fields.jsx";
import { formGridLayout } from "./form-layout.js";

const { theme } = Config;

const LSI_PATH = ["admin", "matches"];

// Home and guest side by side even on a phone -- the score reads as one row. The penalty
// winner row is added only while the field is shown; a grid area without its field would
// leave an empty row behind.
const RESULT_GRID_LAYOUT = {
  xs: "homeGoals guestGoals, homeGoalsHalf guestGoalsHalf",
};
const RESULT_GRID_LAYOUT_WITH_PENALTY = {
  xs: RESULT_GRID_LAYOUT.xs + ", penaltyWinnerTeamId penaltyWinnerTeamId",
};

/**
 * Má smysl ptát se na vítěze rozstřelu? Jen v sezóně, která se na penalty hraje,
 * a u zadané remízy. Totéž hlídá server (`match/setResult`); tady jde o to, aby se pole
 * nenabízelo tam, kde by ho server odmítl.
 */
function showsPenaltyWinner(hasPenalties, value) {
  return (
    Boolean(hasPenalties) &&
    Number.isFinite(value?.homeGoals) &&
    Number.isFinite(value?.guestGoals) &&
    value.homeGoals === value.guestGoals
  );
}

// Pole zápasu v rozbalovací sekci modalu výsledku, v pořadí formuláře administrace. Bez
// skóre (to je nahoře) -- a týmy jen pro správce zápasů: editorovi týmu by je server
// stejně zahodil (`match/crud.js`, `update`), takže by je měnil naprázdno.
const UPDATE_FIELD_LIST = ["time", "homeTeamId", "guestTeamId", "seasonId", "round", "place", "departureTime", "state", "note"];
const TEAM_FIELD_LIST = ["homeTeamId", "guestTeamId"];

function pickConfig(cfg, nameList) {
  return Object.fromEntries(nameList.filter((name) => cfg[name]).map((name) => [name, cfg[name]]));
}

/**
 * Hraje se v sezóně na penalty? `season/get` je veřejný; zápas bez sezóny je přátelák
 * a penalty nemá. Dokud se sezóna načítá, pole vítěze se nenabízí.
 */
function useHasPenalties(seasonId) {
  const { data: season } = useDataObject(
    {
      handlerMap: {
        load: () =>
          seasonId ? UiElements.Call.cmdGet("/season/get", { id: seasonId }).catch(() => null) : Promise.resolve(null),
      },
    },
    [seasonId],
  );
  return Boolean(season?.hasPenalties);
}

/**
 * Je potřeba zapsat výsledek? Bez rozbalené sekce vždycky -- k tomu modal je. S ní jde upravit
 * jen zápas (přesunout termín zápasu, který se ještě nehrál), dokud nemá výsledek uložený
 * a nezačal se vyplňovat: `match/setResult` skóre bez gólů nebere.
 */
function needsResult(expanded, match, value) {
  return (
    !expanded ||
    Number.isFinite(match.homeGoals) ||
    Number.isFinite(value?.homeGoals) ||
    Number.isFinite(value?.guestGoals)
  );
}

/**
 * Pole formuláře výsledku. Je to vlastní komponenta jen kvůli `useFormApi`: ten musí sedět
 * pod `Form.Provider`, a vítěz rozstřelu se ukazuje živě podle toho, co je zrovna vyplněné --
 * i podle sezóny, kterou může změnit rozbalovací sekce. Co platí, předává `hasPenaltiesRef`
 * zápisu v `ResultModal`, který sedí nad formulářem.
 */
function ResultFields({ teamItemList, hasPenaltiesRef, scoreRequired }) {
  const { value } = Uu5Forms.useFormApi();
  const hasPenalties = useHasPenalties(value?.seasonId ?? null);
  hasPenaltiesRef.current = hasPenalties;
  const withPenalty = showsPenaltyWinner(hasPenalties, value);
  const required = scoreRequired(value);

  return (
    <Uu5Forms.Form.View gridLayout={withPenalty ? RESULT_GRID_LAYOUT_WITH_PENALTY : RESULT_GRID_LAYOUT}>
      <Uu5Forms.FormNumber name="homeGoals" label={<Lsi import={importLsi} path={[...LSI_PATH, "homeGoals"]} />} min={0} step={1} required={required} />
      <Uu5Forms.FormNumber name="guestGoals" label={<Lsi import={importLsi} path={[...LSI_PATH, "guestGoals"]} />} min={0} step={1} required={required} />
      <Uu5Forms.FormNumber name="homeGoalsHalf" label={<Lsi import={importLsi} path={[...LSI_PATH, "homeGoalsHalf"]} />} min={0} step={1} />
      <Uu5Forms.FormNumber name="guestGoalsHalf" label={<Lsi import={importLsi} path={[...LSI_PATH, "guestGoalsHalf"]} />} min={0} step={1} />
      {withPenalty ? (
        <Uu5Forms.FormSelect
          name="penaltyWinnerTeamId"
          label={<Lsi import={importLsi} path={[...LSI_PATH, "penaltyWinner"]} />}
          itemList={teamItemList}
        />
      ) : null}
    </Uu5Forms.Form.View>
  );
}

/**
 * Zbytek editace zápasu pod odkazem „Další úpravy zápasu“. Pole se vykreslí až po rozbalení:
 * výběry týmů a sezón se tak nenačítají zbytečně a skryté povinné pole neblokuje uložení.
 */
function UpdateSection({ cfg }) {
  const autoFocusRef = UiElements.useAutoFocus();
  return (
    <div ref={autoFocusRef} className={Config.Css.css({ marginBlockStart: 16 })}>
      <Uu5Forms.Form.View gridLayout={formGridLayout(cfg, MATCH_PAIR_LIST)}>
        {UiElements.Crud.generateInputs(cfg, { operation: "update" })}
      </Uu5Forms.Form.View>
    </div>
  );
}

// Dva modaly nad zápasem: **výsledek** a **sestava**. Obojí je vlastní use case
// (`match/setResult`, `match/setLineup`), ne `match/update` — a to schválně:
//
// - `setResult` hlídá, že rozstřel dává smysl jen u remízy a že vítěz je jeden ze dvou
//   týmů; kdyby to byl obyčejný update, dala by se tabulka rozbít vyplněním formuláře,
// - `setLineup` pouští editora jednoho týmu jen k hráčům jeho týmu, i když zápas má dva.
//
// Formulář výsledku odpovídá v0 `editZapas.php`, jen bez ručního psaní loginů.
//
// Kdo smí i `match/update`, dostane v modalu výsledku rozbalovací sekci se zbytkem zápasu
// (termín, sezóna, kolo, hřiště, odjezd, stav, poznámka). Uloží se jedním tlačítkem, ale pořád
// dvěma use casy za sebou: nejdřív `update` se změněnými poli, pak `setResult` -- v tomhle
// pořadí, protože změna sezóny mění `hasPenalties`, podle kterého server rozstřel kontroluje.
// Zápas, který ještě nemá výsledek, jde po rozbalení uložit i bez skóre -- pak jen `update`.

/**
 * @param onSubmit  volitelný zapisovač — dostane hotový dtoIn místo toho, aby se volal
 *                  `match/setResult` napřímo. Je to kvůli `useDataList`: když zápis projde
 *                  **položkovým handlerem** seznamu, seznam si položku aktualizuje sám tím,
 *                  co server vrátil, a nemusí se přenačítat celý (viz `components/match-tile.jsx`).
 *                  Bez něj se volá use case přímo — pro obrazovky, které seznam nedrží.
 * @param onSaved   dostane zápas, jak ho vrátil zápis (`onSubmit` nebo `match/setResult`).
 * @param canUpdate smí přihlášený i `match/update` -- pak modal nabídne rozbalovací sekci
 *                  se zbytkem zápasu.
 * @param onUpdate  volitelný zapisovač `match/update` -- totéž co `onSubmit`, jen pro úpravu
 *                  zápasu (položkový handler `update` seznamu).
 */
function ResultModal({ match, onClose, onSaved, onSubmit, canUpdate = false, onUpdate }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState();
  const [expanded, setExpanded] = useState(false);
  const hasPenaltiesRef = useRef(false);
  const autoFocusRef = UiElements.useAutoFocus();
  const session = UiAuth.useSession();
  const matchManager = UiAuth.hasProfile(session.identity, Config.MATCH);
  const updateFieldList = useMemo(
    () => (matchManager ? UPDATE_FIELD_LIST : UPDATE_FIELD_LIST.filter((name) => !TEAM_FIELD_LIST.includes(name))),
    [matchManager],
  );
  // Názvy týmů jen pro sloupce; filtry sekce nepotřebuje.
  const updateCfg = useMemo(() => pickConfig(getMatchConfig({ getTeam: () => undefined }), updateFieldList), [updateFieldList]);

  // Proti čemu se počítá, co rozbalovací sekce změnila. Po úspěšném `update` se posune:
  // když pak selže `setResult`, další Uložit už úpravu zápasu neposílá znovu.
  const savedRef = useRef();
  if (!savedRef.current) {
    savedRef.current = Object.fromEntries(UPDATE_FIELD_LIST.map((name) => [name, match[name] ?? undefined]));
  }

  const teamItemList = [
    { value: match.homeTeamId, children: match.homeTeam?.name ?? match.homeTeamId },
    { value: match.guestTeamId, children: match.guestTeam?.name ?? match.guestTeamId },
  ];

  async function submit(e) {
    const v = e.data.value;
    const hasPenalties = hasPenaltiesRef.current;
    setPending(true);
    setError();
    try {
      let saved;
      if (expanded) {
        // Jen změněná pole, prázdné jako `null` -- stejné porovnání jako `Crud` (caio-ui).
        const changed = {};
        for (const name of updateFieldList) {
          if ((v[name] ?? undefined) !== savedRef.current[name]) changed[name] = v[name] ?? null;
        }
        if (Object.keys(changed).length) {
          const updateDtoIn = { id: match.id, ...changed };
          saved = onUpdate ? await onUpdate(updateDtoIn) : await UiElements.Call.cmdPost("/match/update", updateDtoIn);
          savedRef.current = { ...savedRef.current, ...changed };
        }
      }
      if (needsResult(expanded, match, v)) {
        const dtoIn = {
          id: match.id,
          homeGoals: v.homeGoals,
          guestGoals: v.guestGoals,
          homeGoalsHalf: v.homeGoalsHalf ?? null,
          guestGoalsHalf: v.guestGoalsHalf ?? null,
          // Jen když se pole ukazuje; jinak `null`, i kdyby zápas měl vítěze uloženého
          // z dřívějška (remíza se mezitím změnila na výhru, nebo sezóna penalty nehraje).
          penaltyWinnerTeamId: showsPenaltyWinner(hasPenalties, v) ? (v.penaltyWinnerTeamId ?? null) : null,
        };
        saved = onSubmit ? await onSubmit(dtoIn) : await UiElements.Call.cmdPost("/match/setResult", dtoIn);
      }
      if (saved) onSaved?.(saved);
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
        // Pole rozbalovací sekce; `seasonId` čte i `ResultFields` kvůli penaltám.
        ...savedRef.current,
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
        {/* The match name and the error sit outside `Form.View`: the grid places only named
            fields into `gridLayout` areas, anything else would be auto-placed outside it. */}
        <div ref={autoFocusRef}>
          <div className={Config.Css.css({ ...theme.typography.display, fontSize: 18, marginBlockEnd: 16 })}>
            {(match.homeTeam?.name ?? "?") + " – " + (match.guestTeam?.name ?? "?")}
          </div>

          <ResultFields
            teamItemList={teamItemList}
            hasPenaltiesRef={hasPenaltiesRef}
            scoreRequired={(value) => needsResult(expanded, match, value)}
          />

          {canUpdate ? (
            <Uu5Elements.Link
              colorScheme="primary"
              onClick={() => setExpanded((open) => !open)}
              className={Config.Css.css({ display: "inline-flex", alignItems: "center", gap: 4, marginBlockStart: 16 })}
            >
              <Uu5Elements.Icon icon={expanded ? "uugds-chevron-up" : "uugds-chevron-down"} />
              <Lsi import={importLsi} path={[...LSI_PATH, expanded ? "lessEdit" : "moreEdit"]} />
            </Uu5Elements.Link>
          ) : null}

          {canUpdate && expanded ? <UpdateSection cfg={updateCfg} /> : null}

          {error ? (
            <Uu5Elements.Text
              category="interface"
              segment="content"
              type="medium"
              colorScheme="negative"
              className={Config.Css.css({ display: "block", marginBlockStart: 16 })}
            >
              {error}
            </Uu5Elements.Text>
          ) : null}
        </div>
      </Uu5Elements.Modal>
    </Uu5Forms.Form.Provider>
  );
}

// Sloupce sestavy drží hlavička i řádky — jeden zdroj, aby se nemohly rozejít.
const LINEUP_COLUMNS = "minmax(140px, 2fr) 220px 90px 70px 70px 70px";

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
        {player.person ? personLabel(player.person) : "?"}
      </div>

      {/* Přesný post (28 postů, Caio 2026-10-26); linii `position` dopočítá server. Starý
          zápis bez přesného postu ukáže prázdný výběr. */}
      <Uu5Forms.Select
        value={entry?.positionDetail ?? undefined}
        itemList={enumItemList("lineupPosition", Config.LINEUP_POSITION_LIST)}
        disabled={!entry}
        onChange={(e) => set({ positionDetail: e.data.value, position: Config.LINEUP_POSITION_MAP[e.data.value] })}
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
  // Na seznamu hráčů, ne na modalu: ten se kreslí až po načtení, do té doby je tam skeleton.
  // Fokus dostane „Hrál“ prvního hráče -- post je bez zaškrtnutí zakázaný.
  const autoFocusRef = UiElements.useAutoFocus();

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
        <div ref={autoFocusRef}>
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
