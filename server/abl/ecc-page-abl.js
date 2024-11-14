const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/ecc-page-dao");
const eccSectionAbl = require("./ecc-section-abl");

class EccPageAbl extends OcAppCore.Crud {

  constructor() {
    super("eccPage", dao);
  }

  async load(id) {
    const eccPageObject = await super.get(id);
    const itemList = await eccSectionAbl.list({ idList: eccPageObject.sectionList });
    return { ...eccPageObject, sectionList: itemList };
  }

  async create(dtoIn) {
    const page = await super.create(dtoIn);
    const section = await eccSectionAbl.create({});

    const newData = { ...page, sectionList: [section.id] };
    const newPage = await super.update(newData, { merge: false });

    return {
      ...newPage,
      sectionList: [section],
    };
  }

  async createSectionBefore(dtoIn) {
    return this.#createSection(dtoIn, (newSectionList, eccSectionId, i) => {
      if (i === 0) {
        newSectionList.unshift(eccSectionId);
      } else {
        newSectionList.splice(i - 1, 0, eccSectionId);
      }
      return newSectionList;
    });
  }

  async createSectionAfter(dtoIn) {
    return this.#createSection(dtoIn, (newSectionList, eccSectionId, i) => {
      if (i === newSectionList.length - 1) {
        newSectionList.push(eccSectionId);
      } else {
        newSectionList.splice(i, 0, eccSectionId);
      }
      return newSectionList;
    });
  }

  async updateSectionOrder({ id, sectionList }) {
    const newPage = await super.update({ id, sectionList });
    const { itemList } = await eccSectionAbl.list({ idList: newPage.sectionList });
    return { ...newPage, sectionList: itemList };
  }

  async deleteSection({ id, sectionId }) {
    const eccPageObject = await super._get(id);
    const i = eccPageObject.sectionList.findIndex((objectId) => objectId.toString() === sectionId);
    if (i > -1) {
      const newData = { ...eccPageObject, sectionList: eccPageObject.sectionList.filter((id) => id !== sectionId) };
      await eccSectionAbl.delete(sectionId);
      const newPage = await super.update(newData, { merge: false });

      const itemList = await eccSectionAbl.list({ idList: newPage.sectionList });
      return { ...newPage, sectionList: itemList };
    }
  }

  async #createSection({ id, sectionId, uu5String }, callback) {
    const eccPageObject = await super._get(id);

    const i = eccPageObject.sectionList.findIndex((objectId) => objectId.toString() === sectionId);
    if (i === -1) {
      throw new OcAppCore.Crud.Error.DoesNotExists(this.name, undefined, {
        sectionId,
        codePrefix: ["oc_afkbratcice", this.name].join("/")
      });
    }

    const eccSection = await eccSectionAbl.create({ uu5String });

    const newSectionList = callback([...eccPageObject.sectionList], eccSection.id, i);

    const newData = { ...eccPageObject, sectionList: newSectionList };
    const newPage = await super.update(newData, { merge: false });

    const itemList = await eccSectionAbl.list({ idList: newPage.sectionList });
    return { ...newPage, sectionList: itemList };
  }
}

module.exports = new EccPageAbl();
