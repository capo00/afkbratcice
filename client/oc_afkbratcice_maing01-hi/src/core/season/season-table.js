//@@viewOn:imports
import {
  createVisualComponent,
  useDataObject,
  Lsi,
  useRoute,
  useState,
  useRef,
  useEffect,
  useElementSize,
  usePreviousValue,
  useLsi,
  Utils,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5TilesElements from "uu5tilesg02-elements";
import Config from "../config/config.js";
import { Call } from "../../libs/oc_cli-elements";
import TeamItem from "../team/team-item";
//@@viewOff:imports

function AutoFitLsi({ lsi }) {
  const { ref, width } = useElementSize();
  const textRef = useRef();

  const prevWidth = usePreviousValue(width, width);
  const value = useLsi(lsi);

  const [bigWidth, setBigWidth] = useState();

  useEffect(() => {
    if (textRef.current.scrollWidth > textRef.current.clientWidth && bigWidth !== prevWidth) {
      setBigWidth(prevWidth);
    } else if (bigWidth && width >= bigWidth) {
      setBigWidth(null);
    }
  }, [width, prevWidth]);

  return (
    <div
      ref={Utils.Component.combineRefs(ref, textRef)}
      className={
        bigWidth
          ? Config.Css.css({ fontSize: 0, "&::first-letter": { fontSize: "1rem" } })
          : Config.Css.css({ whiteSpace: "nowrap" })
      }
      title={bigWidth ? value : undefined}
    >
      {value}
    </div>
  );
}

const COLUMN_LIST = [
  {
    value: "order",
    header: "",
    maxWidth: 32,
    horizontalAlignment: "right",
    sticky: "left",
  },
  {
    value: "team",
    header: <Lsi lsi={{ cs: "Tým" }} />,
    cell: (item) => <TeamItem {...item.data.team} />,
    // minWidth: 248,
    maxWidth: "auto",
    sticky: "left",
  },
  {
    value: "played",
    header: <AutoFitLsi lsi={{ cs: "Zápasy" }} />,
    maxWidth: 104,
    horizontalAlignment: "center",
  },
  {
    value: "wins",
    header: <AutoFitLsi lsi={{ cs: "Výhry" }} />,
    maxWidth: 104,
    horizontalAlignment: "center",
  },
  {
    value: "draws",
    header: <AutoFitLsi lsi={{ cs: "Remízy" }} />,
    maxWidth: 104,
    horizontalAlignment: "center",
  },
  {
    value: "losses",
    header: <AutoFitLsi lsi={{ cs: "Prohry" }} />,
    maxWidth: 104,
    horizontalAlignment: "center",
  },
  {
    value: "score",
    header: <AutoFitLsi lsi={{ cs: "Skóre" }} />,
    minWidth: 88,
    maxWidth: 104,
    cell: (item) => [item.data.goalsFor, item.data.goalsAgainst].join(":"),
    horizontalAlignment: "center",
  },
  {
    value: "points",
    header: <AutoFitLsi lsi={{ cs: "Body" }} />,
    maxWidth: 104,
    horizontalAlignment: "center",
    sticky: "right",
  },
];

const SeasonTable = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SeasonTable",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    borderRadius: "moderate",
  },
  //@@viewOff:defaultProps

  render(props) {
    const { seasonId, teamId, compact, ...tableProps } = props;
    const [, setRoute] = useRoute();

    const { state, data } = useDataObject({
      handlerMap: {
        load: () => Call.cmdGet("season/getTable", seasonId ? { id: seasonId } : { teamId }),
      },
    });

    let columnList = COLUMN_LIST;

    if (compact) {
      columnList = columnList.filter(({ value }) => ["order", "team", "points"].includes(value));
    }

    if (state === "pendingNoData") {
      columnList = columnList.map((col) => ({ ...col, cell: () => <Uu5Elements.Skeleton borderRadius="moderate" /> }));
    } else {
      columnList = columnList.map(({ horizontalAlignment, ...col }) => ({
        ...col,
        cellComponent: (props) => {
          let significance, colorScheme;
          if (props.data.team.id === teamId) {
            significance = "distinct";
            colorScheme = "primary";
          }
          return (
            <Uu5TilesElements.Table.Cell
              {...props}
              horizontalAlignment={horizontalAlignment}
              significance={significance}
              colorScheme={colorScheme}
              onClick={() => setRoute("team", { id: props.data.team.id })}
            />
          );
        },
        headerComponent:
          col.headerComponent ||
          (horizontalAlignment ? (
            <Uu5TilesElements.Table.HeaderCell horizontalAlignment={horizontalAlignment} />
          ) : undefined),
      }));
    }

    const tableData =
      data?.table?.map((item, i) => ({ order: i + 1 + ".", ...item })) || Array.from({ length: 12 }, () => ({}));

    //@@viewOn:render
    return (
      <Uu5TilesElements.Table
        {...tableProps}
        data={tableData}
        columnList={columnList}
        spacing={compact ? "tight" : undefined}
        hideHeader={compact}
        getBorders={({ rowIndex }) => {
          let border;
          if (rowIndex !== tableData.length - 1) {
            border = { width: { bottom: 1 } };
          }
          return border;
        }}
        cellHoverExtent="row"
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SeasonTable };
export default SeasonTable;
//@@viewOff:exports
