// Paměťová cache Zajímavostí po kategoriích (Caio 2026-11-18). Výpočet bere všechny zápasy
// týmu za celou historii a mění se jen zápisem zápasu, takže ho nemá smysl dělat při každém
// zobrazení stránky.
//
// Zneplatňuje ji **každý zápis zápasu** (`match/dao.js`: založení, import, úprava, výsledek,
// sestava, smazání) -- a zneplatní všechny kategorie, protože zápas může přejít z týmu na tým.
//
// Proč i časový limit: App Engine pouští až dvě instance (`app.yaml` `max_instances`) a každá
// má vlastní paměť. Zápis výsledku zneplatní cache jen na té instanci, která ho přijala; druhá
// by jinak ukazovala starý stav, dokud ji App Engine neuspí. Limit drží zastarání nejvýš na
// pár minut. Stejně tak přejmenování osoby nebo změna soupisky cache neruší a projeví se
// nejpozději po limitu.
//
// Bez importů schválně: importuje ji `match/dao.js` a `stats/highlights.js` importuje dao,
// takže by se jinak zacyklily.

const TTL_MS = 10 * 60 * 1000;

const cache = new Map();
// Zvyšuje se každým zneplatněním. Výpočet, který začal před zápisem a doběhl po něm, by jinak
// do cache vrátil stav bez toho zápisu.
let generation = 0;

/** Číslo generace -- vzít si ho **před** načtením dat a předat do `setHighlights`. */
function highlightsGeneration() {
  return generation;
}

function getHighlights(category, now = Date.now()) {
  const entry = cache.get(category);
  if (!entry || entry.expiresAt <= now) return undefined;
  return entry.value;
}

/** Uloží výsledek, jen když mezitím nebyl zapsaný žádný zápas. */
function setHighlights(category, value, fromGeneration, now = Date.now()) {
  if (fromGeneration !== generation) return;
  cache.set(category, { value, expiresAt: now + TTL_MS });
}

function invalidateHighlights() {
  generation++;
  cache.clear();
}

export { getHighlights, setHighlights, invalidateHighlights, highlightsGeneration, TTL_MS };
