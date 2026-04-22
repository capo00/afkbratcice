import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import BillTable from "../components/bill-table.js";

function getWeddingServices(config, data) {
  const items = [];
  if (data.wedding?.bride) {
    Object.entries(data.wedding.bride).forEach(([key, price]) => {
      const name = config.bride[key]?.name || key;
      items.push({ key: "bride-" + key, name: `Nevěsta - ${name.toLowerCase()}`, price });
    });
  }
  if (data.wedding?.guestList) {
    const agg = {};
    data.wedding.guestList.forEach((guest) => {
      Object.entries(guest).forEach(([key, price]) => {
        agg[key] = agg[key] || { price, count: 0 };
        agg[key].count++;
      });
    });
    Object.entries(agg).forEach(([key, { price, count }]) => {
      const name = config.guest[key]?.name || key;
      items.push({ key: "guest-" + key, name: `Host - ${name.toLowerCase()} (${count}x)`, price: price * count });
    });
  }
  if (data.wedding?.deposit) {
    items.push({ key: "deposit", name: "Záloha", price: data.wedding.deposit * -1 });
  }
  return items;
}

const WeddingPayment = createVisualComponent({
  uu5Tag: Config.TAG + "WeddingPayment",

  render(props) {
    const { open, order, config, onClose } = props;
    const [deposit, setDeposit] = useState();
    const [total, setTotal] = useState();

    return (
      <Uu5Elements.Modal
        open={open}
        onClose={onClose}
        header={order?.data?.customerName ?? "Platba"}
        footer={order && (
          <Uu5Elements.Grid templateColumns="repeat(5, 1fr)" columnGap={4}>
            {[500, 1000, 1500, 2000].map((price) => (
              <Uu5Elements.Button
                key={price}
                colorScheme="primary"
                disabled={price === order.data.wedding?.deposit}
                onClick={async () => {
                  const dtoIn = {
                    id: order.data.id,
                    wedding: { ...order.data.wedding, deposit: price, depositTime: new Date().toISOString() },
                  };
                  await order.handlerMap.update(dtoIn);
                  onClose();
                }}
              >
                {price}
              </Uu5Elements.Button>
            ))}
            <Uu5Forms.Number.Input
              colorScheme="primary"
              significance="distinct"
              placeholder="Jiná"
              alignment="right"
              width="100%"
              value={deposit}
              onChange={(e) => setDeposit(e.data.value)}
            />

            <Uu5Elements.Grid.Item colSpan={4}>
              {({ style }) => (
                <Uu5Elements.Button
                  colorScheme="pink"
                  significance="highlighted"
                  style={style}
                  onClick={async () => {
                    const dtoIn = {
                      id: order.data.id,
                      wedding: { ...order.data.wedding },
                    };
                    if (deposit) {
                      dtoIn.wedding.deposit = deposit;
                      dtoIn.wedding.depositTime = new Date().toISOString();
                    } else if (total != null) {
                      dtoIn.total = total + (order.data.wedding?.deposit || 0);
                      dtoIn.paydate = new Date().toISOString();
                    } else {
                      dtoIn.total = order.data.subtotal;
                      dtoIn.paydate = new Date().toISOString();
                    }
                    await order.handlerMap.update(dtoIn);
                    onClose();
                  }}
                >
                  {deposit && total == null ?
                    `Záloha ${deposit} Kč` :
                    `Zaplatit (${total ?? order.data.subtotal - (order.data.wedding?.deposit || 0)})`}
                </Uu5Elements.Button>
              )}
            </Uu5Elements.Grid.Item>
            <Uu5Forms.Number.Input
              colorScheme="primary"
              significance="highlighted"
              placeholder="Jiná"
              alignment="right"
              width="100%"
              value={total}
              onChange={(e) => setTotal(e.data.value)}
            />
          </Uu5Elements.Grid>
        )}
      >
        {order && (
          <>
            {order.data.wedding?.time && (
              <div className={Config.Css.css({ marginBottom: 16, textAlign: "end" })}>
                <Uu5Elements.DateTime value={order.data.wedding.time} />
              </div>
            )}
            <BillTable
              data={getWeddingServices(config, order.data)}
              total={order.data.subtotal - (order.data.wedding?.deposit || 0)}
            />
          </>
        )}
      </Uu5Elements.Modal>
    );
  },
});

export default WeddingPayment;
