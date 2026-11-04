# Release candidate

## Přidáno
- Modal „Zapsat výsledek“ má pro toho, kdo smí zápas upravit, odkaz **Další úpravy zápasu**: termín, sezóna, kolo, hřiště, odjezd, stav a poznámka (týmy jen správce zápasů). Uloží se jedním tlačítkem, u zápasu bez výsledku i bez skóre -- třeba přesunutý termín z dlaždice na hlavní stránce.
- Ve všech modalech s formulářem je kurzor v prvním poli, na mobilu ne (klávesnice by zakryla modal). Vyžaduje caio-ui 0.4.10.
- Administrace *Trenéři a výbor* má záložku za každý náš tým a záložku Výbor. Na každé je tabulka funkcí -- osoba, funkce, období -- s aktuálními nahoře a filtry podle funkce, osoby a období; u výboru navíc sloupec a filtr *Kontakt na webu*. Modal upravuje jednu funkci: osoba a funkce vedle sebe, pod nimi od–do (na mobilu pod sebou).
- Táž osoba nemůže mít stejnou funkci ve stejném týmu nebo ve výboru ve dvou překrývajících se obdobích -- uložení to odmítne s vysvětlením.
- Administrace *Hráči* má záložku se soupiskou každého našeho týmu (hráč, post, období; aktuální nahoře; filtry hráč, post, období) a záložku *Karty hráčů* (osoba, post, poznámka, v jakých týmech je dnes). Modal soupisky: hráč, pod ním od–do. Týž hráč nemůže být v témž týmu ve dvou překrývajících se obdobích.

## Opraveno
-

## Breaking
- Vedení klubu (`afk_management`, `management/*`) má záznam na funkci (osoba, tým / výbor, funkce, od, do) místo záznamu na osobu se seznamy `teamList` / `boardList`. Před nasazením `npm run migrate:management-flat` (README, *Vydání s vedením po funkcích a soupiskou*).
- Členství hráčů v týmech je soupiska (`afk_roster`, `roster/*`); `player/addTeam` a `player/endTeam` jsou pryč a hráč nemá `teamList` (API ho vrací odvozený) ani číslo dresu. Před nasazením `npm run migrate:player-roster`.
- Číslo dresu se neeviduje: na webu u dětí se skrytými jmény je místo „#7“ jen „Hráč“ a post, v kruhu bez fotky iniciály nebo „?“.
