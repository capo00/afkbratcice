//@@viewOn:imports
import { createComponent, useDataList, useMemo, Utils } from "uu5g05";
import Config from "./config/config.js";
import Call from "./call";
//@@viewOff:imports

function getCalls(entity) {
  return {
    load: (dtoIn) => Call.cmdGet(entity + "/list", dtoIn),
    createItem: (dtoIn) => Call.cmdPost(entity + "/create", dtoIn),
    createMany: (dtoIn) => Call.cmdPost(entity + "/createMany", dtoIn),
    updateItem: (dtoIn) => Call.cmdPost(entity + "/update", dtoIn),
    deleteItem: (dtoIn) => Call.cmdPost(entity + "/delete", dtoIn),
  };
}

const CrudContext = {
  create(entity) {
    const [CrudContext, useCrud] = Utils.Context.create();

    const CrudProvider = createComponent({
      //@@viewOn:statics
      uu5Tag: Config.TAG + "CrudProvider",
      //@@viewOff:statics

      //@@viewOn:propTypes
      propTypes: {},
      //@@viewOff:propTypes

      //@@viewOn:defaultProps
      defaultProps: {
        pageSize: 1000,
      },
      //@@viewOff:defaultProps

      render(props) {
        const { children, calls = getCalls(entity), pageSize } = props;

        const dataList = useDataList({
          pageSize,
          handlerMap: {
            load: calls.load,
            create: calls.createItem,
            createMany: calls.createMany,
          },
          itemHandlerMap: {
            delete: calls.deleteItem,
            update: calls.updateItem,
          },
        });

        const value = useMemo(() => {
          return {
            ...dataList,
            data: [...dataList.newData, ...(dataList.data ?? [])],
            pageSize,
          };
        }, [dataList, pageSize]);

        //@@viewOn:render
        return (
          <CrudContext.Provider value={value}>
            {typeof children === "function" ? children(value) : children}
          </CrudContext.Provider>
        );
        //@@viewOff:render
      },
    });

    return [CrudProvider, useCrud];
  },
};

//@@viewOn:exports
export { CrudContext };
export default CrudContext;
//@@viewOff:exports
