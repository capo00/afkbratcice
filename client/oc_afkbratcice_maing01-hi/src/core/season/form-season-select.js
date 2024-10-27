//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import { useSeason } from "./season-context";
import SeasonText from "./season-text";
//@@viewOff:imports

const FormSeasonSelect = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "FormSeasonSelect",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const formApi = Uu5Forms.useFormApi();
    const { data: seasonData } = useSeason();

    let data;
    if (seasonData) {
      if (formApi.value.age) {
        data = [];
        seasonData.forEach(({ data: season }) => {
          if (season.age === formApi.value.age) {
            data.push(season);
          }
        });
      } else {
        data = seasonData.map(({ data }) => data);
      }
    }

    //@@viewOn:render
    const Component = data ? Uu5Forms.FormTextSelect : Uu5Forms.TextSelect;

    return (
      <Component
        {...props}
        pending={!data}
        itemList={data?.map(({ id }) => ({
          value: id,
          children: <SeasonText id={id} displayAge={false} />,
          selectedChildren: <SeasonText id={id} displayAge={false} />,
        }))}
        onChange={(e) => {
          if (e.data.value) formApi.setItemValue("age", data.find(({ id }) => id === e.data.value).age);
        }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { FormSeasonSelect };
export default FormSeasonSelect;
//@@viewOff:exports
