import { createVisualComponent, useDataObject, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import ArticleTile from "../components/article-tile.jsx";
import EmptyState from "../components/empty-state.jsx";

// Výpis novinek se stránkováním.
//
// Stránka je **v adrese** (`/novinky?pageIndex=2`), ne ve stavu komponenty: `/home-<n>` ze
// starého webu se na tuhle adresu přesměrovává (`server/legacy-redirect.js`), takže se na
// konkrétní stránku dá odkázat i zvenčí. Zpátky v prohlížeči pak funguje taky.
//
// Tohle je jediný seznam v appce, který stránkuje na serveru — proto jako jediný jede přes
// `pageInfo` s `total` (`Dao.findPage()` v caio-server). Bez `total` by se nedalo poznat,
// kolik stránek vůbec je, jen jestli přišla plná dávka.

const PAGE_SIZE = 10;

function toPageIndex(value) {
  const index = Number(value);
  return Number.isInteger(index) && index > 0 ? index : 0;
}

const Novinky = createVisualComponent({
  uu5Tag: Config.TAG + "Novinky",

  render() {
    const [route, setRoute] = useRoute();
    const pageIndex = toPageIndex(route?.params?.pageIndex);

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () => UiElements.Call.cmdGet("/article/list", { pageInfo: { pageIndex, pageSize: PAGE_SIZE } }),
        },
      },
      [pageIndex],
    );

    const { state, data } = dataObject;
    const itemList = data?.itemList ?? [];
    const total = data?.pageInfo?.total ?? 0;
    const pageCount = Math.ceil(total / PAGE_SIZE);

    return (
      <Section>
        <Heading eyebrow={lsi("news", "eyebrow")} lsi={lsi("news", "header")} />

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {state === "pendingNoData" ? (
            <Uu5Elements.Skeleton height={320} />
          ) : itemList.length === 0 ? (
            <EmptyState lsi={lsi("news", "empty")} icon="uugdsstencil-communication-megaphone" />
          ) : (
            <div
              className={Config.Css.css({
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              })}
            >
              {itemList.map((article) => (
                <ArticleTile key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>

        {pageCount > 1 ? (
          <div className={Config.Css.css({ marginBlockStart: 32, display: "flex", justifyContent: "center" })}>
            <Uu5Elements.Pagination
              index={pageIndex}
              count={pageCount}
              // První stránka je `/novinky` bez parametru — kanonická adresa výpisu má být
              // jedna, ne dvě (`/novinky` a `/novinky?pageIndex=0`) se stejným obsahem.
              onChange={(e) =>
                setRoute("novinky", e.data.index > 0 ? { pageIndex: e.data.index } : {})
              }
            />
          </div>
        ) : null}
      </Section>
    );
  },
});

export default Novinky;
