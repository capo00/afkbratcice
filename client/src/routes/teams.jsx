import { createVisualComponent, useDataObject, Lsi, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import TeamLogo from "../components/team-logo.jsx";
import EmptyState from "../components/empty-state.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Přehled mužstev — karta na každou kategorii, kterou klub v aktuálním ročníku má.
//
// Kategorie se **neberou z konfigurace**, ale ze `season/listCurrent` (přes app-context):
// složení mužstev se mění rok od roku a statický výčet by se musel opravovat ručně.
//
// Týmová fotka (`team.photoUri`) a perex (`team.desc`) jsou v návrhu, ale server je zatím
// nemá. Karta je proto vykresluje **podmíněně** — až pole přibudou, rozsvítí se samy;
// do té doby karta stojí na logu, soutěži a trenérovi a nemá prázdná místa.

function InfoRow({ icon, children }) {
  return (
    <div className={Config.Css.css({ display: "flex", gap: 8, alignItems: "baseline", color: theme.color.mutedFg })}>
      <Uu5Elements.Icon icon={icon} className={Config.Css.css({ color: theme.color.clubRed, flexShrink: 0 })} />
      <span>{children}</span>
    </div>
  );
}

function TeamCard({ category, coach }) {
  const { getTeam } = useApp();
  const team = getTeam(category.teamId);

  const header = (
    <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12 })}>
      <TeamLogo uri={team?.logoUri} size={40} alt="" />
      <div className={Config.Css.css({ minInlineSize: 0 })}>
        <Uu5Elements.Tag colorScheme="primary" significance="highlighted" size="s">
          <Lsi import={importLsi} path={["enum", "age", category.age]} />
        </Uu5Elements.Tag>
        <div className={Config.Css.css({ ...theme.typography.display, fontSize: 22, marginBlockStart: 4 })}>
          {team?.name ?? "—"}
        </div>
      </div>
    </div>
  );

  return (
    <Card header={header}>
      {team?.photoUri ? (
        <UiElements.Image
          src={team.photoUri}
          alt=""
          loading="lazy"
          className={Config.Css.css({
            inlineSize: "100%",
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: theme.radius,
            marginBlockEnd: 12,
          })}
        />
      ) : null}

      {team?.desc ? (
        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="medium"
          className={Config.Css.css({ display: "block", marginBlockEnd: 12, color: theme.color.mutedFg })}
        >
          {team.desc}
        </Uu5Elements.Text>
      ) : null}

      <div className={Config.Css.css({ display: "grid", gap: 8 })}>
        {category.competition ? <InfoRow icon="uugds-trophy">{category.competition}</InfoRow> : null}
        {coach ? (
          <InfoRow icon="uugds-user">
            {[coach.person?.name, coach.person?.surname].filter(Boolean).join(" ")}
          </InfoRow>
        ) : null}
      </div>
    </Card>
  );
}

const Teams = createVisualComponent({
  uu5Tag: Config.TAG + "Teams",

  render() {
    const { categoryList } = useApp();

    // Hlavní trenér ke každé kategorii. Jeden dotaz na tým — `coach/list` filtruje podle
    // `teamId`, ne podle seznamu, a mužstev jsou jednotky.
    const dataObject = useDataObject(
      {
        handlerMap: {
          load: async () => {
            const entries = await Promise.all(
              categoryList
                .filter((category) => category.teamId)
                .map((category) =>
                  UiElements.Call.cmdGet("/coach/list", { teamId: category.teamId, role: "headCoach", active: true })
                    .then((res) => [category.teamId, res?.itemList?.[0] ?? null])
                    // Chybějící trenér nesmí shodit celý přehled.
                    .catch(() => [category.teamId, null]),
                ),
            );
            return { coachByTeamId: Object.fromEntries(entries) };
          },
        },
      },
      [categoryList],
    );

    const coachByTeamId = useMemo(() => dataObject.data?.coachByTeamId ?? {}, [dataObject.data]);

    return (
      <Section>
        <Heading eyebrow={lsi("teams", "eyebrow")} lsi={lsi("teams", "header")} />

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {categoryList.length === 0 ? (
            <EmptyState lsi={lsi("teams", "empty")} icon="uugds-users" />
          ) : (
            <div
              className={Config.Css.css({
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              })}
            >
              {categoryList.map((category) => (
                <TeamCard key={category.seasonId} category={category} coach={coachByTeamId[category.teamId]} />
              ))}
            </div>
          )}
        </div>
      </Section>
    );
  },
});

export default Teams;
