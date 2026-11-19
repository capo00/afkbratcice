import { createVisualComponent, useState, useRef, useEffect, useScreenSize } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import DisplayText from "../layout/display-text.jsx";
import Heading from "../layout/heading.jsx";
import Button from "../layout/button.jsx";
import { RouteLink } from "../route-link.jsx";
import { formatHistoryDate } from "./history-date.js";

const { theme } = Config;

// Jedna položka časové osy historie: datum, titulek, shrnutí a „Podrobnosti“ na rozkliknutí
// (návrh designera 2026-11-19; data a jejich tvar v `content/history.js`).
//
// Co plyne z `Uu5Extras.VerticalTimeline` (uu5extrasg01 1.9) a ovlivňuje tuhle komponentu:
// - **Datum je v obsahu, ne v `label`**: ten knihovna v jednom sloupci kreslí až pod textem.
// - **Uvnitř žádné `<p>` ani `<h2>`**: CSS knihovny na ně sahá s vyšší specificitou než třída
//   z `Uu5Elements.Text` (13 px na mobilu, váha 500, okraje). Text je v `span`/`div`, titulek `h3`.
// - **Rozklik je tlačítko**, ne `onClick` položky: ten sedí na `div` bez role a klávesnice.
// - Položka má od osy červené popředí (`primary`), proto kořen vrací barvu textu na `fg`.
//
// Sbalený panel zůstává v DOM s `hidden="until-found"` (vyhledávač ho přečte, Ctrl+F v Chromiu
// ho najde a událost `beforematch` ho otevře). Atribut se nastavuje ručně: React z `hidden`
// dělá boolean.

function DateLabel({ date }) {
  const { parts, separator } = formatHistoryDate(date);
  return parts.map((part, i) => [
    i > 0 && separator,
    part.dateTime ? (
      <time key={i} dateTime={part.dateTime}>
        {part.text}
      </time>
    ) : (
      part.text
    ),
  ]);
}

// Rozbalení a sbalení panelu animuje výšku jako `Uu5Elements.CollapsibleBox` (300 ms, ease-out).
// CollapsibleBox sám se nepoužívá: sbalený obsah nevykreslí vůbec (`alreadyExpanded`), takže by ho
// nenašel vyhledávač ani Ctrl+F. Tady panel zůstává v DOM s `hidden="until-found"` a animace jde
// přes Web Animations API, bez stavu v CSS. Kdo má v systému omezený pohyb, nedostane ji.
const COLLAPSE_DURATION = 300;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function collapseAnimation(panel, [from, to]) {
  return panel.animate(
    [
      { height: `${from}px`, overflow: "hidden" },
      { height: `${to}px`, overflow: "hidden" },
    ],
    { duration: COLLAPSE_DURATION, easing: "ease-out", fill: to === 0 ? "forwards" : "none" },
  );
}

// Odkaz jako v textu stránek (`Prose`: `& a` = redText); `building` na podkladu splýval s textem.
const LINK_CLASS = Config.Css.css({ color: `${theme.color.redText} !important`, justifySelf: "start" });

function Facts({ facts }) {
  return facts.map(({ caption, items }, i) => (
    <Uu5Elements.Grid key={i} rowGap={4}>
      {caption && (
        <Uu5Elements.Text category="interface" segment="content" type="medium" bold>
          {caption}
        </Uu5Elements.Text>
      )}
      <Uu5Elements.InfoGroup
        direction="horizontal"
        itemList={items.map(({ label, value }) => ({ title: value, subtitle: label }))}
      />
    </Uu5Elements.Grid>
  ));
}

function Links({ links }) {
  return (
    <Uu5Elements.Grid rowGap={4}>
      {links.map((link) =>
        link.anchor ? (
          <Uu5Elements.Link key={link.label} href={`#milnik-${link.anchor}`} className={LINK_CLASS}>
            {link.label}
          </Uu5Elements.Link>
        ) : (
          <RouteLink key={link.label} route={link.route} params={link.params} className={LINK_CLASS}>
            {link.label}
          </RouteLink>
        ),
      )}
    </Uu5Elements.Grid>
  );
}

