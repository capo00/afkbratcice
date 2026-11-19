import { createVisualComponent, useRoute, Content } from "uu5g05";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Prose from "../components/layout/prose.jsx";
import EmptyState from "../components/empty-state.jsx";
import PAGES from "../content/pages.js";
import Board from "../components/board.jsx";
import History from "../components/history/history.jsx";
// Text stránek se veze až s touhle obrazovkou (lazy chunk), ne v hlavním bundlu --
// důvod je v komentáři nahoře v `content/pages.js`.
import PAGE_CONTENT from "../content/page-content.js";

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
//
// Výjimky:
// - stránky, jejichž obsah už v databázi **je** (`DATA_PAGES`): `/vybor` kreslí členy výboru
//   ze záznamů vedení, ve stejné sazbě jako text (uvnitř `Prose`);
// - stránky s vlastním tělem (`OWN_PAGES`): `/historie` má časovou osu s rozklikávacími detaily,
//   kterou uu5String neumí a která nesmí být v `Prose` (jeho `& p`/`& h3` by přebily její sazbu).

const DATA_PAGES = { vybor: Board };
const OWN_PAGES = { historie: History };

const Page = createVisualComponent({
  uu5Tag: Config.TAG + "Page",

  render() {
    const [route] = useRoute();
    const page = PAGES[route?.uu5Route];
    const DataPage = DATA_PAGES[route?.uu5Route];
    const OwnPage = OWN_PAGES[route?.uu5Route];

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

        {OwnPage ? (
          <OwnPage />
        ) : (
          <Prose className={Config.Css.css({ marginBlockStart: 24, maxWidth: 720 })}>
            {DataPage ? <DataPage /> : <Content>{PAGE_CONTENT[route.uu5Route]}</Content>}
          </Prose>
        )}
      </Section>
    );
  },
});

export default Page;
