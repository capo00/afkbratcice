import { createVisualComponent, Lsi, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import OcElements from "../../libs/oc_cli-elements";
import OcAuth from "../../libs/oc_cli-auth";
import Config from "../config/config.js";
import { withRoute } from "../../libs/oc_cli-app";
import { OrderListProvider } from "./order-context.js";

const TYPE_MAP = {
  regular: "Běžná",
  wedding: "Svatba",
};

const CRUD_CONFIG = {
  customerName: {
    label: { cs: "Zákazník" },
    sort: true,
  },
  type: {
    label: { cs: "Typ" },
    sort: true,
    output: (value) => TYPE_MAP[value] || value,
  },
  date: {
    label: { cs: "Datum" },
    sort: true,
    output: (value) => value ? <Uu5Elements.DateTime value={value} timeFormat="none" /> : null,
  },
  totalPrice: {
    label: { cs: "Celkem" },
    sort: true,
    output: (value) => value != null ? `${value} Kč` : "–",
  },
  note: {
    label: { cs: "Poznámka" },
    visible: false,
  },
};

const { seriesList, columnList, sorterList } = OcElements.Crud.generate(CRUD_CONFIG);

let OrderList = createVisualComponent({
  uu5Tag: Config.TAG + "OrderList",

  render(props) {
    const session = OcAuth.useSession();
    const isAuth = session.identity?.profileList?.includes("authorities");
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);

    return (
      <OrderListProvider dtoIn={{ year }}>
        {(dataList) => (
          <>
            <Uu5Elements.Block
              header={<Lsi lsi={{ cs: "Objednávky" }} />}
              headerType="title"
            >
              <div className={Config.Css.css({ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 })}>
                <Uu5Forms.Number
                  value={year}
                  onChange={(e) => setYear(e.data.value)}
                  min={2020}
                  max={currentYear + 1}
                  label={{ cs: "Rok" }}
                  className={Config.Css.css({ width: 120 })}
                />
                <Uu5Elements.Button
                  icon="uugds-plus"
                  significance="highlighted"
                  colorScheme="primary"
                  onClick={() => {
                    const [, setRoute] = window.__uu5Route || [];
                    if (setRoute) setRoute("caio-lenavisage/order", { create: true });
                    else window.location.hash = "caio-lenavisage/order?create=true";
                  }}
                >
                  <Lsi lsi={{ cs: "Nová objednávka" }} />
                </Uu5Elements.Button>
              </div>
            </Uu5Elements.Block>
            <OcElements.Crud
              {...props}
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              initialSorterList={[{ key: "date", ascending: false }]}
              readOnly={!isAuth}
            />
          </>
        )}
      </OrderListProvider>
    );
  },
});

OrderList = withRoute(OrderList, { profileList: ["authorities", "operatives"] });

export { OrderList };
export default OrderList;