const TimelineItem = createVisualComponent({
  uu5Tag: Config.TAG + "TimelineItem",

  render({ item }) {
    const { id, date, title, summary, detail = [], facts = [], links = [] } = item;
    const hasDetail = detail.length > 0 || facts.length > 0 || links.length > 0;
    const anchor = `milnik-${id}`;
    // Odkaz s kotvou (`/historie#milnik-1948-ltc`, odkaz z jiné položky) položku rovnou otevře.
    const [open, setOpen] = useState(() => typeof location !== "undefined" && location.hash === `#${anchor}`);
    const [screenSize] = useScreenSize();
    const panelRef = useRef();
    const panelId = `${anchor}-detail`;
    const dateId = `${anchor}-datum`;
    const titleId = `${anchor}-titulek`;

    // Bez animace: první vykreslení a otevření z Ctrl+F (prohlížeč panel ukázal sám a posouvá
    // na nalezený text -- animace by mu ho posunula pod rukou).
    const firstRunRef = useRef(true);
    const fromMatchRef = useRef(false);

    useEffect(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const onMatch = () => {
        fromMatchRef.current = true;
        setOpen(true);
      };
      panel.addEventListener("beforematch", onMatch);
      return () => panel.removeEventListener("beforematch", onMatch);
    }, []);

    useEffect(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const animate = !firstRunRef.current && !fromMatchRef.current && !prefersReducedMotion();
      firstRunRef.current = false;
      fromMatchRef.current = false;
      // Rychlé dvojí kliknutí: rozběhnutá animace se zahodí a začne se od aktuálního stavu.
      panel.getAnimations?.().forEach((animation) => animation.cancel());

      if (open) {
        panel.removeAttribute("hidden");
        if (animate) collapseAnimation(panel, [0, panel.scrollHeight]);
        return;
      }
      if (!animate) {
        panel.setAttribute("hidden", "until-found");
        return;
      }
      const animation = collapseAnimation(panel, [panel.scrollHeight, 0]);
      let done = false;
      const hide = () => {
        if (done) return;
        done = true;
        panel.setAttribute("hidden", "until-found");
        // `fill: forwards` drží výšku 0 až do skrytí, jinak by panel na jeden snímek bliknul.
        animation.cancel();
      };
      animation.onfinish = hide;
      // Pojistka: `finish` se vyvolá až při vykreslení snímku. Ve skryté kartě by sbalený panel
      // zůstal bez `hidden` (a čtečka by ho dál četla), dokud se karta neukáže.
      const timer = setTimeout(hide, COLLAPSE_DURATION + 50);
      return () => {
        // Další klik před koncem: tahle animace už panel skrývat nesmí.
        done = true;
        clearTimeout(timer);
      };
    }, [open]);

    useEffect(() => {
      const onHash = () => location.hash === `#${anchor}` && setOpen(true);
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }, [anchor]);

    return (
      <article id={anchor} aria-labelledby={`${dateId} ${titleId}`} className={Config.Css.css({ color: theme.color.fg })}>
        <Uu5Elements.Grid rowGap={8}>
          <Uu5Elements.Grid rowGap={4}>
            <DisplayText
              as="div"
              id={dateId}
              category="interface"
              segment="title"
              type="common"
              className={Config.Css.css({ color: theme.color.redText })}
            >
              <DateLabel date={date} />
            </DisplayText>
            <Heading level={3} id={titleId}>
              {title}
            </Heading>
          </Uu5Elements.Grid>

          <Uu5Elements.Text category="interface" segment="content" type="large">
            {summary}
          </Uu5Elements.Text>

          {hasDetail && (
            <div>
              <Button
                significance="subdued"
                size={screenSize === "xs" ? "l" : "m"}
                iconRight={open ? "uugds-chevron-up" : "uugds-chevron-down"}
                onClick={() => setOpen((value) => !value)}
                elementAttrs={{ "aria-expanded": open, "aria-controls": panelId }}
                lsi={lsi("history", "more")}
              />
            </div>
          )}

          {hasDetail && (
            <div id={panelId} ref={panelRef}>
              <Uu5Elements.Grid rowGap={16}>
                <Uu5Elements.Line colorScheme="building" significance="subdued" />
                {detail.length > 0 && (
                  <Uu5Elements.Grid rowGap={8}>
                    {detail.map((text, i) => (
                      <Uu5Elements.Text key={i} category="interface" segment="content" type="medium">
                        {text}
                      </Uu5Elements.Text>
                    ))}
                  </Uu5Elements.Grid>
                )}
                {facts.length > 0 && <Facts facts={facts} />}
                {links.length > 0 && <Links links={links} />}
              </Uu5Elements.Grid>
            </div>
          )}
        </Uu5Elements.Grid>
      </article>
    );
  },
});

export default TimelineItem;
