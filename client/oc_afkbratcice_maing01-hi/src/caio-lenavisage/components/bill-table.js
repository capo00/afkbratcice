import { createComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

const BillTable = createComponent({
  uu5Tag: Config.TAG + "BillTable",

  render(props) {
    const { data, total, ...restProps } = props;
    return (
      <Uu5Elements.Grid {...restProps} rowGap={8} templateColumns="1fr auto">
        {data.map(({ key, name, price }, i) => [
          <span key={(key ?? i) + "-name"}>{name}</span>,
          <span key={(key ?? i) + "-price"} style={{ justifySelf: "end" }}>
            <Uu5Elements.Number value={price} currency="CZK" minDecimalDigits={0} />
          </span>,
        ]).flat()}

        <Uu5Elements.Grid.Item colSpan={2}>
          {({ style }) => <Uu5Elements.Line style={style} />}
        </Uu5Elements.Grid.Item>

        <b>CELKEM</b>
        <b style={{ justifySelf: "end" }}>
          <Uu5Elements.Number value={total} currency="CZK" minDecimalDigits={0} />
        </b>
      </Uu5Elements.Grid>
    );
  },
});

export default BillTable;
