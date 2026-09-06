// Every text in the app belongs in cs.json and is read through this function --
// the same lazy-LSI shape uu5g05 and caio-ui use, so there is one way to do it across the stack.
//
//   import importLsi from "../lsi/import-lsi";
//   <Lsi import={importLsi} path={["home", "header"]} />
//   const header = useLsi(importLsi, ["home", "header"]);
//
// `path` is the key path into the JSON, so group keys by screen or component and the files stay
// navigable as the app grows. Only the language actually in use is downloaded; adding a language
// means adding <lang>.json next to these and one line to IMPORT_BY_LANGUAGE below.
import { Utils } from "uu5g05";
import cs from "./cs.json";

// caio-devkit's vite config defines process.env.NAME from package.json, so this stays in step
// with the app name on its own. It only has to be unique among the libraries loaded at runtime.
const libraryCode = process.env.NAME;

// Jazyky jsou vyjmenované, ne globované: uu5g05 si píše `import(`./${lang}.json`)`, protože
// ho staví webpack, ale Vite to odmítne s "variable imports cannot import their own
// directory". Tohle je cena za to, že jazykové JSONy leží vedle tohohle souboru --
// přidání jazyka je pak i jeden řádek sem, ne jen nový soubor.
//
// Zatím jen čeština (design/README.md, sekce 2): prázdný en.json by jen předstíral, že
// druhý jazyk umíme.
const IMPORT_BY_LANGUAGE = {
  cs: () => import("./cs.json"),
};

const importLsi = (lang) =>
  IMPORT_BY_LANGUAGE[lang]?.() ?? Promise.reject(new Error(`No LSI for language "${lang}".`));
importLsi.libraryCode = libraryCode;

// Seeds the store synchronously so the first paint already has text. Point it at the language
// the app is primarily written in -- seeding the other one would flash the wrong language while
// the real file is still loading.
Utils.Lsi.setDefaultLsi(libraryCode, { cs });

export default importLsi;
