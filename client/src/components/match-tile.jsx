import { createVisualComponent, useRoute, useState, useScreenSize, Suspense, Utils, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiAuth } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Card from "./layout/card.jsx";
import TeamLogo from "./team-logo.jsx";
import DateText from "./date-text.jsx";
import { TeamLink, SeasonLink } from "./route-link.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Formulář výsledku se načítá **lazy**: dlaždice je součást veřejného balíku, ale modal
// z administrace by do něj přitáhl svoje závislosti (`admin/fields.jsx`, `uu5codekitg01`)
// kvůli tlačítku, které naprostá většina čtenářů nikdy neuvidí. Ověřeno na buildu —
// `match-modals` sedí ve vlastním chunku (~6 kB, build 2026-11-02) a stáhne se až kliknutím na tužku.
// (`uu5g05-forms` samotné v hlavním balíku stejně je, táhne si ho `home/tables-section.jsx`.)
const ResultModal = Utils.Component.lazy(() =>
  import("../admin/match-modals.jsx").then((m) => ({ default: m.ResultModal })),
);

// Dlaždice zápasu — **jediná** komponenta, která kreslí zápas: rozpis i výsledek v seznamech,
// hlavička detailu zápasu (`size="large"`) i zápas u reportu v novince.
//
// Je to **totéž** z pohledu čtenáře: dva týmy, kdy a jak to dopadlo; jen u nadcházejícího
// zápasu je místo skóre čas a den. Podoba výsledkové tabule (domácí vlevo, hosté vpravo,
// skóre uprostřed) je varianta B z canvasu „AFK Bratčice – dlaždice zápasu“ (Caio 2026-10-28).
// Víc komponent by znamenalo víckrát udržovat stejné řešení log, zkrácených názvů,
// zvýraznění vlastního týmu, poločasu a vítěze rozstřelu (dřív k tomu byl ještě `MatchHeader`
// v detailu a `MatchPanel` v novince, sjednoceno 2026-11-02).
//
// Názvy a loga se berou z týmů vložených do zápasu (`homeTeam`/`guestTeam` vrací jen
// `match/get`), jinak z **mapy týmů v app-contextu**: `match/list` vrací jen
// `homeTeamId`/`guestTeamId`, takže bez sdílené mapy by si je každá obrazovka se seznamem
// zápasů sháněla sama.
//
// **Dvě podoby vstupu.** `matchData` je položka z `useDataList` (`{ data, handlerMap }`),
// `match` je holý objekt. Tužka „zapsat výsledek" se nabídne u obou, liší se jen zápis:
//
// - u `matchData` jde **položkovým handlerem** `setResult` seznamu — seznam položku nahradí
//   tím, co vrátil server, a nic dalšího se dít nemusí,
// - u holého `match` modal zavolá `match/setResult` sám; dlaždice si vrácený zápas drží
//   v lokálním stavu (nový výsledek je vidět hned) a ohlásí ho `onResultSaved`, ať si ho
//   rodič může promítnout do svých dat (detail zápasu kvůli titulku stránky).
//
// Propsy:
//   match          holý zápas
//   matchData      položka `useDataList` (`{ data, handlerMap }`); má přednost před `match`
//   ownTeamId      vlastní tým — tučně, soupeř ztlumeně; podle něj i odznak výhra/remíza/prohra
//   category       název kategorie do štítku v hlavičce (jen běžná velikost)
//   size           "medium" (výchozí, seznamy) | "large" (hlavička detailu: větší loga,
//                  patička s kolem, datem a časem, místem a odjezdem, bez prokliku)
//   onClick        proklik; výchozí je detail zápasu (u `large` žádný)
//   onResultSaved  (updatedMatch) => void, po uložení výsledku tužkou

function outcome(match, ownTeamId) {
  if (!Number.isFinite(match.homeGoals) || !Number.isFinite(match.guestGoals)) return null;
  // Vlastní tým v zápase hrát nemusí (kolo soutěže ukazuje i zápasy ostatních týmů) —
  // pak není z čího pohledu výhru nebo prohru počítat.
  if (!ownTeamId || (match.homeTeamId !== ownTeamId && match.guestTeamId !== ownTeamId)) return null;

  const isHome = match.homeTeamId === ownTeamId;
  const own = isHome ? match.homeGoals : match.guestGoals;
  const other = isHome ? match.guestGoals : match.homeGoals;

  if (own > other) return "win";
  if (own < other) return "loss";
  // Remíza rozhodnutá penaltami se pořád počítá jako remíza — jen s jinými body.
  // Vítěz rozstřelu má štítek pod názvem týmu, ne v odznaku, aby odznak zůstal třístavový.
  return "draw";
}

