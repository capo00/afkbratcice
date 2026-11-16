import { createVisualComponent, useRoute, Content, Utils } from "uu5g05";
import Uu5Extras from "uu5extrasg01";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Prose from "../components/layout/prose.jsx";
import EmptyState from "../components/empty-state.jsx";
import PAGES from "../content/pages.js";
import Board from "../components/board.jsx";
// Text stránek se veze až s touhle obrazovkou (lazy chunk), ne v hlavním bundlu --
// důvod je v komentáři nahoře v `content/pages.js`.
import PAGE_CONTENT from "../content/page-content.js";

const { theme } = Config;

// Komponenty, které obsah stránek smí použít, se registrují do uu5String tady. Bez registrace
// si uu5g05 jmenný prostor (`Uu5Extras`) překládá dotazem do uuAppLibraryRegistry na
// `uuapp.plus4u.net` -- každý návštěvník historie by volal cizí server (review 2026-11-12, S5).
// Import je v téhle líné obrazovce, takže se knihovna stahuje jen s obsahovými stránkami.
Utils.LibraryRegistry.registerComponent(Uu5Extras.VerticalTimeline);

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
// Výjimka jsou stránky, jejichž obsah už v databázi **je** (`DATA_PAGES`): `/vybor`
// kreslí členy výboru ze záznamů vedení, ve stejné sazbě jako text.

const DATA_PAGES = { vybor: Board };

const Page = createVisualComponent({
  uu5Tag: Config.TAG + "Page",

  render() {
    const [route] = useRoute();
    const page = PAGES[route?.uu5Route];
    const DataPage = DATA_PAGES[route?.uu5Route];

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

        <Prose
          className={Config.Css.css({
            marginBlockStart: 24,
            maxWidth: 720,
            // `Uu5Extras.VerticalTimeline` (uu5extrasg01 1.9) dává kolečku ikony napevno inline
            // `background: white`. Na tmavém podkladu na něm průsvitná ikona položky zmizí, proto
            // `!important` a barva stránky (průhledné ne: kolečkem by prosvítala čára osy).
            "& .vertical-timeline-element-icon": { backgroundColor: `${theme.color.bg} !important` },
            // Popisek (rok) je pod textem jako `float: left` na celou šířku a poslední řádek
            // textu ho obtéká -- odsune se doprava. Jako blok pod textem obtékat nemá co.
            "& .vertical-timeline-element-date": { float: "none !important", display: "block !important" },
          })}
        >
          {DataPage ? <DataPage /> : <Content>{PAGE_CONTENT[route.uu5Route]}</Content>}
        </Prose>
      </Section>
    );
  },
});

export default Page;
