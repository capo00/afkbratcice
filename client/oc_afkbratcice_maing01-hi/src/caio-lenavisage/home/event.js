import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import Button from "../components/button.js";
import TileGrid from "../components/tile-grid.js";
import Header from "../components/header.js";

const Event = createVisualComponent({
  uu5Tag: Config.TAG + "Event",

  render(props) {
    const { config, order, onSubmit, onBack } = props;
    const items = order.getEventItems();
    const [, refresh] = useState(0);

    return (
      <Uu5Elements.Block
        header={<Header onBack={onBack}>{config.name}</Header>}
      >
        <TileGrid>
          {Object.entries(items).map(([key, label]) => (
            <Button
              key={key}
              active={order.getEventKeys().includes(key)}
              onClick={() => { order.toggleEvent(key); refresh((n) => n + 1); }}
            >
              {label}
            </Button>
          ))}
          {order.getEventKeys().length ? (
            <Uu5Elements.Grid.Item colSpan={3}>
              {({ style }) => (
                <Uu5Elements.Button
                  onClick={onSubmit}
                  size="xl"
                  colorScheme="primary"
                  significance="highlighted"
                  style={style}
                >
                  Souhrn
                </Uu5Elements.Button>
              )}
            </Uu5Elements.Grid.Item>
          ) : null}
        </TileGrid>
      </Uu5Elements.Block>
    );
  },
});

export default Event;
