import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import CustomerInput from "./customer-input.js";
import Header from "../components/header.js";
import BillTable from "../components/bill-table.js";

const Confirmation = createVisualComponent({
  uu5Tag: Config.TAG + "Confirmation",

  render(props) {
    const { order, onConfirm, onBack } = props;
    const services = order.listDisplayServices();
    const subtotal = order.getSubtotal();
    const total = Math.ceil(subtotal / 100) * 100

    return (
      <Uu5Elements.Block
        header={<Header onBack={onBack}>{order.getTitle()}</Header>}
      >
        <Uu5Forms.Form
          onSubmit={async (e) => {
            let { customer, note, total } = e.data.value;
            if (customer && typeof customer === "string") customer = { name: customer };
            order.setCustomer(customer);
            order.setNote(note);
            if (total != null) order.setTotal(total);

            const dtoIn = order.buildDtoIn();
            await OcElements.Call.cmdPost("caio-lenavisage/order/create", dtoIn);
            onConfirm(order);
          }}
          className={Config.Css.css({ display: "grid", gap: 16 })}
        >
          <BillTable data={services} total={subtotal} className={Config.Css.css({ paddingInline: 8 })} />
          <CustomerInput name="customer" placeholder="Zákazník" />
          <Uu5Forms.FormTextArea name="note" placeholder="Poznámka" autoResize />
          <Uu5Elements.Grid templateColumns="1fr 1fr">
            <Uu5Forms.SubmitButton size="xl" significance="common" onClick={() => order.setTotal(total)}>
              <Uu5Elements.Number
                value={total}
                currency="CZK"
                minDecimalDigits={0}
              />
            </Uu5Forms.SubmitButton>
            <Uu5Forms.FormNumber
              name="total" 
              colorScheme="primary" 
              significance="distinct" 
              size="xl" 
              placeholder="Jiná" 
              suffix="Kč"
              alignment="right"
            />
          </Uu5Elements.Grid>
          <Uu5Forms.SubmitButton size="xl" width="100%" onClick={() => order.setTotal(subtotal)}>
            Potvrdit
          </Uu5Forms.SubmitButton>
        </Uu5Forms.Form>
      </Uu5Elements.Block>
    );
  },
});

export default Confirmation;
