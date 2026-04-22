import { createComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

const BackButton = createComponent({
  uu5Tag: Config.TAG + "BackButton",

  render(props) {
    return (
      <Uu5Elements.Button
        icon="mdi-arrow-left"
        significance="subdued"
        {...props}
      />
    );
  },
});

export default BackButton;
