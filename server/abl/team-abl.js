const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/team-dao");
const OcBinaryStore = require("../libs/oc_binarystore");

const CREATE_TAG_LIST = ["sys", "team"];

class TeamAbl extends OcAppCore.Crud {

  constructor() {
    super("team", dao);
  }

  async list(pageInfo, { age }) {
    return (age ? (await dao.listByAge(age)).map(this._getData) : await super.list(pageInfo));
  }

  async create(item) {
    const { logo: logoFile, ...restParams } = item;
    const logo = await OcBinaryStore.Abl.Binary.create({ file: logoFile, tagList: CREATE_TAG_LIST });
    try {
      return await super.create({ ...restParams, logoId: logo.id, logoUri: logo.uri });
    } catch (e) {
      try {
        await OcBinaryStore.Abl.Binary.delete(logo.id);
      } catch (e) {
        console.error("Binary cannot be deleted", logo.id);
      }
      throw e;
    }
  }

  async update(data) {
    const { logo: logoFile, ...restParams } = data;
    let teamObject;

    if (logoFile !== undefined) {
      teamObject = await this._get(data.id);
      const { logoId } = teamObject;

      if (logoFile) {
        let logo;
        if (logoId) {
          await OcBinaryStore.Abl.Binary.update({ id: logoId, file: logoFile });
        } else {
          logo = await OcBinaryStore.Abl.Binary.create({ file: logoFile, tagList: CREATE_TAG_LIST });
          restParams.logoId = logo.id;
          restParams.logoUri = logo.uri;
        }
      } else if (logoFile === null) {
        await OcBinaryStore.Abl.Binary.delete(logoId);
        restParams.logoId = null;
        restParams.logoUri = null;
      }
    }

    try {
      return await super.update({ ...teamObject, ...restParams }, { merge: !teamObject });
    } catch (e) {
      if (restParams.logoId) {
        try {
          await OcBinaryStore.Abl.Binary.delete(restParams.logoId);
        } catch (e) {
          console.error("Binary cannot be deleted", restParams.logoId);
        }
      }
      throw e;
    }
  }

  async delete(id) {
    const { logoId } = await this._get(id);
    if (logoId) await OcBinaryStore.Abl.Binary.delete(logoId);
    return await super.delete(id);
  }

  _getData(object) {
    const { logoId, ...data } = object;
    return data;
  }
}

module.exports = new TeamAbl();
