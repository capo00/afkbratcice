import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import { formGridLayout } from "./form-layout.js";

// Admin only: `UiElements.Crud` comes from the `caio-ui` barrel, which the public web must not
// load -- that is why this is not in `fields.jsx` (the web lazy-loads it via `match-modals.jsx`).

/**
 * Inputs of a `Crud` form in a `Form.View` with a grid, so the fields have gaps between them
 * (form-layout.js). `pairList` = pairs of adjacent fields side by side from `s` up.
 */
function CrudFormView({ cfg, operation, pairList }) {
  return (
    <Uu5Forms.Form.View gridLayout={formGridLayout(cfg, pairList)}>
      {UiElements.Crud.generateInputs(cfg, { operation })}
    </Uu5Forms.Form.View>
  );
}

export { CrudFormView };
export default CrudFormView;
