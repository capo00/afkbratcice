import { createVisualComponent, useDataObject, useRoute, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import EmptyState from "../components/empty-state.jsx";
import DataState from "../components/data-state.jsx";
import { HighlightsProvider, useHighlightsContext } from "../components/highlights/parts.jsx";
import { Balance, FormAndStreaks, Records, HallOfFame, PlayerRanks } from "../components/highlights/sections.jsx";
import { fill } from "../components/highlights/format.js";
import { seasonYears } from "../core/season-label.js";
import { usePageTitle } from "../tools/page-meta.js";

const { theme } = Config;
const Css = Config.Css.css;

// Klub → Zajímavosti (review 2026-11-12, Top 10 #9): bilance, rekordy, série a žebříčky hráčů
// jednoho našeho mužstva za celou historii. Jen soutěžní zápasy, stejně jako tabulka.
//
// **Po kategoriích** (Caio 2026-11-18): `zajimavosti?kategorie=men-a`. Bez parametru vybere
// kategorii server (zatím muži A); kategorie je vždy vidět vedle nadpisu. Přepínač kategorií
// tu zatím není, protože jiná kategorie historii nemá.
//
// Všechno spočítá jeden use case `stats/getHighlights` a drží v paměti (server/stats/highlights.js).

function PageHeader({ category }) {
  const { data, text, season } = useHighlightsContext();
  const firstSeason = season(data.highlights?.firstSeasonId);
  return (
    <Section padBottom={0}>
      <div className={Css({ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" })}>
        <Heading as="h1" eyebrow={lsi("highlights", "eyebrow")}>
          {text.header}
        </Heading>
        {category ? (
          <Uu5Elements.Tag colorScheme="primary" significance="highlighted" size="s" className={Css({ marginBlockEnd: 8 })}>
            {category.name}
          </Uu5Elements.Tag>
        ) : null}
      </div>
      {firstSeason ? (
        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="medium"
          className={Css({ display: "block", color: theme.color.mutedFg, marginBlockStart: 8 })}
        >
          {fill(text.subtitle, { season: seasonYears(firstSeason) })}
        </Uu5Elements.Text>
      ) : null}
    </Section>
  );
}

function Content({ data }) {
  if (!data.highlights) {
    return (
      <>
        <PageHeader category={data.category} />
        <Section>
          <EmptyState lsi={lsi("highlights", data.team ? "empty" : "noTeam")} icon="uugds-view-list" />
        </Section>
      </>
    );
  }
  return (
    <>
      <PageHeader category={data.category} />
      <Balance />
      <FormAndStreaks />
      <Records />
      <HallOfFame />
      <PlayerRanks />
    </>
  );
}

const Zajimavosti = createVisualComponent({
  uu5Tag: Config.TAG + "Zajimavosti",

  render() {
    const [route] = useRoute();
    const category = route?.params?.kategorie;
    const header = useLsi(importLsi, ["highlights", "header"]);

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () => UiElements.Call.cmdGet("/stats/getHighlights", category ? { category } : {}),
        },
      },
      [category],
    );
    const { state, data } = dataObject;

    usePageTitle({
      title: data?.category ? `${header} · ${data.category.name}` : null,
      description: data?.category ? `Rekordy, série a nejlepší hráči AFK Bratčice – ${data.category.name}.` : undefined,
    });

    if (state === "ready" && !data?.category) {
      return (
        <Section>
          <Heading as="h1" eyebrow={lsi("highlights", "eyebrow")}>
            {header}
          </Heading>
          <EmptyState lsi={lsi("highlights", "missing")} icon="uugds-view-list" />
        </Section>
      );
    }

    return (
      <DataState dataObject={dataObject} height={480}>
        {() => (
          <HighlightsProvider data={data}>
            <Content data={data} />
          </HighlightsProvider>
        )}
      </DataState>
    );
  },
});

export default Zajimavosti;
