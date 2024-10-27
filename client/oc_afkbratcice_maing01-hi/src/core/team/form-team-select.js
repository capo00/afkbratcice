//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import { useTeam } from "./team-context";
//@@viewOff:imports

const FormTeamSelect = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "FormTeamSelect",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { compareKey, ...restProps } = props;
    const formApi = Uu5Forms.useFormApi();
    const { data: teamData } = useTeam();

    let data;
    if (teamData) {
      data = [];
      teamData.forEach(({ data: team }) => {
        if (!formApi.value.age || team.age === formApi.value.age) {
          data.push(team);
        }
      });
      data.sort((a, b) => a.name.localeCompare(b.name));
      // console.log(JSON.stringify(Object.fromEntries(data.map((item) => [item.name, item.id]))));
    }

    //@@viewOn:render
    const Component = data ? Uu5Forms.FormTextSelect : Uu5Forms.TextSelect;

    return (
      <Component
        {...restProps}
        pending={!data}
        itemList={data
          ?.map(({ id, name }) => (id !== formApi.value[compareKey] ? { value: id, children: name } : null))
          .filter(Boolean)}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { FormTeamSelect };
export default FormTeamSelect;
//@@viewOff:exports
