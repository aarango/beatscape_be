require("module-alias/register");

const { editsongs } = require("@controllers/EditSongController");
const { getSongs } = require("@controllers/SongsController");
const { uploadBulk } = require("@controllers/UploadBulkController");
const { createUser } = require("@controllers/CreateUserController");

module.exports = {
  uploadBulk,
  getSongs,
  editsongs,
  createUser,
};
