import { createVisualComponent, useState, useRoute, useDataObject } from "uu5g05";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { withRoute } from "../../libs/oc_cli-app";
import Order from "../model/order.js";
import ServiceSelect from "./service-select.js";
import Event from "./event.js";
import Confirmation from "./confirmation.js";
import WeddingList from "./wedding-list.js";
import ButtonBlock from "./button-block.js";

let Wizard = createVisualComponent({
  uu5Tag: Config.TAG + "Wizard",

  render() {
    const [route, setRoute] = useRoute();
    const params = route?.params || {};
    const uu5Route = route?.uu5Route?.replace?.(/\/$/, "");

    const [order, setOrder] = useState(null);
    const [, refresh] = useState(0);

    const configDto = useDataObject({
      handlerMap: {
        load: async () => {
          const data = await OcElements.Call.cmdGet("caio-lenavisage/product/list");
          const config = {};
          data.itemList.forEach((doc) => { config[doc.type] = doc; });
          setOrder(new Order(config));
          return config;
        }
      }
    });

    const config = configDto.data;
    if (config && !order) {
      const renewOrder = new Order(config);
      if (params.product) renewOrder.setProduct(params.product);
      if (params.category) renewOrder.setCategory(params.category);
      if (params.type) renewOrder.setHairType(params.type);
      if (params.material) renewOrder.setMaterial(params.material);
      if (params.wedding) renewOrder.setWedding(params.wedding);
      if (params.event) renewOrder.setEvent(params.event);
      if (params.eyelash) renewOrder.setEyelash(params.eyelash);
      setOrder(renewOrder);
    }

    function navigate(addParams) {
      setRoute(uu5Route, { ...params, ...addParams });
    }

    function goBack(removeKeys) {
      const newParams = { ...params };
      removeKeys.forEach((k) => delete newParams[k]);
      setRoute(uu5Route, Object.keys(newParams).length ? newParams : undefined);
    }

    function resetOrder() {
      setOrder(new Order(config));
      setRoute(uu5Route);
    }

    const product = order ? params.product : null;

    switch (product) {
      case "hair":
        const category = params.category;
        const type = params.type;
        const materialKey = params.material;

        // Step 1: category
        if (!category) {
          return (
            <ButtonBlock
              header="Kategorie"
              itemList={order.getCategoryItemList()}
              onNavigate={(category) => {
                order.setProduct("hair").setCategory(category);
                if (category === "man") {
                  navigate({ category, type: "_" });
                } else {
                  navigate({ category });
                }
              }}
              onBack={() => {
                order.setCategory(null);
                goBack(["product"]);
              }}
            />
          );
        } else if (!order.getCategory()) {
          order.setCategory(category);
        }

        // Step 2: hair type (skip for man)
        if (!type) {
          return (
            <ButtonBlock
              header={config.hair.name}
              itemList={order.getHairTypeItemList()}
              onNavigate={(type) => {
                order.setHairType(type);
                navigate({ type });
              }}
              onBack={() => {
                order.setCategory(null).clearServices();
                goBack(["category"]);
              }}
            />
          );
        } else if (!order.getHairType()) {
          order.setHairType(type);
        }

        // Step 3a: quantity for material service
        if (materialKey) {
          const service = order.getService(materialKey);
          if (service) {
            return (
              <ButtonBlock
                header={`Počet odměrek (${service.unit}ml)`}
                itemList={service.getQuantityItemList()}
                onNavigate={(qty) => {
                  service.setQuantity(+qty);
                  refresh((n) => n + 1);
                  goBack(["material"]);
                }}
                onBack={() => {
                  order.removeService(materialKey);
                  refresh((n) => n - 1);
                  goBack(["material"]);
                }}
              />
            );
          }
        }

        // Step 3b: confirmation
        if (params.confirm) {
          return (
            <Confirmation
              order={order}
              onConfirm={resetOrder}
              onBack={() => goBack(["confirm"])}
            />
          );
        }

        // Step 3: service selection
        if (category !== "man") order.setHairType(type);

        return (
          <ServiceSelect
            config={config.hair}
            order={order}
            onNavigate={(serviceKey, isUnit) => {
              if (order.hasService(serviceKey)) {
                order.removeService(serviceKey);
                refresh((n) => n + 1);
              } else {
                order.addService(serviceKey);
                if (isUnit) {
                  navigate({ material: serviceKey });
                } else {
                  refresh((n) => n + 1);
                }
              }
            }}
            onSubmit={() => navigate({ confirm: "1" })}
            onBack={() => {
              order.clearServices();
              if (category === "man") {
                order.setCategory(null);
                goBack(["category", "type"]);
              } else {
                order.setHairType(null);
                goBack(["type"]);
              }
            }}
          />
        );
      case "wedding":
        return (
          <WeddingList
            config={config.wedding}
            order={order}
            onBack={() => goBack(["product"])}
          />
        );
      case "event":
        if (params.confirm) {
          return (
            <Confirmation
              order={order}
              onConfirm={resetOrder}
              onBack={() => goBack(["confirm"])}
            />
          );
        }
        return (
          <Event
            config={config.event}
            order={order}
            onSubmit={() => {
              order.setProduct("event");
              navigate({ confirm: "1" });
            }}
            onBack={() => { order.eventKeys.length = 0; goBack(["product"]); }}
          />
        );
      case "eyelash":
        if (params.confirm) {
          return (
            <Confirmation
              order={order}
              onConfirm={resetOrder}
              onBack={() => goBack(["confirm"])}
            />
          );
        }
        return (
          <ButtonBlock
            header={config.eyelash.name}
            itemList={order.getEyelashItemList()}
            onNavigate={(key) => {
              order.setProduct("eyelash").setEyelash(key);
              navigate({ confirm: "1" });
            }}
            onBack={() => { order.setEyelash(null); goBack(["product"]); }}
          />
        );

      default:
        // --- No product selected: home tiles ---
        return (
          <ButtonBlock
            header="Přehled"
            itemList={["hair", "wedding", "event", "eyelash"]
              .map((product) => ({ key: product, name: config?.[product]?.name ?? product }))}
            onNavigate={(product) => navigate({ product })}
            pending={!config}
          />
        );
    }
  },
});

Wizard = withRoute(Wizard, { profileList: ["authorities", "operatives"] });

export default Wizard;
