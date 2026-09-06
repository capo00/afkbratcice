import { shape, string, mongoId, oneOf, array, integer, boolean, date, datetime, pageInfo, any }
  from "uu_appdatatypesg02";

// uu_appdatatypesg02 funguje, jen nemá default export a metody se jmenují shape()/array(),
// ne .exact()/.arrayOf() -- viz design/api.md, sekce 1.0.

/**
 * Zabalí DataType do funkce, kterou čeká `validator` v definici use casu.
 *
 * Klíč navíc je v uu_appdatatypesg02 jen `warning`, ne `error`. Necháváme to tak
 * schválně: zalogovat a pustit dál, aby starší klient po nasazení nepřestal fungovat.
 */
function validate(dataType) {
  return ({ dtoIn }) => {
    const { value, errors, warnings } = dataType.validate(dtoIn ?? {});

    if (errors.length) {
      const e = new Error("Invalid dtoIn: " + errors.map((x) => `${x.path.join(".")} ${x.message}`).join("; "));
      e.errors = errors;
      throw e;
    }
    if (warnings.length) {
      console.warn("[validator] dtoIn warnings:", warnings.map((w) => `${w.path.join(".")} ${w.message}`).join("; "));
    }

    // `sys` je v Dao rezervovaný klíč a Dao.create na něj hodí DaoError, takže ho
    // zahazujeme centrálně -- ne v každém zápisovém use casu zvlášť.
    const { sys, ...rest } = value ?? {};
    return rest;
  };
}

/**
 * U GET dorazí všechno jako string: caio-server projede JSON.parse jen hodnoty
 * začínající `{` nebo `[`. Číselné a boolean parametry proto přijímáme jako string
 * a přetypujeme je tady.
 */
function numeric(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function truthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export { validate, numeric, truthy, shape, string, mongoId, oneOf, array, integer, boolean, date, datetime, pageInfo, any };
