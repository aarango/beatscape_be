require("module-alias/register");

const { getSongs } = require("@controllers/SongsController");
const { uploadBulk } = require("@controllers/UploadBulkController");

module.exports = {
  uploadBulk,
  getSongs,
};
