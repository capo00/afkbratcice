// Historie klubu: úvod, milníky časové osy a zdroje.
//
// **Nic tu není vymyšlené.** Milníky do roku 2011 jsou text stránky historie z v0
// (`afkbratcice.cz`, přepsaný 2026-09-07) rozdělený podle let. Milníky od roku 2012 vycházejí
// z článků webu v0 (2012–2026; čísla článků jsou u položek) a z výsledků zápasů v databázi
// (pořadí, body, skóre). Shrnutí je zkrácení textu milníku, ne nová informace.
//
// Položka (zobrazuje ji `components/history/timeline-item.jsx`):
// - `id` -- kotva `#milnik-<id>`, odkazy mezi položkami;
// - `date` -- `{ year }`, `{ year, month }`, `{ year, month, day }`, rozsah `{ year, …, to: { year, … } }`,
//   desetiletí `{ decade: 1950 }` nebo volný text `{ text: "Dnes" }` (`components/history/history-date.js`);
// - `type` -- určuje ikonu (`TYPE_ICON` v `components/history/history-timeline.jsx`), jako štítek se
//   nezobrazuje: `club`, `competition`, `match`, `venue`, `youth`, `community`, `crisis`;
// - `title`, `summary` (vždy vidět), volitelně `detail` (odstavce), `facts` (skupiny krátkých údajů
//   `{ caption?, items: [{ label, value }] }`) a `links` (`{ label, anchor }` na jinou položku nebo
//   `{ label, route }` na stránku webu). Bez nich položka nemá „Podrobnosti“.
//
// Odkazy na sezónu (`/sezona?id=`) tu schválně nejsou: id sezóny je v každé databázi jiné.

const HISTORY_INTRO =
  "Fotbalový klub v Bratčicích byl založen v roce 1932 v rámci tělocvičné organizace Sokol Bratčice. Od té doby se v obci hraje — s jedinou dvanáctiletou přestávkou — dodnes.";

const HISTORY_SOURCES = [
  "Čerpáno ze záznamů a fotografií z pamětní knihy pana Václava Práška a z pamětí bývalých aktivních účastníků pana Josefa Ságla, Jaroslava Miláčka a Josefa Štěpánka. Autor první části: Josef Štěpánek. Zdroj druhé části: KOZOHORSKÁ M. & JELÍNKOVÁ E., Almanach Pernerovy Bratčice, obec Bratčice 2010, str. 23 — AFK Bratčice, autor Václav Ronovský.",
  "Události od roku 2012 podle článků na webu klubu a výsledků zápasů.",
];

