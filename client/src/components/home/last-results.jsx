import { createVisualComponent, useDataObject, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import Heading from "../layout/heading.jsx";
import MatchTile from "../match-tile.jsx";
import EmptyState from "../empty-state.jsx";
import { useApp } from "../../core/app-context.jsx";

// Poslední výsledky — jedna karta na kategorii, vedle sebe.
//
// Předloha je ukazuje **za všechna mužstva najednou**, což je pro klub se třemi týmy
// užitečnější než jedna dlaždice „poslední zápas" z postranního panelu v0.
//
// Tady se na rozdíl od programu víkendu ptáme **po kategoriích**, ne jedním dotazem:
// `match/getLast` vrací poslední odehraný zápas *jednoho týmu*, a „poslední zápas každého
// mužstva" se z jednoho seznamu vytáhnout nedá — musel by se stáhnout celý a filtrovat na
// klientu. Dotazy jdou paralelně, takže je to jedno kolo latence, ne N za sebou.
//
// Tým, který ještě nehrál, vrátí `{}` a z mřížky prostě vypadne. Prázdný stav je až tehdy,
// když nehrál nikdo.

const LastResults = createVisualComponent({
  uu5Tag: Config.TAG + "LastResults",

  render() {
    const { categoryList } = useApp();

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: async () => {
            const itemList = await Promise.all(
              categoryList
                .filter((category) => category.teamId)
                .map((category) =>
                  UiElements.Call.cmdGet("/match/getLast", { teamId: category.teamId })
                    .then((match) => ({ category, match }))
                    // Jedna kategorie bez výsledku nesmí shodit celou sekci.
                    .catch(() => ({ category, match: null })),
                ),
            );
            return { itemList };
          },
        },
      },
      [categoryList],
    );

    const { state, data } = dataObject;

    const resultList = useMemo(
      () => (data?.itemList ?? []).filter((item) => item.match?.id),
      [data],
    );

    return (
      <Section variant="hatched" id="vysledky">
        <Heading eyebrow={lsi("home", "results", "eyebrow")} lsi={lsi("home", "results", "header")} />

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {state === "pendingNoData" ? (
            <Uu5Elements.Skeleton height={160} />
          ) : resultList.length === 0 ? (
            <EmptyState lsi={lsi("home", "results", "empty")} icon="uugds-check" />
          ) : (
            <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))">
              {resultList.map(({ category, match }) => (
                <MatchTile key={category.seasonId} match={match} ownTeamId={category.teamId} category={category.age} />
              ))}
            </Uu5Elements.Grid>
          )}
        </div>
      </Section>
    );
  },
});

export default LastResults;
