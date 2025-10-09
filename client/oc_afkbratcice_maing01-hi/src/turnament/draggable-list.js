//@@viewOn:imports
import { createVisualComponent, useState, Utils } from "uu5g05";
import Config from "./config/config.js";
import Uu5Elements from "uu5g05-elements";
import Uu5DnD from "uu5dndg01";
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

const ScrollableBoxWithItemGaps = createComponent({
  uu5Tag: Config.Tag + "ScrollableBoxWithItemGaps",
  render(props) {
    const gap = Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]);

    return (
      <Uu5Elements.ScrollableBox
        {...props}
        className={Utils.Css.joinClassName(
          Config.Css.css({ display: "flex", flexDirection: "column", gap }),
          props.className
        )}
      />
    );
  },
});

const DraggableListItem = Uu5DnD.withDraggable(Uu5Elements.ListItem);
const DraggableList = Uu5DnD.withDroppableItemList(ScrollableBoxWithItemGaps, DraggableListItem);
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
    const { itemList = [], editable, onUpdate } = props;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Block headerType="title" header="Tým">
        <Uu5Elements.Grid>
          {itemList?.map((item, i) => {
            const { name } = item;
            return (
              <Uu5Elements.ListItem key={i}>
                {name}
              </Uu5Elements.ListItem>
            )
          })}
          {editable && (
            <Uu5Elements.ListItem key={itemList.length}>
              <TextInput onEnter={(e) => onUpdate?.([...itemList, { name: e.data.value }])} significance="subdued" width="100%" />
            </Uu5Elements.ListItem>
          )}
        </Uu5Elements.Grid>
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamList };
export default TeamList;
//@@viewOff:exports
