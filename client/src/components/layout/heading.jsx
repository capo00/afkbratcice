import { createVisualComponent, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import Eyebrow from "./eyebrow.jsx";

const { theme } = Config;

// Nadpis. Stupně sazby dává `Uu5Elements.Text` z GDS, značku a písmo si drží web.
//
// `children` jako funkce je pro tohle přímo určená cesta: Text spočítá typografii a předá ji
// jako `style`, ale renderování nechá na nás — takže je z toho skutečné <hN>, ne <span>
// (`Text` sám vyrábí <hN> jen u `type="h1".."h5"`, a `expose/hero` pro hero headline by byl
// <span> bez osnovy dokumentu).
//
// Co se ke GDS stylu přimíchává z theme: `fontFamily`, `letterSpacing`, `textTransform`
// a `fontWeight: 400`. Font ani prostrkání v GDS typografii žádný token nemají a Bebas Neue
// existuje jen v jedné váze — bez explicitní 400 by prohlížeč tučnost, kterou GDS u `hero`
// a `h5` chce (700), **nasyntetizoval** a písmo by ztloustlo a rozmazalo se.
// **Velikost se nepřepisuje nikdy** (design/ux-design-system.md, 2.1).
//
// Stupně nastavuje `level`, značku `as` — vizuálně velký nadpis tak může být v osnově
// správně zanořený. Mobilní zmenšení se neřeší: GDS má vlastní `smallScreen` sadu
// a `Typography.getValue` si mezi nimi vybírá sama.

const TYPOGRAPHY = {
  // Hero headline. `expose` je v GDS kategorie pro expresivní text, který má upoutat.
  1: { category: "expose", segment: "default", type: "hero" },
  // Nadpisy sekcí.
  2: { category: "interface", segment: "title", type: "main" },
  // Titulky karet a dlaždic.
  3: { category: "story", segment: "heading", type: "h5" },
};

// Červený svislý pruh vlevo od nadpisu sekce. V předloze je u každého `h2` a spolu
// s eyebrow tvoří celý rytmus stránky.
const BAR_WIDTH = 4;
const BAR_GAP = 16;

const Heading = createVisualComponent({
  uu5Tag: Config.TAG + "Heading",

  render(props) {
    const { level = 2, as, bar = level === 2, eyebrow, children, lsi } = props;
    const Tag = as || `h${level}`;
    const typography = TYPOGRAPHY[level] ?? TYPOGRAPHY[2];

    return (
      <Uu5Elements.Text {...typography}>
        {({ style }) => {
          const attrs = Utils.VisualComponent.getAttrs(
            props,
            Config.Css.css({
              ...style,
              ...theme.typography.display,
              margin: 0,
              textWrap: "balance",
              // Pruh je pseudoelement, ne další <div>: nadpis tak zůstane jeden element
              // s jedním textovým obsahem (osnova, čtečky, výběr textu).
              ...(bar && {
                position: "relative",
                paddingInlineStart: BAR_WIDTH + BAR_GAP,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  insetInlineStart: 0,
                  insetBlock: 0,
                  inlineSize: BAR_WIDTH,
                  backgroundColor: theme.color.clubRed,
                },
              }),
            }),
          );

          const heading = <Tag {...attrs}>{lsi ? <Lsi lsi={lsi} /> : children}</Tag>;

          // Eyebrow se odsazuje o šířku pruhu, aby stál na stejné svislici jako text nadpisu.
          if (!eyebrow) return heading;
          return (
            <div>
              <Eyebrow
                lsi={eyebrow}
                className={bar ? Config.Css.css({ paddingInlineStart: BAR_WIDTH + BAR_GAP }) : undefined}
              />
              {heading}
            </div>
          );
        }}
      </Uu5Elements.Text>
    );
  },
});

export default Heading;
