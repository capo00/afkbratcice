import { createVisualComponent, Lsi, useMemo } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "./config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { useParticipantList } from "./participant-context.js";

function getGroupItemList(groupCount) {
  const list = [];
  for (let i = 0; i < groupCount; i++) {
    const letter = String.fromCharCode(65 + i);
    list.push({ value: letter, children: letter });
  }
  return list;
}

const ParticipantSection = createVisualComponent({
  uu5Tag: Config.TAG + "ParticipantSection",

  render(props) {
    const { groupCount, readOnly } = props;
    const dataList = useParticipantList();

    const crudConfig = useMemo(() => ({
      name: {
        label: { cs: "Název" },
        sort: true,
        input: {
          Component: Uu5Forms.FormText,
          props: { required: true },
        },
      },
      group: {
        label: { cs: "Skupina" },
        sort: true,
        input: {
          Component: Uu5Forms.FormSelect,
          props: { itemList: getGroupItemList(groupCount || 1) },
        },
      },
      seed: {
        label: { cs: "Pozice" },
        sort: true,
        input: {
          Component: Uu5Forms.FormNumber,
          props: { min: 1 },
        },
      },
    }), [groupCount]);

    const { seriesList, columnList, sorterList } = useMemo(
      () => OcElements.Crud.generate(crudConfig),
      [crudConfig],
    );

    return (
      <OcElements.Crud
        header={<Lsi lsi={{ cs: "Účastníci" }} />}
        level={3}
        dataList={dataList}
        seriesList={seriesList}
        columnList={columnList}
        sorterDefinitionList={sorterList}
        readOnly={readOnly}
      >
        {({ type }) => {
          const gridLayout = {
            xs: "name, group, seed",
            s: "name group seed",
          };

          return (
            <Uu5Forms.Form.View gridLayout={gridLayout}>
              {OcElements.Crud.generateInputs(crudConfig)}
            </Uu5Forms.Form.View>
          );
        }}
      </OcElements.Crud>
    );
  },
});

export { ParticipantSection };
export default ParticipantSection;
