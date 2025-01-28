require("module-alias/register");

const { editsongs } = require("@controllers/EditSongController");
const { getSongs } = require("@controllers/SongsController");
const { uploadBulk } = require("@controllers/UploadBulkController");

module.exports = {
  uploadBulk,
  getSongs,
  editsongs,
};
