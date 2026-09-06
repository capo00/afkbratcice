import { createVisualComponent, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Button from "../components/layout/button.jsx";

// 404 s odkazy na hlavní sekce.
//
// Odkazy jsou tu schválně: na tuhle obrazovku se návštěvník dostane hlavně ze starého webu
// (URL, které legacy přesměrování nezná) a z vyhledávače. Prázdná stránka „nenalezeno" by ho
// poslala pryč; tři odkazy ho vrátí do webu.

const LINKS = [
  { route: "", lsi: lsi("header", "nav", "home") },
  { route: "teams", lsi: lsi("header", "nav", "teams") },
];

const NotFound = createVisualComponent({
  uu5Tag: Config.TAG + "NotFound",

  render() {
    const [, setRoute] = useRoute();

    return (
      <Section padTop={96} padBottom={96}>
        <div className={Config.Css.css({ textAlign: "center", display: "grid", gap: 24, justifyItems: "center" })}>
          <Heading level={1} bar={false} lsi={lsi("notFound", "header")} />
          {/* Perex je věta, ne nadpis — Heading by ji vysázel verzálkami Bebasem
              a vypadala by jako druhý titulek. */}
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="large"
            className={Config.Css.css({ color: Config.theme.color.mutedFg })}
          >
            <Lsi import={importLsi} path={["notFound", "perex"]} />
          </Uu5Elements.Text>
          <div className={Config.Css.css({ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" })}>
            {LINKS.map((link) => (
              <Button key={link.route || "home"} variant="outline" onClick={() => setRoute(link.route)} lsi={link.lsi} />
            ))}
          </div>
        </div>
      </Section>
    );
  },
});

export default NotFound;
