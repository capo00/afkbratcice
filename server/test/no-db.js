// Vypne připojení k Mongu pro jednotkové testy.
//
// `Dao` z caio-server si v konstruktoru rovnou otevře spojení a pustí `createIndexes()`
// -- a protože dao je v každém modulu instanciované při importu, stačí naimportovat
// `server/match/dao.js` a test se drží na živé databázi (a proces pak ani neskončí).
// Prázdné `MONGODB_URI` je jediné, co konstruktor přeskočí (`if (this.uri)`), a dotenv
// už nastavenou proměnnou nepřepisuje, takže `.env.development` tohle nepřebije.
//
// Importovat **jako první**, před čímkoli, co táhne dao:
//
//   import "./no-db.js";
//   import crud from "../person/crud.js";
//
// ESM vyhodnocuje importy v pořadí zápisu, takže se to stihne včas.
process.env.MONGODB_URI = "";
