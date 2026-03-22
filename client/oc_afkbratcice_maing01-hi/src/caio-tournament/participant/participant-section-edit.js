import { createVisualComponent, Lsi, useMemo } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import OcElements from "../../libs/oc_cli-elements";
import Config from "./config/config.js";
import { useParticipantList } from "./participant-context.js";

const ParticipantSectionEdit = createVisualComponent({
  uu5Tag: Config.TAG + "ParticipantSectionEdit",

  render(props) {
    const { groupList, readOnly, ...restProps } = props;
    const dataList = useParticipantList();

    const crudConfig = useMemo(() => ({
      seed: {
        label: "#",
        sort: true,
        columnProps: {
          horizontalAlignment: "right",
          maxWidth: 56,
        },
        input: {
          Component: Uu5Forms.FormNumber,
          props: { min: 1, label: <Lsi lsi={{ cs: "Pozice" }} /> },
        },
        output: (value, dataObject) => dataObject.data.group && value ? [dataObject.data.group, value].join("") : "",
      },
      name: {
        label: { cs: "Název" },
        sort: true,
        input: {
          Component: Uu5Forms.FormText,
          props: { required: true, autoFocus: true },
        },
      },
      group: {
        label: { cs: "Skupina" },
        sort: true,
        input: {
          Component: Uu5Forms.FormSwitchSelect,
          props: { itemList: groupList.map((g) => ({ value: g })) },
        },
        visible: false,
      },
    }), [groupList.length]);

    const { seriesList, columnList, sorterList } = useMemo(
      () => OcElements.Crud.generate(crudConfig),
      [crudConfig],
    );

    return (
      <OcElements.Crud
        {...restProps}
        header={<Lsi lsi={{ cs: "Účastníci" }} />}
        headerType="title"
        card="full"
        dataList={dataList}
        seriesList={seriesList}
        columnList={columnList}
        sorterDefinitionList={sorterList}
        readOnly={readOnly}
        viewType="table"
        spacing={readOnly ? "loose" : undefined}
        hideHeader
        cellHoverExtent="row"
      >
        {({ type }) => {
          const gridLayout = {
            xs: "name, group, seed",
            s: "name name group group seed",
          };

          return (
            <Uu5Forms.Form.View gridLayout={gridLayout}>
              {OcElements.Crud.generateInputs(crudConfig, { orderList: ["name", "group", "seed"] })}
            </Uu5Forms.Form.View>
          );
        }}
      </OcElements.Crud>
    );
  },
});

export { ParticipantSectionEdit };
export default ParticipantSectionEdit;
