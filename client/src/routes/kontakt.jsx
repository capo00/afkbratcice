import { createVisualComponent, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import Button from "../components/layout/button.jsx";
import EmptyState from "../components/empty-state.jsx";
import SocialLinks from "../components/social-links.jsx";
import { useApp } from "../core/app-context.jsx";
import { CONTACT_FIELD_LIST, mapsUrl } from "../core/contact-links.js";

const { theme } = Config;

// Kontakt je **jediná obsahová stránka, která není text v kódu** — jsou to údaje, které
// správce mění v Nastavení (`appSettings.contact`), takže je nemá smysl mít natvrdo
// a zároveň v administraci. Ostatní stránky jsou v `content/pages.js`.
//
// Mapa je `<iframe>` OpenStreetMap: uu5 mapovou komponentu nemá a Google Maps Embed by
// znamenalo klíč v URL a další službu k hlídání. OSM embed nechce klíč ani cookie.
//
// **Embed umí jen souřadnice, ne adresu** — nemá geokodér, takže bez `gps` by z něj byl
// prázdný šedý obdélník. Když souřadnice nejsou, ukáže se místo mapy odkaz do Google Map
// s vyhledanou adresou; prázdná mapa je horší než žádná.

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

const Kontakt = createVisualComponent({
  uu5Tag: Config.TAG + "Kontakt",

  render() {
    const { appSettings } = useApp();
    const contact = appSettings?.contact ?? {};
    const rows = CONTACT_FIELD_LIST.filter((row) => contact[row.code]);
    const embed = mapEmbedUrl(contact);
    // Bez souřadnic místo mapy odkaz s vyhledanou adresou, do Google Map jako všude (contact-links.js).
    const search = embed ? null : mapsUrl(contact.address);

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
              // Popisek nad hodnotou (výchozí `itemDirection="vertical-reverse"`), celý řádek je
              // odkaz: adresa do Google Map, e-mail a telefon na mailto/tel (core/contact-links.js).
              <Uu5Elements.InfoGroup
                direction="vertical"
                itemList={rows.map((row) => ({
                  icon: row.icon,
                  colorScheme: "primary",
                  subtitle: <Lsi import={importLsi} path={["contact", row.code]} />,
                  title: contact[row.code],
                  href: row.href(contact[row.code]),
                  target: row.target,
                }))}
              />
            )}
            <SocialLinks socialList={appSettings?.socialList} className={Config.Css.css({ marginBlockStart: 16 })} />
          </Card>

          {embed ? (
            // Rám kolem mapy je `Box`, ne `border` na iframu: linka i rádius jsou tytéž
            // hodnoty, které GDS dává kartě vedle, a `overflow: hidden` zaoblí i mapu uvnitř.
            <Uu5Elements.Box
              significance="subdued"
              borderRadius="moderate"
              className={Config.Css.css({ overflow: "hidden", display: "flex" })}
            >
              {/* uu5g05 obaluje `<iframe>` sanitizací a mimo `createUnsafe` ho nevykreslí.
                  `src` je náš OSM embed nebo `mapUrl` od správce, ne obsah od návštěvníka. */}
              {Utils.Element.createUnsafe(() => (
                <iframe
                  title="Mapa"
                  src={embed}
                  loading="lazy"
                  className={Config.Css.css({ inlineSize: "100%", minBlockSize: 320, border: "none" })}
                />
              ))}
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
