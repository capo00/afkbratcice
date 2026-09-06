import { createVisualComponent, useDataObject, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { enumItemList } from "../../admin/fields.jsx";

const { theme } = Config;

// Konfigurace aplikace — singleton, ne seznam, takže je to **formulář, ne tabulka**.
//
// Co se odsud opravdu mění: proužek s upozorněním nad stránkou, kontakty v patičce a na
// `/kontakt`, pořadí kategorií v menu a to, u kterých kategorií se **skrývají jména dětí**.
// Poslední jmenované je dnes jen klientský příznak — filtr patří na server (todo.md, 4.3).

const LSI_PATH = ["admin", "config"];

const AdminConfig = createVisualComponent({
  uu5Tag: Config.TAG + "AdminConfig",

  render() {
    const [saved, setSaved] = useState(false);
    const { state, data, handlerMap } = useDataObject({
      handlerMap: {
        load: () => UiElements.Call.cmdGet("/appConfig/get", {}),
        update: (dtoIn) => UiElements.Call.cmdPost("/appConfig/update", dtoIn),
      },
    });

    if (state === "pendingNoData") {
      return (
        <AdminScreen titleLsi={lsi("admin", "menu", "config", "header")}>
          <Uu5Elements.Skeleton height={320} />
        </AdminScreen>
      );
    }

    const contact = data?.contact ?? {};

    async function submit(e) {
      const v = e.data.value;
      await handlerMap.update({
        id: data?.id,
        notice: v.notice ?? "",
        founded: v.founded,
        categoryOrder: v.categoryOrder,
        hideNamesAgeList: v.hideNamesAgeList ?? [],
        contact: {
          address: v.address ?? null,
          email: v.email ?? null,
          phone: v.phone ?? null,
          ico: v.ico ?? null,
          // GPS drží řetězec „49.0759N, 16.4952E" — tak, jak ho člověk zkopíruje z mapy.
          // Rozpad na dvě čísla by znamenal dvě pole navíc a jednu chybu navíc.
          gps: v.gps ?? null,
        },
      });
      setSaved(true);
    }

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "config", "header")}>
        <Uu5Forms.Form.Provider
          onSubmit={submit}
          initialValue={{
            notice: data?.notice ?? "",
            founded: data?.founded ?? 1932,
            categoryOrder: data?.categoryOrder ?? Config.AGE_LIST,
            hideNamesAgeList: data?.hideNamesAgeList ?? [],
            address: contact.address ?? "",
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            ico: contact.ico ?? "",
            gps: contact.gps ?? "",
          }}
        >
          <Uu5Forms.Form.View>
            <div className={Config.Css.css({ display: "grid", gap: 16, maxWidth: 720 })}>
              <Uu5Forms.FormTextArea
                name="notice"
                label={<Lsi import={importLsi} path={["admin", "field", "notice"]} />}
                maxLength={200}
                autoResize
              />
              <Uu5Forms.FormText name="address" label={<Lsi import={importLsi} path={["admin", "field", "address"]} />} />
              <Uu5Forms.FormEmail name="email" label={<Lsi import={importLsi} path={["admin", "field", "email"]} />} />
              <Uu5Forms.FormText name="phone" label={<Lsi import={importLsi} path={["admin", "field", "phone"]} />} />
              <Uu5Forms.FormText name="ico" label={<Lsi import={importLsi} path={["admin", "field", "ico"]} />} />
              <Uu5Forms.FormText
                name="gps"
                label={<Lsi import={importLsi} path={["admin", "field", "gps"]} />}
                placeholder="49.0759N, 16.4952E"
              />
              <Uu5Forms.FormNumber
                name="founded"
                label={<Lsi import={importLsi} path={["admin", "field", "founded"]} />}
                min={1800}
                max={new Date().getFullYear()}
                step={1}
              />
              <Uu5Forms.FormSelect
                name="categoryOrder"
                label={<Lsi import={importLsi} path={[...LSI_PATH, "categoryOrder"]} />}
                itemList={enumItemList("age", Config.AGE_LIST)}
                multiple
              />
              <Uu5Forms.FormCheckboxes
                name="hideNamesAgeList"
                label={<Lsi import={importLsi} path={[...LSI_PATH, "hideNames"]} />}
                itemList={enumItemList("age", Config.AGE_LIST)}
              />

              <div className={Config.Css.css({ display: "flex", gap: 12, alignItems: "center" })}>
                <Uu5Forms.SubmitButton icon="uugds-check" />
                {saved ? (
                  <Uu5Elements.Text
                    category="interface"
                    segment="content"
                    type="medium"
                    className={Config.Css.css({ color: theme.color.mutedFg })}
                  >
                    <Lsi import={importLsi} path={[...LSI_PATH, "saved"]} />
                  </Uu5Elements.Text>
                ) : null}
              </div>
            </div>
          </Uu5Forms.Form.View>
        </Uu5Forms.Form.Provider>
      </AdminScreen>
    );
  },
});

export default AdminConfig;
