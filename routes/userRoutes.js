const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  getData,
  getCurrentUserData,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/auth", authUser);
router.route('/GetUserData').get(getData)
router.route('/GetCurrentUserData/:id').get(getCurrentUserData)

module.exports = router;
