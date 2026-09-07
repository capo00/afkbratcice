import Uu5ImagingTools from "uu5imagingg01-tools";

// Zmenšení obrázku PŘED uploadem.
//
// Google Cloud Storage náhledy negeneruje (design/README.md, 3.1), takže velikost, kterou
// se soubor nahraje, je velikost, kterou pak stahuje každý návštěvník. Fotka z telefonu má
// běžně 4 MB a 4000 px; jako logo v tabulce se z ní zobrazí 24 px.
//
// WebP proto, že je řádově menší než JPEG při stejné kvalitě a rozumí mu všechny dnešní
// prohlížeče. Kvalita 0.75 je hranice, pod kterou začínají být vidět artefakty na hranách
// erbu.
const WEBP_QUALITY = 0.75;

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
async function prepareImage(file, role = "photo") {
  if (!file || typeof file === "string" || !file.type?.startsWith("image/")) return file;

  const maxWidth = MAX_WIDTH[role] ?? MAX_WIDTH.photo;
  const { imageFile } = await Uu5ImagingTools.Adjustment.resizeMax(file, maxWidth);
  const { imageFile: webp } = await Uu5ImagingTools.Adjustment.changeType(imageFile, "webp", WEBP_QUALITY);

  // `Adjustment` vrací Blob s dopsaným `name`, ne File -- a navíc s vlastností `imageFile`,
  // která ukazuje sama na sebe. `Call.post()` se rozhoduje podle `instanceof File`, takže by
  // takový Blob poslal jako JSON a spadl na "Converting circular structure to JSON"
  // (stejně to obchází caio-ui's BinaryCrud#onPreSubmit).
  return new File([webp], webp.name, { type: webp.type, lastModified: file.lastModified });
}

export { prepareImage, MAX_WIDTH };
