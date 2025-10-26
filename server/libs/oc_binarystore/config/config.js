module.exports = {
  mongodbUri: process.env.MONGODB_URI,
  publicFolderId: process.env.GOOGLE_DISK_PUBLIC_FOLDER_ID,
  publicBucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME,
  publicFolderName: process.env.GOOGLE_CLOUD_STORAGE_FOLDER_NAME,
  ERROR_PREFIX: "oc_binarystore/",
};
