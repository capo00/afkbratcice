import { useDataObject, useState, useMemo, useRef, useEffect, useCallback, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements, UiAuth } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { getMatchConfig, matchFormConfig, MATCH_FORM_FIELD_LIST, MATCH_PAIR_LIST } from "./match-fields.jsx";
import { formGridLayout } from "./form-layout.js";
import LineupEditor from "./lineup/lineup-editor.jsx";
import { toEditorState, toPlayerList, fromPreviousMatch, lineupKey, playerCount } from "./lineup/lineup-state.js";

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

// Pole zápasu na záložce Info, v pořadí formuláře nového zápasu (`MATCH_FORM_FIELD_LIST`).
// Bez skóre (to je na záložce Výsledek) -- a týmy jen pro správce zápasů: editorovi týmu by je
// server stejně zahodil (`match/crud.js`, `update`), takže by je měnil naprázdno.
const UPDATE_FIELD_LIST = MATCH_FORM_FIELD_LIST;
const TEAM_FIELD_LIST = ["homeTeamId", "guestTeamId"];
const RESULT_FIELD_LIST = ["homeGoals", "guestGoals", "homeGoalsHalf", "guestGoalsHalf", "penaltyWinnerTeamId"];

// Which tab a form field lives on -- an invalid field on a hidden tab switches to it.
const FIELD_TAB = {
  ...Object.fromEntries(UPDATE_FIELD_LIST.map((name) => [name, "info"])),
  ...Object.fromEntries(RESULT_FIELD_LIST.map((name) => [name, "result"])),
};

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
 * Is the score required? Only once the match has a result saved or one is being typed:
 * `match/setResult` takes no score without goals. Otherwise the modal saves the rest alone --
 * a new kick-off of a match not played yet, or a lineup without a result.
 */
function needsResult(match, value) {
  return Number.isFinite(match.homeGoals) || Number.isFinite(value?.homeGoals) || Number.isFinite(value?.guestGoals);
}

/**
 * The result fields as they are -- compared with the last saved ones, so an unchanged result is
 * not sent again. Raw values on purpose, not filtered by `hasPenalties`: the season loads
 * asynchronously (or fails to), and a lineup-only save must not erase a stored shootout winner
 * just because the season had not answered yet (review 2026-11-10).
 */
function resultKey(value) {
  return JSON.stringify([
    value.homeGoals ?? null,
    value.guestGoals ?? null,
    value.homeGoalsHalf ?? null,
    value.guestGoalsHalf ?? null,
    value.penaltyWinnerTeamId ?? null,
  ]);
}

/**
 * Pole formuláře výsledku. Je to vlastní komponenta jen kvůli `useFormApi`: ten musí sedět
 * pod `Form.Provider`, a vítěz rozstřelu se ukazuje živě podle toho, co je zrovna vyplněné --
 * i podle sezóny, kterou může změnit záložka Info. Co platí, předává `hasPenaltiesRef`
 * zápisu v `MatchModal`, který sedí nad formulářem.
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

/** The Info tab: the rest of the match, the same fields as the admin form. */
function InfoFields({ cfg }) {
  return (
    <Uu5Forms.Form.View gridLayout={formGridLayout(cfg, MATCH_PAIR_LIST)}>
      {UiElements.Crud.generateInputs(cfg, { operation: "update" })}
    </Uu5Forms.Form.View>
  );
}

/**
 * Invalid fields on hidden tabs. uu5 disables Save as soon as a field is invalid, so a user on
 * another tab would see a dead button and no reason: `onInvalidChange` gets the tabs with an
 * invalid field (their label gets a warning icon). And Save pressed while validation fails only
 * on submit (a required field never touched): that tab is shown. `attemptRef` holds when Save
 * was pressed -- validation answers a moment later, and an error that appears while typing
 * must not switch tabs.
 */
