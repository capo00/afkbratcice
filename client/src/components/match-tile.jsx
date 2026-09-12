import { createVisualComponent, useRoute, useState, Suspense, Utils, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiAuth } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Card from "./layout/card.jsx";
import TeamLogo from "./team-logo.jsx";
import DateText from "./date-text.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Formulář výsledku se načítá **lazy**: dlaždice je součást veřejného balíku, ale modal
// z administrace by do něj přitáhl svoje závislosti (`admin/fields.jsx`, `uu5codekitg01`)
// kvůli tlačítku, které naprostá většina čtenářů nikdy neuvidí. Ověřeno na buildu —
// `match-modals` sedí ve vlastním chunku (~14 kB) a stáhne se až kliknutím na tužku.
// (`uu5g05-forms` samotné v hlavním balíku stejně je, táhne si ho `home/tables-section.jsx`.)
const ResultModal = Utils.Component.lazy(() =>
  import("../admin/match-modals.jsx").then((m) => ({ default: m.ResultModal })),
);

// Dlaždice zápasu — jedna komponenta pro rozpis i pro výsledek.
//
// Je to **totéž** z pohledu čtenáře: dva týmy, kdy a jak to dopadlo; jen u nadcházejícího
// zápasu je místo skóre datum a čas. Dvě komponenty by znamenaly dvakrát udržovat stejné
// řešení log, zkrácených názvů a zvýraznění vlastního týmu.
//
// Názvy a loga se berou z **mapy týmů v app-contextu**: `match/list` vrací jen
// `homeTeamId`/`guestTeamId` a týmy dotahuje pouze `match/get`, takže bez sdílené mapy by
// si je každá obrazovka se seznamem zápasů sháněla sama.
//
// **Dvě podoby vstupu.** `matchData` je položka z `useDataList` (`{ data, handlerMap }`),
// `match` je holý objekt. Tužka „zapsat výsledek" se nabídne **jen u `matchData`** — jen
// tam totiž existuje položkový handler, kterým se zápis promítne zpátky do seznamu.
// U holého `match` by se uložilo, ale na obrazovce by zůstala stará hodnota, takže je
// poctivější akci vůbec nenabízet než nabídnout nefunkční.

function outcome(match, ownTeamId) {
  if (!Number.isFinite(match.homeGoals) || !Number.isFinite(match.guestGoals)) return null;
  if (!ownTeamId) return null;

  const isHome = match.homeTeamId === ownTeamId;
  const own = isHome ? match.homeGoals : match.guestGoals;
  const other = isHome ? match.guestGoals : match.homeGoals;

  if (own > other) return "win";
  if (own < other) return "loss";
  // Remíza rozhodnutá penaltami se pořád počítá jako remíza — jen s jinými body.
  // Rozstřel se ukazuje u skóre, ne v odznaku, aby odznak zůstal třístavový.
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

function TeamRow({ teamId, goals, ownTeamId, showGoals }) {
  const { getTeam } = useApp();
  const team = getTeam(teamId);
  const isOwn = teamId === ownTeamId;

  return (
    <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8 })}>
      <TeamLogo uri={team?.logoUri} size={24} alt="" />
      <span
        className={Config.Css.css({
          flexGrow: 1,
          minInlineSize: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: isOwn ? 700 : 400,
          color: isOwn ? theme.color.fg : theme.color.mutedFg,
        })}
      >
        {team?.name ?? "—"}
      </span>
      {showGoals ? (
        <span className={Config.Css.css({ ...theme.typography.display, fontSize: 20, flexShrink: 0 })}>
          {Number.isFinite(goals) ? goals : "–"}
        </span>
      ) : null}
    </div>
  );
}

