import { createVisualComponent, useDataObject, useMemo } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { entityCalls } from "../../admin/crud-calls.js";
import { ageField, boolField, teamLabel } from "../../admin/fields.jsx";

// Sezóny — ročník soutěže jedné kategorie a její účastníci.
//
// **`hasPenalties` je nastavení sezóny**, ne vlastnost zápasu (rozhodnuto 2026-09-06):
// jestli se v soutěži kope rozstřel, ví se dopředu z rozpisu, a tabulka podle toho boduje
// 3/2/1/0 místo 3/1/0. Odvozovat to z toho, že u nějakého zápasu je vyplněný vítěz
// rozstřelu, by znamenalo, že se model změní podle toho, kdo co vyplnil.

const [SeasonProvider] = UiElements.CrudContext.create("season");
// Bez `createMany`/`deleteMany` -- `season` je na serveru nemá (admin/crud-calls.js).
const CALLS = entityCalls("season");

/** Účastníci soutěže — víceřádkový výběr týmů. */
function TeamListInput(props) {
  const { data } = useDataObject({ handlerMap: { load: () => UiElements.Call.cmdGet("/team/list", {}) } }, []);
  const itemList = useMemo(
    () => (data?.itemList ?? []).map((team) => ({ value: team.id, children: teamLabel(team) })),
    [data],
  );

  return <Uu5Forms.FormSelect {...props} itemList={itemList} multiple />;
}

const CONFIG = {
  competition: {
    label: lsi("admin", "field", "competition"),
    sort: true,
    input: { Component: Uu5Forms.FormText, props: { required: true, maxLength: 80 } },
  },
  // Ročník je řetězec, ne číslo: „2025" znamená sezónu 2025/26 a nikdy se s ním nepočítá.
  yearFrom: {
    label: lsi("admin", "field", "yearFrom"),
    sort: true,
    columnProps: { maxWidth: 100 },
    input: { Component: Uu5Forms.FormText, props: { required: true, pattern: "\\d{4}", maxLength: 4 } },
  },
  age: ageField,
  hasPenalties: boolField(lsi("admin", "field", "hasPenalties")),
  teamList: {
    label: lsi("admin", "field", "participants"),
    output: (value) => (value ?? []).length || "",
    columnProps: { maxWidth: 90, horizontalAlignment: "center" },
    input: { Component: TeamListInput, props: {} },
  },
  desc: {
    label: lsi("admin", "field", "desc"),
    output: false,
    input: { Component: Uu5Forms.FormTextArea, props: { maxLength: 300, autoResize: true } },
  },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminSeasons = createVisualComponent({
  uu5Tag: Config.TAG + "AdminSeasons",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "seasons", "header")}>
        <SeasonProvider calls={CALLS}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
              initialSorterList={[{ key: "yearFrom", ascending: false }]}
            >
              {() => UiElements.Crud.generateInputs(CONFIG)}
            </UiElements.Crud>
          )}
        </SeasonProvider>
      </AdminScreen>
    );
  },
});

export default AdminSeasons;
