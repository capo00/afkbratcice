# Release candidate

## Přidáno
- Detail sezóny (`/sezona?id=…`): tabulka a všechna kola se zápasy, i ta, která náš tým nehrál. Na sezónu vede název soutěže u týmu, v tabulce na úvodu, ve statistikách hráče a kolo v detailu zápasu.
- Prokliky: název týmu v tabulce a v hlavičce detailu zápasu vede na detail týmu, jméno hráče ve statistikách na detail hráče.
- Detail soupeře: zápasy a tabulka jeho sezóny.
- Soupiska a realizační tým podle vybrané sezóny (dřív vždy dnešní stav).
- Stránka Výbor AFK se kreslí z dat. Telefon a e-mail jen u členů, kterým je administrace zaškrtne.
- Administrace, Trenéři a výbor: jedna osoba = jeden záznam s působením v týmech (funkce, od–do) i ve výboru (funkce, od–do, kontakt na webu). Osoba se vybírá hledáním.
- Administrace: filtry Ročník (sezóny), Termín, Domácí, Hosté, Sezóna, Kolo a Stav (zápasy), Kategorie, Naše a Klub (týmy), Post (hráči).

## Opraveno
- Odznak výhra/remíza/prohra na dlaždici zápasu jen u zápasů našeho týmu.
- Rozstřely z v0 (96 zápasů, muži IV. třída 2014/15–2020/21) měly ve skóre i gól z penalt, takže se v tabulce počítaly jako výhry 3/0. Teď jsou to remízy s vítězem rozstřelu (2/1). Sezóny bez rozstřelu mají vypnuté `hasPenalties`. Před nasazením `npm run migrate:penalties -- --env .env --commit`.
- Telefony osob z importu v0 měly zdvojenou předvolbu (`+420420…`).
- Detail zápasu z archivu má vzájemné zápasy (vlastní tým podle `team.own`, ne podle letošních mužstev).
- Ve statistikách týmu jsou góly jen tučně, ne červeně.
- Administrace: obrazovky bez filtrů nemají tlačítko filtru (caio-ui).
- Ikona odkazu do administrace je `uugds-apps-edit` (caio-ui).

## Breaking
- `coach/*` -> `management/*`, kolekce `afk_coach` -> `afk_management`. Funkce v týmu `headCoach` -> `coach`, výbor je `boardList`. Před nasazením `npm run migrate:management -- --env .env --commit` (README, Vydání s vedením klubu a opravou penalt).
- Stránka `kolo` je zrušená, nahrazuje ji `sezona`.
- `match/list` odmítne `round` bez `seasonId`.
