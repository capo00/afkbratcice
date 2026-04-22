import { createComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import BackButton from "./back-button.js";

const Header = createComponent({
  uu5Tag: Config.TAG + "Header",

  render(props) {
    const { onBack, children } = props;
    return (
      <Uu5Elements.Text category="interface" segment="title" type="common">
        {({ style }) => (
          <div className={Config.Css.css({
            display: "flex",
            alignItems: "center",
            gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]),
            height: Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", "m"]).h,
            ...style,
          })}>
            {onBack && <BackButton onClick={onBack} />}
            <span>{children}</span>
          </div>
        )}
      </Uu5Elements.Text>
    );
  },
});

export default Header;
