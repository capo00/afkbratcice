//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import OcAuth from "../libs/oc_cli-auth/index.js";
import Config from "./config/config.js";
import TeamList from "./team-list.js";
import TeamManagerModal from "./team-manager-modal.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TeamOverview = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamOverview",
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
    const [open, setOpen] = useState(false);
    const [dialog, setDialog] = useState(false);

    const { data, handlerMap } = dto;
    const isAuth = session.identity.profileList?.includes?.("authorities") && dto.data.owner === session.identity.identity;
    const isOperatives = data.operativeList?.includes?.(session.identity.identity);
    const editable = isAuth || isOperatives;

    let actionList;
    if (editable) actionList = [{ icon: "uugds-plus", onClick: () => setOpen(true) }];
    //@@viewOff:private

    //@@viewOn:render
    return (
      <>
        <Uu5Elements.Block headerType="title" header="Týmy" actionList={actionList} card="full">
          <TeamList itemList={data.teamList} onUpdate={(data) => setOpen(data)} editable={editable} onDelete={() => setDialog(data)} />
        </Uu5Elements.Block>
        {!!open && (
          <TeamManagerModal
            data={open === true ? undefined : open}
            onSubmit={async (newTeamData) => {
              const newData = { id: data.id };
              const teamList = data.teamList ? [...data.teamList] : [];
              if (open === true) {
                // new
                teamList.push(newTeamData);
              } else {
                // update
                const teamI = teamList.findIndex((t) => t.name = open.name);
                const team = teamList[teamI];
                teamList[teamI] = { ...team, ...newTeamData };
              }
              newData.teamList = teamList;
              await handlerMap.updateData(newData);

              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        )}
        {!!dialog && (
          <Uu5Elements.Dialog open onClose={() => setDialog(false)} header={"Smazat tým " + dialog.name + "?"} icon="uugds-delete" actionList={[
            {
              children: "Smazat",
              onClick: async () => {
                const newData = { id: data.id };
                const teamList = data.teamList.filter((team) => team.name !== dialog.name);
                newData.teamList = teamList;
                await handlerMap.updateData(newData);
                setDialog(false);
              },
              colorScheme: "negative",
              significance: "highlighted",
            },
            {
              children: "Zrušit",
              onClick: () => setDialog(false),
            },
          ]} />
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamOverview };
export default TeamOverview;
//@@viewOff:exports
