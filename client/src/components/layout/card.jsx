import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";

const { theme } = Config;

// Karta webu = `Uu5Elements.Tile` nastavený propsy.
//
// `significance="subdued"` je z GDS jediná varianta, která dává PLOCHU S LINKOU A BEZ STÍNU
// (podklad + 1px rámeček). `common` by přidalo `elevationGround`, tedy stín, který předloha
// nikde nemá — plochy tu odděluje barva a linka, ne elevace. `borderRadius="moderate"` = 8 px,
// přesně `theme.radius`. Padding dává `SpacingProvider type="loose"` z app.jsx.
//
// `topStripe` je **červený proužek 3 px nahoře** — v předloze ho má karta zápasu, aby
// v mřížce odlišila to nejsledovanější. Kreslí se pseudoelementem, ne dalším elementem
// uvnitř, aby nezasahoval do vnitřního layoutu karty.

const STRIPE_HEIGHT = 3;

const Card = createVisualComponent({
  uu5Tag: Config.TAG + "Card",

  render(props) {
    const { topStripe, header, children, className, ...restProps } = props;

    return (
      <Uu5Elements.Tile
        {...restProps}
        header={header}
        colorScheme="building"
        significance="subdued"
        borderRadius="moderate"
        className={Config.Css.css({
          ...(topStripe && {
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              insetInlineStart: 0,
              insetInlineEnd: 0,
              insetBlockStart: 0,
              blockSize: STRIPE_HEIGHT,
              backgroundColor: theme.color.clubRed,
            },
          }),
        }) + (className ? " " + className : "")}
      >
        {children}
      </Uu5Elements.Tile>
    );
  },
});

export default Card;
