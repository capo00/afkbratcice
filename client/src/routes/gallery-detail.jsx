import { createVisualComponent, useDataObject, useState, useRoute, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import DateText from "../components/date-text.jsx";
import EmptyState from "../components/empty-state.jsx";

const { theme } = Config;

// Album: mřížka náhledů + lightbox.
//
// Každá fotka jsou **dvě binárky** — plná (`uri`, w1600) a náhled (`thumbUri`, w400),
// protože GCS náhledy negeneruje a zmenšuje se na klientu před uploadem. Mřížka tedy
// stahuje `thumbUri` a plnou verzi až lightbox; při dvaceti fotkách je to rozdíl mezi
// pár stovkami kilobajtů a desítkami megabajtů.
//
// Lightbox je vlastní nad `Uu5Elements.Modal`: uu5 modal umí zobrazit obrázek, ale nemá
// šipky ani klávesy, a album se prochází jinak než se čte dialog.

function Lightbox({ photoList, index, onClose, onIndex }) {
  const photo = photoList[index];

  // Klávesy jsou u prohlížeče fotek povinné — myš je tu jen jedna z cest.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") onIndex((index + 1) % photoList.length);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + photoList.length) % photoList.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photoList.length, onIndex]);

  if (!photo) return null;

  // `width` se modalu **nepředává**: typings `Uu5Elements.Modal` ho nezná (v `index.d.ts`
  // jsou jen `side*` props), takže by se jeho API hádalo — a při `width="auto"` obrázek
  // vylezl mimo panel. Místo toho se přizpůsobí obsah: fotka se vejde do toho, co modal
  // dá na šířku, a do 70 % výšky okna.
  return (
    <Uu5Elements.Modal open onClose={onClose} header={photo.name}>
      <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8 })}>
        <Uu5Elements.Button
          icon="uugds-chevron-left"
          significance="subdued"
          onClick={() => onIndex((index - 1 + photoList.length) % photoList.length)}
          disabled={photoList.length < 2}
        />
        <UiElements.Image
          src={photo.uri}
          alt={photo.name ?? ""}
          className={Config.Css.css({
            // minInlineSize: 0 je kvůli flexu — bez něj se obrázek nesmrskne pod svoji
            // přirozenou šířku a vytlačí šipky ven z panelu.
            minInlineSize: 0,
            maxInlineSize: "100%",
            maxBlockSize: "70vh",
            objectFit: "contain",
          })}
        />
        <Uu5Elements.Button
          icon="uugds-chevron-right"
          significance="subdued"
          onClick={() => onIndex((index + 1) % photoList.length)}
          disabled={photoList.length < 2}
        />
      </div>
      <div className={Config.Css.css({ marginBlockStart: 8, textAlign: "center", color: theme.color.mutedFg })}>
        {index + 1} / {photoList.length}
      </div>
    </Uu5Elements.Modal>
  );
}

const GalleryDetail = createVisualComponent({
  uu5Tag: Config.TAG + "GalleryDetail",

  render() {
    const [route, setRoute] = useRoute();
    const galleryId = route?.params?.id;
    const [openIndex, setOpenIndex] = useState(null);

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

    if (!galleryId || state === "errorNoData") {
      return (
        <Section>
          <EmptyState lsi={lsi("gallery", "missing")} icon="uugds-image" />
        </Section>
      );
    }

    if (state === "pendingNoData") {
      return (
        <Section>
          <Uu5Elements.Skeleton height={320} />
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
            tooltip="Zpět na alba"
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
            <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(180px, 1fr))" rowGap={8} columnGap={8}>
              {photoList.map((photo, index) => (
                // Rám i hover stav dává `Box` s `onClick` — GDS `ground`/`subdued`, tedy
                // tatáž linka jako u karet. `Box` ale vykreslí `<div role="button">`
                // a klávesnici neřeší, takže `tabIndex` i Enter/mezera se dodávají přes
                // `elementAttrs`; bez toho by se album nedalo projít klávesnicí.
                <Uu5Elements.Box
                  key={photo.id}
                  significance="subdued"
                  borderRadius="moderate"
                  onClick={() => setOpenIndex(index)}
                  elementAttrs={{
                    tabIndex: 0,
                    onKeyDown: (e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      setOpenIndex(index);
                    },
                  }}
                  className={Config.Css.css({ padding: 0, overflow: "hidden", lineHeight: 0 })}
                >
                  <UiElements.Image
                    // Náhled, ne plná verze — viz komentář nahoře.
                    src={photo.thumbUri ?? photo.uri}
                    alt={photo.name ?? ""}
                    loading="lazy"
                    className={Config.Css.css({ inlineSize: "100%", aspectRatio: "4 / 3", objectFit: "cover" })}
                  />
                </Uu5Elements.Box>
              ))}
            </Uu5Elements.Grid>
          )}
        </div>

        {openIndex !== null ? (
          <Lightbox photoList={photoList} index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} />
        ) : null}
      </Section>
    );
  },
});

export default GalleryDetail;
