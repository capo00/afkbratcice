//@@viewOn:imports
import { createVisualComponent, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { Call } from "../libs/oc_cli-elements/index.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const StandingsList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "StandingsList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { turnamentId } = props;

    const standingsDto = useDataObject({
      handlerMap: {
        load: () => Call.cmdGet("turnament/getStandings", { id: turnamentId }),
      },
    });
    //@@viewOff:private

    //@@viewOn:render
    if (standingsDto.state === "pending" || standingsDto.state === "pendingNoData") {
      return <Uu5Elements.Pending />;
    }

    const standings = standingsDto.data ?? [];

    if (standings.length === 0) {
      return null;
    }

    return (
      <Uu5Elements.Block headerType="title" header="Tabulka" card="full">
        <Uu5Elements.Grid>
          <table className={Config.Css.css({ width: "100%", borderCollapse: "collapse" })}>
            <thead>
              <tr>
                <th className={Config.Css.css({ padding: 8, textAlign: "left" })}>#</th>
                <th className={Config.Css.css({ padding: 8, textAlign: "left" })}>Tým</th>
                <th className={Config.Css.css({ padding: 8, textAlign: "center" })}>Z</th>
                <th className={Config.Css.css({ padding: 8, textAlign: "center" })}>V</th>
                <th className={Config.Css.css({ padding: 8, textAlign: "center" })}>R</th>
                <th className={Config.Css.css({ padding: 8, textAlign: "center" })}>P</th>
                <th className={Config.Css.css({ padding: 8, textAlign: "center" })}>Skóre</th>
                <th className={Config.Css.css({ padding: 8, textAlign: "center" })}>B</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, i) => {
                const s = team.stats ?? {};
                const diff = s.scored - s.conceded;
                const diffStr = diff >= 0 ? "+" + diff : String(diff);
                return (
                  <tr key={team.code ?? i}>
                    <td className={Config.Css.css({ padding: 8 })}>{i + 1}</td>
                    <td className={Config.Css.css({ padding: 8 })}>
                      <b>{team.name ?? team.code}</b>
                    </td>
                    <td className={Config.Css.css({ padding: 8, textAlign: "center" })}>{s.played ?? 0}</td>
                    <td className={Config.Css.css({ padding: 8, textAlign: "center" })}>{s.wins ?? 0}</td>
                    <td className={Config.Css.css({ padding: 8, textAlign: "center" })}>{s.draws ?? 0}</td>
                    <td className={Config.Css.css({ padding: 8, textAlign: "center" })}>{s.losses ?? 0}</td>
                    <td className={Config.Css.css({ padding: 8, textAlign: "center" })}>
                      {s.scored ?? 0}:{s.conceded ?? 0} ({diffStr})
                    </td>
                    <td className={Config.Css.css({ padding: 8, textAlign: "center", fontWeight: "bold" })}>{s.points ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Uu5Elements.Grid>
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { StandingsList };
export default StandingsList;
//@@viewOff:exports
