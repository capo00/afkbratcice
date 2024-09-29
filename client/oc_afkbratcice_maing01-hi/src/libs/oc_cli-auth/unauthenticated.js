//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useSession } from "./session";
//@@viewOff:imports

const Unauthenticated = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Unauthenticated",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { login } = useSession();

    //@@viewOn:render
    return (
      <Uu5Elements.Grid {...props} templateColumns="1fr" justifyItems="center">
        <Uu5Elements.PlaceholderBox code="account" borderRadius="full" header="" info="" />
        <Uu5Elements.Text category="interface" segment="title" type="main">
          <Lsi lsi={{ cs: "Pro zobrazení obsahu se přihlaste" }} />
        </Uu5Elements.Text>
        <Uu5Elements.Button onClick={() => login()} colorScheme="primary" significance="highlighted">
          <Lsi lsi={{ cs: "Přihlásit se" }} />
        </Uu5Elements.Button>
        <Uu5Elements.Button disabled colorScheme="primary" significance="subdued">
          <Lsi lsi={{ cs: "Registrovat se" }} />
        </Uu5Elements.Button>
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Unauthenticated };
export default Unauthenticated;
//@@viewOff:exports
