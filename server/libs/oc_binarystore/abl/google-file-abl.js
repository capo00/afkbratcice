const { google } = require("googleapis");
const fs = require("fs");
const Config = require("../config/config");
// TODO fix path to extended lib because of cyclic deps
const AppError = require("../../oc_app-server/services/app-error");

const SCOPES = ["https://www.googleapis.com/auth/drive"];

let auth;

function getAuth() {
  // TODO path should be configurable
  return auth ||= new google.auth.GoogleAuth({ keyFile: "./server/system-identity.json", scopes: SCOPES });
}

function getGoogleFileUri(id, width) {
  let uri = `https://drive.google.com/thumbnail?id=${id}`;
  if (width) uri += `&sz=w${width}`;
  return uri;
}

function googleFiles() {
  return google.drive({ version: "v3", auth: getAuth() }).files;
}

const ERROR_CODE_PREFIX = "oc_binarystore/google-file/";
const Error = {
  DoesNotExists: class extends AppError.DoesNotExists {
    constructor(e, opts) {
      super("Binary does not exist", { cause: e, codePrefix: ERROR_CODE_PREFIX, ...opts });
    }
  },

  CreateFailed: class extends AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "createFailed";

    constructor(e, opts) {
      super("Creating of binary in Google was failed", {
        cause: e,
        code: Error.CreateFailed.CODE, ...opts
      });
    }
  },

  UpdateFailed: class extends AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "updateFailed";

    constructor(e, opts) {
      super("Updating of binary in Google was failed", {
        cause: e,
        code: Error.UpdateFailed.CODE, ...opts
      });
    }
  },

  DeleteFailed: class extends AppError.Failed {
    static CODE = ERROR_CODE_PREFIX + "deleteFailed";

    constructor(e, opts) {
      super("Deleting of binary in Google was failed", {
        cause: e,
        code: Error.DeleteFailed.CODE, ...opts
      });
    }
  },
}

class GoogleFile {
  static async create(file) {
    try {
      const { data } = await googleFiles().create({
        media: {
          mimeType: file.mimetype,
          body: fs.createReadStream(file.path),
        },
        requestBody: {
          name: file.originalname,
          parents: [Config.publicFolderId],
        },
        fields: "id,name",
      });

      return { ...data, uri: getGoogleFileUri(data.id) };
    } catch (e) {
      throw new Error.CreateFailed(e);
    }
  }

  static async update(id, file) {
    try {
      const { data } = await googleFiles().update({
        fileId: id,
        media: {
          mimeType: file.mimetype,
          body: fs.createReadStream(file.path),
        },
        requestBody: {
          name: file.originalname,
        },
        fields: "id,name",
      });

      return { ...data, uri: getGoogleFileUri(data.id) };
    } catch (e) {
      throw new Error.UpdateFailed(e, { paramsMap: { diskId: id } });
    }
  }

  static async delete(id) {
    try {
      await googleFiles().delete({ fileId: id });
    } catch (e) {
      throw new Error.DeleteFailed(e, { paramsMap: { fileId: id } });
    }
  }

  static getUri(id) {
    return getGoogleFileUri(id);
  }
}

module.exports = GoogleFile;
