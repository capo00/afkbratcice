import { createVisualComponent, useState, useMemo, useRef, useDataList, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { EntitySelect, EnumText, enumItemList, dateTimeField, seasonLabel, teamLabel } from "../../admin/fields.jsx";
import { ResultModal, LineupModal } from "../../admin/match-modals.jsx";
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
// ten jeden řádek tím, co vrátil server — stejně jako `admin/identities.jsx`.
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

const AdminMatches = createVisualComponent({
  uu5Tag: Config.TAG + "AdminMatches",

  render() {
    const { getTeam } = useApp();
    const [resultFor, setResultFor] = useState();
    const [lineupFor, setLineupFor] = useState();

    const CONFIG = useMemo(
      () => ({
        time: dateTimeField(lsi("admin", "field", "time"), { required: false }),
        homeTeamId: {
          label: lsi("admin", "field", "homeTeam"),
          output: (value) => getTeam(value)?.name ?? value,
          input: {
            Component: EntitySelect,
            props: { required: true, useCase: "/team/list", getLabel: teamLabel },
          },
        },
        guestTeamId: {
          label: lsi("admin", "field", "guestTeam"),
          output: (value) => getTeam(value)?.name ?? value,
          input: {
            Component: EntitySelect,
            props: { required: true, useCase: "/team/list", getLabel: teamLabel },
          },
        },
        // Skóre je jen sloupec: mění se přes „Zapsat výsledek", který navíc hlídá rozstřel.
        homeGoals: {
          label: lsi("admin", "field", "score"),
          columnProps: { maxWidth: 90, horizontalAlignment: "center" },
          output: (value, item) =>
            Number.isFinite(value) && Number.isFinite(item.data.guestGoals) ? `${value} : ${item.data.guestGoals}` : "",
        },
        seasonId: {
          label: lsi("admin", "field", "season"),
          output: false,
          input: {
            Component: EntitySelect,
            props: { required: true, useCase: "/season/list", getLabel: seasonLabel },
          },
        },
        round: {
          label: lsi("admin", "field", "round"),
          sort: true,
          columnProps: { maxWidth: 80, horizontalAlignment: "center" },
          // Prázdné kolo = přátelský zápas; server prázdný řetězec normalizuje na null.
          input: { Component: Uu5Forms.FormText, props: { maxLength: 5 } },
        },
        place: {
          label: lsi("admin", "field", "place"),
          input: { Component: Uu5Forms.FormText, props: { maxLength: 80 } },
        },
        departureTime: {
          label: lsi("admin", "field", "departureTime"),
          output: false,
          input: { Component: Uu5Forms.FormDateTime, props: {} },
        },
        state: {
          label: lsi("admin", "field", "state"),
          sort: true,
          columnProps: { maxWidth: 120 },
          output: (value) => <EnumText enumName="matchState" code={value} />,
          input: {
            Component: Uu5Forms.FormSelect,
            props: { itemList: enumItemList("matchState", Config.MATCH_STATE_LIST) },
          },
          filterProps: {
            inputType: "select",
            inputProps: { itemList: enumItemList("matchState", Config.MATCH_STATE_LIST) },
            filter: (value, filterValue) => value === filterValue,
          },
        },
        note: {
          label: lsi("admin", "field", "note"),
          output: false,
          input: { Component: Uu5Forms.FormTextArea, props: { maxLength: 300, autoResize: true } },
        },
      }),
      [getTeam],
    );

    const { seriesList, columnList, sorterList, filterList } = useMemo(
      () => UiElements.Crud.generate(CONFIG),
      [CONFIG],
    );

    // Ref se plní **až za** `useDataList` — dřív `dataList` ještě neexistuje.
    const dataRef = useRef();
    const dataList = useDataList({ ...matchHandlers(dataRef), initialDtoIn: { order: "desc" } });
    dataRef.current = dataList.data;

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "matches", "header")}>
        <UiElements.Crud
          dataList={dataList}
          seriesList={seriesList}
          columnList={columnList}
          sorterDefinitionList={sorterList}
          filterDefinitionList={filterList}
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
          {() => UiElements.Crud.generateInputs(CONFIG)}
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
