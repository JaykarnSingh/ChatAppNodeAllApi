const express = require("express");
const {
    postClinic,
    getClinicData
} =  require('../controllers/clinicController');
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/postClinic").post(protect, postClinic);
router.route("/GetClinicData").get(protect, getClinicData);
module.exports = router;