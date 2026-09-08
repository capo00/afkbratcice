import { createVisualComponent, useDataObject, useRoute, useMemo, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import MatchTile from "../components/match-tile.jsx";
import EmptyState from "../components/empty-state.jsx";
import { seasonLabel } from "../components/season-select.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Profil hráče: karta, statistiky po sezónách a poslední zápasy.
//
// Tři dotazy paralelně. `stats/getPlayerStats` vrací `bySeasonList` **jen se `seasonId`**,
// takže sezóny se dopojmenovávají přes `season/list?idList` — ten filtr vznikl přesně
// kvůli téhle obrazovce, aby nemusela načítat všechny sezóny klubu kvůli pěti řádkům.
// Poslední zápasy jedou přes `match/list?playerId`, což je druhý filtr doplněný kvůli
// tomuhle profilu.

const STAT_COLUMN_LIST = ["appearances", "starts", "goals", "yellowCards", "redCards"];

function PlayerCard({ player, isNameHidden }) {
  const name = [player?.person?.name, player?.person?.surname].filter(Boolean).join(" ");

  return (
    <Card topStripe>
      <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" })}>
        {/* Stejné kolečko jako na soupisce (`routes/team.jsx`), jen větší — `RichIcon`
            bere výšku i číslem, když na ni není token. Bez fotky se ukáže číslo dresu;
            `text` a `imageSrc` se nesmí sejít, text by se vykreslil přes fotku. */}
        <Uu5Elements.RichIcon
          height={96}
          significance="distinct"
          imageSrc={player?.person?.photoUri}
          text={player?.person?.photoUri ? undefined : String(player?.number ?? "?")}
        />

        <div>
          <div className={Config.Css.css({ ...theme.typography.display, fontSize: 32 })}>
            {/* Prázdné jméno = mládež (server jména dětí nevrací) nebo hráč bez osoby. */}
            {name || (isNameHidden && player?.number ? `#${player.number}` : null) || (
              <Lsi import={importLsi} path={["team", "unnamedPlayer"]} />
            )}
          </div>
          <div className={Config.Css.css({ display: "flex", gap: 12, color: theme.color.mutedFg, flexWrap: "wrap" })}>
            {player?.position ? (
              <span>
                <Lsi import={importLsi} path={["enum", "position", player.position]} />
              </span>
            ) : null}
            {player?.number ? <span>#{player.number}</span> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatsTable({ bySeasonList, total, seasonMap }) {
  const cell = Config.Css.css({
    paddingBlock: 10,
    paddingInline: 8,
    borderBlockEnd: `1px solid ${theme.color.border}`,
    whiteSpace: "nowrap",
  });

  return (
    <div className={Config.Css.css({ overflowX: "auto" })}>
      <table
        className={Config.Css.css({
          inlineSize: "100%",
          borderCollapse: "collapse",
          fontVariantNumeric: "tabular-nums",
        })}
      >
        <thead>
          <tr className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 11, textAlign: "start" })}>
            <th className={cell + " " + Config.Css.css({ textAlign: "start" })} scope="col">
              <Lsi import={importLsi} path={["team", "season"]} />
            </th>
            {STAT_COLUMN_LIST.map((code) => (
              <th key={code} scope="col" className={cell + " " + Config.Css.css({ textAlign: "center" })}>
                <Lsi import={importLsi} path={["stats", code]} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bySeasonList.map((row) => {
            const season = seasonMap.get(row.seasonId);
            return (
              <tr key={row.seasonId ?? "?"}>
                <th scope="row" className={cell + " " + Config.Css.css({ textAlign: "start", fontWeight: 400 })}>
                  {season ? `${seasonLabel(season)} · ${season.competition}` : "—"}
                </th>
                {STAT_COLUMN_LIST.map((code) => (
                  <td key={code} className={cell + " " + Config.Css.css({ textAlign: "center" })}>
                    {row[code] ?? 0}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr className={Config.Css.css({ fontWeight: 700 })}>
            <th scope="row" className={cell + " " + Config.Css.css({ textAlign: "start" })}>
              <Lsi import={importLsi} path={["stats", "total"]} />
            </th>
            {STAT_COLUMN_LIST.map((code) => (
              <td
                key={code}
                className={
                  cell + " " + Config.Css.css({ textAlign: "center", color: code === "goals" ? theme.color.clubRed : "inherit" })
                }
              >
                {total?.[code] ?? 0}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const Player = createVisualComponent({
  uu5Tag: Config.TAG + "Player",

  render() {
    const [route] = useRoute();
    const playerId = route?.params?.id;
    const { categoryList, isNameHidden } = useApp();

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: async () => {
            const [player, stats, matches] = await Promise.all([
              UiElements.Call.cmdGet("/player/get", { id: playerId }),
              UiElements.Call.cmdGet("/stats/getPlayerStats", { playerId }),
              UiElements.Call.cmdGet("/match/list", { playerId, order: "desc", pageInfo: { pageSize: 5 } }),
            ]);

            const seasonIdList = (stats?.bySeasonList ?? []).map((row) => row.seasonId).filter(Boolean);
            const seasons = seasonIdList.length
              ? await UiElements.Call.cmdGet("/season/list", { idList: seasonIdList })
              : { itemList: [] };

            return {
              player,
              stats,
              matchList: matches?.itemList ?? [],
              seasonList: seasons?.itemList ?? [],
            };
          },
        },
      },
      [playerId],
    );

    const { state, data } = dataObject;

    const seasonMap = useMemo(
      () => new Map((data?.seasonList ?? []).map((season) => [season.id, season])),
      [data],
    );

    if (!playerId || state === "errorNoData") {
      return (
        <Section>
          <EmptyState lsi={lsi("player", "missing")} icon="uugds-account" />
        </Section>
      );
    }

    if (state === "pendingNoData") {
      return (
        <Section>
          <Uu5Elements.Skeleton height={280} />
        </Section>
      );
    }

    const { player, stats, matchList } = data;
    // Kategorie, ve které hráč aktuálně je — kvůli tomu, jestli se skrývají jména.
    const category = categoryList.find((item) => (player?.teamList ?? []).some((m) => m.id === item.teamId));
    const bySeasonList = stats?.bySeasonList ?? [];

    return (
      <>
        <Section>
          <PlayerCard player={player} isNameHidden={isNameHidden(category?.age)} />
        </Section>

        <Section variant="hatched">
          <Heading lsi={lsi("player", "stats")} />
          <div className={Config.Css.css({ marginBlockStart: 24 })}>
            {bySeasonList.length === 0 ? (
              <EmptyState lsi={lsi("player", "noStats")} icon="uugds-view-list" />
            ) : (
              <StatsTable bySeasonList={bySeasonList} total={stats?.total} seasonMap={seasonMap} />
            )}
          </div>
        </Section>

        {matchList.length ? (
          <Section>
            <Heading lsi={lsi("player", "matches")} />
            <Uu5Elements.Grid
              templateColumns="repeat(auto-fill, minmax(280px, 1fr))"
              className={Config.Css.css({ marginBlockStart: 24 })}
            >
              {matchList.map((match) => (
                <MatchTile key={match.id} match={match} ownTeamId={category?.teamId} />
              ))}
            </Uu5Elements.Grid>
          </Section>
        ) : null}
      </>
    );
  },
});

export default Player;