const MatchTile = createVisualComponent({
  uu5Tag: Config.TAG + "MatchTile",

  render({ match: matchProp, matchData, ownTeamId, category, onClick }) {
    const [, setRoute] = useRoute();
    const { getTeam } = useApp();
    const session = UiAuth.useSession();
    const [resultOpen, setResultOpen] = useState(false);

    const match = matchData?.data ?? matchProp;
    // `handlerMap` je prázdné, dokud se seznam celý načítá nebo je položka rozepsaná —
    // uu5g05 tím brání souběžným zápisům nad touž položkou, takže tužka v tu chvíli zmizí.
    const setResult = matchData?.handlerMap?.setResult;

    const played = match.state === "played" || Number.isFinite(match.homeGoals);
    const result = outcome(match, ownTeamId);
    // Dlaždice je vstup na detail zápasu, pokud volající nechce jinak. Bez `match.id`
    // (třeba prázdná odpověď `getLast`) zůstane needitovatelná, ne rozklikávací do prázdna.
    const handleClick = onClick ?? (match.id ? () => setRoute("zapas", { id: match.id }) : undefined);

    // `Tile` (pod `Card`) schová `actionList` na `opacity: 0` a odkryje ho na hoveru karty;
    // na mobilu a tabletu ho nechá vidět, protože tam hover není. Nic vlastního se proto
    // nepřidává — stačí akci předat.
    const actionList =
      setResult && match.id && canSetResult(session.identity, match)
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

    const header = (
      <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
        {category ? (
          <Uu5Elements.Tag colorScheme="primary" significance="highlighted" size="s">
            <Lsi import={importLsi} path={["enum", "age", category]} />
          </Uu5Elements.Tag>
        ) : null}
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
      </div>
    );

    // Spodní řádek (kdy, kde, jak dopadlo) je patička dlaždice — `Tile` má na oddělovací
    // linku `footerSeparator` z GDS, takže se nekreslí vlastní `borderBlockStart`.
    const footer = (
      <div
        className={Config.Css.css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          inlineSize: "100%",
          color: theme.color.mutedFg,
        })}
      >
        <span className={Config.Css.css({ display: "flex", alignItems: "center", gap: 6 })}>
          <Uu5Elements.Icon icon="uugds-calendar" />
          <DateText value={match.time} type={played ? "date" : "dayMonth"} />
          {!played && match.time ? (
            <>
              <Uu5Elements.Icon icon="uugds-clock" className={Config.Css.css({ marginInlineStart: 6 })} />
              <DateText value={match.time} type="time" />
            </>
          ) : null}
        </span>

        {played && result ? (
          <Uu5Elements.Tag colorScheme={OUTCOME_COLOR_SCHEME[result]} significance="distinct" size="s">
            <Lsi import={importLsi} path={["match", "outcome", result]} />
          </Uu5Elements.Tag>
        ) : null}

        {match.place && !played ? (
          <span className={Config.Css.css({ display: "flex", alignItems: "center", gap: 6 })}>
            <Uu5Elements.Icon icon="uugds-mapmarker" />
            {match.place}
          </span>
        ) : null}
      </div>
    );

    return (
      <>
        <Card topStripe header={header} footer={footer} footerSeparator onClick={handleClick} actionList={actionList}>
          <Uu5Elements.Grid rowGap={6}>
            <TeamRow teamId={match.homeTeamId} goals={match.homeGoals} ownTeamId={ownTeamId} showGoals={played} />
            <TeamRow teamId={match.guestTeamId} goals={match.guestGoals} ownTeamId={ownTeamId} showGoals={played} />
          </Uu5Elements.Grid>
        </Card>

        {/* `ResultModal` čeká celé týmy (vypisuje jejich názvy), ale `match/list` vrací jen
            id — doplní se z mapy týmů v app-contextu, stejně jako to dělá `admin/matches`.

            Zápis jde **položkovým handlerem seznamu**, ne přímým voláním use casu: seznam
            pak položku nahradí tím, co server vrátil, takže se nikde nepřenačítá celek
            a nic se nemusí hlásit propem zpátky nahoru. */}
        {resultOpen ? (
          <Suspense fallback={null}>
            <ResultModal
              match={{ ...match, homeTeam: getTeam(match.homeTeamId), guestTeam: getTeam(match.guestTeamId) }}
              onClose={() => setResultOpen(false)}
              onSubmit={setResult}
            />
          </Suspense>
        ) : null}
      </>
    );
  },
});

export default MatchTile;
