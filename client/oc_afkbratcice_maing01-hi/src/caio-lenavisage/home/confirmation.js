import { createVisualComponent, useState, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import UuI18n from "uu_i18ng01";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import CustomerInput from "./customer-input.js";
import Header from "../components/header.js";
import BillTable from "../components/bill-table.js";
import QRCodeButton from "../components/q-r-code-button.js";
import Number from "../components/number.js";

function getRoundedPrice(price) {
  let newPrice = Math.ceil(price / 100) * 100;
  if (price === newPrice) newPrice += 100;
  return newPrice;
}

const Confirmation = createVisualComponent({
  uu5Tag: Config.TAG + "Confirmation",

  render(props) {
    const { order, onConfirm, onBack } = props;
    const services = order.listDisplayServices();
    const subtotal = order.getSubtotal();
    const totalProposal = getRoundedPrice(subtotal);

    const [total, setTotal] = useState(subtotal);
    const isCustom = total !== subtotal && total !== totalProposal;

    const itemList = useMemo(() => [subtotal, totalProposal], [subtotal, totalProposal]);

    return (
      <Uu5Elements.Block
        header={<Header onBack={onBack}>{order.getTitle()}</Header>}
      >
        <Uu5Forms.Form
          onSubmit={async (e) => {
            let { customer, paydate, note } = e.data.value;
            if (customer && typeof customer === "string") customer = { name: customer };
            order.setCustomer(customer);
            order.setNote(note);
            order.setTotal(total);

            const dtoIn = order.buildDtoIn();
            const now = new Date().toISOString();
            dtoIn.paydate = paydate ? paydate + "T" + now.split("T")[1] : now;
            await OcElements.Call.cmdPost("caio-lenavisage/order/create", dtoIn);
            onConfirm(order);
          }}
          gridLayout="bill, paydate, customer, note, buttons1, buttons2"
        >
          <BillTable
            data={services}
            total={subtotal}
            className={Config.Css.css({ gridArea: "bill", paddingInline: 8 })}
          />

          <Uu5Forms.FormDate name="paydate" initialValue={new UuI18n.UuDate().toIsoString()} required />
          <CustomerInput name="customer" placeholder="Zákazník" />
          <Uu5Forms.FormTextArea name="note" placeholder="Poznámka" autoResize />

          <Uu5Elements.Grid templateColumns="1fr 1fr" className={Config.Css.css({ gridArea: "buttons1" })}>
            <Uu5Elements.Button
              onClick={() => setTotal(totalProposal === total ? subtotal : totalProposal)}
              {...(total === totalProposal ? { colorScheme: "primary" } : null)}
            >
              <Uu5Elements.Number
                value={totalProposal}
                currency="CZK"
                minDecimalDigits={0}
              />
            </Uu5Elements.Button>
            <Number
              value={isCustom ? total : undefined}
              significance="distinct"
              placeholder="Jiná"
              suffix="Kč"
              alignment="center"
              onBlur={(e) => setTotal(e.data.value ?? subtotal)}
              {...(isCustom ? { colorScheme: "primary" } : null)}
            />
          </Uu5Elements.Grid>
          <Uu5Elements.Grid templateColumns="1fr auto" className={Config.Css.css({ gridArea: "buttons2" })}>
            <Uu5Forms.SubmitButton>
              Zaplatit <Uu5Elements.Number value={total} currency="CZK" minDecimalDigits={0} />
            </Uu5Forms.SubmitButton>
            <QRCodeButton itemList={itemList} value={total} onChange={(v) => setTotal(v ?? subtotal)} />
          </Uu5Elements.Grid>
        </Uu5Forms.Form>
      </Uu5Elements.Block>
    );
  },
});

export default Confirmation;
