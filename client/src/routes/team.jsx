import { createVisualComponent, useDataObject, useEffect, useMemo, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import EmptyState from "../components/empty-state.jsx";
import TeamShell from "../components/team/team-shell.jsx";

const { theme } = Config;

// Soupiska mužstva: hráči po postech + realizační tým.
//
// **Jména mládeže sem nechodí ze serveru** (`appSettings.hideNamesAgeList`): u kategorií, kde
// se jména skrývají, vrací API `person` bez `name` a `surname` komukoli bez role. Klient
// tedy nic neschovává — jen musí umět dlaždici vykreslit bez jména: „Hráč“ a post. Kdyby
// se spoléhal na to, že jméno vždycky přijde, ukázal by u dětí prázdno. (Číslo dresu, které
// tu dřív stálo místo jména, se od 2026-11 neeviduje.)

function playerName(player) {
  const name = [player.person?.name, player.person?.surname].filter(Boolean).join(" ");
  return name || null;
}

/** Iniciály do kruhu bez fotky („JN“), bez jména „?“. */
function initialsOf(person) {
  return (
    [person?.name, person?.surname]
      .map((part) => part?.trim()?.[0])
      .filter(Boolean)
      .join("") || "?"
  );
}

// Dlaždice osoby na soupisce -- hráč i člen realizačního týmu (Caio 2026-10-28: trenér má
// stejnou dlaždici jako hráč, s funkcí místo postu, ne zvláštní box).
function PersonTile({ person, fallbackText, name, subtitle, onClick }) {
  return (
    <Card onClick={onClick}>
      <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12 })}>
        {/* The portrait and its fallback are a `RichIcon` -- a circle with an image or text is
            exactly what it is for (`size="xxl"` = GDS major m, at least 60 px; Caio 2026-10-29).
            A person without a photo is common, for youth even the rule, so the initials (or
            „?“ when the name is hidden) stand in. `text` must not be passed with `imageSrc` -- it would render
            over the photo. */}
        <Uu5Elements.RichIcon
          size="xxl"
          significance="distinct"
          imageSrc={person?.photoUri}
          text={person?.photoUri ? undefined : fallbackText}
        />

        <div className={Config.Css.css({ minInlineSize: 0 })}>
          <div className={Config.Css.css({ ...theme.typography.display, fontSize: 18 })}>{name}</div>
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({ color: theme.color.mutedFg })}
          >
            {subtitle}
          </Uu5Elements.Text>
        </div>
      </div>
    </Card>
  );
}

function PlayerTile({ player }) {
  const [, setRoute] = useRoute();
  const name = playerName(player);

  return (
    <PersonTile
      person={player.person}
      fallbackText={initialsOf(player.person)}
      name={name ?? <Lsi import={importLsi} path={["team", "unnamedPlayer"]} />}
      subtitle={player.position ? <Lsi import={importLsi} path={["enum", "position", player.position]} /> : null}
      onClick={() => setRoute("hrac", { id: player.id })}
    />
  );
}

// Trenér nemá detail, takže dlaždice se nerozklikává; bez fotky iniciály.
// Záznam vedení je jedna funkce v tomhle týmu (`role`), viz `staffOf`.
function CoachTile({ coach }) {
  const role = coach.role ?? "assistant";
  const name = [coach.person?.name, coach.person?.surname].filter(Boolean).join(" ");

  return (
    <PersonTile
      person={coach.person}
      fallbackText={initialsOf(coach.person)}
      name={name || "—"}
      subtitle={<Lsi import={importLsi} path={["enum", "teamRole", role]} />}
    />
  );
}

/**
 * Realizační tým ze záznamů vedení. Záznam je jedna funkce v jednom období, takže kdo byl
 * v sezóně asistentem a pak trenérem, má dva -- na soupisce je jednou, s funkcí, kterou
 * měl naposled (trvající, jinak s nejpozdějším koncem). Pořadí podle číselníku: trenér první.
 */
function staffOf(itemList) {
  const recency = (m) => `${m.dateTo ?? "9999-12-31"}|${m.dateFrom ?? ""}`;
  const byPerson = new Map();
  for (const m of itemList ?? []) {
    const other = byPerson.get(m.personId);
    if (!other || recency(m) > recency(other)) byPerson.set(m.personId, m);
  }
  const roleOrder = (m) => {
    const i = Config.TEAM_ROLE_LIST.indexOf(m.role);
    return i < 0 ? Infinity : i;
  };
  return [...byPerson.values()].sort((a, b) => roleOrder(a) - roleOrder(b));
}

