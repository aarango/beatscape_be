require("module-alias/register");

const { editsongs } = require("@controllers/EditSongController");
const { getSongs } = require("@controllers/SongsController");
const { uploadBulk } = require("@controllers/UploadBulkController");
const { createUser } = require("@controllers/CreateUserController");
const { updateCalendar } = require("@controllers/UpdateCalendarController");
const {
  updateCalendarByUser,
} = require("@controllers/UpdateCalendarByUserController");
const { updateStatusByUser } = require("@controllers/updateStatusByUser");
const { updateStatusClients } = require("@controllers/updateStatusClients");
const { updateUser } = require("@controllers/updateUserController");

module.exports = {
  uploadBulk,
  getSongs,
  editsongs,
  createUser,
  updateCalendar,
  updateCalendarByUser,
  updateStatusByUser,
  updateStatusClients,
  updateUser,
};
