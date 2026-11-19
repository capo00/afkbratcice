import { createVisualComponent, useScreenSize } from "uu5g05";
import Uu5Extras from "uu5extrasg01";
import Config from "../../config/config.js";
import TimelineItem from "./timeline-item.jsx";

const { theme } = Config;

// Časová osa historie klubu: `Uu5Extras.VerticalTimeline`, vždy v jednom sloupci (Caio 2026-11-19).
//
// Ikona je podle **typu** události, typ se jako štítek nezobrazuje (Caio 2026-11-19). Míč ani
// píšťalku GDS nemá, velký zápas má hvězdu.
//
// Položky jsou všechny stejné, `primary`/`subdued`: červená ikona, **bez rámečku** kolem karty
// i kolečka (Caio 2026-11-19 -- rámeček nikdy). Osa sama je `building`, šedá čára.
//
// `animation` vypnutá: animace skrývá položky, dokud nedoskrolují do obrazu, a čtečky ani
// vyhledávač je pak nevidí.

const TYPE_ICON = {
  club: "uugds-shield", // založení, výročí, název, obnovení činnosti
  competition: "uugdsstencil-education-trophy", // postup, sestup, pohár
  match: "uugds-favorites", // velký zápas
  venue: "uugds-home", // hřiště a zázemí
  youth: "uugds-kid", // mládež
  community: "uugds-account-multi", // akce pro obec a fanoušky
  crisis: "uugds-alert-circle", // přerušení, covid, povodně
};

const HistoryTimeline = createVisualComponent({
  uu5Tag: Config.TAG + "HistoryTimeline",

  render({ itemList, className }) {
    const [screenSize] = useScreenSize();

    return (
      <div
        className={Config.Css.join(
          Config.Css.css({
            // Přepisy CSS knihovny `react-vertical-timeline-component`, které GDS propy neumí:
            // šířka 100 % místo 95 %, kolečko s podkladem stránky (knihovna dává inline bílou,
            // na tmavém by ikona zmizela), bez šipky karty (bez výplně spadne na bílou z CSS
            // knihovny), bez `label` (nepoužívá se), zaoblení z theme, na mobilu menší odsazení.
            "& .vertical-timeline": { width: "100%" },
            "& .vertical-timeline-element-icon": { backgroundColor: `${theme.color.bg} !important` },
            "& .vertical-timeline-element-content-arrow": { display: "none" },
            "& .vertical-timeline-element-date": { display: "none !important" },
            "& .vertical-timeline-element-content": {
              borderRadius: theme.radius,
              ...(screenSize === "xs" && { padding: "12px !important" }),
            },
          }),
          className,
        )}
      >
        <Uu5Extras.VerticalTimeline
          singleColumn
          animation={false}
          colorScheme="building"
          significance="common"
          itemList={itemList.map((item) => ({
            icon: TYPE_ICON[item.type],
            colorScheme: "primary",
            significance: "subdued",
            children: <TimelineItem item={item} />,
          }))}
        />
      </div>
    );
  },
});

export { TYPE_ICON };
export default HistoryTimeline;