// Skupina soupisky: eyebrow nadpis a mřížka dlaždic.
function RosterGroup({ title, children }) {
  return (
    <div className={Config.Css.css({ marginBlockEnd: 24 })}>
      <div className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 12, marginBlockEnd: 12 })}>{title}</div>
      <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(240px, 1fr))">{children}</Uu5Elements.Grid>
    </div>
  );
}

// Soupiska **vybrané sezóny**: kdo byl v týmu kdykoli během ní (členství se překrývá
// s obdobím ročníku). U běžící sezóny jen ti, kdo v týmu jsou dnes -- kdo v zimě odešel,
// na aktuální soupisce nemá co dělat.
function Roster({ teamId, seasonId, category }) {
  const period = !seasonId || seasonId === category?.seasonId ? { active: true } : { seasonId };

  const dataObject = useDataObject(
    {
      handlerMap: {
        load: async () => {
          const [playerRes, coachRes] = await Promise.all([
            UiElements.Call.cmdGet("/player/list", { teamId, ...period }),
            UiElements.Call.cmdGet("/management/list", { teamId, ...period }),
          ]);
          return { playerList: playerRes?.itemList ?? [], coachList: coachRes?.itemList ?? [] };
        },
      },
    },
    [teamId, JSON.stringify(period)],
  );

  const { state, data } = dataObject;

  // Skupiny podle postu, v pořadí, v jakém se soupiska čte — brankáři nahoře. Hráč bez
  // postu spadne na konec do „ostatní", ne pod útočníky.
  const groups = useMemo(() => {
    const byPosition = new Map(Config.POSITION_LIST.map((position) => [position, []]));
    const rest = [];

    for (const player of data?.playerList ?? []) {
      if (byPosition.has(player.position)) byPosition.get(player.position).push(player);
      else rest.push(player);
    }

    const result = [...byPosition.entries()]
      .filter(([, list]) => list.length)
      .map(([position, list]) => ({ code: position, list }));

    if (rest.length) result.push({ code: null, list: rest });
    return result;
  }, [data]);

  if (state === "pendingNoData") {
    return (
      <Section>
        <Uu5Elements.Skeleton height={200} />
      </Section>
    );
  }

  const coachList = staffOf(data?.coachList);

  // Realizační tým je poslední skupina soupisky, stejné dlaždice jako hráči (Caio 2026-10-28).
  return (
    <Section>
      <Heading level={2} lsi={lsi("team", "players")} />
      <div className={Config.Css.css({ marginBlockStart: 24 })}>
        {groups.length === 0 && coachList.length === 0 ? (
          <EmptyState lsi={lsi("team", "noPlayers")} icon="uugds-account-multi" />
        ) : (
          <>
            {groups.map((group) => (
              <RosterGroup
                key={group.code ?? "other"}
                title={
                  group.code ? (
                    // Nadpis skupiny je v množném čísle ("Obránci"), post jednoho hráče
                    // v jednotném ("Obránce") -- proto dva různé číselníky.
                    <Lsi import={importLsi} path={["enum", "positionGroup", group.code]} />
                  ) : (
                    <Lsi import={importLsi} path={["team", "otherPlayers"]} />
                  )
                }
              >
                {group.list.map((player) => (
                  <PlayerTile key={player.id} player={player} />
                ))}
              </RosterGroup>
            ))}
            {coachList.length ? (
              <RosterGroup title={<Lsi import={importLsi} path={["team", "staff"]} />}>
                {coachList.map((coach) => (
                  <CoachTile key={coach.id} coach={coach} />
                ))}
              </RosterGroup>
            ) : null}
          </>
        )}
      </div>
    </Section>
  );
}

function OpponentRedirect({ teamId, seasonId }) {
  const [, setRoute] = useRoute();
  useEffect(() => {
    setRoute("muzstvo/zapasy", { id: teamId, seasonId }, { replace: true });
  }, [teamId, seasonId]);
  return null;
}

const Team = createVisualComponent({
  uu5Tag: Config.TAG + "Team",

  render() {
    return (
      <TeamShell>
        {({ teamId, seasonId, category, isOpponent }) =>
          // Soupeř soupisku nemá (team-shell.jsx): `muzstvo?id=<soupeř>` vede na jeho zápasy.
          isOpponent ? (
            <OpponentRedirect teamId={teamId} seasonId={seasonId} />
          ) : (
            <Roster teamId={teamId} seasonId={seasonId} category={category} />
          )
        }
      </TeamShell>
    );
  },
});

export default Team;
