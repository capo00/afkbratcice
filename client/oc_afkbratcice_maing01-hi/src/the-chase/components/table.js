//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

//@@viewOff:imports

const Table = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Table",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { itemList } = props;

    //@@viewOn:render
    return (
      <Uu5Elements.Grid rowGap={4}>
        {({ style }) => (
          <Uu5Elements.Box
            shape="background"
            colorScheme="building"
            borderRadius="moderate"
            className={Config.Css.css({ ...style, padding: 8, width: 360 })}
          >
            {itemList.map((props, i) => (
              <Uu5Elements.Box
                key={i}
                colorScheme="dark-blue"
                significance="highlighted"
                borderRadius="moderate"
                {...props}
                className={Config.Css.css({
                  height: 48,
                  paddingInline: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  ...props.style,
                })}
              />
            ))}
          </Uu5Elements.Box>
        )}
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Table };
export default Table;
//@@viewOff:exports
