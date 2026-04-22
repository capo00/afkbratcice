import { createVisualComponent, Lsi, useState, useEffect, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import OcElements from "../../libs/oc_cli-elements";
import Config from "../config/config.js";
import { withRoute } from "../../libs/oc_cli-app";

const TYPE_ITEM_LIST = [
  { value: "regular", children: "Běžná" },
  { value: "wedding", children: "Svatba" },
];

const OrderCreate = createVisualComponent({
  uu5Tag: Config.TAG + "OrderCreate",

  render() {
    const [, setRoute] = useRoute();
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
      OcElements.Call.cmdGet("caio-lenavisage/product/list", { active: true }).then((res) => {
        setProducts(res.itemList || []);
      });
      OcElements.Call.cmdGet("caio-lenavisage/customer/list").then((res) => {
        setCustomers(res.itemList || []);
      });
    }, []);

    const productItemList = products.map((p) => ({
      value: p.id,
      children: `${p.name} (${p.price} Kč)`,
      product: p,
    }));

    const customerItemList = customers.map((c) => ({
      value: c.id,
      children: c.name,
    }));

    async function handleSubmit(e) {
      const { value } = e.data;

      const items = (value.items || []).map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name || "",
          quantity: item.quantity || 1,
          unitPrice: product?.price || 0,
        };
      });

      const customer = customers.find((c) => c.id === value.customerId);

      const dtoIn = {
        type: value.type || "regular",
        customerId: value.customerId || null,
        customerName: customer?.name || value.customerName || null,
        date: value.date || new Date().toISOString().slice(0, 10),
        items,
        note: value.note || null,
      };

      if (value.type === "wedding") {
        dtoIn.weddingDate = value.weddingDate || null;
        dtoIn.deposit = value.deposit || null;
        dtoIn.depositDate = value.depositDate || null;
        dtoIn.payDate = value.payDate || null;
      }

      await OcElements.Call.cmdPost("caio-lenavisage/order/create", dtoIn);
      setRoute("caio-lenavisage/order");
    }

    return (
      <Uu5Elements.Block
        header={<Lsi lsi={{ cs: "Nová objednávka" }} />}
        headerType="heading"
        level={2}
        className={Config.Css.css({ maxWidth: 800, margin: "0 auto" })}
      >
        <Uu5Forms.Form onSubmit={handleSubmit}>
          <Uu5Forms.Form.View gridLayout={{
            xs: "type, customerId, customerName, date, note, weddingDate, deposit, depositDate, payDate",
            s: "type date, customerId customerName, note note, weddingDate deposit, depositDate payDate",
          }}>
            <Uu5Forms.FormSelect name="type" label={{ cs: "Typ" }} itemList={TYPE_ITEM_LIST} initialValue="regular" required />
            <Uu5Forms.FormSelect name="customerId" label={{ cs: "Zákazník" }} itemList={customerItemList} />
            <Uu5Forms.FormText name="customerName" label={{ cs: "Jméno zákazníka" }} />
            <Uu5Forms.FormDate name="date" label={{ cs: "Datum" }} />
            <Uu5Forms.FormTextArea name="note" label={{ cs: "Poznámka" }} />
            <Uu5Forms.FormDate name="weddingDate" label={{ cs: "Datum svatby" }} />
            <Uu5Forms.FormNumber name="deposit" label={{ cs: "Záloha (Kč)" }} min={0} />
            <Uu5Forms.FormDate name="depositDate" label={{ cs: "Datum zálohy" }} />
            <Uu5Forms.FormDate name="payDate" label={{ cs: "Datum platby" }} />
          </Uu5Forms.Form.View>

          <Uu5Elements.Block
            header={<Lsi lsi={{ cs: "Položky" }} />}
            headerType="heading"
            level={4}
            className={Config.Css.css({ marginTop: 24 })}
          >
            <Uu5Forms.FormList
              name="items"
              label={{ cs: "Produkty" }}
              itemComponent={({ value, onChange }) => (
                <div className={Config.Css.css({ display: "flex", gap: 8, alignItems: "end", marginBottom: 8 })}>
                  <Uu5Forms.Select
                    value={value?.productId}
                    onChange={(e) => onChange({ ...value, productId: e.data.value })}
                    itemList={productItemList}
                    label={{ cs: "Produkt" }}
                    className={Config.Css.css({ flex: 2 })}
                  />
                  <Uu5Forms.Number
                    value={value?.quantity || 1}
                    onChange={(e) => onChange({ ...value, quantity: e.data.value })}
                    min={1}
                    label={{ cs: "Ks" }}
                    className={Config.Css.css({ width: 80 })}
                  />
                </div>
              )}
            />
          </Uu5Elements.Block>

          <div className={Config.Css.css({ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 })}>
            <Uu5Elements.Button onClick={() => setRoute("caio-lenavisage/order")}>
              <Lsi lsi={{ cs: "Zrušit" }} />
            </Uu5Elements.Button>
            <Uu5Forms.SubmitButton>
              <Lsi lsi={{ cs: "Uložit" }} />
            </Uu5Forms.SubmitButton>
          </div>
        </Uu5Forms.Form>
      </Uu5Elements.Block>
    );
  },
});

export { OrderCreate };
export default withRoute(OrderCreate);
