import { Lsi, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Eyebrow from "../components/layout/eyebrow.jsx";
import Button from "../components/layout/button.jsx";
import Card from "../components/layout/card.jsx";
import WeekendProgram from "../components/home/weekend-program.jsx";
import LastResults from "../components/home/last-results.jsx";
import NewsSection from "../components/home/news-section.jsx";
import TablesSection from "../components/home/tables-section.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Úvodní stránka. Pořadí bloků drží předloha (design/frontend.md, 3.1):
// hero → statistiky → program víkendu → poslední výsledky → aktuality → tabulky → CTA.
//
// Blok aktualit se sám nevykreslí, dokud není co ukázat — prázdný rámeček s hláškou patří
// do výpisu novinek, kam čtenář přišel schválně, ne na home mezi program a tabulky.

function Hero() {
  const [, setRoute] = useRoute();

  return (
    <Section
      variant="plain"
      padTop={96}
      padBottom={96}
      className={Config.Css.css({
        // Fullbleed foto s tmavým překryvem doplní etapa s médii; do té doby drží hero
        // pozornost jemným radiálním přechodem od klubové červené, ne prázdnou plochou.
        backgroundImage: `radial-gradient(120% 100% at 50% 0%, ${theme.color.accent} 0%, ${theme.color.bg} 60%)`,
        textAlign: "center",
      })}
    >
      <img
        src={Config.asset.logoTransparent}
        alt={lsi("club", "name")}
        className={Config.Css.css({ inlineSize: 180, blockSize: 180, marginBlockEnd: 24 })}
      />
      <Heading level={1} bar={false} lsi={lsi("club", "name")} style={{ fontSize: 96, lineHeight: "normal" }} />
      <Eyebrow className={Config.Css.css({ marginBlockStart: 12 })} lsi={lsi("club", "since")} />

      <div className={Config.Css.css({ maxWidth: 640, marginInline: "auto", marginBlockStart: 16 })}>
        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="large"
          className={Config.Css.css({ color: theme.color.mutedFg })}
        >
          <Lsi import={importLsi} path={["home", "hero", "perex"]} />
        </Uu5Elements.Text>
      </div>

      <div
        className={Config.Css.css({
          marginBlockStart: 32,
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        })}
      >
        <Button size="xl" onClick={() => setRoute("muzstva")} lsi={lsi("home", "hero", "teams")} />
        <Button size="xl" significance="distinct" href="#program" lsi={lsi("home", "hero", "program")} />
      </div>
    </Section>
  );
}

// Tři dlaždice přes hero: rok založení, počet mužstev, léta tradice. Dvě ze tří jsou
// **dopočítané z dat**, ne napsané — počet mužstev je délka `categoryList`, léta tradice
// vychází z `founded`. Číslo, které nikdo neaktualizuje, zestárne dřív než web.
function Stats() {
  const { appConfig, categoryList } = useApp();
  const founded = appConfig?.founded ?? 1932;
  const years = new Date().getFullYear() - founded;

  const items = [
    { value: founded, lsi: lsi("home", "stats", "founded") },
    { value: categoryList.length, lsi: lsi("home", "stats", "teams") },
    { value: `${years}+`, lsi: lsi("home", "stats", "years") },
  ];

  return (
    <Section variant="hatched" padTop={40} padBottom={40}>
      {/* `auto-fit`, ne `auto-fill`: dlaždice jsou tři a mají se roztáhnout přes celou
          šířku sekce, ne se schoulit vlevo a nechat za sebou prázdné sloupce. */}
      <Uu5Elements.Grid
        templateColumns="repeat(auto-fit, minmax(180px, 1fr))"
        className={Config.Css.css({ textAlign: "center" })}
      >
        {items.map((item, index) => (
          <Card key={index}>
            <Uu5Elements.Text category="expose" segment="default" type="lead">
              {({ style }) => (
                <div className={Config.Css.css({ ...style, ...theme.typography.display, color: theme.color.clubRed })}>
                  {item.value}
                </div>
              )}
            </Uu5Elements.Text>
            <Eyebrow className={Config.Css.css({ marginBlockStart: 8, marginBlockEnd: 0 })} lsi={item.lsi} />
          </Card>
        ))}
      </Uu5Elements.Grid>
    </Section>
  );
}

function CtaBand() {
  const [, setRoute] = useRoute();

  return (
    <Section variant="red">
      <Uu5Elements.Grid
        justifyItems="center"
        rowGap={16}
        className={Config.Css.css({ textAlign: "center" })}
      >
        <Heading bar={false} lsi={lsi("home", "cta", "header")} />
        <div className={Config.Css.css({ maxWidth: 560 })}>
          <Uu5Elements.Text category="interface" segment="content" type="large">
            <Lsi import={importLsi} path={["home", "cta", "perex"]} />
          </Uu5Elements.Text>
        </div>
        <Button onRed size="xl" onClick={() => setRoute("kontakt")} lsi={lsi("home", "cta", "button")} />
      </Uu5Elements.Grid>
    </Section>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <WeekendProgram />
      <LastResults />
      <NewsSection />
      <TablesSection />
      <CtaBand />
    </>
  );
}

export default Home;