function InvalidTabs({ attemptRef, onTab, onInvalidChange }) {
  const { itemMap } = Uu5Forms.useFormApi();
  const invalidKey = [
    ...new Set(Object.keys(FIELD_TAB).filter((field) => itemMap?.[field] && itemMap[field].valid === false).map((field) => FIELD_TAB[field])),
  ].join(",");
  useEffect(() => {
    onInvalidChange(invalidKey);
  }, [invalidKey, onInvalidChange]);
  useEffect(() => {
    if (!attemptRef.current || Date.now() - attemptRef.current > 3000) return;
    const name = Object.keys(FIELD_TAB).find((field) => itemMap?.[field] && itemMap[field].valid === false);
    if (name) {
      attemptRef.current = 0;
      onTab(FIELD_TAB[name]);
    }
  }, [itemMap, attemptRef, onTab]);
  return null;
}

/**
 * Roster of the edited team on the match day and the match's current lineup. `match/get`
 * rather than `match.playerList`: a list on the home page keeps the match as it was loaded,
 * and editing an old lineup would overwrite a newer one.
 */
function useLineupData(match, teamId) {
  const { state, data } = useDataObject(
    {
      handlerMap: {
        load: async () => {
          if (!teamId) return null;
          const day = match.time ? String(match.time).slice(0, 10) : undefined;
          const [roster, fresh] = await Promise.all([
            UiElements.Call.cmdGet("/player/list", { teamId, ...(day ? { date: day } : null) }).catch(() => ({ itemList: [] })),
            UiElements.Call.cmdGet("/match/get", { id: match.id }).catch(() => null),
          ]);
          // Without the current lineup the tab is not offered: editing the copy a list holds could
          // overwrite a newer lineup (review 2026-11-10).
          if (!fresh) return null;
          return { players: roster?.itemList ?? [], playerList: fresh.playerList ?? [] };
        },
      },
    },
    [match.id, teamId],
  );
  return { pending: state === "pendingNoData", data };
}

// Jeden modal nad zápasem, na webu (tužka u dlaždice) i v administraci (Caio 2026-11-10).
// Záložky:
//
// - **Info** -- termín, týmy, sezóna, kolo, hřiště, odjezd, stav, poznámka (`match/update`),
//   jen pro toho, kdo smí `match/update`,
// - **Výsledek** -- skóre, poločas, vítěz rozstřelu (`match/setResult`),
// - **Sestava** -- hřiště s výchozím rozestavením (`match/setLineup`), jen u vlastního týmu,
//   který přihlášený smí editovat a který má k datu zápasu soupisku (Caio 2026-11-10).
//
// Každá část je vlastní use case, ne `match/update` -- a to schválně: `setResult` hlídá
// rozstřel (tabulka), `setLineup` pouští editora jednoho týmu jen k hráčům jeho týmu.
//
// Uloží se jedním tlačítkem, use casy jdou za sebou: `update` (změněná pole) → `setResult`
// (jen změněný výsledek; po `update`, protože změna sezóny mění `hasPenalties`) → `setLineup`
// (jen změněná sestava; po výsledku, server porovnává góly se skóre). Když jeden selže, modal
// zůstane otevřený a další Uložit pošle jen to, co ještě neprošlo.
//
// Všechny záložky zůstávají vykreslené, neaktivní jsou jen schované: formulář tak nepřijde
// o hodnoty polí, která zrovna nejsou vidět. Info se poprvé vykreslí až při první návštěvě
// (výběry týmů a sezón se jinak načítají zbytečně); hodnoty jeho polí jsou ve formuláři
// z `initialValue` i bez nich.

