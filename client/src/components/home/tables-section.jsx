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
// Přepínač je řada `Uu5Elements.Button`, ne `Uu5Forms.SwitchSelect`: `SwitchSelect` je
// v `uu5g05-forms` netypovaný (`const SwitchSelect: any`), takže by se jeho API hádalo.
// Tlačítka jsou uu5 komponenty konfigurované propsy, což je přesně to, co pravidlo chce,
// a vypadají jako segmentovaný přepínač z předlohy.

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
          <div className={Config.Css.css({ display: "flex", gap: 8, flexWrap: "wrap", marginBlockStart: 16 })}>
            {withTable.map((category) => (
              <Uu5Elements.Button
                key={category.seasonId}
                colorScheme="primary"
                significance={category.seasonId === active?.seasonId ? "highlighted" : "subdued"}
                borderRadius="moderate"
                onClick={() => setActiveSeasonId(category.seasonId)}
                className={Config.Css.css({
                  fontFamily: theme.font.display,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                })}
              >
                <Lsi import={importLsi} path={["enum", "age", category.age]} />
              </Uu5Elements.Button>
            ))}
          </div>
        ) : null}

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {!active ? (
            <EmptyState lsi={lsi("home", "tables", "empty")} icon="uugds-list" />
          ) : state === "pendingNoData" ? (
            <Uu5Elements.Skeleton height={240} />
          ) : (data?.table ?? []).length === 0 ? (
            <EmptyState lsi={lsi("home", "tables", "empty")} icon="uugds-list" />
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
              <StandingsTable table={data.table} ownTeamId={active.teamId} />
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
