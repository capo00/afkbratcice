import { createVisualComponent, useElementSize, useAppBackground, useLsi, BackgroundProvider, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
import { layoutLineup, shortName, initials, PLAYER_BOX } from "./layout.js";

// Sestava jednoho týmu na hřišti (varianta C, schválil Caio 2026-10-27; canvas „AFK Bratčice –
// posty v sestavě“). Hřiště je vlastní kresba -- uu5 komponentu hřiště nemá.
//
// Responzivita: hřiště drží poměr 68 : 105 a hráči stojí v procentech (layout.js), takže se
// zmenšuje celé najednou. Velikost kruhu a šířka jména se odvozují ze změřené šířky hřiště,
// ne z obrazovky -- hřiště může stát i v užším sloupci. Kruh je `RichIcon` (pevné stupně
// velikosti) s fotkou v `imageSrc`, bez fotky s iniciálami v `text`. Jméno je `Text`
// s `autoFit`, který dlouhé příjmení zúží, zmenší a celé ukáže v tooltipu. Post je jen
// v tooltipu kruhu, v jazyce webu.

// Barvy hřiště a karet patří hřišti (Caio 2026-10-27), ne paletě webu: hřiště je obrázek,
// v obou režimech zelené, v tmavém tlumenější.
const PITCH_COLOR = {
  light: { grass: "#3E8E4A", stripe: "#378343", line: "rgba(255, 255, 255, 0.8)", text: "#FFFFFF" },
  dark: { grass: "#2C6A36", stripe: "#285F31", line: "rgba(255, 255, 255, 0.55)", text: "#FFFFFF" },
};
const CARD_COLOR = { yellow: "#E9C500", red: "#D01319" };
// Card size (px); the goal ball is as tall as a card (Caio 2026-10-29).
const CARD_SIZE = { width: 8, height: 11 };
const NAME_SHADOW = "0 1px 2px rgba(0, 0, 0, 0.6)";

// Průměr kruhu (px) podle stupně `RichIcon`. Vybírá se největší, který se při dané šířce
// hřiště vejde i se jménem do svislého rozestupu postů (PLAYER_BOX.height).
const ICON_SIZE_LIST = [
  ["xl", 48],
  ["l", 40],
  ["m", 36],
  ["s", 32],
];
const NAME_HEIGHT = 16;
// Užší hřiště (mobil): pod fotkou jen příjmení, bez iniciály jména (Caio 2026-10-27).
const SURNAME_ONLY_BELOW = 400;
const PITCH_RATIO = 105 / 68;

function iconSizeFor(pitchWidth) {
  const budget = (pitchWidth * PITCH_RATIO * PLAYER_BOX.height) / 100 - NAME_HEIGHT - 4;
  return ICON_SIZE_LIST.find(([, px]) => px <= budget) ?? ICON_SIZE_LIST.at(-1);
}

/** Hřiště na výšku, útok nahoru. SVG ve viewBoxu 68 × 105 (metry), lajny přes `currentColor`. */
function PitchDrawing({ colors }) {
  return (
    <svg
      viewBox="0 0 68 105"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={Config.Css.css({ position: "absolute", inset: 0, inlineSize: "100%", blockSize: "100%", color: colors.line })}
    >
      <rect x="0" y="0" width="68" height="105" fill={colors.grass} />
      {[0, 2, 4, 6, 8].map((i) => (
        <rect key={i} x="0" y={i * 10.5 + 5.25} width="68" height="5.25" fill={colors.stripe} />
      ))}
      <g fill="none" stroke="currentColor" strokeWidth="0.4">
        <rect x="1.5" y="1.5" width="65" height="102" />
        <line x1="1.5" y1="52.5" x2="66.5" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" />
        <rect x="13.84" y="1.5" width="40.32" height="16.5" />
        <rect x="24.84" y="1.5" width="18.32" height="5.5" />
        <rect x="13.84" y="87" width="40.32" height="16.5" />
        <rect x="24.84" y="98" width="18.32" height="5.5" />
      </g>
      <g fill="currentColor">
        <circle cx="34" cy="52.5" r="0.5" />
        <circle cx="34" cy="12.5" r="0.5" />
        <circle cx="34" cy="92.5" r="0.5" />
      </g>
    </svg>
  );
}

/** Photo circle with goal and card marks and the name below it. */
function Player({ entry, iconSize, nameWidth, positionLsi, pitchLsi, textColor, surnameOnly }) {
  const name = shortName(entry, { surnameOnly });
  const fullName = [entry.person?.name, entry.person?.surname].filter(Boolean).join(" ") || name || "?";
  const tooltip = [
    fullName,
    entry.positionDetail ? positionLsi[entry.positionDetail] : null,
    entry.goals ? `${pitchLsi.goals}: ${entry.goals}` : null,
    entry.yellowCard ? pitchLsi.yellowCard : null,
    entry.redCard ? pitchLsi.redCard : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const card = (color, offset) => (
    <span
      aria-hidden="true"
      className={Config.Css.css({
        position: "absolute",
        insetBlockStart: -2,
        insetInlineStart: -4 + offset,
        inlineSize: CARD_SIZE.width,
        blockSize: CARD_SIZE.height,
        borderRadius: 2,
        backgroundColor: color,
        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.35)",
      })}
    />
  );

  return (
    <div className={Config.Css.css({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 })}>
      <div className={Config.Css.css({ position: "relative", lineHeight: 0 })}>
        <Uu5Elements.RichIcon
          imageSrc={entry.person?.photoUri ?? undefined}
          text={entry.person?.photoUri ? undefined : initials(entry)}
          size={iconSize}
          borderRadius="full"
          colorScheme="primary"
          significance="highlighted"
          tooltip={tooltip}
          elementAttrs={{ "aria-label": tooltip, role: "img", tabIndex: 0 }}
        />
        {entry.yellowCard ? card(CARD_COLOR.yellow, 0) : null}
        {entry.redCard ? card(CARD_COLOR.red, entry.yellowCard ? 5 : 0) : null}
        {/* Goal: a ball the size of a card in the top right corner, mirroring the cards, and
            the count after it only for two or more goals. The ball's left edge is anchored so
            the count grows outwards, not over the photo. */}
        {entry.goals ? (
          <span
            aria-hidden="true"
            className={Config.Css.css({
              position: "absolute",
              insetBlockStart: -2,
              insetInlineStart: `calc(100% - ${CARD_SIZE.height - 4}px)`,
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: CARD_SIZE.height,
              lineHeight: 1,
              fontWeight: 700,
              whiteSpace: "nowrap",
            })}
          >
            {"⚽"}
            {/* The count reads like the name; the shadow only on it, on the emoji it muddies the ball. */}
            {entry.goals > 1 ? (
              <span className={Config.Css.css(textColor ? { color: textColor, textShadow: NAME_SHADOW } : {})}>{entry.goals}</span>
            ) : null}
          </span>
        ) : null}
      </div>
      <div className={Config.Css.css({ inlineSize: nameWidth, textAlign: "center", lineHeight: `${NAME_HEIGHT}px` })}>
        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="small"
          autoFit
          // Stín jen na trávě, kde jméno stojí na pruzích a lajnách.
          // `nowrap`: `autoFit` zmenšuje jen text, který přetéká; zalomený řádek nepřetéká.
          className={Config.Css.css({
            display: "block",
            whiteSpace: "nowrap",
            fontWeight: 600,
            // White with a shadow on the grass (pitch colour); `Text` would otherwise follow the page mode.
            ...(textColor ? { color: textColor, textShadow: NAME_SHADOW } : null),
          })}
        >
          {name ?? "?"}
        </Uu5Elements.Text>
      </div>
    </div>
  );
}

const LineupPitch = createVisualComponent({
  uu5Tag: Config.TAG + "LineupPitch",

  render({ entryList }) {
    const { ref, width = 0 } = useElementSize();
    const { background } = useAppBackground();
    const positionLsi = useLsi(importLsi, ["enum", "lineupPosition"]);
    const pitchLsi = useLsi(importLsi, ["match", "pitch"]);
    const { placed, substitutes, unplaced } = layoutLineup(entryList);

    const colors = PITCH_COLOR[background === "dark" ? "dark" : "light"];
    const [iconSize] = iconSizeFor(width);
    const nameWidth = Math.max(48, (width * PLAYER_BOX.width) / 100);
    const benchIconSize = ICON_SIZE_LIST[Math.min(ICON_SIZE_LIST.findIndex(([size]) => size === iconSize) + 1, ICON_SIZE_LIST.length - 1)][0];
    const playerProps = { positionLsi, pitchLsi };

    const bench = (titlePath, list) =>
      list.length ? (
        <div>
          <div className={Config.Css.css({ ...Config.theme.typography.eyebrow, fontSize: 11, marginBlockEnd: 8 })}>
            <Lsi import={importLsi} path={titlePath} />
          </div>
          <div className={Config.Css.css({ display: "flex", flexWrap: "wrap", gap: 12 })}>
            {list.map((entry, index) => (
              <Player key={entry.playerId ?? index} entry={entry} iconSize={benchIconSize} nameWidth={80} {...playerProps} />
            ))}
          </div>
        </div>
      ) : null;

    return (
      // Nejvýš 520 px: širší hřiště na tabletu by bylo vyšší než obrazovka.
      <div className={Config.Css.css({ display: "grid", gap: 16, inlineSize: "100%", maxInlineSize: 520, marginInline: "auto" })}>
        <div
          ref={ref}
          className={Config.Css.css({
            position: "relative",
            inlineSize: "100%",
            aspectRatio: "68 / 105",
            borderRadius: 8,
            overflow: "hidden",
          })}
        >
          <PitchDrawing colors={colors} />
          {/* Odznaky na trávě: GDS volí barvy jako na tmavém podkladu. */}
          <BackgroundProvider background="dark">
            {width
              ? placed.map(({ entry, x, y }, index) => (
                  <div
                    key={entry.playerId ?? index}
                    className={Config.Css.css({
                      position: "absolute",
                      insetInlineStart: `${x}%`,
                      insetBlockStart: `${y}%`,
                      // Bod postu je střed kruhu, jméno visí pod ním.
                      transform: `translate(-50%, -${ICON_SIZE_LIST.find(([size]) => size === iconSize)[1] / 2}px)`,
                    })}
                  >
                    <Player
                      entry={entry}
                      iconSize={iconSize}
                      nameWidth={nameWidth}
                      textColor={colors.text}
                      surnameOnly={width < SURNAME_ONLY_BELOW}
                      {...playerProps}
                    />
                  </div>
                ))
              : null}
          </BackgroundProvider>
        </div>
        {bench(["match", "substitutes"], substitutes)}
        {bench(["match", "pitch", "noPosition"], unplaced)}
      </div>
    );
  },
});

export { LineupPitch };
export default LineupPitch;
