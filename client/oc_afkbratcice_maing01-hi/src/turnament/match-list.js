//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import OcAuth from "../libs/oc_cli-auth/index.js";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function groupMatchesByPlace(matchList) {
  const byPlace = {};
  matchList.forEach((match) => {
    const key = match.place ?? "_";
    if (!byPlace[key]) byPlace[key] = [];
    byPlace[key].push(match);
  });
  return byPlace;
}
//@@viewOff:helpers

const MatchList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { dto } = props;

    const session = OcAuth.useSession();
    const { data, handlerMap } = dto;
    const isAuth = session.identity?.profileList?.includes?.("authorities") && data.owner === session.identity.identity;
    const isOperative = data.operativeList?.includes?.(session.identity?.identity);
    const isReferee = data.refereeList?.includes?.(session.identity?.identity);
    const editable = isAuth || isOperative || isReferee;

    const [editMatch, setEditMatch] = useState(null);
    const matchList = data.matchList ?? [];
    const grouped = groupMatchesByPlace(matchList);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <>
        <Uu5Elements.Block headerType="title" header="Zápasy" card="full">
          {Object.entries(grouped).map(([place, matches]) => (
            <Uu5Elements.Block key={place} headerType="subtitle" header={place === "_" ? null : place}>
              <Uu5Elements.Grid>
                {matches.map((match, i) => {
                  const [home, away] = (match.code ?? "").split("-");
                  const resultDisplay = match.result ?? "–";
                  return (
                    <Uu5Elements.ListItem
                      key={match.code ?? i}
                      actionList={editable ? [{ icon: "uugds-pencil", onClick: () => setEditMatch(match) }] : undefined}
                    >
                      <div className={Config.Css.css({ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" })}>
                        <span className={Config.Css.css({ minWidth: 60 })}>{home}</span>
                        <span>–</span>
                        <span className={Config.Css.css({ minWidth: 60 })}>{away}</span>
                        <span className={Config.Css.css({ fontWeight: "bold", marginLeft: 8 })}>{resultDisplay}</span>
                      </div>
                    </Uu5Elements.ListItem>
                  );
                })}
              </Uu5Elements.Grid>
            </Uu5Elements.Block>
          ))}
        </Uu5Elements.Block>
        {!!editMatch && (
          <Uu5Forms.Form.Provider
            initialValue={{ result: editMatch.result ?? "", middleResultList: editMatch.middleResultList ?? [] }}
            onSubmit={async (e) => {
              const { result, middleResultList } = e.data.value;
              await handlerMap.setResult({ code: editMatch.code, result: result || undefined, middleResultList });
              setEditMatch(null);
              handlerMap.load();
            }}
          >
            <Uu5Elements.Modal
              open
              onClose={() => setEditMatch(null)}
              header={"Výsledek: " + editMatch.code}
              footer={
                <div className={Config.Css.css({ display: "flex", justifyContent: "end", gap: 8 })}>
                  <Uu5Forms.CancelButton onClick={() => setEditMatch(null)} />
                  <Uu5Forms.SubmitButton />
                </div>
              }
            >
              <Uu5Forms.Form.View gridLayout="result">
                <Uu5Forms.FormText name="result" label="Výsledek (např. 3:1)" placeholder="3:1" />
              </Uu5Forms.Form.View>
            </Uu5Elements.Modal>
          </Uu5Forms.Form.Provider>
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchList };
export default MatchList;
//@@viewOff:exports
