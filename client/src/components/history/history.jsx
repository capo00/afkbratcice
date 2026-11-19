import { createVisualComponent } from "uu5g05";
import Config from "../../config/config.js";
import Prose from "../layout/prose.jsx";
import HistoryTimeline from "./history-timeline.jsx";
import { HISTORY_INTRO, HISTORY_SOURCES, HISTORY_MILESTONE_LIST } from "../../content/history.js";

// Tělo stránky `/historie` (routes/page.jsx, `OWN_PAGES`): úvod, časová osa, zdroje.
// Osa stojí **mimo `Prose`**: jeho `& p` a `& h3` by přebily sazbu položek. Šířka všech tří
// je šířka textu obsahových stránek (720 px).

const WIDTH = Config.Css.css({ maxWidth: 720 });

const History = createVisualComponent({
  uu5Tag: Config.TAG + "History",

  render() {
    return (
      <>
        <Prose className={Config.Css.join(WIDTH, Config.Css.css({ marginBlockStart: 24 }))}>
          <p>{HISTORY_INTRO}</p>
        </Prose>
        <HistoryTimeline itemList={HISTORY_MILESTONE_LIST} className={Config.Css.join(WIDTH, Config.Css.css({ marginBlockStart: 8 }))} />
        <Prose className={Config.Css.join(WIDTH, Config.Css.css({ marginBlockStart: 24 }))}>
          {HISTORY_SOURCES.map((text) => (
            <p key={text}>
              <i>{text}</i>
            </p>
          ))}
        </Prose>
      </>
    );
  },
});

export default History;
