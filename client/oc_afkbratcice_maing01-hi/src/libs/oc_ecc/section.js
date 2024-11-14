//@@viewOn:imports
import { createVisualComponent, useState, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5RichTextElements from "uu5richtextg01-elements";
import Config from "./config/config.js";
import SectionEditable from "./section-editable";
//@@viewOff:imports

const Section = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Section",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { editMode, dto } = props;

    let result = null;
    if (editMode) {
      result = <SectionEditable {...props} />;
    } else if (dto.data?.uu5String) {
      result = <section>{Utils.Uu5String.toChildren(dto.data.uu5String)}</section>;
    }

    //@@viewOn:render
    return result;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Section };
export default Section;
//@@viewOff:exports
