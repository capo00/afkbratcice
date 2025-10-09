//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TeamManagerModal = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamManagerModal",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data, onSubmit, onClose } = props;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Forms.Form.Provider initialValue={data} onSubmit={async (e) => onSubmit(e.data.value)}>
        <Uu5Elements.Modal open onClose={onClose} header={(data ? "Upravit" : "Vytvořit") + " tým"} footer={
          <div className={Config.Css.css({ display: "flex", justifyContent: "end", gap: 8 })}>
            <Uu5Forms.CancelButton onClick={onClose} />
            <Uu5Forms.SubmitButton />
          </div>
        }>
          <Uu5Forms.Form.View gridLayout="name name code, desc desc desc">
            <Uu5Forms.FormText name="name" label="Název" required />
            <Uu5Forms.FormText name="code" label="Skupina" />
            <Uu5Forms.FormTextArea name="desc" label="Popis" />
          </Uu5Forms.Form.View>
        </Uu5Elements.Modal>
      </Uu5Forms.Form.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamManagerModal };
export default TeamManagerModal;
//@@viewOff:exports
