import { UiElements } from "caio-ui";

// `calls` pro `UiElements.CrudContext` — **jen ty operace, které entita na serveru má**.
//
// Výchozí sada v `caio-ui` se odvozuje z názvu entity a `createMany` do ní dává vždycky
// (`crud-context.jsx`, `getCalls`). `UiElements.Crud` pak vedle „Vytvořit" nabídne
// i „Hromadně" — jenže `createMany` má z celé appky jediná entita, `match`
// (`server/match/api.js`). Na ostatních obrazovkách to bylo tlačítko na 404.
//
// Jmenná konvence klíčů je daná knihovnou (`list`, `createItem`, `updateItem`,
// `deleteItem`, `createMany`, `deleteMany`), ne námi.

/**
 * @param entity   název entity, ze kterého se skládají use casy (`team` → `team/list`)
 * @param options  které hromadné operace entita má; obě jsou výchozí `false`
 * @returns objekt pro prop `calls` na provideru
 */
function entityCalls(entity, { createMany = false, deleteMany = false } = {}) {
  const calls = {
    list: (dtoIn) => UiElements.Call.cmdGet(`${entity}/list`, dtoIn),
    createItem: (dtoIn) => UiElements.Call.cmdPost(`${entity}/create`, dtoIn),
    updateItem: (dtoIn) => UiElements.Call.cmdPost(`${entity}/update`, dtoIn),
    deleteItem: (dtoIn) => UiElements.Call.cmdPost(`${entity}/delete`, dtoIn),
  };

  if (createMany) calls.createMany = (dtoIn) => UiElements.Call.cmdPost(`${entity}/createMany`, dtoIn);
  if (deleteMany) calls.deleteMany = (dtoIn) => UiElements.Call.cmdPost(`${entity}/deleteMany`, dtoIn);

  return calls;
}

export { entityCalls };
