import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import EmptyState from "./empty-state.jsx";
import { UiElements } from "caio-ui";

// Stavy načítání kolem dat z `useDataObject` / `useDataList` -- jedno místo pro skeleton,
// „neexistuje“ a „nepodařilo se načíst“ (review 2026-11-12, S1).
//
// Proč: uu5g05 hlásí selhání **prvního** načtení stavem `errorNoData`; `error` znamená až
// chybu dalšího načtení, kdy data už jsou. Obrazovky dřív testovaly jen `pendingNoData`
// a chybu nechaly propadnout do prázdného seznamu -- při výpadku serveru tak web tvrdil
// „Tento týden se nehraje“ a „Výbor je prázdný“, `season.jsx` testoval `"error"` a visel na
// skeletonu navždy, a detail zápasu hlásil „nepodařilo se najít“ i u chyby 500.
//
//   <DataState dataObject={dataObject} height={240} notFound={lsi("season", "missing")}>
//     {() => <Obsah data={dataObject.data} />}
//   </DataState>
//
//   pendingNoData                    → Skeleton výšky `height`
//   errorNoData + 400/404 + notFound → EmptyState s textem `notFound` (záznam neexistuje)
//   errorNoData ostatní              → ErrorState s „Zkusit znovu“ (znovu zavolá `load`)
//   jinak                            → `children` (funkce, aby se obsah nestavěl bez dat)
//
// Prázdný seznam není chyba: ten si dál řeší obrazovka sama `EmptyState` s vlastním textem.

// 400 patří k 404: `notFound` mají jen detaily, jejichž id je z adresy, a id, které server
// odmítne jako neplatné (překlep, useknutý odkaz), je pro návštěvníka taky neexistující záznam.
const NOT_FOUND_STATUS_LIST = [400, 404];

function isNotFound(errorData) {
  return NOT_FOUND_STATUS_LIST.includes(errorData?.error?.status);
}

/** Nepodařilo se načíst: červený rámeček s textem a tlačítkem pro nový pokus. */
const ErrorState = createVisualComponent({
  uu5Tag: Config.TAG + "ErrorState",

  render(props) {
    const { onRetry, lsi: message = lsi("common", "loadError"), ...restProps } = props;

    return (
      <Uu5Elements.HighlightedBox {...restProps} icon="uugds-alert-circle" colorScheme="negative">
        <div
          className={Config.Css.css({
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          })}
        >
          <Lsi lsi={message} />
          {onRetry ? (
            <Uu5Elements.Button
              icon="uugds-reload"
              colorScheme="negative"
              significance="distinct"
              size="s"
              onClick={() => onRetry()}
            >
              <Lsi lsi={lsi("common", "retry")} />
            </Uu5Elements.Button>
          ) : null}
        </div>
      </Uu5Elements.HighlightedBox>
    );
  },
});

const DataState = createVisualComponent({
  uu5Tag: Config.TAG + "DataState",

  render(props) {
    const { dataObject, height = 160, notFound, notFoundIcon, children } = props;
    const { state, errorData, handlerMap } = dataObject;

    if (state === "pendingNoData") return <UiElements.Skeleton height={height} />;

    if (state === "errorNoData") {
      if (notFound && isNotFound(errorData)) return <EmptyState lsi={notFound} icon={notFoundIcon} />;
      return <ErrorState onRetry={() => handlerMap.load().catch(() => {})} />;
    }

    return typeof children === "function" ? children() : (children ?? null);
  },
});

export { DataState, ErrorState, isNotFound };
export default DataState;
