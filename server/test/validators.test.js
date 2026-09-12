import test from "node:test";
import assert from "node:assert/strict";
import { validate, numeric, truthy, shape, string, integer, any } from "../services/validators.js";

// `validate()` je jediná brána mezi dtoIn a use casem: co propustí, jde rovnou do Dao.

/** Spolkne `console.warn`, aby výpis testů nezaplavila hlášení o klíčích navíc. */
function withoutWarnings(fn) {
  const original = console.warn;
  const warningList = [];
  console.warn = (...args) => warningList.push(args.join(" "));
  try {
    return { result: fn(), warningList };
  } finally {
    console.warn = original;
  }
}

test("platný dtoIn projde a vrátí přetypovanou hodnotu", () => {
  const validator = validate(shape({ name: string().isRequired(), count: integer() }));

  assert.deepEqual(validator({ dtoIn: { name: "Bratčice", count: 3 } }), { name: "Bratčice", count: 3 });
});

test("chybějící povinný klíč skončí chybou, ne tichým průchodem", () => {
  const validator = validate(shape({ name: string().isRequired() }));

  assert.throws(() => validator({ dtoIn: {} }), (e) => {
    assert.match(e.message, /Invalid dtoIn/);
    assert.ok(Array.isArray(e.errors) && e.errors.length, "chyba nese seznam `errors`");
    return true;
  });
});

test("chybějící dtoIn se bere jako prázdný objekt", () => {
  assert.deepEqual(validate(shape({ name: string() }))({}), {});
});

test("klíč navíc je jen varování -- starší klient nesmí přestat fungovat", () => {
  const validator = validate(shape({ name: string() }));
  const { result, warningList } = withoutWarnings(() => validator({ dtoIn: { name: "x", zbytek: 1 } }));

  assert.deepEqual(result, { name: "x" });
  assert.equal(warningList.length, 1);
});

test("`sys` se zahazuje i tam, kde ho tvar připouští", () => {
  // Dao má `sys` rezervované a na zápis s ním hodí DaoError; proto ho vyhazuje validátor
  // centrálně, ne každý zápisový use case zvlášť.
  const validator = validate(shape({ name: string(), sys: any() }));

  assert.deepEqual(validator({ dtoIn: { name: "x", sys: { cts: "2026-09-09" } } }), { name: "x" });
});

test("numeric přetypuje řetězec z GET dotazu", () => {
  assert.equal(numeric("12"), 12);
  assert.equal(numeric("0"), 0); // nula je platná hodnota, ne prázdno
  assert.equal(numeric(5), 5);

  assert.equal(numeric(""), undefined);
  assert.equal(numeric(null), undefined);
  assert.equal(numeric(undefined), undefined);
  assert.equal(numeric("nesmysl"), undefined);
});

test("truthy bere jen ano, ne cokoli neprázdného", () => {
  for (const value of [true, "true", 1, "1"]) assert.equal(truthy(value), true, String(value));
  for (const value of [false, "false", 0, "0", "", null, undefined, "ano"]) assert.equal(truthy(value), false, String(value));
});
