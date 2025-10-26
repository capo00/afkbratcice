const { Storage } = require("@google-cloud/storage");
const fs = require("fs");
const Config = require("../config/config");
const OcAppCore = require("../../oc_app-core");

let storage;

function getStorage() {
  // TODO path should be configurable
  return storage ||= new Storage({ keyFilename: "./server/system-identity.json" });
}

function joinId(name, generation) {
  return `${name}:${generation}`;
}

function splitId(gFileId) {
  return gFileId.split(":");
}

function getGoogleFileUri(gFileId) {
  const [name, generation] = splitId(gFileId);
  return `https://storage.googleapis.com/${Config.publicBucketName}/${name}` + (generation ? `?generation=${generation}` : "");
}

function getBucket() {
  return getStorage().bucket(Config.publicBucketName);
}

async function uploadFile(file, name) {
  const bucket = getBucket();
  const [gFile, metadata] = await bucket.upload(file.path, {
    destination: name,
    gzip: true,                          // compress text files automatically
    metadata: {
      contentType: file.mimetype,
    },
    resumable: true,                     // resumable upload
    validation: "md5",                   // validate using MD5 checksum
    public: true,
  });

  return joinId(metadata.name, metadata.generation);
}

const ERROR_CODE_PREFIX = "oc_binarystore/google-file2/";
const Error = {
  DoesNotExists: class extends OcAppCore.AppError.DoesNotExists {
    constructor(e, opts) {
      super("Binary does not exist", { cause: e, codePrefix: ERROR_CODE_PREFIX, ...opts });
    }
  },

  CreateFailed: class extends OcAppCore.AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "createFailed";

    constructor(e, opts) {
      super("Creating of binary in Google Cloud Storage was failed", {
        cause: e,
        code: Error.CreateFailed.CODE, ...opts
      });
    }
  },

  UpdateFailed: class extends OcAppCore.AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "updateFailed";

    constructor(e, opts) {
      super("Updating of binary in Google Cloud Storage was failed", {
        cause: e,
        code: Error.UpdateFailed.CODE, ...opts
      });
    }
  },

  DeleteFailed: class extends OcAppCore.AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "deleteFailed";

    constructor(e, opts) {
      super("Deleting of binary in Google Cloud Storage was failed", {
        cause: e,
        code: Error.DeleteFailed.CODE, ...opts
      });
    }
  },
}

class GoogleBucket {
  static async create(file) {
    try {
      const fileName = `${Config.publicFolderName}/${OcAppCore.String.generateId()}-${file.originalname}`;
      const id = await uploadFile(file, fileName);

      return {
        id,
        name: file.originalname,
        uri: getGoogleFileUri(id),
      };
    } catch (e) {
      throw new Error.CreateFailed(e);
    }
  }

  static async update(gFileId, file) {
    try {
      const id = await uploadFile(file, splitId(gFileId)[0]);

      return {
        id,
        name: file.originalname,
        uri: getGoogleFileUri(id),
      };
    } catch (e) {
      throw new Error.UpdateFailed(e, { paramsMap: { gFileId } });
    }
  }

  static async delete(gFileId) {
    try {
      const bucket = getBucket();
      const file = bucket.file(splitId(gFileId)[0]);
      await file.delete();
    } catch (e) {
      throw new Error.DeleteFailed(e, { paramsMap: { gFileId } });
    }
  }

  static getUri(id) {
    return getGoogleFileUri(id);
  }
}

module.exports = GoogleBucket;
