import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import TileGrid from "../components/tile-grid.js";
import TileButtons from "../components/tile-buttons.js";
import Header from "../components/header.js";

const ButtonBlock = createVisualComponent({
  uu5Tag: Config.TAG + "ButtonBlock",

  render(props) {
    const { header, itemList, onNavigate, onBack, pending, ...restProps } = props;

    return (
      <Uu5Elements.Block
        {...restProps}
        header={<Header onBack={onBack}>{header}</Header>}
      >
        <TileGrid>
          <TileButtons itemList={itemList} onClick={onNavigate} pending={pending} />
          {itemList.length < 3 && Array.from({ length: 3 - itemList.length }).map((_, index) => <span key={index} />)}
        </TileGrid>
      </Uu5Elements.Block>
    );
  },
});

export default ButtonBlock;
