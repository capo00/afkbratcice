import { createVisualComponent, useDataList, useMemo, useRef } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import Heading from "../layout/heading.jsx";
import MatchTile from "../match-tile.jsx";
import EmptyState from "../empty-state.jsx";
import { useApp } from "../../core/app-context.jsx";
import { mergeItemHandler } from "../../core/item-merge.js";

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

    // `useDataList` i tady, přestože se seznam skládá z N dotazů: `load` může `itemList`
    // poskládat odkudkoli, jediná podmínka je stabilní `id` u položky — a to zápas má.
    // Odměnou je, že zapsaný výsledek nahradí právě tu jednu kartu tím, co vrátil server.
    //
    // Položka je **čistý zápas**, ne dvojice `{ category, match }`: `useDataList` položku po
    // zápisu nahradí celou tím, co přišlo ze serveru, takže cokoli si k ní přibalíme navíc
    // by se v tu chvíli ztratilo. Kategorie se proto dopočítává z týmu, stejně jako
    // v `weekend-program.jsx`.
    const dataRef = useRef();
    const dataList = useDataList(
      {
        handlerMap: {
          load: async () => {
            const matchList = await Promise.all(
              categoryList
                .filter((category) => category.teamId)
                .map((category) =>
                  UiElements.Call.cmdGet("/match/getLast", { teamId: category.teamId })
                    // Jedna kategorie bez výsledku nesmí shodit celou sekci.
                    .catch(() => null),
                ),
            );
            return { itemList: matchList.filter((match) => match?.id) };
          },
        },
        itemHandlerMap: {
          setResult: mergeItemHandler(dataRef, (dtoIn) => UiElements.Call.cmdPost("/match/setResult", dtoIn)),
        },
      },
      [categoryList],
    );
    dataRef.current = dataList.data;

    const { state, data } = dataList;

    const categoryByTeamId = useMemo(
      () => new Map(categoryList.filter((c) => c.teamId).map((c) => [c.teamId, c])),
      [categoryList],
    );

    const resultList = useMemo(() => (data ?? []).filter((item) => item?.data?.id), [data]);

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
              {resultList.map((item) => {
                const match = item.data;
                // Kategorie podle toho, který z dvojice je náš tým — `getLast` se ptal
                // právě za něj, takže v zápase vždycky jeden z nich je.
                const category =
                  categoryByTeamId.get(match.homeTeamId) ?? categoryByTeamId.get(match.guestTeamId);
                return (
                  <MatchTile
                    key={match.id}
                    matchData={item}
                    ownTeamId={category?.teamId}
                    category={category?.age}
                  />
                );
              })}
            </Uu5Elements.Grid>
          )}
        </div>
      </Section>
    );
  },
});

export default LastResults;
