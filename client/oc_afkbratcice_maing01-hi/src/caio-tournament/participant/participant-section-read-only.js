import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useParticipantList } from "./participant-context.js";
import Uu5TilesElements from "uu5tilesg02-elements";

const ParticipantSectionReadOnly = createVisualComponent({
  uu5Tag: Config.TAG + "ParticipantSectionReadOnly",

  render(props) {
    const { groupList, ...restProps } = props;
    const dataList = useParticipantList();

    const getChild = (g) => ({ style: { paddingBottom, ...restStyles } = {} }) => (
      // removing paddingBottom
      <div className={Config.Css.css({...restStyles, paddingBottom: paddingBottom / 3})}>
        <Uu5TilesElements.Table
          data={g ? dataList.data.filter((item) => item.data.group === g) : dataList.data}
          columnList={[
            {
              header: <Lsi lsi={{ cs: "Skupina" }} />,
              value: "seed",
              cell: ({ data }) => data.data.group + data.data.seed,
              horizontalAlignment: "right",
              maxWidth: 56,
            },
            {
              header: <Lsi lsi={{ cs: "Název" }} />,
              value: "name",
            }
          ]}
          hideHeader
          spacing="loose"
        />
      </div>
    );

    return groupList.length > 1 ? (
      <Uu5Elements.Grid {...restProps} templateColumns="repeat(auto-fit, minmax(240px, 1fr))">
        {groupList.map((g) => (
          <Uu5Elements.Block
            header={<Lsi lsi={{ cs: `Skupina %s` }} params={g} />}
            headerType="title"
            card="full"
          >
            {getChild(g)}
          </Uu5Elements.Block>
        ))}
      </Uu5Elements.Grid>
    ) : getChild();
  },
});

export default ParticipantSectionReadOnly;
