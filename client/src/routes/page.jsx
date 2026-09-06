import { createVisualComponent, useRoute, Content } from "uu5g05";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import EmptyState from "../components/empty-state.jsx";
import PAGES from "../content/pages.js";

const { theme } = Config;

// Jedna obrazovka pro všechny obsahové stránky. Kterou vykreslí, říká **routa** —
// `/historie`, `/hymna`, `/vybor`, … —, ne parametr: adresy jsou převzaté z v0, takže
// staré odkazy sedí bez přesměrování.
//
// Obsah je `uu5String` z `content/pages.js` a vykresluje ho **`Uu5.Content`**: na rozdíl
// od `Utils.Uu5String.toChildren()` řeší nesting level a `fallback`, takže nezmapovaná
// značka v textu zobrazí chybu v místě, kde je, místo aby shodila celou stránku.
//
// Až vznikne ECC, obsah se přesune do databáze beze změny tvaru a tahle komponenta si
// jen vymění zdroj.

const Page = createVisualComponent({
  uu5Tag: Config.TAG + "Page",

  render() {
    const [route] = useRoute();
    const page = PAGES[route?.uu5Route];

    if (!page) {
      return (
        <Section>
          <EmptyState lsi={lsi("page", "missing")} icon="uugds-file" />
        </Section>
      );
    }

    return (
      <Section>
        <Heading lsi={undefined}>{page.name}</Heading>

        <div
          className={Config.Css.css({
            marginBlockStart: 24,
            maxWidth: 720,
            // Rytmus dlouhého textu: odstavce a nadpisy si nesou vlastní mezery, aby
            // stránka nebyla slepený blok. Cílí se na potomky, protože značky vyrábí
            // uu5String, ne my.
            "& p": { marginBlock: "0 1em", lineHeight: 1.6 },
            "& h3": { ...theme.typography.display, fontSize: 22, marginBlock: "1.5em 0.5em" },
            "& ul, & ol": { paddingInlineStart: "1.25em", lineHeight: 1.7 },
            "& li": { marginBlockEnd: "0.25em" },
            "& a": { color: theme.color.clubRed },
            "& code": { backgroundColor: theme.color.muted, padding: "0.1em 0.35em", borderRadius: 4 },
            "& img": { maxInlineSize: "100%", blockSize: "auto", borderRadius: theme.radius },
          })}
        >
          <Content>{page.content}</Content>
        </div>
      </Section>
    );
  },
});

export default Page;
