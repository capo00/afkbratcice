import { createVisualComponent, useLsi } from "uu5g05";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";

const { theme } = Config;

// Posledních pár výsledků jako kolečka V-R-P. Standard na moderních fotbalových webech
// a na serveru to nic nestojí — `computeTable` pole `form` naplní ze stejného průchodu
// daty, ze kterého počítá body (nejnovější první).
//
// Barvy: výhra klubovou červenou, remíza tlumeně, prohra jen obrys. Písmeno uvnitř je tam
// schválně — samotná barva by pro barvoslepé nesla nulovou informaci a tabulka je hustá,
// takže tooltip nikdo neotevře.

const SIZE = 18;

const STYLE = {
  W: { backgroundColor: theme.color.clubRed, color: theme.color.onRed, borderColor: theme.color.clubRed },
  D: { backgroundColor: theme.color.muted, color: theme.color.fg, borderColor: theme.color.border },
  L: { backgroundColor: "transparent", color: theme.color.mutedFg, borderColor: theme.color.border },
};

const FormDots = createVisualComponent({
  uu5Tag: Config.TAG + "FormDots",

  render({ form }) {
    const label = useLsi(importLsi, ["table", "form"]);
    if (!form?.length) return null;

    return (
      <span
        aria-label={label}
        className={Config.Css.css({ display: "inline-flex", gap: 4, verticalAlign: "middle" })}
      >
        {form.map((result, index) => (
          <span
            key={index}
            className={Config.Css.css({
              inlineSize: SIZE,
              blockSize: SIZE,
              borderRadius: "50%",
              border: "1px solid",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              ...(STYLE[result] ?? STYLE.L),
            })}
          >
            {/* V / R / P místo W / D / L — web je český. */}
            {{ W: "V", D: "R", L: "P" }[result] ?? "?"}
          </span>
        ))}
      </span>
    );
  },
});

export default FormDots;
