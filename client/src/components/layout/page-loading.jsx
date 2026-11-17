import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";

// Celostránkové načítání: start aplikace (core/app-context.jsx) a líně načítaná routa webu
// (router.jsx) i administrace (admin/app.jsx). Dřív to byly tři kopie `Pending` ve vlastním
// `div` s různým odsazením (64/96 px).
//
// `Box shape="background" significance="subdued"` je podklad bez rámečku (rámeček kreslí
// tvar `ground`, review 1.3 B, Caio 2026-11-17). Výška drží místo, ať patička neposkočí
// nahoru a pak zase dolů.

const PageLoading = createVisualComponent({
  uu5Tag: Config.TAG + "PageLoading",

  render({ className }) {
    return (
      <Uu5Elements.Box
        shape="background"
        significance="subdued"
        className={Config.Css.join(
          Config.Css.css({ display: "flex", justifyContent: "center", alignItems: "center", minBlockSize: 320 }),
          className,
        )}
      >
        <Uu5Elements.Pending size="xl" />
      </Uu5Elements.Box>
    );
  },
});

export { PageLoading };
export default PageLoading;
