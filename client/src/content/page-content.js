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
// něco nemá, není to tu taky — radši prázdno než smyšlená historie klubu. Jediné, co se
// přidalo, jsou letopočty a mezinadpisy časové osy: vznikly rozdělením souvislého textu
// z v0, žádná událost k nim nepřibyla.
//
// Seznam stránek a jejich názvy jsou vedle v `pages.js` — proč, je napsané tam.

import TEAM_PHOTOS from "./team-photos.js";

/** Jeden blok týmové fotky → uu5String. Sestavy drží `content/team-photos.js`. */
function teamPhotoBlock({ season, team, file, note, rowList }) {
  return [
    `<h3>${season} · ${team}</h3>`,
    // `loading="lazy"` schválně: fotek je 35 a dohromady mají přes 7 MB, takže bez
    // odloženého načítání by stránka stahovala celou historii klubu najednou.
    `<img src="/assets/teams/${file}" alt="${team} ${season}" loading="lazy"/>`,
    ...(note ? [`<p><i>${note}</i></p>`] : []),
    ...rowList.map(({ label, names }) => `<p><b>${label}:</b> ${names}</p>`),
  ].join("\n");
}

const PAGE_CONTENT = {
  // Časová osa je `Uu5Bricks.VerticalTimeline` — hotová komponenta, nepíše se vlastní
  // (design/frontend.md, 3.11.1). Je lazy, takže se její kód stáhne teprve na téhle
  // stránce; do `client/package.json` kvůli ní přibyl `uu5bricksg01`.
  //
  // Souvislý text z v0 je rozsekaný na milníky schválně: seznam jmen průkopníků a čtyři
  // odstavce o kabinách se jako jeden sloupec textu nečtou. Věcně je to totéž, jen
  // seřazené podle let — a co v0 nedatuje (třeba změnu názvu na SOKOL), zůstává
  // u desetiletí, ne u vymyšleného roku.
  historie: `<uu5string/>
<p>Fotbalový klub v Bratčicích byl založen v roce 1932 v rámci tělocvičné organizace
Sokol Bratčice. Od té doby se v obci hraje — s jedinou dvanáctiletou přestávkou —
dodnes.</p>

<Uu5Bricks.VerticalTimeline>
  <Uu5Bricks.VerticalTimeline.Item label="1932 · Založení klubu" icon="uugds-favorites" colorScheme="primary" significance="highlighted">
    Klub vzniká v rámci tělocvičné organizace Sokol Bratčice. První zápasy se hrají na
    provizorním hřišti u Tisí skály, později je zřízeno nové hřiště „V Chobotě" na Radově
    louce za roční nájemné 500,- Kčs. Průkopníky jsou bratři Hamsové z čp. 13, Havránkové
    z čp. 130, Josef Ryšavý, Jaroslav Miláček, Rudolf Bečkovský, bratři Miláčkové, Josef
    a Václav Slavíkovi, František Marousek, Prokeš z čp. 130, Josef Kořínek a Josef Čejka;
    z přespolních František Spěvák, Bárta a Vančura z Podmok. Z funkcionářů Alois
    Hofrichter, obchodník Václav Fiala a Václav Prášek jako předseda — a někdy i hráč.
    Klub přijímá název <b>AFK BRATČICE</b>.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="Po druhé světové válce · Hřiště v Zálesí" icon="uugds-home">
    Díky pochopení pana Josefa Vrabce je vybudováno nové hřiště v Zálesí, kde klub hraje
    dodnes. Mění se i generace hráčů: Jiří Žaloudek, Bedřich Novotný, Oldřich Vavřina,
    Antonín Čapek, Václav Havránek, Jiří Prášek, Jaroslav Miláček, Vladimír Ryšavý,
    Jaroslav Rak, Josef Ságl, Jaroslav Zajíc, Slávek Knický, Antonín Kohout, Oldřich
    Zelinger, Čeněk Hnilička, Josef Říha, Miloslav Ronovský, Miroslav Daněk, Václav
    a Alois Štěpánkovi, Karel Doležal, Josef Papoušek a Miroslav Dvořák (Baxa).
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="Září 1948 · LTC Praha v Bratčicích" icon="uugdsstencil-uiaction-star" colorScheme="primary">
    Nejvýznamnější událost v historii klubu: přátelský zápas s mužstvem <b>LTC Praha</b>,
    které ho využilo v rámci letní přípravy. LTC bylo tehdy nejlepším týmem republiky
    v ledním hokeji a kostrou československé reprezentace. Podle doslechu zápas skončil
    1:7 pro hokejisty, když Troják bombou protrhl síť. Další podrobnosti se nedochovaly,
    mimo několika fotografií.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="Padesátá léta · Klub se jmenuje SOKOL" icon="uugds-refresh">
    S reorganizací sportu musí být název změněn na SOKOL. Přichází další generace: Václav
    Rak, Jiří Navrátil, Zdeněk Marousek, Bedřich Dušek, Jaroslav Procházka, Václav Kadlec,
    Josef Kafka, Milouš Čech, Josef Volenec a Josef Kotrba, které postupně doplňují Jiří
    Rak, Jaroslav Pecina, Milan Vaňkát, Václav Čech, František Spěvák, Zdeněk Dalešický,
    Josef Miláček a Alois Chládek. V přátelských zápasech vypomáhají Jiří Müller a Antonín
    Kohout ml. — ten hrál v té době za Spartak Praha Sokolovo (dnešní Spartu), se kterým se
    stal přeborníkem Československa. Klub hraje soutěž tehdejšího čáslavského okresu proti
    Golčovu Jeníkovu, Klášteru, Okřesanči, Hostovlicím, Žlebům, Ronovu nad Doubravou,
    Třemošnici, Míčovu a dalším.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="Léto 1957 · Přerušení činnosti" icon="uugds-alert-circle">
    Na vojnu odcházejí téměř všichni hráči a aktivní činnost se přerušuje — na dvanáct let,
    až do poloviny roku 1969. Do té doby klub nikdy neměl fotbalové kabiny: domácí i soupeř
    se převlékali v hospodě U Nováků a na hřiště docházeli oblečení a obutí. Kámen na stavbu
    byl už navezen za pískovkou, ale vichřice v padesátých letech vyvrátila i duby v místě,
    kde měly kabiny stát, a s nimi i ochotu je stavět. Dlouholetým pečovatelem o obuv
    a dresy byl švec pan Josef Novotný, o hřiště se staral pan Jaroslav Zajíc.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="24. 8. 1969 · Návrat do mistrovských soutěží" icon="uugds-sprint" colorScheme="primary">
    Ročník 1969/1970 je zahájen mistrovským utkáním na hřišti v Ratajích nad Sázavou. Od
    tohoto roku hraje mužstvo dospělých mistrovské soutěže nepřetržitě až do současnosti.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="1970 · Širší hřiště a družstvo žáků" icon="uugds-account-multi">
    Tok potoka sousedícího s hřištěm je převeden do nově zbudovaného koryta, což umožní
    rozšířit hrací plochu o zhruba sedm metrů. Ve stejném roce vzniká družstvo žáků. Zázemí
    je provizorní: jako šatna slouží nejprve hostinec „U Nováků", později kabina vyřazeného
    autobusu, a přilehlý potok dělá sprchy.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="1972–1973 · Kabiny" icon="uugds-home">
    Dotace od OV ČSTV v Kutné Hoře pokryje materiál na výstavbu fotbalových kabin, stavební
    práce se dělají svépomocí. V roce 1973 jsou kabiny uvedeny do užívání; další
    rekonstrukce proběhla v roce 1998.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="2006 · Přístavba šaten" icon="uugds-plus-circle">
    Obec Bratčice získává dotaci Ministerstva školství ve výši 1,9 mil. Kč na rekonstrukci
    a přístavbu šaten a rekonstrukci sociálního zařízení. Ke stávajícím šatnám přibyly dvě
    kabiny, sociální zařízení, klubovna, úklidová místnost a kotelna; kabiny jsou napojeny
    na městský vodovod.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="2007–2010 · První dorost" icon="uugds-account-badge">
    Vzniká mužstvo dorostu. Vydrží tři roky a v roce 2010 je pro nedostatek hráčů zrušeno.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="2011 · Postup do III. třídy" icon="uugdsstencil-uiaction-trophy" colorScheme="primary">
    Mužstvo dospělých postupuje z prvního místa do III. třídy okresu Kutná Hora.
  </Uu5Bricks.VerticalTimeline.Item>

  <Uu5Bricks.VerticalTimeline.Item label="Dnes · Tři mužstva" icon="uugds-shield" colorScheme="primary" significance="highlighted">
    AFK Bratčice staví <b>muže, dorost a žáky</b> — dorost je po šestnácti letech zpátky.
    Členové klubu se ale nevěnují jen fotbalu: podílejí se na kulturním a společenském
    životě obce pořádáním tanečních zábav a spolu s dalšími místními spolky a obecním
    úřadem jsou spolupořadateli akcí pro děti a mládež.
  </Uu5Bricks.VerticalTimeline.Item>
</Uu5Bricks.VerticalTimeline>

<p><i>Čerpáno ze záznamů a fotografií z pamětní knihy pana Václava Práška a z pamětí
bývalých aktivních účastníků pana Josefa Ságla, Jaroslava Miláčka a Josefa Štěpánka.
Autor první části: Josef Štěpánek. Zdroj druhé části: KOZOHORSKÁ M. &amp; JELÍNKOVÁ E.,
Almanach Pernerovy Bratčice, obec Bratčice 2010, str. 23 — AFK Bratčice, autor Václav
Ronovský.</i></p>`,

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

  vybor: `<uu5string/>
<h3>Předseda</h3>
<p><b>Jaroslav Doležal</b><br/>
Telefon: <a href="tel:+420605907732">+420 605 907 732</a><br/>
E-mail: <a href="mailto:dolezalj@szdc.cz">dolezalj@szdc.cz</a></p>

<h3>Místopředseda</h3>
<p><b>Luboš Říha</b><br/>
Telefon: <a href="tel:+420605039810">+420 605 039 810</a><br/>
E-mail: <a href="mailto:lubosriha58@seznam.cz">lubosriha58@seznam.cz</a></p>

<h3>Tajemník</h3>
<p><b>Ondřej Čapek</b><br/>
Telefon: <a href="tel:+420737870746">+420 737 870 746</a><br/>
E-mail: <a href="mailto:admin@afkbratcice.cz">admin@afkbratcice.cz</a></p>

<h3>Ostatní členové</h3>
<p><b>Václav Říha</b> — <a href="mailto:venda.riha@atlas.cz">venda.riha@atlas.cz</a><br/>
<b>Petra Zajícová</b> — <a href="mailto:peta.zajicova@gmail.com">peta.zajicova@gmail.com</a><br/>
<b>Jan Tichý</b> — <a href="mailto:jan.tichy89@gmail.com">jan.tichy89@gmail.com</a><br/>
<b>Martin Kaňka</b> — <a href="mailto:martinkanka2@seznam.cz">martinkanka2@seznam.cz</a></p>`,

  treninky: `<uu5string/>
<p>Muži trénují <b>v pátek od 17:00</b> na hřišti AFK Bratčice v Zálesí.</p>
<p>Termíny tréninků mládeže se domlouvají podle rozlosování a hlásí je trenér — sledujte
proužek s upozorněním nad stránkou a
<a href="https://www.facebook.com/afkbratcice" target="_blank">Facebook klubu</a>.</p>`,

  "tymove-fotky": `<uu5string/>
<p>Chronologie mužstev od sezóny 1943/1944. U starších fotek se dochovala jen jména,
u novějších i to, co se ten rok povedlo.</p>

${TEAM_PHOTOS.map(teamPhotoBlock).join("\n\n")}`,
};

export { PAGE_CONTENT };
export default PAGE_CONTENT;
