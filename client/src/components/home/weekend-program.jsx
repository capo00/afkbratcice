import { createVisualComponent, useDataObject, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import Heading from "../layout/heading.jsx";
import MatchTile from "../match-tile.jsx";
import EmptyState from "../empty-state.jsx";
import { useApp } from "../../core/app-context.jsx";

// Program víkendu napříč kategoriemi.
//
// Na starém webu tenhle pohled **není** a je z nabízených nejužitečnější: klub má tři až
// čtyři mužstva, která hrají v sobotu a v neděli na různých místech a v různé časy. Dnes si
// to člověk musí poskládat ze tří widgetů v postranním panelu.
//
// Je to sekce na home, ne vlastní routa — na home se chodí stejně nejdřív a vlastní URL by
// pro jeden seznam byla režie navíc (design/frontend.md, 2.4).
//
// **Jeden dotaz za všechny kategorie.** `match/list` bere `teamIdList`, takže se neptáme
// zvlášť na každé mužstvo; ids se berou ze `season/listCurrent`, takže server nemusí nic
// tušit o tom, co je „naše".

const DAY_MS = 24 * 60 * 60 * 1000;

// Okno je **týden dopředu**, ne „nejbližší sobota a neděle": v týdnu se hrají dohrávky
// a mládež mívá zápas ve všední den. Pevný víkend by je zamlčel.
const WINDOW_DAYS = 7;

function range() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + WINDOW_DAYS * DAY_MS);
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

const WeekendProgram = createVisualComponent({
  uu5Tag: Config.TAG + "WeekendProgram",

  render() {
    const { categoryList } = useApp();
    const teamIdList = useMemo(() => categoryList.map((c) => c.teamId).filter(Boolean), [categoryList]);

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () =>
            teamIdList.length
              ? UiElements.Call.cmdGet("/match/list", { teamIdList, ...range(), order: "asc" })
              : Promise.resolve({ itemList: [] }),
        },
      },
      [teamIdList],
    );

    const { state, data } = dataObject;
    const itemList = data?.itemList ?? [];

    // Kategorie podle týmu, aby dlaždice věděla, jestli je to A-tým nebo žáci. Mapa se
    // staví jednou, ne hledáním v poli pro každý zápas.
    const categoryByTeamId = useMemo(
      () => new Map(categoryList.map((c) => [c.teamId, c.age])),
      [categoryList],
    );

    return (
      <Section id="program">
        <Heading eyebrow={lsi("home", "program", "eyebrow")} lsi={lsi("home", "program", "header")} />

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {state === "pendingNoData" ? (
            <Uu5Elements.Skeleton height={160} />
          ) : itemList.length === 0 ? (
            <EmptyState lsi={lsi("home", "program", "empty")} icon="uugds-calendar" />
          ) : (
            <div
              className={Config.Css.css({
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              })}
            >
              {itemList.map((match) => {
                const ownTeamId = teamIdList.find((id) => id === match.homeTeamId || id === match.guestTeamId);
                return (
                  <MatchTile
                    key={match.id}
                    match={match}
                    ownTeamId={ownTeamId}
                    category={categoryByTeamId.get(ownTeamId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </Section>
    );
  },
});

export default WeekendProgram;
