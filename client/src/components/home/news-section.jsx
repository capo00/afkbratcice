import { createVisualComponent, useDataObject, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import Heading from "../layout/heading.jsx";
import Button from "../layout/button.jsx";
import ArticleTile from "../article-tile.jsx";

// Aktuality na úvodní stránce — tři nejnovější a odkaz na celý výpis.
//
// Sekce se **nevykreslí vůbec**, když není co ukázat: prázdný rámeček s hláškou má smysl
// u výpisu, kam čtenář přišel schválně, ne na home mezi programem a tabulkami.

const HOME_COUNT = 3;

const NewsSection = createVisualComponent({
  uu5Tag: Config.TAG + "NewsSection",

  render() {
    const [, setRoute] = useRoute();

    const dataObject = useDataObject({
      handlerMap: {
        load: () => UiElements.Call.cmdGet("/article/list", { pageInfo: { pageIndex: 0, pageSize: HOME_COUNT } }),
      },
    });

    const { state, data } = dataObject;
    const itemList = data?.itemList ?? [];

    if (state === "pendingNoData") {
      return (
        <Section id="aktuality">
          <Uu5Elements.Skeleton height={240} />
        </Section>
      );
    }

    if (!itemList.length) return null;

    return (
      <Section id="aktuality">
        <Heading eyebrow={lsi("news", "eyebrow")} lsi={lsi("news", "header")} />

        <div
          className={Config.Css.css({
            marginBlockStart: 24,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          })}
        >
          {itemList.map((article) => (
            <ArticleTile key={article.id} article={article} />
          ))}
        </div>

        <div className={Config.Css.css({ marginBlockStart: 24, display: "flex", justifyContent: "center" })}>
          <Button variant="outline" onClick={() => setRoute("novinky")} lsi={lsi("news", "all")} />
        </div>
      </Section>
    );
  },
});

export default NewsSection;