/**
 * @param match           zápas; `homeTeam`/`guestTeam` kvůli názvům
 * @param initialTabCode  "info" | "result" | "lineup"; bez něj Info (administrace), web posílá "result".
 *                        Záložka, která není k dispozici, ustoupí první dostupné.
 * @param canUpdate       smí přihlášený i `match/update` -- pak je tu záložka Info
 * @param lineupTeamId    vlastní tým, jehož sestavu přihlášený smí zapsat (match-tile.jsx,
 *                        `lineupTeamIdFor`); záložka Sestava jen s neprázdnou soupiskou
 * @param onSubmit        volitelný zapisovač `match/setResult` -- položkový handler `useDataList`,
 *                        seznam si pak položku aktualizuje sám. Bez něj se volá use case.
 * @param onUpdate        totéž pro `match/update`
 * @param onLineupSubmit  totéž pro `match/setLineup`
 * @param onSaved         (match, { lineupSaved }) po uložení; `match` je poslední, co vrátil server,
 *                        sloučené se vstupem (zápisy vrací holý zápas)
 */
function MatchModal({
  match,
  onClose,
  onSaved,
  onSubmit,
  onUpdate,
  onLineupSubmit,
  canUpdate = false,
  lineupTeamId,
  initialTabCode,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState();
  const [tabCode, setTabCode] = useState(initialTabCode ?? "info");
  const [visited, setVisited] = useState(() => new Set([initialTabCode ?? "info"]));
  const hasPenaltiesRef = useRef(false);
  const submitAttemptRef = useRef(0);
  const autoFocusRef = UiElements.useAutoFocus();
  const session = UiAuth.useSession();
  const matchManager = UiAuth.hasProfile(session.identity, Config.MATCH);

  const updateFieldList = useMemo(
    () => (matchManager ? UPDATE_FIELD_LIST : UPDATE_FIELD_LIST.filter((name) => !TEAM_FIELD_LIST.includes(name))),
    [matchManager],
  );
  // Názvy týmů jen pro sloupce; filtry záložka nepotřebuje.
  const updateCfg = useMemo(() => matchFormConfig(getMatchConfig({ getTeam: () => undefined }), updateFieldList), [updateFieldList]);

  // Proti čemu se počítá, co se změnilo. Po úspěšném zápisu se posune: když selže další krok,
  // druhé Uložit už to, co prošlo, neposílá znovu.
  const savedRef = useRef();
  if (!savedRef.current) {
    savedRef.current = Object.fromEntries(UPDATE_FIELD_LIST.map((name) => [name, match[name] ?? undefined]));
  }
  const savedResultRef = useRef();
  if (savedResultRef.current === undefined) {
    savedResultRef.current = resultKey(match);
  }

  // --- Sestava ---
  const { pending: lineupPending, data: lineupData } = useLineupData(match, lineupTeamId);
  const players = useMemo(() => lineupData?.players ?? [], [lineupData]);
  const rosterIdSet = useMemo(() => new Set(players.map((p) => p.id)), [players]);
  const isOwn = useCallback((playerId) => rosterIdSet.has(playerId), [rosterIdSet]);
  const initialLineup = useMemo(
    () => (lineupData && players.length ? toEditorState(lineupData.playerList, isOwn, Config.LINEUP_POSITION_MAP) : null),
    [lineupData, players, isOwn],
  );
  // Edits and the saved key belong to one team: should `lineupTeamId` change while the modal is
  // open (the session or the team map arriving late), they start over with the new team.
  const [edited, setEdited] = useState(null);
  // `edited &&` first: a match without our team has no `lineupTeamId`, and `undefined === undefined`
  // would read the lineup of a `null`.
  const lineup = edited && edited.teamId === lineupTeamId ? edited.lineup : initialLineup;
  const setEditedLineup = useCallback((next) => setEdited({ teamId: lineupTeamId, lineup: next }), [lineupTeamId]);
  const savedLineupKeyRef = useRef(null);
  if (initialLineup && savedLineupKeyRef.current?.teamId !== lineupTeamId) {
    savedLineupKeyRef.current = { teamId: lineupTeamId, key: lineupKey(initialLineup) };
  }
  const ownSide = lineupTeamId === match.homeTeamId ? "home" : "guest";

  async function loadPrevious() {
    const { itemList = [] } = await UiElements.Call.cmdGet("/match/list", {
      teamId: lineupTeamId,
      state: "played",
      order: "desc",
      ...(match.time ? { dateTo: match.time } : null),
      pageInfo: { pageSize: 10 },
    });
    const previous = itemList.find((m) => m.id !== match.id && (m.playerList ?? []).some((e) => isOwn(e.playerId)));
    return previous ? fromPreviousMatch(lineup, previous.playerList, isOwn, Config.LINEUP_POSITION_MAP) : null;
  }

  // --- Záložky ---
  const [invalidTabs, setInvalidTabs] = useState("");
  const tabLabel = (code, lsiKey) => (
    <span className={Config.Css.css({ display: "inline-flex", alignItems: "center", gap: 4 })}>
      <Lsi import={importLsi} path={[...LSI_PATH, lsiKey]} />
      {invalidTabs.split(",").includes(code) ? <Uu5Elements.Icon icon="uugds-alert-circle" colorScheme="negative" /> : null}
    </span>
  );
  const tabList = [
    canUpdate ? { code: "info", label: tabLabel("info", "tabInfo") } : null,
    { code: "result", label: tabLabel("result", "tabResult") },
    lineup
      ? {
          code: "lineup",
          label: playerCount(lineup) ? (
            <Lsi import={importLsi} path={[...LSI_PATH, "tabLineupCount"]} params={{ count: playerCount(lineup) }} />
          ) : (
            <Lsi import={importLsi} path={[...LSI_PATH, "tabLineup"]} />
          ),
        }
      : null,
  ].filter(Boolean);
  // The requested tab may not exist (no Info for a team editor, no roster for the lineup) or
  // not yet (the lineup loads): until then the first available one. Once the lineup arrives,
  // a requested Lineup tab opens by itself.
  const activeTab = tabList.some((tab) => tab.code === tabCode) ? tabCode : tabList[0].code;
  const initialTabRef = useRef(activeTab);

  const showTab = useCallback((code) => {
    setTabCode(code);
    setVisited((set) => (set.has(code) ? set : new Set([...set, code])));
  }, []);

  const teamItemList = [
    { value: match.homeTeamId, children: match.homeTeam?.name ?? match.homeTeamId },
    { value: match.guestTeamId, children: match.guestTeam?.name ?? match.guestTeamId },
  ];

  async function submit(e) {
    const v = e.data.value;
    const hasPenalties = hasPenaltiesRef.current;
    setPending(true);
    setError();
    let saved = null;
    let lineupSaved = false;
    try {
      if (canUpdate) {
        // Jen změněná pole, prázdné jako `null` -- stejné porovnání jako `Crud` (caio-ui).
        const changed = {};
        for (const name of updateFieldList) {
          if ((v[name] ?? undefined) !== savedRef.current[name]) changed[name] = v[name] ?? null;
        }
        if (Object.keys(changed).length) {
          const updateDtoIn = { id: match.id, ...changed };
          saved = { ...saved, ...(onUpdate ? await onUpdate(updateDtoIn) : await UiElements.Call.cmdPost("/match/update", updateDtoIn)) };
          // As the next comparison reads it: empty is `undefined` there, not `null`.
          savedRef.current = { ...savedRef.current, ...Object.fromEntries(Object.keys(changed).map((name) => [name, v[name] ?? undefined])) };
        }
      }

      const nextResultKey = resultKey(v);
      if (needsResult(match, v) && Number.isFinite(v.homeGoals) && nextResultKey !== savedResultRef.current) {
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
        saved = { ...saved, ...(onSubmit ? await onSubmit(dtoIn) : await UiElements.Call.cmdPost("/match/setResult", dtoIn)) };
        savedResultRef.current = nextResultKey;
      }

      if (lineup && lineupKey(lineup) !== savedLineupKeyRef.current?.key) {
        // One team's lineup (`teamId`): the server replaces that team's players on the match day
        // and keeps every other entry, so nobody has to send back what he did not edit.
        const dtoIn = { id: match.id, teamId: lineupTeamId, playerList: toPlayerList(lineup) };
        saved = { ...saved, ...(onLineupSubmit ? await onLineupSubmit(dtoIn) : await UiElements.Call.cmdPost("/match/setLineup", dtoIn)) };
        savedLineupKeyRef.current = { teamId: lineupTeamId, key: lineupKey(lineup) };
        lineupSaved = true;
      }

      if (saved) onSaved?.({ ...match, ...saved }, { lineupSaved });
      onClose();
    } catch (err) {
      // A step that went through stays saved (the refs above moved); the list or detail learns
      // about it now, the message stays with the form.
      if (saved) onSaved?.({ ...match, ...saved }, { lineupSaved });
      setError(err?.message ?? String(err));
    } finally {
      setPending(false);
    }
  }

  // A requested Lineup tab waits for the roster with a skeleton instead of another tab's content.
  const waitingForLineup = lineupPending && tabCode === "lineup";
  const hidden = (code) => Config.Css.css({ display: activeTab === code && !waitingForLineup ? "block" : "none" });
  const pairName = (match.homeTeam?.name ?? "?") + " – " + (match.guestTeam?.name ?? "?");

  return (
    <Uu5Forms.Form.Provider
      onSubmit={submit}
      initialValue={{
        homeGoals: match.homeGoals ?? undefined,
        guestGoals: match.guestGoals ?? undefined,
        homeGoalsHalf: match.homeGoalsHalf ?? undefined,
        guestGoalsHalf: match.guestGoalsHalf ?? undefined,
        penaltyWinnerTeamId: match.penaltyWinnerTeamId ?? undefined,
        // Pole záložky Info; `seasonId` čte i `ResultFields` kvůli penaltám.
        ...savedRef.current,
      }}
    >
      <InvalidTabs attemptRef={submitAttemptRef} onTab={showTab} onInvalidChange={setInvalidTabs} />
      <Uu5Elements.Modal
        open
        onClose={onClose}
        header={pairName}
        tabList={tabList.length > 1 ? tabList : undefined}
        tabCode={activeTab}
        onTabCodeChange={(e) => showTab(e.data.tabCode)}
        footer={
          <div
            className={Config.Css.css({ display: "flex", gap: 8, justifyContent: "end" })}
            // Remember when Save was pressed (InvalidTabs).
            onClickCapture={() => {
              submitAttemptRef.current = Date.now();
            }}
          >
            <Uu5Forms.CancelButton onClick={onClose} disabled={pending} />
            <Uu5Forms.SubmitButton icon="uugds-check" disabled={pending} />
          </div>
        }
      >
        <div>
          {canUpdate ? (
            <div ref={initialTabRef.current === "info" ? autoFocusRef : undefined} className={hidden("info")}>
              {visited.has("info") || activeTab === "info" ? <InfoFields cfg={updateCfg} /> : null}
            </div>
          ) : null}

          <div ref={initialTabRef.current === "result" ? autoFocusRef : undefined} className={hidden("result")}>
            <ResultFields
              teamItemList={teamItemList}
              hasPenaltiesRef={hasPenaltiesRef}
              scoreRequired={(value) => needsResult(match, value)}
            />
          </div>

          {lineup ? (
            <div className={hidden("lineup")}>
              <LineupEditor lineup={lineup} onChange={setEditedLineup} players={players} ownSide={ownSide} loadPrevious={loadPrevious} />
            </div>
          ) : null}

          {/* The lineup tab appears once the roster is in; a requested Lineup tab waits for it. */}
          {waitingForLineup ? <Uu5Elements.Skeleton height={240} /> : null}

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

export { MatchModal };
