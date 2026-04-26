import { createVisualComponent, useState, useDataList } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import Header from "../components/header.js";
import WeddingOrder from "./wedding-order.js";
import WeddingPayment from "./wedding-payment.js";
import WeddingEdit from "./wedding-edit.js";

const WeddingList = createVisualComponent({
  uu5Tag: Config.TAG + "WeddingList",

  render(props) {
    const { config, onBack } = props;

    const [modalState, setModalState] = useState(null);
    const [editItem, setEditItem] = useState(null);

    const year = new Date().getFullYear();

    const weddingList = useDataList({
      handlerMap: {
        load: () => OcElements.Call.cmdGet("caio-lenavisage/order/list", { product: "wedding", year }),
        create: (dtoIn) => OcElements.Call.cmdPost("caio-lenavisage/order/create", dtoIn),
      },
      itemHandlerMap: {
        update: (dtoIn) => OcElements.Call.cmdPost("caio-lenavisage/order/update", dtoIn),
        delete: (dtoIn) => OcElements.Call.cmdPost("caio-lenavisage/order/delete", dtoIn),
      },
    });

    if (weddingList.state === "pendingNoData") {
      return <Uu5Elements.Pending size="max" />;
    }

    const activeOrders = weddingList.data
      .filter(({ data: o }) => o.wedding?.bride && (!o.total || o.wedding.time > new Date().toISOString()))
      .sort(({ data: a }, { data: b }) => (a.wedding?.time || "").localeCompare(b.wedding?.time || ""));

    function handleClose() {
      setModalState(null);
      setEditItem(null);
    }

    async function handleEditSubmit(dtoIn, order) {
      if (order) {
        await order.handlerMap.update(dtoIn);
      } else {
        await weddingList.handlerMap.create(dtoIn);
      }
      handleClose();
    }

    return (
      <Uu5Elements.Block
        header={<Header onBack={onBack}>{config.name}</Header>}
        actionList={[{
          icon: "mdi-plus",
          tooltip: "Přidat svatbu",
          significance: "highlighted",
          colorScheme: "primary",
          onClick: () => setModalState("create"),
        }]}
      >
        <Uu5Elements.Grid rowGap={8}>
          {activeOrders.map((order) => (
            <WeddingOrder
              key={order.data.id}
              order={order}
              onPayment={() => { setModalState("payment"); setEditItem(order); }}
              onEdit={() => { setModalState("edit"); setEditItem(order); }}
              onDelete={() => order.handlerMap.delete()}
            />
          ))}
        </Uu5Elements.Grid>

        {modalState === "payment" && (
          <WeddingPayment
            key={editItem?.data?.id + "-" + (modalState === "payment")}
            open={modalState === "payment"}
            order={editItem}
            config={config}
            onClose={handleClose}
          />
        )}

        <WeddingEdit
          open={modalState === "create" || modalState === "edit"}
          order={editItem}
          config={config}
          onSubmit={handleEditSubmit}
          onClose={handleClose}
        />
      </Uu5Elements.Block>
    );
  },
});

export default WeddingList;
