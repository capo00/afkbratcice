//@@viewOn:imports
import { createVisualComponent, useState, Utils } from "uu5g05";
import Config from "./config/config.js";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function TextInput(props) {
  const { onEnter, value: initialValue, elementAttrs, ...restProps } = props;
  const [value, setValue] = useState(initialValue);

  return (
    <Uu5Forms.Text.Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.data.value)}
      elementAttrs={{
        ...elementAttrs,
        onKeyDownCapture: (e) => {
          elementAttrs?.onKeyDownCapture?.(e);
          if (e.key === "Enter") {
            onEnter?.(new Utils.Event({ value }, e));
          }
        }
      }}
    />
  );
}
//@@viewOff:helpers

const TeamList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList = [], editable, onUpdate, onDelete } = props;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Grid>
        {itemList.map((item, i) => {
          const { code, name, desc } = item;
          return (
            <Uu5Elements.ListItem key={i} actionList={editable ? [{ icon: "uugds-pencil", onClick: () => onUpdate(item) }, { icon: "uugds-delete", colorScheme: "negative", onClick: onDelete }] : undefined}>
              <div className={Config.Css.css({ display: "flex", gap: 8 })}>
                <span className={Config.Css.css({ width: 40 })}>{code}</span>
                <div><b>{name}</b> ({desc})</div>
              </div>
            </Uu5Elements.ListItem>
          )
        })}
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamList };
export default TeamList;
//@@viewOff:exports
