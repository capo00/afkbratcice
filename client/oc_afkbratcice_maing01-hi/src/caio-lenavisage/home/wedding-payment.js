import { createVisualComponent, useState, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import BillTable from "../components/bill-table.js";
import QRCodeButton from "../components/q-r-code-button.js";
import Number from "../components/number.js";

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

const DEPOSIT_AMOUNT_LIST = [1000, 1500, 2000];

const WeddingPayment = createVisualComponent({
  uu5Tag: Config.TAG + "WeddingPayment",

  render(props) {
    const { open, order, config, onClose } = props;
    const [deposit, setDeposit] = useState();
    const [customTotal, setCustomTotal] = useState();
    if (deposit && customTotal) setCustomTotal(undefined);

    const isCustomDeposit = deposit && !DEPOSIT_AMOUNT_LIST.includes(deposit);
    const total = order.data.subtotal - (order.data.wedding?.deposit || 0);

    const itemList = useMemo(() => [total], [total]);

    return (
      <Uu5Elements.Modal
        open={open}
        onClose={onClose}
        header={order?.data?.customerName ?? "Platba"}
        footer={order && (
          <Uu5Elements.Grid templateColumns="repeat(4, 1fr) auto" columnGap={4}>
            {DEPOSIT_AMOUNT_LIST.map((price) => (
              <Uu5Elements.Button
                key={price}
                disabled={price === order.data.wedding.deposit}
                onClick={() => setDeposit(price === deposit ? undefined : price)}
                {...(price === deposit ? { colorScheme: "primary" } : null)}
              >
                <Uu5Elements.Number value={price} />
              </Uu5Elements.Button>
            ))}
            <Number
              value={isCustomDeposit ? deposit : undefined}
              significance="distinct"
              placeholder="Jiná"
              alignment="center"
              onBlur={(e) => setDeposit(e.data.value)}
              {...(isCustomDeposit ? { colorScheme: "primary" } : null)}
            />
            <QRCodeButton
              itemList={DEPOSIT_AMOUNT_LIST}
              value={deposit}
              onChange={(v) => setDeposit(v)}
              disabled={!deposit}
            />

            <Uu5Elements.Grid.Item colSpan={3}>
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
                    } else if (customTotal != null) {
                      dtoIn.total = customTotal + (order.data.wedding.deposit || 0);
                      dtoIn.paydate = new Date().toISOString();
                    } else {
                      dtoIn.total = order.data.subtotal;
                      dtoIn.paydate = new Date().toISOString();
                    }
                    await order.handlerMap.update(dtoIn);
                    onClose();
                  }}
                >
                  {deposit ?
                    <>{order.data.wedding.deposit ? "Změna zálohy" : "Záloha"} <Uu5Elements.Number value={deposit} currency="CZK" minDecimalDigits={0} /></> :
                    <>Zaplatit <Uu5Elements.Number value={customTotal ?? total} currency="CZK" minDecimalDigits={0} /></>}
                </Uu5Elements.Button>
              )}
            </Uu5Elements.Grid.Item>
            <Number
              value={customTotal}
              significance="distinct"
              placeholder="Jiná"
              alignment="center"
              onBlur={(e) => setCustomTotal(e.data.value === order.data.subtotal ? undefined : e.data.value)}
              {...(customTotal ? { colorScheme: "primary" } : null)}
              disabled={!!deposit}
            />
            <QRCodeButton
              itemList={itemList}
              value={customTotal ?? total}
              onChange={(v) => setCustomTotal(v === total ? undefined : v)}
              disabled={!!deposit}
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
              total={total}
            />
          </>
        )}
      </Uu5Elements.Modal>
    );
  },
});

export default WeddingPayment;
