import { createVisualComponent, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import Button from "../components/layout/button.jsx";
import TeamLogo from "../components/team-logo.jsx";
import EmptyState from "../components/empty-state.jsx";
import { useApp } from "../core/app-context.jsx";
import { personName } from "../core/person-name.js";

const { theme } = Config;

// Přehled mužstev — karta na každou kategorii, kterou klub v aktuálním ročníku má.
//
// Kategorie se **neberou z konfigurace**, ale ze `season/listCurrent` (přes app-context):
// složení mužstev se mění rok od roku a statický výčet by se musel opravovat ručně.
//
// Týmová fotka (`team.photoUri`) a perex (`team.desc`) jsou v návrhu, ale server je zatím
// nemá. Karta je proto vykresluje **podmíněně** — až pole přibudou, rozsvítí se samy;
// do té doby karta stojí na logu, soutěži a trenérech a nemá prázdná místa.
//
// Celá karta je proklik na detail mužstva (Caio 2026-11-21), stejně jako karta zápasu.

// Trenéři přicházejí se seznamem mužstev (`season/listCurrent` → `category.coachList`), takže
// karta má řádky trenérů od prvního vykreslení. Dřív se dotahovaly `management/list` po týmech:
// do jejich příchodu karta držela místo jen pro jeden řádek (počet trenérů seznam mužstev nenesl)
// a mužstvo s více trenéry pak naskočilo (CLS 0,031, 2026-11-26).
function TeamCard({ category }) {
  const coachList = category.coachList ?? [];
  const { getTeam } = useApp();
  const [, setRoute] = useRoute();
  const team = getTeam(category.teamId);

  const header = (
    <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12 })}>
      <TeamLogo uri={team?.logoUri} size={40} alt="" />
      <div className={Config.Css.css({ minInlineSize: 0 })}>
        <Uu5Elements.Tag colorScheme="primary" significance="highlighted" size="s">
          {category.categoryName ?? <Lsi import={importLsi} path={["enum", "age", category.age]} />}
        </Uu5Elements.Tag>
        <Heading level={3} className={Config.Css.css({ marginBlockStart: 4 })}>
          {team?.name ?? "—"}
        </Heading>
      </div>
    </div>
  );

  // Cesta na soupisku. Do lišty se **nedává** — položka Mužstva vede sem a výběr mužstva
  // patří na tuhle stránku, kde je vedle sebe logo, soutěž i trenéři (app.jsx, `useTop`).
  // Klikací je celá karta; tlačítko zůstává jako viditelná výzva (a pro klávesnici).
  const openDetail = category.teamId ? () => setRoute("muzstvo", { id: category.teamId }) : undefined;
  const detail = openDetail ? (
    <Button
      size="m"
      onClick={(e) => {
        // Klik na tlačítko by jinak probublal do karty a routa by se nastavila dvakrát.
        e.stopPropagation();
        openDetail();
      }}
      lsi={lsi("teams", "detail")}
    />
  ) : null;

  return (
    <Card header={header} footer={detail} footerSeparator onClick={openDetail}>
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

      {/* Soutěž a trenéři: `InfoGroup`, ne vlastní řádky s ikonou (review 1.3 B). Trenérů může
          být víc, každý má svůj řádek. */}
      <Uu5Elements.InfoGroup
        direction="vertical"
        size="m"
        itemList={[
          category.competition ? { icon: "uugds-favorites", colorScheme: "primary", title: category.competition } : null,
          ...coachList.map((coach) => ({ icon: "uugds-account", colorScheme: "primary", title: personName(coach.person) })),
        ].filter(Boolean)}
      />
    </Card>
  );
}

const Teams = createVisualComponent({
  uu5Tag: Config.TAG + "Teams",

  render() {
    const { categoryList } = useApp();

    return (
      <Section>
        <Heading eyebrow={lsi("teams", "eyebrow")} lsi={lsi("teams", "header")} />

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {categoryList.length === 0 ? (
            <EmptyState lsi={lsi("teams", "empty")} icon="uugds-account-multi" />
          ) : (
            <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))">
              {categoryList.map((category) => (
                <TeamCard key={`${category.seasonId}:${category.teamId}`} category={category} />
              ))}
            </Uu5Elements.Grid>
          )}
        </div>
      </Section>
    );
  },
});

export default Teams;
