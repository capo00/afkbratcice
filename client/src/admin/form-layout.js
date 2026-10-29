// `gridLayout` for `Uu5Forms.Form.View` built from a `UiElements.Crud` config.
//
// `Crud` puts the output of `generateInputs` straight into the modal without a `Form.View`,
// and `Form.View` spaces its fields only with a `gridLayout` -- without one the fields sit
// tightly under each other. The layout has to list exactly the rendered inputs: an area with
// no field still makes a grid row and doubles the gap.

/** Names of the fields `Crud.generateInputs` renders: config keys with a truthy `input`, in order. */
function inputNameList(cfg) {
  return Object.keys(cfg).filter((name) => cfg[name]?.input);
}

/**
 * One field per row on a phone (`xs`); from `s` up the pairs from `pairList` side by side.
 * A pair is joined only when its fields follow each other among the inputs, so the visual
 * order stays the tab order.
 */
function formGridLayout(cfg, pairList = []) {
  const nameList = inputNameList(cfg);
  const rowList = [];

  for (let i = 0; i < nameList.length; i++) {
    const name = nameList[i];
    const pair = pairList.find(([first]) => first === name);
    if (pair && nameList[i + 1] === pair[1]) {
      rowList.push(`${pair[0]} ${pair[1]}`);
      i++;
    } else {
      rowList.push(`${name} ${name}`);
    }
  }

  return { xs: nameList.join(", "), s: rowList.join(", ") };
}

export { inputNameList, formGridLayout };
