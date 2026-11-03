import { createVisualComponent, useDataObject, useRoute, useMemo, useScreenSize, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import MatchTile from "../components/match-tile.jsx";
import EmptyState from "../components/empty-state.jsx";
import LineupPitch from "../components/lineup-pitch/lineup-pitch.jsx";
import { useApp } from "../core/app-context.jsx";
import { usePageTitle } from "../tools/page-meta.js";

const { theme } = Config;

// Detail zápasu.
//
// `match/get` vrací zápas i s oběma týmy a s **rozbalenou sestavou** (hráč + osoba), takže
// detail je jeden dotaz, ne n+1. Ostatní výsledky kola, vzájemné zápasy a alba jsou tři
// nezávislé dotazy navíc — každý se načítá sám a jeden neúspěch neshodí zbytek stránky.
//
// Zápas sám i ostatní zápasy kreslí `MatchTile` (hlavička detailu je `size="large"`). Tužkou
// zapsaný výsledek se promítá zpátky do dat stránky (`onResultSaved`), aby se změnil i titulek.

function personName(entry) {
  const name = [entry.person?.name, entry.person?.surname].filter(Boolean).join(" ");
  // Prázdné jméno znamená mládež (server jména dětí nevrací) nebo hráče bez osoby;
  // číslo dresu je jediná identifikace, kterou v obou případech máme.
  if (name) return name;
  return entry.player?.number ? `#${entry.player.number}` : null;
}

function RelatedMatches({ dtoIn, headerLsi, eyebrowLsi, excludeId, ownTeamId, variant }) {
  const dataObject = useDataObject({ handlerMap: { load: () => UiElements.Call.cmdGet("/match/list", dtoIn) } }, [
    JSON.stringify(dtoIn),
  ]);

  const itemList = useMemo(
    () => (dataObject.data?.itemList ?? []).filter((match) => match.id !== excludeId),
    [dataObject.data, excludeId],
  );

  // Výsledek zapsaný tužkou v dlaždici nahradí položku seznamu, ať se nevrátí stará
  // hodnota, až se blok překreslí. `setData` chybí, dokud se seznam načítá.
  function replaceMatch(updated) {
    const data = dataObject.data;
    dataObject.handlerMap.setData?.({
      ...data,
      itemList: (data?.itemList ?? []).map((match) => (match.id === updated.id ? updated : match)),
    });
  }

  // Prázdný blok se nekreslí vůbec — „ostatní výsledky kola" bez ostatních výsledků je
  // jen nadpis nad prázdnem.
  if (dataObject.state === "pendingNoData" || itemList.length === 0) return null;

  return (
    <Section variant={variant}>
      <Heading eyebrow={eyebrowLsi} lsi={headerLsi} />
      <Uu5Elements.Grid
        templateColumns="repeat(auto-fill, minmax(280px, 1fr))"
        className={Config.Css.css({ marginBlockStart: 24 })}
      >
        {itemList.map((match) => (
          <MatchTile key={match.id} match={match} ownTeamId={ownTeamId} onResultSaved={replaceMatch} />
        ))}
      </Uu5Elements.Grid>
    </Section>
  );
}

function MatchDetail({ matchId }) {
  const { getTeam } = useApp();
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

  // „AFK Bratčice – Chotusice 3:4" do titulku a náhledu sdílení.
  const pairName = match?.id ? `${match.homeTeam?.name ?? "?"} – ${match.guestTeam?.name ?? "?"}` : null;
  const score = Number.isFinite(match?.homeGoals) ? ` ${match.homeGoals}:${match.guestGoals}` : "";
  const date = match?.time ? new Date(match.time).toLocaleDateString("cs-CZ") : null;
  usePageTitle({
    title: pairName ? pairName + score : null,
    description: pairName
      ? `${pairName}${score}${match.round ? `, ${match.round}. kolo` : ""}${date ? `, ${date}` : ""}. Sestava a střelci.`
      : null,
  });

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

  // Vlastní tým zápasu — kvůli zvýraznění v dlaždicích níž. Podle `team.own`, ne podle
  // letošních mužstev: i zápas z archivu má vzájemné zápasy. Klub může hrát sám proti sobě
  // jen omylem, takže stačí první shoda.
  const ownTeamId = [match.homeTeamId, match.guestTeamId].find((id) => getTeam(id)?.own);

  const hasLineup = homeLineup.length > 0 || guestLineup.length > 0;

  // Zápis výsledku vrací holý zápas -- sestava v něm není rozbalená (hráč + osoba), takže
  // se ponechá ta z `match/get`; jinak by hřiště a střelci zmizeli.
  function handleResultSaved(updated) {
    dataObject.handlerMap.setData?.({ ...match, ...updated, playerList: match.playerList });
  }

  return (
    <>
      <Section>
        <MatchTile match={match} size="large" ownTeamId={ownTeamId} onResultSaved={handleResultSaved} />
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
          důvodů, proč se na detail zápasu vůbec chodí. Jsou tu všechny zápasy kola, odkaz
          na „celé kolo“ by nepřidal nic; celou sezónu otevře kolo v patičce dlaždice. */}
      {match.round ? (
        <RelatedMatches
          dtoIn={{ seasonId: match.seasonId, round: match.round }}
          eyebrowLsi={lsi("match", "roundResultsEyebrow")}
          headerLsi={lsi("match", "roundResults")}
          excludeId={match.id}
          ownTeamId={ownTeamId}
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
