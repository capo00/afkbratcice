import { createVisualComponent, useDataObject, useState, useMemo, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import Heading from "../layout/heading.jsx";
import StandingsTable from "../standings-table.jsx";
import EmptyState from "../empty-state.jsx";
import { useApp } from "../../core/app-context.jsx";

const { theme } = Config;

// Tabulky na home s přepínačem kategorií.
//
// Přepínají se **jen kategorie, které tabulku mají** (`hasTable` ze `season/listCurrent`).
// Stará garda hraje soutěž bez tabulky, takže by prázdná záložka jen mátla — místo ní je
// pod tabulkou poznámka, stejně jako v předloze.
//
// Přepínač je `Uu5Elements.Tabs` s `displayBottomLine={false}` — stejná komponenta jako
// záložky na detailu mužstva, aby se web přepínal všude stejně. `Uu5Forms.SwitchSelect` to
// není schválně: je v `uu5g05-forms` netypovaný (`const SwitchSelect: any`), roztáhne se přes
// celou šířku jako formulářový vstup a sází Barlowem, takže z chipů předlohy nezbude nic.
//
// Obsah tabulky **nejde do `children` položek**: načítá se podle aktivní sezóny jedním
// `useDataObject` a musí kolem sebe mít stavy (skeleton, prázdno). `Tabs` je tu tedy jen
// přepínač a tabulka se kreslí pod ním.

const TablesSection = createVisualComponent({
  uu5Tag: Config.TAG + "TablesSection",

  render() {
    const { categoryList } = useApp();

    const withTable = useMemo(() => categoryList.filter((category) => category.hasTable), [categoryList]);
    const withoutTable = useMemo(() => categoryList.filter((category) => !category.hasTable), [categoryList]);

    const [activeSeasonId, setActiveSeasonId] = useState();
    const active = withTable.find((category) => category.seasonId === activeSeasonId) ?? withTable[0];

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () =>
            active
              ? UiElements.Call.cmdGet("/stats/getTable", { seasonId: active.seasonId })
              : Promise.resolve({ table: [] }),
        },
      },
      [active?.seasonId],
    );

    const { state, data } = dataObject;

    if (categoryList.length === 0) return null;

    return (
      <Section id="tabulky">
        <Heading eyebrow={lsi("home", "tables", "eyebrow")} lsi={lsi("home", "tables", "header")} />

        {withTable.length > 1 ? (
          <Uu5Elements.Tabs
            activeCode={active?.seasonId}
            // `displayBottomLine` funguje jen s `type="line"`, viz team-shell.jsx.
            type="line"
            displayBottomLine={false}
            colorScheme="primary"
            onChange={(e) => setActiveSeasonId(e.data.activeCode)}
            itemList={withTable.map((category) => ({
              code: category.seasonId,
              label: <Lsi import={importLsi} path={["enum", "age", category.age]} />,
            }))}
            className={Config.Css.css({ marginBlockStart: 16 })}
          />
        ) : null}

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {!active ? (
            <EmptyState lsi={lsi("home", "tables", "empty")} icon="uugds-view-list" />
          ) : state === "pendingNoData" ? (
            <Uu5Elements.Skeleton height={240} />
          ) : (data?.table ?? []).length === 0 ? (
            <EmptyState lsi={lsi("home", "tables", "empty")} icon="uugds-view-list" />
          ) : (
            <>
              {active.competition ? (
                <Uu5Elements.Text
                  category="interface"
                  segment="content"
                  type="medium"
                  className={Config.Css.css({ display: "block", marginBlockEnd: 8, color: theme.color.mutedFg })}
                >
                  {active.competition}
                </Uu5Elements.Text>
              ) : null}
              <StandingsTable table={data.table} ownTeamId={active.teamId} hasPenalties={active.hasPenalties} />
            </>
          )}
        </div>

        {withoutTable.length > 0 ? (
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({ display: "block", marginBlockStart: 16, color: theme.color.mutedFg })}
          >
            <Lsi
              import={importLsi}
              path={["home", "tables", "note"]}
              params={{ categoryList: withoutTable.map((category) => category.teamName).join(", ") }}
            />
          </Uu5Elements.Text>
        ) : null}
      </Section>
    );
  },
});

export default TablesSection;
