import { UiElements } from "caio-ui";

// Zmenšení obrázku PŘED uploadem (caio-ui `UiElements.prepareImage`: WebP, kvalita 0.75,
// výsledek je skutečný `File` pro `Call.post`). Google Cloud Storage náhledy negeneruje
// (design/README.md, 3.1), takže velikost uploadu je velikost, kterou pak stahuje každý
// návštěvník. Tady zůstávají jen šířky podle role obrázku.

/** Doporučené šířky podle role obrázku (design/frontend.md, 6.2). */
const MAX_WIDTH = {
  logo: 400,
  portrait: 600,
  teamPhoto: 1200,
  article: 1200,
  photo: 1600,
  thumb: 400,
};

/**
 * @param file soubor z formuláře (File)
 * @param role klíč z MAX_WIDTH
 * @returns File připravený k uploadu; když to není obrázek, vrací se beze změny
 */
function prepareImage(file, role = "photo") {
  return UiElements.prepareImage(file, { maxWidth: MAX_WIDTH[role] ?? MAX_WIDTH.photo });
}

export { prepareImage, MAX_WIDTH };
