import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { BinaryStore } from "caio-server";
import crud from "../gallery/crud.js";
import dao from "../gallery/dao.js";
import Config from "../config.js";

// Photos of an album (review 2026-11-12, V2). `gallery/deletePhoto` and the cover of
// `gallery/update` call the binary store directly, so the per-collection authorization of
// `binary/*` does not guard them -- they must accept only a photo of that very album. The
// database and the storage are not touched.

const GALLERY_ID = "000000000000000000000001";
const OTHER_GALLERY_ID = "000000000000000000000002";

const PHOTO = {
  id: "000000000000000000000100",
  collection: Config.BINARY_COLLECTION.GALLERY,
  refId: GALLERY_ID,
  type: Config.BINARY_TYPE.PHOTO,
  uri: "https://storage/photo.webp",
  thumbBinaryId: "000000000000000000000101",
  thumbUri: "https://storage/photo-thumb.webp",
};
const THUMB = {
  id: PHOTO.thumbBinaryId,
  collection: Config.BINARY_COLLECTION.GALLERY,
  refId: GALLERY_ID,
  type: Config.BINARY_TYPE.PHOTO_THUMB,
};
const OTHER_ALBUM_PHOTO = { ...PHOTO, id: "000000000000000000000200", refId: OTHER_GALLERY_ID };
const CLUB_CREST = { id: "000000000000000000000300", collection: Config.BINARY_COLLECTION.CLUB, refId: "x", type: "logo" };

const BINARY_LIST = [PHOTO, THUMB, OTHER_ALBUM_PHOTO, CLUB_CREST];

let stored;
let updated;
let deleted;

beforeEach(() => {
  stored = { id: GALLERY_ID, name: "Hody", photoCount: 3, coverBinaryId: null, coverThumbUri: null };
  updated = null;
  deleted = [];

  dao.get = async (id) => (id === GALLERY_ID ? { ...stored } : null);
  dao.update = async (data) => {
    updated = data;
    return { ...data };
  };
  BinaryStore.Binary.get = async (id) => {
    const binary = BINARY_LIST.find((b) => b.id === id);
    if (!binary) throw new Error("Binary does not exist");
    return { ...binary };
  };
  BinaryStore.Binary.delete = async (id) => {
    deleted.push(id);
  };
  BinaryStore.Binary.list = async () => [];
});

async function assertPhotoNotFound(promise) {
  await assert.rejects(promise, (e) => {
    assert.match(e.code, /gallery\/photoNotFound$/);
    assert.equal(e.status, 404);
    return true;
  });
  assert.deepEqual(deleted, [], "nothing may be deleted");
  assert.equal(updated, null, "the album must not change");
}

test("deletePhoto deletes a photo of the album with its thumbnail and lowers the count", async () => {
  await crud.deletePhoto({ id: GALLERY_ID, binaryId: PHOTO.id });

  assert.deepEqual(deleted, [THUMB.id, PHOTO.id]);
  assert.equal(updated.photoCount, 2);
});

test("deletePhoto refuses a binary that is not a photo of this album", async () => {
  await assertPhotoNotFound(crud.deletePhoto({ id: GALLERY_ID, binaryId: CLUB_CREST.id }));
  await assertPhotoNotFound(crud.deletePhoto({ id: GALLERY_ID, binaryId: OTHER_ALBUM_PHOTO.id }));
  await assertPhotoNotFound(crud.deletePhoto({ id: GALLERY_ID, binaryId: THUMB.id }));
  await assertPhotoNotFound(crud.deletePhoto({ id: GALLERY_ID, binaryId: "000000000000000000000999" }));
});

test("update sets a photo of the album as the cover together with its thumbnail", async () => {
  stored.coverThumbUri = "https://storage/old-thumb.webp";
  await crud.update({ id: GALLERY_ID, coverBinaryId: PHOTO.id });

  assert.equal(updated.coverBinaryId, PHOTO.id);
  assert.equal(updated.coverThumbUri, PHOTO.thumbUri);
});

test("update refuses someone else's binary as the cover", async () => {
  await assertPhotoNotFound(crud.update({ id: GALLERY_ID, coverBinaryId: CLUB_CREST.id }));
  await assertPhotoNotFound(crud.update({ id: GALLERY_ID, coverBinaryId: OTHER_ALBUM_PHOTO.id }));
});

test("update with a null cover clears the thumbnail too; without a cover it does not look at photos", async () => {
  await crud.update({ id: GALLERY_ID, coverBinaryId: null });
  assert.equal(updated.coverBinaryId, null);
  assert.equal(updated.coverThumbUri, null);

  BinaryStore.Binary.get = async () => assert.fail("no cover, no photo lookup");
  await crud.update({ id: GALLERY_ID, name: "Hody 2026" });
  assert.equal(updated.name, "Hody 2026");
});

test("create ignores a cover -- a new album has no photos", async () => {
  let created;
  dao.create = async (data) => {
    created = data;
    return { id: GALLERY_ID, ...data };
  };
  await crud.create({ name: "Nové album", coverBinaryId: CLUB_CREST.id, photoCount: 0 });

  assert.equal("coverBinaryId" in created, false);
});
