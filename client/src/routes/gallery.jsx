import { createVisualComponent, useDataObject, useState, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import { usePluralPath } from "../lsi/plural.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import Card from "../components/layout/card.jsx";
import DateText from "../components/date-text.jsx";
import EmptyState from "../components/empty-state.jsx";

const { theme } = Config;

// Seznam fotoalb s filtrem kategorií.
//
// Filtr je řada chipů z předlohy; „Vše" je jeho součást, ne zvláštní stav — jinak by
// první načtení vypadalo, že není vybráno nic.
//
// Dlaždice stojí na `coverThumbUri` a `photoCount`, což jsou **denormalizovaná** pole,
// která album udržuje samo (`gallery/crud.js`). Bez nich by seznam devatenácti alb
// znamenal devatenáct dotazů na fotky.

const ALL = "all";

function GalleryTile({ gallery, onClick }) {
  const photoCount = gallery.photoCount ?? 0;
  // Čeština má u počtu tři tvary — „1 fotka", „3 fotky", „5 fotek".
  const photoCountPath = usePluralPath(["gallery", "photoCount"], photoCount);

  return (
    <Card onClick={onClick}>
      {gallery.coverThumbUri ? (
        <UiElements.Image
          src={gallery.coverThumbUri}
          alt=""
          loading="lazy"
          className={Config.Css.css({
            inlineSize: "100%",
            aspectRatio: "4 / 3",
            objectFit: "cover",
            borderRadius: theme.radius,
            marginBlockEnd: 12,
          })}
        />
      ) : (
        // Album bez titulní fotky je běžný stav (rozpracované), ne chyba — placeholder
        // drží mřížku, aby dlaždice bez fotky nebyla o polovinu nižší.
        <div
          className={Config.Css.css({
            inlineSize: "100%",
            aspectRatio: "4 / 3",
            borderRadius: theme.radius,
            marginBlockEnd: 12,
            backgroundColor: theme.color.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.color.mutedFg,
          })}
        >
          <Uu5Elements.Icon icon="uugds-image" className={Config.Css.css({ fontSize: 28 })} />
        </div>
      )}

      <div className={Config.Css.css({ ...theme.typography.display, fontSize: 18 })}>{gallery.name}</div>
      <div
        className={Config.Css.css({
          marginBlockStart: 4,
          display: "flex",
          gap: 12,
          color: theme.color.mutedFg,
          flexWrap: "wrap",
        })}
      >
        <span>
          <Uu5Elements.Icon icon="uugds-calendar" /> <DateText value={gallery.date} />
        </span>
        <span>
          <Uu5Elements.Icon icon="uugds-image-multi" />{" "}
          <Lsi import={importLsi} path={photoCountPath} params={{ count: photoCount }} />
        </span>
      </div>
    </Card>
  );
}

const Gallery = createVisualComponent({
  uu5Tag: Config.TAG + "Gallery",

  render() {
    const [, setRoute] = useRoute();
    const [category, setCategory] = useState(ALL);

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () => UiElements.Call.cmdGet("/gallery/list", category === ALL ? {} : { category }),
        },
      },
      [category],
    );

    const { state, data } = dataObject;
    const itemList = data?.itemList ?? [];

    return (
      <Section>
        <Heading eyebrow={lsi("gallery", "eyebrow")} lsi={lsi("gallery", "header")} />

        <div className={Config.Css.css({ display: "flex", gap: 8, flexWrap: "wrap", marginBlockStart: 16 })}>
          {[ALL, ...Config.GALLERY_CATEGORY_LIST].map((code) => (
            <Uu5Elements.Button
              key={code}
              size="s"
              colorScheme="primary"
              significance={code === category ? "highlighted" : "subdued"}
              borderRadius="moderate"
              onClick={() => setCategory(code)}
              className={Config.Css.css({
                fontFamily: theme.font.display,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              })}
            >
              {code === ALL ? (
                <Lsi import={importLsi} path={["gallery", "all"]} />
              ) : (
                <Lsi import={importLsi} path={["enum", "galleryCategory", code]} />
              )}
            </Uu5Elements.Button>
          ))}
        </div>

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {state === "pendingNoData" ? (
            <Uu5Elements.Skeleton height={240} />
          ) : itemList.length === 0 ? (
            <EmptyState lsi={lsi("gallery", "empty")} icon="uugds-image" />
          ) : (
            <div
              className={Config.Css.css({
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              })}
            >
              {itemList.map((gallery) => (
                <GalleryTile
                  key={gallery.id}
                  gallery={gallery}
                  onClick={() => setRoute("fotogalerie/album", { id: gallery.id })}
                />
              ))}
            </div>
          )}
        </div>
      </Section>
    );
  },
});

export default Gallery;
