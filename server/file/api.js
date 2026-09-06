import { BinaryStore } from "caio-server";
import Config from "../config.js";
import { validate, shape, string, pageInfo } from "../services/validators.js";

/**
 * Veřejný výpis „Ke stažení". Je to vlastní use case, protože filtruje podle `category`,
 * což je pole APLIKACE -- knihovní binary/list umí jen `collection` a `refId` a libovolné
 * aplikační filtry se do ní schválně nepouštějí.
 */
export default {
  "file/list": {
    method: "get",
    validator: validate(shape({ category: string(), pageInfo: pageInfo() })),
    fn: async ({ dtoIn }) => {
      const itemList = await BinaryStore.Binary.list({
        collection: Config.BINARY_COLLECTION.DOWNLOAD,
        pageInfo: dtoIn.pageInfo,
      });
      const filtered = dtoIn.category ? itemList.filter((item) => item.category === dtoIn.category) : itemList;
      return { itemList: filtered.sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))) };
    },
  },
};
