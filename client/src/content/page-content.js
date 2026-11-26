// Text obsahových stránek.
//
// **Zatím se needituje přes API** (rozhodnuto 2026-09-06): entita `page` počká na ECC,
// protože obsahová stránka je přesně to, co ECC řeší, a stavět kvůli mezidobí druhou
// polovinu téhož by znamenalo napsat editaci dvakrát. Do té doby se text mění tady
// v kódu a nasazuje s buildem — což u stránek, které se přepisují jednou za rok, není
// horší než administrace, kterou nikdo neotevře.
//
// Obsah je **`uu5String`**, ne JSX: až ECC vznikne, přesune se odsud do databáze beze
// změny tvaru. Renderuje ho `Uu5.Content` (`routes/page.jsx`), který na rozdíl od
// `toChildren()` zvládne i nezmapovanou značku bez pádu celé stránky.
//
// **Texty jsou přepsané z běžícího `afkbratcice.cz` (2026-09-07), ne vymyšlené.** Kde v0
// něco nemá, není to tu taky — radši prázdno než smyšlená historie klubu.
//
// Historie tu od 2026-11-19 není: časová osa má rozklikávací detaily, a ty uu5String v `itemList`
// neumí. Je v `content/history.js` a kreslí ji `components/history/history-timeline.jsx`.
//
// Seznam stránek a jejich názvy jsou vedle v `pages.js` — proč, je napsané tam.

import TEAM_PHOTOS from "./team-photos.js";

/** Jedna týmová fotka → uu5String. Sestavy drží `content/team-photos.js`. */
function teamPhotoBlock({ season, team, file, height, note, rowList }, index) {
  return [
    // `loading="lazy"` schválně: fotek je 53, takže bez odloženého načítání by stránka
    // stahovala celou historii klubu najednou. `width`/`height` drží místo do stažení (poměr
    // stran; skutečnou šířku dá `Prose`: `max-inline-size: 100%`, `block-size: auto`).
    `<img src="/assets/teams/${file}" width="600" height="${height}" alt="${team} ${season}${index ? `, fotka ${index + 1}` : ""}" loading="lazy"/>`,
    ...(note ? [`<p><i>${note}</i></p>`] : []),
    ...rowList.map(({ label, names }) => `<p><b>${label}:</b> ${names}</p>`),
  ].join("\n");
}

/**
 * Týmové fotky od nejnovější (Caio 2026-11-10). Řazení je stabilní, takže uvnitř sezóny
 * zůstane pořadí z v0 (muži 1, 2, 3, pak žáci). Sousední fotky téže sezóny a mužstva mají
 * jeden společný nadpis, ne tři stejné pod sebou.
 */
function teamPhotosContent(photoList) {
  const groupList = [];
  for (const photo of [...photoList].sort((a, b) => b.season.localeCompare(a.season))) {
    const last = groupList.at(-1);
    if (last && last.season === photo.season && last.team === photo.team) last.photoList.push(photo);
    else groupList.push({ season: photo.season, team: photo.team, photoList: [photo] });
  }
  return groupList
    .map(({ season, team, photoList: list }) => [`<h3>${season} · ${team}</h3>`, ...list.map(teamPhotoBlock)].join("\n"))
    .join("\n\n");
}

const PAGE_CONTENT = {
  hymna: `<uu5string/>
<h3>Traverza</h3>
<p><i>Autor: Josef Ságl</i></p>

<p>Traverza to vyhrává, dává góly na počkání,<br/>
Soupeře si vychutná a už ho nikdo nezachrání.</p>

<p><b>Traverza je nejlepší, soupeře to děsí,<br/>
Vzhůru, vzhůru, vzhůru do Zálesí.</b></p>

<p>Útok branky rozdává, záloha ho podporuje,<br/>
Obránci to odpálí, brankář góly zachraňuje.</p>

<p><b>Traverza je nejlepší, soupeře to děsí,<br/>
Vzhůru, vzhůru, vzhůru do Zálesí.</b></p>`,


  "tymove-fotky": `<uu5string/>
<p>Chronologie mužstev od sezóny 1943/1944, nejnovější nahoře. U starších fotek se dochovala
jen jména, u některých i to, co se ten rok povedlo.</p>

${teamPhotosContent(TEAM_PHOTOS)}`,
};

export { PAGE_CONTENT };
export default PAGE_CONTENT;
