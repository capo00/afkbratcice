import { useLanguage } from "uu5g05";

// Množná čísla. uu5g05 je neumí — `Lsi` bere jeden řetězec a dosadí do něj parametry —,
// takže „${count} fotek" vyjde česky špatně u jedničky i u dvojky až čtyřky:
// *1 fotek*, *2 fotek*. Čeština má tři tvary a na veřejném webu je to vidět.
//
// Klíč se proto v `cs.json` píše jako objekt kategorií a tenhle hook z něj vybere tu
// správnou podle `Intl.PluralRules`:
//
//   "photoCount": { "one": "${count} fotka", "few": "${count} fotky", "other": "${count} fotek" }
//   <Lsi import={importLsi} path={usePluralPath(["gallery", "photoCount"], count)} params={{ count }} />
//
// Kategorie určuje CLDR, ne my: pro češtinu `one` = 1, `few` = 2–4, `other` = 0 a 5+
// (včetně 21, 105 — čeština na rozdíl od ruštiny u desítek neresetuje). Jazyk se bere
// z kontextu, ne natvrdo, aby druhý jazyk dostal svoje kategorie sám: angličtina má jen
// `one`/`other`, takže jí v JSONu stačí ty dva klíče.

function usePluralPath(path, count) {
  const [language] = useLanguage();
  return [...path, new Intl.PluralRules(language || "cs").select(count ?? 0)];
}

export { usePluralPath };
