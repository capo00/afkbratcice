import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import Button from "../components/button.js";
import TileGrid from "../components/tile-grid.js";
import Header from "../components/header.js";

function ServiceButtons({ isUnit, services, order, onClick }) {
  const buttons = [];
  for (const key in services) {
    const service = services[key];
    const hasUnit = !!service.unit;
    if ((isUnit && hasUnit) || (!isUnit && !hasUnit)) {
      const active = order.hasService(key);
      const activeService = order.getService(key);
      const btnProps = {
        key,
        children: service.name,
        active,
        onClick: () => onClick(key, hasUnit),
      };
      if (isUnit && activeService) {
        btnProps.info = activeService.getQuantity();
      }
      buttons.push(<Button {...btnProps} />);
    }
  }
  return buttons;
}

const ServiceSelect = createVisualComponent({
  uu5Tag: Config.TAG + "ServiceSelect",

  render(props) {
    const { order, onNavigate, onBack, onSubmit } = props;
    const services = order.getServiceItems();
    const activeServices = order.services;

    return (
      <Uu5Elements.Block
        header={<Header onBack={onBack}>Služba</Header>}
      >
        <TileGrid>
          <ServiceButtons services={services} order={order} onClick={onNavigate} />
          <span />
          <ServiceButtons services={services} order={order} onClick={onNavigate} isUnit />

          {activeServices.length ? (
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

export default ServiceSelect;
