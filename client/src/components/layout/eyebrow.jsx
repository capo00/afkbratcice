import { createVisualComponent, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";

const { theme } = Config;

// Prostrkaný červený štítek nad nadpisem sekce: PROGRAM, KOLO ZA KOLEM, NOVINKY Z KLUBU…
// Drobnost, ale drží rytmus celé stránky — v předloze je nad každou sekcí.
//
// Velikost bere z GDS (`interface/highlight/small`, 12/14), zbytek — prostrkání, verzálky,
// klubová červená a váha 700 — z theme; tyhle vlastnosti GDS jako tokeny nemá.
//
// Atributy pro DOM se skládají přes `Utils.VisualComponent.getAttrs`, ne rozbalením
// restProps: `createVisualComponent` komponentě dosype vlastní props (nestingLevel, testId,
// noPrint, elementAttrs…) a ty na <p> nepatří — React na nich hlásí "React does not
// recognize the ... prop on a DOM element". getAttrs vrátí jen to, co do DOM smí, a rovnou
// zaplete className volajícího za náš.

const Eyebrow = createVisualComponent({
  uu5Tag: Config.TAG + "Eyebrow",

  render(props) {
    const { children, lsi } = props;

    return (
      <Uu5Elements.Text category="interface" segment="highlight" type="small">
        {({ style }) => {
          const attrs = Utils.VisualComponent.getAttrs(
            props,
            Config.Css.css({
              ...style,
              ...theme.typography.eyebrow,
              margin: 0,
              marginBlockEnd: 8,
            }),
          );

          return <p {...attrs}>{lsi ? <Lsi lsi={lsi} /> : children}</p>;
        }}
      </Uu5Elements.Text>
    );
  },
});

export default Eyebrow;
