const os = require("os");
const binaryDao = require("../dao/binary-dao");
const multer = require("multer");
// TODO fix path to extended lib because of cyclic deps
const AppError = require("../../oc_app-server/services/app-error");
const GoogleFileAbl = require("./google-file-abl");

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, callback) => callback(null, `${file.originalname}`)
});

const upload = multer({ storage });

const ERROR_CODE_PREFIX = "oc_binarystore/binary/";
const BinaryError = {
  DoesNotExists: class extends AppError.DoesNotExists {
    constructor(e, opts) {
      super("Binary does not exist", { cause: e, codePrefix: ERROR_CODE_PREFIX, ...opts });
    }
  },

  CreateFailed: class extends AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "createFailed";

    constructor(e, opts) {
      super("Creating of binary was failed", { cause: e, code: BinaryError.CreateFailed.CODE, ...opts });
    }
  },

  UpdateFailed: class extends AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "updateFailed";

    constructor(e, opts) {
      super("Updating of binary was failed", { cause: e, code: BinaryError.UpdateFailed.CODE, ...opts });
    }
  },

  DeleteFailed: class extends AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "deleteFailed";

    constructor(e, opts) {
      super("Deleting of binary was failed", { cause: e, code: BinaryError.DeleteFailed.CODE, ...opts });
    }
  },
}

class BinaryAbl {
  static async list(pageInfo) {
    return (await binaryDao.list(pageInfo)).map(({ gFileId, ...item }) => ({
      ...item,
      uri: GoogleFileAbl.getUri(gFileId),
    }));
  }

  static async get(id) {
    const { gFileId, ...data } = await BinaryAbl.#get(id);
    return data;
  }

  static async create(data) {
    const { file, name, ...restParams } = data;

    let gFile;
    try {
      gFile = await GoogleFileAbl.create(file);

      const { gFileId, _id, ...binaryData } = await binaryDao.create({
        name: name ?? gFile.name,
        gFileId: gFile.id,
        size: file.size,
        mimeType: file.mimetype,
        ...restParams,
      });

      return { ...binaryData, uri: gFile.uri };
    } catch (e) {
      if (gFile) {
        try {
          await GoogleFileAbl.delete(gFile.id);
        } catch (e) {
          console.error("Binary cannot be deleted from GoogleFile", gFile.id, gFile.uri);
        }
      }
      throw new BinaryError.CreateFailed(e);
    }
  }

  static async update(data) {
    const { id, file, name, sys, ...updatedParams } = data;
    try {
      const binary = await BinaryAbl.#get(id);

      let uri;
      if (file) {
        // Update file metadata or content
        const gFile = await GoogleFileAbl.update(binary.gFileId, file);
        updatedParams.size = file.size;
        updatedParams.mimeType = file.mimetype;
        uri = gFile.uri;
      }

      if (name) updatedParams.name = name;

      const { gFileId: _, ...binaryData } = await binaryDao.update({
        ...binary,
        ...updatedParams,
      });

      return { ...binaryData, uri: uri ?? GoogleFileAbl.getUri(binary.gFileId) };
    } catch (e) {
      throw new BinaryError.UpdateFailed(e);
    }
  }

  static async delete(id) {
    try {
      const { gFileId } = await BinaryAbl.#get(id);

      await GoogleFileAbl.delete(gFileId);

      await binaryDao.delete(id);
    } catch (e) {
      throw new BinaryError.DeleteFailed(e);
    }
  }

  static parseFormDataRequest(req) {
    return new Promise((resolve, reject) => upload.any()(req, null, (err) => err ? reject(err) : resolve()));
  }

  static async #get(id) {
    try {
      return await binaryDao.get(id);
    } catch (e) {
      throw new BinaryError.DoesNotExists(e, { paramMap: { id } });
    }
  }
}

module.exports = BinaryAbl;
