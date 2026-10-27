import { createVisualComponent, useDataObject, useRoute, useMemo, useScreenSize, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "../tools/caio-ui.js";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import TeamLogo from "../components/team-logo.jsx";
import DateText from "../components/date-text.jsx";
import MatchTile from "../components/match-tile.jsx";
import EmptyState from "../components/empty-state.jsx";
import LineupPitch from "../components/lineup-pitch/lineup-pitch.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Detail zápasu.
//
// `match/get` vrací zápas i s oběma týmy a s **rozbalenou sestavou** (hráč + osoba), takže
// detail je jeden dotaz, ne n+1. Ostatní výsledky kola, vzájemné zápasy a alba jsou tři
// nezávislé dotazy navíc — každý se načítá sám a jeden neúspěch neshodí zbytek stránky.

function isPlayed(match) {
  return Number.isFinite(match?.homeGoals) && Number.isFinite(match?.guestGoals);
}

function personName(entry) {
  const name = [entry.person?.name, entry.person?.surname].filter(Boolean).join(" ");
  // Prázdné jméno znamená mládež (server jména dětí nevrací) nebo hráče bez osoby;
  // číslo dresu je jediná identifikace, kterou v obou případech máme.
  if (name) return name;
  return entry.player?.number ? `#${entry.player.number}` : null;
}

function MatchHeader({ match }) {
  const played = isPlayed(match);
  const penaltyWinner = match.penaltyWinnerTeamId;

  // Kolo, výkop, hřiště a odjezd jsou **patička dlaždice**, ne další blok v jejím těle:
  // `Tile` na to má `footer` a `footerSeparator`, takže oddělovací linku kreslí GDS
  // (`Shape.line`) a nemusí se psát `borderBlockStart` s vlastní barvou.
  const meta = (
    <div
      className={Config.Css.css({
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
        inlineSize: "100%",
        color: theme.color.mutedFg,
      })}
    >
      <span>
        {match.round ? (
          <Lsi import={importLsi} path={["match", "round"]} params={{ round: match.round }} />
        ) : (
          <Lsi import={importLsi} path={["match", "friendly"]} />
        )}
      </span>
      <span>
        <Uu5Elements.Icon icon="uugds-calendar" /> <DateText value={match.time} type="dateTime" />
      </span>
      {match.place ? (
        <span>
          <Uu5Elements.Icon icon="uugds-mapmarker" /> {match.place}
        </span>
      ) : null}
      {/* `departureTime` je interní údaj — server ho vrací jen roli `members` a výš,
          takže když tu je, smí se ukázat. */}
      {match.departureTime ? (
        <span className={Config.Css.css({ color: theme.color.clubRed })}>
          <Uu5Elements.Icon icon="uugds-clock" />{" "}
          <Lsi import={importLsi} path={["match", "departure"]} />: <DateText value={match.departureTime} type="time" />
        </span>
      ) : null}
    </div>
  );

  return (
    <Card topStripe footer={meta} footerSeparator footerHorizontalAlignment="center">
      {/* Domácí – skóre – hosté. Prostřední sloupec je `auto`, aby si skóre vzalo jen
          tolik, kolik potřebuje, a oba týmy dostaly stejnou půlku zbytku. */}
      <Uu5Elements.Grid
        templateColumns="1fr auto 1fr"
        alignItems="center"
        columnGap={16}
        className={Config.Css.css({ textAlign: "center" })}
      >
        {[match.homeTeam, match.guestTeam].map((team, index) => (
          <Uu5Elements.Grid
            key={index}
            justifyItems="center"
            rowGap={8}
            // Skóre je uprostřed, takže hosté musí být až za ním.
            className={Config.Css.css({ order: index === 0 ? 0 : 2 })}
          >
            <TeamLogo uri={team?.logoUri} size={64} alt="" />
            <div className={Config.Css.css({ ...theme.typography.display, fontSize: 20 })}>{team?.name ?? "—"}</div>
            {penaltyWinner && penaltyWinner === team?.id ? (
              <Uu5Elements.Tag colorScheme="primary" significance="distinct" size="s">
                <Lsi import={importLsi} path={["match", "penaltyWinner"]} />
              </Uu5Elements.Tag>
            ) : null}
          </Uu5Elements.Grid>
        ))}

        <div className={Config.Css.css({ order: 1 })}>
          <div className={Config.Css.css({ ...theme.typography.display, fontSize: 44, lineHeight: 1 })}>
            {played ? `${match.homeGoals} : ${match.guestGoals}` : "—"}
          </div>
          {played && Number.isFinite(match.homeGoalsHalf) ? (
            <Uu5Elements.Text
              category="interface"
              segment="content"
              type="medium"
              className={Config.Css.css({ color: theme.color.mutedFg })}
            >
              {`(${match.homeGoalsHalf} : ${match.guestGoalsHalf})`}
            </Uu5Elements.Text>
          ) : null}
        </div>
      </Uu5Elements.Grid>
    </Card>
  );
}

function RelatedMatches({ dtoIn, headerLsi, eyebrowLsi, excludeId, ownTeamId, variant, action }) {
  const dataObject = useDataObject({ handlerMap: { load: () => UiElements.Call.cmdGet("/match/list", dtoIn) } }, [
    JSON.stringify(dtoIn),
  ]);

  const itemList = useMemo(
    () => (dataObject.data?.itemList ?? []).filter((match) => match.id !== excludeId),
    [dataObject.data, excludeId],
  );

  // Prázdný blok se nekreslí vůbec — „ostatní výsledky kola" bez ostatních výsledků je
  // jen nadpis nad prázdnem.
  if (dataObject.state === "pendingNoData" || itemList.length === 0) return null;

  return (
    <Section variant={variant}>
      <div
        className={Config.Css.css({
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        })}
      >
        <Heading eyebrow={eyebrowLsi} lsi={headerLsi} />
        {action}
      </div>
      <Uu5Elements.Grid
        templateColumns="repeat(auto-fill, minmax(280px, 1fr))"
        className={Config.Css.css({ marginBlockStart: 24 })}
      >
        {itemList.map((match) => (
          <MatchTile key={match.id} match={match} ownTeamId={ownTeamId} />
        ))}
      </Uu5Elements.Grid>
    </Section>
  );
}

function MatchDetail({ matchId }) {
  const { categoryList } = useApp();
  const [, setRoute] = useRoute();
  const dataObject = useDataObject(
    { handlerMap: { load: () => UiElements.Call.cmdGet("/match/get", { id: matchId }) } },
    [matchId],
  );

  const { state, data: match } = dataObject;
  const [screenSize] = useScreenSize();

  const { homeLineup, guestLineup, scorers } = useMemo(() => {
    const entryList = match?.playerList ?? [];
    const belongsTo = (entry, teamId) => (entry.player?.teamList ?? []).some((membership) => membership.id === teamId);

    return {
      homeLineup: entryList.filter((entry) => belongsTo(entry, match?.homeTeamId)),
      guestLineup: entryList.filter((entry) => belongsTo(entry, match?.guestTeamId)),
      scorers: entryList.filter((entry) => entry.goals > 0).sort((a, b) => b.goals - a.goals),
    };
  }, [match]);

  if (state === "pendingNoData") {
    return (
      <Section>
        <Uu5Elements.Skeleton height={280} />
      </Section>
    );
  }

  if (!match?.id) {
    return (
      <Section>
        <EmptyState lsi={lsi("match", "missing")} icon="uugds-alert-circle" />
      </Section>
    );
  }

  // Vlastní tým zápasu — kvůli zvýraznění v dlaždicích níž. Klub může hrát sám proti sobě
  // jen omylem, takže stačí první shoda.
  const ownTeamId = categoryList.find(
    (category) => category.teamId === match.homeTeamId || category.teamId === match.guestTeamId,
  )?.teamId;

  const hasLineup = homeLineup.length > 0 || guestLineup.length > 0;

  return (
    <>
      <Section>
        <MatchHeader match={match} />
      </Section>

      {hasLineup ? (
        <Section variant="hatched">
          <Heading lsi={lsi("match", "lineup")} />
          {/* Sestava na hřišti (components/lineup-pitch/) jen u týmu, který ji má vyplněnou --
              u nás tým AFK, soupeř sestavu nemá (Caio 2026-10-27). Na desktopu hřiště vlevo,
              střelci vedle; na mobilu pod sebou. */}
          <div
            className={Config.Css.css({
              display: "grid",
              gap: 24,
              marginBlockStart: 24,
              gridTemplateColumns: ["xs", "s"].includes(screenSize) ? "minmax(0, 1fr)" : "minmax(0, 520px) minmax(0, 1fr)",
              alignItems: "start",
            })}
          >
            {[homeLineup, guestLineup]
              .filter((lineup) => lineup.length > 0)
              .map((lineup, index) => (
                <LineupPitch key={index} entryList={lineup} />
              ))}
            <div>
              {scorers.length ? (
                <div>
                  <div className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 12, marginBlockEnd: 8 })}>
                    <Lsi import={importLsi} path={["match", "scorers"]} />
                  </div>
                  <div className={Config.Css.css({ display: "flex", gap: 12, flexWrap: "wrap" })}>
                    {scorers.map((entry, index) => (
                      <Uu5Elements.Tag key={entry.playerId ?? index} size="m" colorScheme="building" significance="distinct">
                        {personName(entry) ?? "?"}
                        {entry.goals > 1 ? ` (${entry.goals})` : null}
                      </Uu5Elements.Tag>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      {/* Ostatní výsledky kola — převzaté ze současného webu, kde je to jeden z mála
          důvodů, proč se na detail zápasu vůbec chodí. */}
      {match.round ? (
        <RelatedMatches
          dtoIn={{ seasonId: match.seasonId, round: match.round }}
          eyebrowLsi={lsi("match", "roundResultsEyebrow")}
          headerLsi={lsi("match", "roundResults")}
          excludeId={match.id}
          ownTeamId={ownTeamId}
          action={
            <Uu5Elements.Button
              significance="subdued"
              onClick={() =>
                setRoute("kolo", {
                  seasonId: match.seasonId,
                  round: match.round,
                  // Vlastní tým zápasu, ať kolo ví, jestli jde o A, nebo B tým (round.jsx).
                  ...(ownTeamId ? { teamId: ownTeamId } : null),
                })
              }
            >
              <Lsi import={importLsi} path={["match", "wholeRound"]} />
            </Uu5Elements.Button>
          }
        />
      ) : null}

      {ownTeamId ? (
        <RelatedMatches
          variant="hatched"
          dtoIn={{
            teamId: ownTeamId,
            opponentId: ownTeamId === match.homeTeamId ? match.guestTeamId : match.homeTeamId,
            state: "played",
            order: "desc",
          }}
          eyebrowLsi={lsi("match", "h2hEyebrow")}
          headerLsi={lsi("match", "h2h")}
          excludeId={match.id}
          ownTeamId={ownTeamId}
        />
      ) : null}
    </>
  );
}

const Match = createVisualComponent({
  uu5Tag: Config.TAG + "Match",

  render() {
    const [route] = useRoute();
    const matchId = route?.params?.id;

    if (!matchId) {
      return (
        <Section>
          <EmptyState lsi={lsi("match", "missing")} icon="uugds-alert-circle" />
        </Section>
      );
    }

    return <MatchDetail matchId={matchId} />;
  },
});

export default Match;
