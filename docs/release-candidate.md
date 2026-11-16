# Release candidate

## Přidáno
- Novou osobu jde dát na soupisku jedním krokem: formulář soupisky vybírá osobu s hledáním a kartu hráče, pokud ji osoba ještě nemá, založí server sám.
- Administrace zápasů se otvírá s povinným filtrem Termín (rok zpátky a rok dopředu); filtr jde změnit, ne odebrat.
- Klientské knihovny uu5g05 jsou dočasně na alfě 1.54.0-alpha-react19.3 s Reactem 19.1.9, stejně jako referenční appka (návrat popsaný v `design/frontend.md`).

## Opraveno
- Bezpečnost: `match/create` a `match/update` už nepřijímají sestavu a výsledek (editor týmu mohl přepsat sestavu soupeře), import rozpisu hlídá rozstřel, `gallery/deletePhoto` smaže jen fotku daného alba, `person/create` a `update` už nepřiřazují účet a správce týmu u svého týmu mění jen název a zkratku.
- Statistiky hráčů bez sezóny a týmu už anonymům neukazují jména dětí.
- Chyba načtení se už netváří jako prázdný stav: stránky rozliší načítání, neexistující záznam a výpadek s tlačítkem „Zkusit znovu“.
- Chyby serveru se v administraci ukazují česky na všech obrazovkách i v modalu zápasu.
- Historie klubu běží na `Uu5Extras.VerticalTimeline`: bez požadavku na `/oidc/getClientId`, popisky se nepřekrývají s textem a text je čitelný i pro čtečky.
- Velikosti písma jsou všude z uuGds (hero na úvodní stránce zůstává 96 px jako zapsaná výjimka), titulky karet jsou nadpisy a okraje nadpisů a nadtitulků se uplatní vždy.
- Červený malý text (nadtitulky, záhlaví tabulek, odkazy v textu) má v tmavém režimu kontrast AA.
- Zbylé texty rozhraní (tooltipy zpět, písmena formy V/R/P) jsou v LSI.

## Breaking
- `match/list` bez filtru vrací 400 `invalidDtoIn`; povinný je aspoň jeden z `seasonId`, `teamId`, `teamIdList`, `homeTeamId`, `guestTeamId`, `playerId`, `dateFrom`, `dateTo`.
- `match/create` a `match/update` zahazují `playerList` a výsledek (zapisují se jen přes `match/setLineup` a `match/setResult`); `person/create` a `update` zahazují `identity`.
