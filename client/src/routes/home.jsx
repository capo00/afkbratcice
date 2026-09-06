import { Lsi, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Eyebrow from "../components/layout/eyebrow.jsx";
import Button from "../components/layout/button.jsx";
import WeekendProgram from "../components/home/weekend-program.jsx";
import LastResults from "../components/home/last-results.jsx";
import TablesSection from "../components/home/tables-section.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Úvodní stránka. Pořadí bloků drží předloha (design/frontend.md, 3.1):
// hero → statistiky → program víkendu → poslední výsledky → aktuality → tabulky → CTA.
//
// Aktuality tu zatím **nejsou**: čekají na entitu `article`. Blok se nepředstírá prázdným
// rámečkem — dokud nemá co ukázat, na stránce prostě není.

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
        src={Config.asset.logo}
        alt=""
        className={Config.Css.css({ inlineSize: 96, blockSize: 96, marginBlockEnd: 24 })}
      />
      <Heading level={1} bar={false} lsi={lsi("club", "name")} />
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
        <Button size="xl" onClick={() => setRoute("teams")} lsi={lsi("home", "hero", "teams")} />
        <Button size="xl" variant="outline" href="#program" lsi={lsi("home", "hero", "program")} />
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
      <div
        className={Config.Css.css({
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          textAlign: "center",
        })}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={Config.Css.css({
              padding: 24,
              border: `1px solid ${theme.color.border}`,
              borderRadius: theme.radius,
              backgroundColor: theme.color.card,
            })}
          >
            <Uu5Elements.Text category="expose" segment="default" type="lead">
              {({ style }) => (
                <div className={Config.Css.css({ ...style, ...theme.typography.display, color: theme.color.clubRed })}>
                  {item.value}
                </div>
              )}
            </Uu5Elements.Text>
            <Eyebrow className={Config.Css.css({ marginBlockStart: 8, marginBlockEnd: 0 })} lsi={item.lsi} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function CtaBand() {
  const { appConfig } = useApp();
  // Kontaktní stránka (`page?code=contact`) čeká na entitu `page`, takže výzva míří rovnou
  // na klubový e-mail z konfigurace. Bez e-mailu se tlačítko **neukáže** — pruh s výzvou
  // a mrtvým tlačítkem je horší než pruh se samotnou výzvou.
  const email = appConfig?.contact?.email;

  return (
    <Section variant="red">
      <div className={Config.Css.css({ textAlign: "center", display: "grid", gap: 16, justifyItems: "center" })}>
        <Heading bar={false} lsi={lsi("home", "cta", "header")} />
        <div className={Config.Css.css({ maxWidth: 560 })}>
          <Uu5Elements.Text category="interface" segment="content" type="large">
            <Lsi import={importLsi} path={["home", "cta", "perex"]} />
          </Uu5Elements.Text>
        </div>
        {email ? <Button onRed size="xl" href={`mailto:${email}`} lsi={lsi("home", "cta", "button")} /> : null}
      </div>
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
      <TablesSection />
      <CtaBand />
    </>
  );
}

export default Home;
