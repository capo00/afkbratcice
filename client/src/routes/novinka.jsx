import { createVisualComponent, useDataObject, useRoute, Content } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import TeamLogo from "../components/team-logo.jsx";
import DateText from "../components/date-text.jsx";
import EmptyState from "../components/empty-state.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Detail novinky.
//
// Obsah je **`sectionList` — pole objektů sekcí s `uu5String` v `content`** — a vykresluje
// ho `Uu5.Content`, stejně jako obsahové stránky. Proti `Utils.Uu5String.toChildren()` řeší
// nesting level a `fallback`, takže překlep ve značce zobrazí chybu na svém místě místo
// toho, aby shodil celý článek.
//
// Sekce se renderují za sebou bez oddělovače: je to jeden text rozdělený na kusy kvůli
// editaci, ne kapitoly.

const MAX_TEXT_WIDTH = 720;

// Rytmus dlouhého textu. Cílí se na potomky, protože značky vyrábí uu5String, ne my —
// stejná sada jako v `routes/page.jsx`.
const PROSE = {
  "& p": { marginBlock: "0 1em", lineHeight: 1.6 },
  "& h3": { ...theme.typography.display, fontSize: 22, marginBlock: "1.5em 0.5em" },
  "& ul, & ol": { paddingInlineStart: "1.25em", lineHeight: 1.7 },
  "& li": { marginBlockEnd: "0.25em" },
  "& a": { color: theme.color.clubRed },
  "& img": { maxInlineSize: "100%", blockSize: "auto", borderRadius: theme.radius },
};

/** Panel s výsledkem u reportu ze zápasu. Odkaz vede na detail, ne na kolo. */
function MatchPanel({ match }) {
  const [, setRoute] = useRoute();
  const { getTeam } = useApp();
  const played = Number.isFinite(match.homeGoals) && Number.isFinite(match.guestGoals);
  const home = getTeam(match.homeTeamId);
  const guest = getTeam(match.guestTeamId);

  return (
    <Card topStripe onClick={() => setRoute("zapas", { id: match.id })}>
      <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" })}>
        <TeamLogo uri={home?.logoUri} size={32} alt="" />
        <span className={Config.Css.css({ ...theme.typography.display, fontSize: 18 })}>
          {home?.name ?? "—"} {played ? `${match.homeGoals} : ${match.guestGoals}` : "–"} {guest?.name ?? "—"}
        </span>
        <TeamLogo uri={guest?.logoUri} size={32} alt="" />
        <span className={Config.Css.css({ marginInlineStart: "auto", color: theme.color.mutedFg })}>
          <Uu5Elements.Icon icon="uugds-calendar" /> <DateText value={match.time} />
        </span>
      </div>
    </Card>
  );
}

const Novinka = createVisualComponent({
  uu5Tag: Config.TAG + "Novinka",

  render() {
    const [route] = useRoute();
    const id = route?.params?.id;

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () => (id ? UiElements.Call.cmdGet("/article/get", { id }) : Promise.resolve(null)),
        },
      },
      [id],
    );

    const { state, data } = dataObject;

    if (state === "pendingNoData") {
      return (
        <Section>
          <Uu5Elements.Skeleton height={320} />
        </Section>
      );
    }

    if (!data?.id) {
      return (
        <Section>
          <EmptyState lsi={lsi("news", "missing")} icon="uugdsstencil-communication-megaphone" />
        </Section>
      );
    }

    const article = data;

    return (
      <Section>
        <div className={Config.Css.css({ maxWidth: MAX_TEXT_WIDTH })}>
          <Heading>{article.name}</Heading>

          <div
            className={Config.Css.css({
              marginBlockStart: 12,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              color: theme.color.mutedFg,
            })}
          >
            <span>
              <Uu5Elements.Icon icon="uugds-calendar" /> <DateText value={article.publishTime} type="dateLong" />
            </span>
            {article.author ? (
              <span>
                <Uu5Elements.Icon icon="uugds-account" /> {article.author}
              </span>
            ) : null}
            {(article.tagList ?? []).map((tag) => (
              <Uu5Elements.Tag key={tag} colorScheme="primary" significance="distinct" size="s">
                {tag}
              </Uu5Elements.Tag>
            ))}
          </div>

          {article.photographUri ? (
            <UiElements.Image
              src={article.photographUri}
              alt=""
              className={Config.Css.css({
                marginBlockStart: 24,
                inlineSize: "100%",
                borderRadius: theme.radius,
              })}
            />
          ) : null}

          {article.desc ? (
            <Uu5Elements.Text
              category="interface"
              segment="content"
              type="large"
              className={Config.Css.css({ display: "block", marginBlockStart: 24, fontWeight: 600 })}
            >
              {article.desc}
            </Uu5Elements.Text>
          ) : null}

          {article.match ? (
            <div className={Config.Css.css({ marginBlockStart: 24 })}>
              <MatchPanel match={article.match} />
            </div>
          ) : null}

          <div className={Config.Css.css({ marginBlockStart: 24, ...PROSE })}>
            {(article.sectionList ?? []).map((section, index) => (
              // Index jako klíč je tu v pořádku: sekce nemají id a pořadí v poli JE jejich
              // identita — načtený článek se navíc nepřerovnává.
              <Content key={index}>{section.content}</Content>
            ))}
          </div>
        </div>
      </Section>
    );
  },
});

export default Novinka;
