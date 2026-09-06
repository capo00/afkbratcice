import { createVisualComponent, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import TeamLogo from "../team-logo.jsx";
import SeasonSelect from "../season-select.jsx";
import EmptyState from "../empty-state.jsx";
import { useApp } from "../../core/app-context.jsx";

const { theme } = Config;

// Společná hlavička čtyř rout jednoho mužstva (soupiska, zápasy, tabulka, statistiky):
// erb, název, kategorie, přepínač sezóny a záložky. Je to **jedna komponenta, ne čtyři
// kopie** — jinak by se hlavička rozešla, jakmile se v jedné z nich něco změní.
//
// Záložky vedou jen na **hotové** routy. `Tabulka` navíc odpadá u soutěží bez tabulky
// (`hasTable: false`, typicky stará garda) — prázdná záložka by jen mátla.

const TAB_LIST = [
  { route: "team", code: "roster" },
  { route: "team/matches", code: "matches" },
  { route: "team/table", code: "table", needsTable: true },
  { route: "team/stats", code: "stats" },
];

const TeamShell = createVisualComponent({
  uu5Tag: Config.TAG + "TeamShell",

  render({ children }) {
    const [route, setRoute] = useRoute();
    const { getTeam, categoryList } = useApp();

    const teamId = route?.params?.id;
    const seasonId = route?.params?.seasonId;
    const team = getTeam(teamId);
    // Kategorie aktuálního ročníku; v archivu (jiná sezóna) nemusí existovat, a to je
    // v pořádku — routa je klíčovaná `teamId`, ne kategorií, takže odkazy přežijí i to,
    // že mužstvo letos není.
    const category = categoryList.find((item) => item.teamId === teamId);

    if (!teamId) {
      return (
        <Section>
          <EmptyState lsi={lsi("team", "missing")} icon="uugds-alert-circle" />
        </Section>
      );
    }

    const activeRoute = route?.uu5Route;
    const tabList = TAB_LIST.filter((tab) => !tab.needsTable || category?.hasTable !== false);

    return (
      <>
        <Section padBottom={0}>
          <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" })}>
            <TeamLogo uri={team?.logoUri} size={56} alt="" />
            <div className={Config.Css.css({ flexGrow: 1, minInlineSize: 0 })}>
              {category ? (
                <Uu5Elements.Tag colorScheme="primary" significance="highlighted" size="s">
                  <Lsi import={importLsi} path={["enum", "age", category.age]} />
                </Uu5Elements.Tag>
              ) : null}
              <div className={Config.Css.css({ ...theme.typography.display, fontSize: 32, marginBlockStart: 4 })}>
                {team?.name ?? "—"}
              </div>
              {category?.competition ? (
                <Uu5Elements.Text
                  category="interface"
                  segment="content"
                  type="medium"
                  className={Config.Css.css({ color: theme.color.mutedFg })}
                >
                  {category.competition}
                </Uu5Elements.Text>
              ) : null}
            </div>

            <SeasonSelect
              teamId={teamId}
              seasonId={seasonId}
              onChange={(season) => setRoute(activeRoute, { id: teamId, seasonId: season.id })}
            />
          </div>

          <div
            className={Config.Css.css({
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBlockStart: 24,
              borderBlockEnd: `1px solid ${theme.color.border}`,
              paddingBlockEnd: 12,
            })}
          >
            {tabList.map((tab) => (
              <Uu5Elements.Button
                key={tab.route}
                colorScheme="primary"
                significance={tab.route === activeRoute ? "highlighted" : "subdued"}
                borderRadius="moderate"
                onClick={() => setRoute(tab.route, { id: teamId, seasonId })}
                className={Config.Css.css({
                  fontFamily: theme.font.display,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                })}
              >
                <Lsi import={importLsi} path={["team", "tab", tab.code]} />
              </Uu5Elements.Button>
            ))}
          </div>
        </Section>

        {children({ teamId, seasonId, team, category })}
      </>
    );
  },
});

export default TeamShell;
