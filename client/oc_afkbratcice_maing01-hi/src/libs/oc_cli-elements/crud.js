//@@viewOn:imports
import { createVisualComponent, createComponent, useDataList, useCallback, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5TilesControls from "uu5tilesg02-controls";
import Config from "./config/config.js";

//@@viewOff:imports

function ModalFooter({ onClose }) {
  const count = onClose ? 2 : 1;

  return (
    <Uu5Elements.Grid
      templateColumns={{ xs: `repeat(${count}, 1fr)`, s: `repeat(${count}, auto)` }}
      columnGap={Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "c"])}
      justifyContent={{ s: "end" }}
    >
      {onClose && <Uu5Forms.CancelButton onClick={onClose} />}
      <Uu5Forms.SubmitButton icon="uugds-check" />
    </Uu5Elements.Grid>
  );
}

const CreateUpdateModal = createComponent({
  render(props) {
    const { onSubmit, onClose, open, initialValue, children, ...modalProps } = props;

    return (
      <Uu5Forms.Form.Provider key={open} onSubmit={onSubmit} initialValue={initialValue}>
        <Uu5Elements.Modal onClose={onClose} open={open} footer={<ModalFooter onClose={onClose} />} {...modalProps}>
          {children}
        </Uu5Elements.Modal>
      </Uu5Forms.Form.Provider>
    );
  },
});

const Crud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Crud",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    calls: {},
    pageSize: 1000,
  },
  //@@viewOff:defaultProps

  render(props) {
    const {
      calls,
      columnList,
      seriesList,
      sorterDefinitionList,
      filterDefinitionList,
      children,
      pageSize,
      onPreSubmit,
      ...blockProps
    } = props;

    const [editData, setEditData] = useState();
    const [removeData, setRemoveData] = useState();
    const [sorterList, setSorterList] = useState();
    const [filterList, setFilterList] = useState();

    const { state, data, newData, handlerMap } = useDataList({
      pageSize,
      handlerMap: {
        load: calls.load,
        create: calls.createItem,
      },
      itemHandlerMap: {
        delete: calls.deleteItem,
        update: calls.updateItem,
      },
    });

    const completeData = [...newData, ...(data ?? [])];

    const onLoad = useCallback(
      ({ indexFrom, count }) => {
        let pageFrom = Math.floor(indexFrom / pageSize);
        let pageTo = Math.floor((indexFrom + count - 1) / pageSize);
        for (let i = pageFrom; i <= pageTo; i++) {
          handlerMap.loadNext({ pageInfo: { pageIndex: i } });
        }
      },
      [handlerMap.loadNext],
    );

    const disabled = state === "pendingNoData";
    const getActionList = useCallback(
      ({ rowIndex, data }) => {
        const actionList = [
          {
            icon: "uugds-delete",
            tooltip: { cs: "Smazat" },
            colorScheme: "red",
            disabled,
            onClick: () => setRemoveData({ callback: data.handlerMap.delete, id: data.data.id, name: data.data.name }),
          },
        ];

        if (children) {
          actionList.unshift({
            icon: "uugds-pencil",
            tooltip: { cs: "Upravit" },
            disabled,
            onClick: () => setEditData({ callback: data.handlerMap.update, data: data.data }),
          });
        }

        return actionList;
      },
      [disabled],
    );

    let actionList = [{ component: <Uu5TilesControls.SearchButton /> }];
    if (children) {
      actionList.push({
        children: <Lsi lsi={{ cs: "Vytvořit" }} />,
        icon: "uugds-plus",
        onClick: () => setEditData({ callback: handlerMap.create }),
        colorScheme: "primary",
        significance: "common",
      });
    }
    if (filterDefinitionList) {
      actionList.push({ component: <Uu5TilesControls.FilterButton /> });
    }

    //@@viewOn:render
    return (
      <>
        <Uu5Tiles.ControllerProvider
          data={state === "pendingNoData" ? [{}, {}, {}, {}, {}] : completeData}
          serieList={seriesList}
          sorterDefinitionList={sorterDefinitionList}
          sorterList={sorterList}
          onSorterChange={(e) => setSorterList(e.data.sorterList)}
          filterDefinitionList={filterDefinitionList}
          filterList={filterList}
          onFilterChange={(e) => setFilterList(e.data.filterList)}
        >
          <Uu5Elements.Block {...blockProps} actionList={actionList}>
            {filterDefinitionList && (
              <>
                <Uu5TilesControls.FilterBar type="bar" />
                <Uu5TilesControls.FilterManagerModal />
              </>
            )}
            <Uu5TilesElements.List
              columnList={
                state === "pendingNoData"
                  ? columnList.map((col) => ({ ...col, cell: () => <Uu5Elements.Skeleton borderRadius="moderate" /> }))
                  : columnList
              }
              getActionList={getActionList}
              tileMinWidth={200}
              tileMaxWidth={400}
              verticalAlignment="center"
              onLoad={onLoad}
              virtualization
              borderRadius="moderate"
            >
              <Uu5TilesElements.Grid.DefaultTile />
            </Uu5TilesElements.List>
          </Uu5Elements.Block>
        </Uu5Tiles.ControllerProvider>

        {children && (
          <CreateUpdateModal
            header={<Lsi lsi={{ cs: editData?.data ? "Upravit" : "Vytvořit" }} />}
            open={!!editData}
            onClose={() => setEditData()}
            onSubmit={async (e) => {
              if (onPreSubmit) await onPreSubmit(e);
              await editData.callback(e.data.value);
              setEditData();
            }}
            initialValue={editData?.data}
          >
            {typeof children === "function" ? children({ type: editData?.data ? "update" : "create" }) : children}
          </CreateUpdateModal>
        )}

        <Uu5Elements.Dialog
          open={!!removeData}
          onClose={() => setRemoveData()}
          icon={<Uu5Elements.Svg code="uugdssvg-svg-delete" />}
          header={<Lsi lsi={{ cs: "Smazat položku?" }} />}
          info={
            <Lsi
              lsi={{
                cs: `Opravdu chcete smazat položku${removeData?.name ? ` "${removeData.name}"` : ""}?`,
              }}
            />
          }
          actionDirection="horizontal"
          actionList={[
            {
              children: <Lsi lsi={{ cs: "Zrušit" }} />,
              onClick: () => setRemoveData(),
              significance: "distinct",
            },
            {
              children: <Lsi lsi={{ cs: "Smazat" }} />,
              onClick: (e) => {
                removeData.callback({ id: removeData.id });
                setRemoveData();
              },
              colorScheme: "red",
              significance: "highlighted",
            },
          ]}
        />
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Crud };
export default Crud;
//@@viewOff:exports