const HISTORY_MILESTONE_LIST = [
  {
    id: "1932-zalozeni",
    date: { year: 1932 },
    type: "club",
    title: "Založení klubu",
    summary: "Klub vzniká v rámci tělocvičné organizace Sokol Bratčice a přijímá název AFK BRATČICE.",
    detail: [
      "První zápasy se hrají na provizorním hřišti u Tisí skály, později je zřízeno nové hřiště „V Chobotě“ na Radově louce za roční nájemné 500,- Kčs.",
      "Průkopníky jsou bratři Hamsové z čp. 13, Havránkové z čp. 130, Josef Ryšavý, Jaroslav Miláček, Rudolf Bečkovský, bratři Miláčkové, Josef a Václav Slavíkovi, František Marousek, Prokeš z čp. 130, Josef Kořínek a Josef Čejka; z přespolních František Spěvák, Bárta a Vančura z Podmok.",
      "Z funkcionářů Alois Hofrichter, obchodník Václav Fiala a Václav Prášek jako předseda — a někdy i hráč.",
    ],
  },
  {
    id: "zalesi",
    date: { text: "Po druhé světové válce" },
    type: "venue",
    title: "Hřiště v Zálesí",
    summary: "Díky pochopení pana Josefa Vrabce vzniká nové hřiště v Zálesí, kde klub hraje dodnes.",
    detail: [
      "Mění se i generace hráčů: Jiří Žaloudek, Bedřich Novotný, Oldřich Vavřina, Antonín Čapek, Václav Havránek, Jiří Prášek, Jaroslav Miláček, Vladimír Ryšavý, Jaroslav Rak, Josef Ságl, Jaroslav Zajíc, Slávek Knický, Antonín Kohout, Oldřich Zelinger, Čeněk Hnilička, Josef Říha, Miloslav Ronovský, Miroslav Daněk, Václav a Alois Štěpánkovi, Karel Doležal, Josef Papoušek a Miroslav Dvořák (Baxa).",
    ],
  },
  {
    id: "1948-ltc",
    date: { year: 1948, month: 9 },
    type: "match",
    title: "LTC Praha v Bratčicích",
    summary: "Přátelský zápas s LTC Praha, tehdy nejlepším hokejovým týmem republiky.",
    detail: [
      "Nejvýznamnější událost v historii klubu. LTC bylo kostrou československé reprezentace v ledním hokeji a zápas využilo v rámci letní přípravy.",
      "Podle doslechu zápas skončil 1:7 pro hokejisty, když Troják bombou protrhl síť. Další podrobnosti se nedochovaly, mimo několika fotografií.",
    ],
    facts: [{ items: [{ label: "Výsledek", value: "1:7" }] }],
  },
  {
    id: "padesata-leta",
    date: { decade: 1950 },
    type: "club",
    title: "Klub se jmenuje SOKOL",
    summary: "S reorganizací sportu musí být název změněn na SOKOL. Klub hraje soutěž tehdejšího čáslavského okresu.",
    detail: [
      "Přichází další generace: Václav Rak, Jiří Navrátil, Zdeněk Marousek, Bedřich Dušek, Jaroslav Procházka, Václav Kadlec, Josef Kafka, Milouš Čech, Josef Volenec a Josef Kotrba, které postupně doplňují Jiří Rak, Jaroslav Pecina, Milan Vaňkát, Václav Čech, František Spěvák, Zdeněk Dalešický, Josef Miláček a Alois Chládek.",
      "V přátelských zápasech vypomáhají Jiří Müller a Antonín Kohout ml. — ten hrál v té době za Spartak Praha Sokolovo (dnešní Spartu), se kterým se stal přeborníkem Československa.",
      "Soupeři v okresní soutěži jsou Golčův Jeníkov, Klášter, Okřesaneč, Hostovlice, Žleby, Ronov nad Doubravou, Třemošnice, Míčov a další.",
    ],
  },
  {
    id: "1957-preruseni",
    date: { text: "Léto 1957" },
    type: "crisis",
    title: "Přerušení činnosti",
    summary: "Na vojnu odcházejí téměř všichni hráči a činnost se přerušuje na dvanáct let.",
    detail: [
      "Do té doby klub nikdy neměl fotbalové kabiny: domácí i soupeř se převlékali v hospodě U Nováků a na hřiště docházeli oblečení a obutí. Kámen na stavbu byl už navezen za pískovkou, ale vichřice v padesátých letech vyvrátila i duby v místě, kde měly kabiny stát, a s nimi i ochotu je stavět.",
      "Dlouholetým pečovatelem o obuv a dresy byl švec pan Josef Novotný, o hřiště se staral pan Jaroslav Zajíc.",
    ],
  },
  {
    id: "1969-navrat",
    date: { year: 1969, month: 8, day: 24 },
    type: "club",
    title: "Návrat do mistrovských soutěží",
    summary: "Ročník 1969/1970 začíná mistrovským utkáním v Ratajích nad Sázavou. Od té doby hrají muži mistrovské soutěže nepřetržitě.",
  },
  {
    id: "1970-hriste",
    date: { year: 1970 },
    type: "venue",
    title: "Širší hřiště a družstvo žáků",
    summary: "Potok u hřiště dostává nové koryto a hrací plocha se rozšiřuje o zhruba sedm metrů. Vzniká družstvo žáků.",
    detail: [
      "Zázemí je provizorní: jako šatna slouží nejprve hostinec „U Nováků“, později kabina vyřazeného autobusu, a přilehlý potok dělá sprchy.",
    ],
  },
  {
    id: "kabiny",
    date: { year: 1972, to: { year: 1973 } },
    type: "venue",
    title: "Kabiny",
    summary: "Fotbalové kabiny stavěné svépomocí se v roce 1973 uvádějí do užívání.",
    detail: [
      "Dotace od OV ČSTV v Kutné Hoře pokryje materiál, stavební práce se dělají svépomocí. Další rekonstrukce kabin proběhla v roce 1998.",
    ],
  },
  {
    id: "2006-satny",
    date: { year: 2006 },
    type: "venue",
    title: "Přístavba šaten",
    summary: "Z dotace 1,9 mil. Kč přibývají dvě kabiny, klubovna a sociální zařízení.",
    detail: [
      "Obec Bratčice získává dotaci Ministerstva školství na rekonstrukci a přístavbu šaten a rekonstrukci sociálního zařízení. Ke stávajícím šatnám přibyly dvě kabiny, sociální zařízení, klubovna, úklidová místnost a kotelna; kabiny jsou napojeny na městský vodovod.",
    ],
  },
  {
    id: "prvni-dorost",
    date: { year: 2007, to: { year: 2010 } },
    type: "youth",
    title: "První dorost",
    summary: "Vzniká mužstvo dorostu. Vydrží tři roky a v roce 2010 je pro nedostatek hráčů zrušeno.",
  },
  {
    id: "2011-postup",
    date: { year: 2011 },
    type: "competition",
    title: "Postup do III. třídy",
    summary: "Mužstvo dospělých postupuje z prvního místa do III. třídy okresu Kutná Hora.",
  },
  {
    // Čl. 31 (pozvánka), 39 (výsledky); turnaj se pak hraje každé jaro.
    id: "2013-nohejbal",
    date: { year: 2013, month: 5, day: 18 },
    type: "community",
    title: "První nohejbalový turnaj",
    summary: "Klub pořádá 1. ročník nohejbalového turnaje na asfaltu u hřiště. Hraje se od té doby každé jaro.",
    detail: [
      "Hrají týmy áčka, žáků i staré gardy a další příznivci. Startovné 100 Kč, ke snídani klobása a odpoledne kýta.",
    ],
  },
  {
    // Čl. 100; tabulka ročníku 2013/14.
    id: "2014-sestup",
    date: { year: 2014, month: 6 },
    type: "competition",
    title: "Zpátky ve IV. třídě",
    summary: "Po třech sezónách ve III. třídě muži sestupují.",
    detail: [
      "O záchranu se hrálo do posledního kola. V Paběnicích pomohla jen výhra, ale mužstvo opět nemělo k dispozici základní jedenáctku a prohrálo.",
    ],
    facts: [
      {
        caption: "Sezóna 2013/14",
        items: [
          { label: "Pořadí", value: "13. ze 14" },
          { label: "Body", value: "28" },
          { label: "Skóre", value: "48:69" },
        ],
      },
    ],
  },
  {
    // Čl. 142, 147 (nábor a zápis), 154 (první zápasy).
    id: "2015-pripravka",
    date: { year: 2015, month: 8, day: 28 },
    type: "youth",
    title: "Přípravka",
    summary: "Po náboru dětí od pěti do devíti let hraje nová přípravka svůj první zápas v Tupadlech.",
    detail: [
      "Zápis dětí proběhl v červnu na hřišti v Bratčicích. Den po prvním zápase si přípravka doma zahrála proti maminkám.",
    ],
  },
  {
    // Čl. 244.
    id: "2017-stara-garda",
    date: { year: 2017, month: 6, day: 24 },
    type: "competition",
    title: "Pohár pro starou gardu",
    summary: "Stará garda poprvé v historii vyhrává turnaj starých gard a putovní pohár.",
    detail: [
      "Turnaj se hrál v Potěhách s Horkami, Tupadly a domácími. Bratčice porazily v semifinále Potěhy a ve finále Horky, oba zápasy až na penalty.",
    ],
  },
  {
    // Čl. 241 (pozvánka), 245 (průběh).
    id: "2017-85-let",
    date: { year: 2017, month: 7, day: 8 },
    type: "club",
    title: "85 let klubu",
    summary: "Slavnostní fotbalový den k 85 letům od založení.",
    detail: [
      "Dopoledne vyhrála přípravka AFK domácí turnaj před Vrdy a Potěhami. Odpoledne hrála stará garda se ženami z Čáslavi 6:6 a rozstřel, hlavním zápasem bylo utkání výběru Kutnohorska s Čáslaví A.",
    ],
  },
  {
    // Tabulka ročníku 2018/19 (ve IV. třídě se remízy rozhodovaly penaltami).
    id: "2019-nejlepsi-sezona",
    date: { year: 2018, to: { year: 2019 } },
    type: "competition",
    title: "Nejlepší sezóna ve IV. třídě",
    summary: "Muži končí druzí, s 89 vstřelenými góly.",
    facts: [
      {
        caption: "Sezóna 2018/19",
        items: [
          { label: "Pořadí", value: "2. z 12" },
          { label: "Bilance", value: "16 výher z 22" },
          { label: "Skóre", value: "89:44" },
          { label: "Body", value: "52" },
        ],
      },
    ],
  },
  {
    // Čl. 261 (ohlášení), 285 (zápas a citace KFI).
    id: "2019-kfi",
    date: { year: 2019, month: 7, day: 6 },
    type: "match",
    title: "Internacionálové v Bratčicích",
    summary: "K 50 letům obnovení činnosti hraje Traverza s Klubem fotbalových internacionálů ČR.",
    detail: [
      "Za velikého vedra a před zhruba 300 diváky podlehla Traverza internacionálům 1:5 (0:2). Za KFI skórovali Kuchař st. a Hromádko po dvou a Mlejnek. Dopoledne odehrála turnaj přípravka a skončila třetí.",
      "Za KFI nastoupili Macho, Hromádko, Kabyl, Kordule, Kuchař st., Kuchař ml., Mičinec, Mlejnek, Papoušek, Samek, Štambacher a Vašíček.",
      "Pražské fotbalisty už Bratčice jednou hostily: krátce po válce legendární LTC Praha.",
    ],
    facts: [
      {
        items: [
          { label: "Výsledek", value: "1:5 (0:2)" },
          { label: "Diváci", value: "asi 300" },
          { label: "Turnaj přípravek", value: "3. místo" },
        ],
      },
    ],
    links: [{ label: "LTC Praha v Bratčicích (1948)", anchor: "1948-ltc" }],
  },
  {
    // Čl. 298 (mladší žáci v soutěži 2019/20), 300, 313 (2022), 339 a 342 (2025/26); tabulka 5. ligy
    // starších žáků 2025/26.
    id: "2019-mladez",
    date: { year: 2019 },
    type: "youth",
    title: "Žáci v soutěži",
    summary: "Z přípravky vyrůstají mladší žáci, kteří hrají mistrovskou soutěž. Dětí je tolik, že klub hledá dalšího trenéra.",
    detail: [
      "V roce 2022 má klub starší žáky a starší přípravku, v sezóně 2025/26 hrají starší žáci 5. ligu a vedle nich trénuje mladší přípravka.",
    ],
  },
  {
    // Čl. 298; tabulky ročníků 2019/20 a 2020/21.
    id: "covid",
    date: { year: 2020, to: { year: 2021 } },
    type: "crisis",
    title: "Covid",
    summary: "Dvě nedohrané sezóny.",
    detail: [
      "Sezóna 2019/20 skončila po podzimu, jaro se kvůli koronaviru nehrálo a nikdo nepostoupil ani nesestoupil. Ročník 2020/21 se přerušil po šesti kolech.",
    ],
    facts: [
      { caption: "2019/20", items: [{ label: "Pořadí po podzimu", value: "2." }, { label: "Ztráta na Vrdy B", value: "4 body" }] },
      { caption: "2020/21", items: [{ label: "Bilance", value: "6 výher z 6" }, { label: "Skóre", value: "41:10" }] },
    ],
  },
  {
    // Čl. 306, 309.
    id: "2021-postup",
    date: { year: 2021, month: 6 },
    type: "competition",
    title: "Návrat do III. třídy",
    summary: "Po sedmi sezónách ve IV. třídě hrají muži znovu III. třídu a drží se v ní dodnes.",
    detail: [
      "Soutěž se po dvou letech pandemie nedohrála. Ve III. třídě se uvolnilo místo, když se Paběnice B přihlásily do IV. třídy, a rozhodovalo se mezi Bratčicemi a Suchdolem B.",
      "Rozhodlo lepší skóre: 41 gólů v šesti zápasech proti 33 gólům Suchdolu v sedmi. Postup klub oslavil v srpnu přátelskými zápasy starších žáků i dospělých se Zbraslavicemi.",
    ],
    links: [{ label: "Postup do III. třídy (2011)", anchor: "2011-postup" }],
  },
  {
    // Čl. 315.
    id: "2022-90-let",
    date: { year: 2022, month: 6 },
    type: "club",
    title: "90 let klubu",
    summary: "Oslavy 90 let založení spojené s turnajem starých gard, který se vrátil po covidové pauze.",
    detail: [
      "Turnaj pořádalo AFK spolu s obcí; o putovní pohár hráli pánové nad 35 let z Tupadel, Potěh, Horek a Bratčic.",
    ],
  },
  {
    // Čl. 333.
    id: "2024-povodne",
    date: { year: 2024 },
    type: "crisis",
    title: "Povodně",
    summary: "Povodně poškodily hřiště a zázemí klubu.",
    detail: [
      "S obnovou pomohl i dar 12 000 Kč od fotbalového týmu 6 až 12, který založili kamarádi ze sportovního gymnázia na Kladně.",
    ],
  },
  {
    // Čl. 338 (1. ročník), 344 (2. ročník 2026).
    id: "2025-mala-kopana",
    date: { year: 2025, month: 7, day: 12 },
    type: "community",
    title: "Malá kopaná",
    summary: "První ročník turnaje v malé kopané na hřišti AFK. Druhý následoval v červnu 2026.",
  },
  {
    id: "dnes",
    date: { text: "Dnes" },
    type: "club",
    title: "Tři mužstva",
    summary: "AFK Bratčice staví muže, dorost a žáky — dorost je po šestnácti letech zpátky.",
    detail: [
      "Členové klubu se nevěnují jen fotbalu: podílejí se na kulturním a společenském životě obce pořádáním tanečních zábav a spolu s dalšími místními spolky a obecním úřadem jsou spolupořadateli akcí pro děti a mládež.",
    ],
  },
];

export { HISTORY_INTRO, HISTORY_SOURCES, HISTORY_MILESTONE_LIST };
