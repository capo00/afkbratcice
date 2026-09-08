import { createVisualComponent, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { prepareImage } from "./image.js";

const { theme } = Config;

// Hromadný upload fotek do alba.
//
// **Sekvenčně, ne paralelně** — a ne kvůli šetrnosti k serveru: `gallery/addPhoto` posílá na
// jednu fotku DVĚ binárky (plnou 1600 px a náhled 400 px, protože GCS náhledy negeneruje)
// a request má limit `BINARY_MAX_FILE_SIZE_MB` 25 a `BINARY_MAX_FILES` 20. Padesát fotek
// naráz by narazilo na obojí.
//
// Zmenšení běží **na klientu**: originál z telefonu má 4 MB, do galerie se z něj kouká
// na 1600 px. Nahrát originál by znamenalo platit za přenos, který nikdo neuvidí.

const LSI_PATH = ["admin", "photoUpload"];

const PhotoUpload = createVisualComponent({
  uu5Tag: Config.TAG + "PhotoUpload",

  render({ galleryId, onDone, onClose }) {
    const [fileList, setFileList] = useState([]);
    const [progress, setProgress] = useState(null);
    const [failed, setFailed] = useState([]);

    async function upload() {
      const list = Array.isArray(fileList) ? fileList : [fileList].filter(Boolean);
      if (!list.length) return;

      const problems = [];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setProgress({ index: i + 1, total: list.length, name: file.name });
        try {
          const [full, thumb] = await Promise.all([prepareImage(file, "photo"), prepareImage(file, "thumb")]);
          await UiElements.Call.cmdPost("/gallery/addPhoto", { id: galleryId, file: full, thumb, name: file.name });
        } catch (e) {
          // Jedna vadná fotka nesmí shodit celý dávkový upload — sesbírá se a nahlásí.
          problems.push(file.name);
          console.error("[photoUpload] fotku se nepodařilo nahrát", file.name, e);
        }
      }

      setProgress(null);
      setFailed(problems);
      setFileList([]);
      onDone?.();
    }

    return (
      <Uu5Elements.Grid rowGap={12}>
        <Uu5Forms.File
          multiple
          accept="image/*"
          value={fileList}
          onChange={(e) => setFileList(e.data.value)}
          disabled={!!progress}
        />

        {progress ? (
          <Uu5Elements.Grid rowGap={4}>
            <Uu5Elements.Progress value={(progress.index / progress.total) * 100} />
            <Uu5Elements.Text category="interface" segment="content" type="medium">
              <Lsi
                import={importLsi}
                path={[...LSI_PATH, "progress"]}
                params={{ index: progress.index, total: progress.total, name: progress.name }}
              />
            </Uu5Elements.Text>
          </Uu5Elements.Grid>
        ) : null}

        {failed.length ? (
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({ color: theme.color.destructive })}
          >
            <Lsi import={importLsi} path={[...LSI_PATH, "failed"]} params={{ list: failed.join(", ") }} />
          </Uu5Elements.Text>
        ) : null}

        <div className={Config.Css.css({ display: "flex", gap: 8, justifyContent: "end" })}>
          <Uu5Elements.Button onClick={onClose} disabled={!!progress}>
            <Lsi import={importLsi} path={[...LSI_PATH, "close"]} />
          </Uu5Elements.Button>
          <Uu5Elements.Button
            colorScheme="primary"
            significance="highlighted"
            onClick={upload}
            disabled={!!progress || !fileList?.length}
          >
            <Lsi import={importLsi} path={[...LSI_PATH, "upload"]} />
          </Uu5Elements.Button>
        </div>
      </Uu5Elements.Grid>
    );
  },
});

export default PhotoUpload;
