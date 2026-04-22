import { createComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

const TileGrid = createComponent({
  uu5Tag: Config.TAG + "TileGrid",

  render(props) {
    const { columnCount = 3, children } = props;

    return (
      <Uu5Elements.Grid
        templateColumns={`repeat(${columnCount}, 1fr)`}
        rowGap={8}
        columnGap={8}
        justifyContent="start"
      >
        {children}
      </Uu5Elements.Grid>
    );
  },
});

export default TileGrid;