const OUTCOME_COLOR_SCHEME = { win: "primary", draw: "building", loss: "building" };

/**
 * Smí přihlášený zapsat výsledek **tohohle** zápasu? Zrcadlí `match/setResult`
 * (design/roles.md, 5: MATCH, **TE** v režimu `any`) — je to UX, ne bezpečnostní hranice,
 * server rozhoduje znovu a podle databáze.
 *
 * `hasProfile(…, TEAM_SCOPED)` by tu bylo špatně: to je „editor nějakého týmu", takže by
 * trenér žáků dostal tužku i u zápasu mužů. Rozsah se musí porovnat s dvojicí týmů.
 */
function canSetResult(identity, match) {
  if (!identity) return false;
  if (UiAuth.hasProfile(identity, Config.MATCH)) return true;

  const myTeamIdList = UiAuth.getScopeList(identity, Config.ROLE.TEAM_EDITOR);
  return myTeamIdList.some((id) => id === match.homeTeamId || id === match.guestTeamId);
}

// Logo size in the tile (px); larger at the cost of the tile padding (Caio 2026-10-29).
const LOGO_SIZE = 64;

// Logo size in the large tile on the match detail; smaller on a phone so the score fits
// (Caio 2026-10-29).
function largeLogoSize(screenSize) {
  return ["xs", "s"].includes(screenSize) ? 80 : 96;
}

// One side of the scoreboard: logo above the name, name at most two lines (variant B,
// Caio 2026-10-28; canvas "AFK Bratčice – dlaždice zápasu"). The penalty shootout winner
// gets a tag under the name. On the large tile (match detail) the name links to the team;
// the regular tile is clickable as a whole, a link inside it would compete with that.
function TeamSide({ team, isOwn, logoSize, large, penaltyWinner, seasonId }) {
  return (
    <div
      className={Config.Css.css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        textAlign: "center",
        minInlineSize: 0,
      })}
    >
      <TeamLogo uri={team?.logoUri} size={logoSize} alt="" />
      <Uu5Elements.Text
        category="interface"
        segment={large ? "title" : "content"}
        type={large ? "minor" : "large"}
        className={Config.Css.css({
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "anywhere",
          fontWeight: isOwn ? 700 : 400,
          color: isOwn ? theme.color.fg : theme.color.mutedFg,
        })}
      >
        {large && team ? <TeamLink team={team} seasonId={seasonId} /> : (team?.name ?? "—")}
      </Uu5Elements.Text>
      {penaltyWinner ? (
        <Uu5Elements.Tag colorScheme="primary" significance="distinct" size="s">
          <Lsi import={importLsi} path={["match", "penaltyWinner"]} />
        </Uu5Elements.Tag>
      ) : null}
    </div>
  );
}

