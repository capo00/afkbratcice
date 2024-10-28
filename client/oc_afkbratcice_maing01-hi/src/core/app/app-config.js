//@@viewOn:imports
import { createVisualComponent, Lsi, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5CodeKit from "uu5codekitg01";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { useApp } from "./app-context";
//@@viewOff:imports

const AppConfig = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AppConfig",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { data, handlerMap } = useApp();

    const { sys, ...config } = data ?? {};

    //@@viewOn:render
    return (
      <Uu5Elements.Block headerType="heading" header={<Lsi lsi={{ cs: "App Config" }} />}>
        {config ? (
          <Uu5Forms.Form
            gridLayout="config, submit"
            onSubmit={async (e) => {
              const { config } = e.data.value;
              await handlerMap.update(typeof config === "string" ? JSON.parse(config) : config);
            }}
          >
            <Uu5CodeKit.FormJson name="config" initialValue={config} format="pretty" />

            <Uu5Forms.SubmitButton name="submit" className={Config.Css.css({ justifySelf: "end" })} />
          </Uu5Forms.Form>
        ) : (
          <Uu5Elements.Skeleton height={400} borderRadius="moderate" />
        )}
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { AppConfig };
export default AppConfig;
//@@viewOff:exports
