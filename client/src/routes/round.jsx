import { createVisualComponent, useDataObject, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import MatchTile from "../components/match-tile.jsx";
import EmptyState from "../components/empty-state.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Kolo v soutěži — všechny zápasy jednoho kola, ne jen naše.
//
// Je to jeden ze tří pohledů na zápasy (design/frontend.md, 2.4) a odpovídá na otázku
// „jak dopadli ostatní". Server na něj nemá vlastní use case: je to `match/list` s jinými
// filtry, protože kolo, program víkendu i vzájemné zápasy jsou pořád jen jiný výřez
// z téže kolekce.

const Round = createVisualComponent({
  uu5Tag: Config.TAG + "Round",

  render() {
    const [route, setRoute] = useRoute();
    const { seasonId, round } = route?.params ?? {};
    const { categoryList } = useApp();

    const category = categoryList.find((item) => item.seasonId === seasonId);

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () =>
            seasonId && round
              ? UiElements.Call.cmdGet("/match/list", { seasonId, round })
              : Promise.resolve({ itemList: [] }),
        },
      },
      [seasonId, round],
    );

    const { state, data } = dataObject;
    const itemList = data?.itemList ?? [];

    if (!seasonId || !round) {
      return (
        <Section>
          <EmptyState lsi={lsi("round", "missing")} icon="uugds-calendar" />
        </Section>
      );
    }

    return (
      <Section>
        <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12 })}>
          {category ? (
            <Uu5Elements.Button
              icon="uugds-chevron-left"
              significance="subdued"
              onClick={() => setRoute("muzstvo/zapasy", { id: category.teamId, seasonId })}
              tooltip="Zpět na zápasy mužstva"
            />
          ) : null}
          <Heading eyebrow={lsi("round", "eyebrow")}>
            <Lsi import={importLsi} path={["match", "round"]} params={{ round }} />
          </Heading>
        </div>

        {category?.competition ? (
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({ display: "block", marginBlockStart: 8, color: theme.color.mutedFg })}
          >
            {category.competition}
          </Uu5Elements.Text>
        ) : null}

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {state === "pendingNoData" ? (
            <Uu5Elements.Skeleton height={200} />
          ) : itemList.length === 0 ? (
            <EmptyState lsi={lsi("round", "empty")} icon="uugds-calendar" />
          ) : (
            <div
              className={Config.Css.css({
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              })}
            >
              {itemList.map((match) => (
                <MatchTile key={match.id} match={match} ownTeamId={category?.teamId} />
              ))}
            </div>
          )}
        </div>
      </Section>
    );
  },
});

export default Round;
