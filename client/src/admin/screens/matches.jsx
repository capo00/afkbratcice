import { createVisualComponent, useState, useMemo, useRef, useEffect, useDataList, useDataObject, Lsi } from "uu5g05";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../screen.jsx";
import { seasonLabel, teamLabel } from "../fields.jsx";
import { getMatchConfig, MATCH_PAIR_LIST } from "../match-fields.jsx";
import CrudFormView from "../crud-form-view.jsx";
import { ResultModal, LineupModal } from "../match-modals.jsx";
import { useApp } from "../../core/app-context.jsx";
import { mergeItemHandler } from "../../core/item-merge.js";

// Zápasy. Nejrušnější obrazovka administrace: rozpis se zakládá hromadně na začátku
// sezóny, výsledky a sestavy se dopisují každý víkend.
//
// Proto tři cesty místo jedné:
// - **Vytvořit** — jeden zápas ručně,
// - **Hromadně** — JSON s rozlosováním z OFS (`match/createMany`, nabídne ho `Crud` sám,
//   protože provider má `createMany`),
// - **Zapsat výsledek / sestavu** — vlastní modaly nad řádkem, viz `admin/match-modals.jsx`.

// `useDataList` napřímo, ne `CrudContext`: ten umí položkové handlery jen pro `update`
// a `delete` (caio-ui, `crud-context.jsx`), takže „zapsat výsledek" a „zapsat sestavu" by
// se musely dohánět přenačtením celého rozpisu sezóny. Takhle si seznam aktualizuje právě
// ten jeden řádek tím, co vrátil server — stejně jako `screens/identities.jsx`.
//
// `createMany` **tady být má** — `match` je jediná entita, která ho na serveru má; hromadný
// import rozlosování je celý důvod jeho existence.
//
// Zápisové operace **nemusí vracet tranzitivní data**, kterých se netýkají — `setLineup`
// mění sestavu, ne týmy, takže server vrací holý zápas (`server/match/crud.js`).
// `mergeItemHandler` proto návratovou hodnotu slučuje se současnými daty položky;
// `delete` se schválně neslučuje (viz `core/item-merge.js`).
function matchHandlers(dataRef) {
  const merge = (useCase) => mergeItemHandler(dataRef, (dtoIn) => UiElements.Call.cmdPost(useCase, dtoIn));

  return {
    handlerMap: {
      load: (dtoIn) => UiElements.Call.cmdGet("match/list", dtoIn),
      create: (dtoIn) => UiElements.Call.cmdPost("match/create", dtoIn),
      createMany: (dtoIn) => UiElements.Call.cmdPost("match/createMany", dtoIn),
      deleteMany: (dtoIn) => UiElements.Call.cmdPost("match/deleteMany", dtoIn),
    },
    itemHandlerMap: {
      update: merge("match/update"),
      delete: (dtoIn) => UiElements.Call.cmdPost("match/delete", dtoIn),
      setResult: merge("match/setResult"),
      setLineup: merge("match/setLineup"),
    },
  };
}

// Filtry jdou **na server** (`match/list`): zápasů jsou tisíce a seznam se načítá po
// stránkách, klientský filtr by prošel jen tu načtenou. Kolo platí jen spolu se sezónou
// (server ho bez ní odmítne) -- bez vybrané sezóny se do dtoIn nepošle.
function listDtoIn(filterDtoIn) {
  const { round, ...rest } = filterDtoIn;
  return { order: "desc", ...rest, ...(round && rest.seasonId ? { round } : null) };
}

