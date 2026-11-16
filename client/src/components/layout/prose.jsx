import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";

const { theme } = Config;

// Rhythm of long text (articles, content pages). The rules target descendants because
// uu5String produces the tags, not us.
//
// An `h3` inside the text takes its size from the uuGds token `story/heading/h4`
// (design/ux-design-system.md, 2.1): `Uu5Elements.Text` computes it with the small-screen
// step and hands it over as `style`, which then goes into the `& h3` rule.
//
// The caller's `className` goes through `Css.join` (emotion `cx`): its rules then come after
// ours in one class. As a separate class it would depend on the order emotion inserted the two,
// and a margin from the caller would sometimes lose to our `margin: 0`.

const Prose = createVisualComponent({
  uu5Tag: Config.TAG + "Prose",

  render(props) {
    return (
      <Uu5Elements.Text category="story" segment="heading" type="h4">
        {({ style: h3Style }) => {
          const attrs = Utils.VisualComponent.getAttrs(
            props,
            Config.Css.join(
              Config.Css.css({
                "& p": { marginBlock: "0 1em", lineHeight: 1.6 },
                "& h3": { ...h3Style, ...theme.typography.display, marginBlock: "1.5em 0.5em" },
                "& ul, & ol": { paddingInlineStart: "1.25em", lineHeight: 1.7 },
                "& li": { marginBlockEnd: "0.25em" },
                "& a": { color: theme.color.redText },
                "& code": { backgroundColor: theme.color.muted, padding: "0.1em 0.35em", borderRadius: 4 },
                "& img": { maxInlineSize: "100%", blockSize: "auto", borderRadius: theme.radius },
              }),
              props.className,
            ),
          );
          return <div {...attrs}>{props.children}</div>;
        }}
      </Uu5Elements.Text>
    );
  },
});

export default Prose;
