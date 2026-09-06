import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";

const { theme } = Config;

// Tlačítko webu. Je to `Uu5Elements.Button` nastavený PROPSY — výška, rádius, padding,
// tučnost ani zalamování se nepřebíjí, berou se z GDS tak, jak jsou.
//
// Přidávají se dvě věci:
//
// 1. **Varianta.** `solid` = plné červené (GDS `highlighted` nad `primary`, které main.jsx
//    přebarvil na klubovou červenou), `outline` = rámeček (`distinct`). Na červené sekci
//    (`Section variant="red"`) by červené tlačítko zmizelo, takže se tam přepíná na
//    `building` — GDS pro něj dá světlou výplň s tmavým textem, což je přesně předloha.
//    Podklad se nepředává propem, čte se z kontextu (`BackgroundProvider` v `Section`)…
//    ale `useBackground()` vrací jen "light"/"dark", a červená je dark taky. Proto explicitní
//    `onRed` — je to jediné místo, kde kontext nestačí.
//
// 2. **Písmo.** GDS sází text tlačítka `interface/interactive`, což je Barlow; předloha má
//    tlačítka Bebasem s prostrkáním. Font ani prostrkání token nemají, takže se přimíchávají
//    z theme — velikost zůstává z GDS.
//
// `size="l"` je 40 px, `xl` 48 px; předloha má CTA na hero ve `xl`, ostatní v `l`.

const SIGNIFICANCE = {
  solid: "highlighted",
  outline: "distinct",
};

const Button = createVisualComponent({
  uu5Tag: Config.TAG + "Button",

  render(props) {
    const { variant = "solid", size = "l", onRed, children, lsi, className, ...restProps } = props;

    return (
      <Uu5Elements.Button
        {...restProps}
        size={size}
        colorScheme={onRed ? "building" : "primary"}
        significance={SIGNIFICANCE[variant]}
        borderRadius="moderate"
        className={
          Config.Css.css({
            fontFamily: theme.font.display,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }) + (className ? " " + className : "")
        }
      >
        {lsi ? <Lsi lsi={lsi} /> : children}
      </Uu5Elements.Button>
    );
  },
});

export default Button;