const AdminMatches = createVisualComponent({
  uu5Tag: Config.TAG + "AdminMatches",

  render() {
    const app = useApp();
    const { getTeam, teamList } = app;
    const [resultFor, setResultFor] = useState();
    const [lineupFor, setLineupFor] = useState();

    // Nabídky filtrů: týmy jsou v app-contextu, sezóny se načtou.
    const { data: seasonData } = useDataObject(
      { handlerMap: { load: () => UiElements.Call.cmdGet("/season/list", {}) } },
      [],
    );
    const teamItemList = useMemo(
      () =>
        [...teamList]
          .sort((a, b) => a.name.localeCompare(b.name, "cs"))
          .map((team) => ({ value: team.id, children: teamLabel(team, app) })),
      [teamList, app],
    );
    const seasonItemList = useMemo(
      () => (seasonData?.itemList ?? []).map((season) => ({ value: season.id, children: seasonLabel(season) })),
      [seasonData],
    );

    const CONFIG = useMemo(
      () => getMatchConfig({ getTeam, teamItemList, seasonItemList }),
      [getTeam, teamItemList, seasonItemList],
    );

    const { seriesList, columnList, sorterList, filterList } = useMemo(
      () => UiElements.Crud.generate(CONFIG),
      [CONFIG],
    );

    const filter = UiElements.Crud.useFilter({ filterDefinitionList: filterList });
    const dtoIn = useMemo(() => listDtoIn(filter.dtoIn), [filter.dtoIn]);

    // Ref se plní **až za** `useDataList` — dřív `dataList` ještě neexistuje.
    const dataRef = useRef();
    const dataList = useDataList({ ...matchHandlers(dataRef), initialDtoIn: dtoIn });
    dataRef.current = dataList.data;

    // Jiný filtr = nový výpis. `useDataList` dtoIn nesleduje (na rozdíl od `CrudContext`),
    // takže se načte ručně; první načtení udělal `initialDtoIn`.
    const dtoInKey = JSON.stringify(dtoIn);
    const loadedKeyRef = useRef(dtoInKey);
    useEffect(() => {
      if (loadedKeyRef.current === dtoInKey || !dataList.handlerMap.load) return;
      loadedKeyRef.current = dtoInKey;
      dataList.handlerMap.load(dtoIn).catch(() => {});
    }, [dtoInKey, dataList.handlerMap.load]);

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "matches", "header")}>
        <UiElements.Crud
          {...filter.crudProps}
          // `dtoIn` na seznamu: `Crud` s ním donačítá další stránky (`loadNext`), jinak by šly bez filtrů.
          dataList={{ ...dataList, dtoIn }}
          seriesList={seriesList}
          columnList={columnList}
          sorterDefinitionList={sorterList}
          // `getItemActionList` dostává `{ data }`, kde `data` je **položka seznamu**
          // (`{ data, handlerMap }`), ne samotný zápas — proto se rozbaluje na `item`.
          // Do stavu jde celá položka: modal pak ukládá jejím handlerem a seznam si ten
          // jeden řádek aktualizuje sám, bez přenačtení celého rozpisu.
          getItemActionList={({ data: item }) => [
            {
              icon: "uugds-check",
              children: <Lsi import={importLsi} path={["admin", "matches", "setResult"]} />,
              onClick: () => setResultFor(item),
            },
            {
              icon: "uugds-account-multi",
              children: <Lsi import={importLsi} path={["admin", "matches", "setLineup"]} />,
              onClick: () => setLineupFor(item),
            },
          ]}
        >
          {({ type }) => <CrudFormView cfg={CONFIG} operation={type} pairList={MATCH_PAIR_LIST} />}
        </UiElements.Crud>

        {resultFor ? (
          <ResultModal
            match={{
              ...resultFor.data,
              homeTeam: getTeam(resultFor.data.homeTeamId),
              guestTeam: getTeam(resultFor.data.guestTeamId),
            }}
            onClose={() => setResultFor()}
            onSubmit={resultFor.handlerMap.setResult}
            canUpdate
            onUpdate={resultFor.handlerMap.update}
          />
        ) : null}

        {lineupFor ? (
          <LineupModal
            match={lineupFor.data}
            onClose={() => setLineupFor()}
            onSubmit={lineupFor.handlerMap.setLineup}
          />
        ) : null}
      </AdminScreen>
    );
  },
});

export default AdminMatches;
