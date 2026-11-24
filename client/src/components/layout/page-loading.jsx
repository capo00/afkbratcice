import { createVisualComponent, Lsi } from "uu5g05";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import { DELAYED_APPEAR } from "./delayed-appear.js";

// Celostránkové načítání: líně načítaná routa webu (router.jsx: obsahové stránky při první
// návštěvě) i administrace (admin/app.jsx) a nový pokus po chybě startu (core/app-context.jsx).
// Při prvním startu webu i administrace místo něj drží boot screen z HTML (core/boot-screen.jsx).
//
// Vypadá jako start SPA: erb v točícím se kruhu, bez názvu (Caio 2026-11-24, web i admin, stejná
// velikost). Dřív to byl šedý `Box` s uu5 `Pending`, takže start, přechod a „Zkusit znovu“ měly tři
// různé vzhledy. Objevuje se se zpožděním 400 ms (layout/delayed-appear.js): na rychlé síti se
// neukáže vůbec.
//
// POZOR: geometrie a barvy kopírují boot screen z caio-devkit (`bootCss` v
// `caio-devkit/.../vite/plugins/document.js`: kruh `min(252px, 70vw)`, 6px maska, gradient do 30 %,
// otáčka 1 s, erb 60 %, barva `clubRed`). Při změně boot screenu v devkitu (`boot` v caio.config.js)
// upravit i tady. Až se boot screen přesune do devkitu/caio-ui jako sdílená komponenta
// (docs/proposal-section-loading.md, fáze 2 D), tahle kopie zmizí.
//
// Výška drží místo, ať patička neposkočí. `height` je minimální výška, výchozí 320 px; router ji
// natahuje na výšku obalu routy (okno bez lišty), `AppProvider` po chybě startu na celé okno.

const SPIN = "afk-page-loading-spin";

Config.Css.injectGlobal({
  [`@keyframes ${SPIN}`]: { to: { transform: "rotate(360deg)" } },
});

const RING_MASK = "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))";

const Css = {
  main: (height) =>
    Config.Css.css({
      ...DELAYED_APPEAR,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minBlockSize: height,
    }),
  mark: () =>
    Config.Css.css({
      position: "relative",
      display: "grid",
      placeItems: "center",
      inlineSize: "min(252px, 70vw)",
      aspectRatio: "1",
      color: Config.theme.color.clubRed,
    }),
  ring: () =>
    Config.Css.css({
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: "linear-gradient(currentColor, color-mix(in srgb, currentColor 30%, transparent))",
      WebkitMask: RING_MASK,
      mask: RING_MASK,
      animation: `${SPIN} 1s linear infinite`,
      // Otáčení je ozdoba, ne informace: pro citlivé na pohyb pomaleji (jako boot screen).
      "@media (prefers-reduced-motion: reduce)": { animationDuration: "3s" },
    }),
  logo: () => Config.Css.css({ inlineSize: "60%", blockSize: "auto" }),
  // Text jen pro čtečku: „Načítám…“ místo vizuálního kruhu.
  hidden: () =>
    Config.Css.css({
      position: "absolute",
      inlineSize: 1,
      blockSize: 1,
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      whiteSpace: "nowrap",
    }),
};

const PageLoading = createVisualComponent({
  uu5Tag: Config.TAG + "PageLoading",

  render({ height = 320, className }) {
    return (
      <div role="status" className={Config.Css.join(Css.main(height), className)}>
        <div className={Css.mark()} aria-hidden="true">
          <div className={Css.ring()} />
          <img className={Css.logo()} src={Config.asset.logoTransparent} alt="" />
        </div>
        <span className={Css.hidden()}>
          <Lsi lsi={lsi("common", "loading")} />
        </span>
      </div>
    );
  },
});

export { PageLoading };
export default PageLoading;
