import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

const { theme } = Config;

// Kostra datové tabulky. Sdílí ji tabulka soutěže, statistiky hráče a statistiky mužstva —
// všechny tři měly do 8. 9. 2026 stejný obal, stejné `<table>` a **stejný `cell` styl**
// zkopírovaný třikrát; když se v jedné opravila mezera, ve zbylých dvou zůstala.
//
// Je to schválně **kostra, ne generátor tabulek**: řádky si každá obrazovka píše sama.
// Tabulka soutěže zvýrazňuje vlastní tým, statistiky hráče mají součtový řádek, statistiky
// mužstva barví góly — to jsou tři různá pravidla a společný `columnList` by je jen zabalil
// do konfigurace, která by stejně musela umět všechno. `Uu5Tiles.Table` se z týchž důvodů
// nepoužívá (design/component-tree.md, D.2): tyhle tabulky nic neřadí ani nefiltrují, zato
// musí zůstat sémantickým `<table>` kvůli čtečkám a SEO.
//
// Vodorovné scrollování řeší `Uu5Elements.ScrollableBox`, ne `overflowX: auto` — kromě
// scrollu **naznačí gradientem, že tabulka pokračuje**. Na mobilu, kde se do šířky nevejde
// ani po skrytí sloupců, to je rozdíl mezi „chybí sloupce" a „ujeď doprava".

const Css = {
  table: Config.Css.css({
    inlineSize: "100%",
    borderCollapse: "collapse",
    fontVariantNumeric: "tabular-nums",
  }),
  headerRow: Config.Css.css({ ...theme.typography.eyebrow, fontSize: 11, textAlign: "start" }),
  cell: Config.Css.css({
    paddingBlock: 10,
    paddingInline: 8,
    borderBlockEnd: `1px solid ${theme.color.border}`,
    whiteSpace: "nowrap",
  }),
};

/** `cell` + zarovnání + co si buňka přidá sama. */
function cellClassName(align, className) {
  return [Css.cell, Config.Css.css({ textAlign: align }), className].filter(Boolean).join(" ");
}

const DataTable = createVisualComponent({
  uu5Tag: Config.TAG + "DataTable",

  render({ children }) {
    return (
      <Uu5Elements.ScrollableBox horizontal scrollIndicator="gradient">
        <table className={Css.table}>{children}</table>
      </Uu5Elements.ScrollableBox>
    );
  },
});

/** Řádek hlavičky — eyebrow sazba, kterou má předloha nad každou tabulkou. */
DataTable.HeaderRow = function DataTableHeaderRow({ children }) {
  return <tr className={Css.headerRow}>{children}</tr>;
};

/**
 * `scope="col"` v hlavičce, `scope="row"` v prvním sloupci řádku. Není to formalita —
 * bez toho čtečka u čísla neřekne, ke kterému týmu a sloupci patří.
 */
DataTable.Th = function DataTableTh({ scope = "col", align = "start", className, children }) {
  return (
    <th scope={scope} className={cellClassName(align, className)}>
      {children}
    </th>
  );
};

DataTable.Td = function DataTableTd({ align = "center", className, children }) {
  return <td className={cellClassName(align, className)}>{children}</td>;
};

export default DataTable;
