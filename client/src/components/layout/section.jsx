import { createVisualComponent, useScreenSize, BackgroundProvider, Utils } from "uu5g05";
import Config from "../../config/config.js";

const { theme } = Config;

// Obal sekce: podklad, vertikální rytmus a vycentrovaný kontejner.
//
// Celý web je tmavý, takže sekce se nestřídají světlá/tmavá jako u propertymanu — rytmus
// dělá **jemné diagonální šrafování** (`hatched`) a jednou za stránku ho přeruší plná
// červená plocha (`red`), která je vizuální těžiště. Viz design/ux-design-system.md, 1 a 4.

// Šrafování je opakovaný gradient, ne obrázek: je to pár bajtů CSS místo dalšího requestu
// a při zoomu se nerozmaže. Kontrast je schválně na hranici viditelnosti — má oddělit
// plochy, ne kreslit vzor.
const HATCH = `repeating-linear-gradient(45deg, ${theme.color.muted} 0 1px, transparent 1px 12px)`;

const VARIANT = {
  plain: { backgroundColor: theme.color.bg, color: theme.color.fg },
  hatched: { backgroundColor: theme.color.bg, backgroundImage: HATCH, color: theme.color.fg },
  red: { backgroundColor: theme.color.clubRed, color: theme.color.onRed },
};

const Section = createVisualComponent({
  uu5Tag: Config.TAG + "Section",

  render(props) {
    const { variant = "plain", padTop, padBottom, children } = props;
    const [screenSize] = useScreenSize();
    const isMobile = screenSize === "xs";

    // getAttrs, ne {...restProps} — viz komentář v eyebrow.jsx. `id` si getAttrs vezme
    // z props sám, takže se nepředává zvlášť.
    const attrs = Utils.VisualComponent.getAttrs(
      props,
      Config.Css.css({
        ...VARIANT[variant],
        paddingBlockStart: padTop ?? theme.sectionPad,
        paddingBlockEnd: padBottom ?? theme.sectionPad,
      }),
    );

    // Podklad se hlásí do kontextu, ne jen do CSS: uu5 komponenty uvnitř (tlačítka, ikony,
    // texty) si podle něj samy volí světlou/tmavou variantu z GDS. Bez toho by na tmavé
    // ploše renderovaly tak, jako by stály na bílé — což je u tmavého webu úplně všude.
    return (
      <BackgroundProvider background="dark">
        <section {...attrs}>
          <div
            className={Config.Css.css({
              // inlineSize: 100% je povinné: když si sekce nastaví display:flex (hero kvůli
              // svislému vycentrování), stane se z kontejneru flex položka a bez tohohle by
              // se smrskla na šířku obsahu.
              inlineSize: "100%",
              maxWidth: theme.maxWidth,
              marginInline: "auto",
              paddingInline: isMobile ? theme.gutter.xs : theme.gutter.s,
            })}
          >
            {children}
          </div>
        </section>
      </BackgroundProvider>
    );
  },
});

export default Section;
