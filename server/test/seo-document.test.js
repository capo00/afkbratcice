import { test } from "node:test";
import assert from "node:assert/strict";
import { createDocumentHook, DEFAULT_IMAGE, DEFAULT_IMAGE_SIZE } from "../seo/document.js";

// Hlavička dokumentu podle stránky (seo/document.js): co dostane náhled sdíleného odkazu
// a kdy je stránka 404. Data se podstrkují, jinak by to byl test databáze.

const ID = (n) => String(n).padStart(24, "0");
const notFound = () => {
  const error = new Error("not found");
  error.status = 404;
  throw error;
};

const DATA = {
  match: {
    [ID(1)]: {
      id: ID(1),
      homeTeam: { name: "AFK Bratčice" },
      guestTeam: { name: "Chotusice" },
      homeGoals: 3,
      guestGoals: 4,
      round: "5",
      seasonId: ID(9),
      // 23:30 v Praze je v UTC ještě týž den, 00:30 v Praze už další -- datum musí být české.
      time: "2026-10-11T22:30:00.000Z",
    },
    [ID(2)]: { id: ID(2), homeTeam: { name: "AFK Bratčice" }, guestTeam: null },
  },
  season: { [ID(9)]: { id: ID(9), competition: "III. třída", yearFrom: "2026" } },
  player: {
    [ID(3)]: { id: ID(3), person: { name: "Jan", surname: "Novák", photoUri: "/binary/jan.webp" } },
    // Dítě se skrytým jménem: crud vrátí osobu bez jména a fotky.
    [ID(4)]: { id: ID(4), person: { id: "p4" } },
  },
  team: { [ID(5)]: { id: ID(5), name: "AFK Bratčice", photoUri: "/binary/team.webp" }, [ID(6)]: { id: ID(6), name: "Chotusice" } },
  article: { [ID(7)]: { id: ID(7), name: 'Výhra <3:1> & "derby"', desc: "Perex.", photographUri: "/binary/a.jpg" } },
  gallery: { [ID(8)]: { id: ID(8), name: "Hody 2026", desc: "", coverThumbUri: "/binary/cover.webp" } },
};

const loaders = {
  ...Object.fromEntries(
    Object.keys(DATA).map((kind) => [kind, async (id) => DATA[kind][id] ?? notFound()]),
  ),
  currentCategoryList: async () => [{ teamId: ID(5), categoryName: "A (Muži)", competition: "III. třída" }],
};

const hook = createDocumentHook(loaders);
const at = (path, query = {}) => hook({ req: { query }, path });

test("zápas: dvojice, skóre, kolo, soutěž a české datum", async () => {
  assert.deepEqual(await at("/zapas", { id: ID(1) }), {
    title: "AFK Bratčice – Chotusice 3:4 · AFK Bratčice",
    description: "5. kolo, III. třída 2026/27, 12. 10. 2026. Sestava a střelci.",
    image: DEFAULT_IMAGE,
    ...DEFAULT_IMAGE_SIZE,
  });
  const bare = await at("/zapas", { id: ID(2) });
  assert.equal(bare.title, "AFK Bratčice – ? · AFK Bratčice");
  assert.equal(bare.description, "Sestava a střelci.");
});

test("neexistující, neplatné nebo chybějící id a neznámá cesta jsou 404 s noindex", async () => {
  for (const [path, query] of [
    ["/zapas", { id: ID(99) }],
    ["/zapas", { id: "nesmysl" }],
    ["/zapas", {}],
    ["/hrac", { id: ID(99) }],
    ["/muzstvo/tabulka", { id: ID(99) }],
    ["/novinka", { id: ID(99) }],
    ["/fotogalerie/album", { id: ID(99) }],
    ["/sezona", { id: ID(99) }],
    ["/neexistuje", {}],
    ["/muzstvo/neexistuje", { id: ID(5) }],
  ]) {
    const meta = await at(path, query);
    assert.equal(meta.status, 404, `${path} ${JSON.stringify(query)}`);
    assert.equal(meta.noindex, true);
    assert.equal(meta.title, "Stránka nenalezena · AFK Bratčice");
    assert.equal(meta.image, DEFAULT_IMAGE);
  }
});

test("výpadek databáze není 404 -- chyba letí dál a caio-server pošle dokument beze změny", async () => {
  const down = createDocumentHook({ ...loaders, match: async () => { throw new Error("db down"); } });
  await assert.rejects(down({ req: { query: { id: ID(1) } }, path: "/zapas" }), /db down/);
});

test("hráč: jméno a fotka; dítě se skrytým jménem bez jména, bez fotky a noindex", async () => {
  assert.deepEqual(await at("/hrac", { id: ID(3) }), {
    title: "Jan Novák · AFK Bratčice",
    description: "Jan Novák – profil a statistiky hráče AFK Bratčice.",
    image: "/binary/jan.webp",
  });
  const child = await at("/hrac", { id: ID(4) });
  assert.equal(child.title, "Hráč · AFK Bratčice");
  assert.equal(child.image, DEFAULT_IMAGE);
  assert.equal(child.noindex, true);
  assert.equal(child.status, undefined);
});

test("mužstvo: kategorie a záložka, soutěž v popisu; soupeř podle názvu", async () => {
  assert.deepEqual(await at("/muzstvo/zapasy", { id: ID(5) }), {
    title: "A (Muži) – Zápasy · AFK Bratčice",
    description: "A (Muži) AFK Bratčice – III. třída.",
    image: "/binary/team.webp",
  });
  const rival = await at("/muzstvo/tabulka", { id: ID(6) });
  assert.equal(rival.title, "Chotusice – Tabulka · AFK Bratčice");
  assert.equal(rival.description, "Tabulka soutěže, ve které hraje mužstvo AFK Bratčice.");
});

test("sezóna, novinka a album", async () => {
  assert.equal((await at("/sezona", { id: ID(9) })).title, "III. třída 2026/27 · AFK Bratčice");
  // Escapování dělá caio-server (applyPageMeta); tady jde text tak, jak je.
  assert.deepEqual(await at("/novinka", { id: ID(7) }), {
    title: 'Výhra <3:1> & "derby" · AFK Bratčice',
    description: "Perex.",
    image: "/binary/a.jpg",
  });
  const album = await at("/fotogalerie/album", { id: ID(8) });
  assert.equal(album.description, "Fotografie ze zápasů a života klubu AFK Bratčice.");
  assert.equal(album.image, "/binary/cover.webp");
});

test("stránky bez dat: titulek routy, úvod jen název klubu, výchozí obrázek", async () => {
  assert.deepEqual(await at("/"), {
    title: "AFK Bratčice",
    description: "Fotbalový klub AFK Bratčice od roku 1932 – program zápasů, výsledky, tabulky a soupisky mužů, mládeže i staré gardy.",
    image: DEFAULT_IMAGE,
    ...DEFAULT_IMAGE_SIZE,
  });
  assert.equal((await at("/kontakt")).title, "Kontakt · AFK Bratčice");
  assert.equal((await at("/vybor")).title, "Výbor AFK · AFK Bratčice");
});
