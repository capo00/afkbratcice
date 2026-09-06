import { createVisualComponent, Lsi, useLsi, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
import { useApp } from "../../core/app-context.jsx";

const { theme } = Config;

// Třísloupcová patička + spodní řádek.
//
// Sloupce: značka a popis · Navigace · Kontakt. Kontakt se bere z `appConfig.contact`, aby
// ho redakce mohla změnit bez nasazení — natvrdo je jen struktura, ne hodnoty. Chybějící
// položka se **vynechá**, nezobrazí se prázdný řádek s ikonou.
//
// Spodní řádek má vlevo copyright a vpravo červené „SRDCEM ZA BRATČICE" — v předloze je to
// jediné místo, kde se klubová červená používá jako text, ne jako plocha.

// Jen hotové obrazovky. Odkaz na routu, která ještě neexistuje, by skončil na 404 —
// to je horší než kratší patička. Ke stažení a Kontakt sem přibudou s nimi.
const NAV = [
  { code: "home", href: "" },
  { code: "teams", href: "teams" },
  { code: "gallery", href: "gallery" },
];

const CONTACT_ICON = {
  address: "uugds-mapmarker",
  email: "uugds-email",
  phone: "uugds-phone",
};

function ContactLine({ icon, children, href }) {
  return (
    <div className={Config.Css.css({ display: "flex", gap: 8, alignItems: "baseline" })}>
      <Uu5Elements.Icon icon={icon} className={Config.Css.css({ color: theme.color.clubRed, flexShrink: 0 })} />
      {href ? (
        <Uu5Elements.Link href={href} colorScheme="building" significance="subdued">
          {children}
        </Uu5Elements.Link>
      ) : (
        <span>{children}</span>
      )}
    </div>
  );
}

const Footer = createVisualComponent({
  uu5Tag: Config.TAG + "Footer",

  render() {
    const { appConfig } = useApp();
    const [, setRoute] = useRoute();
    const contact = appConfig?.contact ?? {};
    const clubName = useLsi(importLsi, ["club", "name"]);
    const founded = appConfig?.founded ?? 1932;

    return (
      <footer
        className={Config.Css.css({
          backgroundColor: theme.color.card,
          borderBlockStart: `1px solid ${theme.color.border}`,
          color: theme.color.fg,
        })}
      >
        <div
          className={Config.Css.css({
            maxWidth: theme.maxWidth,
            marginInline: "auto",
            paddingInline: theme.gutter.s,
            paddingBlock: 48,
            display: "grid",
            gap: 32,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          })}
        >
          <div>
            <div className={Config.Css.css({ ...theme.typography.display, fontSize: 24, marginBlockEnd: 8 })}>
              {clubName}
            </div>
            <Uu5Elements.Text
              category="interface"
              segment="content"
              type="medium"
              className={Config.Css.css({ color: theme.color.mutedFg })}
            >
              <Lsi import={importLsi} path={["footer", "about"]} params={{ founded }} />
            </Uu5Elements.Text>
          </div>

          <nav>
            <div className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 12, marginBlockEnd: 12 })}>
              <Lsi import={importLsi} path={["footer", "navigation"]} />
            </div>
            <ul className={Config.Css.css({ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 })}>
              {NAV.map((item) => (
                <li key={item.code}>
                  <Uu5Elements.Link
                    href={item.href}
                    colorScheme="building"
                    significance="subdued"
                    onClick={(e) => {
                      e.preventDefault();
                      setRoute(item.href);
                    }}
                  >
                    <Lsi import={importLsi} path={["header", "nav", item.code]} />
                  </Uu5Elements.Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <div className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 12, marginBlockEnd: 12 })}>
              <Lsi import={importLsi} path={["footer", "contact"]} />
            </div>
            <div className={Config.Css.css({ display: "grid", gap: 8, color: theme.color.mutedFg })}>
              {contact.address ? <ContactLine icon={CONTACT_ICON.address}>{contact.address}</ContactLine> : null}
              {contact.email ? (
                <ContactLine icon={CONTACT_ICON.email} href={`mailto:${contact.email}`}>
                  {contact.email}
                </ContactLine>
              ) : null}
              {contact.phone ? (
                <ContactLine icon={CONTACT_ICON.phone} href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                  {contact.phone}
                </ContactLine>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={Config.Css.css({
            borderBlockStart: `1px solid ${theme.color.border}`,
          })}
        >
          <div
            className={Config.Css.css({
              maxWidth: theme.maxWidth,
              marginInline: "auto",
              paddingInline: theme.gutter.s,
              paddingBlock: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "space-between",
              color: theme.color.mutedFg,
            })}
          >
            <Uu5Elements.Text category="interface" segment="content" type="medium">
              <Lsi import={importLsi} path={["footer", "copyright"]} params={{ year: new Date().getFullYear(), clubName }} />
            </Uu5Elements.Text>
            <span className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 12 })}>
              <Lsi import={importLsi} path={["footer", "motto"]} />
            </span>
          </div>
        </div>
      </footer>
    );
  },
});

export default Footer;
