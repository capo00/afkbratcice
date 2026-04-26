import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms, { useFormApi } from "uu5g05-forms";
import Config from "../config/config.js";
import CustomerInput from "./customer-input.js";

function getGuestRow(i, value, config, setGuests) {
  return (
    <Uu5Forms.Checkboxes
      key={i}
      name={"guest-" + (i + 1)}
      label={i + 1 + ". host"}
      itemList={Object.keys(config.guest).map((key) => ({
        value: key,
        children: config.guest[key].name,
      }))}
      value={value}
      onChange={(e) => {
        setGuests((prev) => {
          const next = [...prev];
          next[i] = e.data.value;
          return next;
        });
      }}
    />
  );
}

function computeTotal(config, brideType, guests) {
  let sum = 0;
  if (brideType) sum += config.bride[brideType]?.price || 0;
  if (guests) {
    guests.forEach((items) => {
      if (items) items.forEach((key) => { sum += config.guest[key]?.price || 0; });
    });
  }
  return sum;
}

function OrderSummary({ config, guests }) {
  const formApi = useFormApi();
  const subtotal = computeTotal(config, formApi.value.bride, guests);
  return (
    <Uu5Elements.Text category="interface" segment="title" type="common">
      <Uu5Elements.Number value={subtotal} currency="CZK" maxDecimalDigits={0} />
    </Uu5Elements.Text>
  );
}

const WeddingEdit = createVisualComponent({
  uu5Tag: Config.TAG + "WeddingEdit",

  render(props) {
    const { open, order, config, onSubmit, onClose } = props;
    const isUpdate = !!order;

    const initialGuests = order?.data?.wedding?.guestList?.map((g) => Object.keys(g)) || [];
    const [guests, setGuests] = useState(initialGuests);

    async function handleSubmit(e) {
      const { date, customer, bride, note } = e.data.value;
      const customerNorm = customer && typeof customer === "string" ? { name: customer } : customer;

      const guestList = guests
        .map((items) => {
          if (!items || !items.length) return null;
          const g = {};
          items.forEach((key) => { g[key] = config.guest[key]?.price || 0; });
          return g;
        })
        .filter(Boolean);

      const weddingData = {
        time: date,
        bride: config.bride[bride]?.price ? { [bride]: config.bride[bride]?.price } : undefined,
        guestList: guestList.length ? guestList : undefined,
        deposit: order?.data?.wedding?.deposit,
        depositTime: order?.data?.wedding?.depositTime,
      };

      const subtotal = computeTotal(config, bride, guests);
      const dtoIn = {
        product: "wedding",
        customerId: customerNorm?.id,
        customerName: customerNorm?.name,
        wedding: weddingData,
        note,
        subtotal,
      };

      await onSubmit(dtoIn, order);
    }

    return (
      <Uu5Forms.Form.Provider key={open ? "open" : "closed"} onSubmit={handleSubmit}>
        <Uu5Elements.Modal
          open={open}
          onClose={onClose}
          header={isUpdate ? "Upravit svatbu" : "Vytvořit svatbu"}
          footer={
            <div className={Config.Css.css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            })}>
              <OrderSummary config={config} guests={guests} />
              <Uu5Forms.SubmitButton colorScheme="pink">
                {isUpdate ? "Upravit" : "Vytvořit"}
              </Uu5Forms.SubmitButton>
            </div>
          }
        >
          <Uu5Forms.Form.View className={Config.Css.css({ display: "flex", flexDirection: "column", gap: 16 })}>
            <Uu5Forms.FormDateTime name="date" required label="Datum" initialValue={order?.data?.wedding?.time} />
            <CustomerInput name="customer" placeholder="Zákazník" />
            <Uu5Forms.FormSelect
              name="bride"
              label="Nevěsta"
              itemList={Object.keys(config.bride || {}).map((key) => ({
                value: key,
                children: config.bride[key].name,
              }))}
              initialValue={order?.data?.wedding?.bride ? Object.keys(order.data.wedding.bride)[0] : undefined}
            />
            {guests.map((value, i) => getGuestRow(i, value, config, setGuests))}
            {getGuestRow(guests.length, undefined, config, setGuests)}
            <Uu5Forms.FormTextArea name="note" placeholder="Poznámka" initialValue={order?.data?.note} autoResize />
          </Uu5Forms.Form.View>
        </Uu5Elements.Modal>
      </Uu5Forms.Form.Provider>
    );
  },
});

export default WeddingEdit;
