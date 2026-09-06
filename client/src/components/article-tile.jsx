import { createVisualComponent, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import Card from "./layout/card.jsx";
import DateText from "./date-text.jsx";

const { theme } = Config;

// Dlaždice novinky — jedna komponenta pro výpis novinek i pro blok na home.
//
// Stojí na tom, co vrací `article/list`: titulní foto, datum, titulek, perex a štítky.
// **Obsah (`sectionList`) list nevrací** a dlaždice ho nepotřebuje — u dvaceti článků by
// to byl řádově větší přenos za perex, který se stejně vejde na tři řádky.
//
// Fotka je volitelná a placeholder se nekreslí: novinka bez fotky je běžná (krátká zpráva
// o odloženém zápase) a šedý obdélník by z výpisu udělal galerii prázdných rámečků.

const PEREX_LINES = 3;

const ArticleTile = createVisualComponent({
  uu5Tag: Config.TAG + "ArticleTile",

  render({ article, onClick }) {
    const [, setRoute] = useRoute();
    const handleClick = onClick ?? (article.id ? () => setRoute("novinka", { id: article.id }) : undefined);

    return (
      <Card topStripe={article.priority > 0} onClick={handleClick}>
        {article.photographUri ? (
          <UiElements.Image
            src={article.photographUri}
            alt=""
            loading="lazy"
            className={Config.Css.css({
              inlineSize: "100%",
              aspectRatio: "16 / 9",
              objectFit: "cover",
              borderRadius: theme.radius,
              marginBlockEnd: 12,
            })}
          />
        ) : null}

        <div
          className={Config.Css.css({
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            color: theme.color.mutedFg,
            marginBlockEnd: 8,
          })}
        >
          <Uu5Elements.Icon icon="uugds-calendar" />
          <DateText value={article.publishTime} />
          {(article.tagList ?? []).slice(0, 2).map((tag) => (
            <Uu5Elements.Tag key={tag} colorScheme="primary" significance="distinct" size="s">
              {tag}
            </Uu5Elements.Tag>
          ))}
        </div>

        <div className={Config.Css.css({ ...theme.typography.display, fontSize: 20, textWrap: "balance" })}>
          {article.name}
        </div>

        {article.desc ? (
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({
              display: "-webkit-box",
              WebkitLineClamp: PEREX_LINES,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBlockStart: 8,
              color: theme.color.mutedFg,
            })}
          >
            {article.desc}
          </Uu5Elements.Text>
        ) : null}
      </Card>
    );
  },
});

export default ArticleTile;
