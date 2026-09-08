import { createVisualComponent, useDataObject, useMemo, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import EmptyState from "../components/empty-state.jsx";
import TeamShell from "../components/team/team-shell.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Soupiska mužstva: hráči po postech + realizační tým.
//
// **Jména mládeže sem nechodí ze serveru** (`appConfig.hideNamesAgeList`): u kategorií, kde
// se jména skrývají, vrací API `person` bez `name` a `surname` komukoli bez role. Klient
// tedy nic neschovává — jen musí umět dlaždici vykreslit bez jména, tedy číslem dresu
// a postem. Kdyby se spoléhal na to, že jméno vždycky přijde, ukázal by u dětí prázdno.

function playerName(player, isNameHidden) {
  const name = [player.person?.name, player.person?.surname].filter(Boolean).join(" ");
  if (name) return name;
  // Buď je jméno schované (mládež), nebo osoba u hráče chybí. Číslo dresu je jediná
  // identifikace, kterou v obou případech máme.
  return isNameHidden && player.number ? `#${player.number}` : null;
}

function PlayerTile({ player, isNameHidden }) {
  const [, setRoute] = useRoute();
  const name = playerName(player, isNameHidden);

  return (
    <Card onClick={() => setRoute("hrac", { id: player.id })}>
      <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12 })}>
        {/* Portrét i náhrada za něj je `RichIcon` — kolečko s obrázkem nebo s textem je
            přesně to, na co je (`size="xl"` = 48 px z GDS). Hráč bez fotky je běžný stav,
            u mládeže dokonce pravidlo, takže se místo portrétu ukáže číslo dresu.
            `text` se nesmí předat spolu s `imageSrc` — vykreslilo by se přes fotku. */}
        <Uu5Elements.RichIcon
          size="xl"
          significance="distinct"
          imageSrc={player.person?.photoUri}
          text={player.person?.photoUri ? undefined : String(player.number ?? "?")}
        />

        <div className={Config.Css.css({ minInlineSize: 0 })}>
          <div className={Config.Css.css({ ...theme.typography.display, fontSize: 18 })}>
            {name ?? <Lsi import={importLsi} path={["team", "unnamedPlayer"]} />}
          </div>
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({ color: theme.color.mutedFg })}
          >
            {player.position ? <Lsi import={importLsi} path={["enum", "position", player.position]} /> : null}
            {player.number && name ? ` · #${player.number}` : null}
          </Uu5Elements.Text>
        </div>
      </div>
    </Card>
  );
}

function Roster({ teamId, category }) {
  const { isNameHidden } = useApp();
  const nameHidden = isNameHidden(category?.age);

  const dataObject = useDataObject(
    {
      handlerMap: {
        load: async () => {
          const [playerRes, coachRes] = await Promise.all([
            UiElements.Call.cmdGet("/player/list", { teamId, active: true }),
            UiElements.Call.cmdGet("/coach/list", { teamId, active: true }),
          ]);
          return { playerList: playerRes?.itemList ?? [], coachList: coachRes?.itemList ?? [] };
        },
      },
    },
    [teamId],
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

  const coachList = data?.coachList ?? [];

  return (
    <>
      <Section>
        <Heading level={2} lsi={lsi("team", "players")} />
        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {groups.length === 0 ? (
            <EmptyState lsi={lsi("team", "noPlayers")} icon="uugds-account-multi" />
          ) : (
            groups.map((group) => (
              <div key={group.code ?? "other"} className={Config.Css.css({ marginBlockEnd: 24 })}>
                <div className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 12, marginBlockEnd: 12 })}>
                  {group.code ? (
                    // Nadpis skupiny je v množném čísle ("Obránci"), post jednoho hráče
                    // v jednotném ("Obránce") -- proto dva různé číselníky.
                    <Lsi import={importLsi} path={["enum", "positionGroup", group.code]} />
                  ) : (
                    <Lsi import={importLsi} path={["team", "otherPlayers"]} />
                  )}
                </div>
                <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(240px, 1fr))">
                  {group.list.map((player) => (
                    <PlayerTile key={player.id} player={player} isNameHidden={nameHidden} />
                  ))}
                </Uu5Elements.Grid>
              </div>
            ))
          )}
        </div>
      </Section>

      {coachList.length ? (
        <Section variant="hatched">
          <Heading level={2} lsi={lsi("team", "staff")} />
          <Uu5Elements.Grid
            templateColumns="repeat(auto-fill, minmax(240px, 1fr))"
            className={Config.Css.css({ marginBlockStart: 24 })}
          >
            {coachList.map((coach) => (
              <Card key={coach.id}>
                <div className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 11 })}>
                  <Lsi import={importLsi} path={["enum", "coachRole", coach.role ?? "assistant"]} />
                </div>
                <div className={Config.Css.css({ ...theme.typography.display, fontSize: 18, marginBlockStart: 4 })}>
                  {[coach.person?.name, coach.person?.surname].filter(Boolean).join(" ") || "—"}
                </div>
              </Card>
            ))}
          </Uu5Elements.Grid>
        </Section>
      ) : null}
    </>
  );
}

const Team = createVisualComponent({
  uu5Tag: Config.TAG + "Team",

  render() {
    return <TeamShell>{({ teamId, category }) => <Roster teamId={teamId} category={category} />}</TeamShell>;
  },
});

export default Team;
