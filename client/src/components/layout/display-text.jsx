import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";

const { theme } = Config;

// Text in the club display font (Bebas) that is not a heading: the score on a match tile,
// the club name in the footer. A heading goes through `Heading`, which sets the outline.
//
// The size is a uuGds token (`category` / `segment` / `type`, default `expose/default/lead`),
// never a number (design/ux-design-system.md, 2.1). `Uu5Elements.Text` computes it, including
// the small-screen step, and the theme adds what GDS has no token for: font, letter spacing,
// uppercase and weight 400 (Bebas has a single weight, a GDS 700 would be synthesized).
//
// The caller's `className` goes through `Css.join` (emotion `cx`): its rules then come after
// ours in one class. As a separate class it would depend on the order emotion inserted the two,
// and a margin from the caller would sometimes lose to our `margin: 0`.

const DisplayText = createVisualComponent({
  uu5Tag: Config.TAG + "DisplayText",

  render(props) {
    const { category = "expose", segment = "default", type = "lead", as: Tag = "span", children } = props;

    return (
      <Uu5Elements.Text category={category} segment={segment} type={type}>
        {({ style }) => {
          const attrs = Utils.VisualComponent.getAttrs(
            props,
            Config.Css.join(Config.Css.css({ ...style, ...theme.typography.display, margin: 0 }), props.className),
          );
          return <Tag {...attrs}>{children}</Tag>;
        }}
      </Uu5Elements.Text>
    );
  },
});

export default DisplayText;
