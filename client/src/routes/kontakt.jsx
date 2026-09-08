import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import Button from "../components/layout/button.jsx";
import EmptyState from "../components/empty-state.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Kontakt je **jediná obsahová stránka, která není text v kódu** — jsou to údaje, které
// redakce mění v konfiguraci (`appConfig.contact`), takže je nemá smysl mít natvrdo
// a zároveň v administraci. Ostatní stránky jsou v `content/pages.js`.
//
// Mapa je `<iframe>` OpenStreetMap: uu5 mapovou komponentu nemá a Google Maps Embed by
// znamenalo klíč v URL a další službu k hlídání. OSM embed nechce klíč ani cookie.
//
// **Embed umí jen souřadnice, ne adresu** — nemá geokodér, takže bez `gps` by z něj byl
// prázdný šedý obdélník. Když souřadnice nejsou, ukáže se místo mapy odkaz do OSM
// s vyhledanou adresou; prázdná mapa je horší než žádná.

const ROW = [
  { code: "address", icon: "uugds-mapmarker" },
  { code: "email", icon: "uugds-email", href: (v) => `mailto:${v}` },
  { code: "phone", icon: "uugds-phone", href: (v) => `tel:${v.replace(/\s/g, "")}` },
];

// Výřez kolem bodu. ~0.01° je zhruba kilometr — dost na to, aby byla vidět obec i cesta
// k hřišti, a ne tak málo, aby z mapy zbyla jedna ulice.
const BBOX_DELTA = 0.01;

/** `gps` ve tvaru "49.0123, 16.5432" -> [lat, lon]; cokoli jiného -> null. */
function parseGps(gps) {
  const match = String(gps ?? "").match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function mapEmbedUrl(contact) {
  // `mapUrl` v konfiguraci má přednost — redakce může vložit vlastní výřez.
  if (contact.mapUrl) return contact.mapUrl;

  const point = parseGps(contact.gps);
  if (!point) return null;

  const [lat, lon] = point;
  const bbox = [lon - BBOX_DELTA, lat - BBOX_DELTA, lon + BBOX_DELTA, lat + BBOX_DELTA].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/** Náhrada za mapu, když nejsou souřadnice: odkaz do OSM s vyhledanou adresou. */
function mapSearchUrl(contact) {
  if (!contact.address) return null;
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(contact.address)}`;
}

const Kontakt = createVisualComponent({
  uu5Tag: Config.TAG + "Kontakt",

  render() {
    const { appConfig } = useApp();
    const contact = appConfig?.contact ?? {};
    const rows = ROW.filter((row) => contact[row.code]);
    const embed = mapEmbedUrl(contact);
    const search = embed ? null : mapSearchUrl(contact);

    return (
      <Section>
        <Heading eyebrow={lsi("contact", "eyebrow")} lsi={lsi("contact", "header")} />

        {/* Dva sloupce, které se na úzkém okně poskládají pod sebe. `auto-fit`, protože
            karta s kontaktem a mapa mají zabrat celou šířku, ne půlku a prázdno. */}
        <Uu5Elements.Grid
          templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
          className={Config.Css.css({ marginBlockStart: 24 })}
        >
          <Card>
            {rows.length === 0 ? (
              // Prázdná konfigurace je stav, ne chyba — web může jet dřív, než ji někdo vyplní.
              <EmptyState lsi={lsi("contact", "empty")} icon="uugds-mapmarker" />
            ) : (
              <Uu5Elements.Grid rowGap={16}>
                {rows.map((row) => {
                  const value = contact[row.code];
                  return (
                    <div key={row.code} className={Config.Css.css({ display: "flex", gap: 12 })}>
                      <Uu5Elements.Icon
                        icon={row.icon}
                        className={Config.Css.css({ color: theme.color.clubRed, flexShrink: 0, marginBlockStart: 2 })}
                      />
                      <div>
                        <div className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 11 })}>
                          <Lsi import={importLsi} path={["contact", row.code]} />
                        </div>
                        {row.href ? (
                          <Uu5Elements.Link href={row.href(value)} colorScheme="building">
                            {value}
                          </Uu5Elements.Link>
                        ) : (
                          <span>{value}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Uu5Elements.Grid>
            )}
          </Card>

          {embed ? (
            // Rám kolem mapy je `Box`, ne `border` na iframu: linka i rádius jsou tytéž
            // hodnoty, které GDS dává kartě vedle, a `overflow: hidden` zaoblí i mapu uvnitř.
            <Uu5Elements.Box
              significance="subdued"
              borderRadius="moderate"
              className={Config.Css.css({ overflow: "hidden", display: "flex" })}
            >
              <iframe
                title="Mapa"
                src={embed}
                loading="lazy"
                className={Config.Css.css({ inlineSize: "100%", minBlockSize: 320, border: "none" })}
              />
            </Uu5Elements.Box>
          ) : search ? (
            <Card>
              <Uu5Elements.Grid rowGap={12} justifyItems="start">
                <Uu5Elements.Text
                  category="interface"
                  segment="content"
                  type="medium"
                  className={Config.Css.css({ color: theme.color.mutedFg })}
                >
                  <Lsi import={importLsi} path={["contact", "noMap"]} />
                </Uu5Elements.Text>
                <Button
                  href={search}
                  target="_blank"
                  size="m"
                  significance="distinct"
                  icon="uugds-mapmarker"
                  lsi={lsi("contact", "showOnMap")}
                />
              </Uu5Elements.Grid>
            </Card>
          ) : null}
        </Uu5Elements.Grid>
      </Section>
    );
  },
});

export default Kontakt;
