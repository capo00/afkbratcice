//@@viewOn:imports
import { createVisualComponent, createComponent, useCallback, useState, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5TilesControls from "uu5tilesg02-controls";
import Uu5CodeKit from "uu5codekitg01";
import Config from "./config/config.js";

//@@viewOff:imports
function getSortFn(sort, code) {
  let fn;
  switch (typeof sort) {
    case "function":
      fn = (a, b) => (a.data ? sort(a.data[code], b.data[code], a, b) : 0);
      break;
    default:
      fn = (a, b) => {
        let result;
        if (!a.data) {
          result = 0;
        } else {
          if (sort === -1) [b, a] = [a, b];

          const aValue = a.data[code];
          const bValue = b.data[code];

          if (typeof aValue === "string" && typeof bValue === "string") {
            result = aValue.localeCompare(bValue);
          } else {
            result = aValue < bValue ? -1 : 1;
          }
        }

        return result;
      };
  }

  return fn;
}

function generate(cfg) {
  const seriesList = [];
  const columnList = [];
  const sorterList = [];
  const filterList = [];

  for (let code in cfg) {
    const { label, output, columnProps, sort, filterProps } = cfg[code];

    if (output !== false) {
      seriesList.push({
        value: code,
        label,
        dataItem: output ? (item) => output(item.data.data[code], item.data) : undefined,
      });
    }

    if (columnProps || sort) {
      const { horizontalAlignment, ...restColumnProps } = columnProps ?? {};
      columnList.push({
        value: code,
        ...(sort || horizontalAlignment
          ? {
            headerComponent: (
              <Uu5TilesElements.Table.HeaderCell
                horizontalAlignment={horizontalAlignment}
                sorterKey={sort ? code : undefined}
              />
            ),
          }
          : null),
        ...(horizontalAlignment
          ? {
            cellComponent: <Uu5TilesElements.Table.Cell horizontalAlignment={horizontalAlignment} />,
          }
          : null),
        ...restColumnProps,
      });
    }

    if (sort) {
      sorterList.push({
        key: code,
        label,
        sort: getSortFn(sort, code),
      });
    }

    if (filterProps) {
      filterList.push({
        key: code,
        label,
        ...filterProps,
        filter: (item, value) => {
          if (value === undefined || !item.data) return true;
          return filterProps.filter(item.data[code], value, item);
        },
      });
    }
  }

  return { seriesList, columnList, sorterList, filterList };
}

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

const FormModal = createComponent({
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

function BulkActionBar({ handlerMap, setRemoveData }) {
  const { selectedData } = Uu5Tiles.useController();

  return (
    <Uu5TilesControls.BulkActionBar
      actionList={[
        {
          icon: "uugds-delete",
          children: "Delete",
          colorScheme: "negative",
          onClick: (e) => {
            setRemoveData({
              callback: () => handlerMap.deleteMany({ idList: selectedData.map(({ data }) => data.id) }),
              header: <Lsi lsi={{ cs: "Smazat položky?" }} />,
              info: (
                <Lsi
                  lsi={{
                    cs: `Opravdu chcete smazat položky?`,
                  }}
                />
              ),
            });
          },
        },
      ]}
    />
  );
}

const Crud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Crud",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    headerType: "heading",
  },
  //@@viewOff:defaultProps

  render(props) {
    const {
      dataList,
      columnList,
      seriesList,
      sorterDefinitionList,
      initialSorterList,
      filterDefinitionList,
      initialFilterList,
      children,
      onPreSubmit,
      ...blockProps
    } = props;

    const [editData, setEditData] = useState();
    const [manyData, setManyData] = useState();
    const [removeData, setRemoveData] = useState();
    const [sorterList, setSorterList] = useState(initialSorterList);
    const [filterList, setFilterList] = useState(initialFilterList);
    const [displayData, setDisplayData] = useState();

    const { state, data, handlerMap, pageSize } = dataList;

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

    const disabled = state === "itemPending";
    const getActionList = useCallback(
      ({ rowIndex, data }) => {
        const items = [
          {
            icon: "uugdsstencil-it-json",
            children: <Lsi lsi={{ cs: "Zobrazit data" }} />,
            onClick: () => setDisplayData(data.data),
          },
          {
            icon: "uugds-copy",
            children: <Lsi lsi={{ cs: "Zkopírovat ID" }} />,
            onClick: () => Utils.Clipboard.write(data.data.id),
          },
          {
            icon: "uugds-delete",
            children: <Lsi lsi={{ cs: "Smazat" }} />,
            colorScheme: "negative",
            disabled: data.state === "pending",
            onClick: () =>
              setRemoveData({
                callback: () => data.handlerMap.delete({ id: data.data.id }),
                header: <Lsi lsi={{ cs: "Smazat položku?" }} />,
                info: (
                  <Lsi
                    lsi={{
                      cs: `Opravdu chcete smazat položku${data.data.name ? ` "${data.data.name}"` : ""}?`,
                    }}
                  />
                ),
              }),
          },
        ];

        let actionList = [
          {
            icon: "uugds-menu",
            tooltip: { cs: "Více" },
            itemList: items,
            iconOpen: null,
            iconClosed: null,
          },
        ];

        if (children) {
          actionList.unshift({
            icon: "uugds-pencil",
            tooltip: { cs: "Upravit" },
            disabled: data.state === "pending",
            onClick: () => setEditData({ callback: data.handlerMap.update, data: data.data }),
          });
        } else {
          actionList.unshift(items.shift());
          actionList[1].itemList = items;
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
        onLabelClick: () => setEditData({ callback: handlerMap.create }),
        colorScheme: "primary",
        significance: "common",
        itemList: [
          {
            children: <Lsi lsi={{ cs: "Hromadně" }} />,
            icon: "uugds-plus",
            onClick: () => setManyData({ callback: handlerMap.createMany }),
          },
        ],
      });
    }
    if (filterDefinitionList) {
      actionList.push({ component: <Uu5TilesControls.FilterButton /> });
    }

    //@@viewOn:render
    return (
      <>
        <Uu5Tiles.ControllerProvider
          data={state === "pendingNoData" ? [{}, {}, {}, {}, {}] : data}
          serieList={state === "pendingNoData" ? undefined : seriesList}
          sorterDefinitionList={sorterDefinitionList}
          sorterList={sorterList}
          onSorterChange={(e) => setSorterList(e.data.sorterList)}
          filterDefinitionList={filterDefinitionList}
          filterList={filterList}
          onFilterChange={(e) => setFilterList(e.data.filterList)}
          selectable="multiple"
        >
          <Uu5Elements.Block {...blockProps} actionList={actionList}>
            {filterDefinitionList && (
              <>
                <Uu5TilesControls.FilterBar initialExpanded={!!initialFilterList?.length} />
                <Uu5TilesControls.FilterManagerModal />
              </>
            )}
            <BulkActionBar handlerMap={handlerMap} setRemoveData={setRemoveData} />
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

        {children && !!editData && (
          <FormModal
            header={<Lsi lsi={{ cs: editData?.data ? "Upravit" : "Vytvořit" }} />}
            open={!!editData}
            onClose={() => setEditData()}
            onSubmit={async (e) => {
              if (onPreSubmit) await onPreSubmit(e);
              const { sys, ...submitData } = e.data.value;
              let newData = submitData;
              if (editData?.data) {
                newData = {};
                for (let k in submitData) {
                  if (submitData[k] !== editData.data[k]) newData[k] = submitData[k];
                }
              }
              if (Object.keys(newData).length > 0) await editData.callback(newData);
              setEditData();
            }}
            initialValue={editData?.data}
          >
            {typeof children === "function" ? children({ type: editData?.data ? "update" : "create" }) : children}
          </FormModal>
        )}

        {manyData && (
          <FormModal
            header={<Lsi lsi={{ cs: "Vytvořit hromadně" }} />}
            open={!!manyData}
            onClose={() => setManyData()}
            onSubmit={async (e) => {
              const { itemList } = e.data.value;
              if (itemList != null) await manyData.callback({ itemList: JSON.parse(itemList) });
              setManyData();
            }}
          >
            <Uu5Forms.Form.View>
              <Uu5CodeKit.FormJson name="itemList" format="pretty" displayGutter={false} required />
            </Uu5Forms.Form.View>
          </FormModal>
        )}

        {displayData && (
          <Uu5Elements.Modal
            header={<Lsi lsi={{ cs: "Data" }} />}
            open={!!displayData}
            onClose={() => setDisplayData()}
          >
            <Uu5CodeKit.Json.Input value={displayData} format="pretty" displayGutter={false} readOnly />
          </Uu5Elements.Modal>
        )}

        <Uu5Elements.Dialog
          open={!!removeData}
          onClose={() => setRemoveData()}
          icon={<Uu5Elements.Svg code="uugdssvg-svg-delete" />}
          header={removeData?.header}
          info={removeData?.info}
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
                removeData.callback();
                setRemoveData();
              },
              colorScheme: "negative",
              significance: "highlighted",
            },
          ]}
        />
      </>
    );
    //@@viewOff:render
  },
});

Crud.generate = generate;

Crud.generateInputs = (cfg, operation) =>
  Object.entries(cfg).map(([code, { input, label }]) => {
    if (input) {
      const { Component, props } = input;
      return (
        <Component
          key={code}
          name={code}
          label={label}
          {...(typeof props === "function" ? props({ operation }) : props)}
        />
      );
    }
  });

//@@viewOn:exports
export { Crud };
export default Crud;
//@@viewOff:exports
