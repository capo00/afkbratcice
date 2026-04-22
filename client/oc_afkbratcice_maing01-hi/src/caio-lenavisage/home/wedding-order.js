import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

function Number({ value, bold, ...restProps }) {
  let result = <Uu5Elements.Number value={value} {...restProps} />;
  if (bold) result = <b>{result}</b>;
  return result;
}

const WeddingOrder = createVisualComponent({
  uu5Tag: Config.TAG + "WeddingOrder",

  render(props) {
    const { order, onPayment, onEdit, onDelete } = props;
    const { data } = order;

    return (
      <Uu5Elements.Tile
        header={data.customerName}
        className={Config.Css.css({ padding: 8 })}
        actionList={[
          {
            colorScheme: "primary",
            significance: "common",
            icon: "mdi-currency-usd",
            onClick: () => onPayment(),
          },
          {
            colorScheme: "primary",
            icon: "mdi-pencil",
            onClick: () => onEdit(),
          },
          {
            colorScheme: "negative",
            icon: "mdi-delete",
            onClick: () => onDelete(),
          },
        ]}
      >
        <div className={Config.Css.css({ display: "grid", gridTemplateColumns: "1fr 1fr" })}>
          <div>
            {(data.total && data.total !== data.subtotal) ||
              data.wedding?.deposit ?
              <><Number value={data.total ?? data.wedding.deposit} bold={data.total > data.subtotal} /> / </> :
              null}
            <Number value={data.subtotal} currency="CZK" maxDecimalDigits={0} bold={(data.total ?? 0) < data.subtotal} />
          </div>
          {data.wedding?.time ? (
            <div className={Config.Css.css({ justifySelf: "end" })}>
              <Uu5Elements.DateTime value={data.wedding.time} />
            </div>
          ) : <div />}
        </div>
      </Uu5Elements.Tile>
    );
  },
});

export default WeddingOrder;
