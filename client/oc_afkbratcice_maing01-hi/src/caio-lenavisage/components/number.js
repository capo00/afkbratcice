import { createComponent, Utils, useState, useUpdateLayoutEffect } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";

const Number = createComponent({
  uu5Tag: Config.TAG + "Number",

  render(props) {
    const { value, onBlur, ...restProps } = props;
    const [v, setV] = useState(value);

    useUpdateLayoutEffect(() => {
      setV(value);
    }, [value]);

    return (
      <Uu5Forms.Number
        {...restProps}
        value={v}
        onChange={(e) => setV(e.data.value)}
        onBlur={onBlur ? (e) => onBlur(new Utils.Event({ value: v }, e)) : undefined}
      />
    );
  },
});

export default Number;
