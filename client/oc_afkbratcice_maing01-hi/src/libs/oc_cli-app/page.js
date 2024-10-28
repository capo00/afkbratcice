//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import Top from "./top";
//@@viewOff:imports

const Page = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Page",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children, ...topProps }) {
    const spacing = Uu5Elements.useSpacing();

    //@@viewOn:render
    return (
      <Top {...topProps}>
        <main
          className={Config.Css.css({
            paddingInline: spacing.c,
            marginTop: spacing.d,
          })}
        >
          {children}
        </main>
      </Top>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Page };
export default Page;
//@@viewOff:exports
