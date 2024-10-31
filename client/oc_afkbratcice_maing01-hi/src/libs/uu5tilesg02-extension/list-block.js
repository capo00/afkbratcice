import { useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5TilesControls from "uu5tilesg02-controls";
import ServerlessControllerProvider from "./serverless-controller-provider";

function BulkActionBar({ getActionList }) {
  const { selectedData } = Uu5Tiles.useController();

  return <Uu5TilesControls.BulkActionBar actionList={getActionList(selectedData)} />;
}

function ListBlock({
  // Provider
  data,
  serieList,
  filterDefinitionList,
  initialFilterList,
  sorterDefinitionList,
  initialSorterList,
  selectable,

  // List
  columnList,
  getItemActionList,
  onLoad,

  // FilterBar
  initialFilterBarExpanded,

  // BulkActionBar
  getBulkActionList,

  // Block
  actionList = [],
  headerType = "heading",
  ...blockProps
}) {
  const actionListDef = useMemo(
    () => [
      { component: <Uu5TilesControls.SearchButton /> },
      { component: <Uu5TilesControls.FilterButton type="bar" disabled={!filterDefinitionList} /> },
      { component: <Uu5TilesControls.SerieButton disabled={!serieList?.[0]?.label} /> },
      ...actionList,
    ],
    [actionList],
  );

  return (
    <ServerlessControllerProvider
      data={data}
      serieList={serieList}
      filterDefinitionList={filterDefinitionList}
      initialFilterList={initialFilterList}
      sorterDefinitionList={sorterDefinitionList}
      initialSorterList={initialSorterList}
      selectable={selectable}
    >
      <Uu5Elements.Block actionList={actionListDef} headerType={headerType} {...blockProps}>
        <Uu5TilesControls.FilterBar initialExpanded={initialFilterBarExpanded} />
        <Uu5TilesControls.FilterManagerModal />
        <Uu5TilesControls.SerieManagerModal />
        {getBulkActionList && <BulkActionBar getActionList={getBulkActionList} />}

        <Uu5TilesElements.List
          columnList={columnList}
          tileMinWidth={200}
          tileMaxWidth={400}
          verticalAlignment="center"
          virtualization="table"
          borderRadius="moderate"
          getActionList={getItemActionList}
          onLoad={onLoad}
        >
          <Uu5TilesElements.Grid.DefaultTile />
        </Uu5TilesElements.List>
      </Uu5Elements.Block>
    </ServerlessControllerProvider>
  );
}

export { ListBlock };
export default ListBlock;
