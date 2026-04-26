import { createComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

const Button = createComponent({
  uu5Tag: Config.TAG + "Button",

  render(props) {
    const { active, info, children, pending, ...restProps } = props;

    return pending ? (
      <Uu5Elements.Skeleton borderRadius="moderate" className={Config.Css.css({ minWidth: 0, aspectRatio: 1 })} />
    ) : (
      <Uu5Elements.Box
        shape="interactiveElement"
        significance={active ? "highlighted" : "common"}
        {...restProps}
        borderRadius="moderate"
        colorScheme="pink"
        className={Config.Css.css({
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 8,
          minWidth: 0,
          aspectRatio: 1,
        })}
      >
        {info && (
          <Uu5Elements.Badge
            colorScheme="building"
            size="xl"
            className={Config.Css.css({
              position: "absolute",
              top: -1,
              right: -1,
            })}
          >
            {info}
          </Uu5Elements.Badge>
        )}
        {children}
      </Uu5Elements.Box>
    );
  },
});

export default Button;