// Patička velké dlaždice: kolo, výkop, hřiště a odjezd, na střed a se zalomením.
function LargeFooter({ match }) {
  return (
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
          <SeasonLink seasonId={match.seasonId} round={match.round}>
            <Lsi import={importLsi} path={["match", "round"]} params={{ round: match.round }} />
          </SeasonLink>
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
}

const MatchTile = createVisualComponent({
  uu5Tag: Config.TAG + "MatchTile",

  render({ match: matchProp, matchData, ownTeamId, category, size = "medium", onClick, onResultSaved }) {
    const [, setRoute] = useRoute();
    const [screenSize] = useScreenSize();
    const { getTeam } = useApp();
    const session = UiAuth.useSession();
    const [resultOpen, setResultOpen] = useState(false);
    // Zápas uložený tužkou u holého `match` jako `{ base, match }`. Platí, jen dokud rodič
    // neposlal jiný zápas: když si výsledek promítl do svých dat (`onResultSaved`), přijde
    // nový objekt a ten má přednost před lokální kopií.
    const [saved, setSaved] = useState();

    const large = size === "large";
    const baseMatch = matchData?.data ?? matchProp;
    const match = saved && saved.base === baseMatch ? saved.match : baseMatch;
    // `handlerMap` je prázdné, dokud se seznam celý načítá nebo je položka rozepsaná —
    // uu5g05 tím brání souběžným zápisům nad touž položkou, takže tužka v tu chvíli zmizí.
    const setResult = matchData?.handlerMap?.setResult;

    const played = match.state === "played" || Number.isFinite(match.homeGoals);
    const result = outcome(match, ownTeamId);
    const logoSize = large ? largeLogoSize(screenSize) : LOGO_SIZE;
    const homeTeam = match.homeTeam ?? getTeam(match.homeTeamId);
    const guestTeam = match.guestTeam ?? getTeam(match.guestTeamId);
    const penaltyWinnerTeamId = played ? match.penaltyWinnerTeamId : null;
    // Dlaždice je vstup na detail zápasu, pokud volající nechce jinak. Bez `match.id`
    // (třeba prázdná odpověď `getLast`) zůstane needitovatelná, ne rozklikávací do prázdna.
    // Velká dlaždice JE detail zápasu, proklik by vedl na tutéž stránku.
    const handleClick = onClick ?? (match.id && !large ? () => setRoute("zapas", { id: match.id }) : undefined);

    function handleResultSaved(updated) {
      // Zápis vrací holý zápas (bez vložených týmů a rozbalené sestavy), proto merge.
      const next = { ...match, ...updated };
      if (!matchData) setSaved({ base: baseMatch, match: next });
      onResultSaved?.(next);
    }

    // `Tile` (pod `Card`) schová `actionList` na `opacity: 0` a odkryje ho na hoveru karty;
    // na mobilu a tabletu ho nechá vidět, protože tam hover není. Nic vlastního se proto
    // nepřidává — stačí akci předat.
    const canEdit = Boolean(match.id) && (!matchData || Boolean(setResult)) && canSetResult(session.identity, match);
    const actionList = canEdit
      ? [
          {
            icon: "uugds-pencil",
            tooltip: lsi("admin", "matches", "setResult"),
            significance: "subdued",
            onClick: (e) => {
              // Akce leží uvnitř klikací karty: bez tohohle by proklik odnavigoval
              // na detail zápasu dřív, než se modal stihne otevřít.
              e?.stopPropagation?.();
              setResultOpen(true);
            },
          },
        ]
      : undefined;

    // Kolo vlevo, kategorie vpravo, mezera mezi nimi (Caio 2026-10-28). Velká dlaždice
    // hlavičku nemá, kolo je u ní v patičce.
    const header = large ? undefined : (
      <div
        className={Config.Css.css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          inlineSize: "100%",
        })}
      >
        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="medium"
          className={Config.Css.css({ color: theme.color.mutedFg })}
        >
          {match.round ? (
            <Lsi import={importLsi} path={["match", "round"]} params={{ round: match.round }} />
          ) : (
            <Lsi import={importLsi} path={["match", "friendly"]} />
          )}
        </Uu5Elements.Text>
        {category ? (
          <Uu5Elements.Tag colorScheme="primary" significance="highlighted" size="s">
            {category}
          </Uu5Elements.Tag>
        ) : null}
      </div>
    );

    // Střed tabule: skóre a pod ním poločas (když je zadaný), u nadcházejícího zápasu čas
    // výkopu a pod ním den.
    const center = played ? (
      <>
        <span className={Config.Css.css({ ...theme.typography.display, fontSize: 44, lineHeight: 1, whiteSpace: "nowrap" })}>
          {Number.isFinite(match.homeGoals) ? match.homeGoals : "–"}
          {" : "}
          {Number.isFinite(match.guestGoals) ? match.guestGoals : "–"}
        </span>
        {Number.isFinite(match.homeGoalsHalf) && Number.isFinite(match.guestGoalsHalf) ? (
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({ color: theme.color.mutedFg, whiteSpace: "nowrap" })}
          >
            {`(${match.homeGoalsHalf} : ${match.guestGoalsHalf})`}
          </Uu5Elements.Text>
        ) : null}
      </>
    ) : match.time ? (
      <>
        <span className={Config.Css.css({ ...theme.typography.display, fontSize: 34, lineHeight: 1 })}>
          <DateText value={match.time} type="time" />
        </span>
        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="small"
          className={Config.Css.css({ color: theme.color.mutedFg, whiteSpace: "nowrap" })}
        >
          <DateText value={match.time} type="dayMonth" />
        </Uu5Elements.Text>
      </>
    ) : (
      <span className={Config.Css.css({ ...theme.typography.display, fontSize: 34, lineHeight: 1 })}>–</span>
    );

    // Spodní řádek je patička dlaždice — `Tile` má na oddělovací linku `footerSeparator`
    // z GDS, takže se nekreslí vlastní `borderBlockStart`. U odehraného zápasu datum a jak
    // dopadl, u nadcházejícího místo (den a čas jsou uprostřed tabule); bez místa patička není.
    // Velká dlaždice má patičku vždy (`LargeFooter`).
    const footerContent = played ? (
      <>
        <span className={Config.Css.css({ display: "flex", alignItems: "center", gap: 6 })}>
          <Uu5Elements.Icon icon="uugds-calendar" />
          <DateText value={match.time} type="date" />
        </span>
        {result ? (
          <Uu5Elements.Tag colorScheme={OUTCOME_COLOR_SCHEME[result]} significance="distinct" size="s">
            <Lsi import={importLsi} path={["match", "outcome", result]} />
          </Uu5Elements.Tag>
        ) : null}
      </>
    ) : match.place ? (
      <span
        className={Config.Css.css({
          display: "flex",
          alignItems: "center",
          gap: 6,
          minInlineSize: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        })}
      >
        <Uu5Elements.Icon icon="uugds-mapmarker" />
        {match.place}
      </span>
    ) : null;

    const footer = large ? (
      <LargeFooter match={match} />
    ) : footerContent ? (
      <div
        className={Config.Css.css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          inlineSize: "100%",
          minInlineSize: 0,
          color: theme.color.mutedFg,
        })}
      >
        {footerContent}
      </div>
    ) : undefined;

    const card = (
      <Card
        topStripe
        header={header}
        footer={footer}
        footerSeparator={Boolean(footer)}
        footerHorizontalAlignment={large ? "center" : undefined}
        onClick={handleClick}
        actionList={actionList}
      >
        <div
          className={Config.Css.css({
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
            alignItems: "start",
            gap: large ? 16 : 8,
          })}
        >
          <TeamSide
            team={homeTeam}
            isOwn={match.homeTeamId === ownTeamId}
            logoSize={logoSize}
            large={large}
            seasonId={match.seasonId}
            penaltyWinner={Boolean(penaltyWinnerTeamId) && penaltyWinnerTeamId === match.homeTeamId}
          />
          <div
            className={Config.Css.css({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minBlockSize: logoSize,
            })}
          >
            {center}
          </div>
          <TeamSide
            team={guestTeam}
            isOwn={match.guestTeamId === ownTeamId}
            logoSize={logoSize}
            large={large}
            seasonId={match.seasonId}
            penaltyWinner={Boolean(penaltyWinnerTeamId) && penaltyWinnerTeamId === match.guestTeamId}
          />
        </div>
      </Card>
    );

    return (
      <>
        {/* Tighter GDS spacing than the app's `loose` leaves room for the larger logos
            (Caio 2026-10-29) without custom padding CSS. The large tile on the match detail
            keeps the app's `loose`, as the former detail header did. */}
        {large ? card : <Uu5Elements.SpacingProvider type="normal">{card}</Uu5Elements.SpacingProvider>}

        {/* `ResultModal` čeká celé týmy (vypisuje jejich názvy), ale `match/list` vrací jen
            id — doplní se z mapy týmů v app-contextu, stejně jako to dělá `admin/matches`.

            U `matchData` jde zápis **položkovým handlerem seznamu** (`onSubmit`): seznam pak
            položku nahradí tím, co server vrátil, a nepřenačítá se celý. U holého `match`
            volá modal use case sám a dlaždice si výsledek převezme v `handleResultSaved`. */}
        {resultOpen ? (
          <Suspense fallback={null}>
            <ResultModal
              match={{ ...match, homeTeam, guestTeam }}
              onClose={() => setResultOpen(false)}
              onSubmit={matchData ? setResult : undefined}
              onSaved={handleResultSaved}
            />
          </Suspense>
        ) : null}
      </>
    );
  },
});

export default MatchTile;
