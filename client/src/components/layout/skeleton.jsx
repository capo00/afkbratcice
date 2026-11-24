import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { DELAYED_APPEAR } from "./delayed-appear.js";

// uu5 `Skeleton` se zpožděným objevením (Caio 2026-11-24): stejné props i vzhled, jen je prvních
// 400 ms průhledný a pak se prolne (layout/delayed-appear.js). Dřív se šedý blok ukázal okamžitě,
// takže při přechodu mezi stránkami problikl i tam, kde data dorazila za 0,2 s.
//
// Animace objevení je na **obalu**, ne na uu5 `Skeleton`: ten má na kořeni vlastní `animation`
// (shimmer) a naše třída by ji přepsala -- skeleton by stál. `className` jde na obal (umístění).
//
// Skeletony poskládané podle layoutu (dlaždice, tabulka, karty) místo jednoho bloku jsou
// samostatná úprava (docs/proposal-section-loading.md, fáze 2 C).

const APPEAR_CLASS = Config.Css.css(DELAYED_APPEAR);

const Skeleton = createVisualComponent({
  uu5Tag: Config.TAG + "Skeleton",

  render({ className, ...props }) {
    return (
      <div className={Config.Css.join(APPEAR_CLASS, className)}>
        <Uu5Elements.Skeleton {...props} />
      </div>
    );
  },
});

export { Skeleton };
export default Skeleton;
