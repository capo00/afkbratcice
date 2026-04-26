import { createComponent, useState, useUpdateLayoutEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5Extras from "uu5extrasg01";
import Config from "../config/config.js";

function getPaymentValue(amount, iban = "CZ5727000000001387441664") {
  return `SPD*1.0*ACC:${iban}*AM:${amount}*CC:CZK*`;
}

function AmountInput({ itemList, value, onChange }) {
  const [customAmount, setCustomAmount] = useState(() => itemList.includes(value) ? undefined : value);

  useUpdateLayoutEffect(() => {
    itemList.includes(value) ? setCustomAmount(undefined) : setCustomAmount(value);
  }, [value, itemList]);

  return (
    <Uu5Elements.Grid templateColumns={`repeat(${itemList.length + 1}, 1fr)`}>
      {itemList.map((v, index) => (
        <Uu5Elements.Button
          key={index}
          onClick={() => onChange(v)}
          colorScheme={v == value ? "primary" : undefined}
        >
          <Uu5Elements.Number value={v} />
        </Uu5Elements.Button>
      ))}
      <Uu5Forms.Number
        value={customAmount}
        onChange={(e) => setCustomAmount(e.data.value)}
        placeholder="Jiná"
        significance="distinct"
        colorScheme={customAmount == null ? undefined : "primary"}
        alignment="center"
        onBlur={() => customAmount != null && onChange(customAmount)}
      />
    </Uu5Elements.Grid>
  );
}

const QRCodeButton = createComponent({
  uu5Tag: Config.TAG + "QRCodeButton",

  render(props) {
    const { itemList, value, onChange, ...restProps } = props;
    const [open, setOpen] = useState(false);

    return (
      <>
        <Uu5Elements.Button
          icon="uugdsstencil-media-qr-code"
          {...restProps}
          onClick={() => setOpen(true)}
        />
        <Uu5Elements.Modal
          open={open}
          onClose={() => setOpen(false)}
          header={<>Částka: <Uu5Elements.Number value={value} currency="CZK" minDecimalDigits={0} /></>}
          footer={<AmountInput itemList={itemList} value={value} onChange={onChange} />}
        >
          <div className={Config.Css.css({ width: 360, maxWidth: "100%", aspectRatio: 1 })}>
            <Uu5Extras.QRCode
              value={getPaymentValue(value)}
              size="l"
              style={{ display: "block", marginInline: "auto" }}
            />
          </div>
        </Uu5Elements.Modal>
      </>
    );
  },
});

export default QRCodeButton;
