import { createVisualComponent, useDataObject, useRoute, useLsi, Utils, Suspense } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import DateText from "../components/date-text.jsx";
import EmptyState from "../components/empty-state.jsx";
import DataState from "../components/data-state.jsx";
import { usePageTitle } from "../tools/page-meta.js";

const { theme } = Config;

// Album: mřížka náhledů + lightbox.
//
// Každá fotka jsou **dvě binárky** — plná (`uri`, w1600) a náhled (`thumbUri`, w400),
// protože GCS náhledy negeneruje a zmenšuje se na klientu před uploadem. Mřížka tedy
// stahuje `thumbUri` a plnou verzi až lightbox; při dvaceti fotkách je to rozdíl mezi
// pár stovkami kilobajtů a desítkami megabajtů.
//
// Lightbox dává `Uu5Imaging.Image` sám (zoom, celá obrazovka, šipky, procházení alba):
// všechny fotky alba jsou v jednom lokálním lightboxu `lightbox="album"`. Dřív to byl vlastní
// `Modal` se šipkami (review 1.3 B, Caio 2026-11-17).
//
// uu5imagingg01 je těžká knihovna, web ji smí načíst jen líně (lazy-libs.test.js) -- stáhne
// se až s otevřeným albem.
const ImagingImage = Utils.Component.lazy(() =>
  import("uu5imagingg01").then((mod) => ({ default: (mod.default ?? mod).Image })),
);

const GalleryDetail = createVisualComponent({
  uu5Tag: Config.TAG + "GalleryDetail",

  render() {
    const [route, setRoute] = useRoute();
    const backLabel = useLsi(importLsi, ["gallery", "back"]);
    const galleryId = route?.params?.id;

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: async () => {
            const [gallery, photos] = await Promise.all([
              UiElements.Call.cmdGet("/gallery/get", { id: galleryId }),
              UiElements.Call.cmdGet("/gallery/listPhotos", { id: galleryId }),
            ]);
            return { gallery, photoList: photos?.itemList ?? [] };
          },
        },
      },
      [galleryId],
    );

    const { state, data } = dataObject;
    usePageTitle({ title: data?.gallery?.name, description: data?.gallery?.desc });

    if (!galleryId) {
      return (
        <Section>
          <EmptyState lsi={lsi("gallery", "missing")} icon="uugds-image" />
        </Section>
      );
    }

    // 404 -> „neexistuje“, jiná chyba (výpadek) -> „nepodařilo se načíst“ s novým pokusem.
    if (state === "pendingNoData" || state === "errorNoData") {
      return (
        <Section>
          <DataState dataObject={dataObject} height={320} notFound={lsi("gallery", "missing")} notFoundIcon="uugds-image" />
        </Section>
      );
    }

    const { gallery, photoList } = data;

    return (
      <Section>
        <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12, marginBlockEnd: 8 })}>
          <Uu5Elements.Button
            icon="uugds-chevron-left"
            significance="subdued"
            onClick={() => setRoute("fotogalerie")}
            tooltip={backLabel}
          />
          <Heading bar={false}>{gallery?.name ?? "—"}</Heading>
        </div>

        <div className={Config.Css.css({ display: "flex", gap: 12, color: theme.color.mutedFg, flexWrap: "wrap" })}>
          <span>
            <Uu5Elements.Icon icon="uugds-calendar" /> <DateText value={gallery?.date} type="dateLong" />
          </span>
          {gallery?.author ? (
            <span>
              <Uu5Elements.Icon icon="uugds-account" /> {gallery.author}
            </span>
          ) : null}
        </div>

        <div className={Config.Css.css({ marginBlockStart: 24 })}>
          {photoList.length === 0 ? (
            <EmptyState lsi={lsi("gallery", "noPhotos")} icon="uugds-image" />
          ) : (
            <Suspense fallback={<UiElements.Skeleton height={240} />}>
              <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(180px, 1fr))" rowGap={8} columnGap={8}>
                {photoList.map((photo) => (
                  // Mřížka stahuje náhled (`thumbnailSrc`), plnou verzi (`src`) až lightbox
                  // -- viz komentář nahoře.
                  <ImagingImage
                    key={photo.id}
                    src={photo.uri}
                    thumbnailSrc={photo.thumbUri ?? photo.uri}
                    alt={photo.name ?? ""}
                    lightbox="album"
                    width="100%"
                    aspectRatio="4x3"
                    // Náhled je holý `<img>` s lightboxem na kliknutí, klávesnicí se na něj
                    // nedá dostat. `tabIndex` a Enter/mezera to doplní: klik na náhled otevře
                    // lightbox na téže fotce.
                    elementAttrs={{
                      tabIndex: 0,
                      role: "button",
                      onKeyDown: (e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        e.currentTarget.click();
                      },
                    }}
                  />
                ))}
              </Uu5Elements.Grid>
            </Suspense>
          )}
        </div>
      </Section>
    );
  },
});

export default GalleryDetail;
