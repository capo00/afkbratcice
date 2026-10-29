import { createVisualComponent, useRoute, useLsi, useDataObject, useMemo, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "../../tools/caio-ui.js";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import TeamLogo from "../team-logo.jsx";
import SeasonSelect from "../season-select.jsx";
import NoticeBar from "../layout/notice-bar.jsx";
import EmptyState from "../empty-state.jsx";
import { useApp } from "../../core/app-context.jsx";
import { usePageTitle } from "../../tools/page-meta.js";

const { theme } = Config;

// Společná hlavička čtyř rout jednoho mužstva (soupiska, zápasy, tabulka, statistiky):
// erb, název, kategorie, přepínač sezóny a záložky. Je to **jedna komponenta, ne čtyři
// kopie** — jinak by se hlavička rozešla, jakmile se v jedné z nich něco změní.
//
// Záložky vedou jen na **hotové** routy. `Tabulka` navíc odpadá u soutěží bez tabulky
// (`hasTable: false`, typicky stará garda) — prázdná záložka by jen mátla.
//
// **Sezónu určuje shell, ne záložky** (Caio 2026-10-28). Bez `seasonId` v adrese platí
// letošní sezóna mužstva (`category.seasonId` z app-contextu), u archivního mužstva bez
// letošní kategorie jeho nejnovější sezóna -- tatáž, kterou ukazuje přepínač. Záložky
// dostanou vždy konkrétní `seasonId`; dřív si ji tabulka a statistiky dohledávaly na
// serveru, ale zápasy ne, a bez sezóny v adrese ukazovaly celou historii.

const TAB_LIST = [
  { route: "muzstvo", code: "roster" },
  { route: "muzstvo/zapasy", code: "matches" },
  { route: "muzstvo/tabulka", code: "table", needsTable: true },
  { route: "muzstvo/statistiky", code: "stats" },
];

const TeamShell = createVisualComponent({
  uu5Tag: Config.TAG + "TeamShell",

  render({ children }) {
    const [route, setRoute] = useRoute();
    const { getTeam, categoryList } = useApp();
    // Popisky záložek jako **řetězce**, ne `<Lsi>`: verzálky se dělají `toUpperCase()`
    // nad textem, a to jde jen s hotovým překladem. `Tabs` prop na `textTransform` nemá.
    const tabLsi = useLsi(importLsi, ["team", "tab"]);

    const teamId = route?.params?.id;
    const routeSeasonId = route?.params?.seasonId;
    const team = getTeam(teamId);
    // Kategorie aktuálního ročníku; v archivu (jiná sezóna) nemusí existovat, a to je
    // v pořádku — routa je klíčovaná `teamId`, ne kategorií, takže odkazy přežijí i to,
    // že mužstvo letos není.
    const category = categoryList.find((item) => item.teamId === teamId);

    // Sezóny, ve kterých mužstvo hrálo -- pro přepínač i pro výchozí sezónu archivu.
    const seasonDataObject = useDataObject(
      {
        handlerMap: {
          load: () =>
            teamId ? UiElements.Call.cmdGet("/season/list", { teamId }) : Promise.resolve({ itemList: [] }),
        },
      },
      [teamId],
    );
    const seasonList = useMemo(() => {
      const list = [...(seasonDataObject.data?.itemList ?? [])];
      // Nejnovější první — archiv se prochází odzadu.
      list.sort((a, b) => String(b.yearFrom ?? "").localeCompare(String(a.yearFrom ?? "")));
      return list;
    }, [seasonDataObject.data]);

    const seasonId = routeSeasonId ?? category?.seasonId ?? seasonList[0]?.id;
    // Archivní mužstvo bez sezóny v adrese: dokud se seznam sezón nenačte, záložky by se
    // ptaly bez sezóny, tedy na celou historii.
    const seasonPending = !seasonId && seasonDataObject.state === "pendingNoData";

    // „A (Muži) – Soupiska"; archivní mužstvo bez letošní kategorie jménem týmu.
    const activeTab = TAB_LIST.find((tab) => tab.route === route?.uu5Route);
    const teamLabel = category?.categoryName ?? team?.name;
    usePageTitle({
      title: teamLabel ? [teamLabel, activeTab ? tabLsi[activeTab.code] : null].filter(Boolean).join(" – ") : null,
      description: category?.competition ? `${teamLabel} AFK Bratčice – ${category.competition}.` : null,
    });

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
                  {category.categoryName ?? <Lsi import={importLsi} path={["enum", "age", category.age]} />}
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
              seasonList={seasonList}
              seasonId={seasonId}
              onChange={(season) => setRoute(activeRoute, { id: teamId, seasonId: season.id })}
            />
          </div>

          {/* Upozornění redakce („trénink v pátek v 17:00") patří sem, ne nad celý web:
              týká se mužstva a čte ho ten, kdo si otevřel jeho stránku. Nad hlavičkou
              proto ne — pod ní, kde už je jasné, o čí mužstvo jde. */}
          <NoticeBar className={Config.Css.css({ marginBlockStart: 16 })} />

          {/* Čtyři pohledy na jedno mužstvo jsou záložky, ne řada tlačítek — `Tabs` k tomu
              dá `role="tab"` a ovládání šipkami. `displayBottomLine={false}`, protože linku
              pod hlavičkou tu předloha nemá; dřív se kreslila vlastním `borderBlockEnd`.
              Obsah záložky dodává **router**, ne `Tabs`, takže položky nemají `children`
              a panel zůstane prázdný — `code` je rovnou cílová routa. */}
          <Uu5Elements.Tabs
            activeCode={activeRoute}
            // `displayBottomLine` platí **jen pro `type="line"`** — u výchozího `card-inner`
            // se ignoruje a linku stejně nakreslí `&:after` v hlavičce. Obojí musí být spolu.
            type="line"
            displayBottomLine={false}
            colorScheme="primary"
            onChange={(e) => setRoute(e.data.activeCode, { id: teamId, seasonId: routeSeasonId })}
            itemList={tabList.map((tab) => ({
              code: tab.route,
              label: (tabLsi[tab.code] ?? tab.code).toUpperCase(),
            }))}
            className={Config.Css.css({ marginBlockStart: 24 })}
          />
        </Section>

        {seasonPending ? (
          <Section>
            <Uu5Elements.Skeleton height={200} />
          </Section>
        ) : (
          children({ teamId, seasonId, team, category })
        )}
      </>
    );
  },
});

export default TeamShell;
